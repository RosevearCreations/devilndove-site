// Build 201 — Admin API for Creative Asset Intelligence Platform (CAIP).
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

function json(data, status = 200, headers = {}) { return jsonResponse(data, status, { 'Cache-Control': 'no-store', ...headers }); }
function number(value) { const parsed = Number(value || 0); return Number.isInteger(parsed) && parsed > 0 ? parsed : 0; }

async function access(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { error: json({ ok: false, error: 'Admin access required.' }, 401) };
  const db = getDb(context.env);
  if (!db) return { error: json({ ok: false, error: 'Database binding is not configured.' }, 500) };
  return { adminUser, db };
}

export async function onRequestGet(context) {
  const state = await access(context);
  if (state.error) return state.error;
  const creativeProjectId = number(new URL(context.request.url).searchParams.get('creative_project_id') || new URL(context.request.url).searchParams.get('project_id'));
  try {
    await ensureCreativeAssetIntelligenceSchema(state.db);
    const listing = await listCreativeAssetProjects(state.db);
    const detail = creativeProjectId ? await getCreativeProjectDetail(state.db, creativeProjectId) : null;
    if (creativeProjectId && !detail) return json({ ok: false, error: 'CAIP project not found.' }, 404);
    return json({ ok: true, build: CAIP_BUILD, ...listing, detail, mode: 'reference_only_review_first' });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'creative_asset_intelligence', incident_code: 'caip_get_failed', severity: 'error',
      message: error?.message || 'CAIP could not load.', related_user_id: state.adminUser.user_id,
      details: { error: String(error?.stack || error?.message || error) }
    });
    return json({ ok: false, error: 'CAIP could not load. Confirm Builds 199–201 and Cloudflare logs.' }, 500);
  }
}

export async function onRequestPost(context) {
  const state = await access(context);
  if (state.error) return state.error;
  let body = {};
  try { body = await context.request.json(); } catch {}
  const action = normalizeText(body.action).toLowerCase();
  const creativeProjectId = number(body.creative_project_id || body.project_id);
  const contentProjectId = number(body.content_project_id);
  try {
    await ensureCreativeAssetIntelligenceSchema(state.db);
    let detail = null;
    let result = {};
    if (action === 'sync_project') {
      if (!contentProjectId) throw new Error('Choose a Content Studio project first.');
      result = await syncCreativeProjectFromContentProject(state.db, contentProjectId, state.adminUser.user_id, { trigger: 'caip_console' });
      detail = await getCreativeProjectDetail(state.db, result.project.creative_project_id);
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
    } else if (action === 'manifest') {
      if (!creativeProjectId) throw new Error('CAIP project is required.');
      detail = await getCreativeProjectDetail(state.db, creativeProjectId);
      if (!detail) throw new Error('CAIP project not found.');
      return new Response(JSON.stringify(makeCreativeAssetManifest(detail), null, 2), {
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
    await auditAdminAction(context.env, context.request, state.adminUser, {
      action_type: `caip_${action}`, target_type: 'creative_project',
      target_id: result.creative_project_id || detail?.project?.creative_project_id || creativeProjectId || null,
      target_key: detail?.project?.creative_project_key || result?.project?.creative_project_key || null,
      details: { action, content_project_id: contentProjectId || result.content_project_id || null, ...result }
    });
    const listing = await listCreativeAssetProjects(state.db);
    return json({ ok: true, message: 'CAIP saved. Source media remains reference-only.', build: CAIP_BUILD, result, detail, ...listing, mode: 'reference_only_review_first' });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'creative_asset_intelligence', incident_code: 'caip_post_failed', severity: 'warning',
      message: error?.message || 'CAIP could not save.', related_user_id: state.adminUser.user_id,
      details: { action, creative_project_id: creativeProjectId || null, content_project_id: contentProjectId || null, error: String(error?.stack || error?.message || error) }
    });
    return json({ ok: false, error: error?.message || 'CAIP could not save.' }, 400);
  }
}
