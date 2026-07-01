// Build 200 — Admin Content Release Board API.
import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { listContentStudioProjects } from '../_lib/contentAutomationStudio.js';
import {
  CONTENT_PUBLICATION_BUILD,
  approveContentPublication,
  ensureContentPublicationSchema,
  listContentPublications,
  prepareContentPublications,
  publishContentPublication,
  unpublishContentPublication,
  updateContentPublication,
  updatePublicationMetrics
} from '../_lib/contentPublications.js';

function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function number(value) { const parsed = Number(value || 0); return Number.isInteger(parsed) && parsed > 0 ? parsed : 0; }

async function access(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { error: json({ ok: false, error: 'Admin access required.' }, 401) };
  const db = getDb(context.env);
  if (!db) return { error: json({ ok: false, error: 'Database binding is not configured.' }, 500) };
  return { adminUser, db };
}

async function payload(db, projectId = 0) {
  const [listing, publications] = await Promise.all([listContentStudioProjects(db), listContentPublications(db, projectId)]);
  return { projects: listing.projects || [], approved_products: listing.approved_products || [], publications };
}

export async function onRequestGet(context) {
  const state = await access(context);
  if (state.error) return state.error;
  const projectId = number(new URL(context.request.url).searchParams.get('content_project_id'));
  try {
    await ensureContentPublicationSchema(state.db);
    return json({ ok: true, build: CONTENT_PUBLICATION_BUILD, ...await payload(state.db, projectId), mode: 'review_first_public_release' });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'content_publication', incident_code: 'content_publications_get_failed', severity: 'error',
      message: error?.message || 'Content Release Board could not load.', related_user_id: state.adminUser.user_id,
      details: { error: String(error?.stack || error?.message || error) }
    });
    return json({ ok: false, error: 'Content Release Board could not load. Confirm the Build 200 migration and Cloudflare logs.' }, 500);
  }
}

export async function onRequestPost(context) {
  const state = await access(context);
  if (state.error) return state.error;
  let body = {};
  try { body = await context.request.json(); } catch {}
  const action = normalizeText(body.action).toLowerCase();
  const projectId = number(body.content_project_id || body.project_id);
  const publicationId = number(body.content_publication_id || body.publication_id);
  try {
    await ensureContentPublicationSchema(state.db);
    let result = null;
    if (action === 'prepare_publications') {
      if (!projectId) throw new Error('Choose a content project first.');
      result = await prepareContentPublications(state.db, projectId, state.adminUser.user_id);
    } else if (action === 'update_publication') {
      if (!publicationId) throw new Error('Publication draft is required.');
      result = await updateContentPublication(state.db, publicationId, body, state.adminUser.user_id);
    } else if (action === 'approve_publication') {
      if (!publicationId) throw new Error('Publication draft is required.');
      result = await approveContentPublication(state.db, publicationId, state.adminUser.user_id);
    } else if (action === 'publish_publication') {
      if (!publicationId) throw new Error('Publication draft is required.');
      result = await publishContentPublication(state.db, publicationId, state.adminUser.user_id);
    } else if (action === 'unpublish_publication') {
      if (!publicationId) throw new Error('Publication draft is required.');
      result = await unpublishContentPublication(state.db, publicationId, state.adminUser.user_id);
    } else if (action === 'record_metrics') {
      if (!publicationId) throw new Error('Publication draft is required.');
      result = await updatePublicationMetrics(state.db, publicationId, body, state.adminUser.user_id);
    } else {
      throw new Error('Unsupported Content Release Board action.');
    }
    await auditAdminAction(context.env, context.request, state.adminUser, {
      action_type: `content_publication_${action}`, target_type: 'content_publication', target_id: publicationId || null,
      target_key: result?.publication_key || null, details: { action, content_project_id: projectId || result?.content_project_id || null, content_publication_id: publicationId || result?.content_publication_id || null }
    });
    return json({ ok: true, message: 'Content Release Board saved.', result, build: CONTENT_PUBLICATION_BUILD, ...await payload(state.db, projectId || result?.content_project_id || 0), mode: 'review_first_public_release' });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'content_publication', incident_code: 'content_publications_post_failed', severity: 'warning',
      message: error?.message || 'Content Release Board could not save.', related_user_id: state.adminUser.user_id,
      details: { action, content_project_id: projectId || null, content_publication_id: publicationId || null, error: String(error?.stack || error?.message || error) }
    });
    return json({ ok: false, error: error?.message || 'Content Release Board could not save.' }, 400);
  }
}
