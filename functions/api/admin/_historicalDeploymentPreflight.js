// File: /functions/api/admin/deployment-preflight.js
// Brief description: Admin-only deployment preflight that checks D1 migration safety, public SEO basics, CSS drift, schema drift, release manifests, R2 route hints, and post-deploy confirmation status before a deploy.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD_LABEL = 'Build 176';

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


const COLLECTION_LANDING_PAGES = [
  { path: '/collections/', label: 'Collections', requiredTerms: ['collections'] },
  { path: '/marketplaces/', label: 'Marketplaces', requiredTerms: ['marketplace'] },
  { path: '/gift-cards/', label: 'Gift Cards', requiredTerms: ['gift', 'card'] },
  { path: '/events/', label: 'Events', requiredTerms: ['events'] },
  { path: '/pickup/', label: 'Pickup', requiredTerms: ['pickup'] }
];

const CORE_ADMIN_PAGES = [
  '/admin/',
  '/admin/operations/',
  '/admin/release-notes/',
  '/admin/safe-deploy-package/',
  '/admin/post-deploy-smoke-tests/',
  '/admin/deployment-preflight/',
  '/admin/release-control/',
  '/admin/deploy-readiness/'
];

const STATIC_JSON_FILES = [
  '/data/site/seo-page-overrides.json',
  '/data/site/local-seo-bake-actions.json',
  '/data/site/release-notes.json',
  '/data/site/deployment-preflight.json',
  '/data/site/release-package-manifest.json',
  '/data/site/local-business-schema.json'
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
  { migration_key: 'build_174_preflight_detail_manifest', file_name: 'database_build174_deployment_preflight_detail.sql', order: 174, fallback_file: '', note: 'Adds post-deploy confirmations plus richer preflight/detail manifests.' },
  { migration_key: 'build_175_release_control_center', file_name: 'database_build175_release_control.sql', order: 175, fallback_file: '', note: 'Adds release control, deployment history, screenshot jobs, provider webhooks, QA queues, marketplace validation, recall compliance, and local business schema.' },
  { migration_key: 'build_176_release_safety_controls', file_name: 'database_build176_release_safety_controls.sql', order: 176, fallback_file: '', note: 'Adds safe deploy ZIP tracking, live manifest diffs, QA preview items, marketplace validation runs, recall locks, local SEO link/trend rows, LocalBusiness bakes, rollback checklist rows, and notification routes.' }
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
  { table: 'r2_derivative_route_settings', columns: ['r2_derivative_route_setting_id', 'route_status'], area: 'r2 derivatives' },

  { table: 'deployment_history', columns: ['deployment_history_id', 'build_label', 'branch_name', 'deploy_url', 'deployment_status'], area: 'release control' },
  { table: 'deployment_manifest_comparisons', columns: ['deployment_manifest_comparison_id', 'build_label', 'comparison_status', 'missing_file_count', 'changed_file_count'], area: 'release control' },
  { table: 'deployment_screenshot_jobs', columns: ['deployment_screenshot_job_id', 'page_path', 'viewport_width', 'capture_status'], area: 'screenshot evidence' },
  { table: 'preflight_response_keyword_checks', columns: ['preflight_response_keyword_check_id', 'page_path', 'keyword', 'last_status'], area: 'preflight keyword checks' },
  { table: 'product_qa_bulk_fix_queue', columns: ['product_qa_bulk_fix_queue_id', 'blocker_code', 'approval_status', 'product_count'], area: 'product QA' },
  { table: 'r2_private_health_tests', columns: ['r2_private_health_test_id', 'test_kind', 'test_status', 'checksum_sha256'], area: 'R2 private tests' },
  { table: 'accounting_evidence_bundle_checksums', columns: ['accounting_evidence_bundle_checksum_id', 'period_month', 'zip_sha256', 'verification_status'], area: 'accountant evidence' },
  { table: 'gift_card_provider_webhook_events', columns: ['gift_card_provider_webhook_event_id', 'provider', 'event_type', 'delivery_status'], area: 'gift card delivery' },
  { table: 'marketplace_channel_validation_rules', columns: ['marketplace_channel_validation_rule_id', 'channel', 'column_key', 'severity'], area: 'marketplace exports' },
  { table: 'marketplace_export_snapshot_diffs', columns: ['marketplace_export_snapshot_diff_id', 'channel', 'diff_status', 'changed_field_count'], area: 'marketplace exports' },
  { table: 'recall_compliance_reviews', columns: ['recall_compliance_review_id', 'batch_number', 'review_status', 'approval_signature'], area: 'recalls' },
  { table: 'recall_customer_previews', columns: ['recall_customer_preview_id', 'batch_number', 'customer_email', 'preview_status'], area: 'recalls' },
  { table: 'mobile_admin_saved_views', columns: ['mobile_admin_saved_view_id', 'view_key', 'page_path', 'device_target'], area: 'mobile admin' },
  { table: 'local_business_schema_settings', columns: ['local_business_schema_setting_id', 'business_name', 'area_served_json', 'schema_status'], area: 'local SEO schema' },
  { table: 'local_business_schema_extended_fields', columns: ['local_business_schema_extended_field_id', 'local_business_schema_setting_id', 'payment_accepted_json', 'price_range'], area: 'local SEO schema' },
  { table: 'safe_deploy_export_records', columns: ['safe_deploy_export_record_id', 'build_label', 'export_status', 'manifest_path'], area: 'safe deploy export' },
  { table: 'preflight_runtime_incident_links', columns: ['preflight_runtime_incident_link_id', 'deployment_preflight_run_id', 'runtime_incident_id', 'check_code'], area: 'runtime incidents' },
  { table: 'safe_deploy_package_downloads', columns: ['safe_deploy_package_download_id', 'build_label', 'zip_sha256', 'total_bytes'], area: 'safe deploy export' },
  { table: 'release_manifest_live_diffs', columns: ['release_manifest_live_diff_id', 'build_label', 'diff_status', 'missing_file_count'], area: 'release control' },
  { table: 'product_qa_bulk_fix_preview_items', columns: ['product_qa_bulk_fix_preview_item_id', 'product_id', 'blocker_code', 'fix_url'], area: 'product QA' },
  { table: 'marketplace_export_validation_runs', columns: ['marketplace_export_validation_run_id', 'channel', 'validation_status', 'blocker_count'], area: 'marketplace exports' },
  { table: 'recall_notification_locks', columns: ['recall_notification_lock_id', 'batch_number', 'lock_status', 'matching_review_id'], area: 'recalls' },
  { table: 'local_seo_internal_link_suggestions', columns: ['local_seo_internal_link_suggestion_id', 'source_path', 'target_path', 'score'], area: 'local seo' },
  { table: 'local_seo_search_console_trends', columns: ['local_seo_search_console_trend_id', 'page_path', 'query_text', 'impressions'], area: 'local seo' },
  { table: 'deployment_rollback_checklist_rows', columns: ['deployment_rollback_checklist_row_id', 'build_label', 'checklist_key', 'checklist_status'], area: 'rollback safety' }
];

const CONFIRMATION_CHECKS = [
  { key: 'd1_migrations_applied', label: 'D1 migrations applied', detail: 'Build 171 repair, Build 173, and Build 174 SQL have been run or intentionally skipped with notes.' },
  { key: 'preflight_snapshot_saved', label: 'Preflight snapshot saved', detail: 'Deployment Preflight was run and saved after the D1 schema update.' },
  { key: 'public_pages_checked', label: 'Public pages checked', detail: 'One-H1, title, meta, canonical, image alt, and local wording checks were reviewed.' },
  { key: 'smoke_tests_run', label: 'Smoke tests run', detail: 'Core public/admin live URLs were checked from the post-deploy smoke-test page.' },
  { key: 'release_notes_reviewed', label: 'Release notes reviewed', detail: 'Release Notes and Safe Deploy Package were reviewed before promotion.' },
  { key: 'r2_email_bindings_reviewed', label: 'R2/email bindings reviewed', detail: 'R2 derivative/evidence routes and gift-card email provider settings were verified or left in manual mode.' },
  { key: 'manifest_compared', label: 'Release manifest compared after deploy', detail: 'The generated manifest was compared against the deployed static manifest path.' },
  { key: 'local_business_schema_reviewed', label: 'Local business schema reviewed', detail: 'The local-business structured data editor/output was reviewed before local SEO bake.' },
  { key: 'recall_compliance_reviewed', label: 'Recall compliance reviewed', detail: 'Recall notices remain draft-only until compliance notes and approval signature are present.' }
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
  const build176 = expected.find((row) => row.migration_key === 'build_176_release_safety_controls');

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


  const build175 = expected.find((row) => row.migration_key === 'build_175_release_control_center');
  if (build175?.recorded) addCheck(checks, 'pass', 'build175_marker_present', 'Build 175 ledger marker', `Build 175 marker is recorded as ${build175.status || 'recorded'}.`, '');
  else addCheck(checks, 'warn', 'build175_marker_missing', 'Build 175 ledger marker', 'Build 175 release-control marker is not recorded yet.', 'Apply database_build175_release_control.sql after Build 174.');

  if (build176?.recorded) addCheck(checks, 'pass', 'build176_marker_present', 'Build 176 ledger marker', `Build 176 marker is recorded as ${build176.status || 'recorded'}.`, '');
  else addCheck(checks, 'warn', 'build176_marker_missing', 'Build 176 ledger marker', 'Build 176 release-safety marker is not recorded yet.', 'Apply database_build176_release_safety_controls.sql after Build 175.');

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

  const requiredTables = ['products', 'product_images', 'product_seo', 'orders', 'order_items', 'site_item_inventory', 'catalog_items', 'accounting_evidence_attachments', 'gift_cards', 'public_proof_candidates', 'marketplace_export_history', 'deployment_history', 'local_business_schema_settings'];
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
      'Run database_build175_release_control.sql.',
      'Run database_build176_release_safety_controls.sql.',
      'Open /admin/deployment-preflight/, run Preflight, then Save Snapshot.'
    ],
    partially_upgraded_database: [
      build171Recorded ? 'Build 171 marker is already recorded.' : 'If Build 171 tables/columns already exist, run database_build171_ledger_repair.sql only.',
      build173Recorded ? 'Build 173 marker is already recorded.' : 'Run database_build173_deployment_preflight.sql after the Build 171 marker is safe.',
      build174Recorded ? 'Build 174 marker is already recorded.' : 'Run database_build174_deployment_preflight_detail.sql after Build 173.',
      recorded.has('build_175_release_control_center') ? 'Build 175 marker is already recorded.' : 'Run database_build175_release_control.sql after Build 174.',
      recorded.has('build_176_release_safety_controls') ? 'Build 176 marker is already recorded.' : 'Run database_build176_release_safety_controls.sql after Build 175.',
      'Do not rerun ALTER TABLE-heavy blocks against a database where those columns already exist.'
    ],
    repair_only: [
      'Use database_build171_ledger_repair.sql only when the Build 171 schema already exists but the ledger marker failed.',
      'Use the preflight schema diff drawer before deciding whether to run full or repair-only SQL.'
    ]
  };
}


function countKeyword(text, keyword) {
  const plain = lc(cleanHtmlText(text || ''));
  const needle = lc(keyword || '');
  if (!needle) return 0;
  return plain.split(needle).length - 1;
}

async function inspectResponseKeywordChecks(request, db, pageResults, checks) {
  const dbRows = await tableExists(db, 'preflight_response_keyword_checks') ? await safeAll(db, `SELECT page_path, keyword, keyword_kind, is_required, last_status, last_count FROM preflight_response_keyword_checks ORDER BY page_path, keyword LIMIT 200`) : [];
  const configuredByPath = new Map();
  for (const row of dbRows) {
    const key = normalizeText(row.page_path);
    if (!configuredByPath.has(key)) configuredByPath.set(key, []);
    configuredByPath.get(key).push(row);
  }
  const results = [];
  for (const page of CORE_PUBLIC_PAGES) {
    const result = await safeFetchText(request, page.path);
    const configured = configuredByPath.get(page.path) || page.requiredTerms.map((keyword) => ({ page_path: page.path, keyword, keyword_kind: 'roadmap_required', is_required: 1 }));
    for (const item of configured) {
      const count = countKeyword(result.text || '', item.keyword);
      const status = result.ok && (!Number(item.is_required ?? 1) || count > 0) ? 'pass' : 'warn';
      results.push({ page_path: page.path, keyword: item.keyword, keyword_kind: item.keyword_kind || 'local_search', is_required: Number(item.is_required ?? 1), count, status });
    }
  }
  const warnRows = results.filter((row) => row.status !== 'pass');
  addCheck(checks, warnRows.length ? 'warn' : 'pass', 'response_body_keyword_checks', 'Response-body keyword checks', warnRows.length ? `${warnRows.length} required page/keyword pair(s) need review.` : `${results.length} page/keyword pair(s) were found in response bodies.`, warnRows.length ? 'Add or adjust local wording in prominent page copy, title, H1, or supporting sections.' : '', { keyword_results: results });
  return results;
}

async function inspectCollectionPages(request, checks) {
  const rowsOut = [];
  for (const page of COLLECTION_LANDING_PAGES) {
    const result = await safeFetchText(request, page.path);
    const text = result.text || '';
    const plain = cleanHtmlText(text).toLowerCase();
    const h1Count = (text.match(/<h1\b/gi) || []).length;
    const missingTerms = page.requiredTerms.filter((term) => !plain.includes(term));
    let status = 'pass';
    if (!result.ok || h1Count !== 1) status = 'warn';
    else if (missingTerms.length || !titleText(text) || !metaContent(text, 'description')) status = 'warn';
    rowsOut.push({ ...page, status, ok: result.ok, http_status: result.status, h1_count: h1Count, title: titleText(text), meta_description: metaContent(text, 'description'), missing_terms: missingTerms, url: result.url });
  }
  const warnRows = rowsOut.filter((row) => row.status !== 'pass');
  addCheck(checks, warnRows.length ? 'warn' : 'pass', 'collection_landing_pages', 'Collection/category landing-page checks', warnRows.length ? `${warnRows.length} collection/category page(s) need review.` : `${rowsOut.length} collection/category page(s) passed basic fetch/H1/title/meta checks.`, warnRows.length ? 'Review collection/category pages and add clean local wording where useful.' : '', { collection_pages: rowsOut });
  return rowsOut;
}

async function inspectSampleProductPage(db, request, checks) {
  let product = {};
  if (await tableExists(db, 'products')) {
    product = await safeFirst(db, `SELECT product_id, slug, name, status FROM products WHERE COALESCE(slug,'') <> '' AND LOWER(COALESCE(status,'active')) NOT IN ('archived','deleted','draft') ORDER BY COALESCE(updated_at, created_at) DESC LIMIT 1`);
    if (!product?.slug) product = await safeFirst(db, `SELECT product_id, slug, name, status FROM products WHERE COALESCE(slug,'') <> '' ORDER BY product_id DESC LIMIT 1`);
  }
  if (!product?.slug) {
    addCheck(checks, 'warn', 'sample_product_page_missing_slug', 'Sample product-detail URL check', 'No product slug was available in D1 for a sample public product-detail preflight.', 'Publish or keep one known-safe product slug for deploy checks.');
    return null;
  }
  const path = `/shop/product/?slug=${encodeURIComponent(product.slug)}`;
  const result = await safeFetchText(request, path);
  const text = result.text || '';
  const h1Count = (text.match(/<h1\b/gi) || []).length;
  const hasProductScript = /product-detail\.js|api\/product-detail|product/i.test(text);
  const status = result.ok && h1Count <= 1 && hasProductScript ? 'pass' : 'warn';
  const payload = { product_id: product.product_id, slug: product.slug, name: product.name, path, ok: result.ok, http_status: result.status, h1_count: h1Count, has_product_script: hasProductScript };
  addCheck(checks, status, 'sample_product_detail_page', 'Sample product-detail public URL', status === 'pass' ? `Sample product URL ${path} loaded with product detail signals.` : `Sample product URL ${path} needs review.`, status === 'pass' ? '' : 'Confirm the latest published product slug opens cleanly on /shop/product/.', payload);
  return payload;
}

async function inspectReleaseControl(db, checks) {
  const table = await tableExists(db, 'deployment_history');
  if (!table) {
    addCheck(checks, 'warn', 'release_control_tables_missing', 'Release-control tables', 'Build 175 release-control tables are not present yet.', 'Run database_build175_release_control.sql after Build 174.');
    return { deployment_history: [], manifest_comparisons: [] };
  }
  const history = await safeAll(db, `SELECT deployment_history_id, build_label, branch_name, deploy_url, deployment_status, promoted_at, created_at FROM deployment_history ORDER BY created_at DESC LIMIT 10`);
  const comparisons = await tableExists(db, 'deployment_manifest_comparisons') ? await safeAll(db, `SELECT deployment_manifest_comparison_id, build_label, comparison_status, missing_file_count, changed_file_count, compared_at, created_at FROM deployment_manifest_comparisons ORDER BY COALESCE(compared_at, created_at) DESC LIMIT 10`) : [];
  const liveDiffs = await tableExists(db, 'release_manifest_live_diffs') ? await safeAll(db, `SELECT build_label, diff_status, missing_file_count, changed_file_count, extra_file_count, checked_at FROM release_manifest_live_diffs ORDER BY checked_at DESC LIMIT 10`) : [];
  const downloads = await tableExists(db, 'safe_deploy_package_downloads') ? await safeAll(db, `SELECT build_label, file_count, total_bytes, zip_sha256, download_status, prepared_at FROM safe_deploy_package_downloads ORDER BY prepared_at DESC LIMIT 10`) : [];
  const latestBad = [...comparisons, ...liveDiffs].filter((row) => ['failed','changed','missing','review'].includes(lc(row.comparison_status || row.diff_status)) || Number(row.missing_file_count || 0) || Number(row.changed_file_count || 0));
  addCheck(checks, latestBad.length ? 'warn' : 'pass', 'release_history_manifest_compare', 'Deployment history and manifest comparison', latestBad.length ? `${latestBad.length} manifest comparison/diff row(s) need review.` : `Release-control tables are present with ${history.length} deployment history row(s), ${comparisons.length} stored comparison row(s), ${liveDiffs.length} live diff row(s), and ${downloads.length} safe ZIP download row(s).`, latestBad.length ? 'Compare the deployed /data/site/release-package-manifest.json with the package manifest before promotion.' : '', { deployment_history: history, manifest_comparisons: comparisons, live_manifest_diffs: liveDiffs, safe_downloads: downloads });
  return { deployment_history: history, manifest_comparisons: comparisons, live_manifest_diffs: liveDiffs, safe_downloads: downloads };
}

async function inspectSearchConsoleAndInternalLinks(db, checks) {
  const hasSearch = await tableExists(db, 'search_console_query_imports') || await tableExists(db, 'search_console_import_rows') || await tableExists(db, 'search_console_queries') || await tableExists(db, 'local_seo_search_console_trends');
  const bakeRows = await tableExists(db, 'local_seo_bake_actions') ? await safeAll(db, `SELECT page_path, action_status, proposed_title, internal_link_notes, updated_at FROM local_seo_bake_actions ORDER BY updated_at DESC LIMIT 20`) : [];
  const suggestions = await tableExists(db, 'local_seo_internal_link_suggestions') ? await safeAll(db, `SELECT source_path, target_path, suggested_anchor, score, suggestion_status FROM local_seo_internal_link_suggestions ORDER BY score DESC LIMIT 20`) : [];
  const trends = await tableExists(db, 'local_seo_search_console_trends') ? await safeAll(db, `SELECT page_path, query_text, impressions, clicks, average_position FROM local_seo_search_console_trends ORDER BY impressions DESC LIMIT 20`) : [];
  const readyLinks = bakeRows.filter((row) => normalizeText(row.internal_link_notes));
  addCheck(checks, hasSearch || readyLinks.length || suggestions.length ? 'pass' : 'warn', 'search_console_internal_link_queue', 'Search Console trends and internal-link suggestions', hasSearch ? `Search Console/trend table appears available; ${suggestions.length} generated suggestion row(s) and ${trends.length} trend row(s) are visible.` : `${readyLinks.length} bake-action row(s) include internal-link notes and ${suggestions.length} generated suggestion row(s) exist; no Search Console trend table was detected.`, hasSearch || readyLinks.length || suggestions.length ? 'Review Local SEO rows for trending queries and internal-link bake actions.' : 'Add Search Console import rows or queue internal-link suggestions from high-traffic pages.', { has_search_console_table: hasSearch, internal_link_rows: readyLinks, suggestions, trends });
  return { has_search_console_table: hasSearch, internal_link_rows: readyLinks, suggestions, trends };
}

async function inspectProductQaBulkQueue(db, checks) {
  const rowsOut = await tableExists(db, 'product_qa_bulk_fix_queue') ? await safeAll(db, `SELECT blocker_code, fix_type, product_count, approval_status, updated_at FROM product_qa_bulk_fix_queue ORDER BY updated_at DESC LIMIT 30`) : [];
  const pending = rowsOut.filter((row) => ['needs_approval','queued','preview'].includes(lc(row.approval_status)));
  addCheck(checks, rowsOut.length ? 'pass' : 'warn', 'product_qa_bulk_fix_queue', 'Product QA bulk-fix queue', rowsOut.length ? `${rowsOut.length} Product QA bulk-fix queue row(s) available; ${pending.length} pending approval.` : 'Product QA bulk-fix queue table has no rows yet.', rowsOut.length ? 'Approve only safe field-level fixes after previewing the affected product IDs.' : 'Use Product QA history to create grouped blocker queues by fix type.', { rows: rowsOut });
  return rowsOut;
}

async function inspectR2PrivateEvidenceTests(db, env, checks) {
  const rowsOut = await tableExists(db, 'r2_private_health_tests') ? await safeAll(db, `SELECT test_kind, bucket_label, test_status, http_status, bytes_tested, checked_at, notes FROM r2_private_health_tests ORDER BY COALESCE(checked_at, created_at) DESC LIMIT 20`) : [];
  const hasSignedFlag = !!(env?.ACCOUNTANT_EVIDENCE_R2_FETCH_ENABLED || env?.PRIVATE_UPLOAD_R2_SIGNING_ENABLED || env?.R2_SIGNED_DOWNLOADS_ENABLED);
  const recentPass = rowsOut.some((row) => ['pass','passed','healthy'].includes(lc(row.test_status)));
  addCheck(checks, recentPass || !hasSignedFlag ? 'pass' : 'warn', 'r2_signed_private_tests', 'R2 signed evidence/private-upload tests', recentPass ? 'At least one recent R2 signed/private health test passed.' : (hasSignedFlag ? 'R2 signed/private mode flag is visible, but no passing private health-test row was found.' : 'R2 signed/private download flags are not enabled; private binary evidence remains guarded/manual.'), recentPass || !hasSignedFlag ? '' : 'Run a signed download/private upload test before relying on binary evidence or customer private uploads.', { enabled_flag_visible: hasSignedFlag, rows: rowsOut });
  return rowsOut;
}

async function inspectAccountingBundleChecksums(db, checks) {
  const rowsOut = await tableExists(db, 'accounting_evidence_bundle_checksums') ? await safeAll(db, `SELECT period_month, export_label, attachment_count, total_bytes, zip_sha256, verification_status, created_at FROM accounting_evidence_bundle_checksums ORDER BY created_at DESC LIMIT 15`) : [];
  const unverified = rowsOut.filter((row) => lc(row.verification_status) !== 'verified');
  addCheck(checks, rowsOut.length && !unverified.length ? 'pass' : 'warn', 'accounting_bundle_checksum_verification', 'Accountant ZIP checksum verification', rowsOut.length ? `${rowsOut.length} accountant bundle checksum row(s); ${unverified.length} not verified.` : 'No accountant evidence bundle checksum rows are recorded yet.', rowsOut.length ? 'Verify the ZIP hash after download before sending to the accountant.' : 'Generate a checksum record when accountant evidence ZIPs are prepared.', { rows: rowsOut });
  return rowsOut;
}

async function inspectGiftCardWebhooks(db, checks) {
  const rowsOut = await tableExists(db, 'gift_card_provider_webhook_events') ? await safeAll(db, `SELECT provider, event_type, delivery_status, received_at, processed_at FROM gift_card_provider_webhook_events ORDER BY received_at DESC LIMIT 30`) : [];
  const failed = rowsOut.filter((row) => ['bounce','bounced','complaint','failed','error'].includes(lc(row.delivery_status)) || ['bounce','complaint'].includes(lc(row.event_type)));
  addCheck(checks, failed.length ? 'warn' : 'pass', 'gift_card_provider_webhooks', 'Gift-card provider webhooks', failed.length ? `${failed.length} gift-card provider webhook event(s) need attention.` : `${rowsOut.length} gift-card provider webhook event(s) recorded with no bounce/complaint status in the latest rows.`, failed.length ? 'Review provider event payload and delivery log before retrying customer delivery.' : '', { rows: rowsOut });
  return rowsOut;
}

async function inspectMarketplaceValidationAndDiffs(db, checks) {
  const rules = await tableExists(db, 'marketplace_channel_validation_rules') ? await safeAll(db, `SELECT channel, column_key, rule_kind, is_required, rule_status, severity FROM marketplace_channel_validation_rules ORDER BY channel, column_key LIMIT 200`) : [];
  const diffs = await tableExists(db, 'marketplace_export_snapshot_diffs') ? await safeAll(db, `SELECT channel, previous_history_id, current_history_id, diff_status, changed_row_count, changed_field_count, created_at FROM marketplace_export_snapshot_diffs ORDER BY created_at DESC LIMIT 20`) : [];
  const activeBlockers = rules.filter((row) => Number(row.is_required || 0) && lc(row.rule_status) === 'active' && lc(row.severity) === 'blocker');
  addCheck(checks, activeBlockers.length ? 'pass' : 'warn', 'marketplace_required_columns_and_diffs', 'Marketplace required-column validation and visual diff rows', activeBlockers.length ? `${activeBlockers.length} active required-column rule(s); ${diffs.length} snapshot diff row(s).` : 'No active marketplace required-column blocker rules were found yet.', activeBlockers.length ? 'Run validation before downloads and review side-by-side diff rows before rollback.' : 'Seed required-column rules for Etsy, Facebook Marketplace, Pinterest, and manual CSV exports.', { rules, diffs });
  return { rules, diffs };
}

async function inspectRecallCompliance(db, checks) {
  const reviews = await tableExists(db, 'recall_compliance_reviews') ? await safeAll(db, `SELECT batch_number, recall_id, review_status, approval_signature, approved_at, updated_at FROM recall_compliance_reviews ORDER BY updated_at DESC LIMIT 30`) : [];
  const previews = await tableExists(db, 'recall_customer_previews') ? await safeAll(db, `SELECT batch_number, customer_email, product_summary, order_summary, preview_status, updated_at FROM recall_customer_previews ORDER BY updated_at DESC LIMIT 30`) : [];
  const unsigned = reviews.filter((row) => ['approved','send_approved'].includes(lc(row.review_status)) && !normalizeText(row.approval_signature));
  const draftPreviews = previews.filter((row) => lc(row.preview_status) === 'draft');
  addCheck(checks, unsigned.length ? 'warn' : 'pass', 'recall_compliance_customer_previews', 'Recall compliance signatures and customer previews', unsigned.length ? `${unsigned.length} approved recall review(s) are missing an approval signature.` : `${reviews.length} compliance review row(s) and ${previews.length} customer preview row(s) are available.`, unsigned.length ? 'Require legal/compliance notes and signature before any recall draft leaves draft status.' : '', { reviews, previews, draft_preview_count: draftPreviews.length });
  return { reviews, previews };
}

async function inspectMobileViewsAndLocalBusinessSchema(db, checks) {
  const mobileViews = await tableExists(db, 'mobile_admin_saved_views') ? await safeAll(db, `SELECT view_key, view_label, page_path, device_target, is_default, updated_at FROM mobile_admin_saved_views ORDER BY is_default DESC, updated_at DESC LIMIT 50`) : [];
  const localSchema = await tableExists(db, 'local_business_schema_settings') ? await safeAll(db, `SELECT business_name, canonical_url, telephone, email, area_served_json, service_types_json, schema_status, updated_at FROM local_business_schema_settings ORDER BY updated_at DESC LIMIT 5`) : [];
  const wanted = new Set(['today_tasks_phone','deployment_preflight_phone','post_deploy_smoke_phone','accounting_close_phone','release_control_phone']);
  const have = new Set(mobileViews.map((row) => row.view_key));
  const missingViews = [...wanted].filter((key) => !have.has(key));
  const schemaReady = localSchema.some((row) => ['ready','active','published'].includes(lc(row.schema_status)));
  addCheck(checks, missingViews.length || !schemaReady ? 'warn' : 'pass', 'mobile_saved_views_local_business_schema', 'Mobile admin saved views and local business schema', missingViews.length || !schemaReady ? `${missingViews.length} mobile saved view(s) missing; local schema ready=${schemaReady ? 'yes' : 'no'}.` : 'Phone saved views and ready local-business schema rows are available.', missingViews.length || !schemaReady ? 'Seed mobile saved views and review/publish local-business structured data before local SEO bake.' : '', { mobile_views: mobileViews, missing_views: missingViews, local_business_schema: localSchema });
  return { mobile_views: mobileViews, missing_views: missingViews, local_business_schema: localSchema };
}

async function recordRuntimeIncidentsForFailedPreflight(db, report, adminUser, buildLabel) {
  if (!(await tableExists(db, 'runtime_incidents'))) return null;
  const failed = (report.checks || []).filter((check) => ['fail','warn'].includes(lc(check.status))).slice(0, 20);
  let inserted = 0;
  for (const check of failed) {
    try {
      await db.prepare(`
        INSERT INTO runtime_incidents (incident_scope, incident_code, severity, endpoint_path, request_method, message, details_json, related_user_id, user_agent, review_status, created_at)
        VALUES ('deployment_preflight', ?, ?, ?, 'CHECK', ?, ?, ?, 'deployment-preflight', 'open', CURRENT_TIMESTAMP)
      `).bind(
        normalizeText(check.code || 'preflight_check'),
        lc(check.status) === 'fail' ? 'error' : 'warning',
        normalizeText(check.evidence?.path || check.evidence?.page_path || ''),
        normalizeText(check.label || check.code || 'Deployment preflight warning'),
        JSON.stringify({ build_label: buildLabel, detail: check.detail, action: check.action, evidence: check.evidence || {} }),
        Number(adminUser?.user_id || 0) || null
      ).run();
      inserted += 1;
    } catch {}
  }
  return inserted;
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
  const response_keyword_results = await inspectResponseKeywordChecks(request, db, page_results, checks);
  const collection_pages = await inspectCollectionPages(request, checks);
  const sample_product_page = await inspectSampleProductPage(db, request, checks);
  await inspectAdminPages(request, checks);
  await inspectStaticFiles(request, checks);
  const r2_health = await inspectR2Health(db, env, checks);
  const release_control = await inspectReleaseControl(db, checks);
  const search_console_internal_links = await inspectSearchConsoleAndInternalLinks(db, checks);
  const product_qa_bulk_queue = await inspectProductQaBulkQueue(db, checks);
  const r2_private_tests = await inspectR2PrivateEvidenceTests(db, env, checks);
  const accounting_bundle_checksums = await inspectAccountingBundleChecksums(db, checks);
  const gift_card_webhooks = await inspectGiftCardWebhooks(db, checks);
  const marketplace_validation = await inspectMarketplaceValidationAndDiffs(db, checks);
  const recall_compliance = await inspectRecallCompliance(db, checks);
  const mobile_local_schema = await inspectMobileViewsAndLocalBusinessSchema(db, checks);
  const post_deploy_confirmations = await inspectPostDeployConfirmations(db, checks);

  const summary = checkStatus(checks);
  return { checks, summary, page_results, response_keyword_results, collection_pages, sample_product_page, ledger, expected_schema, migration_plan: buildMigrationPlan(ledger), duplicate_ownership, data_integrity, r2_health, release_control, search_console_internal_links, product_qa_bulk_queue, r2_private_tests, accounting_bundle_checksums, gift_card_webhooks, marketplace_validation, recall_compliance, mobile_local_schema, post_deploy_confirmations };
}

async function ensurePreflightTables(db) {

  await db.prepare(`CREATE TABLE IF NOT EXISTS deployment_history (deployment_history_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT, branch_name TEXT, commit_sha TEXT, deploy_url TEXT, build_zip_label TEXT, package_manifest_hash TEXT, deployment_status TEXT NOT NULL DEFAULT 'planned', promoted_by_user_id INTEGER, promoted_at TEXT, notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS deployment_manifest_comparisons (deployment_manifest_comparison_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT, expected_manifest_path TEXT NOT NULL DEFAULT '/data/site/release-package-manifest.json', deployed_manifest_url TEXT, comparison_status TEXT NOT NULL DEFAULT 'not_run', expected_file_count INTEGER NOT NULL DEFAULT 0, deployed_file_count INTEGER NOT NULL DEFAULT 0, missing_file_count INTEGER NOT NULL DEFAULT 0, changed_file_count INTEGER NOT NULL DEFAULT 0, comparison_json TEXT NOT NULL DEFAULT '{}', compared_by_user_id INTEGER, compared_at TEXT, notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS deployment_screenshot_jobs (deployment_screenshot_job_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT, page_path TEXT NOT NULL, screenshot_kind TEXT NOT NULL DEFAULT 'dark_theme_regression', viewport_width INTEGER NOT NULL DEFAULT 390, viewport_height INTEGER NOT NULL DEFAULT 844, theme TEXT NOT NULL DEFAULT 'dark', capture_status TEXT NOT NULL DEFAULT 'queued', evidence_url TEXT, r2_object_key TEXT, notes TEXT, created_by_user_id INTEGER, captured_by_user_id INTEGER, captured_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
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

  const runtime_incident_count = await recordRuntimeIncidentsForFailedPreflight(db, report, adminUser, buildLabel);

  await auditAdminAction(context.env, context.request, adminUser, {
    action_type: 'deployment_preflight_snapshot_saved',
    target_type: 'deployment_preflight',
    target_key: buildLabel,
    details: report.summary,
  });
  return jsonResponse({ ok: true, saved: true, build_label: buildLabel, runtime_incident_count, ...report });
}
