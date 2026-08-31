// Release 463 temporary Development-only R2 consolidation bridge.
// Copies the currently proven Development buckets into the retained Production buckets
// through native Pages R2 bindings. Remove after parity is proven.
import { getAdminUserFromRequest, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const RELEASE = 463;
const AUTHORIZATION = 'RELEASE463_R2_ENVIRONMENT_SYNC';
const MAX_BATCH = 10;
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
  return bucket && typeof bucket.list === 'function' && typeof bucket.head === 'function'
    && typeof bucket.get === 'function' && typeof bucket.put === 'function' && typeof bucket.delete === 'function';
}

function normalizeObject(value) {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
}

function metadataSnapshot(object) {
  return {
    httpMetadata: normalizeObject(object?.httpMetadata),
    customMetadata: normalizeObject(object?.customMetadata),
    storageClass: normalizeText(object?.storageClass) || 'Standard',
  };
}

function sameMetadata(left, right) {
  return JSON.stringify(metadataSnapshot(left)) === JSON.stringify(metadataSnapshot(right));
}

async function copyBatch(source, destination, cursor, limit) {
  const listing = await source.list({ limit, ...(cursor ? { cursor } : {}), include: ['httpMetadata', 'customMetadata'] });
  const results = [];
  for (const object of listing.objects || []) {
    const body = await source.get(object.key);
    if (!body) throw new Error(`Source object disappeared during copy: ${object.key}`);
    await destination.put(object.key, body.body, {
      httpMetadata: body.httpMetadata || object.httpMetadata,
      customMetadata: body.customMetadata || object.customMetadata,
      storageClass: body.storageClass || object.storageClass,
    });
    const check = await destination.head(object.key);
    if (!check || Number(check.size || 0) !== Number(object.size || body.size || 0)) {
      throw new Error(`Destination size verification failed for ${object.key}`);
    }
    if (!sameMetadata(body, check)) throw new Error(`Destination metadata verification failed for ${object.key}`);
    results.push({ key: object.key, bytes: Number(check.size || 0), status: 'copied_verified' });
  }
  return {
    results,
    cursor: listing.truncated ? normalizeText(listing.cursor) : '',
    done: !listing.truncated,
  };
}

async function pruneBatch(source, destination, cursor, limit) {
  const listing = await destination.list({ limit, ...(cursor ? { cursor } : {}) });
  const results = [];
  for (const object of listing.objects || []) {
    const sourceObject = await source.head(object.key);
    if (!sourceObject) {
      await destination.delete(object.key);
      const check = await destination.head(object.key);
      if (check) throw new Error(`Destination prune verification failed for ${object.key}`);
      results.push({ key: object.key, bytes: Number(object.size || 0), status: 'deleted_destination_only' });
    } else {
      results.push({ key: object.key, bytes: Number(object.size || 0), status: 'retained_source_present' });
    }
  }
  return {
    results,
    cursor: listing.truncated ? normalizeText(listing.cursor) : '',
    done: !listing.truncated,
  };
}

async function verifySourceBatch(source, destination, cursor, limit) {
  const listing = await source.list({ limit, ...(cursor ? { cursor } : {}), include: ['httpMetadata', 'customMetadata'] });
  const results = [];
  for (const object of listing.objects || []) {
    const destinationObject = await destination.head(object.key);
    if (!destinationObject) throw new Error(`Destination object missing: ${object.key}`);
    if (Number(destinationObject.size || 0) !== Number(object.size || 0)) {
      throw new Error(`Destination object size mismatch: ${object.key}`);
    }
    if (!sameMetadata(object, destinationObject)) throw new Error(`Destination object metadata mismatch: ${object.key}`);
    results.push({ key: object.key, bytes: Number(object.size || 0), status: 'source_to_destination_verified' });
  }
  return {
    results,
    cursor: listing.truncated ? normalizeText(listing.cursor) : '',
    done: !listing.truncated,
  };
}

async function verifyDestinationBatch(source, destination, cursor, limit) {
  const listing = await destination.list({ limit, ...(cursor ? { cursor } : {}), include: ['httpMetadata', 'customMetadata'] });
  const results = [];
  for (const object of listing.objects || []) {
    const sourceObject = await source.head(object.key);
    if (!sourceObject) throw new Error(`Destination-only object remains after prune: ${object.key}`);
    if (Number(sourceObject.size || 0) !== Number(object.size || 0)) {
      throw new Error(`Source/destination size mismatch: ${object.key}`);
    }
    if (!sameMetadata(sourceObject, object)) throw new Error(`Source/destination metadata mismatch: ${object.key}`);
    results.push({ key: object.key, bytes: Number(object.size || 0), status: 'destination_to_source_verified' });
  }
  return {
    results,
    cursor: listing.truncated ? normalizeText(listing.cursor) : '',
    done: !listing.truncated,
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
  const limit = Math.max(1, Math.min(MAX_BATCH, Math.trunc(Number(body.limit || MAX_BATCH)) || MAX_BATCH));
  try {
    let outcome;
    if (action === 'copy') outcome = await copyBatch(pair.source, pair.destination, cursor, limit);
    else if (action === 'prune') outcome = await pruneBatch(pair.source, pair.destination, cursor, limit);
    else if (action === 'verify_source') outcome = await verifySourceBatch(pair.source, pair.destination, cursor, limit);
    else if (action === 'verify_destination') outcome = await verifyDestinationBatch(pair.source, pair.destination, cursor, limit);
    else return json({ ok: false, release: RELEASE, code: 'unsupported_action', error: 'Supported actions are copy, prune, verify_source and verify_destination.' }, 400);

    return json({
      ok: true,
      release: RELEASE,
      mode: 'development_to_production_r2_consolidation',
      bucket: key,
      source: pair.source_name,
      destination: pair.destination_name,
      action,
      processed: outcome.results.length,
      bytes: outcome.results.reduce((sum, item) => sum + Number(item.bytes || 0), 0),
      next_cursor: outcome.cursor,
      done: outcome.done,
      results: outcome.results,
      d1_mutation: false,
      production_r2_mutation: action === 'copy' || action === 'prune',
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
