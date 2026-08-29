// Devil n Dove Release 448 — authenticated CAIP temporal evidence-review API.
// The temporal-evidence authority originated in historical Build 439; that number is provenance only.
import {
  auditAdminAction,
  captureRuntimeIncident,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText,
} from '../_lib/adminAudit.js';
import { updateCreativeStoryEvidence } from '../_lib/creativeAssetIntelligence.js';
import {
  CAIP_EVIDENCE_REVIEW_BUILD,
  archiveTemporalEvidenceMarker,
  buildEvidenceReviewManifest,
  completeVerifiedProcessingJob,
  draftStorySegmentFromMarkers,
  getCaipEvidenceReviewReadiness,
  loadCaipEvidenceReviewBundle,
  promoteMarkerToStoryEvidence,
  registerProcessingArtifact,
  saveTemporalEvidenceMarker,
  verifyProcessingArtifact,
} from '../_lib/caipEvidenceReview.js';

const RELEASE = 448;
function json(data, status = 200) {
  return jsonResponse({ release: RELEASE, ...data }, status, { 'Cache-Control': 'no-store' });
}
function integer(value) {
  const parsed = Number(value || 0);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function boundedBodyLength(request) {
  const value = Number(request.headers.get('Content-Length') || 0);
  return Number.isFinite(value) ? value : 0;
}
function errorCode(error, action = '') {
  const message = String(error?.message || error || '').toLowerCase();
  if (message.includes('short evidence title')) return 'CAIP_EVIDENCE_TITLE_REQUIRED';
  if (message.includes('belongs to this caip project')) return 'CAIP_EVIDENCE_ASSET_PROJECT_MISMATCH';
  if (message.includes('video or audio')) return 'CAIP_EVIDENCE_TEMPORAL_ASSET_REQUIRED';
  if (message.includes('beyond the recorded media duration')) return 'CAIP_EVIDENCE_TIME_OUT_OF_RANGE';
  if (message.includes('range end')) return 'CAIP_EVIDENCE_RANGE_INVALID';
  if (message.includes('temporal evidence marker was not found')) return 'CAIP_EVIDENCE_MARKER_NOT_FOUND';
  if (message.includes('approve the temporal evidence')) return 'CAIP_EVIDENCE_MARKER_APPROVAL_REQUIRED';
  if (message.includes('story evidence')) return 'CAIP_EVIDENCE_STORY_REVIEW_REQUIRED';
  if (message.includes('foreign key constraint')) return 'CAIP_EVIDENCE_LINKAGE_CONSTRAINT';
  if (action === 'save_marker') return 'CAIP_EVIDENCE_SAVE_FAILED';
  return 'CAIP_EVIDENCE_ACTION_FAILED';
}

async function access(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { error: json({ ok: false, error: 'Admin access required.' }, 401) };
  const db = getDb(context.env);
  if (!db) return { error: json({ ok: false, error: 'Database binding is not configured.' }, 500) };
  return { adminUser, db };
}

async function projectOptions(db) {
  try {
    return rows(await db.prepare(`
      SELECT cp.creative_project_id,cp.creative_project_key,cp.project_title,cp.project_status,cp.governance_status,
             cp.product_id,p.name AS product_name,
             (SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=cp.creative_project_id AND ca.asset_status<>'archived') AS asset_count,
             (SELECT COUNT(*) FROM creative_assets ca WHERE ca.creative_project_id=cp.creative_project_id AND ca.asset_status<>'archived' AND ca.media_type IN ('video','audio')) AS temporal_asset_count
      FROM creative_projects cp
      LEFT JOIN products p ON p.product_id=cp.product_id
      ORDER BY cp.updated_at DESC,cp.creative_project_id DESC
      LIMIT 120
    `).all());
  } catch { return []; }
}

function readinessResponse(readiness, projectId, status = 409) {
  return json({
    ok: false,
    schema_ready: false,
    source: 'migration_required',
    creative_project_id: projectId || null,
    missing_tables: readiness.missing_tables || [],
    required_authority: 'CAIP temporal evidence schema',
    provenance_build: CAIP_EVIDENCE_REVIEW_BUILD,
    provenance_migration: 'database_build439_caip_temporal_evidence_review.sql',
    source_media_unchanged: true,
    provider_execution_active: false,
    message: 'Release 448 requires the established CAIP temporal-evidence authority. Existing CAIP remains available, but evidence-review writes are blocked until the missing tables are restored through the current Development migration process.',
  }, status);
}

async function canonicalUploadFileId(db, projectId, assetId) {
  if (!projectId || !assetId) return null;
  try {
    const row = await db.prepare(`
      SELECT caip_media_upload_file_id
      FROM caip_media_upload_files
      WHERE creative_project_id=? AND creative_asset_id=?
        AND upload_status='uploaded'
      ORDER BY COALESCE(uploaded_at,updated_at,created_at) DESC,caip_media_upload_file_id DESC
      LIMIT 1
    `).bind(integer(projectId), integer(assetId)).first();
    return integer(row?.caip_media_upload_file_id) || null;
  } catch {
    return null;
  }
}

function dedupeBundleAssets(bundle) {
  if (!bundle || !Array.isArray(bundle.assets)) return bundle;
  const best = new Map();
  for (const asset of bundle.assets) {
    const id = integer(asset?.creative_asset_id);
    if (!id) continue;
    const current = best.get(id);
    const score = (row) => {
      let value = 0;
      if (String(row?.upload_status || '').toLowerCase() === 'uploaded') value += 1000000000;
      value += integer(row?.caip_media_upload_file_id);
      return value;
    };
    if (!current || score(asset) > score(current)) best.set(id, asset);
  }
  return { ...bundle, assets: Array.from(best.values()) };
}

async function canonicalizeMarkerBody(db, projectId, body) {
  if (normalizeText(body.action).toLowerCase() !== 'save_marker') return body;
  const assetId = integer(body.creative_asset_id);
  if (!assetId) return body;
  const canonicalId = await canonicalUploadFileId(db, projectId, assetId);
  return { ...body, caip_media_upload_file_id: canonicalId };
}

export async function onRequestGet(context) {
  const state = await access(context);
  if (state.error) return state.error;
  const url = new URL(context.request.url);
  const projectId = integer(url.searchParams.get('creative_project_id') || url.searchParams.get('project_id'));
  try {
    const readiness = await getCaipEvidenceReviewReadiness(state.db);
    const projects = await projectOptions(state.db);
    if (!projectId) {
      return json({
        ok: true,
        schema_ready: readiness.schema_ready,
        missing_tables: readiness.missing_tables,
        provenance_build: CAIP_EVIDENCE_REVIEW_BUILD,
        creative_project_id: null,
        projects,
        source_media_unchanged: true,
        provider_execution_active: false,
      });
    }
    const bundle = dedupeBundleAssets(await loadCaipEvidenceReviewBundle(state.db, projectId));
    if (!bundle.project) return json({ ok: false, error: 'CAIP project not found.' }, 404);
    return json({ ok: true, provenance_build: CAIP_EVIDENCE_REVIEW_BUILD, projects, ...bundle });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'caip_evidence_review',
      incident_code: 'caip_evidence_review_get_failed',
      severity: 'warning',
      message: error?.message || 'CAIP evidence review could not load.',
      related_user_id: state.adminUser.user_id,
      details: { release: RELEASE, provenance_build: CAIP_EVIDENCE_REVIEW_BUILD, creative_project_id: projectId || null, error: String(error?.stack || error) },
    });
    return json({ ok: false, error: error?.message || 'CAIP evidence review could not load.' }, 503);
  }
}

export async function onRequestPost(context) {
  const state = await access(context);
  if (state.error) return state.error;
  if (boundedBodyLength(context.request) > 262144) return json({ ok: false, error: 'CAIP evidence-review request body is too large.' }, 413);
  let body = {};
  try { body = await context.request.json(); } catch { return json({ ok: false, error: 'Expected a JSON request body.' }, 400); }
  const action = normalizeText(body.action).toLowerCase();
  const projectId = integer(body.creative_project_id || body.project_id);
  if (!projectId) return json({ ok: false, error: 'Choose a CAIP project first.', error_code: 'CAIP_EVIDENCE_PROJECT_REQUIRED', action }, 400);

  try {
    const readiness = await getCaipEvidenceReviewReadiness(state.db);
    if (!readiness.schema_ready) return readinessResponse(readiness, projectId, 409);

    body = await canonicalizeMarkerBody(state.db, projectId, body);
    let result = null;
    if (action === 'save_marker') {
      result = await saveTemporalEvidenceMarker(state.db, projectId, body, state.adminUser.user_id);
    } else if (action === 'archive_marker') {
      result = await archiveTemporalEvidenceMarker(state.db, projectId, body.creative_media_evidence_range_id, state.adminUser.user_id);
    } else if (action === 'promote_marker') {
      result = await promoteMarkerToStoryEvidence(state.db, projectId, body.creative_media_evidence_range_id, state.adminUser.user_id);
    } else if (action === 'review_story_evidence') {
      const evidenceId = integer(body.creative_story_evidence_id);
      if (!evidenceId) throw new Error('Choose linked story evidence first.');
      result = await updateCreativeStoryEvidence(state.db, projectId, evidenceId, { review_status: body.review_status }, state.adminUser.user_id);
    } else if (action === 'draft_story_segment') {
      result = await draftStorySegmentFromMarkers(state.db, projectId, body.marker_ids, body, state.adminUser.user_id);
    } else if (action === 'register_processing_artifact') {
      result = await registerProcessingArtifact(state.db, projectId, body, state.adminUser.user_id);
    } else if (action === 'verify_processing_artifact') {
      result = await verifyProcessingArtifact(state.db, context.env, projectId, body.caip_media_processing_artifact_id, state.adminUser.user_id);
    } else if (action === 'complete_processing_job') {
      result = await completeVerifiedProcessingJob(state.db, projectId, body.caip_media_processing_job_id, state.adminUser.user_id);
    } else if (action === 'manifest') {
      const bundle = dedupeBundleAssets(await loadCaipEvidenceReviewBundle(state.db, projectId));
      if (!bundle.project) return json({ ok: false, error: 'CAIP project not found.' }, 404);
      const manifest = { release: RELEASE, provenance_build: CAIP_EVIDENCE_REVIEW_BUILD, ...buildEvidenceReviewManifest(bundle) };
      return new Response(JSON.stringify(manifest, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${bundle.project.creative_project_key || 'caip-project'}-temporal-evidence.json"`,
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
          'X-DND-Release': String(RELEASE),
        },
      });
    } else {
      return json({ ok: false, error: 'Unsupported Release 448 CAIP evidence-review action.', error_code: 'CAIP_EVIDENCE_ACTION_UNSUPPORTED', action }, 400);
    }

    await auditAdminAction(context.env, context.request, state.adminUser, {
      action_type: `caip_evidence_${action}`,
      target_type: 'creative_project',
      target_id: projectId,
      target_key: null,
      details: {
        release: RELEASE,
        provenance_build: CAIP_EVIDENCE_REVIEW_BUILD,
        action,
        creative_asset_id: integer(body.creative_asset_id) || null,
        caip_media_upload_file_id: integer(body.caip_media_upload_file_id) || null,
        temporal_marker_id: integer(body.creative_media_evidence_range_id) || null,
        story_evidence_id: integer(body.creative_story_evidence_id) || null,
        processing_job_id: integer(body.caip_media_processing_job_id) || null,
        processing_artifact_id: integer(body.caip_media_processing_artifact_id) || null,
        source_media_unchanged: true,
        provider_execution_active: false,
      },
    });

    const bundle = dedupeBundleAssets(await loadCaipEvidenceReviewBundle(state.db, projectId));
    return json({
      ok: true,
      provenance_build: CAIP_EVIDENCE_REVIEW_BUILD,
      message: 'Release 448 CAIP evidence review saved. Source originals remain unchanged and no content was published.',
      result,
      projects: await projectOptions(state.db),
      ...bundle,
    });
  } catch (error) {
    const code = errorCode(error, action);
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'caip_evidence_review',
      incident_code: 'caip_evidence_review_post_failed',
      severity: 'warning',
      message: error?.message || 'CAIP evidence review could not save.',
      related_user_id: state.adminUser.user_id,
      details: { release: RELEASE, provenance_build: CAIP_EVIDENCE_REVIEW_BUILD, action, creative_project_id: projectId, error_code: code, error: String(error?.stack || error) },
    });
    return json({
      ok: false,
      provenance_build: CAIP_EVIDENCE_REVIEW_BUILD,
      error: error?.message || 'CAIP evidence review could not save.',
      error_code: code,
      action,
      creative_project_id: projectId,
      creative_asset_id: integer(body.creative_asset_id) || null,
      source_media_unchanged: true,
      provider_execution_active: false,
    }, 400);
  }
}