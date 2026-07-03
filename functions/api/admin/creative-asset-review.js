// Build 202 — authenticated same-origin CAIP review proxy.
// Token is opaque, short lived, bound to the issuing administrator, and never stored raw in D1.
import { captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { authorizeSecureReviewGrant, recordSecureReviewServed } from '../_lib/creativeAssetOperations.js';

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Admin login is required to view this secure media link.' }, 401);
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const token = new URL(request.url).searchParams.get('token') || '';
  try {
    const authorized = await authorizeSecureReviewGrant(db, token, adminUser);
    const bucket = env.PRODUCT_MEDIA_BUCKET || env.MEDIA_BUCKET || env.R2_PRODUCT_MEDIA;
    if (!bucket || typeof bucket.get !== 'function') throw new Error('R2 review proxy is unavailable because no media bucket binding is configured.');
    const object = await bucket.get(authorized.object_key);
    if (!object) throw new Error('The R2 review object was not found. Source media has not been changed.');
    const http = object.httpMetadata || {};
    const mime = http.contentType || authorized.mime_type || 'application/octet-stream';
    await recordSecureReviewServed(db, authorized.grant, adminUser.user_id, {
      source_storage_provider: authorized.storage_provider || 'r2', object_key_present: true,
      content_type: mime, no_copy: true, no_cache: true
    });
    const headers = new Headers({
      'Content-Type': mime,
      'Cache-Control': 'private, no-store, max-age=0',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Referrer-Policy': 'no-referrer',
      'X-Frame-Options': 'DENY',
      'Content-Disposition': `inline; filename="${authorized.filename}"`,
      'Vary': 'Cookie'
    });
    if (Number.isFinite(Number(object.size)) && Number(object.size) > 0) headers.set('Content-Length', String(object.size));
    if (object.etag) headers.set('ETag', object.etag);
    if (http.cacheControl) headers.set('X-Source-Cache-Control', http.cacheControl);
    return new Response(object.body, { status: 200, headers });
  } catch (error) {
    await captureRuntimeIncident(env, request, {
      incident_scope: 'creative_asset_secure_review', incident_code: 'caip_secure_review_failed', severity: 'warning',
      message: error?.message || 'Secure asset review failed.', related_user_id: adminUser.user_id,
      details: { raw_token_not_logged: true, error: String(error?.message || error) }
    });
    return json({ ok: false, error: error?.message || 'Secure asset review failed.' }, 400);
  }
}
