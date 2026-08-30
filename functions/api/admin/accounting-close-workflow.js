// File: /functions/api/admin/accounting-close-workflow.js
// Brief description: Consolidated payment application, HST/GST review, month-end close, and accountant export workflow.

import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { ensureAccountingPeriodClosuresTable, monthValue, normalizeChecklistPayload } from './_accountingPeriods.js';
import { queueNotification } from '../_lib/notificationOutbox.js';
import { readAccountingCloseWorkflow } from '../_lib/accountingCloseWorkflowReadService.js';

function clean(value, limit = 1200) { const text = normalizeText(value); return text.length > limit ? text.slice(0, limit).trim() : text; }
function cents(value) { const n = Number(value); return Number.isFinite(n) ? Math.round(n) : 0; }
function boolInt(value) { return value === true || value === 1 || value === '1' || String(value || '').toLowerCase() === 'true' ? 1 : 0; }
async function tableColumnSet(db, tableName) {
  try { const result = await db.prepare(`PRAGMA table_info(${tableName})`).all(); return new Set((Array.isArray(result?.results) ? result.results : []).map((row) => String(row.name || '').toLowerCase()).filter(Boolean)); } catch { return new Set(); }
}
async function tableIndexSet(db, tableName) {
  try { const result = await db.prepare(`PRAGMA index_list(${tableName})`).all(); return new Set((Array.isArray(result?.results) ? result.results : []).map((row) => String(row.name || '').trim()).filter(Boolean)); } catch { return new Set(); }
}
function csvCell(value) { return `"${String(value ?? '').replace(/"/g, '""')}"`; }
function csvLine(values) { return values.map(csvCell).join(','); }
function csvResponse(text, filename) {
  return new Response(text, { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'no-store' } });
}

function textEncoder() { return new TextEncoder(); }
function crc32(bytes) {
  let crc = ~0;
  for (let i = 0; i < bytes.length; i += 1) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (~crc) >>> 0;
}
function u16(value) { return [value & 255, (value >>> 8) & 255]; }
function u32(value) { return [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]; }
function dosDateTime(date = new Date()) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const d = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time, date: d };
}
function bytesFromFile(file, encoder) {
  if (file?.bytes instanceof Uint8Array) return file.bytes;
  if (file?.bytes instanceof ArrayBuffer) return new Uint8Array(file.bytes);
  return encoder.encode(file?.content || '');
}
function buildZip(files) {
  const encoder = textEncoder();
  const chunks = [];
  const central = [];
  let offset = 0;
  const stamp = dosDateTime();
  for (const file of files) {
    const safeName = String(file.name || 'file.txt').replace(/^\/+/, '').replace(/\.\./g, '.');
    const nameBytes = encoder.encode(safeName);
    const dataBytes = bytesFromFile(file, encoder);
    const crc = crc32(dataBytes);
    const local = new Uint8Array([
      ...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(stamp.time), ...u16(stamp.date), ...u32(crc), ...u32(dataBytes.length), ...u32(dataBytes.length), ...u16(nameBytes.length), ...u16(0)
    ]);
    chunks.push(local, nameBytes, dataBytes);
    central.push({ nameBytes, crc, size: dataBytes.length, offset, time: stamp.time, date: stamp.date });
    offset += local.length + nameBytes.length + dataBytes.length;
  }
  const centralStart = offset;
  for (const file of central) {
    const entry = new Uint8Array([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(file.time), ...u16(file.date), ...u32(file.crc), ...u32(file.size), ...u32(file.size), ...u16(file.nameBytes.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(file.offset)
    ]);
    chunks.push(entry, file.nameBytes);
    offset += entry.length + file.nameBytes.length;
  }
  const centralSize = offset - centralStart;
  chunks.push(new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(central.length), ...u16(central.length), ...u32(centralSize), ...u32(centralStart), ...u16(0)]));
  return new Blob(chunks, { type: 'application/zip' });
}
function zipResponse(blob, filename) {
  return new Response(blob, { status: 200, headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'no-store' } });
}
function buildEvidenceIndexCsv(data) {
  const lines = [csvLine(['evidence_type','label','url_or_reference','status','mime_type','size_bytes','notes'])];
  lines.push(csvLine(['hst_gst','remittance_evidence_url',data.hst_review?.remittance_evidence_url || '', data.hst_review?.remittance_status || '', '', '', data.hst_review?.notes || '']));
  for (const row of data.export_packages || []) lines.push(csvLine(['export_package', row.package_key || row.accountant_export_package_id || '', '', row.package_status || '', '', '', row.notes || '']));
  for (const row of data.payment?.applied_rows || []) lines.push(csvLine(['payment_application', row.transaction_reference || row.accounting_payment_application_id || '', row.provider || '', row.application_status || '', '', '', row.application_notes || '']));
  for (const row of data.evidence_attachments || []) lines.push(csvLine(['attachment_file', row.title || row.original_filename || row.accounting_evidence_attachment_id || '', row.evidence_url || row.object_key || '', row.attachment_status || 'active', row.mime_type || '', row.file_size_bytes || 0, row.evidence_kind || '']));
  return `${lines.join('\n')}\n`;
}
function safeAttachmentName(row, suffix = '') {
  const base = String(row.original_filename || row.title || row.accounting_evidence_attachment_id || 'evidence').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120) || 'evidence';
  return suffix ? `${base}${suffix}` : base;
}
function mimeIsBundleSafe(mime) {
  const m = String(mime || '').toLowerCase();
  return m === 'application/pdf' || m.startsWith('image/');
}
function evidenceBundleSummary(data, includeBinaryEvidence, env = {}) {
  const max = Math.min(Math.max(Number(env.ACCOUNTANT_EVIDENCE_MAX_BYTES || 5242880) || 5242880, 1), 26214400);
  const fetchEnabled = String(env.ACCOUNTANT_EVIDENCE_R2_FETCH_ENABLED || '').toLowerCase() === 'true';
  const rows = data.evidence_attachments || [];
  const warnings = [];
  let binary_count = 0; let binary_bytes = 0; let url_only_count = 0;
  for (const row of rows) {
    const size = Number(row.file_size_bytes || 0) || 0;
    if (!row.object_key) { warnings.push(`${row.title || row.original_filename || row.accounting_evidence_attachment_id}: skipped binary bundle because no R2 object_key is stored.`); url_only_count += 1; continue; }
    if (!mimeIsBundleSafe(row.mime_type)) { warnings.push(`${row.title || row.original_filename || row.accounting_evidence_attachment_id}: skipped binary bundle because mime type is not PDF/image (${row.mime_type || 'unknown'}).`); url_only_count += 1; continue; }
    if (size > max) { warnings.push(`${row.title || row.original_filename || row.accounting_evidence_attachment_id}: skipped binary bundle because ${size} bytes exceeds ${max} byte limit.`); url_only_count += 1; continue; }
    binary_count += 1; binary_bytes += size;
  }
  if (includeBinaryEvidence && !fetchEnabled) warnings.push('Binary receipt bundling was requested, but ACCOUNTANT_EVIDENCE_R2_FETCH_ENABLED is not true. URL reference files were included instead.');
  return { total_attachments: rows.length, binary_fetch_enabled: fetchEnabled, binary_requested: !!includeBinaryEvidence, binary_safe_count: binary_count, binary_safe_bytes: binary_bytes, url_only_count, max_bytes_per_file: max, warnings };
}
async function fetchEvidenceBytes(context, row, summary) {
  const bucket = context.env.ACCOUNTING_EVIDENCE_BUCKET || context.env.MEDIA_BUCKET || context.env.PRODUCT_MEDIA_BUCKET || context.env.R2_PRODUCT_MEDIA;
  if (!bucket || !row.object_key || !summary.binary_fetch_enabled || !mimeIsBundleSafe(row.mime_type)) return null;
  const size = Number(row.file_size_bytes || 0) || 0;
  if (size > summary.max_bytes_per_file) return null;
  const object = await bucket.get(row.object_key).catch(() => null);
  if (!object) return null;
  const buffer = await object.arrayBuffer();
  return new Uint8Array(buffer);
}
async function buildAccountantZip(context, data, includeBinaryEvidence = false) {
  const summary = evidenceBundleSummary(data, includeBinaryEvidence, context.env || {});
  const manifest = {
    package: 'Devil n Dove accountant export',
    period_month: data.period_month,
    generated_at: new Date().toISOString(),
    close_readiness: data.close_readiness,
    evidence_bundle_summary: summary,
    included_files: ['close-summary.csv', 'evidence-index.csv', 'manifest.json', 'evidence-bundle-warnings.txt'],
    note: 'Text/CSV accountant package. Binary PDF/image receipts are included only when R2 fetch is explicitly enabled.'
  };
  const files = [
    { name: 'close-summary.csv', content: buildCloseCsv(data) },
    { name: 'evidence-index.csv', content: buildEvidenceIndexCsv(data) },
    { name: 'evidence-bundle-warnings.txt', content: (summary.warnings.length ? summary.warnings.join('\n') : 'No evidence bundle warnings.') + '\n' },
    { name: 'manifest.json', content: JSON.stringify(manifest, null, 2) + '\n' }
  ];
  for (const row of data.evidence_attachments || []) {
    const safe = safeAttachmentName(row);
    files.push({ name: `attachments/references/${safe}.url.txt`, content: `Title: ${row.title || ''}\nKind: ${row.evidence_kind || ''}\nURL: ${row.evidence_url || ''}\nObject key: ${row.object_key || ''}\nMime type: ${row.mime_type || ''}\nSize bytes: ${row.file_size_bytes || 0}\nStatus: ${row.attachment_status || ''}\nUploaded: ${row.created_at || ''}\n` });
    if (includeBinaryEvidence) {
      const bytes = await fetchEvidenceBytes(context, row, summary).catch(() => null);
      if (bytes) files.push({ name: `attachments/binary/${safe}`, bytes });
    }
  }
  return buildZip(files);
}

function buildCloseCsv(data) {
  const lines = [];
  lines.push(csvLine(['section','field','value','notes']));
  lines.push(csvLine(['period','period_month',data.period_month || '', '']));
  lines.push(csvLine(['payment','order_count',data.payment?.summary?.order_count || 0, '']));
  lines.push(csvLine(['payment','total_cents',data.payment?.summary?.total_cents || 0, '']));
  lines.push(csvLine(['payment','paid_cents',data.payment?.summary?.paid_cents || 0, '']));
  lines.push(csvLine(['payment','outstanding_cents',data.payment?.summary?.outstanding_cents || 0, '']));
  lines.push(csvLine(['hst_gst','review_status',data.hst_review?.review_status || '', '']));
  lines.push(csvLine(['hst_gst','sales_tax_collected_cents',data.hst_review?.sales_tax_collected_cents || 0, '']));
  lines.push(csvLine(['hst_gst','input_tax_credit_cents',data.hst_review?.input_tax_credit_cents || 0, '']));
  lines.push(csvLine(['hst_gst','net_tax_payable_cents',data.hst_review?.net_tax_payable_cents || 0, '']));
  lines.push(csvLine(['hst_gst','filing_due_date',data.hst_review?.filing_due_date || '', '']));
  lines.push(csvLine(['hst_gst','remittance_status',data.hst_review?.remittance_status || '', '']));
  lines.push(csvLine(['hst_gst','remittance_evidence_url',data.hst_review?.remittance_evidence_url || '', '']));
  lines.push(csvLine(['hst_gst','reminder_date',data.hst_review?.reminder_date || '', '']));
  lines.push(csvLine(['close','lock_state',data.closure?.lock_state || '', '']));
  lines.push(csvLine(['close','ready',data.close_readiness?.ready ? 'yes' : 'no', (data.close_readiness?.blockers || []).join(' | ')]));
  for (const row of data.payment?.applied_rows || []) lines.push(csvLine(['payment_application', row.transaction_reference || row.accounting_payment_application_id || '', row.applied_amount_cents || 0, row.application_status || '']));
  return `${lines.join('\n')}\n`;
}

async function ensureSchema(db) {
  await ensureAccountingPeriodClosuresTable(db);
  const requirements = [
    {
      table: 'accounting_payment_applications',
      columns: ['accounting_payment_application_id','payment_id','order_id','period_month','application_status','applied_amount_cents','fee_amount_cents','tax_component_cents','provider','transaction_reference','application_notes','created_by_user_id','reviewed_by_user_id','reviewed_at','created_at','updated_at'],
      indexes: ['idx_accounting_payment_applications_period'],
    },
    {
      table: 'accounting_hst_gst_reviews',
      columns: ['accounting_hst_gst_review_id','period_month','review_status','sales_tax_collected_cents','input_tax_credit_cents','net_tax_payable_cents','filing_reference','filing_due_date','remittance_status','remittance_evidence_url','reminder_date','reviewed_by_user_id','reviewed_at','notes','created_at','updated_at'],
      indexes: ['idx_accounting_hst_gst_reviews_period'],
    },
    {
      table: 'accountant_export_packages',
      columns: ['accountant_export_package_id','package_key','period_month','tax_year','package_status','manifest_json','created_by_user_id','finalized_by_user_id','finalized_at','created_at','updated_at','notes'],
      indexes: ['idx_accountant_export_packages_period'],
    },
    {
      table: 'accounting_evidence_attachments',
      columns: ['accounting_evidence_attachment_id','period_month','evidence_kind','title','evidence_url','object_key','original_filename','mime_type','file_size_bytes','attachment_status','created_by_user_id','created_at','updated_at'],
      indexes: [],
    },
  ];
  for (const requirement of requirements) {
    const columns = await tableColumnSet(db, requirement.table);
    const missingColumns = requirement.columns.filter((name) => !columns.has(name));
    if (missingColumns.length) {
      throw new Error(`Accounting close schema is not ready: ${requirement.table} is missing ${missingColumns.join(', ')}. Apply the current Development migration authority.`);
    }
    const indexes = await tableIndexSet(db, requirement.table);
    const missingIndexes = requirement.indexes.filter((name) => !indexes.has(name));
    if (missingIndexes.length) {
      throw new Error(`Accounting close schema is not ready: ${requirement.table} is missing index ${missingIndexes.join(', ')}. Apply the current Development migration authority.`);
    }
  }
  return true;
}

async function hstReview(db, periodMonth, fallbackTaxCents = 0) {
  const row = await db.prepare(`SELECT * FROM accounting_hst_gst_reviews WHERE period_month=? LIMIT 1`).bind(periodMonth).first().catch(() => null);
  if (row) return row;
  return { period_month: periodMonth, review_status: 'draft', sales_tax_collected_cents: fallbackTaxCents, input_tax_credit_cents: 0, net_tax_payable_cents: fallbackTaxCents, filing_reference: '', filing_due_date: '', remittance_status: 'not_ready', remittance_evidence_url: '', reminder_date: '', notes: '' };
}

async function payload(db, periodMonth) {
  return readAccountingCloseWorkflow(db, { periodMonth });
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  const url = new URL(context.request.url);
  const periodMonth = monthValue(url.searchParams.get('period_month'));
  const format = clean(url.searchParams.get('format') || '', 20).toLowerCase();
  try {
    const data = await payload(db, periodMonth);
    if (format === 'csv') return csvResponse(buildCloseCsv(data), `devilndove-accounting-close-${periodMonth}.csv`);
    if (format === 'zip') return zipResponse(await buildAccountantZip(context, data, url.searchParams.get('include_binary_evidence') === '1'), `devilndove-accountant-export-${periodMonth}.zip`);
    return jsonResponse(data, 200, { 'Cache-Control': 'no-store' });
  }
  catch (error) {
    await captureRuntimeIncident(context.env, context.request, { incident_scope: 'accounting_close_workflow', incident_code: 'load_failed', severity: 'error', message: error?.message || 'Accounting close workflow failed to load.', related_user_id: adminUser.user_id, details: { error: String(error?.stack || error?.message || error), period_month: periodMonth } }).catch(() => null);
    return jsonResponse({ ok: false, error: error?.message || 'Could not load accounting close workflow.' }, 500);
  }
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  let body = {};
  try { body = await context.request.json(); } catch { return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const periodMonth = monthValue(body.period_month);
  const action = clean(body.action || '', 80).toLowerCase();
  try {
    await ensureSchema(db);
    if (action === 'save_payment_application') {
      const orderId = Number(body.order_id || 0) || null;
      await db.prepare(`INSERT INTO accounting_payment_applications (
        payment_id, order_id, period_month, application_status, applied_amount_cents, fee_amount_cents, tax_component_cents,
        provider, transaction_reference, application_notes, created_by_user_id, reviewed_by_user_id, reviewed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? IN ('reviewed','applied') THEN ? ELSE NULL END, CASE WHEN ? IN ('reviewed','applied') THEN CURRENT_TIMESTAMP ELSE NULL END, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
        Number(body.payment_id || 0) || null,
        orderId,
        periodMonth,
        clean(body.application_status || 'draft', 40).toLowerCase(),
        cents(body.applied_amount_cents),
        cents(body.fee_amount_cents),
        cents(body.tax_component_cents),
        clean(body.provider, 80) || null,
        clean(body.transaction_reference, 180) || null,
        clean(body.application_notes, 1200) || null,
        Number(adminUser.user_id || 0),
        clean(body.application_status || '').toLowerCase(),
        Number(adminUser.user_id || 0),
        clean(body.application_status || '').toLowerCase()
      ).run();
      await auditAdminAction(context.env, context.request, adminUser, { action_type: 'save_payment_application', target_type: 'accounting_payment_application', target_id: orderId, details: { period_month: periodMonth } }).catch(() => null);
      return jsonResponse({ message: 'Payment application saved.', ...(await payload(db, periodMonth)) }, 200, { 'Cache-Control': 'no-store' });
    }
    if (action === 'save_hst_review') {
      const collected = cents(body.sales_tax_collected_cents);
      const inputTax = cents(body.input_tax_credit_cents);
      const net = body.net_tax_payable_cents == null || body.net_tax_payable_cents === '' ? collected - inputTax : cents(body.net_tax_payable_cents);
      const status = clean(body.review_status || 'draft', 40).toLowerCase();
      await db.prepare(`INSERT INTO accounting_hst_gst_reviews (
        period_month, review_status, sales_tax_collected_cents, input_tax_credit_cents, net_tax_payable_cents,
        filing_reference, filing_due_date, remittance_status, remittance_evidence_url, reminder_date, reviewed_by_user_id, reviewed_at, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? IN ('reviewed','finalized','filed') THEN ? ELSE NULL END, CASE WHEN ? IN ('reviewed','finalized','filed') THEN CURRENT_TIMESTAMP ELSE NULL END, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(period_month) DO UPDATE SET review_status=excluded.review_status, sales_tax_collected_cents=excluded.sales_tax_collected_cents,
        input_tax_credit_cents=excluded.input_tax_credit_cents, net_tax_payable_cents=excluded.net_tax_payable_cents, filing_reference=excluded.filing_reference,
        filing_due_date=excluded.filing_due_date, remittance_status=excluded.remittance_status, remittance_evidence_url=excluded.remittance_evidence_url, reminder_date=excluded.reminder_date, reviewed_by_user_id=excluded.reviewed_by_user_id,
        reviewed_at=CASE WHEN excluded.reviewed_by_user_id IS NOT NULL THEN CURRENT_TIMESTAMP ELSE accounting_hst_gst_reviews.reviewed_at END,
        notes=excluded.notes, updated_at=CURRENT_TIMESTAMP`).bind(
        periodMonth, status, collected, inputTax, net, clean(body.filing_reference, 120) || null, clean(body.filing_due_date, 20) || null, clean(body.remittance_status || 'not_ready', 40).toLowerCase(), clean(body.remittance_evidence_url, 500) || null, clean(body.reminder_date, 20) || null,
        status, Number(adminUser.user_id || 0), status, clean(body.notes, 1200) || null
      ).run();
      await auditAdminAction(context.env, context.request, adminUser, { action_type: 'save_hst_gst_review', target_type: 'accounting_hst_gst_review', target_key: periodMonth, details: { period_month: periodMonth, review_status: status } }).catch(() => null);
      return jsonResponse({ message: 'HST/GST review saved.', ...(await payload(db, periodMonth)) }, 200, { 'Cache-Control': 'no-store' });
    }
    if (action === 'queue_hst_reminder') {
      const hst = await hstReview(db, periodMonth, 0);
      const destination = clean(body.destination_email || context.env.ACCOUNTING_ALERT_EMAIL || adminUser.email || '', 254);
      if (!destination) return jsonResponse({ ok: false, error: 'No reminder destination email is available.' }, 400);
      const nextAttempt = clean(body.reminder_date || hst.reminder_date || '', 20);
      const nextAttemptAt = nextAttempt ? `${nextAttempt} 09:00:00` : null;
      const queued = await queueNotification(db, {
        notification_kind: 'hst_gst_reminder',
        channel: 'email',
        destination,
        next_attempt_at: nextAttemptAt,
        payload: {
          subject: `Devil n Dove HST/GST review reminder for ${periodMonth}`,
          period_month: periodMonth,
          review_status: hst.review_status || 'draft',
          remittance_status: hst.remittance_status || 'not_ready',
          filing_due_date: hst.filing_due_date || '',
          reminder_date: nextAttempt || '',
          net_tax_payable_cents: hst.net_tax_payable_cents || 0,
          note: 'Review HST/GST filing, evidence, and remittance status before closing the period.'
        },
        metadata: { source: 'accounting_close_workflow', period_month: periodMonth, queued_by_user_id: adminUser.user_id }
      });
      await auditAdminAction(context.env, context.request, adminUser, { action_type: 'queue_hst_gst_reminder', target_type: 'notification_outbox', target_id: queued.notification_outbox_id || null, details: { period_month: periodMonth, destination, next_attempt_at: nextAttemptAt, queued: queued.queued, suppressed: queued.suppressed } }).catch(() => null);
      return jsonResponse({ message: queued.suppressed ? `Reminder suppressed: ${queued.reason || 'cooldown/exclusion rule'}` : 'HST/GST reminder queued.', reminder: queued, ...(await payload(db, periodMonth)) }, 200, { 'Cache-Control': 'no-store' });
    }
    if (action === 'save_close_checklist') {
      const checklist = normalizeChecklistPayload({
        bank_reconciled: boolInt(body.bank_reconciled),
        sales_tax_reviewed: boolInt(body.sales_tax_reviewed),
        receipts_attached: boolInt(body.receipts_attached),
        gifi_reviewed: boolInt(body.gifi_reviewed),
        schedule_141_notes_started: boolInt(body.schedule_141_notes_started),
        accountant_followup_flagged: boolInt(body.accountant_followup_flagged),
      });
      await db.prepare(`INSERT INTO accounting_period_closures (period_month, lock_state, close_checklist_json, close_notes, created_at, updated_at)
        VALUES (?, 'open', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(period_month) DO UPDATE SET close_checklist_json=excluded.close_checklist_json, close_notes=excluded.close_notes, updated_at=CURRENT_TIMESTAMP`).bind(periodMonth, JSON.stringify(checklist), clean(body.close_notes, 1200) || null).run();
      await auditAdminAction(context.env, context.request, adminUser, { action_type: 'save_month_end_close_checklist', target_type: 'accounting_period_closure', target_key: periodMonth, details: { period_month: periodMonth, checklist } }).catch(() => null);
      return jsonResponse({ message: 'Month-end close checklist saved.', ...(await payload(db, periodMonth)) }, 200, { 'Cache-Control': 'no-store' });
    }
    if (action === 'create_export_manifest') {
      const current = await payload(db, periodMonth);
      const taxYear = periodMonth.slice(0, 4);
      const key = clean(body.package_key || `acct_${periodMonth}_${Date.now()}`, 120);
      const manifest = {
        period_month: periodMonth,
        tax_year: taxYear,
        created_at: new Date().toISOString(),
        close_readiness: current.close_readiness,
        payment_summary: current.payment.summary,
        hst_review: current.hst_review,
        closure: current.closure,
        recommended_files: ['general-ledger CSV', 'orders/payments CSV', 'expense receipts', 'HST/GST worksheet', 'bank/payment processor statements', 'month-end close checklist'],
        downloadable_summary_csv: `/api/admin/accounting-close-workflow?period_month=${periodMonth}&format=csv`,
        downloadable_accountant_zip: `/api/admin/accounting-close-workflow?period_month=${periodMonth}&format=zip`,
        evidence_index_csv: `/api/admin/accounting-close-workflow?period_month=${periodMonth}&format=zip#evidence-index.csv`
      };
      await db.prepare(`INSERT INTO accountant_export_packages (package_key, period_month, tax_year, package_status, manifest_json, created_by_user_id, created_at, updated_at, notes)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)
        ON CONFLICT(package_key) DO UPDATE SET package_status=excluded.package_status, manifest_json=excluded.manifest_json, updated_at=CURRENT_TIMESTAMP, notes=excluded.notes`).bind(
        key, periodMonth, taxYear, clean(body.package_status || 'draft', 40).toLowerCase(), JSON.stringify(manifest), Number(adminUser.user_id || 0), clean(body.notes || 'Accountant export manifest generated from close workflow.', 1200) || null
      ).run();
      await auditAdminAction(context.env, context.request, adminUser, { action_type: 'create_accountant_export_manifest', target_type: 'accountant_export_package', target_key: key, details: { period_month: periodMonth, tax_year: taxYear } }).catch(() => null);
      return jsonResponse({ message: 'Accountant export manifest created.', manifest, ...(await payload(db, periodMonth)) }, 200, { 'Cache-Control': 'no-store' });
    }
    return jsonResponse({ ok: false, error: 'Unknown accounting close workflow action.' }, 400);
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, { incident_scope: 'accounting_close_workflow', incident_code: 'save_failed', severity: 'error', message: error?.message || 'Accounting close workflow save failed.', related_user_id: adminUser.user_id, details: { error: String(error?.stack || error?.message || error), action, period_month: periodMonth } }).catch(() => null);
    return jsonResponse({ ok: false, error: error?.message || 'Could not save accounting close workflow.' }, 500);
  }
}
