// File: /functions/api/custom-request-reference-upload.js
// Brief description: Public post-submit image/reference upload for custom requests. Uploads are token-bound to a submitted request and private until reviewed.

import { hasCustomRequestReferenceUploadSchema } from "./_lib/publicRuntimeSchemaReadiness.js";

function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }); }
function clean(value, limit = 1000) { const text = String(value ?? '').replace(/\s+/g, ' ').trim(); return text.length > limit ? text.slice(0, limit).trim() : text; }
function sanitizeFilename(filename) { const cleaned = String(filename || 'reference-image').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^[-.]+|[-.]+$/g, ''); return cleaned || 'reference-image'; }
function inferExtension(filename, mimeType) { const fromName = String(filename || '').match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase(); if (fromName) return fromName; const map = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' }; return map[String(mimeType || '').toLowerCase()] || 'bin'; }
function publicBase(env) { return clean(env.CUSTOM_REQUEST_MEDIA_PUBLIC_BASE_URL || env.PRODUCT_MEDIA_PUBLIC_BASE_URL || env.R2_PUBLIC_BASE_URL || env.PUBLIC_R2_BASE_URL || env.ASSET_ORIGIN || 'https://assets.devilndove.com', 500).replace(/\/$/, ''); }
function consentKey(requestKey, objectKey) { return `custom_request_reference_${requestKey}_${String(objectKey || '').split('/').pop().replace(/[^a-zA-Z0-9_-]+/g, '_')}`.slice(0, 180); }

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}

export async function onRequestPost(context) {
  const db = context.env.DB || context.env.DD_DB;
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  const bucket = context.env.CUSTOM_REQUEST_MEDIA_BUCKET || context.env.PRODUCT_MEDIA_BUCKET || context.env.MEDIA_BUCKET || context.env.R2_PRODUCT_MEDIA;
  if (!bucket || typeof bucket.put !== 'function') return json({ ok: false, error: 'Reference image upload is not configured yet. The written request was saved; please email image references if needed.' }, 503);

  let form; try { form = await context.request.formData(); } catch { return json({ ok: false, error: 'Expected multipart/form-data.' }, 400); }
  const requestKey = clean(form.get('request_key'), 120);
  const uploadToken = clean(form.get('upload_token'), 160);
  const file = form.get('file');
  if (!requestKey || !uploadToken) return json({ ok: false, error: 'Missing request upload token.' }, 400);
  if (!file || typeof file.arrayBuffer !== 'function') return json({ ok: false, error: 'Choose an image file first.' }, 400);

  if (!(await hasCustomRequestReferenceUploadSchema(db))) {
    return json({ ok: false, error: 'custom_request_reference_schema_unavailable', message: 'Reference uploads are temporarily unavailable.' }, 503);
  }

  const row = await db.prepare(`SELECT custom_request_id, request_key, upload_token, reference_upload_count, attachment_urls_json FROM custom_requests WHERE request_key=? LIMIT 1`).bind(requestKey).first().catch(() => null);
  if (!row || String(row.upload_token || '') !== uploadToken) return json({ ok: false, error: 'Upload token was not accepted for this request.' }, 403);
  if (Number(row.reference_upload_count || 0) >= 5) return json({ ok: false, error: 'Reference upload limit reached for this request.' }, 400);

  const mimeType = clean(file.type || 'application/octet-stream', 80).toLowerCase();
  if (!mimeType.startsWith('image/')) return json({ ok: false, error: 'Only image reference uploads are allowed.' }, 400);
  const fileSize = Number(file.size || 0);
  if (!Number.isFinite(fileSize) || fileSize <= 0) return json({ ok: false, error: 'Uploaded image was empty.' }, 400);
  if (fileSize > 8 * 1024 * 1024) return json({ ok: false, error: 'Reference images must be 8 MB or smaller.' }, 400);

  const originalName = sanitizeFilename(file.name || 'reference-image');
  const extension = inferExtension(originalName, mimeType);
  const objectKey = `custom-requests/reference/${requestKey}/${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}.${extension}`;
  await bucket.put(objectKey, await file.arrayBuffer(), { httpMetadata: { contentType: mimeType }, customMetadata: { request_key: requestKey, reference_use_status: 'private_review_only' } });
  const publicUrl = `${publicBase(context.env)}/${objectKey}`;

  const uploadResult = await db.prepare(`INSERT INTO custom_request_reference_uploads (custom_request_id, request_key, public_url, object_key, original_filename, mime_type, file_size_bytes, reference_use_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'private_review_only', CURRENT_TIMESTAMP)`).bind(Number(row.custom_request_id || 0), requestKey, publicUrl, objectKey, originalName, mimeType, fileSize).run().catch(() => null);
  const uploadId = Number(uploadResult?.meta?.last_row_id || 0) || null;
  await db.prepare(`INSERT INTO media_consent_records (consent_key, subject_label, source_type, source_id, media_url, consent_status, consent_scope, public_use_allowed, social_use_allowed, privacy_notes, created_at, updated_at) VALUES (?, ?, 'custom_request_reference_upload', ?, ?, 'requested', 'internal_only', 0, 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(consent_key) DO UPDATE SET media_url=excluded.media_url, consent_status=CASE WHEN media_consent_records.consent_status='unknown' THEN 'requested' ELSE media_consent_records.consent_status END, privacy_notes=excluded.privacy_notes, updated_at=CURRENT_TIMESTAMP`).bind(consentKey(requestKey, objectKey), `Reference image for ${requestKey}`, uploadId ? String(uploadId) : objectKey, publicUrl, 'Customer-uploaded reference image. Keep private until consent scope is reviewed and explicitly approved.').run().catch(() => null);

  let links = []; try { links = JSON.parse(row.attachment_urls_json || '[]'); if (!Array.isArray(links)) links = []; } catch { links = []; }
  links.push(publicUrl);
  await db.prepare(`UPDATE custom_requests SET attachment_urls_json=?, reference_upload_count=COALESCE(reference_upload_count,0)+1, updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=?`).bind(JSON.stringify(links.slice(0, 12)), Number(row.custom_request_id || 0)).run();

  return json({ ok: true, message: 'Reference image uploaded for private review and consent review.', public_url: publicUrl, object_key: objectKey, consent_status: 'requested', consent_scope: 'internal_only' });
}
