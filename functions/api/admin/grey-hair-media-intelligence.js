// Release 467 Build 45 — Grey Hair Media Intelligence.
// Read-only convergence over existing private CAIP media/evidence authorities.
// No provider execution, publication, R2 mutation, request-time DDL, camera sync or story editing.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { getCaipEvidenceReviewReadiness, loadCaipEvidenceReviewBundle } from '../_lib/caipEvidenceReview.js';

const RELEASE = 467;
const BUILD = 45;
const TITLE = 'Grey Hair Media Intelligence';
const VERIFIED_ARTIFACTS = new Set(['head_verified', 'checksum_verified']);
const APPROVED = 'approved';

const integer = (value) => {
  const parsed = Number(value || 0);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
};
const text = (value) => normalizeText(value);
const lower = (value) => text(value).toLowerCase();
const rows = (result) => Array.isArray(result?.results) ? result.results : [];

function isGreyHairProject(row) {
  const haystack = `${row?.creative_project_key || ''} ${row?.project_title || ''}`.toLowerCase();
  return /\bgr[ae]y\b/.test(haystack) && /\bhair\b/.test(haystack);
}

async function projectOptions(db) {
  const result = await db.prepare(`
    SELECT creative_project_id,creative_project_key,project_title,project_status,governance_status,updated_at
    FROM creative_projects
    ORDER BY updated_at DESC,creative_project_id DESC
    LIMIT 200
  `).all();
  const all = rows(result);
  const grey = all.filter(isGreyHairProject);
  return grey.length ? grey : all.filter((row) => lower(row.project_status) !== 'archived').slice(0, 40);
}

function markerMap(markers = []) {
  const map = new Map();
  for (const marker of markers) {
    if (lower(marker.marker_status) === 'archived') continue;
    const assetId = integer(marker.creative_asset_id);
    if (!assetId) continue;
    if (!map.has(assetId)) map.set(assetId, []);
    map.get(assetId).push(marker);
  }
  return map;
}

function artifactMap(processing = {}) {
  const map = new Map();
  for (const artifact of processing.artifacts || []) {
    const assetId = integer(artifact.creative_asset_id);
    if (!assetId) continue;
    if (!map.has(assetId)) map.set(assetId, []);
    map.get(assetId).push(artifact);
  }
  return map;
}

function coverageScore(asset, markers, artifacts) {
  let score = 0;
  const reasons = [];
  if (asset.private_object) { score += 20; reasons.push('private_source'); }
  else reasons.push('private_source_unproven');
  if (Number(asset.duration_seconds || 0) > 0) { score += 15; reasons.push('duration_observed'); }
  if (Number(asset.observed_width_px || 0) > 0 || lower(asset.media_type) === 'audio') { score += 10; reasons.push('technical_dimensions_observed'); }
  if (markers.length) { score += 20; reasons.push('temporal_evidence_present'); }
  if (markers.some((row) => text(row.transcript_excerpt))) { score += 10; reasons.push('transcript_evidence_present'); }
  if (markers.some((row) => lower(row.review_status) === APPROVED)) { score += 15; reasons.push('reviewed_evidence_present'); }
  if (artifacts.some((row) => VERIFIED_ARTIFACTS.has(lower(row.verification_status)))) { score += 10; reasons.push('verified_processing_artifact'); }
  return { score: Math.min(100, score), reasons };
}

function assetIntelligence(asset, markers, artifacts) {
  const categories = [...new Set(markers.map((row) => lower(row.evidence_category)).filter(Boolean))];
  const approved = markers.filter((row) => lower(row.review_status) === APPROVED);
  const transcript = markers.filter((row) => text(row.transcript_excerpt));
  const verifiedArtifacts = artifacts.filter((row) => VERIFIED_ARTIFACTS.has(lower(row.verification_status)));
  const coverage = coverageScore(asset, markers, artifacts);
  let readiness = 'needs_review';
  if (!asset.private_object) readiness = 'blocked_private_source_unproven';
  else if (!markers.length) readiness = 'needs_evidence';
  else if (!approved.length) readiness = 'needs_review';
  else if (coverage.score >= 70) readiness = 'intelligence_ready';
  return {
    creative_asset_id: integer(asset.creative_asset_id),
    asset_key: text(asset.asset_key),
    filename: text(asset.original_filename),
    media_type: lower(asset.media_type),
    mime_type: text(asset.mime_type),
    privacy_state: text(asset.privacy_state),
    consent_state: text(asset.consent_state),
    private_object: Boolean(asset.private_object),
    duration_seconds: Number(asset.duration_seconds || 0) || null,
    width_px: Number(asset.observed_width_px || 0) || null,
    height_px: Number(asset.observed_height_px || 0) || null,
    evidence_marker_count: markers.length,
    approved_marker_count: approved.length,
    transcript_excerpt_count: transcript.length,
    evidence_categories: categories,
    verified_artifact_count: verifiedArtifacts.length,
    coverage_score: coverage.score,
    coverage_reasons: coverage.reasons,
    readiness,
    build46_sync_ready_input: readiness === 'intelligence_ready',
    build47_story_ready_input: approved.length > 0 && transcript.length > 0,
  };
}

function summary(assets) {
  const count = assets.length;
  const ready = assets.filter((row) => row.readiness === 'intelligence_ready').length;
  return {
    asset_count: count,
    private_asset_count: assets.filter((row) => row.private_object).length,
    video_count: assets.filter((row) => row.media_type === 'video').length,
    audio_count: assets.filter((row) => row.media_type === 'audio').length,
    evidence_ready_count: ready,
    transcript_covered_count: assets.filter((row) => row.transcript_excerpt_count > 0).length,
    reviewed_evidence_count: assets.filter((row) => row.approved_marker_count > 0).length,
    verified_artifact_asset_count: assets.filter((row) => row.verified_artifact_count > 0).length,
    intelligence_coverage_percent: count ? Math.round(assets.reduce((sum, row) => sum + row.coverage_score, 0) / count) : 0,
  };
}

export async function onRequestGet(context) {
  const admin = await getAdminUserFromRequest(context.request, context.env);
  if (!admin) return jsonResponse({ ok: false, release: RELEASE, build: BUILD, error: 'Admin access required.' }, 401, { 'Cache-Control': 'no-store' });
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, release: RELEASE, build: BUILD, error: 'Database binding is not configured.' }, 503, { 'Cache-Control': 'no-store' });

  const url = new URL(context.request.url);
  const requestedId = integer(url.searchParams.get('creative_project_id') || url.searchParams.get('project_id'));
  const projects = await projectOptions(db);
  const selected = requestedId ? projects.find((row) => integer(row.creative_project_id) === requestedId) : projects[0];
  const readiness = await getCaipEvidenceReviewReadiness(db);

  if (!selected) {
    return jsonResponse({
      ok: true, release: RELEASE, build: BUILD, title: TITLE,
      creative_project_id: null, projects: [], schema_ready: readiness.schema_ready,
      missing_tables: readiness.missing_tables || [], assets: [], summary: summary([]),
      policy: { private_media_only: true, source_originals_immutable: true, provider_execution: false, publication: false, build46_camera_sync: false, build47_story_editing: false, request_time_ddl: false, r2_mutation: false, production_contacted: false },
    }, 200, { 'Cache-Control': 'no-store' });
  }

  if (!readiness.schema_ready) {
    return jsonResponse({
      ok: false, release: RELEASE, build: BUILD, title: TITLE, schema_ready: false,
      creative_project_id: integer(selected.creative_project_id), projects,
      missing_tables: readiness.missing_tables || [],
      error: 'Existing CAIP temporal-evidence authority is incomplete. Build 45 fails closed and does not create schema at request time.',
      required_repair: 'Use the canonical Development migration process if a forward schema repair is approved.',
      policy: { request_time_ddl: false, provider_execution: false, publication: false, r2_mutation: false, production_contacted: false },
    }, 409, { 'Cache-Control': 'no-store' });
  }

  const bundle = await loadCaipEvidenceReviewBundle(db, integer(selected.creative_project_id));
  const markers = markerMap(bundle.markers || []);
  const artifacts = artifactMap(bundle.processing || {});
  const intelligence = (bundle.assets || [])
    .filter((asset) => ['video', 'audio'].includes(lower(asset.media_type)))
    .map((asset) => assetIntelligence(asset, markers.get(integer(asset.creative_asset_id)) || [], artifacts.get(integer(asset.creative_asset_id)) || []));

  return jsonResponse({
    ok: true,
    release: RELEASE,
    build: BUILD,
    title: TITLE,
    state: 'PRIVATE_READ_ONLY_INTELLIGENCE',
    schema_ready: true,
    creative_project_id: integer(selected.creative_project_id),
    project: bundle.project,
    projects,
    summary: summary(intelligence),
    assets: intelligence,
    evidence_categories: [...new Set(intelligence.flatMap((row) => row.evidence_categories))].sort(),
    downstream_contract: {
      build46: 'Consumes intelligence-ready media metadata only; Build 45 performs no camera synchronization or audio alignment.',
      build47: 'Consumes reviewed evidence/transcript coverage only; Build 45 performs no story selection, edit planning, script generation or publication.',
    },
    policy: {
      private_media_only: true,
      source_originals_immutable: true,
      signed_or_authenticated_review_required: true,
      public_raw_r2_urls: false,
      provider_execution: false,
      provider_publication: false,
      build46_camera_sync: false,
      build46_audio_alignment: false,
      build47_story_editing: false,
      build47_script_generation: false,
      request_time_ddl: false,
      schema_change: false,
      r2_mutation: false,
      main_mutation: false,
      production_contacted: false,
    },
    generated_at: new Date().toISOString(),
  }, 200, { 'Cache-Control': 'no-store' });
}
