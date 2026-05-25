// File: /functions/api/admin/custom-requests.js
// Brief description: Admin review queue for custom gift, engraving, and personalized product requests.

import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function clean(value, limit = 1200) { const text = normalizeText(value); return text.length > limit ? text.slice(0, limit).trim() : text; }
function status(value) { const cleanValue = clean(value, 40).toLowerCase(); return ['new', 'reviewing', 'quote_needed', 'quoted', 'accepted', 'declined', 'archived'].includes(cleanValue) ? cleanValue : 'new'; }

async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_requests (
    custom_request_id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    request_type TEXT NOT NULL,
    product_interest TEXT,
    deadline_date TEXT,
    budget_cents INTEGER,
    message TEXT NOT NULL,
    attachment_urls_json TEXT DEFAULT '[]',
    consent_to_contact INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'new',
    admin_notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_requests_status ON custom_requests(status, created_at)`).run().catch(() => null);
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_requests_email ON custom_requests(email, created_at)`).run().catch(() => null);
}

async function listPayload(db) {
  await ensureSchema(db);
  const requests = rows(await db.prepare(`SELECT * FROM custom_requests ORDER BY datetime(created_at) DESC, custom_request_id DESC LIMIT 100`).all().catch(() => ({ results: [] })));
  const summary = await db.prepare(`SELECT
    COUNT(*) AS total,
    SUM(CASE WHEN status IN ('new','reviewing','quote_needed') THEN 1 ELSE 0 END) AS open_count,
    SUM(CASE WHEN status='quote_needed' THEN 1 ELSE 0 END) AS quote_needed_count,
    SUM(CASE WHEN status='accepted' THEN 1 ELSE 0 END) AS accepted_count
    FROM custom_requests`).first().catch(() => ({ total: 0, open_count: 0, quote_needed_count: 0, accepted_count: 0 }));
  return { ok: true, requests, summary };
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  try { return jsonResponse(await listPayload(db), 200, { 'Cache-Control': 'no-store' }); }
  catch (error) {
    await captureRuntimeIncident(context.env, context.request, { incident_scope: 'admin_custom_requests', incident_code: 'custom_requests_list_failed', severity: 'error', message: error?.message || 'Custom request list failed.', details: { error: String(error?.stack || error?.message || error) }, related_user_id: adminUser.user_id }).catch(() => null);
    return jsonResponse({ ok: false, error: error?.message || 'Could not load custom requests.' }, 500);
  }
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  let body = {};
  try { body = await context.request.json(); } catch { body = {}; }
  const id = Number(body.custom_request_id || 0);
  if (!id) return jsonResponse({ ok: false, error: 'Choose a custom request first.' }, 400);
  try {
    await ensureSchema(db);
    const nextStatus = status(body.status);
    const adminNotes = clean(body.admin_notes || '', 1600);
    await db.prepare(`UPDATE custom_requests SET status=?, admin_notes=?, updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=?`).bind(nextStatus, adminNotes || null, id).run();
    await auditAdminAction(context.env, context.request, adminUser, { action_type: 'custom_request_update', target_type: 'custom_requests', target_id: id, details: { status: nextStatus } }).catch(() => null);
    const data = await listPayload(db);
    return jsonResponse({ ...data, message: 'Custom request updated.' }, 200, { 'Cache-Control': 'no-store' });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, { incident_scope: 'admin_custom_requests', incident_code: 'custom_request_update_failed', severity: 'error', message: error?.message || 'Custom request update failed.', details: { error: String(error?.stack || error?.message || error) }, related_user_id: adminUser.user_id }).catch(() => null);
    return jsonResponse({ ok: false, error: error?.message || 'Could not update custom request.' }, 500);
  }
}
