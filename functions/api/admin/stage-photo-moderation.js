// File: /functions/api/admin/stage-photo-moderation.js
// Brief description: Dedicated moderation queue for custom order-stage photos before public proof use.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
function json(data, status = 200) { return jsonResponse(data, status); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function clean(value, limit = 240) { const text = normalizeText(value); return text.length > limit ? text.slice(0, limit).trim() : text; }
async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_order_stage_photos (
    custom_order_stage_photo_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER,
    order_id INTEGER,
    stage_key TEXT NOT NULL DEFAULT 'planning',
    image_url TEXT,
    image_caption TEXT,
    public_use_status TEXT NOT NULL DEFAULT 'internal_review',
    moderation_status TEXT NOT NULL DEFAULT 'needs_review',
    proof_candidate_status TEXT NOT NULL DEFAULT 'not_requested',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS stage_photo_moderation_events (
    stage_photo_moderation_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_order_stage_photo_id INTEGER NOT NULL,
    action_key TEXT NOT NULL,
    moderation_status TEXT,
    public_use_status TEXT,
    notes TEXT,
    created_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
}
export async function onRequestGet(context) {
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  await ensureSchema(db);
  const url = new URL(context.request.url);
  const status = clean(url.searchParams.get('status') || 'needs_review', 80);
  const photos = rows(await db.prepare(`SELECT * FROM custom_order_stage_photos WHERE (?='all' OR moderation_status=?) ORDER BY CASE moderation_status WHEN 'needs_review' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, datetime(created_at) DESC LIMIT 200`).bind(status, status).all().catch(() => ({ results: [] })));
  return json({ ok: true, photos, summary: { total: photos.length, needs_review: photos.filter((p) => String(p.moderation_status || '') === 'needs_review').length, approved: photos.filter((p) => String(p.moderation_status || '') === 'approved').length } });
}
export async function onRequestPost(context) {
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  await ensureSchema(db);
  let body = {}; try { body = await context.request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const id = Number(body.custom_order_stage_photo_id || 0);
  if (!id) return json({ ok: false, error: 'custom_order_stage_photo_id is required.' }, 400);
  const action = clean(body.action || 'review', 40);
  const moderation = ['approved','rejected','needs_review'].includes(clean(body.moderation_status, 80)) ? clean(body.moderation_status, 80) : 'needs_review';
  const publicUse = ['internal_review','customer_private','public_proof_ok','blocked'].includes(clean(body.public_use_status, 80)) ? clean(body.public_use_status, 80) : 'internal_review';
  const proofStatus = moderation === 'approved' && publicUse === 'public_proof_ok' ? 'ready_for_proof_candidate' : 'not_requested';
  await db.prepare(`UPDATE custom_order_stage_photos SET moderation_status=?, public_use_status=?, proof_candidate_status=?, updated_at=CURRENT_TIMESTAMP WHERE custom_order_stage_photo_id=?`).bind(moderation, publicUse, proofStatus, id).run();
  await db.prepare(`INSERT INTO stage_photo_moderation_events (custom_order_stage_photo_id, action_key, moderation_status, public_use_status, notes, created_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(id, action, moderation, publicUse, clean(body.notes || '', 1200), Number(adminUser.user_id || 0) || null).run().catch(() => null);
  return json({ ok: true, message: `Stage photo ${moderation}.`, proof_candidate_status: proofStatus });
}
