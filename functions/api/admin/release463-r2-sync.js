// Release 463 temporary Development-only R2 consolidation bridge.
// Converges the proven Development buckets into retained Production buckets through
// native Pages R2 bindings. The client computes deltas from paged inventories so the
// Worker never performs hundreds of per-object HEAD calls in one migration phase.
// Remove this bridge after Release 463 cutover proof.
import { getAdminUserFromRequest, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const RELEASE = 463;
const AUTHORIZATION = 'RELEASE463_R2_ENVIRONMENT_SYNC';
const MAX_LIST = 500;
const MAX_COPY_KEYS = 5;
const MAX_DELETE_KEYS = 500;
const json = (data, status = 200) => jsonResponse(data, status, { 'Cache-Control': 'no-store' });

function isRelease463DevelopmentHost(request) {
  const host = new URL(request.url).hostname.toLowerCase();
  return host === 'localhost' || host === '127.0.0.1'
    || (host.endsWith('.devilndove-site.pages.dev') && host !== 'devilndove-site.pages.dev')
    || host === 'devilndove-site-dev.pages.dev'
    || host.endsWith('.devilndove-site-dev.pages.dev');
}

function bucketPair(env, key) {
  if (key === 'product') {
    return {
      source: env.PRODUCT_MEDIA_BUCKET,
      destination: env.RELEASE463_PRODUCT_MEDIA_PROD_BUCKET,
      source_name: 'devilndove-toolshed-images-dev',
      destination_name: 'devilndove-toolshed-images',
    };
  }
  if (key === 'caip') {
    return {
      source: env.CAIP_PRIVATE_MEDIA_BUCKET,
      destination: env.RELEASE463_CAIP_MEDIA_PROD_BUCKET,
      source_name: 'devilndove-caip-media-dev',
      destination_name: 'devilndove-caip-media',
    };
  }
  return null;
}

function hasBucket(bucket) {
  return bucket && typeof bucket.list === 'function' && typeof bucket.get === 'function'
    && typeof bucket.put === 'function' && typeof bucket.delete === 'function';
}

function normalizeObject(value) {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
}

function objectSnapshot(object) {
  return {
    key: normalizeText(object?.key),
    size: Number(object?.size || 0),
    etag: normalizeText(object?.etag),
    httpMetadata: normalizeObject(object?.httpMetadata),
    customMetadata: normalizeObject(object?.customMetadata),
    storageClass: normalizeText(object?.storageClass) || 'Standard',
  };
}

function sameObject(left, right) {
  return JSON.stringify(objectSnapshot(left)) === JSON.stringify(objectSnapshot(right));
}

function normalizedKeys(value, max) {
  if (!Array.isArray(value)) return [];
  const keys = [...new Set(value.map(normalizeText).filter(Boolean))];
  if (keys.length > max) throw new Error(`Too many keys requested; maximum is ${max}.`);
  return keys;
}

async function inventoryBatch(bucket, cursor, limit) {
  const listing = await bucket.list({
    limit,
    ...(cursor ? { cursor } : {}),
    include: ['httpMetadata', 'customMetadata'],
  });
  const results = (listing.objects || []).map(objectSnapshot);
  return {
    results,
    cursor: listing.truncated ? normalizeText(listing.cursor) : '',
    done: !listing.truncated,
  };
}

async function copyKeys(source, destination, requestedKeys) {
  const keys = normalizedKeys(requestedKeys, MAX_COPY_KEYS);
  if (!keys.length) return { results: [], cursor: '', done: true };
  const results = [];
  for (const key of keys) {
    const sourceObject = await source.get(key);
    if (!sourceObject) throw new Error(`Source object missing during delta copy: ${key}`);
    const written = await destination.put(key, sourceObject.body, {
      httpMetadata: sourceObject.httpMetadata,
      customMetadata: sourceObject.customMetadata,
      storageClass: sourceObject.storageClass,
    });
    if (!written) throw new Error(`Destination put returned no object: ${key}`);
    if (!sameObject(sourceObject, written)) {
      throw new Error(`Destination write identity mismatch for ${key}`);
    }
    results.push({ ...objectSnapshot(written), status: 'copied_verified' });
  }
  return { results, cursor: '', done: true };
}

async function deleteKeys(destination, requestedKeys) {
  const keys = normalizedKeys(requestedKeys, MAX_DELETE_KEYS);
  if (!keys.length) return { results: [], cursor: '', done: true };
  await destination.delete(keys);
  return {
    results: keys.map((key) => ({ key, size: 0, etag: '', httpMetadata: {}, customMetadata: {}, storageClass: 'Standard', status: 'deleted_destination_only' })),
    cursor: '',
    done: true,
  };
}

export async function onRequestPost({ request, env }) {
  if (!isRelease463DevelopmentHost(request)) {
    return json({ ok: false, release: RELEASE, code: 'development_only', error: 'Release 463 R2 sync is available only on the Release 463 Development bridge.' }, 403);
  }
  const admin = await getAdminUserFromRequest(request, env);
  if (!admin) return json({ ok: false, release: RELEASE, code: 'unauthorized', error: 'Unauthorized.' }, 401);

  const body = await request.json().catch(() => ({}));
  if (normalizeText(body.authorization) !== AUTHORIZATION) {
    return json({ ok: false, release: RELEASE, code: 'authorization_required', error: 'Release 463 R2 sync authorization is required.' }, 403);
  }
  const key = normalizeText(body.bucket).toLowerCase();
  const pair = bucketPair(env, key);
  if (!pair || !hasBucket(pair.source) || !hasBucket(pair.destination)) {
    return json({ ok: false, release: RELEASE, code: 'r2_binding_missing', error: 'Required Release 463 source/destination R2 bindings are unavailable.' }, 500);
  }

  const action = normalizeText(body.action).toLowerCase();
  const cursor = normalizeText(body.cursor);
  const limit = Math.max(1, Math.min(MAX_LIST, Math.trunc(Number(body.limit || MAX_LIST)) || MAX_LIST));
  try {
    let outcome;
    if (action === 'inventory_source') outcome = await inventoryBatch(pair.source, cursor, limit);
    else if (action === 'inventory_destination') outcome = await inventoryBatch(pair.destination, cursor, limit);
    else if (action === 'copy_keys') outcome = await copyKeys(pair.source, pair.destination, body.keys);
    else if (action === 'delete_keys') outcome = await deleteKeys(pair.destination, body.keys);
    else return json({ ok: false, release: RELEASE, code: 'unsupported_action', error: 'Supported actions are inventory_source, inventory_destination, copy_keys and delete_keys.' }, 400);

    return json({
      ok: true,
      release: RELEASE,
      mode: 'development_to_production_r2_inventory_delta',
      bucket: key,
      source: pair.source_name,
      destination: pair.destination_name,
      action,
      processed: outcome.results.length,
      bytes: outcome.results.reduce((sum, item) => sum + Number(item.size || 0), 0),
      next_cursor: outcome.cursor,
      done: outcome.done,
      results: outcome.results,
      d1_mutation: false,
      production_r2_mutation: action === 'copy_keys' || action === 'delete_keys',
    });
  } catch (error) {
    return json({
      ok: false,
      release: RELEASE,
      code: 'release463_r2_sync_failed',
      error: normalizeText(error?.message) || 'Release 463 R2 sync failed.',
      bucket: key,
      action,
      cursor,
    }, 500);
  }
}
