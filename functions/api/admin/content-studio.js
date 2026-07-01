// Build 199 — admin API for the review-first Content Automation Studio.
import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import {
  CONTENT_STUDIO_BUILD,
  createOrRefreshContentProjectForProduct,
  ensureContentAutomationSchema,
  getContentProjectDetail,
  listContentStudioProjects,
  makeContentManifest,
  queueSocialDeliverable,
  updateContentDeliverable,
  updateContentProject,
  updateContentProjectMedia
} from '../_lib/contentAutomationStudio.js';

function json(data, status = 200, headers = {}) { return jsonResponse(data, status, { 'Cache-Control': 'no-store', ...headers }); }
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
  try {
    await ensureContentAutomationSchema(db);
    const url = new URL(context.request.url);
    const projectId = number(url.searchParams.get('project_id'));
    const response = await listContentStudioProjects(db);
    const detail = projectId ? await getContentProjectDetail(db, projectId) : null;
    if (projectId && !detail) return json({ ok: false, error: 'Content project not found.' }, 404);
    return json({ ok: true, build: CONTENT_STUDIO_BUILD, ...response, detail, mode: 'review_first_no_auto_publish' });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'content_automation_studio', incident_code: 'content_studio_get_failed', severity: 'error',
      message: error?.message || 'Content Automation Studio failed to load.', related_user_id: adminUser.user_id,
      details: { error: String(error?.stack || error?.message || error) }
    });
    return json({ ok: false, error: 'Content Automation Studio could not load right now. Check the Build 199 migration and Cloudflare logs.' }, 500);
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
    await ensureContentAutomationSchema(db);
    let detail = null;
    let result = {};
    if (action === 'create_project' || action === 'refresh_archive') {
      const productId = number(body.product_id);
      if (!productId) throw new Error('Choose an approved product first.');
      const created = await createOrRefreshContentProjectForProduct(db, productId, adminUser.user_id, { refresh_copy: action === 'refresh_archive' && Number(body.refresh_copy) === 1 });
      result = { content_project_id: created.project.content_project_id, archived_count: created.archived_count, deliverables_created: created.deliverables_created };
      detail = await getContentProjectDetail(db, created.project.content_project_id);
    } else if (action === 'update_project') {
      if (!projectId) throw new Error('Content project is required.');
      detail = await updateContentProject(db, projectId, body, adminUser.user_id);
      result = { content_project_id: projectId };
    } else if (action === 'update_media') {
      if (!projectId || !number(body.content_project_media_id)) throw new Error('Content project and archive media item are required.');
      detail = await updateContentProjectMedia(db, projectId, number(body.content_project_media_id), body, adminUser.user_id);
      result = { content_project_id: projectId, content_project_media_id: number(body.content_project_media_id) };
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
      return new Response(JSON.stringify(makeContentManifest(detail), null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${detail.project.content_project_key}-manifest.json"`,
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff'
        }
      });
    } else {
      throw new Error('Unsupported Content Automation Studio action.');
    }

    await auditAdminAction(context.env, context.request, adminUser, {
      action_type: `content_studio_${action}`,
      target_type: 'content_project',
      target_id: result.content_project_id || projectId || null,
      target_key: detail?.project?.content_project_key || null,
      details: { action, ...result }
    });
    const listing = await listContentStudioProjects(db);
    return json({ ok: true, message: 'Content Automation Studio saved.', build: CONTENT_STUDIO_BUILD, result, detail, ...listing, mode: 'review_first_no_auto_publish' });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'content_automation_studio', incident_code: 'content_studio_post_failed', severity: 'warning',
      message: error?.message || 'Content Automation Studio could not save.', related_user_id: adminUser.user_id,
      details: { action, project_id: projectId || null, error: String(error?.stack || error?.message || error) }
    });
    return json({ ok: false, error: error?.message || 'Content Automation Studio could not save right now.' }, 400);
  }
}
