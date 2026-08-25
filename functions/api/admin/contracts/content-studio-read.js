// Devil n Dove Build 355 — Content Studio GET-only contract.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../../_lib/adminAudit.js';
import { BUILD, CONTRACT_ID, OWNER, readContentStudio } from '../../_lib/contentStudioReadService.js';

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}

function positiveInt(value) {
  const parsed = Number(value || 0);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, build: BUILD, contract: CONTRACT_ID, owner: OWNER, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, build: BUILD, contract: CONTRACT_ID, owner: OWNER, error: 'Database binding is not configured.' }, 500);

  const url = new URL(context.request.url);
  const data = await readContentStudio(db, {
    projectId: positiveInt(url.searchParams.get('project_id')),
    creativeProjectId: positiveInt(url.searchParams.get('creative_project_id') || url.searchParams.get('creative_work_project_id')),
  });

  if (data.not_found) return json({ ...data, ok: false, error: 'Content project not found.' }, 404);
  return json(data);
}
