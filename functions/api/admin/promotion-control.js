// File: /functions/api/admin/promotion-control.js
// Brief description: Build 179 final promotion-control API for QA safe applies, LocalBusiness baking approvals, webhook/R2 verification rows, recall gates, marketplace gates, release matching, and post-promotion incident watching.

import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD_LABEL = 'Build 179';
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function lc(value) { return normalizeText(value).toLowerCase(); }
function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
async function safeAll(db, sql, bindings = []) { try { return rows(await db.prepare(sql).bind(...bindings).all()); } catch { return []; } }
async function safeFirst(db, sql, bindings = [], fallback = {}) { try { return (await db.prepare(sql).bind(...bindings).first()) || fallback; } catch { return fallback; } }
async function runSafe(db, sql, bindings = []) { try { return await db.prepare(sql).bind(...bindings).run(); } catch { return null; } }
function parseJson(value, fallback) { try { return JSON.parse(value || ''); } catch { return fallback; } }
function toArray(value, fallback = []) { if (Array.isArray(value)) return value; const bits = String(value || '').split(',').map((v) => v.trim()).filter(Boolean); return bits.length ? bits : fallback; }

async function ensureTables(db) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS product_qa_safe_apply_rules (product_qa_safe_apply_rule_id INTEGER PRIMARY KEY AUTOINCREMENT, blocker_code TEXT NOT NULL UNIQUE, apply_field TEXT NOT NULL, rule_status TEXT NOT NULL DEFAULT 'approval_required', requires_confirmation INTEGER NOT NULL DEFAULT 1, max_rows_per_run INTEGER NOT NULL DEFAULT 25, safety_notes TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS local_seo_visual_chart_configs (local_seo_visual_chart_config_id INTEGER PRIMARY KEY AUTOINCREMENT, page_path TEXT NOT NULL, chart_key TEXT NOT NULL, chart_label TEXT NOT NULL, metric_kind TEXT NOT NULL DEFAULT 'impressions', period_label TEXT, chart_status TEXT NOT NULL DEFAULT 'active', config_json TEXT NOT NULL DEFAULT '{}', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(page_path, chart_key))`,
    `CREATE TABLE IF NOT EXISTS internal_link_graph_snapshots (internal_link_graph_snapshot_id INTEGER PRIMARY KEY AUTOINCREMENT, snapshot_label TEXT NOT NULL, node_count INTEGER NOT NULL DEFAULT 0, edge_count INTEGER NOT NULL DEFAULT 0, missing_link_count INTEGER NOT NULL DEFAULT 0, graph_json TEXT NOT NULL DEFAULT '{}', snapshot_status TEXT NOT NULL DEFAULT 'prepared', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS local_business_schema_bake_approvals (local_business_schema_bake_approval_id INTEGER PRIMARY KEY AUTOINCREMENT, local_business_schema_edit_draft_id INTEGER, approval_status TEXT NOT NULL DEFAULT 'needs_review', output_path TEXT NOT NULL DEFAULT 'data/site/local-business-schema.json', target_paths_json TEXT NOT NULL DEFAULT '[]', schema_json TEXT NOT NULL DEFAULT '{}', approved_by_user_id INTEGER, approved_at TEXT, bake_notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS provider_webhook_signature_secret_checks (provider_webhook_signature_secret_check_id INTEGER PRIMARY KEY AUTOINCREMENT, provider TEXT NOT NULL, expected_secret_binding TEXT, signature_header_name TEXT, timestamp_header_name TEXT, secret_present INTEGER NOT NULL DEFAULT 0, signature_header_present INTEGER NOT NULL DEFAULT 0, timestamp_header_present INTEGER NOT NULL DEFAULT 0, verification_status TEXT NOT NULL DEFAULT 'not_checked', verification_notes TEXT, checked_by_user_id INTEGER, checked_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS r2_signed_url_expiry_tests (r2_signed_url_expiry_test_id INTEGER PRIMARY KEY AUTOINCREMENT, bucket_label TEXT NOT NULL, object_key TEXT, create_status TEXT NOT NULL DEFAULT 'not_run', signed_url_status TEXT NOT NULL DEFAULT 'not_run', expiry_status TEXT NOT NULL DEFAULT 'not_run', expires_seconds INTEGER NOT NULL DEFAULT 60, checked_by_user_id INTEGER, checked_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS recall_signature_evidence_uploads (recall_signature_evidence_upload_id INTEGER PRIMARY KEY AUTOINCREMENT, batch_number TEXT NOT NULL, recall_id INTEGER, original_filename TEXT, mime_type TEXT, file_size_bytes INTEGER NOT NULL DEFAULT 0, evidence_url TEXT, r2_object_key TEXT, upload_status TEXT NOT NULL DEFAULT 'metadata_only', uploaded_by_user_id INTEGER, uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS recall_notification_release_gates (recall_notification_release_gate_id INTEGER PRIMARY KEY AUTOINCREMENT, batch_number TEXT NOT NULL, recall_id INTEGER, copy_review_status TEXT NOT NULL DEFAULT 'needs_review', signature_status TEXT NOT NULL DEFAULT 'needs_review', customer_match_status TEXT NOT NULL DEFAULT 'needs_review', release_status TEXT NOT NULL DEFAULT 'blocked', gate_notes TEXT, checked_by_user_id INTEGER, checked_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(batch_number, recall_id))`,
    `CREATE TABLE IF NOT EXISTS accounting_zip_export_links (accounting_zip_export_link_id INTEGER PRIMARY KEY AUTOINCREMENT, period_month TEXT, accountant_export_id INTEGER, safe_deploy_package_download_id INTEGER, zip_sha256 TEXT, total_bytes INTEGER NOT NULL DEFAULT 0, evidence_file_count INTEGER NOT NULL DEFAULT 0, link_status TEXT NOT NULL DEFAULT 'prepared', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS previous_zip_manifest_imports (previous_zip_manifest_import_id INTEGER PRIMARY KEY AUTOINCREMENT, previous_build_label TEXT, current_build_label TEXT NOT NULL, previous_manifest_json TEXT NOT NULL DEFAULT '{}', current_manifest_json TEXT NOT NULL DEFAULT '{}', added_count INTEGER NOT NULL DEFAULT 0, changed_count INTEGER NOT NULL DEFAULT 0, removed_count INTEGER NOT NULL DEFAULT 0, import_status TEXT NOT NULL DEFAULT 'prepared', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS dashboard_notification_card_actions (dashboard_notification_card_action_id INTEGER PRIMARY KEY AUTOINCREMENT, dashboard_notification_card_id INTEGER NOT NULL, action_kind TEXT NOT NULL DEFAULT 'snooze', action_status TEXT NOT NULL DEFAULT 'active', snooze_until TEXT, action_note TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS mobile_release_control_render_preferences (mobile_release_control_render_preference_id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, preference_key TEXT NOT NULL DEFAULT 'mobile_release_cards', compact_mode INTEGER NOT NULL DEFAULT 1, large_tap_targets INTEGER NOT NULL DEFAULT 1, visible_cards_json TEXT NOT NULL DEFAULT '[]', updated_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, preference_key))`,
    `CREATE TABLE IF NOT EXISTS structured_data_page_previews (structured_data_page_preview_id INTEGER PRIMARY KEY AUTOINCREMENT, page_path TEXT NOT NULL, schema_type TEXT NOT NULL, preview_status TEXT NOT NULL DEFAULT 'needs_review', jsonld_excerpt TEXT, issue_count INTEGER NOT NULL DEFAULT 0, validation_notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(page_path, schema_type))`,
    `CREATE TABLE IF NOT EXISTS marketplace_export_download_gates (marketplace_export_download_gate_id INTEGER PRIMARY KEY AUTOINCREMENT, channel TEXT NOT NULL, export_history_id INTEGER, validation_run_id INTEGER, gate_status TEXT NOT NULL DEFAULT 'blocked_pending_validation', hard_blocker_count INTEGER NOT NULL DEFAULT 0, manual_override_required INTEGER NOT NULL DEFAULT 0, override_by_user_id INTEGER, override_at TEXT, gate_notes TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP, UNIQUE(channel, export_history_id))`,
    `CREATE TABLE IF NOT EXISTS release_rollback_row_actions (release_rollback_row_action_id INTEGER PRIMARY KEY AUTOINCREMENT, deployment_rollback_checklist_row_id INTEGER NOT NULL, action_status TEXT NOT NULL DEFAULT 'not_checked', action_note TEXT, acted_by_user_id INTEGER, acted_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS release_manifest_path_filter_runs (release_manifest_path_filter_run_id INTEGER PRIMARY KEY AUTOINCREMENT, filter_key TEXT NOT NULL, diff_kind TEXT, path_contains TEXT, matched_count INTEGER NOT NULL DEFAULT 0, run_status TEXT NOT NULL DEFAULT 'prepared', created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP, result_json TEXT NOT NULL DEFAULT '[]')`,
    `CREATE TABLE IF NOT EXISTS deployment_readiness_markdown_exports (deployment_readiness_markdown_export_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT NOT NULL, score INTEGER NOT NULL DEFAULT 0, export_status TEXT NOT NULL DEFAULT 'prepared', markdown_body TEXT NOT NULL, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`,
    `CREATE TABLE IF NOT EXISTS cloudflare_deployment_release_matches (cloudflare_deployment_release_match_id INTEGER PRIMARY KEY AUTOINCREMENT, deployment_history_id INTEGER, build_label TEXT, branch_name TEXT, commit_sha TEXT, manifest_hash TEXT, match_status TEXT NOT NULL DEFAULT 'needs_review', match_score INTEGER NOT NULL DEFAULT 0, matched_by_user_id INTEGER, matched_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS promote_live_attempts (promote_live_attempt_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT NOT NULL, attempt_status TEXT NOT NULL DEFAULT 'blocked', readiness_score INTEGER NOT NULL DEFAULT 0, blocker_count INTEGER NOT NULL DEFAULT 0, checklist_blocker_count INTEGER NOT NULL DEFAULT 0, smoke_blocker_count INTEGER NOT NULL DEFAULT 0, manifest_blocker_count INTEGER NOT NULL DEFAULT 0, d1_marker_blocker_count INTEGER NOT NULL DEFAULT 0, attempted_by_user_id INTEGER, attempted_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`,
    `CREATE TABLE IF NOT EXISTS post_promotion_incident_watch_runs (post_promotion_incident_watch_run_id INTEGER PRIMARY KEY AUTOINCREMENT, build_label TEXT NOT NULL, watch_status TEXT NOT NULL DEFAULT 'not_run', runtime_404_count INTEGER NOT NULL DEFAULT 0, runtime_500_count INTEGER NOT NULL DEFAULT 0, provider_failure_count INTEGER NOT NULL DEFAULT 0, incident_rows_created INTEGER NOT NULL DEFAULT 0, checked_by_user_id INTEGER, checked_at TEXT DEFAULT CURRENT_TIMESTAMP, notes TEXT)`
  ];
  for (const sql of statements) await db.prepare(sql).run();
}

function localBusinessSchemaFromDraft(row) {
  const area = parseJson(row?.area_served_json, ['Southern Ontario', 'Oxford County', 'Norfolk County']);
  const services = parseJson(row?.service_types_json, ['handmade jewelry', 'custom gifts', 'laser engraving', 'custom candles', 'custom soap']);
  const sameAs = parseJson(row?.same_as_json, []);
  const address = parseJson(row?.address_json, {});
  const geo = parseJson(row?.geo_json, {});
  const payload = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: row?.business_name || 'Devil n Dove',
    url: row?.canonical_url || 'https://devilndove.com/',
    areaServed: area,
    makesOffer: services.map((name) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name } }))
  };
  if (row?.telephone) payload.telephone = row.telephone;
  if (row?.email) payload.email = row.email;
  if (sameAs.length) payload.sameAs = sameAs;
  if (Object.keys(address).length) payload.address = { '@type': 'PostalAddress', ...address };
  if (Object.keys(geo).length) payload.geo = { '@type': 'GeoCoordinates', ...geo };
  return payload;
}

function currentManifestPayload() {
  return { build_label: BUILD_LABEL, generated_by: 'promotion-control', files: [] };
}

function diffManifestObjects(previous, current) {
  const prevFiles = Array.isArray(previous?.files) ? previous.files : [];
  const currFiles = Array.isArray(current?.files) ? current.files : [];
  const prev = new Map(prevFiles.map((f) => [f.path || f.file_path || f.name, f]));
  const curr = new Map(currFiles.map((f) => [f.path || f.file_path || f.name, f]));
  let added = 0, changed = 0, removed = 0;
  for (const [path, row] of curr.entries()) {
    if (!path) continue;
    if (!prev.has(path)) added += 1;
    else {
      const old = prev.get(path);
      const a = row.sha256 || row.hash || row.bytes || '';
      const b = old.sha256 || old.hash || old.bytes || '';
      if (a && b && a !== b) changed += 1;
    }
  }
  for (const path of prev.keys()) if (path && !curr.has(path)) removed += 1;
  return { added, changed, removed };
}

async function seedQaRules(db, user) {
  const rules = [
    ['seo_title_case', 'seo_title', 'approval_required', 'Low-risk title-case cleanup only. Requires preview confirmation and max row limit.'],
    ['empty_status_label', 'status_label', 'approval_required', 'Only fills empty public status labels with approved defaults.'],
    ['missing_image_alt', 'image_alt_text', 'approval_required', 'Existing Build 177/178 safe apply path; keep approval gate.']
  ];
  for (const [code, field, status, notes] of rules) {
    await db.prepare(`INSERT INTO product_qa_safe_apply_rules (blocker_code, apply_field, rule_status, requires_confirmation, max_rows_per_run, safety_notes, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, 1, 25, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(blocker_code) DO UPDATE SET apply_field=excluded.apply_field, rule_status=excluded.rule_status, safety_notes=excluded.safety_notes, updated_at=CURRENT_TIMESTAMP`).bind(code, field, status, notes, Number(user.user_id || 0) || null).run();
  }
}

async function seedLocalSeoVisuals(db, user) {
  const pages = ['/', '/handmade-jewelry-ontario/', '/custom-gifts-southern-ontario/', '/laser-engraving-ontario/', '/polymer-clay-earrings-ontario/'];
  for (const page of pages) {
    await db.prepare(`INSERT INTO local_seo_visual_chart_configs (page_path, chart_key, chart_label, metric_kind, period_label, config_json, created_by_user_id, created_at, updated_at) VALUES (?, 'gsc_impressions_clicks', 'Search Console trend mini-chart', 'impressions', 'last_90_days', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(page_path, chart_key) DO UPDATE SET chart_label=excluded.chart_label, period_label=excluded.period_label, updated_at=CURRENT_TIMESTAMP`).bind(page, JSON.stringify({ display: 'mini_line', secondaryMetric: 'clicks' }), Number(user.user_id || 0) || null).run();
  }
  const edges = await safeAll(db, `SELECT source_path, target_path, anchor_text, edge_status, score FROM internal_link_map_edges ORDER BY score DESC LIMIT 50`);
  const nodes = new Set();
  edges.forEach((edge) => { nodes.add(edge.source_path); nodes.add(edge.target_path); });
  await db.prepare(`INSERT INTO internal_link_graph_snapshots (snapshot_label, node_count, edge_count, missing_link_count, graph_json, snapshot_status, created_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, 'prepared', ?, CURRENT_TIMESTAMP)`).bind(`${BUILD_LABEL} local SEO internal-link graph`, nodes.size, edges.length, edges.filter((e) => lc(e.edge_status) !== 'approved').length, JSON.stringify({ nodes: [...nodes], edges }), Number(user.user_id || 0) || null).run();
}

async function approveLocalBusinessDraft(db, user, body = {}) {
  const draftId = Number(body.local_business_schema_edit_draft_id || 0);
  let draft = draftId ? await safeFirst(db, `SELECT * FROM local_business_schema_edit_drafts WHERE local_business_schema_edit_draft_id=?`, [draftId], null) : null;
  if (!draft) draft = await safeFirst(db, `SELECT * FROM local_business_schema_edit_drafts ORDER BY updated_at DESC, created_at DESC LIMIT 1`, [], null);
  const schema = localBusinessSchemaFromDraft(draft || {});
  const targets = toArray(body.target_paths || body.target_paths_json, ['/', '/handmade-jewelry-ontario/', '/custom-gifts-southern-ontario/', '/laser-engraving-ontario/']);
  await db.prepare(`INSERT INTO local_business_schema_bake_approvals (local_business_schema_edit_draft_id, approval_status, output_path, target_paths_json, schema_json, approved_by_user_id, approved_at, bake_notes, created_at, updated_at) VALUES (?, 'approved', ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(draft?.local_business_schema_edit_draft_id || null, normalizeText(body.output_path || 'data/site/local-business-schema.json'), JSON.stringify(targets), JSON.stringify(schema), Number(user.user_id || 0) || null, normalizeText(body.notes || 'Approved from Build 179 Promotion Control.')).run();
  for (const page of targets) {
    await runSafe(db, `INSERT INTO local_business_schema_injection_targets (page_path, injection_status, schema_source, last_baked_at, notes, created_by_user_id, created_at, updated_at) VALUES (?, 'approved_for_bake', ?, CURRENT_TIMESTAMP, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(page_path) DO UPDATE SET injection_status='approved_for_bake', last_baked_at=CURRENT_TIMESTAMP, notes=excluded.notes, updated_at=CURRENT_TIMESTAMP`, [page, 'data/site/local-business-schema.json', 'Approved through Build 179 bake workflow.', Number(user.user_id || 0) || null]);
  }
}

async function seedStructuredDataPreviews(db) {
  const pages = ['/', '/shop/', '/gallery/', '/handmade-jewelry-ontario/', '/custom-gifts-southern-ontario/', '/laser-engraving-ontario/', '/polymer-clay-earrings-ontario/'];
  for (const page of pages) {
    for (const type of ['LocalBusiness', 'BreadcrumbList']) {
      await db.prepare(`INSERT INTO structured_data_page_previews (page_path, schema_type, preview_status, jsonld_excerpt, issue_count, validation_notes, created_at, updated_at) VALUES (?, ?, 'needs_review', ?, 0, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(page_path, schema_type) DO UPDATE SET jsonld_excerpt=excluded.jsonld_excerpt, issue_count=excluded.issue_count, validation_notes=excluded.validation_notes, updated_at=CURRENT_TIMESTAMP`).bind(page, type, JSON.stringify({ '@context': 'https://schema.org', '@type': type, page }), 'Review with Google Rich Results / Schema validator after deploy.').run();
    }
  }
}

async function verifyProviderSignatures(db, user, request, env = {}) {
  const providers = [
    ['resend', 'RESEND_WEBHOOK_SECRET', 'svix-signature', 'svix-timestamp'],
    ['sendgrid', 'SENDGRID_WEBHOOK_PUBLIC_KEY', 'x-twilio-email-event-webhook-signature', 'x-twilio-email-event-webhook-timestamp'],
    ['postmark', 'POSTMARK_WEBHOOK_SECRET', 'x-postmark-signature', '']
  ];
  for (const [provider, binding, sigHeader, tsHeader] of providers) {
    const secretPresent = env && Object.prototype.hasOwnProperty.call(env, binding) && env[binding] ? 1 : 0;
    const hasSig = request.headers.has(sigHeader) ? 1 : 0;
    const hasTs = tsHeader && request.headers.has(tsHeader) ? 1 : 0;
    const status = secretPresent && hasSig ? 'header_ready' : 'setup_required';
    await db.prepare(`INSERT INTO provider_webhook_signature_secret_checks (provider, expected_secret_binding, signature_header_name, timestamp_header_name, secret_present, signature_header_present, timestamp_header_present, verification_status, verification_notes, checked_by_user_id, checked_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(provider, binding, sigHeader, tsHeader, secretPresent, hasSig, hasTs, status, 'Build zip can only verify header/binding presence shape; cryptographic verification runs in deployed webhook handler.', Number(user.user_id || 0) || null).run();
  }
}

async function runR2ExpiryTest(db, user, env) {
  const key = `health/build179-signed-url-${Date.now()}.txt`;
  const bucket = env.PRIVATE_EVIDENCE_BUCKET || env.ACCOUNTING_EVIDENCE_BUCKET || env.R2_BUCKET || null;
  let create = 'not_configured', signed = 'not_configured', expiry = 'not_configured', notes = 'No private R2 bucket binding configured.';
  try {
    if (bucket?.put && bucket?.get && bucket?.delete) {
      await bucket.put(key, 'build179 signed-url expiry test', { httpMetadata: { contentType: 'text/plain' } });
      const obj = await bucket.get(key);
      await bucket.delete(key);
      create = obj ? 'passed' : 'failed';
      signed = 'route_required';
      expiry = 'route_required';
      notes = 'R2 object lifecycle passed. Signed URL generation/expiry requires the deployed signed-download route and configured signing secret.';
    }
  } catch (error) {
    create = 'failed';
    signed = 'not_run';
    expiry = 'not_run';
    notes = error.message || 'R2 signed URL expiry test failed.';
  }
  await db.prepare(`INSERT INTO r2_signed_url_expiry_tests (bucket_label, object_key, create_status, signed_url_status, expiry_status, expires_seconds, checked_by_user_id, checked_at, notes) VALUES (?, ?, ?, ?, ?, 60, ?, CURRENT_TIMESTAMP, ?)`).bind(bucket ? 'private_evidence' : 'not_configured', key, create, signed, expiry, Number(user.user_id || 0) || null, notes).run();
}

async function uploadRecallSignatureEvidence(db, user, env, body = {}) {
  const batch = normalizeText(body.batch_number || 'manual-review');
  const filename = normalizeText(body.original_filename || 'recall-signature.txt');
  const mime = normalizeText(body.mime_type || 'text/plain');
  const bucket = env.PRIVATE_EVIDENCE_BUCKET || env.ACCOUNTING_EVIDENCE_BUCKET || env.R2_BUCKET || null;
  const objectKey = normalizeText(body.r2_object_key || `recall-evidence/${batch}/${Date.now()}-${filename.replace(/[^a-z0-9_.-]+/gi, '-')}`);
  let bytes = Number(body.file_size_bytes || 0);
  let status = 'metadata_only';
  let evidenceUrl = normalizeText(body.evidence_url || '');
  let notes = normalizeText(body.notes || 'Metadata captured; attach final evidence after deploy.');
  const content = normalizeText(body.base64_data || body.text_content || '');
  try {
    if (bucket?.put && content) {
      const payload = body.base64_data ? Uint8Array.from(atob(String(body.base64_data)), (c) => c.charCodeAt(0)) : new TextEncoder().encode(content);
      bytes = payload.byteLength;
      await bucket.put(objectKey, payload, { httpMetadata: { contentType: mime } });
      status = 'uploaded_to_r2';
      notes = 'Evidence uploaded directly to R2 by Promotion Control.';
    }
  } catch (error) {
    status = 'upload_failed';
    notes = error.message || 'R2 upload failed.';
  }
  await db.prepare(`INSERT INTO recall_signature_evidence_uploads (batch_number, recall_id, original_filename, mime_type, file_size_bytes, evidence_url, r2_object_key, upload_status, uploaded_by_user_id, uploaded_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`).bind(batch, Number(body.recall_id || 0) || null, filename, mime, bytes, evidenceUrl || null, objectKey, status, Number(user.user_id || 0) || null, notes).run();
}

async function refreshRecallGates(db, user) {
  const recallRows = await safeAll(db, `SELECT batch_number, candle_soap_batch_recall_id AS recall_id FROM candle_soap_batch_recalls ORDER BY updated_at DESC LIMIT 50`);
  const fallback = recallRows.length ? recallRows : [{ batch_number: 'manual-review', recall_id: null }];
  for (const row of fallback) {
    const batch = normalizeText(row.batch_number || 'manual-review');
    const approvedCopy = await safeFirst(db, `SELECT COUNT(*) AS count FROM recall_customer_notification_copy_reviews WHERE batch_number=? AND review_status='approved'`, [batch], { count: 0 });
    const signatures = await safeFirst(db, `SELECT COUNT(*) AS count FROM recall_signature_evidence_uploads WHERE batch_number=? AND upload_status IN ('uploaded_to_r2','metadata_only')`, [batch], { count: 0 });
    const matches = await safeFirst(db, `SELECT COUNT(*) AS count FROM recall_customer_match_previews WHERE batch_number=?`, [batch], { count: 0 });
    const release = Number(approvedCopy.count || 0) && Number(signatures.count || 0) && Number(matches.count || 0) ? 'release_allowed' : 'blocked';
    await db.prepare(`INSERT INTO recall_notification_release_gates (batch_number, recall_id, copy_review_status, signature_status, customer_match_status, release_status, gate_notes, checked_by_user_id, checked_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(batch_number, recall_id) DO UPDATE SET copy_review_status=excluded.copy_review_status, signature_status=excluded.signature_status, customer_match_status=excluded.customer_match_status, release_status=excluded.release_status, gate_notes=excluded.gate_notes, checked_by_user_id=excluded.checked_by_user_id, checked_at=CURRENT_TIMESTAMP`).bind(batch, row.recall_id || null, Number(approvedCopy.count || 0) ? 'approved' : 'needs_review', Number(signatures.count || 0) ? 'present' : 'needs_upload', Number(matches.count || 0) ? 'present' : 'needs_review', release, release === 'release_allowed' ? 'All recall release prerequisites are present.' : 'Recall notices remain blocked until copy, signature evidence, and customer match review are complete.', Number(user.user_id || 0) || null).run();
  }
}

async function linkAccountingZip(db, user) {
  const safe = await safeFirst(db, `SELECT safe_deploy_package_download_id, zip_sha256, total_bytes FROM safe_deploy_package_downloads ORDER BY prepared_at DESC LIMIT 1`, [], null);
  const checksum = await safeFirst(db, `SELECT accounting_zip_checksum_link_id, zip_sha256 FROM accounting_zip_checksum_links ORDER BY created_at DESC LIMIT 1`, [], null);
  await db.prepare(`INSERT INTO accounting_zip_export_links (period_month, accountant_export_id, safe_deploy_package_download_id, zip_sha256, total_bytes, evidence_file_count, link_status, created_by_user_id, created_at, notes) VALUES (?, NULL, ?, ?, ?, 0, ?, ?, CURRENT_TIMESTAMP, ?)`).bind(new Date().toISOString().slice(0, 7), safe?.safe_deploy_package_download_id || null, safe?.zip_sha256 || checksum?.zip_sha256 || null, Number(safe?.total_bytes || 0), safe ? 'linked_to_safe_deploy' : 'prepared_no_download_yet', Number(user.user_id || 0) || null, safe ? 'Linked latest safe deploy download checksum for accountant evidence traceability.' : 'No safe deploy download record found yet.').run();
}

async function importPreviousZipComparison(db, user, body = {}) {
  const current = currentManifestPayload();
  const previous = parseJson(body.previous_manifest_json, {});
  const diff = diffManifestObjects(previous, current);
  await db.prepare(`INSERT INTO previous_zip_manifest_imports (previous_build_label, current_build_label, previous_manifest_json, current_manifest_json, added_count, changed_count, removed_count, import_status, created_by_user_id, created_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?, 'prepared', ?, CURRENT_TIMESTAMP, ?)`).bind(normalizeText(body.previous_build_label || 'previous-upload'), BUILD_LABEL, JSON.stringify(previous), JSON.stringify(current), diff.added, diff.changed, diff.removed, Number(user.user_id || 0) || null, 'Prepared from pasted/uploaded manifest JSON. Full binary zip import is handled outside the Worker runtime.').run();
}

async function seedMarketplaceGates(db, user) {
  const runs = await safeAll(db, `SELECT marketplace_export_validation_run_id, channel, blocker_count FROM marketplace_export_validation_runs ORDER BY created_at DESC LIMIT 25`);
  const fallback = runs.length ? runs : [{ marketplace_export_validation_run_id: null, channel: 'etsy', blocker_count: 1 }, { marketplace_export_validation_run_id: null, channel: 'facebook', blocker_count: 1 }, { marketplace_export_validation_run_id: null, channel: 'pinterest', blocker_count: 1 }];
  for (const row of fallback) {
    const blockers = Number(row.blocker_count || 0);
    await db.prepare(`INSERT INTO marketplace_export_download_gates (channel, export_history_id, validation_run_id, gate_status, hard_blocker_count, manual_override_required, gate_notes, created_at, updated_at) VALUES (?, NULL, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT(channel, export_history_id) DO UPDATE SET validation_run_id=excluded.validation_run_id, gate_status=excluded.gate_status, hard_blocker_count=excluded.hard_blocker_count, manual_override_required=excluded.manual_override_required, gate_notes=excluded.gate_notes, updated_at=CURRENT_TIMESTAMP`).bind(normalizeText(row.channel || 'manual'), row.marketplace_export_validation_run_id || null, blockers ? 'blocked' : 'passed', blockers, blockers ? 1 : 0, blockers ? 'CSV download must stay blocked until hard validation blockers are resolved or overridden.' : 'No hard blockers found in latest validation run.').run();
  }
}

async function runManifestFilters(db, user) {
  const filters = await safeAll(db, `SELECT filter_key, diff_kind, path_contains FROM release_manifest_diff_view_filters ORDER BY updated_at DESC LIMIT 20`);
  const diffItems = await safeAll(db, `SELECT file_path, diff_kind, item_status FROM release_manifest_diff_items ORDER BY created_at DESC LIMIT 500`);
  const fallback = filters.length ? filters : [{ filter_key: 'admin_js_changed', diff_kind: 'changed', path_contains: 'admin' }, { filter_key: 'schema_sql_changed', diff_kind: 'changed', path_contains: 'database_' }];
  for (const filter of fallback) {
    const matched = diffItems.filter((item) => (!filter.diff_kind || item.diff_kind === filter.diff_kind) && (!filter.path_contains || String(item.file_path || '').includes(filter.path_contains)));
    await db.prepare(`INSERT INTO release_manifest_path_filter_runs (filter_key, diff_kind, path_contains, matched_count, run_status, created_by_user_id, created_at, result_json) VALUES (?, ?, ?, ?, 'prepared', ?, CURRENT_TIMESTAMP, ?)`).bind(normalizeText(filter.filter_key), normalizeText(filter.diff_kind), normalizeText(filter.path_contains), matched.length, Number(user.user_id || 0) || null, JSON.stringify(matched.slice(0, 100))).run();
  }
}

async function exportReadinessMarkdown(db, user) {
  const latest = await safeFirst(db, `SELECT * FROM deployment_readiness_scores ORDER BY scored_at DESC LIMIT 1`, [], { score: 0, score_status: 'not_scored', blocker_count: 0, warning_count: 0 });
  const checklist = await safeAll(db, `SELECT checklist_label, checklist_status, blocking_reason FROM deployment_promote_live_checklist ORDER BY deployment_promote_live_checklist_id LIMIT 50`);
  const body = [`# ${BUILD_LABEL} Deploy Readiness Export`, '', `Score: ${Number(latest.score || 0)}/100`, `Status: ${latest.score_status || 'not_scored'}`, `Blockers: ${Number(latest.blocker_count || 0)}`, `Warnings: ${Number(latest.warning_count || 0)}`, '', '## Promote-live checklist', ...checklist.map((row) => `- ${row.checklist_status}: ${row.checklist_label}${row.blocking_reason ? ` — ${row.blocking_reason}` : ''}`), ''].join('\n');
  await db.prepare(`INSERT INTO deployment_readiness_markdown_exports (build_label, score, export_status, markdown_body, created_by_user_id, created_at) VALUES (?, ?, 'prepared', ?, ?, CURRENT_TIMESTAMP)`).bind(BUILD_LABEL, Number(latest.score || 0), body, Number(user.user_id || 0) || null).run();
}

async function matchCloudflareDeployments(db, user) {
  const deployments = await safeAll(db, `SELECT deployment_history_id, build_label, branch_name, commit_sha, package_manifest_hash, deployment_status FROM deployment_history ORDER BY created_at DESC LIMIT 25`);
  for (const dep of deployments) {
    const score = (dep.build_label === BUILD_LABEL ? 35 : 0) + (dep.commit_sha ? 25 : 0) + (dep.package_manifest_hash ? 30 : 0) + (lc(dep.deployment_status).includes('deploy') ? 10 : 0);
    await db.prepare(`INSERT INTO cloudflare_deployment_release_matches (deployment_history_id, build_label, branch_name, commit_sha, manifest_hash, match_status, match_score, matched_by_user_id, matched_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`).bind(dep.deployment_history_id, dep.build_label, dep.branch_name, dep.commit_sha, dep.package_manifest_hash, score >= 80 ? 'matched' : 'needs_review', score, Number(user.user_id || 0) || null, 'Matched by branch/commit/manifest/build labels.').run();
  }
}

async function attemptPromoteLive(db, user) {
  const score = await safeFirst(db, `SELECT * FROM deployment_readiness_scores ORDER BY scored_at DESC LIMIT 1`, [], { score: 0, blocker_count: 0, manifest_blocker_count: 0, smoke_blocker_count: 0, d1_marker_count: 0 });
  const checklist = await safeFirst(db, `SELECT COUNT(*) AS count FROM deployment_promote_live_checklist WHERE required_to_promote=1 AND checklist_status NOT IN ('passed','not_applicable')`, [], { count: 0 });
  const gates = await safeFirst(db, `SELECT COUNT(*) AS count FROM recall_notification_release_gates WHERE release_status='blocked'`, [], { count: 0 });
  const marketplace = await safeFirst(db, `SELECT COUNT(*) AS count FROM marketplace_export_download_gates WHERE gate_status='blocked'`, [], { count: 0 });
  const blockers = Number(score.blocker_count || 0) + Number(score.manifest_blocker_count || 0) + Number(score.smoke_blocker_count || 0) + Number(score.d1_marker_count || 0) + Number(checklist.count || 0) + Number(gates.count || 0) + Number(marketplace.count || 0);
  const status = Number(score.score || 0) >= 95 && blockers === 0 ? 'ready_to_promote' : 'blocked';
  await db.prepare(`INSERT INTO promote_live_attempts (build_label, attempt_status, readiness_score, blocker_count, checklist_blocker_count, smoke_blocker_count, manifest_blocker_count, d1_marker_blocker_count, attempted_by_user_id, attempted_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`).bind(BUILD_LABEL, status, Number(score.score || 0), blockers, Number(checklist.count || 0), Number(score.smoke_blocker_count || 0), Number(score.manifest_blocker_count || 0), Number(score.d1_marker_count || 0), Number(user.user_id || 0) || null, status === 'ready_to_promote' ? 'All major gates passed.' : 'Promote Live remains disabled until score, checklist, smoke, manifest, D1, recall, and marketplace gates are clear.').run();
}

async function runIncidentWatcher(context, db, user) {
  const runtime = await safeFirst(db, `SELECT SUM(CASE WHEN incident_code LIKE '%404%' THEN 1 ELSE 0 END) AS e404, SUM(CASE WHEN incident_code LIKE '%500%' OR severity='error' THEN 1 ELSE 0 END) AS e500 FROM runtime_incidents WHERE created_at >= datetime('now','-1 day')`, [], { e404: 0, e500: 0 });
  const providers = await safeFirst(db, `SELECT COUNT(*) AS count FROM provider_webhook_signature_secret_checks WHERE verification_status IN ('failed','setup_required') AND checked_at >= datetime('now','-1 day')`, [], { count: 0 });
  const incidentRows = Number(runtime.e404 || 0) + Number(runtime.e500 || 0) + Number(providers.count || 0) > 0 ? 1 : 0;
  if (incidentRows) await captureRuntimeIncident(context.env, context.request, { incident_scope: 'post_promotion_watch', incident_code: 'build179_watch_open_items', severity: 'warning', message: 'Post-promotion watcher found open 404/500/provider rows.', related_user_id: user.user_id, details: runtime });
  await db.prepare(`INSERT INTO post_promotion_incident_watch_runs (build_label, watch_status, runtime_404_count, runtime_500_count, provider_failure_count, incident_rows_created, checked_by_user_id, checked_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`).bind(BUILD_LABEL, incidentRows ? 'open_items' : 'passed', Number(runtime.e404 || 0), Number(runtime.e500 || 0), Number(providers.count || 0), incidentRows, Number(user.user_id || 0) || null, incidentRows ? 'Watcher recorded follow-up incident row.' : 'No recent runtime/provider spikes were found.').run();
}

async function buildPayload(db) {
  await ensureTables(db);
  const summary = {
    qa_rule_count: Number((await safeFirst(db, `SELECT COUNT(*) AS count FROM product_qa_safe_apply_rules`, [], { count: 0 })).count || 0),
    recall_blockers: Number((await safeFirst(db, `SELECT COUNT(*) AS count FROM recall_notification_release_gates WHERE release_status='blocked'`, [], { count: 0 })).count || 0),
    marketplace_blockers: Number((await safeFirst(db, `SELECT COUNT(*) AS count FROM marketplace_export_download_gates WHERE gate_status='blocked'`, [], { count: 0 })).count || 0),
    latest_promote_status: (await safeFirst(db, `SELECT attempt_status FROM promote_live_attempts ORDER BY attempted_at DESC LIMIT 1`, [], { attempt_status: 'not_attempted' })).attempt_status
  };
  return {
    ok: true,
    build_label: BUILD_LABEL,
    summary,
    qa_rules: await safeAll(db, `SELECT * FROM product_qa_safe_apply_rules ORDER BY blocker_code`),
    chart_configs: await safeAll(db, `SELECT * FROM local_seo_visual_chart_configs ORDER BY page_path, chart_key LIMIT 50`),
    graph_snapshots: await safeAll(db, `SELECT * FROM internal_link_graph_snapshots ORDER BY created_at DESC LIMIT 10`),
    lb_bake_approvals: await safeAll(db, `SELECT * FROM local_business_schema_bake_approvals ORDER BY created_at DESC LIMIT 20`),
    webhook_checks: await safeAll(db, `SELECT * FROM provider_webhook_signature_secret_checks ORDER BY checked_at DESC LIMIT 30`),
    r2_expiry_tests: await safeAll(db, `SELECT * FROM r2_signed_url_expiry_tests ORDER BY checked_at DESC LIMIT 20`),
    recall_uploads: await safeAll(db, `SELECT * FROM recall_signature_evidence_uploads ORDER BY uploaded_at DESC LIMIT 20`),
    recall_gates: await safeAll(db, `SELECT * FROM recall_notification_release_gates ORDER BY checked_at DESC LIMIT 30`),
    accounting_links: await safeAll(db, `SELECT * FROM accounting_zip_export_links ORDER BY created_at DESC LIMIT 20`),
    previous_zip_imports: await safeAll(db, `SELECT * FROM previous_zip_manifest_imports ORDER BY created_at DESC LIMIT 10`),
    dashboard_actions: await safeAll(db, `SELECT * FROM dashboard_notification_card_actions ORDER BY created_at DESC LIMIT 20`),
    mobile_preferences: await safeAll(db, `SELECT * FROM mobile_release_control_render_preferences ORDER BY updated_at DESC LIMIT 20`),
    schema_previews: await safeAll(db, `SELECT * FROM structured_data_page_previews ORDER BY page_path, schema_type LIMIT 60`),
    marketplace_gates: await safeAll(db, `SELECT * FROM marketplace_export_download_gates ORDER BY updated_at DESC LIMIT 30`),
    rollback_actions: await safeAll(db, `SELECT * FROM release_rollback_row_actions ORDER BY acted_at DESC LIMIT 30`),
    manifest_filter_runs: await safeAll(db, `SELECT * FROM release_manifest_path_filter_runs ORDER BY created_at DESC LIMIT 20`),
    markdown_exports: await safeAll(db, `SELECT deployment_readiness_markdown_export_id, build_label, score, export_status, created_at FROM deployment_readiness_markdown_exports ORDER BY created_at DESC LIMIT 20`),
    cf_matches: await safeAll(db, `SELECT * FROM cloudflare_deployment_release_matches ORDER BY matched_at DESC LIMIT 20`),
    promote_attempts: await safeAll(db, `SELECT * FROM promote_live_attempts ORDER BY attempted_at DESC LIMIT 20`),
    incident_watch: await safeAll(db, `SELECT * FROM post_promotion_incident_watch_runs ORDER BY checked_at DESC LIMIT 20`)
  };
}

export async function onRequestGet(context) {
  const user = await getAdminUserFromRequest(context.request, context.env);
  if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  return json(await buildPayload(db));
}

export async function onRequestPost(context) {
  const user = await getAdminUserFromRequest(context.request, context.env);
  if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureTables(db);
  let body = {}; try { body = await context.request.json(); } catch { body = {}; }
  const action = lc(body.action || 'seed_all');

  if (action === 'seed_all') {
    await seedQaRules(db, user);
    await seedLocalSeoVisuals(db, user);
    await seedStructuredDataPreviews(db);
    await seedMarketplaceGates(db, user);
    await refreshRecallGates(db, user);
    await linkAccountingZip(db, user);
    await runManifestFilters(db, user);
    await exportReadinessMarkdown(db, user);
    await matchCloudflareDeployments(db, user);
  } else if (action === 'seed_qa_rules') await seedQaRules(db, user);
  else if (action === 'seed_local_seo_visuals') await seedLocalSeoVisuals(db, user);
  else if (action === 'approve_local_business_bake') await approveLocalBusinessDraft(db, user, body);
  else if (action === 'verify_provider_signatures') await verifyProviderSignatures(db, user, context.request, context.env);
  else if (action === 'run_r2_signed_url_expiry_test') await runR2ExpiryTest(db, user, context.env);
  else if (action === 'upload_recall_signature_evidence') await uploadRecallSignatureEvidence(db, user, context.env, body);
  else if (action === 'refresh_recall_gates') await refreshRecallGates(db, user);
  else if (action === 'link_accounting_zip') await linkAccountingZip(db, user);
  else if (action === 'import_previous_zip_manifest') await importPreviousZipComparison(db, user, body);
  else if (action === 'snooze_dashboard_card') {
    await db.prepare(`INSERT INTO dashboard_notification_card_actions (dashboard_notification_card_id, action_kind, action_status, snooze_until, action_note, created_by_user_id, created_at, updated_at) VALUES (?, 'snooze', 'active', datetime('now','+1 day'), ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(Number(body.dashboard_notification_card_id || 0), normalizeText(body.action_note || 'Snoozed for one day.'), Number(user.user_id || 0) || null).run();
  } else if (action === 'set_mobile_release_preferences') {
    await db.prepare(`INSERT INTO mobile_release_control_render_preferences (user_id, preference_key, compact_mode, large_tap_targets, visible_cards_json, updated_at) VALUES (?, 'mobile_release_cards', ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(user_id, preference_key) DO UPDATE SET compact_mode=excluded.compact_mode, large_tap_targets=excluded.large_tap_targets, visible_cards_json=excluded.visible_cards_json, updated_at=CURRENT_TIMESTAMP`).bind(Number(user.user_id || 0), Number(body.compact_mode == null ? 1 : body.compact_mode), Number(body.large_tap_targets == null ? 1 : body.large_tap_targets), JSON.stringify(toArray(body.visible_cards, ['deploy_score','manifest_diff','promote_live','smoke_tests']))).run();
  } else if (action === 'seed_schema_previews') await seedStructuredDataPreviews(db);
  else if (action === 'seed_marketplace_gates') await seedMarketplaceGates(db, user);
  else if (action === 'record_rollback_action') {
    await db.prepare(`INSERT INTO release_rollback_row_actions (deployment_rollback_checklist_row_id, action_status, action_note, acted_by_user_id, acted_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`).bind(Number(body.deployment_rollback_checklist_row_id || 0), normalizeText(body.action_status || 'passed'), normalizeText(body.action_note || 'Updated from Promotion Control.'), Number(user.user_id || 0) || null).run();
  } else if (action === 'run_manifest_filters') await runManifestFilters(db, user);
  else if (action === 'export_readiness_markdown') await exportReadinessMarkdown(db, user);
  else if (action === 'match_cloudflare_deployments') await matchCloudflareDeployments(db, user);
  else if (action === 'attempt_promote_live') await attemptPromoteLive(db, user);
  else if (action === 'run_incident_watch') await runIncidentWatcher(context, db, user);
  else return json({ ok: false, error: `Unknown action: ${action}` }, 400);

  await auditAdminAction(context.env, context.request, user, { action_type: `promotion_control_${action}`, target_type: 'promotion_control', target_key: BUILD_LABEL, details: body });
  return json(await buildPayload(db));
}
