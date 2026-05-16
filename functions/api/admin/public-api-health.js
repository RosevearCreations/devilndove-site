// File: /functions/api/admin/public-api-health.js
// Brief description: Admin-only health runner for public JSON endpoints used by shop, gallery, tools, supplies, and product detail pages.

import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

function normalizeText(value) {
  return String(value == null ? '' : value).trim();
}

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function tableHasColumn(db, tableName, columnName) {
  try {
    await db.prepare(`SELECT ${columnName} FROM ${tableName} LIMIT 0`).all();
    return true;
  } catch {
    return false;
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
    details: {}
  };

  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
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
    result.ok = response.ok && (data?.ok !== false);
    result.authority = normalizeText(data?.summary?.authority || data?.authority || '');
    result.warning = normalizeText(data?.warning || (Array.isArray(data?.diagnostics?.warnings) ? data.diagnostics.warnings.join(', ') : ''));
    result.error = normalizeText(data?.error || data?.error_detail || '');
    if (Array.isArray(data?.products)) result.count = data.products.length;
    else if (Array.isArray(data?.items)) result.count = data.items.length;
    else if (Array.isArray(data)) result.count = data.length;
    else if (data?.product) result.count = 1;
    result.details = {
      returned_ok: data?.ok,
      has_warning: !!result.warning,
      has_error_detail: !!result.error
    };
  } catch (error) {
    result.duration_ms = Date.now() - started;
    result.error = error?.message || String(error || 'Fetch failed');
  }
  return result;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);

  const db = getDb(env);
  const sampleSlug = await findSampleSlug(db);
  const endpoints = [
    { key: 'products', label: 'Public products list', path: '/api/products?limit=12' },
    { key: 'catalog_items_tools', label: 'Catalog items: tools', path: '/api/catalog-items?item_kind=tool&limit=5' },
    { key: 'catalog_items_supplies', label: 'Catalog items: supplies', path: '/api/catalog-items?item_kind=supply&limit=5' },
    { key: 'tools', label: 'Public tools JSON/API', path: '/api/tools' },
    { key: 'supplies', label: 'Public supplies JSON/API', path: '/api/supplies' }
  ];
  if (sampleSlug) endpoints.splice(1, 0, { key: 'product_detail', label: 'Product detail sample', path: `/api/product-detail?slug=${encodeURIComponent(sampleSlug)}` });

  const results = [];
  for (const endpoint of endpoints) {
    results.push(await fetchEndpoint(request, endpoint));
  }
  const failCount = results.filter((row) => !row.ok).length;
  const warnCount = results.filter((row) => row.ok && (row.warning || row.error)).length;

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
    results
  }, 200, { 'Cache-Control': 'no-store' });
}
