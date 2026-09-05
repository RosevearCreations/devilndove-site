// Release 467 Build 52 — GET-only Content Studio render readiness.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { assessContentRenderReadiness } from '../_lib/contentRenderReadiness.js';

const RELEASE = 467;
const BUILD = 52;
const json = (data, status = 200) => jsonResponse({ release: RELEASE, build: BUILD, ...data }, status, { 'Cache-Control': 'no-store' });
const number = (value) => {
  const parsed = Number(value || 0);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
};

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const url = new URL(context.request.url);
  const projectId = number(url.searchParams.get('content_project_id') || url.searchParams.get('project_id'));
  const deliverableId = number(url.searchParams.get('content_project_deliverable_id') || url.searchParams.get('deliverable_id'));
  if (!projectId || !deliverableId) return json({ ok: false, error: 'A valid content project and deliverable are required.' }, 400);
  try {
    const readiness = await assessContentRenderReadiness(db, projectId, deliverableId);
    return json({ ok: true, readiness, mode: 'read_only_fail_closed_no_render_job_creation' });
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Content render readiness could not be evaluated.' }, 500);
  }
}
