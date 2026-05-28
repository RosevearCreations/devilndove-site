// File: /functions/api/custom-request-reference-upload.js
// Brief description: Public post-submit image/reference upload for custom requests. Uploads are token-bound to a submitted request and stored as private-review references until admin approves public use.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

function clean(value, limit = 1000) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > limit ? text.slice(0, limit).trim() : text;
}

function sanitizeFilename(filename) {
  const cleaned = String(filename || 'reference-image')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '');
  return cleaned || 'reference-image';
}

function inferExtension(filename, mimeType) {
  const fromName = String(filename || '').match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
  if (fromName) return fromName;
  const map = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' };
  return map[String(mimeType || '').toLowerCase()] || 'bin';
}

function publicBase(env) {
  return clean(env.CUSTOM_REQUEST_MEDIA_PUBLIC_BASE_URL || env.PRODUCT_MEDIA_PUBLIC_BASE_URL || env.R2_PUBLIC_BASE_URL || env.PUBLIC_R2_BASE_URL || env.ASSET_ORIGIN || 'https://assets.devilndove.com', 500).replace(/\/$/, '');
}

async function ensureColumn(db, tableName, columnName, definition) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    const columns = Array.isArray(result?.results) ? result.results : [];
    if (columns.some((row) => row?.name === columnName)) return;
    await db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`).run();
  } catch {}
}

async function ensureSchema(db) {
  await ensureColumn(db, 'custom_requests', 'upload_token', 'upload_token TEXT');
  await ensureColumn(db, 'custom_requests', 'reference_upload_count', 'reference_upload_count INTEGER NOT NULL DEFAULT 0');
  await db.prepare(`CREATE TABLE IF NOT EXISTS custom_request_reference_uploads (
    custom_request_reference_upload_id INTEGER PRIMARY KEY AUTOINCREMENT,
    custom_request_id INTEGER NOT NULL,
    request_key TEXT NOT NULL,
    public_url TEXT,
    object_key TEXT,
    original_filename TEXT,
    mime_type TEXT,
    file_size_bytes INTEGER NOT NULL DEFAULT 0,
    reference_use_status TEXT NOT NULL DEFAULT 'private_review_only',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE
  )`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_custom_request_reference_uploads_request ON custom_request_reference_uploads(custom_request_id, created_at)`).run().catch(() => null);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}

export async function onRequestPost(context) {
  const db = context.env.DB || context.env.DD_DB;
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureSchema(db);

  const bucket = context.env.CUSTOM_REQUEST_MEDIA_BUCKET || context.env.PRODUCT_MEDIA_BUCKET || context.env.MEDIA_BUCKET || context.env.R2_PRODUCT_MEDIA;
  if (!bucket || typeof bucket.put !== 'function') return json({ ok: false, error: 'Reference image upload is not configured yet. The written request was saved; please email image references if needed.' }, 503);

  let form;
  try { form = await context.request.formData(); } catch { return json({ ok: false, error: 'Expected multipart/form-data.' }, 400); }
  const requestKey = clean(form.get('request_key'), 120);
  const uploadToken = clean(form.get('upload_token'), 160);
  const file = form.get('file');
  if (!requestKey || !uploadToken) return json({ ok: false, error: 'Missing request upload token.' }, 400);
  if (!file || typeof file.arrayBuffer !== 'function') return json({ ok: false, error: 'Choose an image file first.' }, 400);

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

  await db.prepare(`INSERT INTO custom_request_reference_uploads (custom_request_id, request_key, public_url, object_key, original_filename, mime_type, file_size_bytes, reference_use_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'private_review_only', CURRENT_TIMESTAMP)`).bind(
    Number(row.custom_request_id || 0), requestKey, publicUrl, objectKey, originalName, mimeType, fileSize
  ).run().catch(() => null);

  let links = [];
  try { links = JSON.parse(row.attachment_urls_json || '[]'); if (!Array.isArray(links)) links = []; } catch { links = []; }
  links.push(publicUrl);
  await db.prepare(`UPDATE custom_requests SET attachment_urls_json=?, reference_upload_count=COALESCE(reference_upload_count,0)+1, updated_at=CURRENT_TIMESTAMP WHERE custom_request_id=?`).bind(JSON.stringify(links.slice(0, 12)), Number(row.custom_request_id || 0)).run();

  return json({ ok: true, message: 'Reference image uploaded for private review.', public_url: publicUrl, object_key: objectKey });
}
