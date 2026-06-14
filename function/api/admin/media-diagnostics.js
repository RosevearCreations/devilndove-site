// File: /functions/api/admin/media-diagnostics.js
// Brief description: Admin-only R2/product-media configuration and storage health diagnostics.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function safeIdentifier(value) {
  const clean = normalizeText(value);
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(clean) ? clean : '';
}

async function tableExists(db, tableName) {
  try {
    const row = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(tableName).first();
    return !!row;
  } catch {
    return false;
  }
}

async function tableColumns(db, tableName) {
  const safeTable = safeIdentifier(tableName);
  if (!safeTable) return new Set();
  try {
    return new Set(rows(await db.prepare(`PRAGMA table_info(${safeTable})`).all()).map((row) => normalizeText(row.name).toLowerCase()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function safeFirst(db, sql, bindings = [], fallback = {}) {
  try {
    return (await db.prepare(sql).bind(...bindings).first()) || fallback;
  } catch {
    return fallback;
  }
}

async function safeAll(db, sql, bindings = []) {
  try {
    return rows(await db.prepare(sql).bind(...bindings).all());
  } catch {
    return [];
  }
}

const DEFAULT_PRODUCT_MEDIA_PUBLIC_BASE_URL = 'https://assets.devilndove.com';

function getPublicBase(env) {
  return normalizeText(
    env.PRODUCT_MEDIA_PUBLIC_BASE_URL ||
    env.R2_PUBLIC_BASE_URL ||
    env.PUBLIC_R2_BASE_URL ||
    env.ASSET_ORIGIN ||
    DEFAULT_PRODUCT_MEDIA_PUBLIC_BASE_URL
  ).replace(/\/$/, '');
}

function configuredPublicBaseName(env) {
  if (normalizeText(env.PRODUCT_MEDIA_PUBLIC_BASE_URL)) return 'PRODUCT_MEDIA_PUBLIC_BASE_URL';
  if (normalizeText(env.R2_PUBLIC_BASE_URL)) return 'R2_PUBLIC_BASE_URL';
  if (normalizeText(env.PUBLIC_R2_BASE_URL)) return 'PUBLIC_R2_BASE_URL';
  if (normalizeText(env.ASSET_ORIGIN)) return 'ASSET_ORIGIN';
  return 'default_fallback';
}

function findBucketBinding(env) {
  const candidates = [
    ['PRODUCT_MEDIA_BUCKET', env.PRODUCT_MEDIA_BUCKET],
    ['MEDIA_BUCKET', env.MEDIA_BUCKET],
    ['R2_PRODUCT_MEDIA', env.R2_PRODUCT_MEDIA]
  ];
  const found = candidates.find(([, value]) => value && typeof value.put === 'function');
  return found ? { name: found[0], available: true } : { name: '', available: false };
}

async function getLatestMediaSamples(db) {
  if (!db || !(await tableExists(db, 'media_assets'))) return [];
  const cols = await tableColumns(db, 'media_assets');
  const select = [
    cols.has('media_asset_id') ? 'media_asset_id' : 'NULL AS media_asset_id',
    cols.has('product_id') ? 'product_id' : 'NULL AS product_id',
    cols.has('object_key') ? 'object_key' : 'NULL AS object_key',
    cols.has('public_url') ? 'public_url' : 'NULL AS public_url',
    cols.has('original_filename') ? 'original_filename' : 'NULL AS original_filename',
    cols.has('mime_type') ? 'mime_type' : 'NULL AS mime_type',
    cols.has('file_size_bytes') ? 'file_size_bytes' : 'NULL AS file_size_bytes',
    cols.has('created_at') ? 'created_at' : 'NULL AS created_at'
  ];
  return safeAll(db, `SELECT ${select.join(', ')} FROM media_assets ORDER BY ${cols.has('created_at') ? 'datetime(created_at)' : 'media_asset_id'} DESC LIMIT 12`);
}

async function getMediaCounts(db) {
  const counts = {
    media_assets_total: null,
    media_assets_missing_public_url: null,
    media_assets_missing_object_key: null,
    product_images_total: null,
    product_images_missing_url: null,
    products_with_featured_image: null,
    products_total: null,
  };
  if (!db) return counts;
  if (await tableExists(db, 'media_assets')) {
    Object.assign(counts, await safeFirst(db, `
      SELECT COUNT(*) AS media_assets_total,
             SUM(CASE WHEN COALESCE(public_url,'') = '' THEN 1 ELSE 0 END) AS media_assets_missing_public_url,
             SUM(CASE WHEN COALESCE(object_key,'') = '' THEN 1 ELSE 0 END) AS media_assets_missing_object_key
      FROM media_assets
    `, [], counts));
  }
  if (await tableExists(db, 'product_images')) {
    Object.assign(counts, await safeFirst(db, `
      SELECT COUNT(*) AS product_images_total,
             SUM(CASE WHEN COALESCE(image_url,'') = '' THEN 1 ELSE 0 END) AS product_images_missing_url
      FROM product_images
    `, [], counts));
  }
  if (await tableExists(db, 'products')) {
    const productCols = await tableColumns(db, 'products');
    const featuredExpression = productCols.has('featured_image_url') ? "COALESCE(featured_image_url,'') <> ''" : '0';
    Object.assign(counts, await safeFirst(db, `
      SELECT COUNT(*) AS products_total,
             SUM(CASE WHEN ${featuredExpression} THEN 1 ELSE 0 END) AS products_with_featured_image
      FROM products
    `, [], counts));
  }
  return counts;
}

async function tryFetchHead(url) {
  if (!url) return { attempted: false, ok: false, status: 0, error: '' };
  try {
    const response = await fetch(url, { method: 'HEAD', cf: { cacheTtl: 0, cacheEverything: false } });
    return { attempted: true, ok: response.ok, status: response.status, error: response.ok ? '' : `HTTP ${response.status}` };
  } catch (error) {
    return { attempted: true, ok: false, status: 0, error: error?.message || String(error || 'Fetch failed') };
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);

  const db = getDb(env);
  const bucket = findBucketBinding(env);
  const publicBase = getPublicBase(env);
  const publicBaseSource = configuredPublicBaseName(env);
  const latestMedia = await getLatestMediaSamples(db);
  const counts = await getMediaCounts(db);
  const sampleUrl = normalizeText(latestMedia.find((row) => normalizeText(row.public_url))?.public_url || '');
  const verify = new URL(request.url).searchParams.get('verify') === '1';
  const sampleFetch = verify ? await tryFetchHead(sampleUrl) : { attempted: false, ok: false, status: 0, error: '' };

  const warnings = [];
  const failures = [];
  if (!bucket.available) failures.push('No R2 bucket binding was found. Expected PRODUCT_MEDIA_BUCKET, MEDIA_BUCKET, or R2_PRODUCT_MEDIA.');
  if (publicBaseSource === 'default_fallback') warnings.push('No explicit public base URL environment variable was found; uploads will fall back to https://assets.devilndove.com.');
  if (Number(counts.media_assets_missing_public_url || 0) > 0) warnings.push(`${Number(counts.media_assets_missing_public_url || 0)} media asset row(s) do not have a public_url.`);
  if (verify && sampleUrl && !sampleFetch.ok) warnings.push(`Latest media public URL did not pass a HEAD check: ${sampleFetch.error || sampleFetch.status}.`);

  return jsonResponse({
    ok: true,
    generated_at: new Date().toISOString(),
    summary: {
      status: failures.length ? 'fail' : (warnings.length ? 'warning' : 'ok'),
      bucket_binding_ok: bucket.available,
      public_base_url: publicBase,
      public_base_source: publicBaseSource,
      warnings,
      failures,
    },
    diagnostics: {
      bucket_binding: bucket,
      public_base_url: publicBase,
      public_base_source: publicBaseSource,
      expected_upload_endpoint: '/api/admin/media-upload',
      sample_public_url: sampleUrl,
      sample_fetch: sampleFetch,
      fallback_note: publicBaseSource === 'default_fallback'
        ? 'This build still returns public URLs using the safe fallback. Add PRODUCT_MEDIA_PUBLIC_BASE_URL when you want the dashboard to show explicit configuration.'
        : '',
    },
    counts,
    latest_media_assets: latestMedia,
  }, 200, { 'Cache-Control': 'no-store' });
}
