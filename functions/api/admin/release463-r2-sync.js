// Release 463 historical R2 consolidation bridge — RETIRED MUTATION SURFACE.
// Build 62 preserves inventory-only diagnostics for provenance but permanently forbids
// copy/delete mutation. Production R2 business media is Production-owned and must never
// be converged to Development by deleting destination-only objects.
import { getAdminUserFromRequest, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const RELEASE = 463;
const AUTHORIZATION = 'RELEASE463_R2_ENVIRONMENT_SYNC';
const MAX_LIST = 500;
const json = (data, status = 200) => jsonResponse(data, status, { 'Cache-Control': 'no-store' });

function isRelease463DevelopmentHost(request) {
  const host = new URL(request.url).hostname.toLowerCase();
  return host === 'localhost' || host === '127.0.0.1'
    || (host.endsWith('.devilndove-site.pages.dev') && host !== 'devilndove-site.pages.dev')
    || host === 'devilndove-site-dev.pages.dev'
    || host.endsWith('.devilndove-site-dev.pages.dev')
    || host === 'devilndove-build62-r2-probe.pages.dev'
    || host.endsWith('.devilndove-build62-r2-probe.pages.dev');
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

function hasReadBucket(bucket) {
  return bucket && typeof bucket.list === 'function' && typeof bucket.get === 'function';
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

export async function onRequestPost({ request, env }) {
  if (!isRelease463DevelopmentHost(request)) {
    return json({ ok: false, release: RELEASE, code: 'development_only', error: 'Release 463 R2 inventory diagnostics are available only on approved Development or Build 62 recovery-probe hosts.' }, 403);
  }
  const admin = await getAdminUserFromRequest(request, env);
  if (!admin) return json({ ok: false, release: RELEASE, code: 'unauthorized', error: 'Unauthorized.' }, 401);

  const body = await request.json().catch(() => ({}));
  if (normalizeText(body.authorization) !== AUTHORIZATION) {
    return json({ ok: false, release: RELEASE, code: 'authorization_required', error: 'Release 463 R2 inventory authorization is required.' }, 403);
  }
  const key = normalizeText(body.bucket).toLowerCase();
  const pair = bucketPair(env, key);
  if (!pair || !hasReadBucket(pair.source) || !hasReadBucket(pair.destination)) {
    return json({ ok: false, release: RELEASE, code: 'r2_binding_missing', error: 'Required Release 463 source/destination R2 read bindings are unavailable.' }, 500);
  }

  const action = normalizeText(body.action).toLowerCase();
  if (action === 'copy_keys' || action === 'delete_keys') {
    return json({
      ok: false,
      release: RELEASE,
      code: 'historical_r2_mutation_retired',
      error: 'Build 62 permanently retired Release 463 R2 copy/delete mutations. Production destination-only media must be preserved.',
      mutation_capability: 'none',
    }, 410);
  }

  const cursor = normalizeText(body.cursor);
  const limit = Math.max(1, Math.min(MAX_LIST, Math.trunc(Number(body.limit || MAX_LIST)) || MAX_LIST));
  try {
    let outcome;
    if (action === 'inventory_source') outcome = await inventoryBatch(pair.source, cursor, limit);
    else if (action === 'inventory_destination') outcome = await inventoryBatch(pair.destination, cursor, limit);
    else return json({ ok: false, release: RELEASE, code: 'unsupported_action', error: 'Supported actions are inventory_source and inventory_destination only.' }, 400);

    return json({
      ok: true,
      release: RELEASE,
      mode: 'historical_r2_inventory_read_only',
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
      production_r2_mutation: false,
      mutation_capability: 'none',
    });
  } catch (error) {
    return json({
      ok: false,
      release: RELEASE,
      code: 'release463_r2_inventory_failed',
      error: normalizeText(error?.message) || 'Release 463 R2 inventory failed.',
      bucket: key,
      action,
    }, 500);
  }
}
