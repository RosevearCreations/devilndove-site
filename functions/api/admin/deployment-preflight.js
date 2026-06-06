// File: /functions/api/admin/deployment-preflight.js
// Brief description: Admin-only deployment preflight that checks D1 migration safety, public page SEO basics, CSS drift, release files, and local-search wording before a deploy.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const CORE_PUBLIC_PAGES = [
  { path: '/', label: 'Home', requiredTerms: ['devil', 'dove'] },
  { path: '/shop/', label: 'Shop', requiredTerms: ['shop'] },
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
  '/data/site/deployment-preflight.json'
];

const BUILD_171_TABLES = [
  { table: 'accounting_evidence_attachments', columns: ['object_key', 'file_size_bytes'] },
  { table: 'gift_card_delivery_provider_logs', columns: ['provider', 'send_status'] },
  { table: 'marketplace_export_history', columns: ['snapshot_json'] },
  { table: 'local_seo_competitor_phrase_score_history', columns: ['page_path', 'page_score'] },
  { table: 'candle_soap_batch_recalls', columns: ['send_review_status'] },
  { table: 'deployment_preflight_runs', columns: ['build_label', 'run_status'] }
];

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

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

function addCheck(checks, status, code, label, detail, action = '', evidence = {}) {
  checks.push({ status, code, label, detail, action, evidence });
}

function cleanHtmlText(value) {
  return normalizeText(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
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
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(rows(result).map((row) => normalizeText(row.name)).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function safeFirst(db, sql, bindings = [], fallback = {}) {
  try { return (await db.prepare(sql).bind(...bindings).first()) || fallback; }
  catch { return fallback; }
}

async function safeAll(db, sql, bindings = []) {
  try { return rows(await db.prepare(sql).bind(...bindings).all()); }
  catch { return []; }
}

async function inspectLedger(db, checks) {
  const ledgerExists = await tableExists(db, 'schema_migration_ledger');
  if (!ledgerExists) {
    addCheck(checks, 'fail', 'schema_ledger_missing', 'D1 migration ledger table', 'schema_migration_ledger does not exist.', 'Apply the base/current schema before running live upgrades.');
    return { ledger_exists: false, build171_recorded: false, build173_recorded: false };
  }

  const ledgerCols = await tableColumns(db, 'schema_migration_ledger');
  if (!ledgerCols.has('file_name')) {
    addCheck(checks, 'fail', 'schema_ledger_file_name_missing', 'D1 migration ledger file_name column', 'schema_migration_ledger.file_name is missing.', 'Apply the schema ledger repair before recording migration markers.');
  } else {
    addCheck(checks, 'pass', 'schema_ledger_file_name_present', 'D1 migration ledger file_name column', 'schema_migration_ledger.file_name is present.', '');
  }

  const build171 = await safeFirst(db, "SELECT migration_key, file_name, status FROM schema_migration_ledger WHERE migration_key='build_171_admin_safety_release_readiness' LIMIT 1");
  const build173 = await safeFirst(db, "SELECT migration_key, file_name, status FROM schema_migration_ledger WHERE migration_key='build_173_deployment_preflight_release_safety' LIMIT 1");
  const partialRows = [];
  for (const spec of BUILD_171_TABLES) {
    const exists = await tableExists(db, spec.table);
    const cols = exists ? await tableColumns(db, spec.table) : new Set();
    partialRows.push({ table: spec.table, exists, missing_columns: spec.columns.filter((column) => !cols.has(column)) });
  }
  const createdMarkers = partialRows.filter((row) => row.exists && row.missing_columns.length === 0).length;

  if (!build171?.migration_key && createdMarkers >= 3) {
    addCheck(checks, 'warn', 'build171_marker_missing_after_schema_created', 'Build 171 ledger marker', `${createdMarkers} Build 171/173 schema markers are present, but the Build 171 ledger row is missing.`, 'Run database_build171_ledger_repair.sql only; do not rerun the full upgrade against a database that already has the columns.');
  } else if (build171?.migration_key) {
    addCheck(checks, 'pass', 'build171_marker_present', 'Build 171 ledger marker', `Build 171 marker is recorded as ${build171.status || 'recorded'}.`, '');
  } else {
    addCheck(checks, 'warn', 'build171_marker_not_seen', 'Build 171 ledger marker', 'Build 171 marker was not found.', 'For a fresh database, run the latest additive migrations in order.');
  }

  if (build173?.migration_key) {
    addCheck(checks, 'pass', 'build173_marker_present', 'Build 173 ledger marker', `Build 173 marker is recorded as ${build173.status || 'recorded'}.`, '');
  } else {
    addCheck(checks, 'warn', 'build173_marker_missing', 'Build 173 ledger marker', 'Build 173 deployment-preflight marker is not recorded yet.', 'Apply database_build173_deployment_preflight.sql after deployment.');
  }

  return { ledger_exists: true, build171_recorded: !!build171?.migration_key, build173_recorded: !!build173?.migration_key, schema_markers: partialRows };
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
  for (const table of requiredTables) {
    if (!(await tableExists(db, table))) missing.push(table);
  }
  addCheck(
    checks,
    missing.length ? 'fail' : 'pass',
    'core_tables_present',
    'Core D1 tables for store/admin workflows',
    missing.length ? `Missing required table(s): ${missing.join(', ')}.` : `${requiredTables.length} core table(s) are present.`,
    missing.length ? 'Apply the schema migration before deploying this build.' : ''
  );
}

async function inspectPublicPages(request, checks) {
  const pageResults = [];
  for (const page of CORE_PUBLIC_PAGES) {
    const result = await safeFetchText(request, page.path);
    const text = result.text || '';
    const h1Count = (text.match(/<h1\b/gi) || []).length;
    const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const metaMatch = text.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)
      || text.match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
    const plain = cleanHtmlText(text).toLowerCase();
    const missingTerms = (page.requiredTerms || []).filter((term) => !plain.includes(String(term).toLowerCase()));
    const title = cleanHtmlText(titleMatch?.[1] || '');
    const meta = cleanHtmlText(metaMatch?.[1] || '');
    let status = 'pass';
    const issues = [];
    if (!result.ok) { status = 'fail'; issues.push(`fetch ${result.status || 0}`); }
    if (h1Count !== 1) { status = 'fail'; issues.push(`${h1Count} H1 tags`); }
    if (!title) { status = 'fail'; issues.push('missing title'); }
    if (!meta) { status = 'fail'; issues.push('missing meta description'); }
    if (missingTerms.length && status !== 'fail') { status = 'warn'; issues.push(`missing local/search term(s): ${missingTerms.join(', ')}`); }
    pageResults.push({ ...page, status, http_status: result.status, h1_count: h1Count, title, meta_description: meta, missing_terms: missingTerms, issues });
  }
  const failing = pageResults.filter((row) => row.status === 'fail');
  const warning = pageResults.filter((row) => row.status === 'warn');
  addCheck(
    checks,
    failing.length ? 'fail' : (warning.length ? 'warn' : 'pass'),
    'public_page_seo_h1_meta',
    'Public page title/meta/one-H1/local wording',
    failing.length ? `${failing.length} page(s) have blockers.` : (warning.length ? `${warning.length} page(s) need wording review.` : `${pageResults.length} page(s) passed public SEO/H1 checks.`),
    failing.length || warning.length ? 'Review page_results before deploy; each public page should have one clear H1, a title, a meta description, and local wording where relevant.' : '',
    { page_results: pageResults }
  );
  return pageResults;
}

async function inspectAdminPages(request, checks) {
  const results = [];
  for (const path of CORE_ADMIN_PAGES) {
    const result = await safeFetchText(request, path);
    const h1Count = (result.text.match(/<h1\b/gi) || []).length;
    const hasTitle = /<title\b/i.test(result.text || '');
    results.push({ path, ok: result.ok, http_status: result.status, h1_count: h1Count, has_title: hasTitle });
  }
  const bad = results.filter((row) => !row.ok || row.h1_count !== 1 || !row.has_title);
  addCheck(
    checks,
    bad.length ? 'warn' : 'pass',
    'admin_page_fetch_h1',
    'Core admin page fetch/H1 check',
    bad.length ? `${bad.length} admin page(s) need review.` : `${results.length} admin page(s) fetched with one H1 and title.`,
    bad.length ? 'Admin pages should stay readable even when API calls fail.' : '',
    { admin_pages: results }
  );
}

async function inspectStaticFiles(request, checks) {
  const css = await safeFetchText(request, '/css/styles.css');
  if (!css.ok) {
    addCheck(checks, 'fail', 'css_fetch_failed', 'CSS fetch', `Could not fetch /css/styles.css (${css.status || 0}).`, 'Fix asset routing before deploy.');
  } else {
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

async function buildReport(context) {
  const { request, env } = context;
  const db = getDb(env);
  const checks = [];
  if (!db) {
    addCheck(checks, 'fail', 'db_binding_missing', 'D1 binding', 'Database binding is not configured.', 'Set DB or DD_DB in Cloudflare Pages bindings.');
    return { checks, summary: checkStatus(checks), page_results: [], ledger: null };
  }

  const ledger = await inspectLedger(db, checks);
  await inspectDatabase(db, checks);
  const pageResults = await inspectPublicPages(request, checks);
  await inspectAdminPages(request, checks);
  await inspectStaticFiles(request, checks);

  const summary = checkStatus(checks);
  return { checks, summary, page_results: pageResults, ledger };
}

async function ensurePreflightTable(db) {
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
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const report = await buildReport(context);
  const db = getDb(context.env);
  const recent_runs = db && await tableExists(db, 'deployment_preflight_runs') ? await safeAll(db, `
    SELECT deployment_preflight_run_id, build_label, run_status, blocker_count, warning_count, created_by_user_id, created_at
    FROM deployment_preflight_runs
    ORDER BY created_at DESC
    LIMIT 10
  `) : [];
  return jsonResponse({ ok: true, generated_at: new Date().toISOString(), ...report, recent_runs }, 200, { 'Cache-Control': 'no-store' });
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensurePreflightTable(db);
  let body = {};
  try { body = await context.request.json(); } catch { body = {}; }
  const buildLabel = normalizeText(body.build_label || body.buildLabel || 'Build 173');
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
    JSON.stringify({ generated_at: new Date().toISOString(), summary: report.summary, checks: report.checks }),
    Number(adminUser.user_id || 0) || null
  ).run();

  await auditAdminAction(context.env, context.request, adminUser, {
    action_type: 'deployment_preflight_snapshot_saved',
    target_type: 'deployment_preflight',
    target_key: buildLabel,
    details: report.summary,
  });
  return jsonResponse({ ok: true, saved: true, ...report });
}
