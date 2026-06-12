// File: /functions/api/admin/private-evidence-download.js
// Brief description: Build 181 signed private evidence download route with HMAC tokens, expiry, and R2 object streaming.

import { getAdminUserFromRequest, getClientIp, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

function json(data, status = 200, headers = {}) { return jsonResponse(data, status, { 'Cache-Control': 'no-store', ...headers }); }
function enc(value) { return new TextEncoder().encode(String(value || '')); }
function hex(buffer) { return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join(''); }
function safeKey(value) { return normalizeText(value).replace(/^\/+/, '').slice(0, 900); }
function pickBucket(env, label) {
  const requested = normalizeText(label).toLowerCase();
  if (requested === 'media') return { label: 'media', bucket: env.MEDIA_BUCKET || env.PRODUCT_MEDIA_BUCKET || env.R2_PRODUCT_MEDIA };
  if (requested === 'product_media') return { label: 'product_media', bucket: env.PRODUCT_MEDIA_BUCKET || env.R2_PRODUCT_MEDIA || env.MEDIA_BUCKET };
  return { label: 'accounting_evidence', bucket: env.ACCOUNTING_EVIDENCE_BUCKET || env.PRIVATE_EVIDENCE_BUCKET || env.MEDIA_BUCKET || env.PRODUCT_MEDIA_BUCKET || env.R2_PRODUCT_MEDIA };
}
async function importKey(secret) {
  return crypto.subtle.importKey('raw', enc(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}
async function sign(secret, payload) {
  const key = await importKey(secret);
  return hex(await crypto.subtle.sign('HMAC', key, enc(payload)));
}
async function digest(value) { return hex(await crypto.subtle.digest('SHA-256', enc(value))); }
function secretFromEnv(env) { return normalizeText(env.PRIVATE_EVIDENCE_DOWNLOAD_SECRET || env.SESSION_SECRET || env.JWT_SECRET || env.ADMIN_SIGNING_SECRET || ''); }
async function ensure(db) {
  if (!db) return;
  await db.prepare(`CREATE TABLE IF NOT EXISTS private_evidence_download_tokens (private_evidence_download_token_id INTEGER PRIMARY KEY AUTOINCREMENT, object_key TEXT NOT NULL, bucket_label TEXT NOT NULL DEFAULT 'accounting_evidence', token_hash TEXT NOT NULL, expires_at TEXT NOT NULL, max_download_count INTEGER NOT NULL DEFAULT 1, download_count INTEGER NOT NULL DEFAULT 0, token_status TEXT NOT NULL DEFAULT 'active', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, last_downloaded_at TEXT, notes TEXT)`).run().catch(() => null);
  await db.prepare(`CREATE TABLE IF NOT EXISTS private_evidence_download_audit_events (private_evidence_download_audit_event_id INTEGER PRIMARY KEY AUTOINCREMENT, object_key TEXT, bucket_label TEXT, event_status TEXT NOT NULL DEFAULT 'attempted', http_status INTEGER, token_hash TEXT, ip_address TEXT, user_agent TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`).run().catch(() => null);
  await db.prepare(`CREATE TABLE IF NOT EXISTS r2_signed_download_route_tests (r2_signed_download_route_test_id INTEGER PRIMARY KEY AUTOINCREMENT, route_path TEXT NOT NULL DEFAULT '/api/admin/private-evidence-download', object_key TEXT, token_status TEXT NOT NULL DEFAULT 'not_run', download_status TEXT NOT NULL DEFAULT 'not_run', expiry_status TEXT NOT NULL DEFAULT 'not_run', expires_seconds INTEGER NOT NULL DEFAULT 300, notes TEXT, checked_by_user_id INTEGER, checked_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run().catch(() => null);
}
async function audit(db, request, payload) {
  if (!db) return;
  await db.prepare(`INSERT INTO private_evidence_download_audit_events (object_key, bucket_label, event_status, http_status, token_hash, ip_address, user_agent, created_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`).bind(payload.object_key || null, payload.bucket_label || null, payload.event_status || 'attempted', payload.http_status || 0, payload.token_hash || null, getClientIp(request) || null, normalizeText(request.headers.get('User-Agent')) || null, payload.notes || '').run().catch(() => null);
}
function contentDisposition(key) {
  const name = key.split('/').filter(Boolean).pop() || 'evidence-file';
  return `attachment; filename="${name.replace(/["\\]/g, '_')}"`;
}
export async function onRequestPost(context) {
  const user = await getAdminUserFromRequest(context.request, context.env);
  if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const db = getDb(context.env); await ensure(db);
  const secret = secretFromEnv(context.env);
  if (!secret) return json({ ok: false, error: 'PRIVATE_EVIDENCE_DOWNLOAD_SECRET, SESSION_SECRET, or JWT_SECRET is required before signed private downloads can be created.' }, 500);
  const body = await context.request.json().catch(() => ({}));
  const objectKey = safeKey(body.object_key || body.key || '');
  if (!objectKey) return json({ ok: false, error: 'object_key is required.' }, 400);
  const { label, bucket } = pickBucket(context.env, body.bucket_label || body.bucket || 'accounting_evidence');
  if (!bucket || typeof bucket.get !== 'function') return json({ ok: false, error: `R2 bucket binding for ${label} is not configured.` }, 500);
  const expiresSeconds = Math.max(60, Math.min(Number(body.expires_seconds || 300), 3600));
  const exp = Math.floor(Date.now() / 1000) + expiresSeconds;
  const nonce = crypto.randomUUID();
  const payload = `${label}\n${objectKey}\n${exp}\n${nonce}`;
  const sig = await sign(secret, payload);
  const tokenHash = await digest(`${payload}\n${sig}`);
  const url = new URL(context.request.url);
  url.search = new URLSearchParams({ bucket: label, key: objectKey, exp: String(exp), nonce, sig }).toString();
  if (db) await db.prepare(`INSERT INTO private_evidence_download_tokens (object_key, bucket_label, token_hash, expires_at, max_download_count, token_status, created_by_user_id, created_at, notes) VALUES (?, ?, ?, datetime(?, 'unixepoch'), 1, 'active', ?, CURRENT_TIMESTAMP, ?)`).bind(objectKey, label, tokenHash, exp, Number(user.user_id || 0) || null, normalizeText(body.notes || 'Signed private evidence download token created.')).run().catch(() => null);
  if (db) await db.prepare(`INSERT INTO r2_signed_download_route_tests (route_path, object_key, token_status, download_status, expiry_status, expires_seconds, notes, checked_by_user_id, checked_at) VALUES ('/api/admin/private-evidence-download', ?, 'created', 'not_run', 'pending_expiry', ?, 'Signed route token created by Build 181 private evidence route.', ?, CURRENT_TIMESTAMP)`).bind(objectKey, expiresSeconds, Number(user.user_id || 0) || null).run().catch(() => null);
  return json({ ok: true, signed_url: `${url.pathname}?${url.searchParams.toString()}`, object_key: objectKey, bucket_label: label, expires_at_unix: exp, expires_seconds: expiresSeconds });
}
export async function onRequestGet(context) {
  const db = getDb(context.env); await ensure(db);
  const url = new URL(context.request.url);
  const bucketLabel = normalizeText(url.searchParams.get('bucket') || 'accounting_evidence').toLowerCase();
  const objectKey = safeKey(url.searchParams.get('key') || '');
  const exp = Number(url.searchParams.get('exp') || 0);
  const nonce = normalizeText(url.searchParams.get('nonce') || '');
  const sig = normalizeText(url.searchParams.get('sig') || '');
  const secret = secretFromEnv(context.env);
  const payload = `${bucketLabel}\n${objectKey}\n${exp}\n${nonce}`;
  const tokenHash = sig && objectKey ? await digest(`${payload}\n${sig}`) : '';
  if (!secret || !objectKey || !exp || !nonce || !sig) { await audit(db, context.request, { object_key: objectKey, bucket_label: bucketLabel, event_status: 'bad_request', http_status: 400, token_hash: tokenHash, notes: 'Missing signed download parameters.' }); return json({ ok: false, error: 'Missing signed download parameters.' }, 400); }
  if (Math.floor(Date.now() / 1000) > exp) { await audit(db, context.request, { object_key: objectKey, bucket_label: bucketLabel, event_status: 'expired', http_status: 410, token_hash: tokenHash, notes: 'Signed URL expired.' }); return json({ ok: false, error: 'Signed URL expired.' }, 410); }
  const expected = await sign(secret, payload);
  if (expected !== sig) { await audit(db, context.request, { object_key: objectKey, bucket_label: bucketLabel, event_status: 'invalid_signature', http_status: 403, token_hash: tokenHash, notes: 'Signature mismatch.' }); return json({ ok: false, error: 'Invalid signed download token.' }, 403); }
  const { label, bucket } = pickBucket(context.env, bucketLabel);
  if (!bucket || typeof bucket.get !== 'function') { await audit(db, context.request, { object_key: objectKey, bucket_label: label, event_status: 'bucket_missing', http_status: 500, token_hash: tokenHash, notes: 'R2 bucket binding missing.' }); return json({ ok: false, error: 'R2 bucket binding is not configured.' }, 500); }
  const object = await bucket.get(objectKey).catch(() => null);
  if (!object) { await audit(db, context.request, { object_key: objectKey, bucket_label: label, event_status: 'not_found', http_status: 404, token_hash: tokenHash, notes: 'R2 object not found.' }); return json({ ok: false, error: 'Evidence object was not found.' }, 404); }
  if (db) await db.prepare(`UPDATE private_evidence_download_tokens SET download_count=download_count+1, last_downloaded_at=CURRENT_TIMESTAMP WHERE token_hash=?`).bind(tokenHash).run().catch(() => null);
  await audit(db, context.request, { object_key: objectKey, bucket_label: label, event_status: 'downloaded', http_status: 200, token_hash: tokenHash, notes: 'Private evidence object streamed.' });
  const headers = new Headers();
  object.writeHttpMetadata?.(headers);
  headers.set('Cache-Control', 'no-store'); headers.set('X-Content-Type-Options', 'nosniff'); headers.set('Content-Disposition', contentDisposition(objectKey)); headers.set('X-Private-Evidence-Download', 'signed');
  if (!headers.get('Content-Type')) headers.set('Content-Type', 'application/octet-stream');
  return new Response(object.body, { status: 200, headers });
}
