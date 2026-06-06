// File: /functions/api/admin/deployment-preflight.js
// Brief description: Admin-only deployment preflight that checks D1 migration safety, public SEO basics, CSS drift, schema drift, release manifests, R2 route hints, and post-deploy confirmation status before a deploy.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD_LABEL = 'Build 174';

const CORE_PUBLIC_PAGES = [
  { path: '/', label: 'Home', requiredTerms: ['devil', 'dove', 'ontario'] },
  { path: '/shop/', label: 'Shop', requiredTerms: ['shop', 'devil', 'dove'] },
  { path: '/gallery/', label: 'Gallery', requiredTerms: ['gallery'] },
  { path: '/creations/', label: 'Creations', requiredTerms: ['creations'] },
  { path: '/handmade-jewelry-ontario/', label: 'Handmade Jewelry Ontario', requiredTerms: ['handmade', 'jewelry', 'ontario'] },
  { path: '/polymer-clay-earrings-ontario/', label: 'Polymer Clay Earrings Ontario', requiredTerms: ['polymer', 'clay', 'earrings', 'ontario'] },
  { path: '/custom-gifts-southern-ontario/', label: 'Custom Gifts Southern Ontario', requiredTerms: ['custom', 'gifts', 'ontario'] },
  { path: '/laser-engraving-ontario/', label: 'Laser Engraving Ontario', requiredTerms: ['laser', 'engraving', 'ontario'] },
  { path: '/custom-candle-making-ontario/', label: 'Custom Candle Making Ontario', requiredTerms: ['candle', 'ontario'] },
  { path: '/custom-soap-making-ontario/', label: 'Custom Soap Making Ontario', requiredTerms: ['soap', 'ontario'] },
  { path: '/vintage-finds-ontario/', label: 'Vintage Finds Ontario', requiredTerms: ['vintage', 'ontario'] },
  { path: '/workshop-made-gifts-ontario/', label: 'Workshop Made Gifts Ontario', requiredTerms: ['workshop', 'gifts', 'ontario'] },
];

const CORE_ADMIN_PAGES = [
  '/admin/',
  '/admin/operations/',
  '/admin/release-notes/',
  '/admin/safe-deploy-package/',
  '/admin/post-deploy-smoke-tests/',
  '/admin/deployment-preflight/'
];

const STATIC_JSON_FILES = [
  '/data/site/seo-page-overrides.json',
  '/data/site/local-seo-bake-actions.json',
  '/data/site/release-notes.json',
  '/data/site/deployment-preflight.json',
  '/data/site/release-package-manifest.json'
];

const BUILD_171_TABLES = [
  { table: 'accounting_evidence_attachments', columns: ['object_key', 'file_size_bytes'] },
  { table: 'gift_card_delivery_provider_logs', columns: ['provider', 'send_status'] },
  { table: 'marketplace_export_history', columns: ['snapshot_json'] },
  { table: 'local_seo_competitor_phrase_score_history', columns: ['page_path', 'page_score'] },
  { table: 'candle_soap_batch_recalls', columns: ['send_review_status'] },
  { table: 'deployment_preflight_runs', columns: ['build_label', 'run_status'] }
];

const EXPECTED_MIGRATIONS = [
  { migration_key: 'build_171_admin_safety_release_readiness', file_name: 'database_upgrade_current_pass.sql', order: 171, fallback_file: 'database_build171_ledger_repair.sql', note: 'Run repair-only ledger SQL if the Build 171 schema objects already exist.' },
  { migration_key: 'build_173_deployment_preflight_release_safety', file_name: 'database_build173_deployment_preflight.sql', order: 173, fallback_file: '', note: 'Adds deployment_preflight_runs and preflight admin visibility.' },
  { migration_key: 'build_174_preflight_detail_manifest', file_name: 'database_build174_deployment_preflight_detail.sql', order: 174, fallback_file: '', note: 'Adds post-deploy confirmations plus richer preflight/detail manifests.' }
];

const EXPECTED_SCHEMA = [
  { table: 'schema_migration_ledger', columns: ['schema_migration_id', 'migration_key', 'file_name', 'status', 'notes', 'created_at'], area: 'migration safety' },
  { table: 'deployment_preflight_runs', columns: ['deployment_preflight_run_id', 'build_label', 'run_status', 'blocker_count', 'warning_count', 'summary_json', 'created_at'], area: 'deployment safety' },
  { table: 'deployment_post_deploy_confirmations', columns: ['deployment_post_deploy_confirmation_id', 'confirmation_key', 'confirmation_status', 'confirmed_by_user_id', 'confirmed_at'], area: 'post deploy' },
  { table: 'products', columns: ['product_id', 'slug', 'name', 'featured_image_url'], area: 'catalog' },
  { table: 'product_images', columns: ['product_image_id', 'product_id'], area: 'catalog media' },
  { table: 'product_seo', columns: ['product_id', 'meta_title', 'meta_description'], area: 'seo' },
  { table: 'public_proof_candidates', columns: ['public_proof_candidate_id', 'moderation_status', 'consent_status'], area: 'public proof' },
  { table: 'trust_block_placements', columns: ['trust_block_placement_id', 'page_context', 'is_enabled'], area: 'trust blocks' },
  { table: 'catalog_items', columns: ['catalog_item_id', 'item_kind', 'source_key', 'name'], area: 'json to d1 ownership' },
  { table: 'site_item_inventory', columns: ['site_item_inventory_id', 'source_type', 'external_key', 'item_name'], area: 'inventory ownership' },
  { table: 'local_seo_bake_actions', columns: ['local_seo_bake_action_id', 'page_path', 'action_status'], area: 'local seo' },
  { table: 'r2_derivative_route_settings', columns: ['r2_derivative_route_setting_id', 'route_status'], area: 'r2 derivatives' }
];

const CONFIRMATION_CHECKS = [
  { key: 'd1_migrations_applied', label: 'D1 migrations applied', detail: 'Build 171 repair, Build 173, and Build 174 SQL have been run or intentionally skipped with notes.' },
  { key: 'preflight_snapshot_saved', label: 'Preflight snapshot saved', detail: 'Deployment Preflight was run and saved after the D1 schema update.' },
  { key: 'public_pages_checked', label: 'Public pages checked', detail: 'One-H1, title, meta, canonical, image alt, and local wording checks were reviewed.' },
  { key: 'smoke_tests_run', label: 'Smoke tests run', detail: 'Core public/admin live URLs were checked from the post-deploy smoke-test page.' },
  { key: 'release_notes_reviewed', label: 'Release notes reviewed', detail: 'Release Notes and Safe Deploy Package were reviewed before promotion.' },
  { key: 'r2_email_bindings_reviewed', label: 'R2/email bindings reviewed', detail: 'R2 derivative/evidence routes and gift-card email provider settings were verified or left in manual mode.' }
];

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function lc(value) { return normalizeText(value).toLowerCase(); }
function checkStatus(checks) {
  const blockerCount = checks.filter((check) => check.status === 'fail').length;
  const warningCount = checks.filter((check) => check.status === 'warn').length;
  return {
    status: blockerCount ? 'blocked' : (warningCount ? 'review' : 'ready'),
    blocker_count: blockerCount,
    warning_count: warningCount,
    pass_count: checks.filter((check) => check.status === 'pass').length,
    check_count: checks.length
  };
}
function addCheck(checks, status, code, label, detail, action = '', evidence = {}) { checks.push({ status, code, label, detail, action, evidence }); }
function cleanHtmlText(value) { return normalizeText(value).replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); }
function attr(tag, name) {
  const match = String(tag || '').match(new RegExp(`${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'));
  return match ? normalizeText(match[2]) : '';
}
function metaContent(html, name) {
  const tags = String(html || '').match(/<meta\b[^>]*>/gi) || [];
  const target = lc(name);
  for (const tag of tags) {
    if (lc(attr(tag, 'name')) === target || lc(attr(tag, 'property')) === target) return attr(tag, 'content');
  }
  return '';
}
function linkHref(html, rel) {
  const tags = String(html || '').match(/<link\b[^>]*>/gi) || [];
  const target = lc(rel);
  for (const tag of tags) {
    if (lc(attr(tag, 'rel')) === target) return attr(tag, 'href');
  }
  return '';
}
function titleText(html) {
  const match = String(html || '').match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return cleanHtmlText(match ? match[1] : '');
}
function structuredDataRows(html) {
  const rows = [];
  const regex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(String(html || '')))) {
    const raw = normalizeText(match[1]);
    try {
      const parsed = JSON.parse(raw);
      const type = Array.isArray(parsed) ? parsed.map((item) => item?.['@type']).filter(Boolean).join(', ') : normalizeText(parsed?.['@type'] || 'StructuredData');
      rows.push({ valid: true, type, length: raw.length });
    } catch (error) {
      rows.push({ valid: false, type: '', error: String(error?.message || error || 'Invalid JSON-LD'), length: raw.length });
    }
  }
  return rows;
}
function imageRows(html) {
  return (String(html || '').match(/<img\b[^>]*>/gi) || []).map((tag) => ({ src: attr(tag, 'src'), alt: attr(tag, 'alt'), loading: attr(tag, 'loading'), width: attr(tag, 'width'), height: attr(tag, 'height') }));
}
function firstWords(value, max = 220) {
  const text = normalizeText(value).replace(/\s+/g, ' ');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
async function safeFetchText(request, path) {
  const url = new URL(path, request.url);
  try {
    const headers = { Accept: 'text/html,application/json,text/css;q=0.9,*/*;q=0.8' };
    const cookie = request.headers.get('Cookie');
    const auth = request.headers.get('Authorization');
    if (cookie) headers.Cookie = cookie;
    if (auth) headers.Authorization = auth;
    const response = await fetch(url.toString(), { headers, cf: { cacheTtl: 0, cacheEverything: false } });
    const text = await response.text().catch(() => '');
    return { ok: response.ok, status: response.status, text, url: url.toString() };
  } catch (error) {
    return { ok: false, status: 0, text: '', error: String(error?.message || error || 'Fetch failed'), url: url.toString() };
  }
}
function safeIdentifier(value) {
  const clean = normalizeText(value);
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(clean) ? clean : '';
}
async function tableExists(db, tableName) {
  try { return !!(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(tableName).first()); }
  catch { return false; }
}
async function tableColumns(db, tableName) {
  const safeTable = safeIdentifier(tableName);
  if (!safeTable) return new Set();
  try { return new Set(rows(await db.prepare(`PRAGMA table_info(${safeTable})`).all()).map((row) => normalizeText(row.name)).filter(Boolean)); }
  catch { return new Set(); }
}
async function safeFirst(db, sql, bindings = [], fallback = {}) {
  try { return (await db.prepare(sql).bind(...bindings).first()) || fallback; }
  catch { return fallback; }
}
async function safeAll(db, sql, bindings = []) {
  try { return rows(await db.prepare(sql).bind(...bindings).all()); }
  catch { return []; }
}

async function inspectMigrationLedger(db, checks) {
  const ledgerExists = await tableExists(db, 'schema_migration_ledger');
  if (!ledgerExists) {
    addCheck(checks, 'fail', 'schema_ledger_missing', 'D1 migration ledger table', 'schema_migration_ledger does not exist.', 'Apply the base/current schema before running live upgrades.');
    return { ledger_exists: false, expected: [], recent: [] };
  }

  const ledgerCols = await tableColumns(db, 'schema_migration_ledger');
  if (!ledgerCols.has('file_name')) {
    addCheck(checks, 'fail', 'schema_ledger_file_name_missing', 'D1 migration ledger file_name column', 'schema_migration_ledger.file_name is missing.', 'Apply the schema ledger repair before recording migration markers.');
  } else {
    addCheck(checks, 'pass', 'schema_ledger_file_name_present', 'D1 migration ledger file_name column', 'schema_migration_ledger.file_name is present.', '');
  }

  const expected = [];
  for (const migration of EXPECTED_MIGRATIONS) {
    const row = await safeFirst(db, 'SELECT migration_key, file_name, status, notes, applied_at, created_at, updated_at FROM schema_migration_ledger WHERE migration_key=? LIMIT 1', [migration.migration_key], null);
    expected.push({ ...migration, recorded: !!row, ...(row || {}) });
  }
  const build171 = expected.find((row) => row.migration_key === 'build_171_admin_safety_release_readiness');
  const build173 = expected.find((row) => row.migration_key === 'build_173_deployment_preflight_release_safety');
  const build174 = expected.find((row) => row.migration_key === 'build_174_preflight_detail_manifest');

  const partialRows = [];
  for (const spec of BUILD_171_TABLES) {
    const exists = await tableExists(db, spec.table);
    const cols = exists ? await tableColumns(db, spec.table) : new Set();
    partialRows.push({ table: spec.table, exists, missing_columns: spec.columns.filter((column) => !cols.has(column)) });
  }
  const createdMarkers = partialRows.filter((row) => row.exists && row.missing_columns.length === 0).length;

  if (!build171?.recorded && createdMarkers >= 3) {
    addCheck(checks, 'warn', 'build171_marker_missing_after_schema_created', 'Build 171 ledger marker', `${createdMarkers} Build 171/173 schema markers are present, but the Build 171 ledger row is missing.`, 'Run database_build171_ledger_repair.sql only; do not rerun the full upgrade against a database that already has the columns.');
  } else if (build171?.recorded) {
    addCheck(checks, 'pass', 'build171_marker_present', 'Build 171 ledger marker', `Build 171 marker is recorded as ${build171.status || 'recorded'}.`, '');
  } else {
    addCheck(checks, 'warn', 'build171_marker_not_seen', 'Build 171 ledger marker', 'Build 171 marker was not found.', 'For a fresh database, run the latest additive migrations in order.');
  }

  if (build173?.recorded) addCheck(checks, 'pass', 'build173_marker_present', 'Build 173 ledger marker', `Build 173 marker is recorded as ${build173.status || 'recorded'}.`, '');
  else addCheck(checks, 'warn', 'build173_marker_missing', 'Build 173 ledger marker', 'Build 173 deployment-preflight marker is not recorded yet.', 'Apply database_build173_deployment_preflight.sql after deployment.');

  if (build174?.recorded) addCheck(checks, 'pass', 'build174_marker_present', 'Build 174 ledger marker', `Build 174 marker is recorded as ${build174.status || 'recorded'}.`, '');
  else addCheck(checks, 'warn', 'build174_marker_missing', 'Build 174 ledger marker', 'Build 174 preflight detail marker is not recorded yet.', 'Apply database_build174_deployment_preflight_detail.sql after Build 173.');

  const recent = await safeAll(db, `
    SELECT migration_key, file_name, status, destructive, applied_by_user_id, applied_at, notes, created_at, updated_at
    FROM schema_migration_ledger
    ORDER BY COALESCE(applied_at, created_at) DESC
    LIMIT 25
  `);

  return { ledger_exists: true, expected, recent, schema_markers: partialRows };
}

async function inspectExpectedSchema(db, checks) {
  const tableRows = [];
  for (const spec of EXPECTED_SCHEMA) {
    const exists = await tableExists(db, spec.table);
    const cols = exists ? await tableColumns(db, spec.table) : new Set();
    const missing = spec.columns.filter((column) => !cols.has(column));
    tableRows.push({ table: spec.table, area: spec.area, exists, expected_columns: spec.columns, missing_columns: missing, status: !exists || missing.length ? 'warn' : 'pass' });
  }
  const warnRows = tableRows.filter((row) => row.status !== 'pass');
  addCheck(checks, warnRows.length ? 'warn' : 'pass', 'expected_schema_diff', 'Expected D1 schema diff', warnRows.length ? `${warnRows.length} expected table/column group(s) need review.` : `${tableRows.length} expected schema groups are present.`, warnRows.length ? 'Use the schema detail drawer to decide whether this is a fresh database, partial upgrade, or real drift.' : '', { tables: tableRows });
  return tableRows;
}

async function inspectDatabase(db, checks) {
  const preflightExists = await tableExists(db, 'deployment_preflight_runs');
  if (!preflightExists) {
    addCheck(checks, 'warn', 'deployment_preflight_runs_missing', 'Deployment preflight run-history table', 'deployment_preflight_runs is not present yet.', 'Run database_build173_deployment_preflight.sql to persist preflight snapshots.');
  } else {
    const count = await safeFirst(db, 'SELECT COUNT(*) AS total FROM deployment_preflight_runs');
    addCheck(checks, 'pass', 'deployment_preflight_runs_present', 'Deployment preflight run-history table', `deployment_preflight_runs exists with ${Number(count.total || 0)} saved run(s).`, '');
  }

  const requiredTables = ['products', 'product_images', 'product_seo', 'orders', 'order_items', 'site_item_inventory', 'catalog_items', 'accounting_evidence_attachments', 'gift_cards', 'public_proof_candidates', 'marketplace_export_history'];
  const missing = [];
  for (const table of requiredTables) if (!(await tableExists(db, table))) missing.push(table);
  addCheck(checks, missing.length ? 'fail' : 'pass', 'core_tables_present', 'Core D1 tables for store/admin workflows', missing.length ? `Missing required table(s): ${missing.join(', ')}.` : `${requiredTables.length} core table(s) are present.`, missing.length ? 'Apply the schema migration before deploying this build.' : '');
}

async function inspectDuplicateOwnership(db, checks) {
  const rowsOut = [];
  if (await tableExists(db, 'catalog_items')) {
    rowsOut.push(...await safeAll(db, `
      SELECT 'catalog_items' AS source_table, item_kind AS owner_kind, source_key AS owner_key, COUNT(*) AS duplicate_count
      FROM catalog_items
      WHERE COALESCE(source_key,'') <> ''
      GROUP BY item_kind, source_key
      HAVING COUNT(*) > 1
      LIMIT 20
    `));
  }
  if (await tableExists(db, 'site_item_inventory')) {
    rowsOut.push(...await safeAll(db, `
      SELECT 'site_item_inventory' AS source_table, source_type AS owner_kind, external_key AS owner_key, COUNT(*) AS duplicate_count
      FROM site_item_inventory
      WHERE COALESCE(external_key,'') <> ''
      GROUP BY source_type, external_key
      HAVING COUNT(*) > 1
      LIMIT 20
    `));
  }
  if (await tableExists(db, 'local_seo_bake_actions')) {
    rowsOut.push(...await safeAll(db, `
      SELECT 'local_seo_bake_actions' AS source_table, 'page_path' AS owner_kind, page_path AS owner_key, COUNT(*) AS duplicate_count
      FROM local_seo_bake_actions
      WHERE COALESCE(page_path,'') <> '' AND action_status IN ('queued','ready','needs_review')
      GROUP BY page_path, action_status
      HAVING COUNT(*) > 1
      LIMIT 20
    `));
  }
  addCheck(checks, rowsOut.length ? 'warn' : 'pass', 'json_d1_duplicate_ownership', 'JSON-to-D1 duplicate ownership', rowsOut.length ? `${rowsOut.length} duplicate ownership group(s) need review.` : 'No duplicate ownership groups found for catalog, inventory, or local SEO bake actions.', rowsOut.length ? 'Merge duplicates or pick one source of truth before relying on export/admin automation.' : '', { duplicate_groups: rowsOut });
  return rowsOut;
}

async function inspectDataIntegrity(db, checks) {
  const integrity = {};
  integrity.products_missing_featured = await safeFirst(db, `SELECT COUNT(*) AS count FROM products WHERE COALESCE(featured_image_url,'')='' AND LOWER(COALESCE(status,'draft')) NOT IN ('archived','deleted')`);
  integrity.product_images_without_product = await safeFirst(db, `SELECT COUNT(*) AS count FROM product_images pi LEFT JOIN products p ON p.product_id=pi.product_id WHERE p.product_id IS NULL`);
  integrity.product_seo_without_product = await safeFirst(db, `SELECT COUNT(*) AS count FROM product_seo ps LEFT JOIN products p ON p.product_id=ps.product_id WHERE p.product_id IS NULL`);
  integrity.public_proof_without_consent = await safeFirst(db, `SELECT COUNT(*) AS count FROM public_proof_candidates WHERE LOWER(COALESCE(moderation_status,'')) IN ('approved','public','promoted') AND LOWER(COALESCE(consent_status,'')) NOT IN ('approved','granted','ok')`);
  integrity.trust_placements_without_enabled = await safeFirst(db, `SELECT COUNT(*) AS count FROM trust_block_placements WHERE COALESCE(is_enabled,0)=1 AND COALESCE(page_context,'')=''`);
  const totalRisk = Object.values(integrity).reduce((sum, row) => sum + Number(row?.count || 0), 0);
  addCheck(checks, totalRisk ? 'warn' : 'pass', 'relationship_integrity', 'Product/image/story/trust-block relationship integrity', totalRisk ? `${totalRisk} relationship issue(s) need review.` : 'Product/image/SEO/public-proof/trust placement relationships look clean.', totalRisk ? 'Open Catalog Media, Product SEO, Public Proof Candidates, and Trust Blocks to clean orphan or unapproved rows.' : '', { integrity });
  return integrity;
}

async function inspectPublicPages(request, checks) {
  const pageResults = [];
  for (const page of CORE_PUBLIC_PAGES) {
    const result = await safeFetchText(request, page.path);
    const text = result.text || '';
    const h1Count = (text.match(/<h1\b/gi) || []).length;
    const title = titleText(text);
    const metaDescription = metaContent(text, 'description');
    const canonicalUrl = linkHref(text, 'canonical');
    const plain = cleanHtmlText(text).toLowerCase();
    const missingTerms = page.requiredTerms.filter((term) => !plain.includes(term));
    const imgs = imageRows(text);
    const imagesMissingAlt = imgs.filter((img) => !img.alt).length;
    const schemaRows = structuredDataRows(text);
    const invalidSchema = schemaRows.filter((row) => !row.valid).length;
    const hasFallback = /noscript|fallback|offline|empty-state|no products|try again|loading/i.test(text);
    const titleLen = title.length;
    const metaLen = metaDescription.length;
    const titleOk = titleLen >= 30 && titleLen <= 70;
    const metaOk = metaLen >= 80 && metaLen <= 170;
    let status = 'pass';
    if (!result.ok || h1Count !== 1 || !title || !metaDescription) status = 'fail';
    else if (missingTerms.length || !titleOk || !metaOk || !canonicalUrl || imagesMissingAlt || invalidSchema || !schemaRows.length || !hasFallback) status = 'warn';
    pageResults.push({
      ...page,
      status,
      ok: result.ok,
      http_status: result.status,
      h1_count: h1Count,
      title,
      title_length: titleLen,
      title_ok: titleOk,
      meta_description: metaDescription,
      meta_description_length: metaLen,
      meta_description_ok: metaOk,
      canonical_url: canonicalUrl,
      missing_terms: missingTerms,
      image_count: imgs.length,
      images_missing_alt: imagesMissingAlt,
      structured_data_count: schemaRows.length,
      invalid_structured_data_count: invalidSchema,
      structured_data_types: schemaRows.map((row) => row.type).filter(Boolean),
      has_low_bandwidth_fallback: hasFallback,
      url: result.url
    });
  }
  const fails = pageResults.filter((row) => row.status === 'fail');
  const warns = pageResults.filter((row) => row.status === 'warn');
  addCheck(checks, fails.length ? 'fail' : (warns.length ? 'warn' : 'pass'), 'public_page_seo_bundle', 'Public page SEO/H1/canonical/schema/fallback bundle', fails.length ? `${fails.length} public page(s) have blocking HTML issues.` : (warns.length ? `${warns.length} public page(s) have SEO/schema/fallback warnings.` : `${pageResults.length} public page(s) passed SEO/H1/canonical/schema/fallback checks.`), fails.length || warns.length ? 'Review the page detail table and open any failed/warn pages directly.' : '', { page_results: pageResults });
  return pageResults;
}

async function inspectAdminPages(request, checks) {
  const results = [];
  for (const path of CORE_ADMIN_PAGES) {
    const result = await safeFetchText(request, path);
    const text = result.text || '';
    results.push({ path, ok: result.ok, http_status: result.status, h1_count: (text.match(/<h1\b/gi) || []).length, has_title: /<title\b/i.test(text) });
  }
  const bad = results.filter((row) => !row.ok || row.h1_count !== 1 || !row.has_title);
  addCheck(checks, bad.length ? 'warn' : 'pass', 'admin_page_fetch_h1', 'Admin page fetch/H1 check', bad.length ? `${bad.length} admin page(s) need review.` : `${results.length} admin page(s) fetched with one H1 and title.`, bad.length ? 'Admin pages should stay readable even when API calls fail.' : '', { admin_pages: results });
}

async function inspectStaticFiles(request, checks) {
  const css = await safeFetchText(request, '/css/styles.css');
  if (!css.ok) addCheck(checks, 'fail', 'css_fetch_failed', 'CSS fetch', `Could not fetch /css/styles.css (${css.status || 0}).`, 'Fix asset routing before deploy.');
  else {
    const open = (css.text.match(/{/g) || []).length;
    const close = (css.text.match(/}/g) || []).length;
    addCheck(checks, open === close ? 'pass' : 'fail', 'css_brace_balance', 'CSS brace balance', `styles.css brace count is ${open}/${close}.`, open === close ? '' : 'Repair CSS drift before deploy.');
  }

  const jsonResults = [];
  for (const path of STATIC_JSON_FILES) {
    const result = await safeFetchText(request, path);
    let valid = false;
    if (result.ok) {
      try { JSON.parse(result.text || ''); valid = true; }
      catch { valid = false; }
    }
    jsonResults.push({ path, ok: result.ok, http_status: result.status, valid_json: valid });
  }
  const badJson = jsonResults.filter((row) => !row.ok || !row.valid_json);
  addCheck(checks, badJson.length ? 'warn' : 'pass', 'static_json_valid', 'Static JSON release/search files', badJson.length ? `${badJson.length} static JSON file(s) failed fetch or parse.` : `${jsonResults.length} static JSON file(s) fetched and parsed.`, badJson.length ? 'Review static JSON files before deploy; public fallbacks rely on them.' : '', { json_files: jsonResults });
}

async function inspectR2Health(db, env, checks) {
  const bucketConfigured = !!(env?.DD_MEDIA_BUCKET || env?.MEDIA_BUCKET || env?.R2_BUCKET || env?.ACCOUNTING_EVIDENCE_BUCKET);
  const routeRows = await tableExists(db, 'r2_derivative_route_settings') ? await safeAll(db, `SELECT route_label, route_url, route_status, last_health_status, last_health_at FROM r2_derivative_route_settings ORDER BY updated_at DESC LIMIT 5`) : [];
  const healthyRoutes = routeRows.filter((row) => lc(row.last_health_status || row.route_status).includes('pass') || lc(row.last_health_status || row.route_status).includes('healthy'));
  addCheck(checks, bucketConfigured || routeRows.length ? 'pass' : 'warn', 'r2_route_health_visibility', 'R2 route/bucket health visibility', bucketConfigured ? `R2-related binding is visible; ${routeRows.length} derivative route setting row(s) available.` : (routeRows.length ? `${routeRows.length} derivative route setting row(s) available; no bucket binding was detected in preflight env.` : 'No R2 bucket binding or derivative route setting rows were visible to preflight.'), bucketConfigured || routeRows.length ? 'Use R2 derivative settings page for create/get/delete test after deploy.' : 'Configure R2 bindings or keep R2 features in manual/off mode until ready.', { bucket_configured: bucketConfigured, route_rows: routeRows, healthy_route_count: healthyRoutes.length });
  return { bucket_configured: bucketConfigured, route_rows: routeRows };
}

async function inspectPostDeployConfirmations(db, checks) {
  const table = await tableExists(db, 'deployment_post_deploy_confirmations');
  if (!table) {
    addCheck(checks, 'warn', 'post_deploy_confirmations_missing', 'Post-deploy confirmation workflow', 'deployment_post_deploy_confirmations is not present yet.', 'Run database_build174_deployment_preflight_detail.sql to record post-deploy confirmations.');
    return CONFIRMATION_CHECKS.map((item) => ({ ...item, confirmation_status: 'missing_table' }));
  }
  const saved = await safeAll(db, `SELECT confirmation_key, confirmation_status, notes, confirmed_by_user_id, confirmed_at, updated_at FROM deployment_post_deploy_confirmations ORDER BY updated_at DESC`);
  const savedByKey = new Map(saved.map((row) => [row.confirmation_key, row]));
  const rowsOut = CONFIRMATION_CHECKS.map((item) => ({ ...item, ...(savedByKey.get(item.key) || { confirmation_status: 'pending' }) }));
  const pending = rowsOut.filter((row) => lc(row.confirmation_status) !== 'confirmed');
  addCheck(checks, pending.length ? 'warn' : 'pass', 'post_deploy_confirmations', 'Post-deploy confirmation workflow', pending.length ? `${pending.length} post-deploy confirmation item(s) are not confirmed.` : 'All post-deploy confirmation items are confirmed.', pending.length ? 'After deploying, mark each confirmation complete with notes.' : '', { confirmations: rowsOut });
  return rowsOut;
}

function buildMigrationPlan(ledger) {
  const recorded = new Set((ledger?.expected || []).filter((row) => row.recorded).map((row) => row.migration_key));
  const build171Recorded = recorded.has('build_171_admin_safety_release_readiness');
  const build173Recorded = recorded.has('build_173_deployment_preflight_release_safety');
  const build174Recorded = recorded.has('build_174_preflight_detail_manifest');
  return {
    fresh_database: [
      'Run database_upgrade_current_pass.sql once on a fresh/empty D1 database.',
      'Run database_build173_deployment_preflight.sql.',
      'Run database_build174_deployment_preflight_detail.sql.',
      'Open /admin/deployment-preflight/, run Preflight, then Save Snapshot.'
    ],
    partially_upgraded_database: [
      build171Recorded ? 'Build 171 marker is already recorded.' : 'If Build 171 tables/columns already exist, run database_build171_ledger_repair.sql only.',
      build173Recorded ? 'Build 173 marker is already recorded.' : 'Run database_build173_deployment_preflight.sql after the Build 171 marker is safe.',
      build174Recorded ? 'Build 174 marker is already recorded.' : 'Run database_build174_deployment_preflight_detail.sql after Build 173.',
      'Do not rerun ALTER TABLE-heavy blocks against a database where those columns already exist.'
    ],
    repair_only: [
      'Use database_build171_ledger_repair.sql only when the Build 171 schema already exists but the ledger marker failed.',
      'Use the preflight schema diff drawer before deciding whether to run full or repair-only SQL.'
    ]
  };
}

async function buildReport(context) {
  const { request, env } = context;
  const db = getDb(env);
  const checks = [];
  if (!db) {
    addCheck(checks, 'fail', 'db_binding_missing', 'D1 binding', 'Database binding is not configured.', 'Set DB or DD_DB in Cloudflare Pages bindings.');
    return { checks, summary: checkStatus(checks), page_results: [], ledger: null, expected_schema: [], migration_plan: buildMigrationPlan(null), data_integrity: {}, duplicate_ownership: [], post_deploy_confirmations: [] };
  }

  const ledger = await inspectMigrationLedger(db, checks);
  await inspectDatabase(db, checks);
  const expected_schema = await inspectExpectedSchema(db, checks);
  const duplicate_ownership = await inspectDuplicateOwnership(db, checks);
  const data_integrity = await inspectDataIntegrity(db, checks);
  const page_results = await inspectPublicPages(request, checks);
  await inspectAdminPages(request, checks);
  await inspectStaticFiles(request, checks);
  const r2_health = await inspectR2Health(db, env, checks);
  const post_deploy_confirmations = await inspectPostDeployConfirmations(db, checks);

  const summary = checkStatus(checks);
  return { checks, summary, page_results, ledger, expected_schema, migration_plan: buildMigrationPlan(ledger), duplicate_ownership, data_integrity, r2_health, post_deploy_confirmations };
}

async function ensurePreflightTables(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS deployment_preflight_runs (
      deployment_preflight_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
      build_label TEXT,
      run_status TEXT NOT NULL DEFAULT 'warning',
      blocker_count INTEGER NOT NULL DEFAULT 0,
      warning_count INTEGER NOT NULL DEFAULT 0,
      summary_json TEXT NOT NULL DEFAULT '{}',
      created_by_user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_deployment_preflight_runs_status ON deployment_preflight_runs(run_status, created_at DESC)`).run().catch(() => null);
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS deployment_post_deploy_confirmations (
      deployment_post_deploy_confirmation_id INTEGER PRIMARY KEY AUTOINCREMENT,
      build_label TEXT,
      confirmation_key TEXT NOT NULL,
      confirmation_label TEXT,
      confirmation_status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      confirmed_by_user_id INTEGER,
      confirmed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(build_label, confirmation_key)
    )
  `).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_deploy_confirmations_status ON deployment_post_deploy_confirmations(build_label, confirmation_status, updated_at DESC)`).run().catch(() => null);
}

function reportToMarkdown(report, generatedAt) {
  const lines = [`# ${BUILD_LABEL} Deployment Preflight Export`, '', `Generated: ${generatedAt}`, '', '## Summary', '', `- Status: ${report.summary?.status || 'unknown'}`, `- Blockers: ${Number(report.summary?.blocker_count || 0)}`, `- Warnings: ${Number(report.summary?.warning_count || 0)}`, `- Checks: ${Number(report.summary?.check_count || 0)}`, '', '## Checklist', ''];
  for (const check of report.checks || []) {
    lines.push(`- **${check.status || 'unknown'}** — ${check.label || check.code}: ${firstWords(check.detail || '')}${check.action ? ` Action: ${firstWords(check.action, 160)}` : ''}`);
  }
  lines.push('', '## Migration plan', '');
  for (const [section, items] of Object.entries(report.migration_plan || {})) {
    lines.push(`### ${section.replace(/_/g, ' ')}`, '');
    for (const item of items || []) lines.push(`- ${item}`);
    lines.push('');
  }
  lines.push('## Public page details', '');
  for (const page of report.page_results || []) {
    lines.push(`- ${page.status} — ${page.path}: H1 ${page.h1_count}, title ${page.title_length}, meta ${page.meta_description_length}, canonical ${page.canonical_url ? 'yes' : 'no'}, images missing alt ${page.images_missing_alt}, schema ${page.structured_data_count}.`);
  }
  lines.push('', '## Post-deploy confirmations', '');
  for (const row of report.post_deploy_confirmations || []) lines.push(`- ${row.confirmation_status || 'pending'} — ${row.label || row.confirmation_key}`);
  return lines.join('\n') + '\n';
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const generated_at = new Date().toISOString();
  const report = await buildReport(context);
  const url = new URL(context.request.url);
  if (lc(url.searchParams.get('format')) === 'markdown') {
    return new Response(reportToMarkdown(report, generated_at), { status: 200, headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
  const db = getDb(context.env);
  const recent_runs = db && await tableExists(db, 'deployment_preflight_runs') ? await safeAll(db, `
    SELECT deployment_preflight_run_id, build_label, run_status, blocker_count, warning_count, created_by_user_id, created_at
    FROM deployment_preflight_runs
    ORDER BY created_at DESC
    LIMIT 10
  `) : [];
  return jsonResponse({ ok: true, build_label: BUILD_LABEL, generated_at, ...report, recent_runs }, 200, { 'Cache-Control': 'no-store' });
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensurePreflightTables(db);
  let body = {};
  try { body = await context.request.json(); } catch { body = {}; }
  const action = lc(body.action || 'save_snapshot');
  const buildLabel = normalizeText(body.build_label || body.buildLabel || BUILD_LABEL) || BUILD_LABEL;

  if (action === 'confirm_post_deploy') {
    const key = normalizeText(body.confirmation_key || body.key);
    const spec = CONFIRMATION_CHECKS.find((item) => item.key === key);
    if (!spec) return jsonResponse({ ok: false, error: 'Unknown confirmation key.' }, 400);
    const notes = normalizeText(body.notes || 'Confirmed from Deployment Preflight page.');
    await db.prepare(`
      INSERT INTO deployment_post_deploy_confirmations (
        build_label, confirmation_key, confirmation_label, confirmation_status, notes, confirmed_by_user_id, confirmed_at, created_at, updated_at
      ) VALUES (?, ?, ?, 'confirmed', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(build_label, confirmation_key) DO UPDATE SET
        confirmation_label=excluded.confirmation_label,
        confirmation_status='confirmed',
        notes=excluded.notes,
        confirmed_by_user_id=excluded.confirmed_by_user_id,
        confirmed_at=CURRENT_TIMESTAMP,
        updated_at=CURRENT_TIMESTAMP
    `).bind(buildLabel, spec.key, spec.label, notes, Number(adminUser.user_id || 0) || null).run();
    await auditAdminAction(context.env, context.request, adminUser, { action_type: 'deployment_post_deploy_confirmed', target_type: 'deployment_confirmation', target_key: key, details: { build_label: buildLabel, notes } });
    const report = await buildReport(context);
    return jsonResponse({ ok: true, confirmed: true, build_label: buildLabel, ...report });
  }

  const report = await buildReport(context);
  await db.prepare(`
    INSERT INTO deployment_preflight_runs (
      build_label, run_status, blocker_count, warning_count, summary_json, created_by_user_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(
    buildLabel,
    report.summary.status,
    report.summary.blocker_count,
    report.summary.warning_count,
    JSON.stringify({ generated_at: new Date().toISOString(), summary: report.summary, checks: report.checks, page_results: report.page_results, migration_plan: report.migration_plan }),
    Number(adminUser.user_id || 0) || null
  ).run();

  await auditAdminAction(context.env, context.request, adminUser, {
    action_type: 'deployment_preflight_snapshot_saved',
    target_type: 'deployment_preflight',
    target_key: buildLabel,
    details: report.summary,
  });
  return jsonResponse({ ok: true, saved: true, build_label: buildLabel, ...report });
}
