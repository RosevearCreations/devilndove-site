// Release 467 Build 84 — bounded read-only Creators / CAIP workflow projection.
import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { CREATOR_WORKFLOW_BUILD, deriveCreatorWorkflow } from '../_lib/creatorWorkflow.js';

const text = (value, max = 4000) => normalizeText(value).slice(0, max);
const id = (value) => { const n = Number(value); return Number.isInteger(n) && n > 0 ? n : 0; };
const num = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const json = (data, status = 200) => jsonResponse(data, status, { 'Cache-Control': 'no-store' });

async function safeFirst(db, sql, bindings = []) {
  try { return await db.prepare(sql).bind(...bindings).first(); }
  catch { return null; }
}

async function safeCount(db, sql, bindings = []) {
  const row = await safeFirst(db, sql, bindings);
  return num(row?.total);
}

async function loadSnapshot(db, projectId) {
  const project = await safeFirst(db, `
    SELECT creative_work_project_id,project_key,project_title,project_status,summary,rights_status,product_id
      FROM creative_work_projects
     WHERE creative_work_project_id=?1
     LIMIT 1
  `, [projectId]);
  if (!project) return null;

  const handoff = await safeFirst(db, `
    SELECT content_project_id,handoff_status,evidence_count
      FROM creative_project_content_handoffs
     WHERE creative_work_project_id=?1
     ORDER BY creative_project_content_handoff_id DESC
     LIMIT 1
  `, [projectId]);
  const mirror = await safeFirst(db, `
    SELECT creative_project_id,mirror_status,evidence_count
      FROM creative_project_caip_mirrors
     WHERE creative_work_project_id=?1
     ORDER BY creative_project_caip_mirror_id DESC
     LIMIT 1
  `, [projectId]);

  const contentId = id(handoff?.content_project_id);
  const facts = {
    event_count: await safeCount(db, 'SELECT COUNT(*) total FROM creative_work_events WHERE creative_work_project_id=?1', [projectId]),
    material_count: await safeCount(db, `SELECT COUNT(*) total FROM creative_work_events WHERE creative_work_project_id=?1 AND TRIM(COALESCE(material_name,''))<>''`, [projectId]),
    reviewed_material_count: await safeCount(db, `SELECT COUNT(*) total FROM creative_project_material_reviews WHERE creative_work_project_id=?1 AND review_status='approved'`, [projectId]),
    evidence_count: await safeCount(db, 'SELECT COUNT(*) total FROM creative_project_evidence_selections WHERE creative_work_project_id=?1 AND selected=1', [projectId]),
    profitability_count: await safeCount(db, 'SELECT COUNT(*) total FROM creative_project_profitability WHERE creative_work_project_id=?1', [projectId]),
    profitability_extension_count: await safeCount(db, 'SELECT COUNT(*) total FROM creative_project_profitability_extensions WHERE creative_work_project_id=?1', [projectId]),
    cost_allocation_count: await safeCount(db, 'SELECT COUNT(*) total FROM creative_project_cost_allocations WHERE creative_work_project_id=?1', [projectId]),
    inventory_post_count: await safeCount(db, 'SELECT COUNT(*) total FROM creative_project_inventory_posts WHERE creative_work_project_id=?1', [projectId]),
    content_project_id: contentId,
    content_handoff_status: text(handoff?.handoff_status || '', 80),
    content_handoff_evidence_count: num(handoff?.evidence_count),
    deliverable_count: contentId ? await safeCount(db, 'SELECT COUNT(*) total FROM content_project_deliverables WHERE content_project_id=?1', [contentId]) : 0,
    approved_deliverable_count: contentId ? await safeCount(db, `SELECT COUNT(*) total FROM content_project_deliverables WHERE content_project_id=?1 AND approval_status='approved'`, [contentId]) : 0,
    caip_project_id: id(mirror?.creative_project_id),
    caip_mirror_status: text(mirror?.mirror_status || '', 80),
    caip_evidence_count: num(mirror?.evidence_count),
  };

  return {
    project: {
      creative_work_project_id: id(project.creative_work_project_id),
      project_key: text(project.project_key, 160),
      project_title: text(project.project_title, 300),
      project_status: text(project.project_status, 80),
      summary: text(project.summary, 4000),
      rights_status: text(project.rights_status || 'needs_review', 80) || 'needs_review',
      product_id: id(project.product_id) || null,
    },
    facts,
  };
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 503);
  const projectId = id(new URL(context.request.url).searchParams.get('project_id'));
  if (!projectId) return json({ ok: false, error: 'project_id is required.', build: CREATOR_WORKFLOW_BUILD }, 400);

  const snapshot = await loadSnapshot(db, projectId);
  if (!snapshot) return json({ ok: false, error: 'Creative Project was not found.', build: CREATOR_WORKFLOW_BUILD }, 404);
  return json({
    ok: true,
    build: CREATOR_WORKFLOW_BUILD,
    snapshot,
    workflow: deriveCreatorWorkflow(snapshot),
    authoritative_readback: true,
    read_only_projection: true,
    request_time_schema_mutation: false,
    d1_mutation: false,
    r2_mutation: false,
  });
}
