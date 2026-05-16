// File: /functions/api/admin/public-api-health.js
// Brief description: Admin-only health runner for public JSON/text endpoints used by shop, gallery, tools, supplies, sitemap, and product detail pages.

import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

function normalizeText(value) {
  return String(value == null ? '' : value).trim();
}

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function safeIdentifier(value) {
  const clean = normalizeText(value);
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(clean) ? clean : '';
}

async function tableHasColumn(db, tableName, columnName) {
  const safeTable = safeIdentifier(tableName);
  const safeColumn = safeIdentifier(columnName);
  if (!safeTable || !safeColumn) return false;
  try {
    await db.prepare(`SELECT ${safeColumn} FROM ${safeTable} LIMIT 0`).all();
    return true;
  } catch {
    return false;
  }
}

async function tableExists(db, tableName) {
  try {
    const row = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(tableName).first();
    return !!row;
  } catch {
    return false;
  }
}

async function tableCount(db, tableName) {
  const safeTable = safeIdentifier(tableName);
  if (!safeTable || !await tableExists(db, safeTable)) return null;
  try {
    const row = await db.prepare(`SELECT COUNT(*) AS total FROM ${safeTable}`).first();
    return Number(row?.total || 0);
  } catch {
    return null;
  }
}

async function findSampleSlug(db) {
  if (!db) return '';
  const hasSlug = await tableHasColumn(db, 'products', 'slug');
  if (!hasSlug) return '';
  const hasStatus = await tableHasColumn(db, 'products', 'status');
  try {
    const sql = hasStatus
      ? "SELECT slug FROM products WHERE COALESCE(status,'active')='active' AND COALESCE(slug,'') <> '' ORDER BY product_id DESC LIMIT 1"
      : "SELECT slug FROM products WHERE COALESCE(slug,'') <> '' ORDER BY product_id DESC LIMIT 1";
    const row = await db.prepare(sql).first();
    return normalizeText(row?.slug).toLowerCase();
  } catch {
    return '';
  }
}

function getCountFromJson(data) {
  if (Array.isArray(data?.products)) return data.products.length;
  if (Array.isArray(data?.items)) return data.items.length;
  if (Array.isArray(data?.tools)) return data.tools.length;
  if (Array.isArray(data?.supplies)) return data.supplies.length;
  if (Array.isArray(data?.events)) return data.events.length;
  if (Array.isArray(data)) return data.length;
  if (data?.product) return 1;
  return null;
}

function endpointStatus(endpoint, response, text, data) {
  const contentType = response.headers.get('content-type') || '';
  const isJsonLike = contentType.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[');
  if (!response.ok) return { ok: false, error: `HTTP ${response.status}` };
  if (endpoint.expected_type === 'xml') {
    return { ok: /<urlset|<sitemapindex/i.test(text), error: /<urlset|<sitemapindex/i.test(text) ? '' : 'Expected sitemap XML content.' };
  }
  if (endpoint.expected_type === 'text') {
    return { ok: text.length > 0, error: text.length ? '' : 'Expected non-empty text content.' };
  }
  if (endpoint.expected_type === 'html') {
    return { ok: /<html\b/i.test(text), error: /<html\b/i.test(text) ? '' : 'Expected HTML content.' };
  }
  if (!isJsonLike || data == null) return { ok: false, error: 'Expected valid JSON.' };
  if (data?.ok === false) return { ok: false, error: normalizeText(data.error || data.error_detail || 'JSON returned ok:false.') };
  const authority = normalizeText(data?.summary?.authority || data?.authority || '');
  if (authority === 'error') return { ok: false, error: normalizeText(data.error_detail || data.error || 'Endpoint reported authority:error.') };
  return { ok: true, error: '' };
}

async function fetchEndpoint(request, endpoint) {
  const url = new URL(endpoint.path, request.url);
  const started = Date.now();
  const result = {
    key: endpoint.key,
    label: endpoint.label,
    path: url.pathname + url.search,
    status: 0,
    ok: false,
    duration_ms: 0,
    authority: '',
    warning: '',
    error: '',
    count: null,
    expected_type: endpoint.expected_type || 'json',
    next_action: endpoint.next_action || '',
    details: {}
  };

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: endpoint.expected_type === 'html' ? 'text/html' : endpoint.expected_type === 'xml' ? 'application/xml,text/xml' : 'application/json,text/plain,*/*' },
      cf: { cacheTtl: 0, cacheEverything: false }
    });
    result.status = response.status;
    result.duration_ms = Date.now() - started;
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    let data = null;
    if (contentType.includes('application/json') || text.trim().startsWith('{') || text.trim().startsWith('[')) {
      try { data = JSON.parse(text); } catch {}
    }
    const status = endpointStatus(endpoint, response, text, data);
    result.ok = status.ok;
    result.error = status.error || normalizeText(data?.error || data?.error_detail || '');
    result.authority = normalizeText(data?.summary?.authority || data?.authority || '');
    result.warning = normalizeText(data?.warning || (Array.isArray(data?.diagnostics?.warnings) ? data.diagnostics.warnings.join(', ') : ''));
    result.count = getCountFromJson(data);
    result.details = {
      returned_ok: data?.ok,
      has_warning: !!result.warning,
      has_error_detail: !!result.error,
      content_type: contentType,
      byte_length: text.length,
    };
  } catch (error) {
    result.duration_ms = Date.now() - started;
    result.error = error?.message || String(error || 'Fetch failed');
  }
  return result;
}

async function buildDbSnapshot(db) {
  if (!db) return {};
  const snapshot = {};
  for (const table of ['products', 'catalog_items', 'site_item_inventory', 'runtime_incidents', 'schema_migration_ledger']) {
    snapshot[table] = await tableCount(db, table);
  }
  if (await tableExists(db, 'runtime_incidents')) {
    const reviewStatus = await tableHasColumn(db, 'runtime_incidents', 'review_status');
    try {
      const row = await db.prepare(`
        SELECT COUNT(*) AS total
        FROM runtime_incidents
        WHERE datetime(COALESCE(created_at, datetime('now'))) >= datetime('now','-7 days')
          AND LOWER(COALESCE(severity,'warning')) IN ('error','critical')
          ${reviewStatus ? "AND LOWER(COALESCE(review_status,'open')) NOT IN ('resolved','ignored')" : ''}
      `).first();
      snapshot.open_error_incidents_7d = Number(row?.total || 0);
    } catch {}
  }
  return snapshot;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);

  const db = getDb(env);
  const sampleSlug = await findSampleSlug(db);
  const endpoints = [
    { key: 'products', label: 'Public products list', path: '/api/products?limit=12', next_action: 'If authority is fallback, run Storefront Schema Repair and recheck.' },
    { key: 'shop_page', label: 'Shop page HTML', path: '/shop/', expected_type: 'html', next_action: 'If this fails, check redirects, service worker cache, and page assets.' },
    { key: 'gallery_page', label: 'Gallery page HTML', path: '/gallery/', expected_type: 'html', next_action: 'If this fails, check public routes and image URL casing.' },
    { key: 'catalog_items_tools', label: 'Catalog items: tools', path: '/api/catalog-items?item_kind=tool&limit=5', next_action: 'If count is zero, rerun Catalog Sync.' },
    { key: 'catalog_items_supplies', label: 'Catalog items: supplies', path: '/api/catalog-items?item_kind=supply&limit=5', next_action: 'If count is zero, rerun Catalog Sync.' },
    { key: 'tools', label: 'Public tools API', path: '/api/tools', next_action: 'If this fails, verify tools JSON and D1 catalog bridge.' },
    { key: 'supplies', label: 'Public supplies API', path: '/api/supplies', next_action: 'If this fails, verify supplies JSON and D1 catalog bridge.' },
    { key: 'creations', label: 'Public creations API', path: '/api/creations', next_action: 'If empty, confirm products/creations are in D1 or public JSON fallback.' },
    { key: 'community_content', label: 'Community content API', path: '/api/community-content?limit=5', next_action: 'If this fails, check community content tables or fallback JSON.' },
    { key: 'sitemap', label: 'Sitemap XML', path: '/sitemap.xml', expected_type: 'xml', next_action: 'If missing, regenerate sitemap before deploy.' },
    { key: 'robots', label: 'Robots.txt', path: '/robots.txt', expected_type: 'text', next_action: 'If missing, restore robots.txt before deploy.' },
  ];
  if (sampleSlug) endpoints.splice(1, 0, { key: 'product_detail', label: 'Product detail sample', path: `/api/product-detail?slug=${encodeURIComponent(sampleSlug)}`, next_action: 'If this fails, run Storefront Schema Repair and inspect product-detail schema drift.' });

  const results = [];
  for (const endpoint of endpoints) results.push(await fetchEndpoint(request, endpoint));
  const failCount = results.filter((row) => !row.ok).length;
  const warnCount = results.filter((row) => row.ok && (row.warning || row.error || String(row.authority || '').includes('fallback'))).length;

  return jsonResponse({
    ok: true,
    generated_at: new Date().toISOString(),
    sample_slug: sampleSlug || null,
    summary: {
      status: failCount ? 'fail' : (warnCount ? 'warning' : 'ok'),
      endpoint_count: results.length,
      fail_count: failCount,
      warning_count: warnCount,
      pass_count: results.length - failCount - warnCount
    },
    db_snapshot: await buildDbSnapshot(db),
    results
  }, 200, { 'Cache-Control': 'no-store' });
}
