// File: /functions/api/admin/custom-order-stage-photos.js
// Brief description: Admin-only upload/list endpoint for custom work stage photos.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
function json(data, status = 200) { return jsonResponse(data, status); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
async function ensureSchema(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_order_stage_photos (
    custom_order_stage_photo_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER,
    order_id INTEGER,
    stage_key TEXT NOT NULL DEFAULT 'planning',
    image_url TEXT,
    image_caption TEXT,
    public_use_status TEXT NOT NULL DEFAULT 'internal_review',
    uploaded_by_user_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`).run();
}
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  await ensureSchema(db);
  const url = new URL(request.url);
  const customRequestId = Number(url.searchParams.get('custom_request_id') || 0);
  const result = rows(await db.prepare(`SELECT * FROM custom_order_stage_photos WHERE (? <= 0 OR custom_request_id=?) ORDER BY datetime(created_at) DESC LIMIT 80`).bind(customRequestId, customRequestId).all());
  return json({ ok: true, photos: result });
}
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  await ensureSchema(db);
  let body = {};
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const customRequestId = Number(body.custom_request_id || 0);
  const orderId = Number(body.order_id || 0) || null;
  const imageUrl = normalizeText(body.image_url);
  if (!customRequestId && !orderId) return json({ ok: false, error: 'custom_request_id or order_id is required.' }, 400);
  if (!imageUrl) return json({ ok: false, error: 'image_url is required for this first stage-photo pass.' }, 400);
  const insert = await db.prepare(`INSERT INTO custom_order_stage_photos (custom_request_id, order_id, stage_key, image_url, image_caption, public_use_status, uploaded_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(customRequestId || null, orderId, normalizeText(body.stage_key || 'planning'), imageUrl, normalizeText(body.image_caption || ''), normalizeText(body.public_use_status || 'internal_review'), Number(adminUser.user_id || 0)).run();
  return json({ ok: true, message: 'Stage photo recorded.', custom_order_stage_photo_id: Number(insert?.meta?.last_row_id || 0) });
}
