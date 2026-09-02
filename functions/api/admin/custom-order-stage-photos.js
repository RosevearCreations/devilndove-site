// File: /functions/api/admin/custom-order-stage-photos.js
// Brief description: Admin-only list/upload endpoint for custom work stage photos, including R2 direct upload and moderation state.
// Release 467 Build 16: schema is migration-owned; request-time DDL is forbidden.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
function json(data, status = 200) { return jsonResponse(data, status); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function clean(value, limit = 240) { const text = normalizeText(value); return text.length > limit ? text.slice(0, limit).trim() : text; }
function sanitizeFilename(filename) { return String(filename || 'stage-photo').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^[-.]+|[-.]+$/g, '') || 'stage-photo'; }
function ext(filename, mime) { const from = String(filename || '').match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase(); if (from) return from; return ({ 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp', 'image/gif':'gif', 'image/avif':'avif' }[String(mime || '').toLowerCase()] || 'jpg'); }
function publicUrl(env, key) { const base = clean(env.ORDER_STAGE_PHOTO_PUBLIC_BASE_URL || env.PRODUCT_MEDIA_PUBLIC_BASE_URL || env.R2_PUBLIC_BASE_URL || env.PUBLIC_R2_BASE_URL || env.ASSET_ORIGIN || 'https://assets.devilndove.com'); return `${base.replace(/\/$/, '')}/${String(key || '').replace(/^\/+/, '')}`; }
async function schemaReady(db) {
  try { await db.prepare(`SELECT custom_order_stage_photo_id, custom_request_id, order_id, stage_key, image_url, image_caption, public_use_status, moderation_status, proof_candidate_status FROM custom_order_stage_photos LIMIT 0`).all(); return true; }
  catch { return false; }
}
async function insertPhoto(db, adminUser, body) {
  const customRequestId = Number(body.custom_request_id || 0) || null;
  const orderId = Number(body.order_id || 0) || null;
  const imageUrl = clean(body.image_url, 1200);
  if (!customRequestId && !orderId) throw new Error('custom_request_id or order_id is required.');
  if (!imageUrl) throw new Error('image_url is required.');
  const result = await db.prepare(`INSERT INTO custom_order_stage_photos (custom_request_id, order_id, stage_key, image_url, object_key, original_filename, mime_type, file_size_bytes, image_caption, public_use_status, moderation_status, proof_candidate_status, uploaded_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(customRequestId, orderId, clean(body.stage_key || 'planning', 80), imageUrl, clean(body.object_key || '', 1200) || null, clean(body.original_filename || '', 240) || null, clean(body.mime_type || '', 120) || null, Number(body.file_size_bytes || 0) || 0, clean(body.image_caption || '', 500), clean(body.public_use_status || 'customer_private', 80), clean(body.moderation_status || 'needs_review', 80), clean(body.proof_candidate_status || 'not_requested', 80), Number(adminUser.user_id || 0)).run();
  return Number(result?.meta?.last_row_id || 0);
}
export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  if (!(await schemaReady(db))) return json({ ok: false, error: 'custom_order_stage_photos_schema_unavailable' }, 503);
  const url = new URL(request.url);
  const customRequestId = Number(url.searchParams.get('custom_request_id') || 0);
  const moderation = clean(url.searchParams.get('moderation_status') || '', 80);
  const result = rows(await db.prepare(`SELECT * FROM custom_order_stage_photos WHERE (? <= 0 OR custom_request_id=?) AND (?='' OR moderation_status=?) ORDER BY datetime(created_at) DESC LIMIT 120`).bind(customRequestId, customRequestId, moderation, moderation).all());
  return json({ ok: true, photos: result, summary: { total: result.length, needs_review: result.filter((row) => String(row.moderation_status || '') === 'needs_review').length }, schema_authority: 'migration_owned' });
}
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  if (!(await schemaReady(db))) return json({ ok: false, error: 'custom_order_stage_photos_schema_unavailable' }, 503);
  const contentType = String(request.headers.get('content-type') || '').toLowerCase();
  try {
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('file');
      if (!file || typeof file.arrayBuffer !== 'function') return json({ ok: false, error: 'Stage photo file is required.' }, 400);
      const mimeType = clean(file.type || 'application/octet-stream', 120).toLowerCase();
      if (!mimeType.startsWith('image/')) return json({ ok: false, error: 'Only image uploads are accepted for stage photos.' }, 400);
      if (Number(file.size || 0) > 10 * 1024 * 1024) return json({ ok: false, error: 'Stage photos must be 10 MB or smaller.' }, 400);
      const bucket = env.ORDER_STAGE_PHOTOS_BUCKET || env.PRODUCT_MEDIA_BUCKET || env.MEDIA_BUCKET || env.R2_PRODUCT_MEDIA;
      if (!bucket || typeof bucket.put !== 'function') return json({ ok: false, error: 'R2 stage-photo bucket binding is missing.' }, 500);
      const original = sanitizeFilename(file.name || 'stage-photo');
      const objectKey = `custom-order-stage-photos/${clean(form.get('custom_request_id') || form.get('order_id') || 'unlinked', 80)}/${Date.now()}-${crypto.randomUUID()}.${ext(original, mimeType)}`;
      await bucket.put(objectKey, await file.arrayBuffer(), { httpMetadata: { contentType: mimeType, cacheControl: 'public, max-age=31536000' }, customMetadata: { original_name: original, uploaded_by_user_id: String(adminUser.user_id || '') } });
      const id = await insertPhoto(db, adminUser, { custom_request_id: form.get('custom_request_id'), order_id: form.get('order_id'), stage_key: form.get('stage_key') || 'planning', image_url: publicUrl(env, objectKey), object_key: objectKey, original_filename: original, mime_type: mimeType, file_size_bytes: Number(file.size || 0), image_caption: form.get('image_caption') || '', public_use_status: form.get('public_use_status') || 'customer_private', moderation_status: 'needs_review' });
      return json({ ok: true, message: 'Stage photo uploaded for moderation.', custom_order_stage_photo_id: id, image_url: publicUrl(env, objectKey), object_key: objectKey, automatic_publication: false });
    }
    const body = await request.json();
    if (clean(body.action) === 'moderate') {
      const id = Number(body.custom_order_stage_photo_id || 0);
      const next = ['approved','rejected','needs_review'].includes(clean(body.moderation_status, 80)) ? clean(body.moderation_status, 80) : 'needs_review';
      await db.prepare(`UPDATE custom_order_stage_photos SET moderation_status=?, public_use_status=COALESCE(?, public_use_status), approved_by_user_id=CASE WHEN ?='approved' THEN ? ELSE approved_by_user_id END, approved_at=CASE WHEN ?='approved' THEN CURRENT_TIMESTAMP ELSE approved_at END, updated_at=CURRENT_TIMESTAMP WHERE custom_order_stage_photo_id=?`).bind(next, clean(body.public_use_status || '', 80) || null, next, Number(adminUser.user_id || 0), next, id).run();
      return json({ ok: true, message: `Stage photo moderation set to ${next}.` });
    }
    const id = await insertPhoto(db, adminUser, body);
    return json({ ok: true, message: 'Stage photo recorded.', custom_order_stage_photo_id: id, automatic_publication: false });
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Stage photo save failed.' }, 400);
  }
}
