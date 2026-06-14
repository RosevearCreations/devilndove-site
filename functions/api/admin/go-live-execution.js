// File: /functions/api/admin/go-live-execution.js
// Brief description: Build 180 go-live execution API for safe Product QA applies, marketplace/recall gates, SEO visual helpers, LocalBusiness bake previews, and post-promotion watcher scheduling.

import { captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD_LABEL = 'Build 180';
function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function lc(value) { return normalizeText(value).toLowerCase(); }
async function safeAll(db, sql, bindings = []) { try { return rows(await db.prepare(sql).bind(...bindings).all()); } catch { return []; } }
async function safeFirst(db, sql, bindings = [], fallback = {}) { try { return (await db.prepare(sql).bind(...bindings).first()) || fallback; } catch { return fallback; } }
async function runSafe(db, sql, bindings = []) { try { return await db.prepare(sql).bind(...bindings).run(); } catch { return null; } }
function parseJson(value, fallback) { try { const parsed = JSON.parse(value || ''); return parsed ?? fallback; } catch { return fallback; } }
function titleCase(value) { return normalizeText(value).toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\b(Of|And|Or|The|For|In|On|With)\b/g, (m) => m.toLowerCase()).replace(/^\w/, (m) => m.toUpperCase()); }
function safeExcerpt(value, len = 900) { const text = normalizeText(value); return text.length > len ? `${text.slice(0, len).trim()}…` : text; }
function svgBars(points) {
  const vals = (points || []).map((p) => Number(p.value ?? p.impressions ?? p.clicks ?? 0)).filter((n) => Number.isFinite(n));
  const width = 220, height = 64, max = Math.max(1, ...vals), step = vals.length ? width / vals.length : width;
  const bars = vals.map((v, i) => { const h = Math.max(4, Math.round((v / max) * 54)); return `<rect x="${Math.round(i * step + 2)}" y="${height - h}" width="${Math.max(4, Math.round(step - 4))}" height="${h}" rx="3"></rect>`; }).join('');
  return `<svg class="seo-mini-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Local SEO trend chart"><line x1="0" y1="63" x2="${width}" y2="63"></line>${bars}</svg>`;
}
async function ensureTables(db) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS product_qa_safe_apply_runs (product_qa_safe_apply_run_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT NOT NULL DEFAULT 'Build 180', product_qa_bulk_fix_queue_id INTEGER, blocker_code TEXT NOT NULL, run_mode TEXT NOT NULL DEFAULT 'preview', apply_status TEXT NOT NULL DEFAULT 'preview_only', affected_count INTEGER NOT NULL DEFAULT 0, skipped_count INTEGER NOT NULL DEFAULT 0, run_json TEXT NOT NULL DEFAULT '{}', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS local_seo_chart_render_runs (local_seo_chart_render_run_id INTEGER PRIMARY KEY AUTOINCREMENT, page_path TEXT NOT NULL, metric_kind TEXT NOT NULL DEFAULT 'impressions', point_count INTEGER NOT NULL DEFAULT 0, min_value REAL NOT NULL DEFAULT 0, max_value REAL NOT NULL DEFAULT 0, svg_markup TEXT, render_status TEXT NOT NULL DEFAULT 'prepared', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS internal_link_graph_interactions (internal_link_graph_interaction_id INTEGER PRIMARY KEY AUTOINCREMENT, source_path TEXT, target_path TEXT, filter_kind TEXT NOT NULL DEFAULT 'click_through', interaction_status TEXT NOT NULL DEFAULT 'prepared', notes TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS local_business_d1_export_bakes (local_business_d1_export_bake_id INTEGER PRIMARY KEY AUTOINCREMENT, source_table TEXT NOT NULL DEFAULT 'local_business_schema_settings', output_path TEXT NOT NULL DEFAULT 'data/site/local-business-schema.json', target_paths_json TEXT NOT NULL DEFAULT '[]', schema_json TEXT NOT NULL DEFAULT '{}', bake_status TEXT NOT NULL DEFAULT 'prepared', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS provider_webhook_verification_runs (provider_webhook_verification_run_id INTEGER PRIMARY KEY AUTOINCREMENT, provider TEXT NOT NULL, endpoint_path TEXT NOT NULL, signature_header TEXT, timestamp_header TEXT, verification_status TEXT NOT NULL DEFAULT 'setup_required', replay_window_seconds INTEGER NOT NULL DEFAULT 300, notes TEXT, checked_by_user_id INTEGER, checked_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS r2_signed_download_route_tests (r2_signed_download_route_test_id INTEGER PRIMARY KEY AUTOINCREMENT, route_path TEXT NOT NULL DEFAULT '/api/admin/private-evidence-download', object_key TEXT, token_status TEXT NOT NULL DEFAULT 'not_run', download_status TEXT NOT NULL DEFAULT 'not_run', expiry_status TEXT NOT NULL DEFAULT 'not_run', expires_seconds INTEGER NOT NULL DEFAULT 300, notes TEXT, checked_by_user_id INTEGER, checked_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS recall_evidence_ui_uploads (recall_evidence_ui_upload_id INTEGER PRIMARY KEY AUTOINCREMENT, batch_number TEXT NOT NULL, recall_id INTEGER, source_page TEXT NOT NULL DEFAULT '/admin/candle-soap-recalls/', upload_status TEXT NOT NULL DEFAULT 'needs_upload', evidence_url TEXT, r2_object_key TEXT, original_filename TEXT, mime_type TEXT, file_size_bytes INTEGER NOT NULL DEFAULT 0, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS recall_endpoint_gate_checks (recall_endpoint_gate_check_id INTEGER PRIMARY KEY AUTOINCREMENT, batch_number TEXT NOT NULL, endpoint_path TEXT NOT NULL DEFAULT '/api/admin/candle-soap-recall-notifications', legacy_lock_status TEXT, release_gate_status TEXT, endpoint_gate_status TEXT NOT NULL DEFAULT 'blocked', checked_by_user_id INTEGER, checked_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS accountant_zip_endpoint_logs (accountant_zip_endpoint_log_id INTEGER PRIMARY KEY AUTOINCREMENT, period_month TEXT, endpoint_path TEXT NOT NULL DEFAULT '/api/admin/accounting-monthly-summary-export', zip_sha256 TEXT, total_bytes INTEGER NOT NULL DEFAULT 0, evidence_file_count INTEGER NOT NULL DEFAULT 0, log_status TEXT NOT NULL DEFAULT 'prepared', safe_deploy_package_download_id INTEGER, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS previous_zip_binary_comparisons (previous_zip_binary_comparison_id INTEGER PRIMARY KEY AUTOINCREMENT, previous_filename TEXT, current_filename TEXT, previous_sha256 TEXT, current_sha256 TEXT, added_count INTEGER NOT NULL DEFAULT 0, changed_count INTEGER NOT NULL DEFAULT 0, removed_count INTEGER NOT NULL DEFAULT 0, comparison_status TEXT NOT NULL DEFAULT 'prepared', comparison_json TEXT NOT NULL DEFAULT '{}', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS dashboard_notification_visibility_states (dashboard_notification_visibility_state_id INTEGER PRIMARY KEY AUTOINCREMENT, dashboard_notification_card_id INTEGER, visibility_status TEXT NOT NULL DEFAULT 'visible', snooze_until TEXT, dismissed_at TEXT, user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(dashboard_notification_card_id, user_id))`,
    `CREATE TABLE IF NOT EXISTS mobile_release_control_layout_runs (mobile_release_control_layout_run_id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, layout_key TEXT NOT NULL DEFAULT 'phone_release_cards', rendered_card_count INTEGER NOT NULL DEFAULT 0, large_tap_targets INTEGER NOT NULL DEFAULT 1, layout_status TEXT NOT NULL DEFAULT 'prepared', created_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS deployment_preflight_structured_data_excerpts (deployment_preflight_structured_data_excerpt_id INTEGER PRIMARY KEY AUTOINCREMENT, page_path TEXT NOT NULL, schema_type TEXT NOT NULL, excerpt_status TEXT NOT NULL DEFAULT 'needs_review', jsonld_excerpt TEXT, issue_count INTEGER NOT NULL DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(page_path, schema_type))`,
    `CREATE TABLE IF NOT EXISTS marketplace_download_block_events (marketplace_download_block_event_id INTEGER PRIMARY KEY AUTOINCREMENT, channel TEXT NOT NULL, gate_status TEXT NOT NULL, hard_blocker_count INTEGER NOT NULL DEFAULT 0, blocked INTEGER NOT NULL DEFAULT 1, requested_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS release_control_row_status_actions (release_control_row_status_action_id INTEGER PRIMARY KEY AUTOINCREMENT, row_kind TEXT NOT NULL, source_row_id INTEGER, action_status TEXT NOT NULL DEFAULT 'not_checked', action_note TEXT, acted_by_user_id INTEGER, acted_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS release_manifest_filter_drawer_runs (release_manifest_filter_drawer_run_id INTEGER PRIMARY KEY AUTOINCREMENT, filter_key TEXT NOT NULL, path_contains TEXT, diff_kind TEXT, matched_count INTEGER NOT NULL DEFAULT 0, drawer_status TEXT NOT NULL DEFAULT 'prepared', result_json TEXT NOT NULL DEFAULT '[]', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS deploy_readiness_score_trend_exports (deploy_readiness_score_trend_export_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT NOT NULL, point_count INTEGER NOT NULL DEFAULT 0, latest_score INTEGER NOT NULL DEFAULT 0, markdown_body TEXT NOT NULL, export_status TEXT NOT NULL DEFAULT 'prepared', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS cloudflare_deployment_auto_matches (cloudflare_deployment_auto_match_id INTEGER PRIMARY KEY AUTOINCREMENT, deployment_history_id INTEGER, build_label TEXT, branch_name TEXT, commit_sha TEXT, manifest_hash TEXT, auto_match_status TEXT NOT NULL DEFAULT 'needs_review', match_score INTEGER NOT NULL DEFAULT 0, matched_by_user_id INTEGER, matched_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS promote_live_ui_gate_states (promote_live_ui_gate_state_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT NOT NULL, promote_button_status TEXT NOT NULL DEFAULT 'disabled', readiness_score INTEGER NOT NULL DEFAULT 0, blocker_count INTEGER NOT NULL DEFAULT 0, gate_json TEXT NOT NULL DEFAULT '{}', created_by_user_id INTEGER, checked_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS post_promotion_watcher_schedule_runs (post_promotion_watcher_schedule_run_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT NOT NULL, schedule_kind TEXT NOT NULL DEFAULT 'manual', watch_window_minutes INTEGER NOT NULL DEFAULT 60, run_status TEXT NOT NULL DEFAULT 'queued', triggered_from_path TEXT DEFAULT '/admin/post-deploy-smoke-tests/', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`
  ];
  for (const statement of statements) await runSafe(db, statement);
}
async function applySafeCatalogFixes(db, user, body) {
  const queueId = Number(body.product_qa_bulk_fix_queue_id || 0);
  const runMode = lc(body.run_mode || 'preview') === 'apply' ? 'apply' : 'preview';
  const queue = queueId ? await safeFirst(db, `SELECT * FROM product_qa_bulk_fix_queue WHERE product_qa_bulk_fix_queue_id=? LIMIT 1`, [queueId], null) : null;
  if (!queue) return { ok: false, status: 404, error: 'Approved Product QA queue row is required.' };
  const blocker = lc(queue.blocker_code);
  if (!['seo_title_case','empty_status_label'].includes(blocker)) return { ok: false, status: 400, error: 'Build 180 only auto-applies seo_title_case and empty_status_label fixes.' };
  if (!['safe','approved'].includes(lc(queue.approval_status))) return { ok: false, status: 409, error: 'Product QA queue must be approved before applying.' };
  const items = await safeAll(db, `SELECT * FROM product_qa_bulk_fix_preview_items WHERE product_qa_bulk_fix_queue_id=? AND blocker_code=? LIMIT 50`, [queueId, blocker]);
  let affected = 0, skipped = 0; const events = [];
  for (const item of items) {
    const productId = Number(item.product_id || 0); if (!productId) { skipped += 1; continue; }
    if (blocker === 'seo_title_case') {
      const product = await safeFirst(db, `SELECT p.name, ps.meta_title FROM products p LEFT JOIN product_seo ps ON ps.product_id=p.product_id WHERE p.product_id=? LIMIT 1`, [productId], {});
      const suggested = titleCase(item.suggested_value || product.meta_title || product.name || '');
      if (!suggested || suggested.length < 8) { skipped += 1; continue; }
      if (runMode === 'apply') {
        await db.prepare(`INSERT INTO product_seo (product_id, meta_title, schema_type, created_at, updated_at) VALUES (?, ?, 'Product', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(product_id) DO UPDATE SET meta_title=excluded.meta_title, updated_at=CURRENT_TIMESTAMP`).bind(productId, suggested.slice(0, 70)).run();
        await runSafe(db, `UPDATE product_qa_bulk_fix_preview_items SET preview_status='applied' WHERE product_qa_bulk_fix_preview_item_id=?`, [item.product_qa_bulk_fix_preview_item_id]);
      }
      affected += 1; events.push({ product_id: productId, field: 'product_seo.meta_title', value: suggested.slice(0, 70) });
    } else if (blocker === 'empty_status_label') {
      const suggested = lc(item.suggested_value || 'draft');
      const status = ['draft','active','archived'].includes(suggested) ? suggested : 'draft';
      if (runMode === 'apply') {
        const result = await db.prepare(`UPDATE products SET status=?, updated_at=CURRENT_TIMESTAMP WHERE product_id=? AND (status IS NULL OR TRIM(status)='')`).bind(status, productId).run().catch(() => null);
        const changed = Number(result?.meta?.changes || 0); if (!changed) { skipped += 1; continue; }
        await runSafe(db, `UPDATE product_qa_bulk_fix_preview_items SET preview_status='applied' WHERE product_qa_bulk_fix_preview_item_id=?`, [item.product_qa_bulk_fix_preview_item_id]);
      }
      affected += 1; events.push({ product_id: productId, field: 'products.status', value: status });
    }
  }
  await db.prepare(`INSERT INTO product_qa_safe_apply_runs (build_label, product_qa_bulk_fix_queue_id, blocker_code, run_mode, apply_status, affected_count, skipped_count, run_json, created_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(BUILD_LABEL, queueId, blocker, runMode, runMode === 'apply' ? 'applied' : 'preview_only', affected, skipped, JSON.stringify({ events }), Number(user.user_id || 0) || null).run();
  if (runMode === 'apply') await runSafe(db, `UPDATE product_qa_bulk_fix_queue SET approval_status='applied', applied_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE product_qa_bulk_fix_queue_id=?`, [queueId]);
  return { ok: true, message: `${runMode === 'apply' ? 'Applied' : 'Previewed'} ${affected} safe Product QA fix(es).`, affected, skipped, events };
}
async function renderSeoCharts(db, user) {
  const points = await safeAll(db, `SELECT page_path, metric_kind, point_value AS value, point_date FROM local_seo_search_console_chart_points ORDER BY page_path, point_date ASC LIMIT 300`);
  const fallback = points.length ? points : await safeAll(db, `SELECT page_path, 'score' AS metric_kind, last_page_score AS value, updated_at AS point_date FROM local_seo_competitor_phrases ORDER BY page_path, updated_at ASC LIMIT 150`);
  const byKey = new Map();
  for (const p of fallback) { const key = `${p.page_path || '/'}|${p.metric_kind || 'impressions'}`; if (!byKey.has(key)) byKey.set(key, []); byKey.get(key).push(p); }
  for (const [key, list] of byKey.entries()) {
    const [page, metric] = key.split('|'); const vals = list.map((p) => Number(p.value || 0)).filter((n) => Number.isFinite(n));
    await db.prepare(`INSERT INTO local_seo_chart_render_runs (page_path, metric_kind, point_count, min_value, max_value, svg_markup, render_status, created_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, 'prepared', ?, CURRENT_TIMESTAMP)`).bind(page, metric, vals.length, vals.length ? Math.min(...vals) : 0, vals.length ? Math.max(...vals) : 0, svgBars(list), Number(user.user_id || 0) || null).run();
  }
}
async function seedStructuredDataExcerpts(db) {
  const pages = await safeAll(db, `SELECT page_path FROM local_seo_landing_page_reviews ORDER BY page_path LIMIT 80`);
  const targets = pages.length ? pages.map((p) => p.page_path) : ['/', '/shop/', '/handmade-jewelry-ontario/', '/laser-engraving-ontario/'];
  for (const page of targets) {
    for (const type of ['LocalBusiness','Product','BreadcrumbList']) {
      await db.prepare(`INSERT INTO deployment_preflight_structured_data_excerpts (page_path, schema_type, excerpt_status, jsonld_excerpt, issue_count, created_at, updated_at) VALUES (?, ?, 'needs_review', ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(page_path, schema_type) DO UPDATE SET jsonld_excerpt=excluded.jsonld_excerpt, updated_at=CURRENT_TIMESTAMP`).bind(page, type, safeExcerpt(JSON.stringify({ '@context': 'https://schema.org', '@type': type, url: page }))).run();
    }
  }
}
async function bakeLocalBusinessFromD1(db, user) {
  const row = await safeFirst(db, `SELECT * FROM local_business_schema_settings ORDER BY updated_at DESC LIMIT 1`, [], {});
  const schema = {
    '@context': 'https://schema.org', '@type': 'LocalBusiness', name: row.business_name || 'Devil n Dove', url: row.canonical_url || 'https://devilndove.com/', telephone: row.telephone || '', email: row.email || '', areaServed: parseJson(row.area_served_json, ['Ontario']), sameAs: parseJson(row.same_as_json, [])
  };
  await db.prepare(`INSERT INTO local_business_d1_export_bakes (source_table, output_path, target_paths_json, schema_json, bake_status, created_by_user_id, created_at) VALUES ('local_business_schema_settings', 'data/site/local-business-schema.json', ?, ?, 'prepared', ?, CURRENT_TIMESTAMP)`).bind(JSON.stringify(['/', '/shop/', '/creations/']), JSON.stringify(schema), Number(user.user_id || 0) || null).run();
}
async function checkRecallEndpointGates(db, user) {
  const batches = await safeAll(db, `SELECT DISTINCT batch_number FROM candle_soap_recall_notification_queue UNION SELECT DISTINCT batch_number FROM candle_soap_batch_recalls LIMIT 100`);
  for (const b of batches) {
    const batch = normalizeText(b.batch_number); if (!batch) continue;
    const legacy = await safeFirst(db, `SELECT lock_status FROM recall_notification_locks WHERE batch_number=? ORDER BY last_checked_at DESC LIMIT 1`, [batch], { lock_status: 'missing' });
    const release = await safeFirst(db, `SELECT release_status FROM recall_notification_release_gates WHERE batch_number=? ORDER BY checked_at DESC LIMIT 1`, [batch], { release_status: 'missing' });
    const allowed = lc(legacy.lock_status) === 'release_allowed' && lc(release.release_status) === 'release_allowed';
    await db.prepare(`INSERT INTO recall_endpoint_gate_checks (batch_number, endpoint_path, legacy_lock_status, release_gate_status, endpoint_gate_status, checked_by_user_id, checked_at, notes) VALUES (?, '/api/admin/candle-soap-recall-notifications', ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`).bind(batch, legacy.lock_status, release.release_status, allowed ? 'release_allowed' : 'blocked', Number(user.user_id || 0) || null, allowed ? 'Both recall gate systems allow release.' : 'Endpoint remains blocked until legacy lock and Build 179 release gate both allow release.').run();
  }
}
async function blockState(db, user) {
  const score = await safeFirst(db, `SELECT score, blocker_count FROM deployment_readiness_scores ORDER BY scored_at DESC LIMIT 1`, [], { score: 0, blocker_count: 999 });
  const checklist = await safeFirst(db, `SELECT COUNT(*) AS count FROM deployment_promote_live_checklist WHERE required_to_promote=1 AND checklist_status NOT IN ('passed','not_applicable')`, [], { count: 0 });
  const recall = await safeFirst(db, `SELECT COUNT(*) AS count FROM recall_notification_release_gates WHERE release_status!='release_allowed'`, [], { count: 0 });
  const marketplace = await safeFirst(db, `SELECT COUNT(*) AS count FROM marketplace_export_download_gates WHERE gate_status IN ('blocked','blocked_pending_validation')`, [], { count: 0 });
  const blockers = Number(score.blocker_count || 0) + Number(checklist.count || 0) + Number(recall.count || 0) + Number(marketplace.count || 0);
  const status = Number(score.score || 0) >= 95 && blockers === 0 ? 'enabled' : 'disabled';
  const gate = { score: Number(score.score || 0), score_blockers: Number(score.blocker_count || 0), checklist_blockers: Number(checklist.count || 0), recall_blockers: Number(recall.count || 0), marketplace_blockers: Number(marketplace.count || 0) };
  await db.prepare(`INSERT INTO promote_live_ui_gate_states (build_label, promote_button_status, readiness_score, blocker_count, gate_json, created_by_user_id, checked_at, notes) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`).bind(BUILD_LABEL, status, gate.score, blockers, JSON.stringify(gate), Number(user.user_id || 0) || null, status === 'enabled' ? 'Promote button may be enabled.' : 'Promote button remains disabled until all gates pass.').run();
}
async function exportScoreTrend(db, user) {
  const scores = await safeAll(db, `SELECT build_label, score, score_status, blocker_count, scored_at FROM deployment_readiness_scores ORDER BY scored_at DESC LIMIT 20`);
  const chronological = scores.slice().reverse();
  const latest = chronological[chronological.length - 1] || { score: 0 };
  const md = [`# ${BUILD_LABEL} readiness trend`, '', ...chronological.map((row) => `- ${row.scored_at || 'unknown'} — ${row.build_label || 'build'}: ${Number(row.score || 0)}/100, ${row.score_status || 'unknown'}, blockers ${Number(row.blocker_count || 0)}`), ''].join('\n');
  await db.prepare(`INSERT INTO deploy_readiness_score_trend_exports (build_label, point_count, latest_score, markdown_body, export_status, created_by_user_id, created_at) VALUES (?, ?, ?, ?, 'prepared', ?, CURRENT_TIMESTAMP)`).bind(BUILD_LABEL, scores.length, Number(latest.score || 0), md, Number(user.user_id || 0) || null).run();
}
async function seedProviderWebhookRuns(db, user) {
  const providers = [
    ['resend', '/api/resend-webhook', 'resend-signature', 'resend-timestamp'],
    ['sendgrid', '/api/sendgrid-webhook', 'x-twilio-email-event-webhook-signature', 'x-twilio-email-event-webhook-timestamp'],
    ['postmark', '/api/postmark-webhook', 'x-postmark-signature', '']
  ];
  for (const p of providers) await db.prepare(`INSERT INTO provider_webhook_verification_runs (provider, endpoint_path, signature_header, timestamp_header, verification_status, replay_window_seconds, notes, checked_by_user_id, checked_at) VALUES (?, ?, ?, ?, 'setup_required', 300, 'Live cryptographic verification requires deployed provider secret bindings and real headers.', ?, CURRENT_TIMESTAMP)`).bind(...p, Number(user.user_id || 0) || null).run();
}
async function scheduleWatcher(db, user, body) {
  await db.prepare(`INSERT INTO post_promotion_watcher_schedule_runs (build_label, schedule_kind, watch_window_minutes, run_status, triggered_from_path, created_by_user_id, created_at, notes) VALUES (?, ?, ?, 'queued', ?, ?, CURRENT_TIMESTAMP, ?)`).bind(BUILD_LABEL, lc(body.schedule_kind || 'manual'), Number(body.watch_window_minutes || 60), normalizeText(body.triggered_from_path || '/admin/post-deploy-smoke-tests/'), Number(user.user_id || 0) || null, normalizeText(body.notes || 'Queued from Build 180 Go-Live Execution.')).run();
}
async function seedMobileLayout(db, user) {
  const prefs = await safeAll(db, `SELECT * FROM mobile_release_control_render_preferences ORDER BY updated_at DESC LIMIT 5`);
  await db.prepare(`INSERT INTO mobile_release_control_layout_runs (user_id, layout_key, rendered_card_count, large_tap_targets, layout_status, created_at) VALUES (?, 'phone_release_cards', ?, 1, 'prepared', CURRENT_TIMESTAMP)`).bind(Number(user.user_id || 0) || null, prefs.length ? prefs.length : 5).run();
}
async function markRowStatus(db, user, body) {
  await db.prepare(`INSERT INTO release_control_row_status_actions (row_kind, source_row_id, action_status, action_note, acted_by_user_id, acted_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(lc(body.row_kind || 'rollback'), Number(body.source_row_id || 0) || null, lc(body.action_status || 'passed'), normalizeText(body.action_note || ''), Number(user.user_id || 0) || null).run();
}
async function runManifestDrawer(db, user, body) {
  const contains = normalizeText(body.path_contains || 'admin'); const kind = lc(body.diff_kind || 'changed');
  const rowsFound = await safeAll(db, `SELECT * FROM release_manifest_diff_items WHERE path LIKE ? AND diff_kind LIKE ? ORDER BY path LIMIT 100`, [`%${contains}%`, `%${kind}%`]);
  await db.prepare(`INSERT INTO release_manifest_filter_drawer_runs (filter_key, path_contains, diff_kind, matched_count, drawer_status, result_json, created_by_user_id, created_at) VALUES (?, ?, ?, ?, 'prepared', ?, ?, CURRENT_TIMESTAMP)`).bind(`${kind}:${contains}`, contains, kind, rowsFound.length, JSON.stringify(rowsFound), Number(user.user_id || 0) || null).run();
}
async function accountantZipLog(db, user) {
  const latest = await safeFirst(db, `SELECT * FROM accounting_evidence_bundle_checksums ORDER BY created_at DESC LIMIT 1`, [], {});
  await db.prepare(`INSERT INTO accountant_zip_endpoint_logs (period_month, zip_sha256, total_bytes, evidence_file_count, log_status, safe_deploy_package_download_id, created_by_user_id, created_at, notes) VALUES (?, ?, ?, ?, 'prepared', ?, ?, CURRENT_TIMESTAMP, 'Linked from latest accountant evidence checksum row during Build 180 go-live execution pass.')`).bind(latest.period_month || '', latest.zip_sha256 || latest.sha256 || '', Number(latest.total_bytes || 0), Number(latest.evidence_file_count || 0), latest.safe_deploy_package_download_id || null, Number(user.user_id || 0) || null).run();
}
async function buildPayload(db) {
  await ensureTables(db);
  const summary = {
    latest_promote_button: (await safeFirst(db, `SELECT promote_button_status FROM promote_live_ui_gate_states ORDER BY checked_at DESC LIMIT 1`, [], { promote_button_status: 'not_checked' })).promote_button_status,
    qa_apply_runs: Number((await safeFirst(db, `SELECT COUNT(*) AS count FROM product_qa_safe_apply_runs`, [], { count: 0 })).count || 0),
    marketplace_blocks: Number((await safeFirst(db, `SELECT COUNT(*) AS count FROM marketplace_download_block_events WHERE blocked=1`, [], { count: 0 })).count || 0),
    recall_endpoint_blocks: Number((await safeFirst(db, `SELECT COUNT(*) AS count FROM recall_endpoint_gate_checks WHERE endpoint_gate_status!='release_allowed'`, [], { count: 0 })).count || 0)
  };
  return {
    ok: true, build_label: BUILD_LABEL, summary,
    qa_runs: await safeAll(db, `SELECT * FROM product_qa_safe_apply_runs ORDER BY created_at DESC LIMIT 30`),
    chart_runs: await safeAll(db, `SELECT * FROM local_seo_chart_render_runs ORDER BY created_at DESC LIMIT 30`),
    graph_interactions: await safeAll(db, `SELECT * FROM internal_link_graph_interactions ORDER BY created_at DESC LIMIT 30`),
    lb_bakes: await safeAll(db, `SELECT * FROM local_business_d1_export_bakes ORDER BY created_at DESC LIMIT 20`),
    webhook_runs: await safeAll(db, `SELECT * FROM provider_webhook_verification_runs ORDER BY checked_at DESC LIMIT 20`),
    r2_route_tests: await safeAll(db, `SELECT * FROM r2_signed_download_route_tests ORDER BY checked_at DESC LIMIT 20`),
    recall_uploads: await safeAll(db, `SELECT * FROM recall_evidence_ui_uploads ORDER BY updated_at DESC LIMIT 20`),
    recall_gates: await safeAll(db, `SELECT * FROM recall_endpoint_gate_checks ORDER BY checked_at DESC LIMIT 30`),
    accountant_logs: await safeAll(db, `SELECT * FROM accountant_zip_endpoint_logs ORDER BY created_at DESC LIMIT 20`),
    zip_comparisons: await safeAll(db, `SELECT * FROM previous_zip_binary_comparisons ORDER BY created_at DESC LIMIT 10`),
    dashboard_visibility: await safeAll(db, `SELECT * FROM dashboard_notification_visibility_states ORDER BY updated_at DESC LIMIT 20`),
    mobile_layouts: await safeAll(db, `SELECT * FROM mobile_release_control_layout_runs ORDER BY created_at DESC LIMIT 20`),
    schema_excerpts: await safeAll(db, `SELECT * FROM deployment_preflight_structured_data_excerpts ORDER BY page_path, schema_type LIMIT 40`),
    marketplace_blocks: await safeAll(db, `SELECT * FROM marketplace_download_block_events ORDER BY created_at DESC LIMIT 30`),
    row_actions: await safeAll(db, `SELECT * FROM release_control_row_status_actions ORDER BY acted_at DESC LIMIT 30`),
    manifest_drawers: await safeAll(db, `SELECT * FROM release_manifest_filter_drawer_runs ORDER BY created_at DESC LIMIT 20`),
    trend_exports: await safeAll(db, `SELECT deploy_readiness_score_trend_export_id, build_label, point_count, latest_score, export_status, created_at FROM deploy_readiness_score_trend_exports ORDER BY created_at DESC LIMIT 20`),
    cf_auto_matches: await safeAll(db, `SELECT * FROM cloudflare_deployment_auto_matches ORDER BY matched_at DESC LIMIT 20`),
    gate_states: await safeAll(db, `SELECT * FROM promote_live_ui_gate_states ORDER BY checked_at DESC LIMIT 20`),
    watcher_schedules: await safeAll(db, `SELECT * FROM post_promotion_watcher_schedule_runs ORDER BY created_at DESC LIMIT 20`)
  };
}
export async function onRequestGet(context) {
  const user = await getAdminUserFromRequest(context.request, context.env); if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const db = getDb(context.env); if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  return json(await buildPayload(db));
}
export async function onRequestPost(context) {
  const user = await getAdminUserFromRequest(context.request, context.env); if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const db = getDb(context.env); if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureTables(db);
  let body = {}; try { body = await context.request.json(); } catch { body = {}; }
  const action = lc(body.action || 'seed_all');
  try {
    if (action === 'seed_all') { await renderSeoCharts(db, user); await seedStructuredDataExcerpts(db); await bakeLocalBusinessFromD1(db, user); await seedProviderWebhookRuns(db, user); await checkRecallEndpointGates(db, user); await blockState(db, user); await exportScoreTrend(db, user); await seedMobileLayout(db, user); await accountantZipLog(db, user); }
    else if (action === 'apply_safe_catalog_fixes') { const result = await applySafeCatalogFixes(db, user, body); if (!result.ok) return json({ ok: false, error: result.error }, result.status || 400); return json({ ok: true, ...result, ...(await buildPayload(db)) }); }
    else if (action === 'render_seo_charts') await renderSeoCharts(db, user);
    else if (action === 'record_graph_interaction') await db.prepare(`INSERT INTO internal_link_graph_interactions (source_path, target_path, filter_kind, interaction_status, notes, created_by_user_id, created_at) VALUES (?, ?, ?, 'prepared', ?, ?, CURRENT_TIMESTAMP)`).bind(normalizeText(body.source_path || ''), normalizeText(body.target_path || ''), lc(body.filter_kind || 'click_through'), normalizeText(body.notes || ''), Number(user.user_id || 0) || null).run();
    else if (action === 'bake_local_business_from_d1') await bakeLocalBusinessFromD1(db, user);
    else if (action === 'seed_provider_webhooks') await seedProviderWebhookRuns(db, user);
    else if (action === 'seed_r2_route_test') await db.prepare(`INSERT INTO r2_signed_download_route_tests (route_path, object_key, token_status, download_status, expiry_status, notes, checked_by_user_id, checked_at) VALUES ('/api/admin/private-evidence-download', ?, 'needs_worker_secret', 'not_run', 'not_run', 'Signed download route requires deployed token/signature secret before live test.', ?, CURRENT_TIMESTAMP)`).bind(normalizeText(body.object_key || `signed-download/build-180-${Date.now()}.txt`), Number(user.user_id || 0) || null).run();
    else if (action === 'seed_recall_upload') await db.prepare(`INSERT INTO recall_evidence_ui_uploads (batch_number, recall_id, source_page, upload_status, evidence_url, r2_object_key, original_filename, mime_type, file_size_bytes, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, 'needs_upload', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(normalizeText(body.batch_number || 'manual-review'), Number(body.recall_id || 0) || null, normalizeText(body.source_page || '/admin/candle-soap-recalls/'), normalizeText(body.evidence_url || ''), normalizeText(body.r2_object_key || ''), normalizeText(body.original_filename || ''), normalizeText(body.mime_type || ''), Number(body.file_size_bytes || 0), Number(user.user_id || 0) || null).run();
    else if (action === 'check_recall_gates') await checkRecallEndpointGates(db, user);
    else if (action === 'log_accountant_zip') await accountantZipLog(db, user);
    else if (action === 'seed_dashboard_visibility') await db.prepare(`INSERT INTO dashboard_notification_visibility_states (dashboard_notification_card_id, visibility_status, snooze_until, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(dashboard_notification_card_id, user_id) DO UPDATE SET visibility_status=excluded.visibility_status, snooze_until=excluded.snooze_until, updated_at=CURRENT_TIMESTAMP`).bind(Number(body.dashboard_notification_card_id || 0), lc(body.visibility_status || 'snoozed'), normalizeText(body.snooze_until || ''), Number(user.user_id || 0) || null).run();
    else if (action === 'seed_mobile_layout') await seedMobileLayout(db, user);
    else if (action === 'seed_schema_excerpts') await seedStructuredDataExcerpts(db);
    else if (action === 'mark_row_status') await markRowStatus(db, user, body);
    else if (action === 'run_manifest_drawer') await runManifestDrawer(db, user, body);
    else if (action === 'export_score_trend') await exportScoreTrend(db, user);
    else if (action === 'update_promote_gate_state') await blockState(db, user);
    else if (action === 'schedule_incident_watcher') await scheduleWatcher(db, user, body);
    else return json({ ok: false, error: 'Unknown Build 180 go-live execution action.' }, 400);
    return json(await buildPayload(db));
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, { incident_scope: 'build180_go_live_execution', incident_code: 'go_live_execution_action_failed', severity: 'warning', message: error?.message || 'Build 180 action failed.', related_user_id: user.user_id, details: { action, error: String(error?.message || error) } });
    return json({ ok: false, error: error?.message || 'Build 180 action failed.' }, 500);
  }
}
