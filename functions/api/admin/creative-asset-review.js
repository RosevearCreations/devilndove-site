// Release 448 — authenticated same-origin CAIP review proxy with bounded R2 range streaming.
// The secure review design originated in historical Build 439. The token is opaque, short lived,
// bound to the issuing administrator, and never stored raw in D1. Large media is streamed directly
// from the bound bucket; the Worker never buffers the object.
import { captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { authorizeSecureReviewGrant, recordSecureReviewServed } from '../_lib/creativeAssetOperations.js';
import { resolveCaipBucket } from '../_lib/caipMediaIntake.js';

const RELEASE = 448;
function json(data, status = 200) {
  return jsonResponse({ release: RELEASE, ...data }, status, { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
}
function numeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// R2 accepts Headers for range/conditional reads, but its conditional Headers input
// deliberately does not support If-Range. Media elements can emit If-Range while
// seeking, so never forward the browser's full header collection into either R2 option.
// Pass Range only to range, and only R2-supported HTTP conditionals to onlyIf.
function r2GetOptions(request) {
  const options = {};
  const rangeValue = request.headers.get('Range');
  if (rangeValue) {
    const rangeHeaders = new Headers();
    rangeHeaders.set('Range', rangeValue);
    options.range = rangeHeaders;
  }

  const conditionalHeaders = new Headers();
  let hasConditional = false;
  for (const name of ['If-Match', 'If-None-Match', 'If-Modified-Since', 'If-Unmodified-Since']) {
    const value = request.headers.get(name);
    if (value) {
      conditionalHeaders.set(name, value);
      hasConditional = true;
    }
  }
  if (hasConditional) options.onlyIf = conditionalHeaders;
  return options;
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
    const bucket = resolveCaipBucket(env, authorized.storage_provider, authorized.bucket_name);
    if (!bucket || typeof bucket.get !== 'function') throw new Error('R2 review proxy is unavailable because the matching public/private media bucket binding is not configured.');

    const object = await bucket.get(authorized.object_key, r2GetOptions(request));
    if (!object) throw new Error('The R2 review object was not found. Source media has not been changed.');

    const headers = new Headers();
    if (typeof object.writeHttpMetadata === 'function') object.writeHttpMetadata(headers);
    const mime = headers.get('Content-Type') || object.httpMetadata?.contentType || authorized.mime_type || 'application/octet-stream';
    headers.set('Content-Type', mime);
    headers.set('Cache-Control', 'private, no-store, max-age=0');
    headers.set('Pragma', 'no-cache');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Cross-Origin-Resource-Policy', 'same-origin');
    headers.set('Referrer-Policy', 'no-referrer');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('Content-Disposition', `inline; filename="${authorized.filename}"`);
    headers.set('Vary', 'Cookie, Range');
    headers.set('Accept-Ranges', 'bytes');
    headers.set('X-DND-Release', String(RELEASE));
    headers.set('X-DND-CAIP-Review', 'release448');
    if (object.httpEtag || object.etag) headers.set('ETag', object.httpEtag || `"${object.etag}"`);

    if (!('body' in object) || !object.body) {
      return new Response(null, { status: 412, headers });
    }

    const requestedRange = request.headers.get('Range') || '';
    const range = object.range || null;
    let status = 200;
    if (requestedRange && range && Number.isFinite(Number(range.offset)) && Number.isFinite(Number(range.length))) {
      const offset = Math.max(0, numeric(range.offset));
      const length = Math.max(0, numeric(range.length));
      const end = Math.max(offset, offset + Math.max(0, length - 1));
      headers.set('Content-Range', `bytes ${offset}-${end}/${Math.max(0, numeric(object.size))}`);
      headers.set('Content-Length', String(length));
      status = 206;
    } else if (Number.isFinite(Number(object.size)) && Number(object.size) >= 0) {
      headers.set('Content-Length', String(object.size));
    }

    // A video player may issue many range requests. Count/audit the first served request
    // for a grant, but do not turn every seek/chunk into D1 writes.
    const shouldRecordGrantUse = !requestedRange || numeric(authorized.grant?.access_count) === 0;
    if (shouldRecordGrantUse) {
      await recordSecureReviewServed(db, authorized.grant, adminUser.user_id, {
        release: RELEASE,
        provenance_build: 439,
        source_storage_provider: authorized.storage_provider || 'r2',
        object_key_present: true,
        content_type: mime,
        ranged_streaming: Boolean(requestedRange),
        no_copy: true,
        no_cache: true,
      });
    }

    return new Response(object.body, { status, headers });
  } catch (error) {
    await captureRuntimeIncident(env, request, {
      incident_scope: 'creative_asset_secure_review', incident_code: 'caip_secure_review_failed', severity: 'warning',
      message: error?.message || 'Secure asset review failed.', related_user_id: adminUser.user_id,
      details: {
        release: RELEASE,
        provenance_build: 439,
        raw_token_not_logged: true,
        range_requested: Boolean(request.headers.get('Range')),
        if_range_present: Boolean(request.headers.get('If-Range')),
        error: String(error?.message || error)
      }
    });
    return json({ ok: false, error: error?.message || 'Secure asset review failed.' }, 400);
  }
}