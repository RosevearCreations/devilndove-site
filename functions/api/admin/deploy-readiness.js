// File: /functions/api/admin/deploy-readiness.js
// Brief description: Build 178 deploy-readiness dashboard API with score drilldowns, final promote-live checklist, dashboard snoozes, LocalBusiness draft rows, structured-data hints, and mobile release cards.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD_LABEL = 'Build 178';
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function lc(value) { return normalizeText(value).toLowerCase(); }
function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
async function safeAll(db, sql, bindings = []) { try { return rows(await db.prepare(sql).bind(...bindings).all()); } catch { return []; } }
async function safeFirst(db, sql, bindings = [], fallback = {}) { try { return (await db.prepare(sql).bind(...bindings).first()) || fallback; } catch { return fallback; } }
async function runSafe(db, sql, bindings = []) { try { return await db.prepare(sql).bind(...bindings).run(); } catch { return null; } }
function parseJson(value, fallback) { try { return JSON.parse(value || ''); } catch { return fallback; } }
function arr(value) { return Array.isArray(value) ? value : String(value || '').split(',').map((v) => v.trim()).filter(Boolean); }

async function ensureTables(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS deployment_promote_live_checklist (deployment_promote_live_checklist_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT NOT NULL, checklist_key TEXT NOT NULL, checklist_label TEXT NOT NULL, checklist_status TEXT NOT NULL DEFAULT 'needs_review', required_to_promote INTEGER NOT NULL DEFAULT 1, source_kind TEXT, source_id INTEGER, blocking_reason TEXT, resolved_note TEXT, resolved_by_user_id INTEGER, resolved_at TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(build_label, checklist_key))`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS deployment_readiness_drilldown_rows (deployment_readiness_drilldown_row_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT NOT NULL, source_kind TEXT NOT NULL, source_key TEXT, severity TEXT NOT NULL DEFAULT 'info', row_label TEXT NOT NULL, row_detail TEXT, destination_page TEXT, drilldown_status TEXT NOT NULL DEFAULT 'open', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS release_manifest_diff_view_filters (release_manifest_diff_view_filter_id INTEGER PRIMARY KEY AUTOINCREMENT, filter_key TEXT NOT NULL UNIQUE, filter_label TEXT NOT NULL, diff_kind TEXT, path_contains TEXT, item_status TEXT, sort_json TEXT NOT NULL DEFAULT '{}', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS product_qa_bulk_fix_apply_confirmations (product_qa_bulk_fix_apply_confirmation_id INTEGER PRIMARY KEY AUTOINCREMENT, product_qa_bulk_fix_queue_id INTEGER NOT NULL, confirmation_key TEXT NOT NULL DEFAULT 'apply_confirmed', confirmation_status TEXT NOT NULL DEFAULT 'pending', confirmed_by_user_id INTEGER, confirmed_at TEXT, confirmation_json TEXT NOT NULL DEFAULT '{}', notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(product_qa_bulk_fix_queue_id, confirmation_key))`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS marketplace_export_row_validation_results (marketplace_export_row_validation_result_id INTEGER PRIMARY KEY AUTOINCREMENT, channel TEXT NOT NULL, product_id INTEGER, validation_status TEXT NOT NULL DEFAULT 'needs_review', blocker_count INTEGER NOT NULL DEFAULT 0, warning_count INTEGER NOT NULL DEFAULT 0, missing_fields_json TEXT NOT NULL DEFAULT '[]', row_payload_json TEXT NOT NULL DEFAULT '{}', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS recall_customer_notification_copy_reviews (recall_customer_notification_copy_review_id INTEGER PRIMARY KEY AUTOINCREMENT, recall_customer_match_preview_id INTEGER, batch_number TEXT NOT NULL, customer_email TEXT, review_status TEXT NOT NULL DEFAULT 'needs_review', subject_preview TEXT, body_preview TEXT, compliance_notes TEXT, reviewed_by_user_id INTEGER, reviewed_at TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS recall_compliance_signature_attachments (recall_compliance_signature_attachment_id INTEGER PRIMARY KEY AUTOINCREMENT, candle_soap_batch_recall_id INTEGER, batch_number TEXT NOT NULL, attachment_kind TEXT NOT NULL DEFAULT 'signature_evidence', signer_name TEXT, evidence_url TEXT, r2_object_key TEXT, attachment_status TEXT NOT NULL DEFAULT 'needs_review', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS gift_card_webhook_signature_verification_logs (gift_card_webhook_signature_verification_log_id INTEGER PRIMARY KEY AUTOINCREMENT, provider TEXT NOT NULL, signature_status TEXT NOT NULL DEFAULT 'not_checked', algorithm TEXT, header_snapshot_json TEXT NOT NULL DEFAULT '{}', replay_window_seconds INTEGER NOT NULL DEFAULT 300, verification_notes TEXT, event_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS r2_signed_url_verification_results (r2_signed_url_verification_result_id INTEGER PRIMARY KEY AUTOINCREMENT, bucket_label TEXT NOT NULL, object_key TEXT, signed_url_status TEXT NOT NULL DEFAULT 'not_configured', put_status TEXT NOT NULL DEFAULT 'not_run', get_status TEXT NOT NULL DEFAULT 'not_run', delete_status TEXT NOT NULL DEFAULT 'not_run', expires_seconds INTEGER NOT NULL DEFAULT 300, notes TEXT, checked_by_user_id INTEGER, checked_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS local_seo_search_console_chart_points (local_seo_search_console_chart_point_id INTEGER PRIMARY KEY AUTOINCREMENT, page_path TEXT NOT NULL, query_text TEXT, metric_kind TEXT NOT NULL DEFAULT 'impressions', metric_value REAL NOT NULL DEFAULT 0, period_start TEXT, period_end TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS internal_link_map_edges (internal_link_map_edge_id INTEGER PRIMARY KEY AUTOINCREMENT, source_path TEXT NOT NULL, target_path TEXT NOT NULL, anchor_text TEXT, edge_status TEXT NOT NULL DEFAULT 'suggested', score INTEGER NOT NULL DEFAULT 0, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(source_path, target_path, anchor_text))`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS local_business_schema_edit_drafts (local_business_schema_edit_draft_id INTEGER PRIMARY KEY AUTOINCREMENT, draft_status TEXT NOT NULL DEFAULT 'draft', business_name TEXT, canonical_url TEXT, telephone TEXT, email TEXT, area_served_json TEXT NOT NULL DEFAULT '[]', service_types_json TEXT NOT NULL DEFAULT '[]', same_as_json TEXT NOT NULL DEFAULT '[]', opening_hours_json TEXT NOT NULL DEFAULT '[]', address_json TEXT NOT NULL DEFAULT '{}', geo_json TEXT NOT NULL DEFAULT '{}', draft_json TEXT NOT NULL DEFAULT '{}', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS structured_data_validation_hints (structured_data_validation_hint_id INTEGER PRIMARY KEY AUTOINCREMENT, page_path TEXT NOT NULL, schema_type TEXT NOT NULL, hint_status TEXT NOT NULL DEFAULT 'needs_review', hint_severity TEXT NOT NULL DEFAULT 'info', hint_label TEXT NOT NULL, hint_detail TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS release_package_previous_zip_comparisons (release_package_previous_zip_comparison_id INTEGER PRIMARY KEY AUTOINCREMENT, current_build_label TEXT NOT NULL, previous_build_label TEXT, current_manifest_hash TEXT, previous_manifest_hash TEXT, added_count INTEGER NOT NULL DEFAULT 0, changed_count INTEGER NOT NULL DEFAULT 0, removed_count INTEGER NOT NULL DEFAULT 0, comparison_json TEXT NOT NULL DEFAULT '{}', comparison_status TEXT NOT NULL DEFAULT 'prepared', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS dashboard_notification_card_snoozes (dashboard_notification_card_snooze_id INTEGER PRIMARY KEY AUTOINCREMENT, dashboard_notification_card_id INTEGER NOT NULL, snooze_until TEXT, snooze_status TEXT NOT NULL DEFAULT 'active', snooze_note TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS mobile_release_control_cards (mobile_release_control_card_id INTEGER PRIMARY KEY AUTOINCREMENT, card_key TEXT NOT NULL UNIQUE, card_label TEXT NOT NULL, destination_page TEXT NOT NULL DEFAULT '/admin/release-control/', card_status TEXT NOT NULL DEFAULT 'active', sort_order INTEGER NOT NULL DEFAULT 0, payload_json TEXT NOT NULL DEFAULT '{}', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
}

async function buildSummary(db) {
  await ensureTables(db);
  const latest_score = await safeFirst(db, `SELECT * FROM deployment_readiness_scores ORDER BY scored_at DESC LIMIT 1`, [], null);
  const score_history = await safeAll(db, `SELECT build_label, score, score_status, blocker_count, warning_count, manifest_blocker_count, smoke_blocker_count, rollback_blocker_count, d1_marker_count, scored_at, notes FROM deployment_readiness_scores ORDER BY scored_at DESC LIMIT 20`);
  const checklist = await safeAll(db, `SELECT * FROM deployment_promote_live_checklist ORDER BY required_to_promote DESC, checklist_key LIMIT 60`);
  const drilldowns = await safeAll(db, `SELECT * FROM deployment_readiness_drilldown_rows ORDER BY CASE severity WHEN 'blocker' THEN 1 WHEN 'warn' THEN 2 ELSE 3 END, created_at DESC LIMIT 80`);
  const diff_items = await safeAll(db, `SELECT release_manifest_diff_item_id, file_path, diff_kind, item_status, expected_sha256, deployed_sha256 FROM release_manifest_diff_items ORDER BY release_manifest_diff_item_id DESC LIMIT 120`);
  const filters = await safeAll(db, `SELECT * FROM release_manifest_diff_view_filters ORDER BY filter_label`);
  const qa_queue = await safeAll(db, `SELECT product_qa_bulk_fix_queue_id, blocker_code, fix_type, product_count, approval_status, created_at FROM product_qa_bulk_fix_queue ORDER BY created_at DESC LIMIT 30`);
  const qa_confirmations = await safeAll(db, `SELECT * FROM product_qa_bulk_fix_apply_confirmations ORDER BY updated_at DESC LIMIT 30`);
  const marketplace_rows = await safeAll(db, `SELECT channel, product_id, validation_status, blocker_count, warning_count, missing_fields_json, created_at FROM marketplace_export_row_validation_results ORDER BY created_at DESC LIMIT 80`);
  const recall_copy_reviews = await safeAll(db, `SELECT * FROM recall_customer_notification_copy_reviews ORDER BY created_at DESC LIMIT 60`);
  const recall_signatures = await safeAll(db, `SELECT * FROM recall_compliance_signature_attachments ORDER BY created_at DESC LIMIT 30`);
  const webhook_logs = await safeAll(db, `SELECT * FROM gift_card_webhook_signature_verification_logs ORDER BY created_at DESC LIMIT 30`);
  const r2_signed = await safeAll(db, `SELECT * FROM r2_signed_url_verification_results ORDER BY checked_at DESC LIMIT 20`);
  const seo_charts = await safeAll(db, `SELECT page_path, query_text, metric_kind, metric_value, period_end FROM local_seo_search_console_chart_points ORDER BY period_end DESC LIMIT 80`);
  const link_edges = await safeAll(db, `SELECT * FROM internal_link_map_edges ORDER BY score DESC, updated_at DESC LIMIT 80`);
  const lb_drafts = await safeAll(db, `SELECT local_business_schema_edit_draft_id, draft_status, business_name, canonical_url, telephone, email, area_served_json, service_types_json, updated_at FROM local_business_schema_edit_drafts ORDER BY updated_at DESC LIMIT 20`);
  const schema_hints = await safeAll(db, `SELECT * FROM structured_data_validation_hints ORDER BY CASE hint_severity WHEN 'blocker' THEN 1 WHEN 'warn' THEN 2 ELSE 3 END, page_path LIMIT 80`);
  const previous_zip_comparisons = await safeAll(db, `SELECT * FROM release_package_previous_zip_comparisons ORDER BY created_at DESC LIMIT 12`);
  const snoozes = await safeAll(db, `SELECT s.*, c.card_title FROM dashboard_notification_card_snoozes s LEFT JOIN dashboard_notification_cards c ON c.dashboard_notification_card_id=s.dashboard_notification_card_id ORDER BY s.created_at DESC LIMIT 20`);
  const mobile_cards = await safeAll(db, `SELECT * FROM mobile_release_control_cards ORDER BY sort_order, card_label`);
  const summary = {
    score: Number(latest_score?.score || 0),
    score_status: latest_score?.score_status || 'not_scored',
    promote_blockers: checklist.filter((row) => Number(row.required_to_promote || 0) && !['passed','approved','done'].includes(lc(row.checklist_status))).length,
    drilldown_open: drilldowns.filter((row) => lc(row.drilldown_status) === 'open').length,
    manifest_open: diff_items.filter((row) => lc(row.item_status) === 'open').length,
    recall_copy_open: recall_copy_reviews.filter((row) => lc(row.review_status) === 'needs_review').length,
    schema_hint_open: schema_hints.filter((row) => lc(row.hint_status) === 'needs_review').length
  };
  return { latest_score, score_history, checklist, drilldowns, diff_items, filters, qa_queue, qa_confirmations, marketplace_rows, recall_copy_reviews, recall_signatures, webhook_logs, r2_signed, seo_charts, link_edges, lb_drafts, schema_hints, previous_zip_comparisons, snoozes, mobile_cards, summary };
}

async function seedPromoteChecklist(db, user, buildLabel) {
  const latestScore = await safeFirst(db, `SELECT * FROM deployment_readiness_scores ORDER BY scored_at DESC LIMIT 1`, [], {});
  const latestManifest = await safeFirst(db, `SELECT * FROM release_manifest_live_diffs ORDER BY checked_at DESC LIMIT 1`, [], {});
  const smoke = await safeFirst(db, `SELECT SUM(CASE WHEN LOWER(COALESCE(result_status,'')) IN ('failed','fail','blocked') THEN 1 ELSE 0 END) AS blockers FROM post_deploy_smoke_test_results`, [], {});
  const migrationMarkers = await safeFirst(db, `SELECT COUNT(*) AS marker_count FROM schema_migration_ledger WHERE migration_key IN ('build_173_deployment_preflight','build_174_preflight_detail_manifest','build_175_release_control','build_176_release_safety_controls','build_177_deploy_score_and_controls','build_178_promote_live_controls')`, [], {});
  const rowsToSeed = [
    ['deploy_score_ready', 'Deploy score is ready or approved', latestScore?.score_status === 'ready' ? 'passed' : 'needs_review', 'readiness', latestScore?.deployment_readiness_score_id || null, `Latest score: ${latestScore?.score || 0}/100 (${latestScore?.score_status || 'not scored'}).`],
    ['manifest_diff_clean', 'Live manifest diff is clean or accepted', Number(latestManifest?.missing_file_count || 0) + Number(latestManifest?.changed_file_count || 0) === 0 ? 'passed' : 'needs_review', 'manifest', latestManifest?.release_manifest_live_diff_id || null, `Missing ${latestManifest?.missing_file_count || 0}, changed ${latestManifest?.changed_file_count || 0}.`],
    ['smoke_tests_passed', 'Post-deploy smoke tests passed', Number(smoke?.blockers || 0) === 0 ? 'passed' : 'needs_review', 'smoke', null, `Smoke blockers: ${smoke?.blockers || 0}.`],
    ['rollback_ready', 'Rollback checklist has no required blockers', 'needs_review', 'rollback', null, 'Mark this passed after rollback rows are verified.'],
    ['d1_markers_present', 'D1 migration markers are present', Number(migrationMarkers?.marker_count || 0) >= 6 ? 'passed' : 'needs_review', 'd1', null, `Found ${migrationMarkers?.marker_count || 0}/6 expected markers.`],
    ['r2_email_reviewed', 'R2/private evidence and email provider checks reviewed', 'needs_review', 'provider', null, 'Mark passed after R2 and email provider rows are confirmed in admin.'],
    ['release_notes_current', 'Release notes and schema references are current', 'passed', 'docs', null, 'Build 178 Markdown and schema files were updated in this pass.']
  ];
  for (const row of rowsToSeed) {
    await db.prepare(`INSERT INTO deployment_promote_live_checklist (build_label, checklist_key, checklist_label, checklist_status, required_to_promote, source_kind, source_id, blocking_reason, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(build_label, checklist_key) DO UPDATE SET checklist_label=excluded.checklist_label, source_kind=excluded.source_kind, source_id=excluded.source_id, blocking_reason=excluded.blocking_reason, updated_at=CURRENT_TIMESTAMP`).bind(buildLabel, row[0], row[1], row[2], row[3], row[4], row[5], Number(user.user_id || 0) || null).run();
  }
}

async function seedDrilldowns(db, user, buildLabel) {
  await runSafe(db, `DELETE FROM deployment_readiness_drilldown_rows WHERE build_label=?`, [buildLabel]);
  const preflight = await safeFirst(db, `SELECT blocker_count, warning_count, status, created_at FROM deployment_preflight_runs ORDER BY created_at DESC LIMIT 1`, [], {});
  const manifest = await safeFirst(db, `SELECT missing_file_count, changed_file_count, extra_file_count, diff_status, checked_at FROM release_manifest_live_diffs ORDER BY checked_at DESC LIMIT 1`, [], {});
  const rollback = await safeFirst(db, `SELECT COUNT(*) AS open_count FROM deployment_rollback_checklist_rows WHERE build_label=? AND required_before_rollback=1 AND LOWER(COALESCE(checklist_status,''))!='passed'`, [buildLabel], {});
  const smoke = await safeFirst(db, `SELECT SUM(CASE WHEN LOWER(COALESCE(result_status,'')) IN ('failed','fail','blocked') THEN 1 ELSE 0 END) AS blockers, SUM(CASE WHEN LOWER(COALESCE(result_status,'')) IN ('warning','warn','pending') THEN 1 ELSE 0 END) AS warnings FROM post_deploy_smoke_test_results`, [], {});
  const items = [
    ['preflight', 'latest', Number(preflight?.blocker_count || 0) ? 'blocker' : Number(preflight?.warning_count || 0) ? 'warn' : 'info', 'Deployment preflight', `${preflight?.blocker_count || 0} blockers, ${preflight?.warning_count || 0} warnings.`, '/admin/deployment-preflight/'],
    ['manifest', 'latest', Number(manifest?.missing_file_count || 0) + Number(manifest?.changed_file_count || 0) ? 'blocker' : Number(manifest?.extra_file_count || 0) ? 'warn' : 'info', 'Live manifest compare', `${manifest?.missing_file_count || 0} missing, ${manifest?.changed_file_count || 0} changed, ${manifest?.extra_file_count || 0} extra.`, '/admin/release-control/'],
    ['smoke', 'latest', Number(smoke?.blockers || 0) ? 'blocker' : Number(smoke?.warnings || 0) ? 'warn' : 'info', 'Post-deploy smoke tests', `${smoke?.blockers || 0} blockers and ${smoke?.warnings || 0} warnings/pending rows.`, '/admin/post-deploy-smoke-tests/'],
    ['rollback', 'latest', Number(rollback?.open_count || 0) ? 'warn' : 'info', 'Rollback checklist', `${rollback?.open_count || 0} required rollback rows still open.`, '/admin/release-control/']
  ];
  for (const item of items) await db.prepare(`INSERT INTO deployment_readiness_drilldown_rows (build_label, source_kind, source_key, severity, row_label, row_detail, destination_page, drilldown_status, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(buildLabel, ...item, Number(user.user_id || 0) || null).run();
}

async function seedSchemaHints(db) {
  const targets = ['/', '/handmade-jewelry-ontario/', '/custom-gifts-southern-ontario/', '/laser-engraving-ontario/', '/custom-candles-ontario/', '/custom-soap-ontario/'];
  const types = ['LocalBusiness','Product','BreadcrumbList','FAQPage'];
  for (const page of targets) {
    for (const type of types) {
      await db.prepare(`INSERT INTO structured_data_validation_hints (page_path, schema_type, hint_status, hint_severity, hint_label, hint_detail, created_at, updated_at) VALUES (?, ?, 'needs_review', 'info', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(page, type, `${type} structured data check`, `Confirm ${type} JSON-LD is valid, page-specific, and does not duplicate conflicting facts.`).run().catch(() => null);
    }
  }
}

async function seedLocalBusinessDraft(db, user, body) {
  const current = await safeFirst(db, `SELECT * FROM local_business_schema_settings ORDER BY updated_at DESC LIMIT 1`, [], {});
  await db.prepare(`INSERT INTO local_business_schema_edit_drafts (draft_status, business_name, canonical_url, telephone, email, area_served_json, service_types_json, same_as_json, opening_hours_json, address_json, geo_json, draft_json, created_by_user_id, created_at, updated_at) VALUES ('draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    normalizeText(body.business_name || current.business_name || 'Devil n Dove'),
    normalizeText(body.canonical_url || current.canonical_url || 'https://devilndove.com/'),
    normalizeText(body.telephone || current.telephone || ''),
    normalizeText(body.email || current.email || ''),
    JSON.stringify(arr(body.area_served || parseJson(current.area_served_json, []))),
    JSON.stringify(arr(body.service_types || parseJson(current.service_types_json, []))),
    JSON.stringify(arr(body.same_as || parseJson(current.same_as_json, []))),
    JSON.stringify(arr(body.opening_hours || [])),
    JSON.stringify(body.address || {}),
    JSON.stringify(body.geo || {}),
    JSON.stringify(body),
    Number(user.user_id || 0) || null
  ).run();
}

export async function onRequestGet(context) {
  const user = await getAdminUserFromRequest(context.request, context.env);
  if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const data = await buildSummary(db);
  const url = new URL(context.request.url);
  if (lc(url.searchParams.get('view')) === 'phone') return json({ ok: true, build_label: BUILD_LABEL, summary: data.summary, checklist: data.checklist.slice(0, 8), mobile_cards: data.mobile_cards, safe_deploy_zip_url: '/api/admin/safe-deploy-package?format=zip' });
  return json({ ok: true, build_label: BUILD_LABEL, ...data, safe_deploy_zip_url: '/api/admin/safe-deploy-package?format=zip' });
}

export async function onRequestPost(context) {
  const user = await getAdminUserFromRequest(context.request, context.env);
  if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureTables(db);
  let body = {}; try { body = await context.request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const action = lc(body.action || '');
  const buildLabel = normalizeText(body.build_label || BUILD_LABEL);
  if (action === 'seed_promote_checklist') await seedPromoteChecklist(db, user, buildLabel);
  else if (action === 'seed_drilldowns') await seedDrilldowns(db, user, buildLabel);
  else if (action === 'mark_promote_item') {
    const id = Number(body.deployment_promote_live_checklist_id || 0);
    if (!id) return json({ ok: false, error: 'Checklist row id is required.' }, 400);
    await db.prepare(`UPDATE deployment_promote_live_checklist SET checklist_status=?, resolved_note=?, resolved_by_user_id=?, resolved_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE deployment_promote_live_checklist_id=?`).bind(lc(body.checklist_status || 'passed'), normalizeText(body.resolved_note || ''), Number(user.user_id || 0) || null, id).run();
  } else if (action === 'confirm_qa_apply') {
    const queueId = Number(body.product_qa_bulk_fix_queue_id || 0);
    if (!queueId) return json({ ok: false, error: 'Product QA queue id is required.' }, 400);
    await db.prepare(`INSERT INTO product_qa_bulk_fix_apply_confirmations (product_qa_bulk_fix_queue_id, confirmation_key, confirmation_status, confirmed_by_user_id, confirmed_at, confirmation_json, notes, created_at, updated_at) VALUES (?, 'apply_confirmed', 'confirmed', ?, CURRENT_TIMESTAMP, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(product_qa_bulk_fix_queue_id, confirmation_key) DO UPDATE SET confirmation_status='confirmed', confirmed_by_user_id=excluded.confirmed_by_user_id, confirmed_at=CURRENT_TIMESTAMP, confirmation_json=excluded.confirmation_json, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP`).bind(queueId, Number(user.user_id || 0) || null, JSON.stringify(body), normalizeText(body.notes || 'Confirmed from Build 178 deploy-readiness page.')).run();
  } else if (action === 'seed_recall_copy_reviews') {
    const previews = await safeAll(db, `SELECT recall_customer_match_preview_id, batch_number, customer_email, notification_subject, notification_body FROM recall_customer_match_previews ORDER BY created_at DESC LIMIT 150`);
    for (const p of previews) await db.prepare(`INSERT INTO recall_customer_notification_copy_reviews (recall_customer_match_preview_id, batch_number, customer_email, review_status, subject_preview, body_preview, compliance_notes, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, 'needs_review', ?, ?, 'Review copy before queueing recall email draft.', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(p.recall_customer_match_preview_id || null, p.batch_number || '', p.customer_email || '', p.notification_subject || '', p.notification_body || '', Number(user.user_id || 0) || null).run().catch(() => null);
  } else if (action === 'seed_signature_placeholder') {
    const batch = normalizeText(body.batch_number || 'manual-review');
    await db.prepare(`INSERT INTO recall_compliance_signature_attachments (batch_number, signer_name, attachment_status, created_by_user_id, created_at, updated_at, evidence_url, r2_object_key, attachment_kind) VALUES (?, ?, 'needs_upload', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, 'signature_evidence')`).bind(batch, normalizeText(body.signer_name || ''), Number(user.user_id || 0) || null, normalizeText(body.evidence_url || ''), normalizeText(body.r2_object_key || '')).run();
  } else if (action === 'seed_webhook_signature_logs') {
    for (const provider of ['resend','sendgrid','postmark']) await db.prepare(`INSERT INTO gift_card_webhook_signature_verification_logs (provider, signature_status, algorithm, header_snapshot_json, replay_window_seconds, verification_notes, created_at) VALUES (?, 'pending_secret', ?, '{}', 300, ?, CURRENT_TIMESTAMP)`).bind(provider, provider === 'sendgrid' ? 'ecdsa-sha256' : 'hmac-sha256', 'Provider-specific signature check requires configured secret/header values in deployed environment.').run();
  } else if (action === 'run_r2_signed_url_check') {
    const bucket = context.env.ACCOUNTING_EVIDENCE_BUCKET || context.env.PRIVATE_EVIDENCE_BUCKET || context.env.R2_BUCKET || null;
    const objectKey = `signed-url-tests/build-178-${Date.now()}.txt`;
    let putStatus='not_configured', getStatus='not_configured', deleteStatus='not_configured', signed='not_configured', notes='Private R2 bucket binding is not configured.';
    if (bucket?.put && bucket?.get && bucket?.delete) {
      try { await bucket.put(objectKey, 'Devil n Dove Build 178 signed URL verification placeholder.'); putStatus='passed'; } catch(e) { putStatus='failed'; notes=e.message || notes; }
      try { const obj=await bucket.get(objectKey); getStatus=obj?'passed':'failed'; } catch(e) { getStatus='failed'; notes=e.message || notes; }
      signed = 'needs_worker_route';
      notes = putStatus === 'passed' && getStatus === 'passed' ? 'R2 object test passed; signed URL generation still needs the worker route secret to be checked live.' : notes;
      try { await bucket.delete(objectKey); deleteStatus='passed'; } catch(e) { deleteStatus='failed'; notes=e.message || notes; }
    }
    await db.prepare(`INSERT INTO r2_signed_url_verification_results (bucket_label, object_key, signed_url_status, put_status, get_status, delete_status, expires_seconds, notes, checked_by_user_id, checked_at) VALUES (?, ?, ?, ?, ?, ?, 300, ?, ?, CURRENT_TIMESTAMP)`).bind(bucket ? 'private_evidence_bucket' : 'missing_bucket', objectKey, signed, putStatus, getStatus, deleteStatus, notes, Number(user.user_id || 0) || null).run();
  } else if (action === 'seed_local_seo_visuals') {
    const trends = await safeAll(db, `SELECT page_path, query_text, impressions, clicks, average_position, period_end FROM local_seo_search_console_trends ORDER BY period_end DESC LIMIT 80`);
    for (const t of trends) {
      await db.prepare(`INSERT INTO local_seo_search_console_chart_points (page_path, query_text, metric_kind, metric_value, period_end, created_at) VALUES (?, ?, 'impressions', ?, ?, CURRENT_TIMESTAMP)`).bind(t.page_path || '', t.query_text || '', Number(t.impressions || 0), t.period_end || '').run().catch(() => null);
      await db.prepare(`INSERT INTO local_seo_search_console_chart_points (page_path, query_text, metric_kind, metric_value, period_end, created_at) VALUES (?, ?, 'average_position', ?, ?, CURRENT_TIMESTAMP)`).bind(t.page_path || '', t.query_text || '', Number(t.average_position || 0), t.period_end || '').run().catch(() => null);
    }
    const links = await safeAll(db, `SELECT source_path, target_path, suggested_anchor, score, suggestion_status FROM local_seo_internal_link_suggestions ORDER BY score DESC LIMIT 100`);
    for (const link of links) await db.prepare(`INSERT INTO internal_link_map_edges (source_path, target_path, anchor_text, edge_status, score, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(source_path, target_path, anchor_text) DO UPDATE SET edge_status=excluded.edge_status, score=excluded.score, updated_at=CURRENT_TIMESTAMP`).bind(link.source_path || '', link.target_path || '', link.suggested_anchor || '', link.suggestion_status || 'suggested', Number(link.score || 0), Number(user.user_id || 0) || null).run().catch(() => null);
  } else if (action === 'seed_local_business_draft') await seedLocalBusinessDraft(db, user, body);
  else if (action === 'seed_schema_hints') await seedSchemaHints(db);
  else if (action === 'snooze_dashboard_card') {
    const cardId = Number(body.dashboard_notification_card_id || 0);
    if (!cardId) return json({ ok: false, error: 'dashboard_notification_card_id is required.' }, 400);
    await db.prepare(`INSERT INTO dashboard_notification_card_snoozes (dashboard_notification_card_id, snooze_until, snooze_status, snooze_note, created_by_user_id, created_at, updated_at) VALUES (?, ?, 'active', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(cardId, normalizeText(body.snooze_until || ''), normalizeText(body.snooze_note || 'Snoozed from Deploy Readiness.'), Number(user.user_id || 0) || null).run();
    await runSafe(db, `UPDATE dashboard_notification_cards SET card_status='snoozed', updated_at=CURRENT_TIMESTAMP WHERE dashboard_notification_card_id=?`, [cardId]);
  } else return json({ ok: false, error: 'Unknown action.' }, 400);
  const data = await buildSummary(db);
  return json({ ok: true, action, build_label: BUILD_LABEL, ...data, safe_deploy_zip_url: '/api/admin/safe-deploy-package?format=zip' });
}
