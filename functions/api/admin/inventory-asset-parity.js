// Devil n Dove Build 440 — Development Tool/Supply R2 parity diagnostic.
// Admin-authenticated, user-triggered, read-only. No R2/D1 mutation and no schema repair.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD = 440;
const PUBLIC_ASSET_PREFIX = 'https://assets.devilndove.com/';
const PREFIXES = ['Tools/', 'Supplies/'];
const MAX_R2_PAGES_PER_PREFIX = 5;
const R2_PAGE_LIMIT = 1000;
const MAX_MISSING_SAMPLE = 80;
const json = (data, status = 200) => jsonResponse(data, status, { 'Cache-Control': 'no-store' });
const rows = (result) => Array.isArray(result?.results) ? result.results : [];

function isDevelopmentHost(request) {
  const hostname = new URL(request.url).hostname.toLowerCase();
  return hostname === 'devilndove-site-dev.pages.dev' || hostname === 'localhost' || hostname === '127.0.0.1';
}

function canonicalR2Key(value) {
  const raw = normalizeText(value);
  if (!raw) return '';
  let key = raw;
  if (raw.toLowerCase().startsWith(PUBLIC_ASSET_PREFIX)) key = raw.slice(PUBLIC_ASSET_PREFIX.length);
  if (!PREFIXES.some((prefix) => key.startsWith(prefix))) return '';
  try { return decodeURIComponent(key); } catch { return key; }
}

async function listPrefix(bucket, prefix) {
  const keys = [];
  let cursor = undefined;
  let pages = 0;
  let truncated = false;
  while (pages < MAX_R2_PAGES_PER_PREFIX) {
    pages += 1;
    const page = await bucket.list({ prefix, limit: R2_PAGE_LIMIT, ...(cursor ? { cursor } : {}) });
    for (const object of Array.isArray(page?.objects) ? page.objects : []) {
      if (object?.key) keys.push(String(object.key));
    }
    if (!page?.truncated || !page?.cursor) {
      truncated = false;
      break;
    }
    truncated = true;
    cursor = page.cursor;
  }
  return { keys, pages, truncated };
}

export async function onRequestGet({ request, env }) {
  if (!isDevelopmentHost(request)) {
    return json({ ok: false, build: BUILD, code: 'development_only', error: 'Inventory asset parity is available only in Development.', mutation_capability: 'none' }, 403);
  }

  const db = getDb(env);
  if (!db) return json({ ok: false, build: BUILD, code: 'db_binding_missing', error: 'Database binding is not configured.', mutation_capability: 'none' }, 500);
  const bucket = env.PRODUCT_MEDIA_BUCKET;
  if (!bucket || typeof bucket.list !== 'function') {
    return json({ ok: false, build: BUILD, code: 'product_media_bucket_missing', error: 'PRODUCT_MEDIA_BUCKET binding is not configured.', mutation_capability: 'none' }, 500);
  }
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, build: BUILD, error: 'Unauthorized.', mutation_capability: 'none' }, 401);

  try {
    const catalog = rows(await db.prepare(`
      SELECT catalog_item_id,item_kind,source_key,name,image_url
      FROM catalog_items
      WHERE item_kind IN ('tool','supply')
        AND COALESCE(status,'active')='active'
      ORDER BY item_kind ASC,catalog_item_id ASC
      LIMIT 1200
    `).all());

    const expected = new Map();
    let blankImageUrl = 0;
    let unsupportedImageUrl = 0;
    for (const row of catalog) {
      const raw = normalizeText(row.image_url);
      if (!raw) {
        blankImageUrl += 1;
        continue;
      }
      const key = canonicalR2Key(raw);
      if (!key) {
        unsupportedImageUrl += 1;
        continue;
      }
      if (!expected.has(key)) expected.set(key, []);
      expected.get(key).push({
        catalog_item_id: Number(row.catalog_item_id || 0),
        item_kind: row.item_kind || '',
        source_key: row.source_key || '',
        name: row.name || '',
        image_url: raw,
      });
    }

    const [toolObjects, supplyObjects] = await Promise.all([
      listPrefix(bucket, 'Tools/'),
      listPrefix(bucket, 'Supplies/'),
    ]);
    const bucketKeys = new Set([...toolObjects.keys, ...supplyObjects.keys]);
    const missingKeys = [...expected.keys()].filter((key) => !bucketKeys.has(key)).sort((a, b) => a.localeCompare(b));
    const bucketOnlyKeys = [...bucketKeys].filter((key) => !expected.has(key));
    const missing = missingKeys.slice(0, MAX_MISSING_SAMPLE).map((key) => ({ key, catalog_rows: expected.get(key) || [] }));

    return json({
      ok: true,
      build: BUILD,
      mode: 'development_inventory_asset_parity',
      mutation_capability: 'none',
      environment: 'development',
      authority: {
        catalog: 'D1 catalog_items',
        r2: 'PRODUCT_MEDIA_BUCKET',
        public_origin_reference: 'https://assets.devilndove.com',
      },
      summary: {
        catalog_rows: catalog.length,
        blank_image_url_rows: blankImageUrl,
        unsupported_image_url_rows: unsupportedImageUrl,
        expected_unique_keys: expected.size,
        r2_tool_keys: toolObjects.keys.length,
        r2_supply_keys: supplyObjects.keys.length,
        r2_unique_keys: bucketKeys.size,
        present_unique_keys: expected.size - missingKeys.length,
        missing_unique_keys: missingKeys.length,
        bucket_only_keys: bucketOnlyKeys.length,
        listing_truncated: Boolean(toolObjects.truncated || supplyObjects.truncated),
      },
      listing: {
        tools: { pages: toolObjects.pages, truncated: toolObjects.truncated },
        supplies: { pages: supplyObjects.pages, truncated: supplyObjects.truncated },
      },
      missing_sample_limit: MAX_MISSING_SAMPLE,
      missing,
    });
  } catch (error) {
    return json({
      ok: false,
      build: BUILD,
      code: 'inventory_asset_parity_failed',
      error: normalizeText(error?.message) || 'Inventory asset parity could not be calculated.',
      mutation_capability: 'none',
    }, 500);
  }
}

export { canonicalR2Key, isDevelopmentHost };
