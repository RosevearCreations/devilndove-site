// Devil n Dove Build 440 — Development Tool/Supply R2 parity diagnostic.
// Admin-authenticated, user-triggered, read-only. Inventory is the operational image
// authority; catalog_items is measured only as drift evidence. No R2/D1 mutation.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD = 440;
const PUBLIC_ASSET_PREFIX = 'https://assets.devilndove.com/';
const PREFIXES = ['Toolshed/', 'Tools/', 'Supplies/'];
const MAX_R2_PAGES_PER_PREFIX = 5;
const R2_PAGE_LIMIT = 1000;
const MAX_MISSING_SAMPLE = 80;
const json = (data, status = 200) => jsonResponse(data, status, { 'Cache-Control': 'no-store' });
const rows = (result) => Array.isArray(result?.results) ? result.results : [];

function isDevelopmentHost(request, env = {}) {
  if (String(env?.DND_ENVIRONMENT || '').trim().toLowerCase() !== 'development') return false;
  const hostname = new URL(request.url).hostname.toLowerCase();
  return hostname === 'dev.devilndove-site.pages.dev'
    || /^[0-9a-f]{8}\.devilndove-site\.pages\.dev$/i.test(hostname)
    || hostname === 'localhost'
    || hostname === '127.0.0.1';
}

function canonicalR2Key(value) {
  const raw = normalizeText(value);
  if (!raw) return '';
  let key = raw;
  if (raw.toLowerCase().startsWith(PUBLIC_ASSET_PREFIX)) key = raw.slice(PUBLIC_ASSET_PREFIX.length);
  key = key.replace(/^\/+/, '');
  try { key = decodeURIComponent(key); } catch {}
  if (!PREFIXES.some((prefix) => key.startsWith(prefix))) return '';
  return key;
}

function identity(kind, key) {
  return `${normalizeText(kind).toLowerCase()}::${normalizeText(key)}`;
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
  if (!isDevelopmentHost(request, env)) {
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
    const [inventoryResult, catalogResult] = await Promise.all([
      db.prepare(`
        SELECT site_item_inventory_id,
               LOWER(TRIM(COALESCE(source_type,''))) AS item_kind,
               external_key AS source_key,
               item_name AS name,
               image_url
        FROM site_item_inventory
        WHERE COALESCE(is_active,1)=1
          AND LOWER(TRIM(COALESCE(source_type,''))) IN ('tool','supply')
        ORDER BY LOWER(TRIM(COALESCE(source_type,''))) ASC, site_item_inventory_id ASC
        LIMIT 1200
      `).all(),
      db.prepare(`
        SELECT catalog_item_id,item_kind,source_key,name,image_url
        FROM catalog_items
        WHERE item_kind IN ('tool','supply')
          AND COALESCE(status,'active')='active'
        ORDER BY item_kind ASC,catalog_item_id ASC
        LIMIT 1200
      `).all(),
    ]);

    const inventory = rows(inventoryResult);
    const catalog = rows(catalogResult);
    const catalogByIdentity = new Map(catalog.map((row) => [identity(row.item_kind, row.source_key), row]));

    const expected = new Map();
    let blankImageUrl = 0;
    let unsupportedImageUrl = 0;
    let catalogBlankImageUrl = 0;
    let inventoryOnlyImageRows = 0;
    let catalogOnlyImageRows = 0;
    let imageAuthorityMismatchRows = 0;

    for (const row of catalog) {
      if (!normalizeText(row.image_url)) catalogBlankImageUrl += 1;
    }

    for (const row of inventory) {
      const raw = normalizeText(row.image_url);
      const key = canonicalR2Key(raw);
      const catalogRow = catalogByIdentity.get(identity(row.item_kind, row.source_key));
      const catalogRaw = normalizeText(catalogRow?.image_url);
      const catalogKey = canonicalR2Key(catalogRaw);

      if (raw && !catalogRaw) inventoryOnlyImageRows += 1;
      if (!raw && catalogRaw) catalogOnlyImageRows += 1;
      if (raw && catalogRaw && key !== catalogKey) imageAuthorityMismatchRows += 1;

      if (!raw) {
        blankImageUrl += 1;
        continue;
      }
      if (!key) {
        unsupportedImageUrl += 1;
        continue;
      }
      if (!expected.has(key)) expected.set(key, []);
      expected.get(key).push({
        site_item_inventory_id: Number(row.site_item_inventory_id || 0),
        item_kind: row.item_kind || '',
        source_key: row.source_key || '',
        name: row.name || '',
        image_url: raw,
      });
    }

    const [toolshedObjects, legacyToolObjects, supplyObjects] = await Promise.all([
      listPrefix(bucket, 'Toolshed/'),
      listPrefix(bucket, 'Tools/'),
      listPrefix(bucket, 'Supplies/'),
    ]);
    const bucketKeys = new Set([...toolshedObjects.keys, ...legacyToolObjects.keys, ...supplyObjects.keys]);
    const missingKeys = [...expected.keys()].filter((key) => !bucketKeys.has(key)).sort((a, b) => a.localeCompare(b));
    const bucketOnlyKeys = [...bucketKeys].filter((key) => !expected.has(key));
    const missing = missingKeys.slice(0, MAX_MISSING_SAMPLE).map((key) => ({ key, authority_rows: expected.get(key) || [] }));

    return json({
      ok: true,
      build: BUILD,
      mode: 'development_inventory_asset_parity',
      mutation_capability: 'none',
      environment: 'development',
      authority: {
        operational_images: 'D1 site_item_inventory',
        catalog_drift_reference: 'D1 catalog_items',
        r2: 'PRODUCT_MEDIA_BUCKET',
        public_origin_reference: 'https://assets.devilndove.com',
        canonical_prefixes: PREFIXES,
      },
      summary: {
        authority_rows: inventory.length,
        inventory_rows: inventory.length,
        catalog_rows: catalog.length,
        blank_image_url_rows: blankImageUrl,
        unsupported_image_url_rows: unsupportedImageUrl,
        catalog_blank_image_url_rows: catalogBlankImageUrl,
        inventory_only_image_rows: inventoryOnlyImageRows,
        catalog_only_image_rows: catalogOnlyImageRows,
        image_authority_mismatch_rows: imageAuthorityMismatchRows,
        expected_unique_keys: expected.size,
        r2_toolshed_keys: toolshedObjects.keys.length,
        r2_legacy_tool_keys: legacyToolObjects.keys.length,
        r2_tool_keys: toolshedObjects.keys.length + legacyToolObjects.keys.length,
        r2_supply_keys: supplyObjects.keys.length,
        r2_unique_keys: bucketKeys.size,
        present_unique_keys: expected.size - missingKeys.length,
        missing_unique_keys: missingKeys.length,
        bucket_only_keys: bucketOnlyKeys.length,
        listing_truncated: Boolean(toolshedObjects.truncated || legacyToolObjects.truncated || supplyObjects.truncated),
      },
      listing: {
        toolshed: { pages: toolshedObjects.pages, truncated: toolshedObjects.truncated },
        tools_legacy: { pages: legacyToolObjects.pages, truncated: legacyToolObjects.truncated },
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
