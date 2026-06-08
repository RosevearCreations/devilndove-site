// File: /functions/api/admin/release-control.js
// Brief description: Admin release-control center for deployment history, manifest comparisons, screenshot jobs, local-business schema, safe deploy exports, QA previews, marketplace validations, recall locks, and rollback checks.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD_LABEL = 'Build 177';
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function lc(value) { return normalizeText(value).toLowerCase(); }
async function tableExists(db, tableName) { try { return !!(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(tableName).first()); } catch { return false; } }
async function safeAll(db, sql, bindings = []) { try { return rows(await db.prepare(sql).bind(...bindings).all()); } catch { return []; } }
async function safeFirst(db, sql, bindings = [], fallback = {}) { try { return (await db.prepare(sql).bind(...bindings).first()) || fallback; } catch { return fallback; } }
function parseJson(value, fallback) { try { return JSON.parse(value || ''); } catch { return fallback; } }
function toArray(value, fallback = []) { if (Array.isArray(value)) return value; return String(value || '').split(',').map((v) => v.trim()).filter(Boolean).length ? String(value || '').split(',').map((v) => v.trim()).filter(Boolean) : fallback; }

async function ensureTables(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS deployment_history (deployment_history_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT, branch_name TEXT, commit_sha TEXT, deploy_url TEXT, build_zip_label TEXT, package_manifest_hash TEXT, deployment_status TEXT NOT NULL DEFAULT 'planned', promoted_by_user_id INTEGER, promoted_at TEXT, notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS deployment_manifest_comparisons (deployment_manifest_comparison_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT, expected_manifest_path TEXT NOT NULL DEFAULT '/data/site/release-package-manifest.json', deployed_manifest_url TEXT, comparison_status TEXT NOT NULL DEFAULT 'not_run', expected_file_count INTEGER NOT NULL DEFAULT 0, deployed_file_count INTEGER NOT NULL DEFAULT 0, missing_file_count INTEGER NOT NULL DEFAULT 0, changed_file_count INTEGER NOT NULL DEFAULT 0, comparison_json TEXT NOT NULL DEFAULT '{}', compared_by_user_id INTEGER, compared_at TEXT, notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS deployment_screenshot_jobs (deployment_screenshot_job_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT, page_path TEXT NOT NULL, screenshot_kind TEXT NOT NULL DEFAULT 'dark_theme_regression', viewport_width INTEGER NOT NULL DEFAULT 390, viewport_height INTEGER NOT NULL DEFAULT 844, theme TEXT NOT NULL DEFAULT 'dark', capture_status TEXT NOT NULL DEFAULT 'queued', evidence_url TEXT, r2_object_key TEXT, notes TEXT, created_by_user_id INTEGER, captured_by_user_id INTEGER, captured_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS mobile_admin_saved_views (mobile_admin_saved_view_id INTEGER PRIMARY KEY AUTOINCREMENT, view_key TEXT NOT NULL UNIQUE, view_label TEXT NOT NULL, page_path TEXT NOT NULL, device_target TEXT NOT NULL DEFAULT 'phone', filter_json TEXT NOT NULL DEFAULT '{}', sort_json TEXT NOT NULL DEFAULT '{}', is_default INTEGER NOT NULL DEFAULT 0, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS local_business_schema_settings (local_business_schema_setting_id INTEGER PRIMARY KEY AUTOINCREMENT, business_name TEXT NOT NULL DEFAULT 'Devil n Dove', canonical_url TEXT NOT NULL DEFAULT 'https://devilndove.com/', telephone TEXT, email TEXT, area_served_json TEXT NOT NULL DEFAULT '["Southern Ontario","Oxford County","Norfolk County"]', service_types_json TEXT NOT NULL DEFAULT '["handmade jewelry","custom gifts","laser engraving","custom candles","custom soap"]', same_as_json TEXT NOT NULL DEFAULT '[]', schema_status TEXT NOT NULL DEFAULT 'draft', schema_json TEXT NOT NULL DEFAULT '{}', updated_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS local_business_schema_extended_fields (local_business_schema_extended_field_id INTEGER PRIMARY KEY AUTOINCREMENT, local_business_schema_setting_id INTEGER, opening_hours_json TEXT NOT NULL DEFAULT '[]', logo_url TEXT, image_url TEXT, payment_accepted_json TEXT NOT NULL DEFAULT '["Cash","Credit Card","Debit","E-transfer"]', price_range TEXT DEFAULT '$$', address_json TEXT NOT NULL DEFAULT '{}', geo_json TEXT NOT NULL DEFAULT '{}', updated_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(local_business_schema_setting_id))`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS safe_deploy_export_records (safe_deploy_export_record_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT, export_label TEXT, release_notes_path TEXT DEFAULT 'RELEASE_NOTES.md', preflight_markdown_path TEXT, manifest_path TEXT DEFAULT 'data/site/release-package-manifest.json', schema_paths_json TEXT NOT NULL DEFAULT '[]', smoke_results_json TEXT NOT NULL DEFAULT '{}', export_status TEXT NOT NULL DEFAULT 'planned', zip_sha256 TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS safe_deploy_package_downloads (safe_deploy_package_download_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT, package_kind TEXT NOT NULL DEFAULT 'safe_deploy_zip', included_files_json TEXT NOT NULL DEFAULT '[]', file_count INTEGER NOT NULL DEFAULT 0, total_bytes INTEGER NOT NULL DEFAULT 0, zip_sha256 TEXT, download_status TEXT NOT NULL DEFAULT 'prepared', prepared_by_user_id INTEGER, prepared_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS release_manifest_live_diffs (release_manifest_live_diff_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT, expected_manifest_url TEXT, deployed_manifest_url TEXT, diff_status TEXT NOT NULL DEFAULT 'not_run', expected_file_count INTEGER NOT NULL DEFAULT 0, deployed_file_count INTEGER NOT NULL DEFAULT 0, missing_file_count INTEGER NOT NULL DEFAULT 0, changed_file_count INTEGER NOT NULL DEFAULT 0, extra_file_count INTEGER NOT NULL DEFAULT 0, diff_json TEXT NOT NULL DEFAULT '{}', checked_by_user_id INTEGER, checked_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS marketplace_export_validation_runs (marketplace_export_validation_run_id INTEGER PRIMARY KEY AUTOINCREMENT, channel TEXT NOT NULL, export_history_id INTEGER, validation_status TEXT NOT NULL DEFAULT 'not_run', blocker_count INTEGER NOT NULL DEFAULT 0, warning_count INTEGER NOT NULL DEFAULT 0, checked_rows INTEGER NOT NULL DEFAULT 0, result_json TEXT NOT NULL DEFAULT '{}', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS product_qa_bulk_fix_preview_items (product_qa_bulk_fix_preview_item_id INTEGER PRIMARY KEY AUTOINCREMENT, product_qa_bulk_fix_queue_id INTEGER, product_id INTEGER NOT NULL, blocker_code TEXT NOT NULL, focus_field TEXT, current_value TEXT, suggested_value TEXT, fix_url TEXT, preview_status TEXT NOT NULL DEFAULT 'needs_review', created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS product_qa_bulk_fix_apply_events (product_qa_bulk_fix_apply_event_id INTEGER PRIMARY KEY AUTOINCREMENT, product_qa_bulk_fix_queue_id INTEGER, apply_status TEXT NOT NULL DEFAULT 'preview_only', applied_field TEXT, applied_count INTEGER NOT NULL DEFAULT 0, skipped_count INTEGER NOT NULL DEFAULT 0, event_json TEXT NOT NULL DEFAULT '{}', approved_by_user_id INTEGER, applied_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS gift_card_webhook_signature_checks (gift_card_webhook_signature_check_id INTEGER PRIMARY KEY AUTOINCREMENT, provider TEXT NOT NULL, event_id INTEGER, signature_status TEXT NOT NULL DEFAULT 'not_checked', signature_header_present INTEGER NOT NULL DEFAULT 0, timestamp_header_present INTEGER NOT NULL DEFAULT 0, replay_window_seconds INTEGER NOT NULL DEFAULT 300, checked_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS recall_notification_locks (recall_notification_lock_id INTEGER PRIMARY KEY AUTOINCREMENT, batch_number TEXT NOT NULL, recall_id INTEGER, lock_status TEXT NOT NULL DEFAULT 'locked_pending_review', required_review_status TEXT NOT NULL DEFAULT 'approved', matching_review_id INTEGER, last_checked_at TEXT DEFAULT CURRENT_TIMESTAMP, checked_by_user_id INTEGER, notes TEXT, UNIQUE(batch_number, recall_id))`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS local_seo_internal_link_suggestions (local_seo_internal_link_suggestion_id INTEGER PRIMARY KEY AUTOINCREMENT, source_path TEXT NOT NULL, target_path TEXT NOT NULL, suggested_anchor TEXT, reason TEXT, suggestion_status TEXT NOT NULL DEFAULT 'needs_review', score INTEGER NOT NULL DEFAULT 0, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(source_path, target_path, suggested_anchor))`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS local_seo_search_console_trends (local_seo_search_console_trend_id INTEGER PRIMARY KEY AUTOINCREMENT, page_path TEXT NOT NULL, query_text TEXT, clicks INTEGER NOT NULL DEFAULT 0, impressions INTEGER NOT NULL DEFAULT 0, ctr REAL NOT NULL DEFAULT 0, average_position REAL NOT NULL DEFAULT 0, period_start TEXT, period_end TEXT, trend_status TEXT NOT NULL DEFAULT 'imported', created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS local_business_schema_bakes (local_business_schema_bake_id INTEGER PRIMARY KEY AUTOINCREMENT, source_setting_id INTEGER, bake_status TEXT NOT NULL DEFAULT 'draft', target_paths_json TEXT NOT NULL DEFAULT '[]', schema_json TEXT NOT NULL DEFAULT '{}', output_path TEXT DEFAULT 'data/site/local-business-schema.json', baked_by_user_id INTEGER, baked_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS deployment_rollback_checklist_rows (deployment_rollback_checklist_row_id INTEGER PRIMARY KEY AUTOINCREMENT, deployment_history_id INTEGER, build_label TEXT, checklist_key TEXT NOT NULL, checklist_label TEXT NOT NULL, checklist_status TEXT NOT NULL DEFAULT 'not_checked', required_before_rollback INTEGER NOT NULL DEFAULT 1, notes TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(build_label, checklist_key))`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS cloudflare_deployment_import_runs (cloudflare_deployment_import_run_id INTEGER PRIMARY KEY AUTOINCREMENT, import_status TEXT NOT NULL DEFAULT 'not_configured', account_id_present INTEGER NOT NULL DEFAULT 0, project_name_present INTEGER NOT NULL DEFAULT 0, imported_count INTEGER NOT NULL DEFAULT 0, response_json TEXT NOT NULL DEFAULT '{}', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`).run();

  await db.prepare(`CREATE TABLE IF NOT EXISTS release_manifest_diff_items (release_manifest_diff_item_id INTEGER PRIMARY KEY AUTOINCREMENT, release_manifest_live_diff_id INTEGER, build_label TEXT, file_path TEXT NOT NULL, diff_kind TEXT NOT NULL DEFAULT 'changed', expected_sha256 TEXT, deployed_sha256 TEXT, item_status TEXT NOT NULL DEFAULT 'open', created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS deployment_readiness_scores (deployment_readiness_score_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT, score INTEGER NOT NULL DEFAULT 0, score_status TEXT NOT NULL DEFAULT 'not_ready', blocker_count INTEGER NOT NULL DEFAULT 0, warning_count INTEGER NOT NULL DEFAULT 0, manifest_blocker_count INTEGER NOT NULL DEFAULT 0, smoke_blocker_count INTEGER NOT NULL DEFAULT 0, rollback_blocker_count INTEGER NOT NULL DEFAULT 0, d1_marker_count INTEGER NOT NULL DEFAULT 0, score_json TEXT NOT NULL DEFAULT '{}', scored_by_user_id INTEGER, scored_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS product_qa_bulk_fix_approvals (product_qa_bulk_fix_approval_id INTEGER PRIMARY KEY AUTOINCREMENT, product_qa_bulk_fix_queue_id INTEGER NOT NULL, approval_status TEXT NOT NULL DEFAULT 'manual_only', approval_scope TEXT NOT NULL DEFAULT 'preview_group', approval_notes TEXT, approved_by_user_id INTEGER, approved_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS marketplace_channel_validation_rule_edits (marketplace_channel_validation_rule_edit_id INTEGER PRIMARY KEY AUTOINCREMENT, channel TEXT NOT NULL, column_key TEXT NOT NULL, rule_kind TEXT NOT NULL DEFAULT 'required_column', is_required INTEGER NOT NULL DEFAULT 1, severity TEXT NOT NULL DEFAULT 'blocker', rule_status TEXT NOT NULL DEFAULT 'active', edited_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(channel, column_key, rule_kind))`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS recall_customer_match_previews (recall_customer_match_preview_id INTEGER PRIMARY KEY AUTOINCREMENT, batch_number TEXT NOT NULL, product_id INTEGER, order_id INTEGER, customer_email TEXT, customer_name TEXT, match_source TEXT NOT NULL DEFAULT 'order_product_batch', preview_status TEXT NOT NULL DEFAULT 'needs_review', notification_subject TEXT, notification_body TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS r2_signed_download_health_tests (r2_signed_download_health_test_id INTEGER PRIMARY KEY AUTOINCREMENT, test_kind TEXT NOT NULL DEFAULT 'create_get_delete', bucket_label TEXT, object_key TEXT, create_status TEXT NOT NULL DEFAULT 'not_run', get_status TEXT NOT NULL DEFAULT 'not_run', delete_status TEXT NOT NULL DEFAULT 'not_run', checksum_sha256 TEXT, bytes_tested INTEGER NOT NULL DEFAULT 0, notes TEXT, checked_by_user_id INTEGER, checked_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS accounting_zip_checksum_links (accounting_zip_checksum_link_id INTEGER PRIMARY KEY AUTOINCREMENT, accounting_evidence_bundle_checksum_id INTEGER, safe_deploy_package_download_id INTEGER, period_month TEXT, zip_sha256 TEXT, link_status TEXT NOT NULL DEFAULT 'linked', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS local_business_schema_injection_targets (local_business_schema_injection_target_id INTEGER PRIMARY KEY AUTOINCREMENT, page_path TEXT NOT NULL UNIQUE, injection_status TEXT NOT NULL DEFAULT 'queued', schema_source TEXT NOT NULL DEFAULT 'data/site/local-business-schema.json', last_baked_at TEXT, notes TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS dashboard_notification_cards (dashboard_notification_card_id INTEGER PRIMARY KEY AUTOINCREMENT, source_kind TEXT NOT NULL, source_id INTEGER, card_title TEXT NOT NULL, card_body TEXT, severity TEXT NOT NULL DEFAULT 'info', destination_page TEXT NOT NULL DEFAULT '/admin/', card_status TEXT NOT NULL DEFAULT 'open', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS admin_notification_routes (admin_notification_route_id INTEGER PRIMARY KEY AUTOINCREMENT, route_key TEXT NOT NULL UNIQUE, route_label TEXT NOT NULL, source_kind TEXT NOT NULL DEFAULT 'preflight', destination_page TEXT NOT NULL DEFAULT '/admin/', min_severity TEXT NOT NULL DEFAULT 'warn', route_status TEXT NOT NULL DEFAULT 'active', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
}

function localBusinessJson(row) {
  const area = parseJson(row.area_served_json, ['Southern Ontario', 'Oxford County', 'Norfolk County']);
  const services = parseJson(row.service_types_json, ['handmade jewelry', 'custom gifts', 'laser engraving', 'custom candles', 'custom soap']);
  const sameAs = parseJson(row.same_as_json, []);
  const openingHours = parseJson(row.opening_hours_json, []);
  const paymentAccepted = parseJson(row.payment_accepted_json, ['Cash', 'Credit Card', 'Debit', 'E-transfer']);
  const address = parseJson(row.address_json, {});
  const geo = parseJson(row.geo_json, {});
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: row.business_name || 'Devil n Dove',
    url: row.canonical_url || 'https://devilndove.com/',
    telephone: row.telephone || undefined,
    email: row.email || undefined,
    logo: row.logo_url || undefined,
    image: row.image_url || row.logo_url || undefined,
    priceRange: row.price_range || '$$',
    paymentAccepted,
    openingHoursSpecification: openingHours,
    areaServed: area,
    address: Object.keys(address).length ? address : undefined,
    geo: Object.keys(geo).length ? geo : undefined,
    makesOffer: services.map((name) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name } })),
    sameAs
  };
  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);
  return payload;
}
function manifestMap(manifest) { const map = new Map(); for (const f of manifest?.files || []) if (f?.path) map.set(f.path, f); return map; }
function compareManifests(expected, deployed) {
  const a = manifestMap(expected), b = manifestMap(deployed);
  const missing = [], changed = [], extra = [];
  for (const [path, row] of a) {
    const other = b.get(path);
    if (!other) missing.push(path);
    else if (String(row.sha256 || '') !== String(other.sha256 || '')) changed.push(path);
  }
  for (const [path] of b) if (!a.has(path)) extra.push(path);
  return { missing, changed, extra, expected_file_count: a.size, deployed_file_count: b.size };
}
async function fetchJson(url) { const res = await fetch(url, { headers: { Accept: 'application/json' } }); if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`); return res.json(); }
async function seedLocalBusinessDefault(db, user) {
  const existing = await safeFirst(db, `SELECT local_business_schema_setting_id FROM local_business_schema_settings LIMIT 1`, [], null);
  if (existing) return;
  const row = {
    business_name: 'Devil n Dove', canonical_url: 'https://devilndove.com/', telephone: '', email: '',
    area_served_json: JSON.stringify(['Southern Ontario', 'Oxford County', 'Norfolk County', 'Tillsonburg, Ontario']),
    service_types_json: JSON.stringify(['handmade jewelry', 'custom gifts', 'laser engraving', 'custom candles', 'custom soap', 'vintage finds']),
    same_as_json: '[]', opening_hours_json: '[]', payment_accepted_json: JSON.stringify(['Cash', 'Credit Card', 'Debit', 'E-transfer'])
  };
  await db.prepare(`INSERT INTO local_business_schema_settings (business_name, canonical_url, telephone, email, area_served_json, service_types_json, same_as_json, schema_status, schema_json, updated_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(row.business_name, row.canonical_url, row.telephone, row.email, row.area_served_json, row.service_types_json, row.same_as_json, JSON.stringify(localBusinessJson(row)), Number(user?.user_id || 0) || null).run().catch(() => null);
}
async function buildSummary(db, user) {
  await ensureTables(db);
  await seedLocalBusinessDefault(db, user);
  const deployment_history = await safeAll(db, `SELECT deployment_history_id, build_label, branch_name, commit_sha, deploy_url, build_zip_label, deployment_status, promoted_at, created_at FROM deployment_history ORDER BY created_at DESC LIMIT 15`);
  const manifest_comparisons = await safeAll(db, `SELECT deployment_manifest_comparison_id, build_label, expected_manifest_path, deployed_manifest_url, comparison_status, expected_file_count, deployed_file_count, missing_file_count, changed_file_count, compared_at, created_at FROM deployment_manifest_comparisons ORDER BY COALESCE(compared_at, created_at) DESC LIMIT 15`);
  const live_manifest_diffs = await safeAll(db, `SELECT release_manifest_live_diff_id, build_label, deployed_manifest_url, diff_status, expected_file_count, deployed_file_count, missing_file_count, changed_file_count, extra_file_count, checked_at FROM release_manifest_live_diffs ORDER BY checked_at DESC LIMIT 15`);
  const screenshot_jobs = await safeAll(db, `SELECT deployment_screenshot_job_id, build_label, page_path, viewport_width, viewport_height, theme, capture_status, evidence_url, created_at, updated_at FROM deployment_screenshot_jobs ORDER BY created_at DESC LIMIT 30`);
  const mobile_views = await safeAll(db, `SELECT mobile_admin_saved_view_id, view_key, view_label, page_path, device_target, is_default, updated_at FROM mobile_admin_saved_views ORDER BY is_default DESC, updated_at DESC LIMIT 30`);
  const local_business_rows = await safeAll(db, `SELECT s.*, e.opening_hours_json, e.logo_url, e.image_url, e.payment_accepted_json, e.price_range, e.address_json, e.geo_json FROM local_business_schema_settings s LEFT JOIN local_business_schema_extended_fields e ON e.local_business_schema_setting_id=s.local_business_schema_setting_id ORDER BY s.updated_at DESC LIMIT 5`);
  const local_business_bakes = await safeAll(db, `SELECT local_business_schema_bake_id, bake_status, output_path, baked_at, notes FROM local_business_schema_bakes ORDER BY baked_at DESC LIMIT 10`);
  const safe_exports = await safeAll(db, `SELECT safe_deploy_export_record_id, build_label, export_label, export_status, manifest_path, zip_sha256, created_at FROM safe_deploy_export_records ORDER BY created_at DESC LIMIT 15`);
  const safe_downloads = await safeAll(db, `SELECT safe_deploy_package_download_id, build_label, file_count, total_bytes, zip_sha256, download_status, prepared_at FROM safe_deploy_package_downloads ORDER BY prepared_at DESC LIMIT 15`);
  const qa_queue = await safeAll(db, `SELECT product_qa_bulk_fix_queue_id, blocker_code, fix_type, product_count, approval_status, updated_at FROM product_qa_bulk_fix_queue ORDER BY updated_at DESC LIMIT 20`);
  const qa_preview_items = await safeAll(db, `SELECT product_qa_bulk_fix_preview_item_id, product_qa_bulk_fix_queue_id, product_id, blocker_code, focus_field, suggested_value, fix_url, preview_status FROM product_qa_bulk_fix_preview_items ORDER BY created_at DESC LIMIT 40`);
  const marketplace_rules = await safeAll(db, `SELECT channel, column_key, rule_kind, is_required, severity, rule_status FROM marketplace_channel_validation_rules ORDER BY channel, column_key LIMIT 80`);
  const marketplace_validations = await safeAll(db, `SELECT marketplace_export_validation_run_id, channel, validation_status, blocker_count, warning_count, checked_rows, created_at FROM marketplace_export_validation_runs ORDER BY created_at DESC LIMIT 20`);
  const snapshot_diffs = await safeAll(db, `SELECT marketplace_export_snapshot_diff_id, channel, diff_status, changed_row_count, changed_field_count, created_at FROM marketplace_export_snapshot_diffs ORDER BY created_at DESC LIMIT 20`);
  const recall_reviews = await safeAll(db, `SELECT batch_number, review_status, approval_signature, approved_at, updated_at FROM recall_compliance_reviews ORDER BY updated_at DESC LIMIT 20`);
  const recall_locks = await safeAll(db, `SELECT batch_number, recall_id, lock_status, matching_review_id, last_checked_at, notes FROM recall_notification_locks ORDER BY last_checked_at DESC LIMIT 20`);
  const internal_links = await safeAll(db, `SELECT source_path, target_path, suggested_anchor, score, suggestion_status, updated_at FROM local_seo_internal_link_suggestions ORDER BY score DESC, updated_at DESC LIMIT 20`);
  const search_trends = await safeAll(db, `SELECT page_path, query_text, clicks, impressions, average_position, period_end FROM local_seo_search_console_trends ORDER BY period_end DESC, impressions DESC LIMIT 20`);
  const rollback_rows = await safeAll(db, `SELECT build_label, checklist_key, checklist_label, checklist_status, required_before_rollback, updated_at FROM deployment_rollback_checklist_rows ORDER BY build_label DESC, checklist_key LIMIT 30`);
  const cf_imports = await safeAll(db, `SELECT import_status, account_id_present, project_name_present, imported_count, created_at, notes FROM cloudflare_deployment_import_runs ORDER BY created_at DESC LIMIT 10`);
  const notification_routes = await safeAll(db, `SELECT route_key, route_label, source_kind, destination_page, min_severity, route_status FROM admin_notification_routes ORDER BY route_status, source_kind LIMIT 20`);
  const diff_items = await safeAll(db, `SELECT release_manifest_diff_item_id, release_manifest_live_diff_id, file_path, diff_kind, item_status, expected_sha256, deployed_sha256 FROM release_manifest_diff_items ORDER BY release_manifest_diff_item_id DESC LIMIT 120`);
  const readiness_scores = await safeAll(db, `SELECT deployment_readiness_score_id, build_label, score, score_status, blocker_count, warning_count, manifest_blocker_count, smoke_blocker_count, rollback_blocker_count, d1_marker_count, scored_at, notes FROM deployment_readiness_scores ORDER BY scored_at DESC LIMIT 10`);
  const qa_approvals = await safeAll(db, `SELECT product_qa_bulk_fix_approval_id, product_qa_bulk_fix_queue_id, approval_status, approval_scope, approval_notes, approved_at FROM product_qa_bulk_fix_approvals ORDER BY approved_at DESC LIMIT 30`);
  const rule_edits = await safeAll(db, `SELECT channel, column_key, rule_kind, is_required, severity, rule_status, updated_at FROM marketplace_channel_validation_rule_edits ORDER BY channel, column_key LIMIT 80`);
  const recall_matches = await safeAll(db, `SELECT recall_customer_match_preview_id, batch_number, product_id, order_id, customer_email, customer_name, match_source, preview_status, created_at FROM recall_customer_match_previews ORDER BY created_at DESC LIMIT 40`);
  const r2_signed_tests = await safeAll(db, `SELECT r2_signed_download_health_test_id, test_kind, bucket_label, object_key, create_status, get_status, delete_status, bytes_tested, checked_at, notes FROM r2_signed_download_health_tests ORDER BY checked_at DESC LIMIT 12`);
  const checksum_links = await safeAll(db, `SELECT accounting_zip_checksum_link_id, period_month, zip_sha256, link_status, created_at, notes FROM accounting_zip_checksum_links ORDER BY created_at DESC LIMIT 20`);
  const injection_targets = await safeAll(db, `SELECT page_path, injection_status, schema_source, last_baked_at, notes FROM local_business_schema_injection_targets ORDER BY page_path LIMIT 30`);
  const dashboard_cards = await safeAll(db, `SELECT dashboard_notification_card_id, source_kind, card_title, card_body, severity, destination_page, card_status, created_at FROM dashboard_notification_cards ORDER BY created_at DESC LIMIT 20`);
  return {
    deployment_history,
    manifest_comparisons,
    live_manifest_diffs,
    screenshot_jobs,
    mobile_views,
    local_business_rows: local_business_rows.map((row) => ({ ...row, schema_preview: localBusinessJson(row) })),
    local_business_bakes,
    safe_exports,
    safe_downloads,
    qa_queue,
    qa_preview_items,
    marketplace_rules,
    marketplace_validations,
    snapshot_diffs,
    recall_reviews,
    recall_locks,
    internal_links,
    search_trends,
    rollback_rows,
    cf_imports,
    notification_routes,
    diff_items,
    readiness_scores,
    qa_approvals,
    rule_edits,
    recall_matches,
    r2_signed_tests,
    checksum_links,
    injection_targets,
    dashboard_cards,
    summary: {
      deployment_count: deployment_history.length,
      manifest_comparison_count: manifest_comparisons.length + live_manifest_diffs.length,
      screenshot_job_count: screenshot_jobs.length,
      queued_screenshot_count: screenshot_jobs.filter((row) => lc(row.capture_status) === 'queued').length,
      mobile_saved_view_count: mobile_views.length,
      safe_export_count: safe_exports.length + safe_downloads.length,
      qa_preview_count: qa_preview_items.length,
      recall_lock_count: recall_locks.length,
      rollback_open_count: rollback_rows.filter((row) => lc(row.checklist_status) !== 'passed').length,
      dashboard_card_count: dashboard_cards.filter((row) => lc(row.card_status) === 'open').length,
      readiness_score: readiness_scores[0]?.score || 0
    }
  };
}

export async function onRequestGet(context) {
  const user = await getAdminUserFromRequest(context.request, context.env);
  if (!user) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  const data = await buildSummary(db, user);
  const url = new URL(context.request.url);
  if (lc(url.searchParams.get('format')) === 'local-business-json') {
    const row = data.local_business_rows[0] || { business_name: 'Devil n Dove', canonical_url: 'https://devilndove.com/', area_served_json: '["Southern Ontario","Oxford County","Norfolk County"]', service_types_json: '["handmade jewelry","custom gifts","laser engraving","custom candles","custom soap"]', same_as_json: '[]' };
    return jsonResponse(localBusinessJson(row), 200, { 'Cache-Control': 'no-store' });
  }
  if (lc(url.searchParams.get('view')) === 'phone') {
    return jsonResponse({ ok: true, build_label: BUILD_LABEL, summary: data.summary, live_manifest_diffs: data.live_manifest_diffs.slice(0, 5), recall_locks: data.recall_locks.slice(0, 5), rollback_rows: data.rollback_rows.slice(0, 8), safe_deploy_zip_url: '/api/admin/safe-deploy-package?format=zip' }, 200, { 'Cache-Control': 'no-store' });
  }
  return jsonResponse({ ok: true, build_label: BUILD_LABEL, safe_deploy_zip_url: '/api/admin/safe-deploy-package?format=zip', ...data }, 200, { 'Cache-Control': 'no-store' });
}

async function seedQaPreview(db, user) {
  const latest = await safeAll(db, `SELECT q.* FROM product_publish_qa_results q JOIN (SELECT product_id, MAX(product_publish_qa_result_id) AS latest_id FROM product_publish_qa_results GROUP BY product_id) x ON x.latest_id=q.product_publish_qa_result_id WHERE q.qa_status!='passed' ORDER BY q.created_at DESC LIMIT 100`);
  const grouped = new Map();
  for (const row of latest) {
    const checks = parseJson(row.checks_json, []);
    for (const check of checks) {
      if (check && check.ok === false) {
        const code = lc(check.code || 'unknown_blocker');
        if (!grouped.has(code)) grouped.set(code, []);
        grouped.get(code).push({ product_id: row.product_id, product_slug: row.product_slug, focus_field: check.focus_field || 'name', fix_url: check.fix_url || `/admin/catalog/?product_id=${encodeURIComponent(row.product_id)}&focus_field=${encodeURIComponent(check.focus_field || 'name')}`, suggested_value: code === 'missing_image_alt' ? 'Review image alt text' : 'Manual review required' });
      }
    }
  }
  for (const [code, items] of grouped) {
    const insert = await db.prepare(`INSERT INTO product_qa_bulk_fix_queue (blocker_code, fix_type, product_ids_json, product_count, approval_status, preview_json, created_by_user_id, created_at, updated_at) VALUES (?, 'preview_only', ?, ?, 'needs_approval', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(code, JSON.stringify(items.map((item) => item.product_id)), items.length, JSON.stringify({ items: items.slice(0, 20) }), Number(user.user_id || 0) || null).run();
    const queueId = Number(insert?.meta?.last_row_id || 0) || null;
    for (const item of items.slice(0, 25)) {
      await db.prepare(`INSERT INTO product_qa_bulk_fix_preview_items (product_qa_bulk_fix_queue_id, product_id, blocker_code, focus_field, current_value, suggested_value, fix_url, preview_status, created_at) VALUES (?, ?, ?, ?, '', ?, ?, 'needs_review', CURRENT_TIMESTAMP)`).bind(queueId, item.product_id, code, item.focus_field, item.suggested_value, item.fix_url).run();
    }
  }
}


function shaFromMap(manifest, path) {
  const file = (manifest?.files || []).find((row) => row?.path === path);
  return file?.sha256 || '';
}
async function recordDiffItems(db, diffId, buildLabel, diff, expected, deployed) {
  if (!diffId) return;
  const items = [
    ...(diff.missing || []).map((path) => ({ path, kind: 'missing', expected: shaFromMap(expected, path), deployed: '' })),
    ...(diff.changed || []).map((path) => ({ path, kind: 'changed', expected: shaFromMap(expected, path), deployed: shaFromMap(deployed, path) })),
    ...(diff.extra || []).map((path) => ({ path, kind: 'extra', expected: '', deployed: shaFromMap(deployed, path) }))
  ];
  for (const item of items.slice(0, 300)) {
    await db.prepare(`INSERT INTO release_manifest_diff_items (release_manifest_live_diff_id, build_label, file_path, diff_kind, expected_sha256, deployed_sha256, item_status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'open', CURRENT_TIMESTAMP)`).bind(diffId, buildLabel, item.path, item.kind, item.expected, item.deployed).run().catch(() => null);
  }
}
async function calculateReadinessScore(db, buildLabel, userId) {
  const preflight = await safeFirst(db, `SELECT blocker_count, warning_count, status FROM deployment_preflight_runs ORDER BY created_at DESC LIMIT 1`, [], {});
  const manifest = await safeFirst(db, `SELECT missing_file_count, changed_file_count, extra_file_count, diff_status FROM release_manifest_live_diffs ORDER BY checked_at DESC LIMIT 1`, [], {});
  const smoke = await safeFirst(db, `SELECT SUM(CASE WHEN LOWER(COALESCE(result_status,'')) IN ('failed','fail','blocked') THEN 1 ELSE 0 END) AS blockers, SUM(CASE WHEN LOWER(COALESCE(result_status,'')) IN ('warning','warn','pending') THEN 1 ELSE 0 END) AS warnings FROM post_deploy_smoke_test_results`, [], {});
  const rollback = await safeFirst(db, `SELECT COUNT(*) AS open_count FROM deployment_rollback_checklist_rows WHERE build_label=? AND required_before_rollback=1 AND LOWER(COALESCE(checklist_status,''))!='passed'`, [buildLabel], {});
  const d1 = await safeFirst(db, `SELECT COUNT(*) AS marker_count FROM schema_migration_ledger WHERE migration_key IN ('build_173_deployment_preflight','build_174_preflight_detail_manifest','build_175_release_control','build_176_release_safety_controls','build_177_deploy_score_and_controls')`, [], {});
  const blockerCount = Number(preflight?.blocker_count || 0);
  const warningCount = Number(preflight?.warning_count || 0);
  const manifestBlockers = Number(manifest?.missing_file_count || 0) + Number(manifest?.changed_file_count || 0);
  const smokeBlockers = Number(smoke?.blockers || 0);
  const rollbackBlockers = Number(rollback?.open_count || 0);
  const d1Markers = Number(d1?.marker_count || 0);
  let score = 100 - (blockerCount * 25) - (manifestBlockers * 10) - (smokeBlockers * 20) - (rollbackBlockers * 8) - Math.max(0, 5 - d1Markers) * 5 - (warningCount * 2);
  score = Math.max(0, Math.min(100, Math.round(score)));
  const status = score >= 90 ? 'ready' : score >= 70 ? 'review' : 'not_ready';
  const payload = { preflight, manifest, smoke, rollback, d1, score };
  await db.prepare(`INSERT INTO deployment_readiness_scores (build_label, score, score_status, blocker_count, warning_count, manifest_blocker_count, smoke_blocker_count, rollback_blocker_count, d1_marker_count, score_json, scored_by_user_id, scored_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`).bind(buildLabel, score, status, blockerCount, warningCount, manifestBlockers, smokeBlockers, rollbackBlockers, d1Markers, JSON.stringify(payload), userId, status === 'ready' ? 'Ready based on latest saved checks.' : 'Review release blockers before promotion.').run();
}
async function importCloudflareDeployments(context, db, user, body) {
  const env = context.env || {};
  const account = normalizeText(env.CLOUDFLARE_ACCOUNT_ID);
  const project = normalizeText(env.CLOUDFLARE_PAGES_PROJECT || env.CLOUDFLARE_PAGES_PROJECT_NAME);
  const token = normalizeText(env.CLOUDFLARE_API_TOKEN || env.CF_API_TOKEN);
  if (!account || !project || !token) {
    await db.prepare(`INSERT INTO cloudflare_deployment_import_runs (import_status, account_id_present, project_name_present, imported_count, response_json, created_by_user_id, created_at, notes) VALUES (?, ?, ?, 0, '{}', ?, CURRENT_TIMESTAMP, ?)`).bind(account && project ? 'token_required' : 'not_configured', account ? 1 : 0, project ? 1 : 0, Number(user.user_id || 0) || null, account && project ? 'Cloudflare project configured; token missing.' : 'Cloudflare account/project bindings are missing.').run();
    return;
  }
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/pages/projects/${encodeURIComponent(project)}/deployments?per_page=10`;
  let imported = 0;
  let responseJson = {};
  try {
    const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
    responseJson = await response.json().catch(() => ({ success: false, status: response.status }));
    const deployments = Array.isArray(responseJson?.result) ? responseJson.result : [];
    for (const dep of deployments) {
      const buildLabel = normalizeText(body.build_label || BUILD_LABEL);
      const commitSha = normalizeText(dep?.deployment_trigger?.metadata?.commit_hash || dep?.source?.config?.commit_hash || dep?.id || '');
      const branch = normalizeText(dep?.deployment_trigger?.metadata?.branch || dep?.source?.config?.branch || '');
      const url = normalizeText(dep?.url || dep?.aliases?.[0] || '');
      const status = lc(dep?.latest_stage?.status || dep?.env_vars?.status || dep?.production_branch ? 'deployed' : 'imported') || 'imported';
      await db.prepare(`INSERT INTO deployment_history (build_label, branch_name, commit_sha, deploy_url, build_zip_label, deployment_status, promoted_by_user_id, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(buildLabel, branch, commitSha, url, normalizeText(body.build_zip_label || ''), status, Number(user.user_id || 0) || null, `Imported from Cloudflare Pages deployment id ${normalizeText(dep?.id)}`).run().catch(() => null);
      imported += 1;
    }
    await db.prepare(`INSERT INTO cloudflare_deployment_import_runs (import_status, account_id_present, project_name_present, imported_count, response_json, created_by_user_id, created_at, notes) VALUES (?, 1, 1, ?, ?, ?, CURRENT_TIMESTAMP, ?)`).bind(responseJson?.success === false ? 'api_error' : 'imported', imported, JSON.stringify({ success: responseJson?.success, errors: responseJson?.errors || [], count: imported }), Number(user.user_id || 0) || null, imported ? 'Imported recent Cloudflare Pages deployments.' : 'API call completed but no deployments were returned.').run();
  } catch (error) {
    await db.prepare(`INSERT INTO cloudflare_deployment_import_runs (import_status, account_id_present, project_name_present, imported_count, response_json, created_by_user_id, created_at, notes) VALUES ('api_error', 1, 1, 0, ?, ?, CURRENT_TIMESTAMP, ?)`).bind(JSON.stringify(responseJson || {}), Number(user.user_id || 0) || null, error.message || 'Cloudflare import failed.').run();
  }
}
export async function onRequestPost(context) {
  const user = await getAdminUserFromRequest(context.request, context.env);
  if (!user) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureTables(db);
  let body = {}; try { body = await context.request.json(); } catch { body = {}; }
  const action = lc(body.action || '');

  if (action === 'record_deployment') {
    await db.prepare(`INSERT INTO deployment_history (build_label, branch_name, commit_sha, deploy_url, build_zip_label, package_manifest_hash, deployment_status, promoted_by_user_id, promoted_at, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ?='promoted' THEN CURRENT_TIMESTAMP ELSE NULL END, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(normalizeText(body.build_label || BUILD_LABEL), normalizeText(body.branch_name), normalizeText(body.commit_sha), normalizeText(body.deploy_url), normalizeText(body.build_zip_label), normalizeText(body.package_manifest_hash), normalizeText(body.deployment_status || 'planned'), Number(user.user_id || 0) || null, lc(body.deployment_status || ''), normalizeText(body.notes)).run();
    await auditAdminAction(context.env, context.request, user, { action_type: 'deployment_history_recorded', target_type: 'deployment_history', target_key: normalizeText(body.build_label || BUILD_LABEL), details: body });
  } else if (action === 'live_manifest_compare') {
    const expectedUrl = new URL('/data/site/release-package-manifest.json', context.request.url).toString();
    const deployedUrl = normalizeText(body.deployed_manifest_url) || expectedUrl;
    let diff, status = 'passed', notes = 'Manifest compare completed.';
    try {
      const expected = await fetchJson(expectedUrl);
      const deployed = await fetchJson(deployedUrl);
      diff = compareManifests(expected, deployed);
      status = diff.missing.length || diff.changed.length ? 'review' : 'passed';
    } catch (error) {
      diff = { missing: [], changed: [], extra: [], expected_file_count: 0, deployed_file_count: 0 };
      status = 'failed';
      notes = error.message || 'Manifest compare failed.';
    }
    const ins = await db.prepare(`INSERT INTO release_manifest_live_diffs (build_label, expected_manifest_url, deployed_manifest_url, diff_status, expected_file_count, deployed_file_count, missing_file_count, changed_file_count, extra_file_count, diff_json, checked_by_user_id, checked_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`).bind(normalizeText(body.build_label || BUILD_LABEL), expectedUrl, deployedUrl, status, diff.expected_file_count, diff.deployed_file_count, diff.missing.length, diff.changed.length, diff.extra.length, JSON.stringify(diff), Number(user.user_id || 0) || null, notes).run();
    try { await recordDiffItems(db, Number(ins?.meta?.last_row_id || 0), normalizeText(body.build_label || BUILD_LABEL), diff, await fetchJson(expectedUrl).catch(() => ({})), await fetchJson(deployedUrl).catch(() => ({}))); } catch {}
  } else if (action === 'queue_screenshot_jobs') {
    const pages = Array.isArray(body.pages) && body.pages.length ? body.pages : ['/', '/shop/', '/gallery/', '/handmade-jewelry-ontario/', '/custom-gifts-southern-ontario/', '/laser-engraving-ontario/'];
    for (const page of pages) await db.prepare(`INSERT INTO deployment_screenshot_jobs (build_label, page_path, viewport_width, viewport_height, theme, capture_status, notes, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'queued', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(normalizeText(body.build_label || BUILD_LABEL), normalizeText(page), Number(body.viewport_width || 390), Number(body.viewport_height || 844), normalizeText(body.theme || 'dark'), normalizeText(body.notes || 'Queued from release-control page.'), Number(user.user_id || 0) || null).run();
  } else if (action === 'seed_mobile_views') {
    const views = [['today_tasks_phone', 'Today tasks — phone', '/admin/mobile/?view=today', '{"scope":"today"}'], ['deployment_preflight_phone', 'Deployment preflight — phone', '/admin/deployment-preflight/?view=phone', '{"compact":true}'], ['post_deploy_smoke_phone', 'Smoke tests — phone', '/admin/post-deploy-smoke-tests/?view=phone', '{"compact":true}'], ['accounting_close_phone', 'Accounting close — phone', '/admin/accounting/?view=close-phone', '{"scope":"close"}'], ['release_control_phone', 'Release control — phone', '/admin/release-control/?view=phone', '{"compact":true}']];
    for (const [key, label, path, filters] of views) await db.prepare(`INSERT INTO mobile_admin_saved_views (view_key, view_label, page_path, device_target, filter_json, sort_json, is_default, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, 'phone', ?, '{}', 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(view_key) DO UPDATE SET view_label=excluded.view_label, page_path=excluded.page_path, filter_json=excluded.filter_json, updated_at=CURRENT_TIMESTAMP`).bind(key, label, path, filters, Number(user.user_id || 0) || null).run();
  } else if (action === 'save_local_business_schema') {
    const area = JSON.stringify(toArray(body.area_served, ['Southern Ontario', 'Oxford County', 'Norfolk County']));
    const services = JSON.stringify(toArray(body.service_types, ['handmade jewelry', 'custom gifts', 'laser engraving', 'custom candles', 'custom soap']));
    const sameAs = JSON.stringify(toArray(body.same_as, []));
    const openingHours = JSON.stringify(Array.isArray(body.opening_hours) ? body.opening_hours : []);
    const paymentAccepted = JSON.stringify(toArray(body.payment_accepted, ['Cash', 'Credit Card', 'Debit', 'E-transfer']));
    const schemaRow = { business_name: normalizeText(body.business_name || 'Devil n Dove'), canonical_url: normalizeText(body.canonical_url || 'https://devilndove.com/'), telephone: normalizeText(body.telephone), email: normalizeText(body.email), area_served_json: area, service_types_json: services, same_as_json: sameAs, opening_hours_json: openingHours, logo_url: normalizeText(body.logo_url), image_url: normalizeText(body.image_url), payment_accepted_json: paymentAccepted, price_range: normalizeText(body.price_range || '$$'), address_json: JSON.stringify(body.address || {}), geo_json: JSON.stringify(body.geo || {}) };
    const schemaJson = JSON.stringify(localBusinessJson(schemaRow));
    const settingInsert = await db.prepare(`INSERT INTO local_business_schema_settings (business_name, canonical_url, telephone, email, area_served_json, service_types_json, same_as_json, schema_status, schema_json, updated_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(schemaRow.business_name, schemaRow.canonical_url, schemaRow.telephone, schemaRow.email, area, services, sameAs, normalizeText(body.schema_status || 'draft'), schemaJson, Number(user.user_id || 0) || null).run();
    const settingId = Number(settingInsert?.meta?.last_row_id || 0) || null;
    if (settingId) await db.prepare(`INSERT INTO local_business_schema_extended_fields (local_business_schema_setting_id, opening_hours_json, logo_url, image_url, payment_accepted_json, price_range, address_json, geo_json, updated_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(settingId, openingHours, schemaRow.logo_url, schemaRow.image_url, paymentAccepted, schemaRow.price_range, schemaRow.address_json, schemaRow.geo_json, Number(user.user_id || 0) || null).run().catch(() => null);
    await db.prepare(`INSERT INTO local_business_schema_bakes (bake_status, target_paths_json, schema_json, output_path, baked_by_user_id, notes, baked_at) VALUES ('draft', ?, ?, 'data/site/local-business-schema.json', ?, 'Saved LocalBusiness schema preview; run static bake during deploy.', CURRENT_TIMESTAMP)`).bind(JSON.stringify(['/','/handmade-jewelry-ontario/','/custom-gifts-southern-ontario/']), schemaJson, Number(user.user_id || 0) || null).run();
  } else if (action === 'record_safe_export') {
    await db.prepare(`INSERT INTO safe_deploy_export_records (build_label, export_label, preflight_markdown_path, schema_paths_json, smoke_results_json, export_status, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(normalizeText(body.build_label || BUILD_LABEL), normalizeText(body.export_label || 'safe deploy export'), normalizeText(body.preflight_markdown_path || 'deployment-preflight-export.md'), JSON.stringify(body.schema_paths || ['database_build171_ledger_repair.sql','database_build173_deployment_preflight.sql','database_build174_deployment_preflight_detail.sql','database_build175_release_control.sql','database_build176_release_safety_controls.sql']), JSON.stringify(body.smoke_results || {}), normalizeText(body.export_status || 'planned'), Number(user.user_id || 0) || null).run();
  } else if (action === 'seed_qa_bulk_preview') {
    await seedQaPreview(db, user);
  } else if (action === 'record_marketplace_validation_preview') {
    const channels = Array.isArray(body.channels) && body.channels.length ? body.channels : ['etsy', 'facebook', 'pinterest', 'manual'];
    const rules = await safeAll(db, `SELECT channel, column_key, is_required, severity FROM marketplace_channel_validation_rules WHERE rule_status='active'`);
    for (const channel of channels) {
      const required = rules.filter((row) => lc(row.channel) === lc(channel) && Number(row.is_required || 0));
      await db.prepare(`INSERT INTO marketplace_export_validation_runs (channel, validation_status, blocker_count, warning_count, checked_rows, result_json, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(lc(channel), required.length ? 'review' : 'needs_rules', required.filter((row) => lc(row.severity) === 'blocker').length, required.filter((row) => lc(row.severity) !== 'blocker').length, 0, JSON.stringify({ required_columns: required }), Number(user.user_id || 0) || null).run();
    }
  } else if (action === 'seed_recall_locks') {
    const recallRows = await safeAll(db, `SELECT candle_soap_batch_recall_id AS recall_id, batch_number FROM candle_soap_batch_recalls ORDER BY updated_at DESC LIMIT 40`);
    const queueRows = await safeAll(db, `SELECT NULL AS recall_id, batch_number FROM candle_soap_recall_notification_queue WHERE notification_status='draft' GROUP BY batch_number LIMIT 40`);
    for (const row of [...recallRows, ...queueRows]) {
      if (!normalizeText(row.batch_number)) continue;
      const review = await safeFirst(db, `SELECT recall_compliance_review_id FROM recall_compliance_reviews WHERE batch_number=? AND review_status='approved' ORDER BY updated_at DESC LIMIT 1`, [row.batch_number], null);
      await db.prepare(`INSERT INTO recall_notification_locks (batch_number, recall_id, lock_status, matching_review_id, checked_by_user_id, notes, last_checked_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(batch_number, recall_id) DO UPDATE SET lock_status=excluded.lock_status, matching_review_id=excluded.matching_review_id, checked_by_user_id=excluded.checked_by_user_id, notes=excluded.notes, last_checked_at=CURRENT_TIMESTAMP`).bind(row.batch_number, row.recall_id || 0, review ? 'release_allowed' : 'locked_pending_review', review?.recall_compliance_review_id || null, Number(user.user_id || 0) || null, review ? 'Approved compliance review found.' : 'Notification remains locked until a signed approved compliance review exists.').run();
    }
  } else if (action === 'seed_local_seo_suggestions') {
    const pages = await safeAll(db, `SELECT page_path, target_keyword, target_locality FROM local_seo_landing_page_reviews ORDER BY updated_at DESC LIMIT 40`);
    const fallback = pages.length ? pages : [{ page_path: '/handmade-jewelry-ontario/', target_keyword: 'handmade jewelry', target_locality: 'Ontario' }, { page_path: '/custom-gifts-southern-ontario/', target_keyword: 'custom gifts', target_locality: 'Southern Ontario' }, { page_path: '/laser-engraving-ontario/', target_keyword: 'laser engraving', target_locality: 'Ontario' }];
    for (const target of fallback) {
      await db.prepare(`INSERT OR IGNORE INTO local_seo_internal_link_suggestions (source_path, target_path, suggested_anchor, reason, suggestion_status, score, created_by_user_id, created_at, updated_at) VALUES ('/', ?, ?, ?, 'needs_review', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(target.page_path, `${target.target_keyword || 'local handmade gifts'} in ${target.target_locality || 'Ontario'}`, 'Homepage can pass local relevance to this service/location landing page.', 80, Number(user.user_id || 0) || null).run();
    }
  } else if (action === 'record_rollback_checklist') {
    const items = [['manifest_diff_reviewed', 'Manifest diff reviewed'], ['smoke_tests_exported', 'Smoke tests exported'], ['d1_migration_state_checked', 'D1 migration state checked'], ['r2_assets_verified', 'R2 assets verified'], ['release_notes_saved', 'Release notes saved']];
    for (const [key, label] of items) await db.prepare(`INSERT OR IGNORE INTO deployment_rollback_checklist_rows (build_label, checklist_key, checklist_label, checklist_status, required_before_rollback, notes, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, 'not_checked', 1, 'Required before reverting or promoting a previous deploy.', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(normalizeText(body.build_label || BUILD_LABEL), key, label, Number(user.user_id || 0) || null).run();
  } else if (action === 'import_cloudflare_deployments') {
    await importCloudflareDeployments(context, db, user, body);
  } else if (action === 'update_rollback_status') {
    await db.prepare(`UPDATE deployment_rollback_checklist_rows SET checklist_status=?, notes=COALESCE(NULLIF(?, ''), notes), updated_at=CURRENT_TIMESTAMP WHERE deployment_rollback_checklist_row_id=?`).bind(normalizeText(body.checklist_status || 'not_checked'), normalizeText(body.notes), Number(body.deployment_rollback_checklist_row_id || 0)).run();
  } else if (action === 'approve_qa_preview') {
    const queueId = Number(body.product_qa_bulk_fix_queue_id || 0);
    const status = lc(body.approval_status || 'manual_only');
    await db.prepare(`UPDATE product_qa_bulk_fix_queue SET approval_status=?, approved_by_user_id=?, approved_at=CASE WHEN ? IN ('safe','approved') THEN CURRENT_TIMESTAMP ELSE approved_at END, notes=COALESCE(NULLIF(?, ''), notes), updated_at=CURRENT_TIMESTAMP WHERE product_qa_bulk_fix_queue_id=?`).bind(status, Number(user.user_id || 0) || null, status, normalizeText(body.notes), queueId).run();
    await db.prepare(`INSERT INTO product_qa_bulk_fix_approvals (product_qa_bulk_fix_queue_id, approval_status, approval_scope, approval_notes, approved_by_user_id, approved_at) VALUES (?, ?, 'preview_group', ?, ?, CURRENT_TIMESTAMP)`).bind(queueId, status, normalizeText(body.notes), Number(user.user_id || 0) || null).run();
  } else if (action === 'apply_qa_alt_text') {
    const queueId = Number(body.product_qa_bulk_fix_queue_id || 0);
    const queue = await safeFirst(db, `SELECT blocker_code, approval_status FROM product_qa_bulk_fix_queue WHERE product_qa_bulk_fix_queue_id=? LIMIT 1`, [queueId], null);
    if (!queue || lc(queue.blocker_code) !== 'missing_image_alt' || !['safe','approved'].includes(lc(queue.approval_status))) return jsonResponse({ ok: false, error: 'Only approved missing_image_alt preview groups can be auto-applied.' }, 400);
    const items = await safeAll(db, `SELECT product_id, suggested_value FROM product_qa_bulk_fix_preview_items WHERE product_qa_bulk_fix_queue_id=? AND preview_status='needs_review' LIMIT 100`, [queueId]);
    let applied = 0, skipped = 0, events = [];
    for (const item of items) {
      const product = await safeFirst(db, `SELECT name FROM products WHERE product_id=? LIMIT 1`, [item.product_id], {});
      const alt = normalizeText(item.suggested_value || `${product?.name || 'Devil n Dove product'} handmade item photo`).slice(0, 180);
      const result = await db.prepare(`UPDATE product_images SET alt_text=? WHERE product_image_id IN (SELECT product_image_id FROM product_images WHERE product_id=? AND LENGTH(TRIM(COALESCE(alt_text,''))) < 5 ORDER BY sort_order ASC LIMIT 1)`).bind(alt, Number(item.product_id || 0)).run().catch(() => null);
      const changed = Number(result?.meta?.changes || 0);
      if (changed) { applied += changed; events.push({ product_id: item.product_id, alt }); }
      else skipped += 1;
    }
    await db.prepare(`INSERT INTO product_qa_bulk_fix_apply_events (product_qa_bulk_fix_queue_id, apply_status, applied_field, applied_count, skipped_count, event_json, approved_by_user_id, applied_by_user_id, created_at) VALUES (?, 'applied', 'product_images.alt_text', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(queueId, applied, skipped, JSON.stringify({ events }), Number(user.user_id || 0) || null, Number(user.user_id || 0) || null).run();
    await db.prepare(`UPDATE product_qa_bulk_fix_queue SET applied_at=CURRENT_TIMESTAMP, approval_status='applied', updated_at=CURRENT_TIMESTAMP WHERE product_qa_bulk_fix_queue_id=?`).bind(queueId).run();
  } else if (action === 'save_marketplace_rule') {
    await db.prepare(`INSERT INTO marketplace_channel_validation_rule_edits (channel, column_key, rule_kind, is_required, severity, rule_status, edited_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(channel, column_key, rule_kind) DO UPDATE SET is_required=excluded.is_required, severity=excluded.severity, rule_status=excluded.rule_status, edited_by_user_id=excluded.edited_by_user_id, updated_at=CURRENT_TIMESTAMP`).bind(lc(body.channel || 'manual'), normalizeText(body.column_key), normalizeText(body.rule_kind || 'required_column'), Number(body.is_required || 0) ? 1 : 0, lc(body.severity || 'blocker'), lc(body.rule_status || 'active'), Number(user.user_id || 0) || null).run();
  } else if (action === 'generate_recall_customer_previews') {
    const batches = await safeAll(db, `SELECT DISTINCT batch_number FROM candle_soap_batch_recalls UNION SELECT DISTINCT batch_number FROM candle_soap_recall_notification_queue`);
    for (const b of batches) {
      const batch = normalizeText(b.batch_number); if (!batch) continue;
      const matches = await safeAll(db, `SELECT DISTINCT p.product_id, o.order_id, o.customer_email, o.customer_name FROM products p LEFT JOIN order_items oi ON oi.product_id=p.product_id LEFT JOIN orders o ON o.order_id=oi.order_id WHERE COALESCE(p.batch_number,'')=? AND COALESCE(o.customer_email,'')!='' LIMIT 100`, [batch]);
      for (const m of matches) await db.prepare(`INSERT INTO recall_customer_match_previews (batch_number, product_id, order_id, customer_email, customer_name, match_source, preview_status, notification_subject, notification_body, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'order_product_batch', 'needs_review', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(batch, m.product_id || null, m.order_id || null, m.customer_email || '', m.customer_name || '', `Important notice about Devil n Dove batch ${batch}`, `We are reviewing a product batch connected to your order. Please contact us before using or gifting this item while we complete the review.`, Number(user.user_id || 0) || null).run().catch(() => null);
    }
  } else if (action === 'run_r2_signed_download_test') {
    const bucket = context.env.ACCOUNTING_EVIDENCE_BUCKET || context.env.PRIVATE_EVIDENCE_BUCKET || context.env.R2_BUCKET || null;
    let createStatus = 'not_configured', getStatus = 'not_configured', deleteStatus = 'not_configured', notes = 'No private R2 bucket binding was configured.', bytes = 0;
    const objectKey = `health-tests/build-177-${Date.now()}.txt`;
    if (bucket?.put && bucket?.get && bucket?.delete) {
      const bodyText = `Devil n Dove R2 signed-download health test ${new Date().toISOString()}
`;
      bytes = new TextEncoder().encode(bodyText).length;
      try { await bucket.put(objectKey, bodyText, { httpMetadata: { contentType: 'text/plain' } }); createStatus = 'passed'; } catch (e) { createStatus = 'failed'; notes = e.message || notes; }
      try { const obj = await bucket.get(objectKey); getStatus = obj ? 'passed' : 'failed'; } catch (e) { getStatus = 'failed'; notes = e.message || notes; }
      try { await bucket.delete(objectKey); deleteStatus = 'passed'; } catch (e) { deleteStatus = 'failed'; notes = e.message || notes; }
      if (createStatus === 'passed' && getStatus === 'passed' && deleteStatus === 'passed') notes = 'R2 create/get/delete private evidence health test passed.';
    }
    await db.prepare(`INSERT INTO r2_signed_download_health_tests (test_kind, bucket_label, object_key, create_status, get_status, delete_status, bytes_tested, notes, checked_by_user_id, checked_at) VALUES ('create_get_delete', ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(bucket ? 'private_evidence_bucket' : 'missing_bucket', objectKey, createStatus, getStatus, deleteStatus, bytes, notes, Number(user.user_id || 0) || null).run();
  } else if (action === 'seed_local_business_injection_targets') {
    for (const page of ['/', '/handmade-jewelry-ontario/', '/custom-gifts-southern-ontario/', '/laser-engraving-ontario/', '/custom-candles-ontario/', '/custom-soap-ontario/']) await db.prepare(`INSERT INTO local_business_schema_injection_targets (page_path, injection_status, schema_source, notes, created_by_user_id, created_at, updated_at) VALUES (?, 'queued', 'data/site/local-business-schema.json', 'Queued for static JSON-LD bake injection.', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(page_path) DO UPDATE SET injection_status='queued', updated_at=CURRENT_TIMESTAMP`).bind(page, Number(user.user_id || 0) || null).run();
  } else if (action === 'approve_internal_links') {
    const links = await safeAll(db, `SELECT source_path, target_path, suggested_anchor, reason FROM local_seo_internal_link_suggestions WHERE suggestion_status='needs_review' ORDER BY score DESC LIMIT 50`);
    for (const link of links) {
      await db.prepare(`INSERT INTO local_seo_bake_actions (page_path, internal_link_notes, action_status, created_by_user_id, created_at, updated_at) VALUES (?, ?, 'queued', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(link.source_path, `Add link to ${link.target_path} using anchor "${link.suggested_anchor}". Reason: ${link.reason || 'local SEO relevance'}`, Number(user.user_id || 0) || null).run().catch(() => null);
      await db.prepare(`UPDATE local_seo_internal_link_suggestions SET suggestion_status='approved', updated_at=CURRENT_TIMESTAMP WHERE source_path=? AND target_path=? AND suggested_anchor=?`).bind(link.source_path, link.target_path, link.suggested_anchor).run().catch(() => null);
    }
  } else if (action === 'create_dashboard_cards') {
    const latestManifest = await safeFirst(db, `SELECT release_manifest_live_diff_id, diff_status, missing_file_count, changed_file_count FROM release_manifest_live_diffs ORDER BY checked_at DESC LIMIT 1`, [], {});
    const openLocks = await safeFirst(db, `SELECT COUNT(*) AS count FROM recall_notification_locks WHERE lock_status!='release_allowed'`, [], {});
    const latestScore = await safeFirst(db, `SELECT score, score_status FROM deployment_readiness_scores ORDER BY scored_at DESC LIMIT 1`, [], {});
    const cards = [];
    if (latestManifest?.release_manifest_live_diff_id) cards.push(['release', latestManifest.release_manifest_live_diff_id, 'Manifest diff needs review', `${latestManifest.missing_file_count || 0} missing and ${latestManifest.changed_file_count || 0} changed file(s).`, latestManifest.diff_status === 'passed' ? 'info' : 'warn', '/admin/release-control/']);
    if (Number(openLocks?.count || 0)) cards.push(['recall', 0, 'Recall notices locked', `${openLocks.count} recall lock row(s) require compliance approval.`, 'warn', '/admin/release-control/#recall-locks']);
    if (latestScore?.score_status) cards.push(['readiness', 0, 'Deploy readiness score', `Latest release score is ${latestScore.score || 0}/100 (${latestScore.score_status}).`, latestScore.score_status === 'ready' ? 'info' : 'warn', '/admin/release-control/']);
    for (const card of cards) await db.prepare(`INSERT INTO dashboard_notification_cards (source_kind, source_id, card_title, card_body, severity, destination_page, card_status, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'open', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(...card, Number(user.user_id || 0) || null).run();
  } else if (action === 'calculate_deploy_readiness') {
    await calculateReadinessScore(db, normalizeText(body.build_label || BUILD_LABEL), Number(user.user_id || 0) || null);
  } else {
    return jsonResponse({ ok: false, error: 'Unknown action.' }, 400);
  }
  const data = await buildSummary(db, user);
  return jsonResponse({ ok: true, action, build_label: BUILD_LABEL, safe_deploy_zip_url: '/api/admin/safe-deploy-package?format=zip', ...data }, 200, { 'Cache-Control': 'no-store' });
}
