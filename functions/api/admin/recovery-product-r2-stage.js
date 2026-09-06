// TEMPORARY RECOVERY BRIDGE — Development only.
// Stages positively verified Product JPEG bytes into Development R2 so the existing
// native Release 463 bridge can copy the exact keys to Production R2. No D1 writes,
// no deletes, and no overwrite of conflicting objects are permitted.
import { getAdminUserFromRequest, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const AUTHORIZATION = 'RECOVERY_PRODUCT_R2_STAGE_150';
const MAX_BYTES = 20 * 1024 * 1024;
const FORBIDDEN_PRODUCT_IDS = new Set([2, 16, 17, 42, 44, 45]);
const json = (data, status = 200) => jsonResponse(data, status, { 'Cache-Control': 'no-store' });

function isDevelopmentHost(request) {
  const host = new URL(request.url).hostname.toLowerCase();
  return host === 'localhost' || host === '127.0.0.1'
    || (host.endsWith('.devilndove-site.pages.dev') && host !== 'devilndove-site.pages.dev')
    || host === 'devilndove-site-dev.pages.dev'
    || host.endsWith('.devilndove-site-dev.pages.dev');
}

function hasBucket(bucket) {
  return bucket && typeof bucket.get === 'function' && typeof bucket.put === 'function';
}

function parseAuthorizedKey(value) {
  const key = normalizeText(value);
  const match = /^products\/([1-9][0-9]*)\/([A-Za-z0-9._-]+\.jpg)$/.exec(key);
  if (!match) return null;
  const productId = Number(match[1]);
  if (!Number.isSafeInteger(productId) || FORBIDDEN_PRODUCT_IDS.has(productId)) return null;
  return { key, productId };
}

function bytesToHex(buffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(bytes) {
  return bytesToHex(await crypto.subtle.digest('SHA-256', bytes));
}

async function objectBytes(object) {
  if (!object) return null;
  return await object.arrayBuffer();
}

export async function onRequestPost({ request, env }) {
  if (!isDevelopmentHost(request)) {
    return json({ ok: false, code: 'development_only', error: 'Recovery staging is available only on Development.' }, 403);
  }

  const admin = await getAdminUserFromRequest(request, env);
  if (!admin) return json({ ok: false, code: 'unauthorized', error: 'Unauthorized.' }, 401);

  if (normalizeText(request.headers.get('x-recovery-authorization')) !== AUTHORIZATION) {
    return json({ ok: false, code: 'authorization_required', error: 'Recovery staging authorization is required.' }, 403);
  }

  if (!hasBucket(env.PRODUCT_MEDIA_BUCKET)) {
    return json({ ok: false, code: 'r2_binding_missing', error: 'Development Product R2 binding is unavailable.' }, 500);
  }

  const parsed = parseAuthorizedKey(request.headers.get('x-recovery-key'));
  if (!parsed) {
    return json({ ok: false, code: 'invalid_key', error: 'Only authorized current Product JPEG keys may be staged.' }, 400);
  }

  const expectedSha = normalizeText(request.headers.get('x-recovery-sha256')).toLowerCase();
  const expectedSize = Number(request.headers.get('x-recovery-size'));
  if (!/^[a-f0-9]{64}$/.test(expectedSha) || !Number.isSafeInteger(expectedSize) || expectedSize <= 0 || expectedSize > MAX_BYTES) {
    return json({ ok: false, code: 'invalid_authority', error: 'Expected SHA-256 and byte size are required.' }, 400);
  }

  const bytes = await request.arrayBuffer();
  if (bytes.byteLength !== expectedSize) {
    return json({ ok: false, code: 'source_size_mismatch', key: parsed.key, expected_size: expectedSize, actual_size: bytes.byteLength }, 409);
  }
  const sourceSha = await sha256Hex(bytes);
  if (sourceSha !== expectedSha) {
    return json({ ok: false, code: 'source_sha_mismatch', key: parsed.key, expected_sha256: expectedSha, actual_sha256: sourceSha }, 409);
  }

  const existing = await env.PRODUCT_MEDIA_BUCKET.get(parsed.key);
  if (existing) {
    const existingBytes = await objectBytes(existing);
    const existingSha = await sha256Hex(existingBytes);
    if (existingBytes.byteLength !== expectedSize || existingSha !== expectedSha) {
      return json({
        ok: false,
        code: 'existing_object_conflict',
        key: parsed.key,
        expected_size: expectedSize,
        actual_size: existingBytes.byteLength,
        expected_sha256: expectedSha,
        actual_sha256: existingSha,
      }, 409);
    }
    return json({ ok: true, status: 'already_exact', key: parsed.key, product_id: parsed.productId, size: expectedSize, sha256: expectedSha, d1_mutation: false, r2_delete: false });
  }

  await env.PRODUCT_MEDIA_BUCKET.put(parsed.key, bytes, {
    httpMetadata: {
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=31536000, immutable',
    },
    customMetadata: {
      recovery: 'product-r2-150',
      source: 'verified-google-drive-recovery',
    },
  });

  const written = await env.PRODUCT_MEDIA_BUCKET.get(parsed.key);
  if (!written) return json({ ok: false, code: 'write_missing', key: parsed.key, error: 'Development R2 write was not readable after put.' }, 500);
  const writtenBytes = await objectBytes(written);
  const writtenSha = await sha256Hex(writtenBytes);
  if (writtenBytes.byteLength !== expectedSize || writtenSha !== expectedSha) {
    return json({ ok: false, code: 'write_verification_failed', key: parsed.key, expected_size: expectedSize, actual_size: writtenBytes.byteLength, expected_sha256: expectedSha, actual_sha256: writtenSha }, 500);
  }

  return json({
    ok: true,
    status: 'staged_verified',
    key: parsed.key,
    product_id: parsed.productId,
    size: expectedSize,
    sha256: expectedSha,
    d1_mutation: false,
    r2_delete: false,
    production_mutation: false,
  });
}
