// Devil n Dove Build 440 — Development Tool/Supply R2 restore.
// Runtime Development-only repair path. Uses native D1/R2 bindings: no Wrangler, npm,
// local shell, request-time DDL, D1 mutation, Production R2 mutation, or overwrite path.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD = 440;
const PUBLIC_ORIGIN = 'https://assets.devilndove.com';
const PUBLIC_PREFIX = `${PUBLIC_ORIGIN}/`;
const AUTHORIZATION = 'BUILD440_DEV_R2_RESTORE';
const ALLOWED_PREFIXES = ['Tools/', 'Supplies/'];
const MAX_BATCH = 8;
const MAX_OBJECT_BYTES = 25 * 1024 * 1024;
const json = (data, status = 200) => jsonResponse(data, status, { 'Cache-Control': 'no-store' });
const rows = (result) => Array.isArray(result?.results) ? result.results : [];

function isDevelopmentHost(request) {
  const hostname = new URL(request.url).hostname.toLowerCase();
  return hostname === 'devilndove-site-dev.pages.dev' || hostname === 'localhost' || hostname === '127.0.0.1';
}

function canonicalR2Key(value) {
  const raw = normalizeText(value);
  if (!raw || !raw.toLowerCase().startsWith(PUBLIC_PREFIX.toLowerCase())) return '';
  let key = raw.slice(PUBLIC_PREFIX.length).replace(/^\/+/, '');
  try { key = decodeURIComponent(key); } catch {}
  if (!ALLOWED_PREFIXES.some((prefix) => key.startsWith(prefix))) return '';
  if (!key || key.length > 1024 || key.includes('\0') || key.includes('\r') || key.includes('\n')) return '';
  return key;
}

function encodePathSegment(value) {
  return encodeURIComponent(String(value || '')).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function publicUrlForKey(key) {
  return `${PUBLIC_ORIGIN}/${String(key || '').split('/').map(encodePathSegment).join('/')}`;
}

function contentTypeForKey(key, sourceType = '') {
  const source = normalizeText(sourceType).split(';')[0].toLowerCase();
  if (source.startsWith('image/')) return source;
  const lower = String(key || '').toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.avif')) return 'image/avif';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  return '';
}

async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('');
}

function verifiedRestoreMetadata(object, key) {
  const metadata = object?.customMetadata || {};
  return normalizeText(metadata.build440_restore) === 'development_tool_supply'
    && normalizeText(metadata.build440_source_key) === key
    && /^[0-9a-f]{64}$/i.test(normalizeText(metadata.build440_source_sha256))
    && Number(object?.size || 0) > 0;
}

async function restoreOne(bucket, row) {
  const key = canonicalR2Key(row.image_url);
  if (!key) {
    throw new Error(`Unsupported current D1 image URL for catalog item ${Number(row.catalog_item_id || 0)}.`);
  }

  const existing = await bucket.head(key);
  if (existing) {
    if (!verifiedRestoreMetadata(existing, key)) {
      const error = new Error(`Development R2 already contains an unverified object at ${key}; overwrite refused.`);
      error.code = 'existing_object_unverified';
      throw error;
    }
    return {
      status: 'already_verified',
      catalog_item_id: Number(row.catalog_item_id || 0),
      key,
      bytes: Number(existing.size || 0),
      sha256: normalizeText(existing.customMetadata?.build440_source_sha256),
    };
  }

  const sourceUrl = publicUrlForKey(key);
  const sourceResponse = await fetch(sourceUrl, {
    method: 'GET',
    headers: { 'Accept': 'image/*' },
    redirect: 'follow',
  });
  if (!sourceResponse.ok) {
    const error = new Error(`Public source returned HTTP ${sourceResponse.status} for ${key}.`);
    error.code = 'source_fetch_failed';
    throw error;
  }

  const declaredLength = Number(sourceResponse.headers.get('content-length') || 0);
  if (declaredLength > MAX_OBJECT_BYTES) {
    const error = new Error(`Public source exceeds the ${MAX_OBJECT_BYTES} byte restore limit for ${key}.`);
    error.code = 'source_too_large';
    throw error;
  }

  const buffer = await sourceResponse.arrayBuffer();
  if (!buffer.byteLength || buffer.byteLength > MAX_OBJECT_BYTES) {
    const error = new Error(`Public source has invalid byte length for ${key}.`);
    error.code = 'source_size_invalid';
    throw error;
  }

  const contentType = contentTypeForKey(key, sourceResponse.headers.get('content-type') || '');
  if (!contentType || !contentType.startsWith('image/')) {
    const error = new Error(`Public source is not a supported image for ${key}.`);
    error.code = 'source_content_type_invalid';
    throw error;
  }

  const sha256 = await sha256Hex(buffer);

  // Re-check immediately before PUT. An object that appeared during source fetch is
  // never overwritten by this repair path.
  const beforePut = await bucket.head(key);
  if (beforePut) {
    if (!verifiedRestoreMetadata(beforePut, key)) {
      const error = new Error(`Development R2 object appeared during restore for ${key}; overwrite refused.`);
      error.code = 'concurrent_object_unverified';
      throw error;
    }
    return {
      status: 'already_verified',
      catalog_item_id: Number(row.catalog_item_id || 0),
      key,
      bytes: Number(beforePut.size || 0),
      sha256: normalizeText(beforePut.customMetadata?.build440_source_sha256),
    };
  }

  await bucket.put(key, buffer, {
    httpMetadata: {
      contentType,
      cacheControl: 'public, max-age=14400',
    },
    customMetadata: {
      build440_restore: 'development_tool_supply',
      build440_source_host: 'assets.devilndove.com',
      build440_source_key: key,
      build440_source_sha256: sha256,
    },
  });

  const verified = await bucket.head(key);
  if (!verified || Number(verified.size || 0) !== buffer.byteLength || !verifiedRestoreMetadata(verified, key)
      || normalizeText(verified.customMetadata?.build440_source_sha256).toLowerCase() !== sha256.toLowerCase()) {
    const error = new Error(`Post-write Development R2 verification failed for ${key}.`);
    error.code = 'post_write_verification_failed';
    throw error;
  }

  return {
    status: 'restored_verified',
    catalog_item_id: Number(row.catalog_item_id || 0),
    key,
    bytes: buffer.byteLength,
    sha256,
  };
}

export async function onRequestPost({ request, env }) {
  if (!isDevelopmentHost(request)) {
    return json({ ok: false, build: BUILD, code: 'development_only', error: 'Inventory asset restore is available only in Development.' }, 403);
  }

  const db = getDb(env);
  if (!db) return json({ ok: false, build: BUILD, code: 'db_binding_missing', error: 'Database binding is not configured.' }, 500);
  const bucket = env.PRODUCT_MEDIA_BUCKET;
  if (!bucket || typeof bucket.head !== 'function' || typeof bucket.put !== 'function') {
    return json({ ok: false, build: BUILD, code: 'product_media_bucket_missing', error: 'PRODUCT_MEDIA_BUCKET binding is not configured.' }, 500);
  }

  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, build: BUILD, code: 'unauthorized', error: 'Unauthorized.' }, 401);

  const body = await request.json().catch(() => ({}));
  if (normalizeText(body.authorization) !== AUTHORIZATION) {
    return json({ ok: false, build: BUILD, code: 'authorization_required', error: 'Development R2 restore authorization is required.' }, 403);
  }
  if (normalizeText(body.action) !== 'restore_batch') {
    return json({ ok: false, build: BUILD, code: 'unsupported_action', error: 'Unsupported restore action.' }, 400);
  }

  const cursor = Math.max(0, Math.trunc(Number(body.cursor || 0)) || 0);
  const limit = Math.max(1, Math.min(MAX_BATCH, Math.trunc(Number(body.limit || MAX_BATCH)) || MAX_BATCH));

  try {
    const batchRows = rows(await db.prepare(`
      SELECT catalog_item_id,item_kind,source_key,name,image_url
      FROM catalog_items
      WHERE item_kind IN ('tool','supply')
        AND COALESCE(status,'active')='active'
        AND TRIM(COALESCE(image_url,''))<>''
        AND catalog_item_id>?
      ORDER BY catalog_item_id ASC
      LIMIT ?
    `).bind(cursor, limit).all());

    if (!batchRows.length) {
      return json({
        ok: true,
        build: BUILD,
        mode: 'development_inventory_asset_restore',
        destination: 'PRODUCT_MEDIA_BUCKET',
        source: PUBLIC_ORIGIN,
        mutation_scope: 'development_r2_missing_objects_only',
        d1_mutation: false,
        production_mutation: false,
        cursor,
        next_cursor: cursor,
        done: true,
        batch: { processed: 0, restored_verified: 0, already_verified: 0, bytes_restored: 0 },
        results: [],
      });
    }

    const results = [];
    for (const row of batchRows) {
      results.push(await restoreOne(bucket, row));
    }

    const nextCursor = Number(batchRows[batchRows.length - 1]?.catalog_item_id || cursor);
    const restored = results.filter((entry) => entry.status === 'restored_verified');
    const already = results.filter((entry) => entry.status === 'already_verified');

    return json({
      ok: true,
      build: BUILD,
      mode: 'development_inventory_asset_restore',
      destination: 'PRODUCT_MEDIA_BUCKET',
      source: PUBLIC_ORIGIN,
      mutation_scope: 'development_r2_missing_objects_only',
      d1_mutation: false,
      production_mutation: false,
      cursor,
      next_cursor: nextCursor,
      done: batchRows.length < limit,
      batch: {
        processed: results.length,
        restored_verified: restored.length,
        already_verified: already.length,
        bytes_restored: restored.reduce((total, entry) => total + Number(entry.bytes || 0), 0),
      },
      results,
    });
  } catch (error) {
    return json({
      ok: false,
      build: BUILD,
      code: normalizeText(error?.code) || 'inventory_asset_restore_failed',
      error: normalizeText(error?.message) || 'Development inventory asset restore failed.',
      mutation_scope: 'development_r2_missing_objects_only',
      d1_mutation: false,
      production_mutation: false,
      cursor,
    }, 500);
  }
}

export { canonicalR2Key, publicUrlForKey, isDevelopmentHost, sha256Hex };
