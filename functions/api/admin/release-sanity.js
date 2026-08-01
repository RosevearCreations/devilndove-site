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

function envText(env, ...names) {
  for (const name of names) {
    const value = normalizeText(env?.[name]);
    if (value) return value;
  }
  return '';
}
function socialApiReadyCount(env = {}) {
  const ready = [];
  if (envText(env, 'FACEBOOK_PAGE_ID', 'META_PAGE_ID') && envText(env, 'FACEBOOK_PAGE_ACCESS_TOKEN', 'META_PAGE_ACCESS_TOKEN')) ready.push('facebook');
  if (envText(env, 'INSTAGRAM_USER_ID', 'IG_USER_ID', 'INSTAGRAM_BUSINESS_ACCOUNT_ID') && envText(env, 'INSTAGRAM_ACCESS_TOKEN', 'META_PAGE_ACCESS_TOKEN', 'FACEBOOK_PAGE_ACCESS_TOKEN')) ready.push('instagram');
  if (envText(env, 'X_USER_ACCESS_TOKEN', 'TWITTER_USER_ACCESS_TOKEN')) ready.push('x');
  if (envText(env, 'PINTEREST_ACCESS_TOKEN') && envText(env, 'PINTEREST_BOARD_ID')) ready.push('pinterest');
  return ready;
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



  const seoOverrideRows = await tableExists(db, 'seo_page_overrides') ? await safeFirst(db, `
    SELECT COUNT(*) AS total,
           SUM(CASE WHEN COALESCE(override_status,'draft') IN ('approved','applied') THEN 1 ELSE 0 END) AS approved_count
    FROM seo_page_overrides
  `) : { total: 0, approved_count: 0 };
  addCheck(
    checks,
    await tableExists(db, 'seo_page_overrides') ? 'pass' : 'warn',
    'Reviewed SEO override apply loop',
    await tableExists(db, 'seo_page_overrides')
      ? `${Number(seoOverrideRows.total || 0)} SEO page override(s), ${Number(seoOverrideRows.approved_count || 0)} approved/applied for public fallback.`
      : 'seo_page_overrides table is not installed yet.',
    'Apply Build 150 schema, then use Operations > Search Console CSV Import to review and apply title/meta/internal-link actions.',
    'warning'
  );

  const trustBlockRows = await tableExists(db, 'trust_block_items') ? await safeFirst(db, `
    SELECT COUNT(*) AS total,
           SUM(CASE WHEN COALESCE(block_status,'draft')='approved' AND COALESCE(is_public,0)=1 THEN 1 ELSE 0 END) AS approved_public_count
    FROM trust_block_items
  `) : { total: 0, approved_public_count: 0 };
  addCheck(
    checks,
    await tableExists(db, 'trust_block_items') ? 'pass' : 'warn',
    'Approved testimonial/local trust blocks',
    await tableExists(db, 'trust_block_items')
      ? `${Number(trustBlockRows.total || 0)} trust block item(s), ${Number(trustBlockRows.approved_public_count || 0)} approved for public display.`
      : 'trust_block_items table is not installed yet.',
    'Apply Build 150 schema, then use Operations > Testimonials / Trust Blocks to publish review-safe proof blocks.',
    'warning'
  );

  const accountingCloseTables = ['accounting_payment_applications', 'accounting_hst_gst_reviews', 'accountant_export_packages'];
  const missingCloseTables = [];
  for (const tableName of accountingCloseTables) {
    if (!await tableExists(db, tableName)) missingCloseTables.push(tableName);
  }
  addCheck(
    checks,
    missingCloseTables.length ? 'warn' : 'pass',
    'Accounting close workflow tables',
    missingCloseTables.length
      ? `Missing Build 150 accounting close table(s): ${missingCloseTables.join(', ')}.`
      : 'Payment application, HST/GST review, and accountant export package tables are installed.',
    'Apply Build 150 schema before relying on Accounting > Close Workflow for month-end review.',
    'warning'
  );

  const trustApiHealth = await publicJsonCheck(context.request, '/api/trust-blocks?context=homepage&limit=4');
  addCheck(
    checks,
    trustApiHealth.ok && !trustApiHealth.error ? 'pass' : 'warn',
    'Public trust blocks endpoint',
    trustApiHealth.ok ? `HTTP ${trustApiHealth.status}; trust blocks endpoint responded.` : `HTTP ${trustApiHealth.status}; ${trustApiHealth.error || 'Trust blocks endpoint could not be checked.'}`,
    'Seed approved trust blocks or confirm the public fallback remains non-breaking when no trust rows exist.',
    'warning'
  );

  const seoOverrideHealth = await publicJsonCheck(context.request, '/api/seo-page-overrides?path=/');
  addCheck(
    checks,
    seoOverrideHealth.ok && !seoOverrideHealth.error ? 'pass' : 'warn',
    'Public SEO override endpoint',
    seoOverrideHealth.ok ? `HTTP ${seoOverrideHealth.status}; SEO override endpoint responded.` : `HTTP ${seoOverrideHealth.status}; ${seoOverrideHealth.error || 'SEO override endpoint could not be checked.'}`,
    'Apply Build 150 schema if this endpoint fails, then apply a reviewed Search Console action for testing.',
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
           SUM(CASE WHEN COALESCE(approval_status,'needs_review')='needs_review' THEN 1 ELSE 0 END) AS needs_review_count,
           SUM(CASE WHEN COALESCE(scheduled_at,'') <> '' AND COALESCE(post_status,'draft') IN ('draft','ready') THEN 1 ELSE 0 END) AS scheduled_count,
           SUM(CASE WHEN COALESCE(last_dry_run_at,'') <> '' THEN 1 ELSE 0 END) AS dry_run_count,
           SUM(CASE WHEN COALESCE(do_not_repost,0)=1 AND COALESCE(post_status,'draft') IN ('draft','ready') THEN 1 ELSE 0 END) AS duplicate_warning_count
    FROM social_post_queue
  `) : { total: 0, open_count: 0, needs_review_count: 0, scheduled_count: 0, dry_run_count: 0, duplicate_warning_count: 0 };
  addCheck(
    checks,
    await tableExists(db, 'social_post_queue') ? 'pass' : 'warn',
    'Social post review queue',
    await tableExists(db, 'social_post_queue')
      ? `${Number(socialQueueRows.total || 0)} queued social post(s), ${Number(socialQueueRows.open_count || 0)} open, ${Number(socialQueueRows.needs_review_count || 0)} needing review, ${Number(socialQueueRows.scheduled_count || 0)} scheduled, ${Number(socialQueueRows.dry_run_count || 0)} dry-run previewed.`
      : 'social_post_queue table is not installed yet.',
    'Apply the current migration, then use Operations > Social Posting Queue for review-first job/process social posts.',
    'warning'
  );

  const socialTemplateRows = await tableExists(db, 'social_caption_templates') ? await safeFirst(db, `
    SELECT COUNT(*) AS template_count,
           SUM(CASE WHEN COALESCE(is_active,1)=1 THEN 1 ELSE 0 END) AS active_count
    FROM social_caption_templates
  `) : { template_count: 0, active_count: 0 };
  addCheck(
    checks,
    Number(socialTemplateRows.active_count || 0) >= 5 ? 'pass' : 'warn',
    'Social caption templates and content calendar',
    await tableExists(db, 'social_caption_templates')
      ? `${Number(socialTemplateRows.active_count || 0)} active caption template(s) available for review-first social posts.`
      : 'social_caption_templates table is not installed yet.',
    'Apply the current migration, then refresh Operations > Social Posting Queue to seed reusable caption templates and the upcoming calendar.',
    'warning'
  );

  addCheck(
    checks,
    Number(socialQueueRows.duplicate_warning_count || 0) ? 'warn' : 'pass',
    'Social duplicate/repost guardrails',
    Number(socialQueueRows.duplicate_warning_count || 0)
      ? `${Number(socialQueueRows.duplicate_warning_count || 0)} queued social post(s) are flagged as possible duplicates and should not be published until reviewed.`
      : 'No open social posts are flagged as possible duplicates.',
    'Use Operations > Social Posting Queue to clear duplicate warnings only after reviewing image/caption/platform history.',
    'warning'
  );


  const privacyGuardHealth = await publicJsonCheck(context.request, '/api/admin/social-media-privacy-guard');
  addCheck(
    checks,
    privacyGuardHealth.ok && !privacyGuardHealth.error ? 'pass' : 'warn',
    'Social media privacy guard endpoint',
    privacyGuardHealth.ok ? `HTTP ${privacyGuardHealth.status}; social privacy guard responded.` : `HTTP ${privacyGuardHealth.status}; ${privacyGuardHealth.error || 'Social privacy guard could not be checked.'}`,
    'Open Operations > Social Media Privacy Guard before pushing job/process/customer media to public social platforms.',
    'warning'
  );

  const privacyRows = await tableExists(db, 'social_post_queue') ? await safeFirst(db, `
    SELECT COUNT(*) AS total,
           SUM(CASE WHEN COALESCE(post_status,'draft') IN ('draft','ready') AND COALESCE(privacy_status,'needs_review') IN ('needs_review','consent_needed') THEN 1 ELSE 0 END) AS needs_privacy_review,
           SUM(CASE WHEN COALESCE(post_status,'draft') IN ('draft','ready') AND COALESCE(privacy_status,'needs_review') IN ('blocked','do_not_post') THEN 1 ELSE 0 END) AS blocked_count,
           SUM(CASE WHEN COALESCE(post_status,'draft') IN ('draft','ready') AND (COALESCE(approved_for_public_post,0)=1 OR COALESCE(privacy_status,'') IN ('approved','no_private_media')) THEN 1 ELSE 0 END) AS approved_count
    FROM social_post_queue
  `, [], { total: 0, needs_privacy_review: 0, blocked_count: 0, approved_count: 0 }) : { total: 0, needs_privacy_review: 0, blocked_count: 0, approved_count: 0 };
  addCheck(
    checks,
    Number(privacyRows.needs_privacy_review || 0) ? 'warn' : 'pass',
    'Social media privacy review',
    `${Number(privacyRows.approved_count || 0)} open social post(s) approved/safe, ${Number(privacyRows.needs_privacy_review || 0)} needing privacy review, ${Number(privacyRows.blocked_count || 0)} blocked/do-not-post.`,
    'Use Operations > Social Media Privacy Guard to approve safe product-only media or block private/customer media before API publishing.',
    'warning'
  );

  const apiReadyPlatforms = socialApiReadyCount(context.env);
  addCheck(
    checks,
    apiReadyPlatforms.length ? 'pass' : 'warn',
    'Social API publisher readiness',
    apiReadyPlatforms.length
      ? `API publishing credentials detected for: ${apiReadyPlatforms.join(', ')}.`
      : 'No social API publisher credentials detected yet; queue/manual copy mode remains active.',
    'Add platform tokens in Cloudflare environment variables only when you are ready for approved posts to publish through APIs. Keep TikTok/YouTube manual until their upload workflows are configured.',
    'warning'
  );

  const metaFacebookConfigured = Boolean(envText(context.env, 'FACEBOOK_PAGE_ID', 'META_PAGE_ID') && envText(context.env, 'FACEBOOK_PAGE_ACCESS_TOKEN', 'META_PAGE_ACCESS_TOKEN'));
  const metaInstagramConfigured = Boolean(envText(context.env, 'INSTAGRAM_USER_ID', 'IG_USER_ID', 'INSTAGRAM_BUSINESS_ACCOUNT_ID') && envText(context.env, 'INSTAGRAM_ACCESS_TOKEN', 'META_PAGE_ACCESS_TOKEN', 'FACEBOOK_PAGE_ACCESS_TOKEN'));
  addCheck(
    checks,
    metaFacebookConfigured && metaInstagramConfigured ? 'pass' : 'warn',
    'Meta Facebook + Instagram credential presence',
    `Facebook Page variables: ${metaFacebookConfigured ? 'present' : 'incomplete'}; Instagram professional-account variables: ${metaInstagramConfigured ? 'present' : 'incomplete'}. Presence is not proof of validity.`,
    'Open Social Publishing and select Test Facebook + Instagram. Save the read-only Page/account ID-match result and token validity/scope evidence; do not record secret values.',
    'warning'
  );

  const packagingComponentsInstalled = await tableExists(db, 'packaging_components');
  const packagingComponentRows = packagingComponentsInstalled ? await safeFirst(db, `SELECT COUNT(*) AS total, SUM(CASE WHEN site_item_inventory_id IS NOT NULL THEN 1 ELSE 0 END) AS inventory_linked, SUM(CASE WHEN COALESCE(unit_cost_cents,0)>0 THEN 1 ELSE 0 END) AS costed FROM packaging_components WHERE COALESCE(is_active,1)=1`) : { total:0, inventory_linked:0, costed:0 };
  addCheck(
    checks,
    packagingComponentsInstalled ? (Number(packagingComponentRows.total || 0) ? 'pass' : 'warn') : 'warn',
    'Unified packaging component BOM',
    packagingComponentsInstalled ? `${Number(packagingComponentRows.total || 0)} active packaging component(s); ${Number(packagingComponentRows.inventory_linked || 0)} linked to inventory; ${Number(packagingComponentRows.costed || 0)} with a unit cost.` : 'packaging_components is not installed.',
    'Apply Build 227, then use Labeling & Packaging > Components & Cost to record labels, containers, inserts, seals and shipping materials per launch product.',
    'warning'
  );

  const customerDocumentsInstalled = await tableExists(db, 'customer_documents');
  const customerDocumentRows = customerDocumentsInstalled ? await safeFirst(db, `SELECT COUNT(*) AS total, SUM(CASE WHEN document_status='void' THEN 1 ELSE 0 END) AS void_count, SUM(CASE WHEN document_type='credit_note' THEN 1 ELSE 0 END) AS credit_note_count FROM customer_documents`) : { total:0, void_count:0, credit_note_count:0 };
  const businessIdentityConfigured = Boolean(envText(context.env, 'BUSINESS_LEGAL_NAME', 'BUSINESS_NAME') && envText(context.env, 'BUSINESS_ADDRESS_LINE1', 'BUSINESS_ADDRESS'));
  const taxNumberConfigured = Boolean(envText(context.env, 'BUSINESS_GST_HST_NUMBER', 'GST_HST_NUMBER', 'BUSINESS_REGISTRATION_NUMBER'));
  addCheck(
    checks,
    customerDocumentsInstalled && businessIdentityConfigured ? (taxNumberConfigured ? 'pass' : 'warn') : 'warn',
    'Client document and credit-note controls',
    customerDocumentsInstalled ? `${Number(customerDocumentRows.total || 0)} issued document record(s), ${Number(customerDocumentRows.credit_note_count || 0)} credit note(s), ${Number(customerDocumentRows.void_count || 0)} void; business identity ${businessIdentityConfigured ? 'configured' : 'incomplete'}; GST/HST/registration number ${taxNumberConfigured ? 'configured' : 'not configured'}.` : 'customer_documents is not installed.',
    'Apply Build 227, configure business identity variables, have the owner/accountant verify the registration number, then issue and print an owner-controlled invoice, packing slip, refund confirmation and tax credit note.',
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



  const competitiveEndpointHealth = await publicJsonCheck(context.request, '/api/admin/competitive-roadmap');
  addCheck(
    checks,
    competitiveEndpointHealth.ok ? 'pass' : 'warn',
    'Competitive roadmap tracker',
    competitiveEndpointHealth.ok
      ? `HTTP ${competitiveEndpointHealth.status}; competitive roadmap endpoint responded.`
      : `HTTP ${competitiveEndpointHealth.status}; ${competitiveEndpointHealth.error || 'Competitive roadmap endpoint could not be checked.'}`,
    'Open Operations > Competitive Roadmap and seed/review the priority actions from COMPETITIVE.md.',
    'warning'
  );

  const competitiveRows = await tableExists(db, 'competitive_opportunities') ? await safeFirst(db, `
    SELECT COUNT(*) AS total,
           SUM(CASE WHEN COALESCE(status,'open') IN ('open','in_progress','blocked') AND COALESCE(priority_score,0) >= 85 THEN 1 ELSE 0 END) AS high_priority_open,
           SUM(CASE WHEN COALESCE(status,'open') = 'done' THEN 1 ELSE 0 END) AS done_count
    FROM competitive_opportunities
  `) : { total: 0, high_priority_open: 0, done_count: 0 };
  addCheck(
    checks,
    Number(competitiveRows.total || 0) >= 10 ? 'pass' : 'warn',
    'Competitive opportunities seeded',
    await tableExists(db, 'competitive_opportunities')
      ? `${Number(competitiveRows.total || 0)} competitive opportunity row(s), ${Number(competitiveRows.high_priority_open || 0)} high-priority open, ${Number(competitiveRows.done_count || 0)} done.`
      : 'competitive_opportunities table is not installed yet.',
    'Apply the current migration, then use Operations > Competitive Roadmap to seed and review opportunities.',
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
