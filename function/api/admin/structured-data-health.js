// File: /functions/api/admin/structured-data-health.js
// Brief description: Admin-only structured-data health runner for public pages and live product records.

import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

function normalizeText(value) {
  return String(value == null ? '' : value).trim();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function absoluteUrl(request, path) {
  return new URL(path, request.url).toString();
}

function extractJsonLdBlocks(html) {
  const blocks = [];
  const regex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html))) {
    const raw = String(match[1] || '').trim();
    if (!raw) continue;
    try {
      blocks.push({ ok: true, value: JSON.parse(raw), raw_length: raw.length });
    } catch (error) {
      blocks.push({ ok: false, error: String(error?.message || error || 'Invalid JSON-LD'), raw_length: raw.length });
    }
  }
  return blocks;
}

function flattenSchemaTypes(value) {
  const types = new Set();
  function walk(node) {
    if (!node || typeof node !== 'object') return;
    const type = node['@type'];
    if (Array.isArray(type)) type.forEach((entry) => { if (entry) types.add(String(entry)); });
    else if (type) types.add(String(type));
    if (Array.isArray(node['@graph'])) node['@graph'].forEach(walk);
  }
  walk(value);
  return Array.from(types).sort((a, b) => a.localeCompare(b));
}

async function fetchText(request, path, expectedType = 'html') {
  const url = absoluteUrl(request, path);
  const started = Date.now();
  const result = { path, status: 0, ok: false, duration_ms: 0, byte_length: 0, error: '', text: '' };
  try {
    const response = await fetch(url, {
      headers: { Accept: expectedType === 'json' ? 'application/json,text/plain,*/*' : 'text/html,application/xhtml+xml,*/*' },
      cf: { cacheTtl: 0, cacheEverything: false }
    });
    result.status = response.status;
    result.duration_ms = Date.now() - started;
    result.text = await response.text();
    result.byte_length = result.text.length;
    result.ok = response.ok;
    if (!response.ok) result.error = `HTTP ${response.status}`;
  } catch (error) {
    result.duration_ms = Date.now() - started;
    result.error = String(error?.message || error || 'Fetch failed');
  }
  return result;
}

function scorePage(path, label, fetchResult, requiredTypes = []) {
  const blocks = fetchResult.ok ? extractJsonLdBlocks(fetchResult.text) : [];
  const parsedBlocks = blocks.filter((block) => block.ok);
  const types = parsedBlocks.flatMap((block) => flattenSchemaTypes(block.value));
  const typeSet = new Set(types);
  const missingTypes = requiredTypes.filter((type) => !typeSet.has(type));
  const invalidBlocks = blocks.filter((block) => !block.ok);
  const status = !fetchResult.ok || !blocks.length || invalidBlocks.length || missingTypes.length ? 'warn' : 'pass';
  return {
    key: label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
    label,
    path,
    status,
    http_status: fetchResult.status,
    duration_ms: fetchResult.duration_ms,
    json_ld_blocks: blocks.length,
    invalid_json_ld_blocks: invalidBlocks.length,
    schema_types: Array.from(new Set(types)).sort((a, b) => a.localeCompare(b)),
    missing_required_types: missingTypes,
    error: fetchResult.error || (blocks.length ? '' : 'No JSON-LD block found.'),
    next_action: missingTypes.length
      ? `Add or repair JSON-LD type(s): ${missingTypes.join(', ')}.`
      : invalidBlocks.length
        ? 'Fix invalid JSON-LD syntax on this page.'
        : !blocks.length
          ? 'Add a compact WebPage/CollectionPage JSON-LD block.'
          : 'No immediate action.'
  };
}

function productReadiness(product) {
  const missing = [];
  if (!normalizeText(product?.name)) missing.push('name');
  if (!normalizeText(product?.slug)) missing.push('slug');
  if (!normalizeText(product?.currency)) missing.push('currency');
  if (Number(product?.price_cents || 0) <= 0) missing.push('price_cents');
  if (!normalizeText(product?.featured_image_url)) missing.push('featured_image_url');
  if (!normalizeText(product?.short_description || product?.description || product?.meta_description)) missing.push('description');
  if (!normalizeText(product?.merchandise_origin)) missing.push('merchandise_origin');
  if (!normalizeText(product?.sale_channel)) missing.push('sale_channel');
  return {
    product_id: product?.product_id ?? null,
    slug: product?.slug || '',
    name: product?.name || 'Untitled product',
    status: missing.length ? 'warn' : 'pass',
    missing,
    schema_type: product?.schema_type || 'Product',
    price_cents: Number(product?.price_cents || 0),
    currency: product?.currency || '',
    featured_image_url: product?.featured_image_url || ''
  };
}

async function loadProductReadiness(request) {
  const api = await fetchText(request, '/api/products?limit=25', 'json');
  const summary = { status: 'warn', total_checked: 0, pass_count: 0, warning_count: 0, error: '' };
  if (!api.ok) {
    summary.error = api.error || 'Could not fetch /api/products.';
    return { summary, products: [] };
  }
  let data = null;
  try { data = JSON.parse(api.text); } catch (error) { summary.error = String(error?.message || error || 'Invalid product JSON.'); return { summary, products: [] }; }
  const products = safeArray(data?.products).slice(0, 25).map(productReadiness);
  summary.total_checked = products.length;
  summary.pass_count = products.filter((row) => row.status === 'pass').length;
  summary.warning_count = products.filter((row) => row.status !== 'pass').length;
  summary.status = summary.warning_count ? 'warning' : 'ok';
  return { summary, products, products_authority: data?.summary?.authority || '' };
}

async function buildDbSnapshot(db) {
  if (!db) return {};
  const snapshot = {};
  try {
    const products = await db.prepare('SELECT COUNT(*) AS total FROM products').first();
    snapshot.products = Number(products?.total || 0);
  } catch {}
  try {
    const seo = await db.prepare('SELECT COUNT(*) AS total FROM product_seo').first();
    snapshot.product_seo_rows = Number(seo?.total || 0);
  } catch {}
  return snapshot;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);

  const pages = [
    { label: 'Home', path: '/', required: ['WebSite', 'Organization'] },
    { label: 'Shop', path: '/shop/', required: ['CollectionPage'] },
    { label: 'Gallery', path: '/gallery/', required: ['CollectionPage'] },
    { label: 'About', path: '/about/', required: ['AboutPage', 'Organization'] },
    { label: 'Tools', path: '/tools/', required: ['CollectionPage'] },
    { label: 'Supplies', path: '/supplies/', required: ['CollectionPage'] },
    { label: 'Handmade jewelry Ontario', path: '/handmade-jewelry-ontario/', required: ['WebPage', 'BreadcrumbList'] },
    { label: 'Custom gifts Southern Ontario', path: '/custom-gifts-southern-ontario/', required: ['WebPage', 'BreadcrumbList'] },
    { label: 'Laser engraving Ontario', path: '/laser-engraving-ontario/', required: ['WebPage', 'BreadcrumbList'] },
  ];

  const page_results = [];
  for (const page of pages) {
    const fetched = await fetchText(request, page.path, 'html');
    page_results.push(scorePage(page.path, page.label, fetched, page.required));
  }

  const product_readiness = await loadProductReadiness(request);
  const warnCount = page_results.filter((row) => row.status !== 'pass').length + Number(product_readiness.summary.warning_count || 0);
  const failCount = page_results.filter((row) => !row.http_status || row.http_status >= 500).length;

  return jsonResponse({
    ok: true,
    generated_at: new Date().toISOString(),
    summary: {
      status: failCount ? 'fail' : (warnCount ? 'warning' : 'ok'),
      page_count: page_results.length,
      page_warning_count: page_results.filter((row) => row.status !== 'pass').length,
      product_warning_count: Number(product_readiness.summary.warning_count || 0),
      fail_count: failCount
    },
    db_snapshot: await buildDbSnapshot(getDb(env)),
    page_results,
    product_readiness,
    notes: [
      'Product detail JSON-LD is injected by the browser after /api/product-detail loads, so this check focuses on product-data readiness plus static page JSON-LD.',
      'Use Storefront Value Backfill before approving product SEO work if many products are missing currency, status, origin, or sale-channel defaults.'
    ]
  }, 200, { 'Cache-Control': 'no-store' });
}
