import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
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
  try {
    const rows = normalizeResults(await db.prepare(`PRAGMA table_info(${tableName})`).all());
    return new Set(rows.map((row) => String(row.name || '').toLowerCase()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function publicJsonCheck(request, path) {
  const url = new URL(path, request.url);
  try {
    const headers = { Accept: 'application/json' };
    const cookie = request.headers.get('Cookie');
    const authorization = request.headers.get('Authorization');
    if (cookie) headers.Cookie = cookie;
    if (authorization) headers.Authorization = authorization;
    const response = await fetch(url.toString(), { headers, cf: { cacheTtl: 0, cacheEverything: false } });
    const data = await response.json().catch(() => null);
    return { ok: response.ok && data?.ok !== false, status: response.status, authority: data?.summary?.authority || data?.authority || '', warning: data?.warning || '', error: data?.error || data?.error_detail || '' };
  } catch (error) {
    return { ok: false, status: 0, error: error?.message || String(error || 'Fetch failed') };
  }
}

async function safeFirst(db, sql, bindings = [], fallback = {}) {
  try { return (await db.prepare(sql).bind(...bindings).first()) || fallback; }
  catch { return fallback; }
}

async function safeAll(db, sql, bindings = []) {
  try { return normalizeResults(await db.prepare(sql).bind(...bindings).all()); }
  catch { return []; }
}

function addCheck(checks, status, label, detail, action = '', severity = 'info') {
  checks.push({
    status,
    label,
    detail,
    action,
    severity: status === 'fail' ? 'error' : severity,
  });
}

async function checkPublicPage(request, path) {
  const url = new URL(path, request.url);
  const result = { path, ok: false, status_code: 0, h1_count: 0, has_title: false, has_meta_description: false, title: '', meta_description: '' };
  try {
    const response = await fetch(url.toString(), { cf: { cacheTtl: 0, cacheEverything: false } });
    result.status_code = response.status;
    const text = await response.text().catch(() => '');
    result.ok = response.ok;
    result.h1_count = (text.match(/<h1\b/gi) || []).length;
    const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const metaMatch = text.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)
      || text.match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
    result.has_title = !!titleMatch;
    result.has_meta_description = !!metaMatch;
    result.title = normalizeText(titleMatch?.[1] || '');
    result.meta_description = normalizeText(metaMatch?.[1] || '');
  } catch (error) {
    result.error = String(error?.message || error || 'Fetch failed');
  }
  return result;
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);

  const checks = [];
  const pagesToCheck = ['/', '/about/', '/gallery/', '/creations/', '/shop/', '/collections/', '/contact/', '/events/', '/movies/', '/members/'];
  const pageChecks = await Promise.all(pagesToCheck.map((path) => checkPublicPage(context.request, path)));

  const badPages = pageChecks.filter((row) => !row.ok || row.h1_count !== 1 || !row.has_title || !row.has_meta_description);
  addCheck(
    checks,
    badPages.length ? 'fail' : 'pass',
    'Public page title/meta/H1 check',
    badPages.length ? `${badPages.length} public page(s) need attention.` : `${pageChecks.length} public page(s) passed title/meta/one-H1 checks.`,
    badPages.length ? 'Review page_checks for missing titles, descriptions, failed fetches, or H1 counts not equal to 1.' : '',
    'error'
  );

  const catalogExists = await tableExists(db, 'catalog_items');
  const inventoryExists = await tableExists(db, 'site_item_inventory');
  if (!catalogExists) addCheck(checks, 'fail', 'catalog_items table', 'catalog_items is missing.', 'Apply the catalog schema before deploying.', 'error');
  if (!inventoryExists) addCheck(checks, 'fail', 'site_item_inventory table', 'site_item_inventory is missing.', 'Run the current migration and admin inventory sync.', 'error');

  const catalogCounts = catalogExists ? await safeAll(db, `
    SELECT item_kind, COUNT(*) AS total,
           SUM(CASE WHEN COALESCE(amazon_url,'') <> '' THEN 1 ELSE 0 END) AS with_amazon_url
    FROM catalog_items
    WHERE item_kind IN ('tool','supply')
    GROUP BY item_kind
  `) : [];

  const inventoryCounts = inventoryExists ? await safeAll(db, `
    SELECT source_type, COUNT(*) AS total,
           SUM(CASE WHEN COALESCE(amazon_url,'') <> '' THEN 1 ELSE 0 END) AS with_amazon_url,
           SUM(CASE WHEN COALESCE(unit_cost_cents,0) > 0 THEN 1 ELSE 0 END) AS with_unit_cost,
           SUM(CASE WHEN COALESCE(on_hand_quantity,0) >= 1 THEN 1 ELSE 0 END) AS in_stock_rows,
           SUM(CASE WHEN COALESCE(usage_units_per_stock_unit,1) > 1 THEN 1 ELSE 0 END) AS package_sized_rows
    FROM site_item_inventory
    WHERE source_type IN ('tool','supply')
    GROUP BY source_type
  `) : [];

  const catalogTotals = Object.fromEntries(catalogCounts.map((row) => [row.item_kind, row]));
  const inventoryTotals = Object.fromEntries(inventoryCounts.map((row) => [row.source_type, row]));
  const expectedTool = Number(catalogTotals.tool?.total || 0);
  const expectedSupply = Number(catalogTotals.supply?.total || 0);
  const invTool = Number(inventoryTotals.tool?.total || 0);
  const invSupply = Number(inventoryTotals.supply?.total || 0);

  addCheck(
    checks,
    expectedTool && expectedSupply ? 'pass' : 'fail',
    'Catalog Tools/Supplies counts',
    `catalog_items has ${expectedTool} tool(s) and ${expectedSupply} supply item(s).`,
    expectedTool && expectedSupply ? '' : 'Run /api/admin/catalog-sync after deploying the JSON-backed catalog.',
    'error'
  );

  addCheck(
    checks,
    expectedTool === invTool && expectedSupply === invSupply && invTool > 0 && invSupply > 0 ? 'pass' : 'fail',
    'Inventory sync count match',
    `site_item_inventory has ${invTool}/${expectedTool} tools and ${invSupply}/${expectedSupply} supplies.`,
    'Open /admin/catalog/ and click Sync all tools + supplies if these counts differ.',
    'error'
  );

  const inventoryNotInStock = inventoryExists ? await safeFirst(db, `
    SELECT COUNT(*) AS total
    FROM site_item_inventory
    WHERE source_type IN ('tool','supply')
      AND COALESCE(on_hand_quantity,0) < 1
  `) : { total: 0 };
  addCheck(
    checks,
    Number(inventoryNotInStock.total || 0) === 0 ? 'pass' : 'warn',
    'Inventory default stock',
    `${Number(inventoryNotInStock.total || 0)} tool/supply row(s) still have stock below 1.`,
    'Rerun the inventory sync or run the stock/unit quick fix SQL.',
    'warning'
  );

  const imbalance = await tableExists(db, 'accounting_journal_entries') ? await safeFirst(db, `
    SELECT COUNT(*) AS entry_count, COALESCE(SUM(ABS(imbalance_cents)),0) AS total_imbalance_cents
    FROM accounting_journal_entries
    WHERE COALESCE(imbalance_cents,0) != 0
  `) : { entry_count: 0, total_imbalance_cents: 0 };
  addCheck(
    checks,
    Number(imbalance.entry_count || 0) === 0 ? 'pass' : 'fail',
    'Journal balance validation',
    `${Number(imbalance.entry_count || 0)} journal entr${Number(imbalance.entry_count || 0) === 1 ? 'y is' : 'ies are'} unbalanced.`,
    'Open Accounting > Journal and correct or regenerate unbalanced entries before period close.',
    'error'
  );

  const exceptionRow = await tableExists(db, 'accounting_reconciliation_exceptions') ? await safeFirst(db, `
    SELECT COUNT(*) AS open_count
    FROM accounting_reconciliation_exceptions
    WHERE COALESCE(exception_status,'open') IN ('open','needs_review','needs_accountant')
  `) : { open_count: 0 };
  addCheck(
    checks,
    Number(exceptionRow.open_count || 0) === 0 ? 'pass' : 'warn',
    'Open reconciliation exceptions',
    `${Number(exceptionRow.open_count || 0)} reconciliation exception(s) remain open.`,
    'Review Accounting > Exceptions before final accountant export.',
    'warning'
  );

  let incidentRow = { incident_count: 0 };
  if (await tableExists(db, 'runtime_incidents')) {
    const incidentColumns = await safeAll(db, `PRAGMA table_info(runtime_incidents)`);
    const hasReviewStatus = incidentColumns.some((row) => String(row.name || '').toLowerCase() === 'review_status');
    incidentRow = await safeFirst(db, `
      SELECT COUNT(*) AS incident_count
      FROM runtime_incidents
      WHERE datetime(COALESCE(created_at, datetime('now'))) >= datetime('now','-7 days')
        AND LOWER(COALESCE(severity,'warning')) IN ('error','critical')
        ${hasReviewStatus ? "AND LOWER(COALESCE(review_status,'open')) NOT IN ('resolved','ignored')" : ''}
    `, [], { incident_count: 0 });
  }
  addCheck(
    checks,
    Number(incidentRow.incident_count || 0) === 0 ? 'pass' : 'warn',
    'Recent runtime errors',
    `${Number(incidentRow.incident_count || 0)} error/critical runtime incident(s) recorded in the last 7 days.`,
    'Open Operations > Security/Runtime incidents and group/fix recurring errors.',
    'warning'
  );


  const productColumns = await tableExists(db, 'products') ? await tableColumns(db, 'products') : new Set();
  const missingProductRequired = ['product_id', 'slug', 'name'].filter((column) => !productColumns.has(column));
  const missingProductRecommended = ['status', 'price_cents', 'featured_image_url', 'merchandise_origin', 'sale_channel'].filter((column) => !productColumns.has(column));
  addCheck(
    checks,
    missingProductRequired.length ? 'fail' : (missingProductRecommended.length ? 'warn' : 'pass'),
    'Product schema drift snapshot',
    missingProductRequired.length
      ? `Missing required product column(s): ${missingProductRequired.join(', ')}.`
      : `${missingProductRecommended.length} recommended product storefront column(s) are missing or pending migration.`,
    missingProductRequired.length ? 'Apply product schema migration before relying on the storefront.' : 'Open Operations > D1 Schema Drift Report or Storefront Schema Repair for safe product compatibility columns.',
    missingProductRequired.length ? 'error' : 'warning'
  );


  const missingStorefrontColumns = ['merchandise_origin', 'sale_channel', 'featured_image_url', 'short_description', 'currency', 'requires_shipping'].filter((column) => !productColumns.has(column));
  addCheck(
    checks,
    missingProductRequired.length ? 'fail' : (missingStorefrontColumns.length ? 'warn' : 'pass'),
    'Storefront schema repair readiness',
    missingProductRequired.length
      ? 'The products table is missing required public storefront columns.'
      : `${missingStorefrontColumns.length} safe storefront compatibility column(s) can still be added: ${missingStorefrontColumns.join(', ') || 'none'}.`,
    missingProductRequired.length ? 'Apply the base products schema first.' : 'Open Operations > Storefront Schema Repair and apply safe non-destructive repairs.',
    missingProductRequired.length ? 'error' : 'warning'
  );

  const productApi = await publicJsonCheck(context.request, '/api/products?limit=6');
  addCheck(
    checks,
    productApi.ok && !productApi.error ? (productApi.warning ? 'warn' : 'pass') : 'fail',
    'Public products API health',
    productApi.ok ? `HTTP ${productApi.status}; authority ${productApi.authority || 'not reported'}${productApi.warning ? `; warning: ${productApi.warning}` : ''}.` : `HTTP ${productApi.status}; ${productApi.error || 'Products API failed.'}`,
    'Open Operations > Public API Health. If fallback authority remains, run Storefront Schema Repair, then retest /api/products.',
    productApi.ok ? 'warning' : 'error'
  );




  const mediaDiagnostics = await publicJsonCheck(context.request, '/api/admin/media-diagnostics');
  addCheck(
    checks,
    mediaDiagnostics.ok && !mediaDiagnostics.error ? (mediaDiagnostics.warning ? 'warn' : 'pass') : 'warn',
    'Media/R2 diagnostics endpoint',
    mediaDiagnostics.ok ? `HTTP ${mediaDiagnostics.status}; media diagnostics responded.` : `HTTP ${mediaDiagnostics.status}; ${mediaDiagnostics.error || 'Media diagnostics endpoint could not be checked.'}`,
    'Open Operations > Media / R2 Diagnostics before testing product image upload.',
    'warning'
  );

  const productImageHealth = await publicJsonCheck(context.request, '/api/admin/product-image-health');
  addCheck(
    checks,
    productImageHealth.ok && !productImageHealth.error ? (productImageHealth.warning ? 'warn' : 'pass') : 'warn',
    'Product image health endpoint',
    productImageHealth.ok ? `HTTP ${productImageHealth.status}; product image health responded.` : `HTTP ${productImageHealth.status}; ${productImageHealth.error || 'Product image health endpoint could not be checked.'}`,
    'Open Operations > Product Image Health and patch missing featured/gallery images before publishing.',
    'warning'
  );

  const structuredDataHealth = await publicJsonCheck(context.request, '/api/admin/structured-data-health');
  addCheck(
    checks,
    structuredDataHealth.ok && !structuredDataHealth.error ? (structuredDataHealth.warning ? 'warn' : 'pass') : 'warn',
    'Structured-data health endpoint',
    structuredDataHealth.ok ? `HTTP ${structuredDataHealth.status}; structured-data health endpoint responded.` : `HTTP ${structuredDataHealth.status}; ${structuredDataHealth.error || 'Structured-data health endpoint could not be checked.'}`,
    'Open Operations > Structured Data Health and repair missing JSON-LD/Product readiness warnings.',
    'warning'
  );

  const sitemapPreviewHealth = await publicJsonCheck(context.request, '/api/admin/sitemap-preview');
  addCheck(
    checks,
    sitemapPreviewHealth.ok && !sitemapPreviewHealth.error ? 'pass' : 'warn',
    'Live sitemap preview endpoint',
    sitemapPreviewHealth.ok ? `HTTP ${sitemapPreviewHealth.status}; sitemap preview responded.` : `HTTP ${sitemapPreviewHealth.status}; ${sitemapPreviewHealth.error || 'Sitemap preview endpoint could not be checked.'}`,
    'Open Operations > Live Sitemap Preview and compare product URL count with live products.',
    'warning'
  );

  const searchConsoleHealth = await publicJsonCheck(context.request, '/api/admin/search-console-import');
  addCheck(
    checks,
    searchConsoleHealth.ok && !searchConsoleHealth.error ? 'pass' : 'warn',
    'Search Console import endpoint',
    searchConsoleHealth.ok ? `HTTP ${searchConsoleHealth.status}; Search Console import summary responded.` : `HTTP ${searchConsoleHealth.status}; ${searchConsoleHealth.error || 'Search Console import endpoint could not be checked.'}`,
    'Open Operations > Search Console CSV Import and stage recent page/query exports before changing SEO titles or local wording.',
    'warning'
  );

  const seoActionRows = await tableExists(db, 'seo_opportunity_actions') ? await safeFirst(db, `
    SELECT COUNT(*) AS total,
           SUM(CASE WHEN COALESCE(action_status,'open') IN ('open','in_progress') THEN 1 ELSE 0 END) AS open_count
    FROM seo_opportunity_actions
  `) : { total: 0, open_count: 0 };
  addCheck(
    checks,
    await tableExists(db, 'seo_opportunity_actions') ? 'pass' : 'warn',
    'SEO opportunity action list',
    await tableExists(db, 'seo_opportunity_actions')
      ? `${Number(seoActionRows.total || 0)} private SEO action item(s), ${Number(seoActionRows.open_count || 0)} still open/in progress.`
      : 'seo_opportunity_actions table is not installed yet.',
    'Apply the current migration, then use Operations > Search Console CSV Import to generate reviewable SEO tasks from filtered opportunities.',
    'warning'
  );



  const socialQueueHealth = await publicJsonCheck(context.request, '/api/admin/social-post-queue');
  addCheck(
    checks,
    socialQueueHealth.ok && !socialQueueHealth.error ? 'pass' : 'warn',
    'Social posting queue endpoint',
    socialQueueHealth.ok ? `HTTP ${socialQueueHealth.status}; social queue responded for review-first posting.` : `HTTP ${socialQueueHealth.status}; ${socialQueueHealth.error || 'Social queue endpoint could not be checked.'}`,
    'Open Operations > Social Posting Queue before pushing job/process summaries to Facebook, Instagram, TikTok, X, or other platforms.',
    'warning'
  );

  const socialQueueRows = await tableExists(db, 'social_post_queue') ? await safeFirst(db, `
    SELECT COUNT(*) AS total,
           SUM(CASE WHEN COALESCE(post_status,'draft') IN ('draft','ready') THEN 1 ELSE 0 END) AS open_count,
           SUM(CASE WHEN COALESCE(approval_status,'needs_review')='needs_review' THEN 1 ELSE 0 END) AS needs_review_count
    FROM social_post_queue
  `) : { total: 0, open_count: 0, needs_review_count: 0 };
  addCheck(
    checks,
    await tableExists(db, 'social_post_queue') ? 'pass' : 'warn',
    'Social post review queue',
    await tableExists(db, 'social_post_queue')
      ? `${Number(socialQueueRows.total || 0)} queued social post(s), ${Number(socialQueueRows.open_count || 0)} open, ${Number(socialQueueRows.needs_review_count || 0)} needing review.`
      : 'social_post_queue table is not installed yet.',
    'Apply the current migration, then use Operations > Social Posting Queue for review-first job/process social posts.',
    'warning'
  );

  const storefrontValueDefaults = productColumns.size ? await safeAll(db, `
    SELECT 'status' AS field, COUNT(*) AS missing_count FROM products WHERE ${productColumns.has('status') ? "COALESCE(status,'') = ''" : '0'}
    UNION ALL SELECT 'product_type', COUNT(*) FROM products WHERE ${productColumns.has('product_type') ? "COALESCE(product_type,'') = ''" : '0'}
    UNION ALL SELECT 'merchandise_origin', COUNT(*) FROM products WHERE ${productColumns.has('merchandise_origin') ? "COALESCE(merchandise_origin,'') = ''" : '0'}
    UNION ALL SELECT 'sale_channel', COUNT(*) FROM products WHERE ${productColumns.has('sale_channel') ? "COALESCE(sale_channel,'') = ''" : '0'}
    UNION ALL SELECT 'currency', COUNT(*) FROM products WHERE ${productColumns.has('currency') ? "COALESCE(currency,'') = ''" : '0'}
  `) : [];
  const storefrontDefaultMissing = storefrontValueDefaults.reduce((total, row) => total + Number(row.missing_count || 0), 0);
  addCheck(
    checks,
    storefrontDefaultMissing ? 'warn' : 'pass',
    'Storefront value defaults',
    `${storefrontDefaultMissing} product default value(s) are blank across status, type, origin, sale channel, and currency checks.`,
    'Open Operations > Storefront Value Backfill and apply safe defaults after Storefront Schema Repair.',
    'warning'
  );

  const schemaLedgerRow = await tableExists(db, 'schema_migration_ledger') ? await safeFirst(db, `
    SELECT COUNT(*) AS total,
           SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) AS failed_count,
           SUM(CASE WHEN status='pending_review' THEN 1 ELSE 0 END) AS pending_review_count
    FROM schema_migration_ledger
  `) : { total: 0, failed_count: 0, pending_review_count: 0 };
  addCheck(
    checks,
    Number(schemaLedgerRow.failed_count || 0) === 0 ? 'pass' : 'fail',
    'Migration ledger',
    `${Number(schemaLedgerRow.total || 0)} migration ledger row(s), ${Number(schemaLedgerRow.failed_count || 0)} failed, ${Number(schemaLedgerRow.pending_review_count || 0)} pending review.`,
    'Record applied SQL files in Operations > Migration Ledger after running them in D1.',
    Number(schemaLedgerRow.failed_count || 0) ? 'error' : 'info'
  );

  const failedCount = checks.filter((row) => row.status === 'fail').length;
  const warnCount = checks.filter((row) => row.status === 'warn').length;

  return jsonResponse({
    ok: true,
    generated_at: new Date().toISOString(),
    summary: {
      status: failedCount ? 'fail' : (warnCount ? 'warning' : 'ok'),
      pass_count: checks.filter((row) => row.status === 'pass').length,
      warning_count: warnCount,
      fail_count: failedCount,
    },
    checks,
    page_checks: pageChecks,
    catalog_counts: catalogCounts,
    inventory_counts: inventoryCounts,
  }, failedCount ? 200 : 200, { 'Cache-Control': 'no-store' });
}
