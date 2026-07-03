// Build 202 — Admin API for CAIP intelligence, safe media probes, derivative plans, and secure review grants.
import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import {
  CAIP_BUILD,
  approveCreativeProject,
  ensureCreativeAssetIntelligenceSchema,
  getCreativeProjectDetail,
  listCreativeAssetProjects,
  makeCreativeAssetManifest,
  syncCreativeProjectFromContentProject,
  updateCreativeAsset,
  updateCreativeStoryEvidence,
  updateCreativeStorySegment
} from '../_lib/creativeAssetIntelligence.js';
import {
  CAIP_OPERATIONS_BUILD,
  approveDerivativePlan,
  createDerivativePlan,
  createSecureReviewGrant,
  ensureCreativeAssetOperationsSchema,
  loadCreativeAssetOperations,
  makeCreativeOperationsManifest,
  probeCreativeAsset,
  revokeSecureReviewGrant
} from '../_lib/creativeAssetOperations.js';

function json(data, status = 200, headers = {}) { return jsonResponse(data, status, { 'Cache-Control': 'no-store', ...headers }); }
function number(value) { const parsed = Number(value || 0); return Number.isInteger(parsed) && parsed > 0 ? parsed : 0; }

async function access(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { error: json({ ok: false, error: 'Admin access required.' }, 401) };
  const db = getDb(context.env);
  if (!db) return { error: json({ ok: false, error: 'Database binding is not configured.' }, 500) };
  return { adminUser, db };
}

async function detailBundle(db, creativeProjectId) {
  const detail = creativeProjectId ? await getCreativeProjectDetail(db, creativeProjectId) : null;
  const operations = detail ? await loadCreativeAssetOperations(db, detail.project.creative_project_id) : null;
  return { detail, operations };
}

export async function onRequestGet(context) {
  const state = await access(context);
  if (state.error) return state.error;
  const params = new URL(context.request.url).searchParams;
  const requestedCreativeProjectId = number(params.get('creative_project_id') || params.get('project_id'));
  const requestedProductId = number(params.get('product_id'));
  try {
    await ensureCreativeAssetIntelligenceSchema(state.db);
    await ensureCreativeAssetOperationsSchema(state.db);
    const listing = await listCreativeAssetProjects(state.db);
    const resolvedCreativeProjectId = requestedCreativeProjectId || number((Array.isArray(listing.projects) ? listing.projects : []).find((project) => number(project.product_id) === requestedProductId)?.creative_project_id);
    const { detail, operations } = await detailBundle(state.db, resolvedCreativeProjectId);
    if (requestedCreativeProjectId && !detail) return json({ ok: false, error: 'CAIP project not found.' }, 404);
    return json({ ok: true, build: `${CAIP_BUILD} + ${CAIP_OPERATIONS_BUILD}`, ...listing, detail, operations, requested_product_id: requestedProductId || null, resolved_creative_project_id: resolvedCreativeProjectId || null, mode: 'reference_only_review_first' });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'creative_asset_intelligence', incident_code: 'caip_get_failed', severity: 'error',
      message: error?.message || 'CAIP could not load.', related_user_id: state.adminUser.user_id,
      details: { error: String(error?.stack || error?.message || error) }
    });
    return json({ ok: false, error: 'CAIP could not load. Confirm Builds 199–202 and Cloudflare logs.' }, 500);
  }
}

export async function onRequestPost(context) {
  const state = await access(context);
  if (state.error) return state.error;
  let body = {};
  try { body = await context.request.json(); } catch {}
  const action = normalizeText(body.action).toLowerCase();
  let creativeProjectId = number(body.creative_project_id || body.project_id);
  const contentProjectId = number(body.content_project_id);
  try {
    await ensureCreativeAssetIntelligenceSchema(state.db);
    await ensureCreativeAssetOperationsSchema(state.db);
    let detail = null;
    let operations = null;
    let result = {};
    if (action === 'sync_project') {
      if (!contentProjectId) throw new Error('Choose a Content Studio project first.');
      result = await syncCreativeProjectFromContentProject(state.db, contentProjectId, state.adminUser.user_id, { trigger: 'caip_console' });
      creativeProjectId = number(result?.project?.creative_project_id);
    } else if (action === 'update_asset') {
      if (!creativeProjectId || !number(body.creative_asset_id)) throw new Error('CAIP project and asset are required.');
      detail = await updateCreativeAsset(state.db, creativeProjectId, number(body.creative_asset_id), body, state.adminUser.user_id);
      result = { creative_project_id: creativeProjectId, creative_asset_id: number(body.creative_asset_id) };
    } else if (action === 'update_evidence') {
      if (!creativeProjectId || !number(body.creative_story_evidence_id)) throw new Error('CAIP project and story evidence are required.');
      detail = await updateCreativeStoryEvidence(state.db, creativeProjectId, number(body.creative_story_evidence_id), body, state.adminUser.user_id);
      result = { creative_project_id: creativeProjectId, creative_story_evidence_id: number(body.creative_story_evidence_id) };
    } else if (action === 'update_segment') {
      if (!creativeProjectId || !number(body.creative_story_segment_id)) throw new Error('CAIP project and story segment are required.');
      detail = await updateCreativeStorySegment(state.db, creativeProjectId, number(body.creative_story_segment_id), body, state.adminUser.user_id);
      result = { creative_project_id: creativeProjectId, creative_story_segment_id: number(body.creative_story_segment_id) };
    } else if (action === 'approve_internal_project') {
      if (!creativeProjectId) throw new Error('CAIP project is required.');
      detail = await approveCreativeProject(state.db, creativeProjectId, state.adminUser.user_id);
      result = { creative_project_id: creativeProjectId };
    } else if (action === 'probe_asset') {
      if (!creativeProjectId || !number(body.creative_asset_id)) throw new Error('CAIP project and asset are required.');
      result = await probeCreativeAsset(state.db, context.env, creativeProjectId, number(body.creative_asset_id), state.adminUser.user_id);
    } else if (action === 'create_derivative_plan') {
      if (!creativeProjectId || !number(body.creative_asset_id)) throw new Error('CAIP project and asset are required.');
      result = await createDerivativePlan(state.db, creativeProjectId, number(body.creative_asset_id), body.template_key, state.adminUser.user_id);
    } else if (action === 'approve_derivative_plan') {
      if (!creativeProjectId || !number(body.creative_asset_derivative_id)) throw new Error('CAIP project and derivative plan are required.');
      result = await approveDerivativePlan(state.db, creativeProjectId, number(body.creative_asset_derivative_id), state.adminUser.user_id);
    } else if (action === 'create_secure_review_link') {
      if (!creativeProjectId || !number(body.creative_asset_id)) throw new Error('CAIP project and asset are required.');
      result = await createSecureReviewGrant(state.db, creativeProjectId, number(body.creative_asset_id), state.adminUser.user_id, body);
    } else if (action === 'revoke_secure_review_link') {
      if (!creativeProjectId || !number(body.creative_asset_access_grant_id)) throw new Error('CAIP project and secure review grant are required.');
      result = await revokeSecureReviewGrant(state.db, creativeProjectId, number(body.creative_asset_access_grant_id), state.adminUser.user_id);
    } else if (action === 'manifest') {
      if (!creativeProjectId) throw new Error('CAIP project is required.');
      detail = await getCreativeProjectDetail(state.db, creativeProjectId);
      if (!detail) throw new Error('CAIP project not found.');
      operations = await loadCreativeAssetOperations(state.db, detail.project.creative_project_id);
      const manifest = makeCreativeAssetManifest(detail);
      manifest.media_operations = makeCreativeOperationsManifest(operations);
      return new Response(JSON.stringify(manifest, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${detail.project.creative_project_key || 'caip-project'}-manifest.json"`,
          'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'
        }
      });
    } else {
      throw new Error('Unsupported CAIP action.');
    }
    creativeProjectId = creativeProjectId || number(result?.project?.creative_project_id) || number(result?.asset?.creative_project_id);
    if (!detail && creativeProjectId) ({ detail, operations } = await detailBundle(state.db, creativeProjectId));
    else if (detail) operations = await loadCreativeAssetOperations(state.db, detail.project.creative_project_id);
    await auditAdminAction(context.env, context.request, state.adminUser, {
      action_type: `caip_${action}`, target_type: 'creative_project',
      target_id: creativeProjectId || detail?.project?.creative_project_id || null,
      target_key: detail?.project?.creative_project_key || result?.project?.creative_project_key || null,
      details: {
        action, content_project_id: contentProjectId || result.content_project_id || null,
        creative_asset_id: number(body.creative_asset_id) || null,
        derivative_id: number(body.creative_asset_derivative_id) || null,
        secure_review_grant_id: number(body.creative_asset_access_grant_id) || result?.grant?.creative_asset_access_grant_id || null,
        source_media_unchanged: true, ...result
      }
    });
    const listing = await listCreativeAssetProjects(state.db);
    return json({ ok: true, message: 'CAIP saved. Source media remains reference-only and unchanged.', build: `${CAIP_BUILD} + ${CAIP_OPERATIONS_BUILD}`, result, detail, operations, ...listing, mode: 'reference_only_review_first' });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'creative_asset_intelligence', incident_code: 'caip_post_failed', severity: 'warning',
      message: error?.message || 'CAIP could not save.', related_user_id: state.adminUser.user_id,
      details: { action, creative_project_id: creativeProjectId || null, content_project_id: contentProjectId || null, error: String(error?.stack || error?.message || error) }
    });
    return json({ ok: false, error: error?.message || 'CAIP could not save.' }, 400);
  }
}
