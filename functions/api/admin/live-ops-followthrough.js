// File: /functions/api/admin/live-ops-followthrough.js
// Brief description: Build 181 follow-through API for QA blocker counts, recall evidence upload requests, marketplace gate badges/overrides, LocalBusiness export rows, manifest drawer filters, and post-promotion watcher logs.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD_LABEL = 'Build 181';
function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function lc(value) { return normalizeText(value).toLowerCase(); }
async function safeAll(db, sql, bindings = []) { try { return rows(await db.prepare(sql).bind(...bindings).all()); } catch { return []; } }
async function safeFirst(db, sql, bindings = [], fallback = {}) { try { return (await db.prepare(sql).bind(...bindings).first()) || fallback; } catch { return fallback; } }
async function runSafe(db, sql, bindings = []) { try { return await db.prepare(sql).bind(...bindings).run(); } catch { return null; } }
async function ensureTables(db) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS product_qa_blocker_preview_counts (product_qa_blocker_preview_count_id INTEGER PRIMARY KEY AUTOINCREMENT, blocker_code TEXT NOT NULL, affected_products INTEGER NOT NULL DEFAULT 0, preview_item_count INTEGER NOT NULL DEFAULT 0, safe_apply_candidate_count INTEGER NOT NULL DEFAULT 0, manual_only_count INTEGER NOT NULL DEFAULT 0, latest_queue_id INTEGER, count_status TEXT NOT NULL DEFAULT 'prepared', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS marketplace_export_gate_overrides (marketplace_export_gate_override_id INTEGER PRIMARY KEY AUTOINCREMENT, channel TEXT NOT NULL, gate_key TEXT NOT NULL DEFAULT 'download_gate', override_status TEXT NOT NULL DEFAULT 'requested', reason TEXT, expires_at TEXT, created_by_user_id INTEGER, approved_by_user_id INTEGER, approved_at TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS marketplace_gate_badge_snapshots (marketplace_gate_badge_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT, channel TEXT NOT NULL, badge_status TEXT NOT NULL DEFAULT 'unknown', hard_blocker_count INTEGER NOT NULL DEFAULT 0, warning_count INTEGER NOT NULL DEFAULT 0, badge_label TEXT, blocker_reason TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS recall_evidence_upload_requests (recall_evidence_upload_request_id INTEGER PRIMARY KEY AUTOINCREMENT, batch_number TEXT NOT NULL, recall_id INTEGER, requested_file_kind TEXT NOT NULL DEFAULT 'signature_evidence', upload_widget_status TEXT NOT NULL DEFAULT 'needs_upload', r2_target_prefix TEXT, evidence_url TEXT, r2_object_key TEXT, original_filename TEXT, mime_type TEXT, file_size_bytes INTEGER NOT NULL DEFAULT 0, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS local_business_admin_export_runs (local_business_admin_export_run_id INTEGER PRIMARY KEY AUTOINCREMENT, source_table TEXT NOT NULL DEFAULT 'local_business_schema_settings', output_path TEXT NOT NULL DEFAULT 'data/site/local-business-schema.json', row_count INTEGER NOT NULL DEFAULT 0, export_status TEXT NOT NULL DEFAULT 'prepared', export_json TEXT NOT NULL DEFAULT '{}', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS public_page_content_refreshes (public_page_content_refresh_id INTEGER PRIMARY KEY AUTOINCREMENT, page_path TEXT NOT NULL, target_phrase TEXT NOT NULL, placement_kind TEXT NOT NULL DEFAULT 'body_copy', refresh_status TEXT NOT NULL DEFAULT 'applied_static', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS provider_webhook_crypto_test_vectors (provider_webhook_crypto_test_vector_id INTEGER PRIMARY KEY AUTOINCREMENT, provider TEXT NOT NULL, algorithm TEXT NOT NULL DEFAULT 'hmac-sha256', header_name TEXT, test_status TEXT NOT NULL DEFAULT 'documented', replay_window_seconds INTEGER NOT NULL DEFAULT 300, notes TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS manifest_drawer_saved_filters (manifest_drawer_saved_filter_id INTEGER PRIMARY KEY AUTOINCREMENT, filter_label TEXT NOT NULL, path_prefix TEXT, diff_kind TEXT, is_default INTEGER NOT NULL DEFAULT 0, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS dashboard_notification_action_buttons (dashboard_notification_action_button_id INTEGER PRIMARY KEY AUTOINCREMENT, card_kind TEXT NOT NULL, source_row_id INTEGER, action_kind TEXT NOT NULL DEFAULT 'snooze', button_label TEXT, action_status TEXT NOT NULL DEFAULT 'available', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS post_promotion_watcher_execution_logs (post_promotion_watcher_execution_log_id INTEGER PRIMARY KEY AUTOINCREMENT, post_promotion_watcher_schedule_run_id INTEGER, build_label TEXT NOT NULL DEFAULT 'Build 181', execution_status TEXT NOT NULL DEFAULT 'queued', checked_url_count INTEGER NOT NULL DEFAULT 0, failed_url_count INTEGER NOT NULL DEFAULT 0, incident_count INTEGER NOT NULL DEFAULT 0, result_json TEXT NOT NULL DEFAULT '{}', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`
  ];
  for (const sql of statements) await db.prepare(sql).run().catch(() => null);
}
async function seedQaCounts(db, user) {
  const items = await safeAll(db, `SELECT product_qa_bulk_fix_queue_id, product_id, blocker_code, safe_apply_candidate, apply_status FROM product_qa_bulk_fix_preview_items ORDER BY created_at DESC LIMIT 1000`);
  const map = new Map();
  for (const row of items) {
    const key = lc(row.blocker_code || 'unknown') || 'unknown';
    const item = map.get(key) || { products: new Set(), preview: 0, safe: 0, manual: 0, latest: 0 };
    item.products.add(Number(row.product_id || 0)); item.preview += 1; item.latest = Math.max(item.latest, Number(row.product_qa_bulk_fix_queue_id || 0));
    if (Number(row.safe_apply_candidate || 0) === 1 || ['approved','safe','preview'].includes(lc(row.apply_status))) item.safe += 1; else item.manual += 1;
    map.set(key, item);
  }
  if (!map.size) {
    const qa = await safeAll(db, `SELECT product_id, qa_summary_json FROM product_publish_qa_results WHERE qa_status!='passed' ORDER BY created_at DESC LIMIT 200`);
    for (const row of qa) {
      let codes = [];
      try { const parsed = JSON.parse(row.qa_summary_json || row.checks_json || '{}'); codes = Object.keys(parsed?.failed || parsed?.blockers || parsed || {}).slice(0, 10); } catch {}
      if (!codes.length) codes = ['manual_review'];
      for (const code of codes) { const key = lc(code) || 'manual_review'; const item = map.get(key) || { products: new Set(), preview: 0, safe: 0, manual: 0, latest: 0 }; item.products.add(Number(row.product_id || 0)); item.preview += 1; item.manual += 1; map.set(key, item); }
    }
  }
  for (const [code, item] of map) await db.prepare(`INSERT INTO product_qa_blocker_preview_counts (blocker_code, affected_products, preview_item_count, safe_apply_candidate_count, manual_only_count, latest_queue_id, count_status, created_by_user_id, created_at, notes) VALUES (?, ?, ?, ?, ?, ?, 'prepared', ?, CURRENT_TIMESTAMP, ?)`).bind(code, item.products.size, item.preview, item.safe, item.manual, item.latest || null, Number(user.user_id || 0) || null, 'Build 181 count prepared for Catalog QA blocker badges.').run();
}
async function seedMarketplaceBadges(db, user) {
  const gates = await safeAll(db, `SELECT channel, gate_status, hard_blocker_count, warning_count, gate_notes FROM marketplace_export_download_gates ORDER BY checked_at DESC LIMIT 100`);
  const byChannel = new Map();
  for (const row of gates) if (!byChannel.has(row.channel)) byChannel.set(row.channel, row);
  if (!byChannel.size) for (const ch of ['etsy','facebook','pinterest','manual_csv']) byChannel.set(ch, { channel: ch, gate_status: 'not_checked', hard_blocker_count: 0, warning_count: 0, gate_notes: 'No gate row has been created yet.' });
  for (const row of byChannel.values()) {
    const blockers = Number(row.hard_blocker_count || 0); const status = blockers > 0 || ['blocked','blocked_pending_validation'].includes(lc(row.gate_status)) ? 'blocked' : 'ready';
    await db.prepare(`INSERT INTO marketplace_gate_badge_snapshots (channel, badge_status, hard_blocker_count, warning_count, badge_label, blocker_reason, created_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(row.channel || 'unknown', status, blockers, Number(row.warning_count || 0), status === 'ready' ? 'Ready to export' : 'Export blocked', row.gate_notes || row.notes || '', Number(user.user_id || 0) || null).run();
  }
}
async function requestMarketplaceOverride(db, user, body) {
  const channel = lc(body.channel || 'manual_csv'); const reason = normalizeText(body.reason || 'Manual temporary override requested after review.');
  const hours = Math.max(1, Math.min(Number(body.expires_hours || 24), 168));
  await db.prepare(`INSERT INTO marketplace_export_gate_overrides (channel, gate_key, override_status, reason, expires_at, created_by_user_id, created_at, updated_at) VALUES (?, ?, 'requested', ?, datetime('now', ?), ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(channel, lc(body.gate_key || 'download_gate'), reason, `+${hours} hours`, Number(user.user_id || 0) || null).run();
}
async function seedRecallUploadRequests(db, user) {
  const rowsFound = await safeAll(db, `SELECT candle_soap_batch_recall_id, batch_number, recall_status FROM candle_soap_batch_recalls WHERE recall_status NOT IN ('closed','resolved') ORDER BY updated_at DESC LIMIT 50`);
  const source = rowsFound.length ? rowsFound : await safeAll(db, `SELECT DISTINCT NULL AS candle_soap_batch_recall_id, batch_number, 'draft' AS recall_status FROM candle_soap_recall_notification_queue WHERE batch_number IS NOT NULL ORDER BY updated_at DESC LIMIT 50`);
  for (const row of source) await db.prepare(`INSERT INTO recall_evidence_upload_requests (batch_number, recall_id, requested_file_kind, upload_widget_status, r2_target_prefix, created_by_user_id, created_at, updated_at, notes) VALUES (?, ?, 'signature_evidence', 'needs_upload', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)`).bind(normalizeText(row.batch_number), row.candle_soap_batch_recall_id || null, `recall-evidence/${normalizeText(row.batch_number)}/`, Number(user.user_id || 0) || null, 'Build 181 upload request created for candle/soap recall evidence widget.').run();
}
async function exportLocalBusiness(db, user) {
  const base = await safeAll(db, `SELECT * FROM local_business_schema_settings ORDER BY updated_at DESC LIMIT 20`);
  const ext = await safeAll(db, `SELECT * FROM local_business_schema_extended_fields ORDER BY updated_at DESC LIMIT 50`);
  const payload = { generated_by: BUILD_LABEL, generated_at: new Date().toISOString(), source_rows: base, extended_fields: ext };
  await db.prepare(`INSERT INTO local_business_admin_export_runs (source_table, output_path, row_count, export_status, export_json, created_by_user_id, created_at, notes) VALUES ('local_business_schema_settings', 'data/site/local-business-schema.json', ?, 'prepared', ?, ?, CURRENT_TIMESTAMP, 'Export row prepared for safe deploy package bake script.')`).bind(base.length + ext.length, JSON.stringify(payload), Number(user.user_id || 0) || null).run();
}
async function seedWebhookVectors(db, user) {
  const items = [
    ['resend','hmac-sha256','resend-signature','Verify provider signature against raw request body, reject replayed timestamps beyond the configured window.'],
    ['sendgrid','ecdsa-sha256','x-twilio-email-event-webhook-signature','Verify SendGrid/Twilio signed event webhook using provider public key when configured.'],
    ['postmark','hmac-sha256','x-postmark-signature','Verify Postmark signature header or configured webhook token before accepting gift-card events.']
  ];
  for (const item of items) await db.prepare(`INSERT INTO provider_webhook_crypto_test_vectors (provider, algorithm, header_name, test_status, replay_window_seconds, notes, created_by_user_id, created_at) VALUES (?, ?, ?, 'documented', 300, ?, ?, CURRENT_TIMESTAMP)`).bind(...item, Number(user.user_id || 0) || null).run();
}
async function seedNotificationButtons(db, user) {
  const cards = await safeAll(db, `SELECT dashboard_notification_card_id, card_kind FROM dashboard_notification_cards ORDER BY created_at DESC LIMIT 30`);
  const source = cards.length ? cards : [{ dashboard_notification_card_id: null, card_kind: 'release_warning' }, { dashboard_notification_card_id: null, card_kind: 'recall_warning' }, { dashboard_notification_card_id: null, card_kind: 'marketplace_gate' }];
  for (const row of source) for (const action of ['snooze','dismiss']) await db.prepare(`INSERT INTO dashboard_notification_action_buttons (card_kind, source_row_id, action_kind, button_label, action_status, created_by_user_id, created_at, updated_at, notes) VALUES (?, ?, ?, ?, 'available', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'Build 181 dashboard notification action button seed.')`).bind(row.card_kind || 'warning', row.dashboard_notification_card_id || null, action, action === 'snooze' ? 'Snooze' : 'Dismiss', Number(user.user_id || 0) || null).run();
}
async function logWatcherExecution(db, user) {
  const latest = await safeFirst(db, `SELECT * FROM post_promotion_watcher_schedule_runs ORDER BY created_at DESC LIMIT 1`, [], {});
  const smoke = await safeFirst(db, `SELECT COUNT(*) AS count, SUM(CASE WHEN result_status IN ('failed','blocked') THEN 1 ELSE 0 END) AS failed FROM post_deploy_smoke_test_results`, [], { count: 0, failed: 0 });
  const incidents = await safeFirst(db, `SELECT COUNT(*) AS count FROM runtime_incidents WHERE review_status='open'`, [], { count: 0 });
  await db.prepare(`INSERT INTO post_promotion_watcher_execution_logs (post_promotion_watcher_schedule_run_id, build_label, execution_status, checked_url_count, failed_url_count, incident_count, result_json, created_by_user_id, created_at, notes) VALUES (?, ?, 'prepared', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'Prepared from current smoke-test and runtime-incident rows; live fetching still happens post-deploy.')`).bind(latest.post_promotion_watcher_schedule_run_id || null, BUILD_LABEL, Number(smoke.count || 0), Number(smoke.failed || 0), Number(incidents.count || 0), JSON.stringify({ smoke, incidents }), Number(user.user_id || 0) || null).run();
}
async function seedContentRefreshRows(db, user) {
  const phrases = [
    ['/custom-gifts-southern-ontario/','Southern Ontario custom gifts'], ['/handmade-jewelry-ontario/','handmade jewelry Ontario'], ['/polymer-clay-earrings-ontario/','polymer clay earrings Ontario'], ['/laser-engraving-ontario/','laser engraved gifts Ontario'], ['/custom-candle-making-ontario/','custom candles Southern Ontario'], ['/custom-soap-making-ontario/','custom soap gifts Ontario'], ['/workshop-made-gifts-ontario/','workshop-made gifts Southern Ontario'], ['/vintage-finds-ontario/','vintage finds Ontario']
  ];
  for (const row of phrases) await db.prepare(`INSERT INTO public_page_content_refreshes (page_path, target_phrase, placement_kind, refresh_status, created_by_user_id, created_at, notes) VALUES (?, ?, 'body_copy', 'applied_static', ?, CURRENT_TIMESTAMP, 'Build 181 public copy refresh applied without adding extra H1 headings.')`).bind(row[0], row[1], Number(user.user_id || 0) || null).run();
}
async function buildPayload(db) {
  await ensureTables(db);
  const summary = {
    qa_blocker_groups: Number((await safeFirst(db, `SELECT COUNT(*) AS count FROM product_qa_blocker_preview_counts`, [], { count: 0 })).count || 0),
    marketplace_overrides: Number((await safeFirst(db, `SELECT COUNT(*) AS count FROM marketplace_export_gate_overrides`, [], { count: 0 })).count || 0),
    recall_upload_requests: Number((await safeFirst(db, `SELECT COUNT(*) AS count FROM recall_evidence_upload_requests`, [], { count: 0 })).count || 0),
    content_refreshes: Number((await safeFirst(db, `SELECT COUNT(*) AS count FROM public_page_content_refreshes`, [], { count: 0 })).count || 0)
  };
  return {
    ok: true, build_label: BUILD_LABEL, summary,
    qa_counts: await safeAll(db, `SELECT * FROM product_qa_blocker_preview_counts ORDER BY created_at DESC LIMIT 40`),
    marketplace_badges: await safeAll(db, `SELECT * FROM marketplace_gate_badge_snapshots ORDER BY created_at DESC LIMIT 40`),
    marketplace_overrides: await safeAll(db, `SELECT * FROM marketplace_export_gate_overrides ORDER BY created_at DESC LIMIT 40`),
    recall_uploads: await safeAll(db, `SELECT * FROM recall_evidence_upload_requests ORDER BY updated_at DESC LIMIT 40`),
    lb_exports: await safeAll(db, `SELECT local_business_admin_export_run_id, row_count, export_status, output_path, created_at, notes FROM local_business_admin_export_runs ORDER BY created_at DESC LIMIT 20`),
    content_refreshes: await safeAll(db, `SELECT * FROM public_page_content_refreshes ORDER BY created_at DESC LIMIT 40`),
    webhook_vectors: await safeAll(db, `SELECT * FROM provider_webhook_crypto_test_vectors ORDER BY created_at DESC LIMIT 20`),
    manifest_filters: await safeAll(db, `SELECT * FROM manifest_drawer_saved_filters ORDER BY is_default DESC, filter_label LIMIT 20`),
    notification_buttons: await safeAll(db, `SELECT * FROM dashboard_notification_action_buttons ORDER BY created_at DESC LIMIT 30`),
    watcher_logs: await safeAll(db, `SELECT * FROM post_promotion_watcher_execution_logs ORDER BY created_at DESC LIMIT 20`),
    private_tokens: await safeAll(db, `SELECT private_evidence_download_token_id, object_key, bucket_label, expires_at, download_count, token_status, created_at, last_downloaded_at, notes FROM private_evidence_download_tokens ORDER BY created_at DESC LIMIT 20`),
    private_audit: await safeAll(db, `SELECT object_key, bucket_label, event_status, http_status, created_at, notes FROM private_evidence_download_audit_events ORDER BY created_at DESC LIMIT 20`)
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
  const body = await context.request.json().catch(() => ({})); const action = lc(body.action || 'seed_all');
  try {
    if (action === 'seed_qa_counts' || action === 'seed_all') await seedQaCounts(db, user);
    if (action === 'seed_marketplace_badges' || action === 'seed_all') await seedMarketplaceBadges(db, user);
    if (action === 'request_marketplace_override') await requestMarketplaceOverride(db, user, body);
    if (action === 'seed_recall_upload_requests' || action === 'seed_all') await seedRecallUploadRequests(db, user);
    if (action === 'export_local_business' || action === 'seed_all') await exportLocalBusiness(db, user);
    if (action === 'seed_webhook_vectors' || action === 'seed_all') await seedWebhookVectors(db, user);
    if (action === 'seed_notification_buttons' || action === 'seed_all') await seedNotificationButtons(db, user);
    if (action === 'log_watcher_execution' || action === 'seed_all') await logWatcherExecution(db, user);
    if (action === 'seed_content_refresh_rows' || action === 'seed_all') await seedContentRefreshRows(db, user);
    return json(await buildPayload(db));
  } catch (error) { return json({ ok: false, error: error?.message || 'Build 181 live ops action failed.' }, 400); }
}
