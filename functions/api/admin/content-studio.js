// Release 448 — Content Studio uses the owned non-mutating read authority and retained mutation services.
// Historical implementation/build constants are provenance only; outward runtime identity is Release 448.
import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import {
  CONTENT_STUDIO_BUILD,
  createOrRefreshContentProjectForProduct,
  createOrRefreshContentProjectForCreativeProject,
  getContentProjectDetail,
  listContentStudioProjects,
  makeContentManifest,
  queueSocialDeliverable,
  updateContentDeliverable,
  updateContentProject,
  updateContentProjectMedia
} from '../_lib/contentAutomationStudio.js';
import { requireContentAutomationSchema } from '../_lib/contentAutomationSchemaReadiness.js';
import { readContentStudio } from '../_lib/contentStudioReadService.js';
import { syncCreativeProjectFromContentProject } from '../_lib/creativeAssetIntelligence.js';

const RELEASE = 448;
function json(data, status = 200, headers = {}) { return jsonResponse({ release: RELEASE, ...data }, status, { 'Cache-Control': 'no-store', ...headers }); }
function number(value) { const parsed = Number(value || 0); return Number.isInteger(parsed) && parsed > 0 ? parsed : 0; }

async function requireAdmin(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { error: json({ ok: false, error: 'Admin access required.' }, 401) };
  const db = getDb(context.env);
  if (!db) return { error: json({ ok: false, error: 'Database binding is not configured.' }, 500) };
  return { adminUser, db };
}

export async function onRequestGet(context) {
  const access = await requireAdmin(context);
  if (access.error) return access.error;
  const { db, adminUser } = access;
  const url = new URL(context.request.url);
  const projectId = number(url.searchParams.get('project_id'));
  const requestedCreativeProjectId = number(url.searchParams.get('creative_project_id') || url.searchParams.get('creative_work_project_id'));
  try {
    const data = await readContentStudio(db, { projectId, creativeProjectId: requestedCreativeProjectId });
    if (data.not_found) return json({ ...data, ok: false, error: 'Content project not found.' }, 404);
    return json({ provenance_build: CONTENT_STUDIO_BUILD, ...data });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'content_automation_studio', incident_code: 'content_studio_get_failed', severity: 'error',
      message: error?.message || 'Content Automation Studio failed to load.', related_user_id: adminUser.user_id,
      details: { release: RELEASE, provenance_build: 355, error: String(error?.stack || error?.message || error), request_time_schema_mutation: false }
    });
    return json({ ok: false, provenance_build: 355, owner: 'content', contract: 'content-studio-read', request_time_schema_mutation: false, error: 'Content Automation Studio could not load right now. Check schema readiness and Cloudflare logs.' }, 500);
  }
}

export async function onRequestPost(context) {
  const access = await requireAdmin(context);
  if (access.error) return access.error;
  const { db, adminUser } = access;
  let body = {};
  try { body = await context.request.json(); } catch { body = {}; }
  const action = normalizeText(body.action).toLowerCase();
  const projectId = number(body.content_project_id || body.project_id);

  try {
    await requireContentAutomationSchema(db);
    let detail = null;
    let result = {};
    if (action === 'create_from_creative_project') {
      const creativeWorkProjectId = number(body.creative_work_project_id || body.creative_project_id);
      if (!creativeWorkProjectId) throw new Error('Choose an existing Creative Process project first. Do not create a duplicate project in Content Studio.');
      const creativeProject = await db.prepare(`SELECT * FROM creative_work_projects WHERE creative_work_project_id=? LIMIT 1`).bind(creativeWorkProjectId).first();
      if (!creativeProject) throw new Error('Creative Process project was not found.');
      const evidenceResult = await db.prepare(`SELECT s.*,e.event_type,e.event_title,e.event_notes,e.media_url,e.material_name,e.material_quantity,e.material_unit,e.material_cost_cents,e.is_public_candidate FROM creative_project_evidence_selections s JOIN creative_work_events e ON e.creative_work_event_id=s.creative_work_event_id WHERE s.creative_work_project_id=? AND s.selected=1 ORDER BY e.occurred_at,e.creative_work_event_id`).bind(creativeWorkProjectId).all();
      const evidenceRows = Array.isArray(evidenceResult?.results) ? evidenceResult.results : [];
      const created = await createOrRefreshContentProjectForCreativeProject(db, creativeProject, evidenceRows, adminUser.user_id, { refresh_copy: Number(body.refresh_copy) === 1 });
      const handoffStatus = evidenceRows.length ? 'ready_for_review' : 'draft';
      const packageJson = JSON.stringify({ release: RELEASE, provenance_build: CONTENT_STUDIO_BUILD, creative_work_project_id: creativeWorkProjectId, project_key: creativeProject.project_key, project_title: creativeProject.project_title, summary: creativeProject.summary || '', objective: creativeProject.objective || '', story_angle: creativeProject.story_angle || '', evidence_count: evidenceRows.length, caip_media_count: Number(created.caip_media_count || 0), content_only: !Number(creativeProject.product_id || 0) });
      const existingHandoff = await db.prepare(`SELECT creative_project_content_handoff_id FROM creative_project_content_handoffs WHERE creative_work_project_id=? AND content_project_id=? ORDER BY creative_project_content_handoff_id DESC LIMIT 1`).bind(creativeWorkProjectId, created.project.content_project_id).first().catch(()=>null);
      if (existingHandoff?.creative_project_content_handoff_id) {
        await db.prepare(`UPDATE creative_project_content_handoffs SET handoff_status=?,evidence_count=?,package_json=? WHERE creative_project_content_handoff_id=?`).bind(handoffStatus,evidenceRows.length,packageJson,existingHandoff.creative_project_content_handoff_id).run();
      } else {
        await db.prepare(`INSERT INTO creative_project_content_handoffs(creative_work_project_id,content_project_id,handoff_status,evidence_count,package_json,created_by,created_at) VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(creativeWorkProjectId,created.project.content_project_id,handoffStatus,evidenceRows.length,packageJson,adminUser.user_id).run();
      }
      result = { content_project_id: created.project.content_project_id, creative_work_project_id: creativeWorkProjectId, creative_project_id: created.caip_creative_project_id || null, archived_count: created.archived_count, deliverables_created: created.deliverables_created, evidence_count: evidenceRows.length, caip_media_count: created.caip_media_count || 0 };
      detail = await getContentProjectDetail(db, created.project.content_project_id);
    } else if (action === 'create_project' || action === 'refresh_archive') {
      const productId = number(body.product_id);
      if (!productId) throw new Error('Choose an approved product first.');
      const created = await createOrRefreshContentProjectForProduct(db, productId, adminUser.user_id, { refresh_copy: action === 'refresh_archive' && Number(body.refresh_copy) === 1 });
      let caip = null;
      try { caip = await syncCreativeProjectFromContentProject(db, created.project.content_project_id, adminUser.user_id, { trigger: 'content_studio_create_or_refresh' }); } catch (caipError) {
        await captureRuntimeIncident(context.env, context.request, {
          incident_scope: 'creative_asset_intelligence', incident_code: 'caip_sync_after_content_studio_failed', severity: 'warning',
          message: caipError?.message || 'CAIP source sync did not complete.', related_user_id: adminUser.user_id,
          details: { release: RELEASE, content_project_id: created.project.content_project_id, error: String(caipError?.stack || caipError?.message || caipError) }
        });
      }
      result = { content_project_id: created.project.content_project_id, archived_count: created.archived_count, deliverables_created: created.deliverables_created, creative_project_id: caip?.project?.creative_project_id || null };
      detail = await getContentProjectDetail(db, created.project.content_project_id);
    } else if (action === 'update_project') {
      if (!projectId) throw new Error('Content project is required.');
      detail = await updateContentProject(db, projectId, body, adminUser.user_id);
      result = { content_project_id: projectId };
    } else if (action === 'update_media') {
      if (!projectId || !number(body.content_project_media_id)) throw new Error('Content project and archive media item are required.');
      detail = await updateContentProjectMedia(db, projectId, number(body.content_project_media_id), body, adminUser.user_id);
      let caip = null;
      if (detail?.project?.source_type === 'creative_project') {
        const archived = await db.prepare(`SELECT source_metadata_json,safety_status FROM content_project_media WHERE content_project_media_id=? LIMIT 1`).bind(number(body.content_project_media_id)).first();
        let metadata = {}; try { metadata = JSON.parse(archived?.source_metadata_json || '{}'); } catch {}
        const caipAssetId = number(metadata.caip_creative_asset_id);
        if (caipAssetId) {
          const safety = String(archived?.safety_status || 'needs_review');
          const rights = safety === 'public_allowed' ? 'public_allowed' : safety === 'blocked' ? 'blocked' : safety === 'internal_only' ? 'internal_only' : 'needs_review';
          await db.prepare(`UPDATE creative_assets SET source_safety_status=?,rights_status=CASE WHEN rights_status='blocked' THEN 'blocked' ELSE ? END,updated_at=CURRENT_TIMESTAMP WHERE creative_asset_id=?`).bind(safety,rights,caipAssetId).run().catch(()=>null);
          const row = await db.prepare(`SELECT creative_project_id FROM creative_assets WHERE creative_asset_id=? LIMIT 1`).bind(caipAssetId).first().catch(()=>null);
          caip = row?.creative_project_id ? { project:{ creative_project_id:Number(row.creative_project_id) } } : null;
        }
      } else {
        try { caip = await syncCreativeProjectFromContentProject(db, projectId, adminUser.user_id, { trigger: 'content_studio_media_review' }); } catch (caipError) {
          await captureRuntimeIncident(context.env, context.request, {
            incident_scope: 'creative_asset_intelligence', incident_code: 'caip_sync_after_media_review_failed', severity: 'warning',
            message: caipError?.message || 'CAIP media sync did not complete.', related_user_id: adminUser.user_id,
            details: { release: RELEASE, content_project_id: projectId, error: String(caipError?.stack || caipError?.message || caipError) }
          });
        }
      }
      result = { content_project_id: projectId, content_project_media_id: number(body.content_project_media_id), creative_project_id: caip?.project?.creative_project_id || null };
    } else if (action === 'update_deliverable') {
      if (!projectId || !number(body.content_project_deliverable_id)) throw new Error('Content project and deliverable are required.');
      detail = await updateContentDeliverable(db, projectId, number(body.content_project_deliverable_id), body, adminUser.user_id);
      result = { content_project_id: projectId, content_project_deliverable_id: number(body.content_project_deliverable_id) };
    } else if (action === 'send_to_social_queue') {
      if (!projectId || !number(body.content_project_deliverable_id)) throw new Error('Content project and deliverable are required.');
      result = await queueSocialDeliverable(db, projectId, number(body.content_project_deliverable_id), adminUser.user_id);
      detail = await getContentProjectDetail(db, projectId);
    } else if (action === 'manifest') {
      if (!projectId) throw new Error('Content project is required.');
      detail = await getContentProjectDetail(db, projectId);
      if (!detail) throw new Error('Content project not found.');
      return new Response(JSON.stringify({ release: RELEASE, provenance_build: CONTENT_STUDIO_BUILD, ...makeContentManifest(detail) }, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${detail.project.content_project_key}-manifest.json"`,
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
          'X-DND-Release': String(RELEASE)
        }
      });
    } else {
      throw new Error('Unsupported Release 448 Content Automation Studio action.');
    }

    await auditAdminAction(context.env, context.request, adminUser, {
      action_type: `content_studio_${action}`,
      target_type: 'content_project',
      target_id: result.content_project_id || projectId || null,
      target_key: detail?.project?.content_project_key || null,
      details: { release: RELEASE, provenance_build: CONTENT_STUDIO_BUILD, action, ...result }
    });
    const listing = await listContentStudioProjects(db);
    return json({ ok: true, message: 'Release 448 Content Automation Studio saved.', provenance_build: CONTENT_STUDIO_BUILD, result, detail, ...listing, mode: 'review_first_no_auto_publish' });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'content_automation_studio', incident_code: 'content_studio_post_failed', severity: 'warning',
      message: error?.message || 'Content Automation Studio could not save.', related_user_id: adminUser.user_id,
      details: { release: RELEASE, provenance_build: CONTENT_STUDIO_BUILD, action, project_id: projectId || null, error: String(error?.stack || error?.message || error) }
    });
    return json({ ok: false, provenance_build: CONTENT_STUDIO_BUILD, error: error?.message || 'Content Automation Studio could not save right now.' }, 400);
  }
}