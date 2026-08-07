// Build 240 — production evidence, continuity, packaging safeguards, SEO observation and mobile recovery.
// This route never creates schema at request time. Apply database_build240_operational_evidence_continuity.sql first.

import {
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText,
  auditAdminAction,
  captureRuntimeIncident
} from '../_lib/adminAudit.js';

const BUILD_LABEL = 'Build 240';
const MAX_TEXT = 3000;
const MAX_JSON = 24000;
const WORKSTREAM_STATUSES = new Set(['planned','ready_to_test','in_progress','blocked','complete','not_applicable']);
const CASE_STATUSES = new Set(['open','running','passed','failed','blocked','cancelled']);
const RESERVATION_STATUSES = new Set(['draft','reserved','consumed','released','reversed','blocked']);

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function text(value, max = MAX_TEXT) { return normalizeText(value).slice(0, max); }
function int(value) { const n = Number(value); return Number.isInteger(n) && n > 0 ? n : 0; }
function number(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function safeJson(value, fallback = {}) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(String(value)); } catch { return fallback; }
}
function jsonText(value, fallback = {}) {
  const parsed = safeJson(value, fallback);
  const output = JSON.stringify(parsed);
  if (output.length > MAX_JSON) throw new Error('Structured evidence exceeds the 24 KB safety limit.');
  return output;
}
function slug(value) {
  return text(value, 180).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
}
function nowKey(prefix) {
  return `${prefix}-${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)}-${crypto.randomUUID().slice(0, 8)}`;
}
async function all(db, sql, bindings = []) { return rows(await db.prepare(sql).bind(...bindings).all()); }
async function first(db, sql, bindings = []) { return (await db.prepare(sql).bind(...bindings).first()) || null; }
async function count(db, sql, bindings = []) { return Number((await first(db, sql, bindings))?.count || 0); }

async function schemaReady(db) {
  const required = ['operational_workstreams','production_evidence_cases','packaging_inventory_reservations','public_page_audit_results','route_fallback_policies'];
  const found = await all(db, `SELECT name FROM sqlite_master WHERE type='table' AND name IN (${required.map(() => '?').join(',')})`, required);
  return found.length === required.length;
}

async function summary(db) {
  const [workstreams, evidenceCases, reservations, providerRows, notificationRows, mobileDrafts, assetChecks, mediaRoles, supportRows, closeRows, batches, seoRows, audits, fallbacks, mobileCards, migration] = await Promise.all([
    all(db, `SELECT * FROM operational_workstreams WHERE is_active=1 ORDER BY CASE priority WHEN 'P0' THEN 0 WHEN 'P1' THEN 1 ELSE 2 END, sort_order, operational_workstream_id LIMIT 100`),
    all(db, `SELECT * FROM production_evidence_cases ORDER BY created_at DESC, production_evidence_case_id DESC LIMIT 50`),
    all(db, `SELECT * FROM packaging_inventory_reservations ORDER BY created_at DESC LIMIT 40`),
    all(db, `SELECT * FROM provider_result_reconciliations ORDER BY checked_at DESC LIMIT 30`),
    all(db, `SELECT * FROM notification_delivery_attempts ORDER BY attempted_at DESC LIMIT 30`),
    all(db, `SELECT * FROM mobile_evidence_drafts ORDER BY updated_at DESC LIMIT 30`),
    all(db, `SELECT * FROM deployed_asset_check_results ORDER BY checked_at DESC LIMIT 30`),
    all(db, `SELECT * FROM product_media_role_requirements ORDER BY updated_at DESC LIMIT 50`),
    all(db, `SELECT * FROM customer_support_interactions ORDER BY CASE interaction_status WHEN 'escalated' THEN 0 WHEN 'open' THEN 1 WHEN 'waiting' THEN 2 ELSE 3 END, COALESCE(follow_up_at,created_at), created_at DESC LIMIT 40`),
    all(db, `SELECT * FROM accounting_close_checklist_items ORDER BY period_key DESC, checklist_status, checklist_key LIMIT 60`),
    all(db, `SELECT * FROM controlled_batch_approvals ORDER BY created_at DESC LIMIT 30`),
    all(db, `SELECT * FROM local_seo_observation_snapshots ORDER BY snapshot_date DESC, page_path LIMIT 50`),
    all(db, `SELECT * FROM public_page_audit_results WHERE build_label=? ORDER BY CASE audit_status WHEN 'failed' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,page_path LIMIT 150`, [BUILD_LABEL]),
    all(db, `SELECT * FROM route_fallback_policies ORDER BY route_kind,route_path LIMIT 80`),
    all(db, `SELECT * FROM mobile_operations_cards WHERE card_status!='hidden' ORDER BY card_group,sort_order LIMIT 50`),
    first(db, `SELECT migration_key,file_name,applied_at,notes FROM schema_migration_ledger WHERE migration_key='build240_operational_evidence_continuity' LIMIT 1`)
  ]);
  const metrics = {
    workstream_total: workstreams.length,
    workstream_complete: workstreams.filter((row) => row.workstream_status === 'complete').length,
    workstream_blocked: workstreams.filter((row) => row.workstream_status === 'blocked').length,
    evidence_open: evidenceCases.filter((row) => !['passed','cancelled'].includes(row.case_status)).length,
    reservations_open: reservations.filter((row) => ['draft','reserved','blocked'].includes(row.reservation_status)).length,
    provider_mismatches: providerRows.filter((row) => ['mismatch','failed','not_found'].includes(row.reconciliation_status)).length,
    notification_failures: notificationRows.filter((row) => ['failed','bounced','deferred'].includes(row.attempt_status)).length,
    mobile_unsynced: mobileDrafts.filter((row) => !['synced','discarded'].includes(row.draft_status)).length,
    asset_failures: assetChecks.filter((row) => ['warning','failed'].includes(row.check_status)).length,
    missing_media_roles: mediaRoles.filter((row) => ['missing','blocked'].includes(row.requirement_status)).length,
    support_open: supportRows.filter((row) => !['resolved','closed'].includes(row.interaction_status)).length,
    close_blocked: closeRows.filter((row) => row.checklist_status === 'blocked').length,
    page_audit_failures: audits.filter((row) => row.audit_status === 'failed').length
  };
  return { metrics, workstreams, evidence_cases: evidenceCases, reservations, provider_rows: providerRows, notification_attempts: notificationRows, mobile_drafts: mobileDrafts, asset_checks: assetChecks, media_roles: mediaRoles, support_rows: supportRows, close_rows: closeRows, batch_approvals: batches, seo_observations: seoRows, page_audits: audits, fallbacks, mobile_cards: mobileCards, migration };
}

async function updateWorkstream(db, body, userId) {
  const key = text(body.workstream_key, 160);
  const status = text(body.workstream_status, 40);
  if (!key || !WORKSTREAM_STATUSES.has(status)) throw new Error('A valid workstream key and status are required.');
  await db.prepare(`UPDATE operational_workstreams SET workstream_status=?,owner_name=?,due_at=?,blocker_text=?,evidence_summary=?,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE workstream_key=? AND is_active=1`)
    .bind(status,text(body.owner_name,180)||null,text(body.due_at,80)||null,text(body.blocker_text)||null,text(body.evidence_summary)||null,userId,key).run();
  return { target_type: 'operational_workstream', target_key: key };
}

async function createEvidenceCase(db, body, userId) {
  const title = text(body.case_title, 220);
  const type = text(body.case_type, 100) || 'operational_test';
  if (!title) throw new Error('Evidence case title is required.');
  const key = text(body.case_key, 180) || nowKey(slug(type) || 'evidence');
  await db.prepare(`INSERT INTO production_evidence_cases (case_key,case_type,case_title,case_status,environment_name,expected_result,owner_name,related_workstream_key,created_by_user_id,updated_by_user_id,created_at,updated_at) VALUES (?,?,?,'open',?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`)
    .bind(key,type,title,text(body.environment_name,80)||'production',text(body.expected_result)||null,text(body.owner_name,180)||null,text(body.related_workstream_key,160)||null,userId,userId).run();
  return { target_type: 'production_evidence_case', target_key: key };
}

async function appendEvidenceEvent(db, body, userId) {
  const caseId = int(body.production_evidence_case_id);
  if (!caseId) throw new Error('Evidence case is required.');
  const eventType = text(body.event_type, 100) || 'observation';
  await db.prepare(`INSERT INTO production_evidence_events (production_evidence_case_id,event_type,event_status,expected_text,actual_text,evidence_url,safe_payload_json,actor_user_id,created_at) VALUES (?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`)
    .bind(caseId,eventType,text(body.event_status,60)||'recorded',text(body.expected_text)||null,text(body.actual_text)||null,text(body.evidence_url,1000)||null,jsonText(body.safe_payload,{}),userId).run();
  const status = text(body.case_status,40);
  if (CASE_STATUSES.has(status)) {
    const finished = ['passed','failed','blocked','cancelled'].includes(status) ? 'CURRENT_TIMESTAMP' : 'NULL';
    await db.prepare(`UPDATE production_evidence_cases SET case_status=?,actual_result=?,safe_reference=?,completed_at=${finished},updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE production_evidence_case_id=?`)
      .bind(status,text(body.actual_text)||null,text(body.safe_reference,600)||null,userId,caseId).run();
  }
  return { target_type: 'production_evidence_case', target_id: caseId };
}

async function claimIdempotency(db, body, userId) {
  const key = text(body.idempotency_key, 220);
  const kind = text(body.operation_kind, 120);
  if (!key || !kind) throw new Error('Idempotency key and operation kind are required.');
  const existing = await first(db, `SELECT * FROM operation_idempotency_claims WHERE idempotency_key=? LIMIT 1`, [key]);
  if (existing) return { target_type: 'idempotency_claim', target_id: existing.operation_idempotency_claim_id, duplicate: true, existing };
  const result = await db.prepare(`INSERT INTO operation_idempotency_claims (idempotency_key,operation_kind,target_type,target_id,request_hash,claim_status,response_reference,expires_at,created_by_user_id,first_claimed_at) VALUES (?,?,?,?,?,'claimed',?,?,?,CURRENT_TIMESTAMP)`)
    .bind(key,kind,text(body.target_type,100)||null,int(body.target_id)||null,text(body.request_hash,256)||null,text(body.response_reference,600)||null,text(body.expires_at,80)||null,userId).run();
  return { target_type: 'idempotency_claim', target_id: Number(result?.meta?.last_row_id || 0), duplicate: false };
}

async function createPackagingReservation(db, body, userId) {
  const projectId = int(body.packaging_project_id);
  const units = Math.max(0.001, number(body.quantity_finished_units, 1));
  if (!projectId) throw new Error('Packaging project is required.');
  const idem = text(body.idempotency_key,220) || nowKey(`packaging-${projectId}`);
  const duplicate = await first(db, `SELECT * FROM packaging_inventory_reservations WHERE idempotency_key=? LIMIT 1`, [idem]);
  if (duplicate) return { target_type:'packaging_reservation', target_id:duplicate.packaging_inventory_reservation_id, duplicate:true };
  const key = text(body.reservation_key,180) || nowKey(`packaging-reservation-${projectId}`);
  const inserted = await db.prepare(`INSERT INTO packaging_inventory_reservations (reservation_key,packaging_project_id,packaging_project_version_id,reservation_status,quantity_finished_units,idempotency_key,reason_text,reserved_at,created_by_user_id,updated_by_user_id,created_at,updated_at) VALUES (?,?,?,'reserved',?,?,?,CURRENT_TIMESTAMP,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`)
    .bind(key,projectId,int(body.packaging_project_version_id)||null,units,idem,text(body.reason_text)||'Packaging reservation created from active component BOM.',userId,userId).run();
  const reservationId = Number(inserted?.meta?.last_row_id || 0);
  const components = await all(db, `SELECT packaging_component_id,site_item_inventory_id,quantity_per_finished_unit,wastage_percent,component_name FROM packaging_components WHERE packaging_project_id=? AND is_active=1 ORDER BY packaging_component_id`, [projectId]);
  for (const row of components) {
    const required = Math.max(0, number(row.quantity_per_finished_unit) * units * (1 + Math.max(0,number(row.wastage_percent))/100));
    await db.prepare(`INSERT INTO packaging_inventory_reservation_lines (packaging_inventory_reservation_id,packaging_component_id,site_item_inventory_id,quantity_required,quantity_reserved,line_status,notes,created_at,updated_at) VALUES (?,?,?,?,?,'reserved',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`)
      .bind(reservationId,int(row.packaging_component_id)||null,int(row.site_item_inventory_id)||null,required,required,text(row.component_name,180)||null).run();
  }
  return { target_type:'packaging_reservation', target_id:reservationId, duplicate:false, line_count:components.length };
}

async function changePackagingReservation(db, body, userId) {
  const reservationId = int(body.packaging_inventory_reservation_id);
  const status = text(body.reservation_status,40);
  if (!reservationId || !RESERVATION_STATUSES.has(status)) throw new Error('Reservation and valid status are required.');
  const columns = { reserved:'reserved_at',consumed:'consumed_at',released:'released_at',reversed:'reversed_at' };
  const stamp = columns[status];
  await db.prepare(`UPDATE packaging_inventory_reservations SET reservation_status=?,${stamp ? `${stamp}=CURRENT_TIMESTAMP,` : ''}reason_text=COALESCE(?,reason_text),updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE packaging_inventory_reservation_id=?`)
    .bind(status,text(body.reason_text)||null,userId,reservationId).run();
  const lineStatus = status === 'blocked' ? 'blocked' : status;
  const quantityColumn = status === 'consumed' ? 'quantity_consumed=quantity_reserved,' : status === 'reversed' ? 'quantity_reversed=quantity_consumed,' : '';
  await db.prepare(`UPDATE packaging_inventory_reservation_lines SET line_status=?,${quantityColumn}updated_at=CURRENT_TIMESTAMP WHERE packaging_inventory_reservation_id=?`)
    .bind(lineStatus,reservationId).run();
  return { target_type:'packaging_reservation', target_id:reservationId };
}

async function saveFormulaLink(db, body, userId) {
  const projectId = int(body.packaging_project_id);
  const sourceKey = text(body.formula_source_key,220);
  if (!projectId || !sourceKey) throw new Error('Packaging project and formula source key are required.');
  await db.prepare(`INSERT INTO packaging_formula_source_links (packaging_project_id,formula_source_type,formula_source_key,formula_version,source_checksum,verification_status,verified_by_user_id,verified_at,notes,created_by_user_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(packaging_project_id,formula_source_type,formula_source_key,formula_version) DO UPDATE SET source_checksum=excluded.source_checksum,verification_status=excluded.verification_status,verified_by_user_id=excluded.verified_by_user_id,verified_at=excluded.verified_at,notes=excluded.notes,updated_at=CURRENT_TIMESTAMP`)
    .bind(projectId,text(body.formula_source_type,100)||'verified_formula',sourceKey,text(body.formula_version,120)||'',text(body.source_checksum,256)||null,text(body.verification_status,60)||'needs_review',userId,text(body.verification_status)==='verified'?new Date().toISOString():null,text(body.notes)||null,userId).run();
  return { target_type:'packaging_formula_link', target_key:sourceKey };
}

async function lockPackagingVersion(db, body, userId) {
  const projectId = int(body.packaging_project_id);
  const versionId = int(body.packaging_project_version_id);
  const checksum = text(body.version_checksum,256);
  if (!projectId || !versionId || !checksum) throw new Error('Packaging project, version and checksum are required.');
  await db.prepare(`INSERT INTO packaging_release_locks (packaging_project_id,packaging_project_version_id,lock_status,version_checksum,physical_proof_reference,lock_reason,locked_by_user_id,locked_at,updated_at) VALUES (?,?,'locked',?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(packaging_project_id,packaging_project_version_id) DO UPDATE SET lock_status='locked',version_checksum=excluded.version_checksum,physical_proof_reference=excluded.physical_proof_reference,lock_reason=excluded.lock_reason,locked_by_user_id=excluded.locked_by_user_id,locked_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP`)
    .bind(projectId,versionId,checksum,text(body.physical_proof_reference,1000)||null,text(body.lock_reason)||'Approved packaging version locked.',userId).run();
  return { target_type:'packaging_release_lock', target_id:versionId };
}

async function savePrepressCheck(db, body, userId) {
  const projectId = int(body.packaging_project_id);
  if (!projectId) throw new Error('Packaging project is required.');
  const checks = ['text_fit_status','region_overflow_status','barcode_destination_status','qr_destination_status','font_embedding_status'];
  const failures = checks.filter((key) => ['failed','blocked','invalid','overflow'].includes(text(body[key],60)));
  const warnings = checks.filter((key) => ['warning','needs_review','not_checked'].includes(text(body[key],60)));
  const status = failures.length ? 'failed' : warnings.length ? 'needs_review' : 'passed';
  const result = await db.prepare(`INSERT INTO packaging_prepress_checks (packaging_project_id,packaging_project_version_id,check_status,page_width_mm,page_height_mm,bleed_mm,safe_margin_mm,text_fit_status,region_overflow_status,barcode_destination_status,qr_destination_status,font_embedding_status,blocker_count,warning_count,result_json,checked_by_user_id,checked_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`)
    .bind(projectId,int(body.packaging_project_version_id)||null,status,number(body.page_width_mm)||null,number(body.page_height_mm)||null,number(body.bleed_mm)||null,number(body.safe_margin_mm)||null,text(body.text_fit_status,60)||'not_checked',text(body.region_overflow_status,60)||'not_checked',text(body.barcode_destination_status,60)||'not_applicable',text(body.qr_destination_status,60)||'not_applicable',text(body.font_embedding_status,60)||'not_checked',failures.length,warnings.length,jsonText(body.result,{}),userId).run();
  return { target_type:'packaging_prepress_check', target_id:Number(result?.meta?.last_row_id || 0), check_status:status };
}

async function saveProviderResult(db, body, userId) {
  const provider = text(body.provider_name,120);
  const action = text(body.provider_action,120);
  if (!provider || !action) throw new Error('Provider and action are required.');
  const result = await db.prepare(`INSERT INTO provider_result_reconciliations (provider_name,provider_action,local_reference_type,local_reference_id,provider_reference_id,provider_result_url,reconciliation_status,expected_json,actual_json,checked_by_user_id,checked_at,notes) VALUES (?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,?)`)
    .bind(provider,action,text(body.local_reference_type,100)||null,int(body.local_reference_id)||null,text(body.provider_reference_id,300)||null,text(body.provider_result_url,1000)||null,text(body.reconciliation_status,60)||'needs_review',jsonText(body.expected,{}),jsonText(body.actual,{}),userId,text(body.notes)||null).run();
  return { target_type:'provider_reconciliation', target_id:Number(result?.meta?.last_row_id || 0) };
}

async function saveNotificationAttempt(db, body) {
  const result = await db.prepare(`INSERT INTO notification_delivery_attempts (notification_outbox_id,provider_name,attempt_number,attempt_status,provider_message_id,provider_status_code,retry_after_at,safe_response_json,error_text,attempted_at) VALUES (?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`)
    .bind(int(body.notification_outbox_id)||null,text(body.provider_name,120)||null,Math.max(1,int(body.attempt_number)||1),text(body.attempt_status,60)||'queued',text(body.provider_message_id,300)||null,text(body.provider_status_code,100)||null,text(body.retry_after_at,80)||null,jsonText(body.safe_response,{}),text(body.error_text)||null).run();
  return { target_type:'notification_attempt', target_id:Number(result?.meta?.last_row_id || 0) };
}

async function saveMobileDraft(db, body, userId) {
  const key = text(body.draft_key,220) || nowKey('mobile-evidence');
  const kind = text(body.evidence_kind,100);
  if (!kind) throw new Error('Evidence kind is required.');
  await db.prepare(`INSERT INTO mobile_evidence_drafts (draft_key,evidence_kind,related_type,related_id,draft_status,local_created_at,exif_review_status,privacy_review_status,rights_status,r2_object_key,derivative_status,unsynced_reason,payload_json,created_by_user_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT(draft_key) DO UPDATE SET draft_status=excluded.draft_status,exif_review_status=excluded.exif_review_status,privacy_review_status=excluded.privacy_review_status,rights_status=excluded.rights_status,r2_object_key=excluded.r2_object_key,derivative_status=excluded.derivative_status,unsynced_reason=excluded.unsynced_reason,payload_json=excluded.payload_json,updated_at=CURRENT_TIMESTAMP`)
    .bind(key,kind,text(body.related_type,100)||null,int(body.related_id)||null,text(body.draft_status,60)||'local_pending',text(body.local_created_at,80)||new Date().toISOString(),text(body.exif_review_status,60)||'not_checked',text(body.privacy_review_status,60)||'needs_review',text(body.rights_status,60)||'needs_review',text(body.r2_object_key,800)||null,text(body.derivative_status,60)||'not_started',text(body.unsynced_reason)||null,jsonText(body.payload,{}),userId).run();
  return { target_type:'mobile_evidence_draft', target_key:key };
}

async function saveAssetCheck(db, body) {
  const assetUrl = text(body.asset_url,1200);
  if (!assetUrl) throw new Error('Asset URL is required.');
  const result = await db.prepare(`INSERT INTO deployed_asset_check_results (asset_url,page_path,check_status,http_status,content_type,width_px,height_px,byte_size,load_time_ms,duplicate_hash,structured_data_exposure,checked_at,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,?)`)
    .bind(assetUrl,text(body.page_path,500)||null,text(body.check_status,60)||'not_run',int(body.http_status)||null,text(body.content_type,180)||null,int(body.width_px)||null,int(body.height_px)||null,int(body.byte_size)||null,int(body.load_time_ms)||null,text(body.duplicate_hash,256)||null,Number(body.structured_data_exposure)===1?1:0,text(body.notes)||null).run();
  return { target_type:'deployed_asset_check', target_id:Number(result?.meta?.last_row_id || 0) };
}

async function generateMediaRoles(db) {
  const products = await all(db, `SELECT product_id FROM products WHERE status IN ('active','draft') ORDER BY product_id LIMIT 500`);
  const roles = [['feature','Featured / primary',10],['detail','Detail / finish',20],['scale','Scale / dimensions',30],['packaging','Packaging / care',40]];
  let written = 0;
  for (const product of products) for (const [key,label,sortOrder] of roles) {
    await db.prepare(`INSERT OR IGNORE INTO product_media_role_requirements (product_id,role_key,role_label,requirement_status,rights_status,phone_review_status,desktop_review_status,sort_order,created_at,updated_at) VALUES (?,?,?,'missing','needs_review','unchecked','unchecked',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`)
      .bind(product.product_id,key,label,sortOrder).run(); written += 1;
  }
  return { target_type:'product_media_roles', generated:written, product_count:products.length };
}

async function saveSupportInteraction(db, body, userId) {
  const summaryText = text(body.summary_text);
  if (!summaryText) throw new Error('Support summary is required.');
  const result = await db.prepare(`INSERT INTO customer_support_interactions (customer_reference,interaction_channel,interaction_type,interaction_status,related_order_id,related_product_id,consent_status,summary_text,next_action_text,follow_up_at,created_by_user_id,assigned_to_user_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`)
    .bind(text(body.customer_reference,180)||null,text(body.interaction_channel,60)||'email',text(body.interaction_type,80)||'question',text(body.interaction_status,60)||'open',int(body.related_order_id)||null,int(body.related_product_id)||null,text(body.consent_status,60)||'private',summaryText,text(body.next_action_text)||null,text(body.follow_up_at,80)||null,userId,int(body.assigned_to_user_id)||userId).run();
  return { target_type:'support_interaction', target_id:Number(result?.meta?.last_row_id || 0) };
}

async function seedAccountingClose(db, body) {
  const period = text(body.period_key,40) || new Date().toISOString().slice(0,7);
  const items = [
    ['bank_reconciliation','Bank and payment-provider reconciliation'],['sales_tax','GST/HST sales-tax review'],['inventory','Inventory movement and valuation review'],['refunds','Refund, credit-note and fee review'],['expenses','Expense, receipt and vendor review'],['journal','Journal and suspense-account review'],['documents','Invoice/receipt/packing-slip sequence review'],['backup','D1/R2/export backup evidence']
  ];
  for (const [key,label] of items) await db.prepare(`INSERT OR IGNORE INTO accounting_close_checklist_items (period_key,checklist_key,checklist_label,checklist_status,created_at,updated_at) VALUES (?,?,?,'needs_review',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(period,key,label).run();
  return { target_type:'accounting_close', target_key:period, item_count:items.length };
}

async function createBatchApproval(db, body, userId) {
  const risk = text(body.risk_level,40)||'low';
  if (risk !== 'low') throw new Error('Build 240 batch creation is restricted to low-risk items.');
  const key = text(body.batch_key,220)||nowKey('low-risk-batch');
  const ids = safeJson(body.item_ids,[]);
  if (!Array.isArray(ids)) throw new Error('Item IDs must be an array.');
  const result = await db.prepare(`INSERT INTO controlled_batch_approvals (batch_key,batch_type,risk_level,batch_status,item_count,criteria_json,item_ids_json,rollback_json,notes,created_by_user_id,created_at,updated_at) VALUES (?,?,'low','review',?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`)
    .bind(key,text(body.batch_type,100)||'low_risk_review',ids.length,jsonText(body.criteria,{}),JSON.stringify(ids.slice(0,500)),jsonText(body.rollback,{}),text(body.notes)||null,userId).run();
  return { target_type:'controlled_batch_approval', target_id:Number(result?.meta?.last_row_id || 0), target_key:key };
}

async function saveSeoObservation(db, body, userId) {
  const pagePath = text(body.page_path,500);
  const date = text(body.snapshot_date,20)||new Date().toISOString().slice(0,10);
  if (!pagePath) throw new Error('Page path is required.');
  await db.prepare(`INSERT INTO local_seo_observation_snapshots (snapshot_date,page_path,target_location,target_query,search_console_clicks,search_console_impressions,average_position,business_profile_actions,review_count,average_rating,conversion_count,notes,source_status,created_by_user_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(snapshot_date,page_path,target_location,target_query) DO UPDATE SET search_console_clicks=excluded.search_console_clicks,search_console_impressions=excluded.search_console_impressions,average_position=excluded.average_position,business_profile_actions=excluded.business_profile_actions,review_count=excluded.review_count,average_rating=excluded.average_rating,conversion_count=excluded.conversion_count,notes=excluded.notes,source_status=excluded.source_status`)
    .bind(date,pagePath,text(body.target_location,180)||'Southern Ontario',text(body.target_query,300)||'',number(body.search_console_clicks),number(body.search_console_impressions),number(body.average_position)||null,number(body.business_profile_actions),int(body.review_count)||null,number(body.average_rating)||null,number(body.conversion_count),text(body.notes)||null,text(body.source_status,60)||'manual',userId).run();
  return { target_type:'local_seo_observation', target_key:`${date}:${pagePath}` };
}

async function importPageAudits(db, body) {
  const buildLabel = text(body.build_label,60)||BUILD_LABEL;
  const auditRows = safeJson(body.rows,[]);
  if (!Array.isArray(auditRows) || !auditRows.length) throw new Error('Audit rows are required.');
  let written=0;
  for (const row of auditRows.slice(0,300)) {
    const pagePath=text(row.page_path,500); if(!pagePath)continue;
    await db.prepare(`INSERT INTO public_page_audit_results (build_label,page_path,audit_status,h1_count,title_text,meta_description_text,canonical_url,internal_link_count,image_count,missing_alt_count,missing_asset_count,structured_data_count,mobile_overflow_status,notes,audited_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(build_label,page_path) DO UPDATE SET audit_status=excluded.audit_status,h1_count=excluded.h1_count,title_text=excluded.title_text,meta_description_text=excluded.meta_description_text,canonical_url=excluded.canonical_url,internal_link_count=excluded.internal_link_count,image_count=excluded.image_count,missing_alt_count=excluded.missing_alt_count,missing_asset_count=excluded.missing_asset_count,structured_data_count=excluded.structured_data_count,mobile_overflow_status=excluded.mobile_overflow_status,notes=excluded.notes,audited_at=CURRENT_TIMESTAMP`)
      .bind(buildLabel,pagePath,text(row.audit_status,40)||'not_run',Math.max(0,int(row.h1_count)),text(row.title_text,300)||null,text(row.meta_description_text,500)||null,text(row.canonical_url,1000)||null,Math.max(0,int(row.internal_link_count)),Math.max(0,int(row.image_count)),Math.max(0,int(row.missing_alt_count)),Math.max(0,int(row.missing_asset_count)),Math.max(0,int(row.structured_data_count)),text(row.mobile_overflow_status,60)||'not_checked',text(row.notes)||null).run();
    written+=1;
  }
  return { target_type:'public_page_audits', imported:written, build_label:buildLabel };
}

async function verifyFallback(db, body, userId) {
  const route = text(body.route_path,500);
  if (!route) throw new Error('Route path is required.');
  await db.prepare(`UPDATE route_fallback_policies SET fallback_status=?,last_verified_at=CURRENT_TIMESTAMP,verified_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE route_path=?`)
    .bind(text(body.fallback_status,60)||'active',userId,route).run();
  return { target_type:'route_fallback_policy', target_key:route };
}

const actions = {
  update_workstream: updateWorkstream,
  create_evidence_case: createEvidenceCase,
  append_evidence_event: appendEvidenceEvent,
  claim_idempotency: claimIdempotency,
  create_packaging_reservation: createPackagingReservation,
  change_packaging_reservation: changePackagingReservation,
  save_formula_link: saveFormulaLink,
  lock_packaging_version: lockPackagingVersion,
  save_prepress_check: savePrepressCheck,
  save_provider_result: saveProviderResult,
  save_notification_attempt: saveNotificationAttempt,
  save_mobile_draft: saveMobileDraft,
  save_asset_check: saveAssetCheck,
  generate_media_roles: generateMediaRoles,
  save_support_interaction: saveSupportInteraction,
  seed_accounting_close: seedAccountingClose,
  create_batch_approval: createBatchApproval,
  save_seo_observation: saveSeoObservation,
  import_page_audits: importPageAudits,
  verify_fallback: verifyFallback
};

export async function onRequest(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok:false, error:'Admin authentication is required.' }, 401);
  if (!db) return json({ ok:false, error:'D1 binding is unavailable. No operational status is being inferred.' }, 503);
  try {
    if (!(await schemaReady(db))) return json({ ok:false, error:'Build 240 schema is not applied. Back up D1 and apply database_build240_operational_evidence_continuity.sql.' }, 503);
    if (request.method === 'GET') return json({ ok:true, build_label:BUILD_LABEL, ...(await summary(db)) });
    if (request.method !== 'POST') return json({ ok:false, error:'Method not allowed.' }, 405);
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return json({ ok:false, error:'A JSON request body is required.' }, 400);
    const action = text(body.action,100);
    const handler = actions[action];
    if (!handler) return json({ ok:false, error:'Unsupported operational action.' }, 400);
    const result = await handler(db, body, adminUser.user_id);
    await auditAdminAction(env, request, adminUser, { action_type:`operational_continuity_${action}`, target_type:result?.target_type||'operational_continuity', target_id:result?.target_id||null, target_key:result?.target_key||null, details:{ duplicate:Boolean(result?.duplicate), build_label:BUILD_LABEL } });
    return json({ ok:true, message:'Operational continuity record saved.', result, ...(await summary(db)) });
  } catch (error) {
    await captureRuntimeIncident(env, request, { incident_scope:'operational_continuity', incident_code:'build240_action_failed', severity:'warning', message:text(error?.message,800)||'Operational continuity action failed.', related_user_id:adminUser.user_id, details:{ method:request.method } });
    return json({ ok:false, error:text(error?.message,800)||'Operational continuity request failed. No success was inferred.' }, 500);
  }
}
