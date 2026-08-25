// Devil n Dove Build 330 — Accounting-owned non-mutating attachment metadata read service.

export const BUILD = 330;
export const CONTRACT_ID = 'accounting-attachments-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLE = 'accounting_attachments';

const REQUIRED_COLUMNS = Object.freeze([
  'accounting_attachment_id','attachment_kind','attachment_status','attachment_scope','document_date','scope_key','provider_scope',
  'storage_provider','bucket_name','object_key','public_url','original_filename','mime_type','file_size_bytes','expense_id','vendor_id',
  'reconciliation_type','period_month','tax_year','statement_reference','statement_gross_cents','statement_fee_cents','statement_net_cents',
  'statement_tax_cents','statement_shipping_cents','statement_txn_count','statement_period_start','statement_period_end','statement_detail_json',
  'notes','created_by_user_id','created_at','updated_at'
]);

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function text(value) { return String(value ?? '').trim(); }
function boundedLimit(value) { const n = Number(value); return Math.max(1, Math.min(500, Number.isFinite(n) ? Math.trunc(n) : 50)); }
function cleanKind(value) { const raw = text(value).toLowerCase(); return ['bill','receipt','statement','workpaper','other'].includes(raw) ? raw : 'other'; }
function cleanScope(value) { const raw = text(value).toLowerCase(); return ['bill_support','receipt_support','statement_support','workpaper_support','other'].includes(raw) ? raw : 'other'; }
async function tableExists(db) { try { const row = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(AUTHORITY_TABLE).first(); return Boolean(row?.name); } catch { return false; } }
async function tableColumns(db) { try { const result = await db.prepare(`PRAGMA table_info(${AUTHORITY_TABLE})`).all(); return new Set(rows(result).map((row) => text(row?.name)).filter(Boolean)); } catch { return new Set(); } }
function money(value) { const n = Number(value); return Number.isFinite(n) ? Math.round(n) : 0; }
function whole(value) { const n = Number(value); return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0; }
function mapRow(row) {
  return {
    accounting_attachment_id: Number(row.accounting_attachment_id || 0), attachment_kind: row.attachment_kind || 'other', attachment_status: row.attachment_status || 'uploaded',
    attachment_scope: row.attachment_scope || 'other', document_date: row.document_date || '', scope_key: row.scope_key || '', provider_scope: row.provider_scope || '',
    storage_provider: row.storage_provider || 'r2', bucket_name: row.bucket_name || '', object_key: row.object_key || '', public_url: row.public_url || null,
    original_filename: row.original_filename || '', mime_type: row.mime_type || '', file_size_bytes: Number(row.file_size_bytes || 0),
    expense_id: row.expense_id == null ? null : Number(row.expense_id || 0), vendor_id: row.vendor_id == null ? null : Number(row.vendor_id || 0),
    reconciliation_type: row.reconciliation_type || '', period_month: row.period_month || '', tax_year: row.tax_year || '', statement_reference: row.statement_reference || '',
    statement_gross_cents: money(row.statement_gross_cents), statement_fee_cents: money(row.statement_fee_cents), statement_net_cents: money(row.statement_net_cents),
    statement_tax_cents: money(row.statement_tax_cents), statement_shipping_cents: money(row.statement_shipping_cents), statement_txn_count: whole(row.statement_txn_count),
    statement_period_start: row.statement_period_start || '', statement_period_end: row.statement_period_end || '', statement_detail_json: row.statement_detail_json || '', notes: row.notes || '',
    created_by_user_id: row.created_by_user_id == null ? null : Number(row.created_by_user_id || 0), created_at: row.created_at || null, updated_at: row.updated_at || null,
  };
}
function summarize(attachments) {
  const byKind = {}, byStatus = {}, byScope = {};
  for (const row of attachments) {
    byKind[row.attachment_kind || 'other'] = Number(byKind[row.attachment_kind || 'other'] || 0) + 1;
    byStatus[row.attachment_status || 'uploaded'] = Number(byStatus[row.attachment_status || 'uploaded'] || 0) + 1;
    byScope[row.attachment_scope || 'other'] = Number(byScope[row.attachment_scope || 'other'] || 0) + 1;
  }
  return { attachment_count: attachments.length, by_kind: byKind, by_status: byStatus, by_scope: byScope };
}
function payload(extra = {}) { return { ok: true, build: BUILD, contract: CONTRACT_ID, owner: OWNER, mode: 'read-only-accounting-attachments', authority_table: AUTHORITY_TABLE, request_time_schema_mutation: false, ...extra }; }

export async function readAccountingAttachments(db, options = {}) {
  if (!db) throw new TypeError('A D1 database binding is required.');
  if (!(await tableExists(db))) return payload({ schema_ready: false, missing_tables: [AUTHORITY_TABLE], missing_columns: [], attachments: [], count: 0, summary: summarize([]) });
  const columns = await tableColumns(db);
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !columns.has(column)).map((column) => `${AUTHORITY_TABLE}.${column}`);
  if (missingColumns.length) return payload({ schema_ready: false, missing_tables: [], missing_columns: missingColumns, attachments: [], count: 0, summary: summarize([]) });

  const expenseId = Number(options.expenseId || 0), vendorId = Number(options.vendorId || 0);
  const reconciliationType = text(options.reconciliationType).toLowerCase();
  const periodMonth = text(options.periodMonth), taxYear = text(options.taxYear), scopeKey = text(options.scopeKey);
  const rawKind = text(options.attachmentKind), attachmentKind = rawKind ? cleanKind(rawKind) : '';
  const rawScope = text(options.attachmentScope), attachmentScope = rawScope ? cleanScope(rawScope) : '';
  const providerScope = text(options.providerScope).toLowerCase();

  const result = await db.prepare(`
    SELECT accounting_attachment_id, attachment_kind, attachment_status, attachment_scope, document_date, scope_key, provider_scope,
           storage_provider, bucket_name, object_key, public_url, original_filename, mime_type, file_size_bytes, expense_id, vendor_id,
           reconciliation_type, period_month, tax_year, statement_reference, statement_gross_cents, statement_fee_cents, statement_net_cents,
           statement_tax_cents, statement_shipping_cents, statement_txn_count, statement_period_start, statement_period_end, statement_detail_json,
           notes, created_by_user_id, created_at, updated_at
    FROM accounting_attachments
    WHERE (? = 0 OR expense_id = ?) AND (? = 0 OR vendor_id = ?)
      AND (? = '' OR reconciliation_type = ?) AND (? = '' OR period_month = ?) AND (? = '' OR tax_year = ?)
      AND (? = '' OR scope_key = ?) AND (? = '' OR attachment_kind = ?) AND (? = '' OR attachment_scope = ?)
      AND (? = '' OR LOWER(COALESCE(provider_scope,'')) = ?)
    ORDER BY COALESCE(document_date, created_at) DESC, accounting_attachment_id DESC
    LIMIT ?
  `).bind(expenseId, expenseId, vendorId, vendorId, reconciliationType, reconciliationType, periodMonth, periodMonth, taxYear, taxYear, scopeKey, scopeKey, attachmentKind, attachmentKind, attachmentScope, attachmentScope, providerScope, providerScope, boundedLimit(options.limit)).all();
  const attachments = rows(result).map(mapRow);
  return payload({ schema_ready: true, missing_tables: [], missing_columns: [], attachments, count: attachments.length, summary: summarize(attachments) });
}
