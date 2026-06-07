// File: /functions/api/admin/release-control.js
// Brief description: Admin release-control center for deployment history, manifest comparisons, screenshot jobs, local-business schema, mobile saved views, and safe deploy export records.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD_LABEL = 'Build 175';
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function lc(value) { return normalizeText(value).toLowerCase(); }
async function tableExists(db, tableName) { try { return !!(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(tableName).first()); } catch { return false; } }
async function safeAll(db, sql, bindings = []) { try { return rows(await db.prepare(sql).bind(...bindings).all()); } catch { return []; } }
async function safeFirst(db, sql, bindings = [], fallback = {}) { try { return (await db.prepare(sql).bind(...bindings).first()) || fallback; } catch { return fallback; } }

async function ensureTables(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS deployment_history (deployment_history_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT, branch_name TEXT, commit_sha TEXT, deploy_url TEXT, build_zip_label TEXT, package_manifest_hash TEXT, deployment_status TEXT NOT NULL DEFAULT 'planned', promoted_by_user_id INTEGER, promoted_at TEXT, notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_deployment_history_status ON deployment_history(deployment_status, created_at DESC)`).run().catch(() => null);
  await db.prepare(`CREATE TABLE IF NOT EXISTS deployment_manifest_comparisons (deployment_manifest_comparison_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT, expected_manifest_path TEXT NOT NULL DEFAULT '/data/site/release-package-manifest.json', deployed_manifest_url TEXT, comparison_status TEXT NOT NULL DEFAULT 'not_run', expected_file_count INTEGER NOT NULL DEFAULT 0, deployed_file_count INTEGER NOT NULL DEFAULT 0, missing_file_count INTEGER NOT NULL DEFAULT 0, changed_file_count INTEGER NOT NULL DEFAULT 0, comparison_json TEXT NOT NULL DEFAULT '{}', compared_by_user_id INTEGER, compared_at TEXT, notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS deployment_screenshot_jobs (deployment_screenshot_job_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT, page_path TEXT NOT NULL, screenshot_kind TEXT NOT NULL DEFAULT 'dark_theme_regression', viewport_width INTEGER NOT NULL DEFAULT 390, viewport_height INTEGER NOT NULL DEFAULT 844, theme TEXT NOT NULL DEFAULT 'dark', capture_status TEXT NOT NULL DEFAULT 'queued', evidence_url TEXT, r2_object_key TEXT, notes TEXT, created_by_user_id INTEGER, captured_by_user_id INTEGER, captured_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS mobile_admin_saved_views (mobile_admin_saved_view_id INTEGER PRIMARY KEY AUTOINCREMENT, view_key TEXT NOT NULL UNIQUE, view_label TEXT NOT NULL, page_path TEXT NOT NULL, device_target TEXT NOT NULL DEFAULT 'phone', filter_json TEXT NOT NULL DEFAULT '{}', sort_json TEXT NOT NULL DEFAULT '{}', is_default INTEGER NOT NULL DEFAULT 0, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS local_business_schema_settings (local_business_schema_setting_id INTEGER PRIMARY KEY AUTOINCREMENT, business_name TEXT NOT NULL DEFAULT 'Devil n Dove', canonical_url TEXT NOT NULL DEFAULT 'https://devilndove.com/', telephone TEXT, email TEXT, area_served_json TEXT NOT NULL DEFAULT '["Southern Ontario","Oxford County","Norfolk County"]', service_types_json TEXT NOT NULL DEFAULT '["handmade jewelry","custom gifts","laser engraving","custom candles","custom soap"]', same_as_json TEXT NOT NULL DEFAULT '[]', schema_status TEXT NOT NULL DEFAULT 'draft', schema_json TEXT NOT NULL DEFAULT '{}', updated_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS safe_deploy_export_records (safe_deploy_export_record_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT, export_label TEXT, release_notes_path TEXT DEFAULT 'RELEASE_NOTES.md', preflight_markdown_path TEXT, manifest_path TEXT DEFAULT 'data/site/release-package-manifest.json', schema_paths_json TEXT NOT NULL DEFAULT '[]', smoke_results_json TEXT NOT NULL DEFAULT '{}', export_status TEXT NOT NULL DEFAULT 'planned', zip_sha256 TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
}

function localBusinessJson(row) {
  let area = [], services = [], sameAs = [];
  try { area = JSON.parse(row.area_served_json || '[]'); } catch {}
  try { services = JSON.parse(row.service_types_json || '[]'); } catch {}
  try { sameAs = JSON.parse(row.same_as_json || '[]'); } catch {}
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: row.business_name || 'Devil n Dove',
    url: row.canonical_url || 'https://devilndove.com/',
    telephone: row.telephone || undefined,
    email: row.email || undefined,
    areaServed: area,
    makesOffer: services.map((name) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name } })),
    sameAs
  };
}

async function buildSummary(db) {
  await ensureTables(db);
  const deployment_history = await safeAll(db, `SELECT deployment_history_id, build_label, branch_name, commit_sha, deploy_url, build_zip_label, deployment_status, promoted_at, created_at FROM deployment_history ORDER BY created_at DESC LIMIT 15`);
  const manifest_comparisons = await safeAll(db, `SELECT deployment_manifest_comparison_id, build_label, expected_manifest_path, deployed_manifest_url, comparison_status, expected_file_count, deployed_file_count, missing_file_count, changed_file_count, compared_at, created_at FROM deployment_manifest_comparisons ORDER BY COALESCE(compared_at, created_at) DESC LIMIT 15`);
  const screenshot_jobs = await safeAll(db, `SELECT deployment_screenshot_job_id, build_label, page_path, viewport_width, viewport_height, theme, capture_status, evidence_url, created_at, updated_at FROM deployment_screenshot_jobs ORDER BY created_at DESC LIMIT 30`);
  const mobile_views = await safeAll(db, `SELECT mobile_admin_saved_view_id, view_key, view_label, page_path, device_target, is_default, updated_at FROM mobile_admin_saved_views ORDER BY is_default DESC, updated_at DESC LIMIT 30`);
  const local_business_rows = await safeAll(db, `SELECT * FROM local_business_schema_settings ORDER BY updated_at DESC LIMIT 5`);
  const safe_exports = await safeAll(db, `SELECT safe_deploy_export_record_id, build_label, export_label, export_status, manifest_path, zip_sha256, created_at FROM safe_deploy_export_records ORDER BY created_at DESC LIMIT 15`);
  const qa_queue = await tableExists(db, 'product_qa_bulk_fix_queue') ? await safeAll(db, `SELECT blocker_code, fix_type, product_count, approval_status, updated_at FROM product_qa_bulk_fix_queue ORDER BY updated_at DESC LIMIT 20`) : [];
  const marketplace_rules = await tableExists(db, 'marketplace_channel_validation_rules') ? await safeAll(db, `SELECT channel, column_key, rule_kind, is_required, severity, rule_status FROM marketplace_channel_validation_rules ORDER BY channel, column_key LIMIT 80`) : [];
  const recall_reviews = await tableExists(db, 'recall_compliance_reviews') ? await safeAll(db, `SELECT batch_number, review_status, approval_signature, approved_at, updated_at FROM recall_compliance_reviews ORDER BY updated_at DESC LIMIT 20`) : [];
  return {
    deployment_history,
    manifest_comparisons,
    screenshot_jobs,
    mobile_views,
    local_business_rows: local_business_rows.map((row) => ({ ...row, schema_preview: localBusinessJson(row) })),
    safe_exports,
    qa_queue,
    marketplace_rules,
    recall_reviews,
    summary: {
      deployment_count: deployment_history.length,
      manifest_comparison_count: manifest_comparisons.length,
      screenshot_job_count: screenshot_jobs.length,
      queued_screenshot_count: screenshot_jobs.filter((row) => lc(row.capture_status) === 'queued').length,
      mobile_saved_view_count: mobile_views.length,
      safe_export_count: safe_exports.length
    }
  };
}

export async function onRequestGet(context) {
  const user = await getAdminUserFromRequest(context.request, context.env);
  if (!user) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  const data = await buildSummary(db);
  const url = new URL(context.request.url);
  if (lc(url.searchParams.get('format')) === 'local-business-json') {
    const row = data.local_business_rows[0] || { business_name: 'Devil n Dove', canonical_url: 'https://devilndove.com/', area_served_json: '["Southern Ontario","Oxford County","Norfolk County"]', service_types_json: '["handmade jewelry","custom gifts","laser engraving","custom candles","custom soap"]', same_as_json: '[]' };
    return jsonResponse(localBusinessJson(row), 200, { 'Cache-Control': 'no-store' });
  }
  return jsonResponse({ ok: true, build_label: BUILD_LABEL, ...data }, 200, { 'Cache-Control': 'no-store' });
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
  } else if (action === 'queue_screenshot_jobs') {
    const pages = Array.isArray(body.pages) && body.pages.length ? body.pages : ['/', '/shop/', '/gallery/', '/handmade-jewelry-ontario/', '/custom-gifts-southern-ontario/', '/laser-engraving-ontario/'];
    for (const page of pages) {
      await db.prepare(`INSERT INTO deployment_screenshot_jobs (build_label, page_path, viewport_width, viewport_height, theme, capture_status, notes, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'queued', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(normalizeText(body.build_label || BUILD_LABEL), normalizeText(page), Number(body.viewport_width || 390), Number(body.viewport_height || 844), normalizeText(body.theme || 'dark'), normalizeText(body.notes || 'Queued from release-control page.'), Number(user.user_id || 0) || null).run();
    }
  } else if (action === 'seed_mobile_views') {
    const views = [
      ['today_tasks_phone', 'Today tasks — phone', '/admin/mobile/?view=today', '{"scope":"today"}'],
      ['deployment_preflight_phone', 'Deployment preflight — phone', '/admin/deployment-preflight/?view=phone', '{"compact":true}'],
      ['post_deploy_smoke_phone', 'Smoke tests — phone', '/admin/post-deploy-smoke-tests/?view=phone', '{"compact":true}'],
      ['accounting_close_phone', 'Accounting close — phone', '/admin/accounting/?view=close-phone', '{"scope":"close"}']
    ];
    for (const [key, label, path, filters] of views) {
      await db.prepare(`INSERT INTO mobile_admin_saved_views (view_key, view_label, page_path, device_target, filter_json, sort_json, is_default, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, 'phone', ?, '{}', 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(view_key) DO UPDATE SET view_label=excluded.view_label, page_path=excluded.page_path, filter_json=excluded.filter_json, updated_at=CURRENT_TIMESTAMP`).bind(key, label, path, filters, Number(user.user_id || 0) || null).run();
    }
  } else if (action === 'save_local_business_schema') {
    const area = JSON.stringify(Array.isArray(body.area_served) ? body.area_served : String(body.area_served || 'Southern Ontario,Oxford County,Norfolk County').split(',').map((v) => v.trim()).filter(Boolean));
    const services = JSON.stringify(Array.isArray(body.service_types) ? body.service_types : String(body.service_types || 'handmade jewelry,custom gifts,laser engraving,custom candles,custom soap').split(',').map((v) => v.trim()).filter(Boolean));
    const sameAs = JSON.stringify(Array.isArray(body.same_as) ? body.same_as : String(body.same_as || '').split(',').map((v) => v.trim()).filter(Boolean));
    const schemaRow = { business_name: normalizeText(body.business_name || 'Devil n Dove'), canonical_url: normalizeText(body.canonical_url || 'https://devilndove.com/'), telephone: normalizeText(body.telephone), email: normalizeText(body.email), area_served_json: area, service_types_json: services, same_as_json: sameAs };
    await db.prepare(`INSERT INTO local_business_schema_settings (business_name, canonical_url, telephone, email, area_served_json, service_types_json, same_as_json, schema_status, schema_json, updated_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(schemaRow.business_name, schemaRow.canonical_url, schemaRow.telephone, schemaRow.email, area, services, sameAs, normalizeText(body.schema_status || 'draft'), JSON.stringify(localBusinessJson(schemaRow)), Number(user.user_id || 0) || null).run();
  } else if (action === 'record_safe_export') {
    await db.prepare(`INSERT INTO safe_deploy_export_records (build_label, export_label, preflight_markdown_path, schema_paths_json, smoke_results_json, export_status, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(normalizeText(body.build_label || BUILD_LABEL), normalizeText(body.export_label || 'safe deploy export'), normalizeText(body.preflight_markdown_path || 'deployment-preflight-export.md'), JSON.stringify(body.schema_paths || ['database_build171_ledger_repair.sql','database_build173_deployment_preflight.sql','database_build174_deployment_preflight_detail.sql','database_build175_release_control.sql']), JSON.stringify(body.smoke_results || {}), normalizeText(body.export_status || 'planned'), Number(user.user_id || 0) || null).run();
  } else {
    return jsonResponse({ ok: false, error: 'Unknown action.' }, 400);
  }
  const data = await buildSummary(db);
  return jsonResponse({ ok: true, action, build_label: BUILD_LABEL, ...data }, 200, { 'Cache-Control': 'no-store' });
}
