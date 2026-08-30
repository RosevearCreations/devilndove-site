import { normalizeText } from '../_lib/adminAudit.js';

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

export function cleanAttachmentKind(value) {
  const raw = normalizeText(value).toLowerCase();
  return ['bill', 'receipt', 'statement', 'workpaper', 'other'].includes(raw) ? raw : 'other';
}

export function cleanAttachmentStatus(value) {
  const raw = normalizeText(value).toLowerCase();
  return ['uploaded', 'reviewed', 'needs_followup', 'linked', 'matched', 'archived'].includes(raw) ? raw : 'uploaded';
}

export function cleanAttachmentScope(value) {
  const raw = normalizeText(value).toLowerCase();
  return ['bill_support', 'receipt_support', 'statement_support', 'workpaper_support', 'other'].includes(raw) ? raw : 'other';
}

function cleanMoneyCents(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return 0;
  const num = Number(raw);
  return Number.isFinite(num) ? Math.round(num) : 0;
}

function cleanWholeNumber(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return 0;
  const num = Number(raw);
  return Number.isFinite(num) ? Math.max(0, Math.round(num)) : 0;
}

export function cleanDocumentDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  return '';
}

export function buildAccountingAttachmentPublicUrl(env, objectKey) {
  const base = normalizeText(env.ACCOUNTING_ATTACHMENTS_PUBLIC_BASE_URL || env.PRODUCT_MEDIA_PUBLIC_BASE_URL || env.R2_PUBLIC_BASE_URL || env.PUBLIC_R2_BASE_URL);
  if (!base) return null;
  return `${base.replace(/\/$/, '')}/${String(objectKey || '').replace(/^\/+/, '')}`;
}

async function tableColumns(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(rows(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function tableIndexes(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA index_list(${tableName})`).all();
    return new Set(rows(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

export async function ensureAccountingAttachmentsTable(db) {
  const columns = await tableColumns(db, 'accounting_attachments');
  const requiredColumns = [
    'accounting_attachment_id', 'attachment_kind', 'attachment_status', 'attachment_scope', 'document_date', 'scope_key', 'provider_scope',
    'storage_provider', 'bucket_name', 'object_key', 'public_url', 'original_filename', 'mime_type', 'file_size_bytes', 'expense_id', 'vendor_id',
    'reconciliation_type', 'period_month', 'tax_year', 'statement_reference', 'statement_gross_cents', 'statement_fee_cents', 'statement_net_cents',
    'statement_tax_cents', 'statement_shipping_cents', 'statement_txn_count', 'statement_period_start', 'statement_period_end', 'statement_detail_json',
    'notes', 'created_by_user_id', 'created_at', 'updated_at'
  ];
  const missingColumns = requiredColumns.filter((name) => !columns.has(name));
  if (missingColumns.length) {
    throw new Error(`Accounting attachment schema is not ready: accounting_attachments is missing ${missingColumns.join(', ')}. Apply the current Development migration authority.`);
  }
  const indexes = await tableIndexes(db, 'accounting_attachments');
  const requiredIndexes = [
    'idx_accounting_attachments_expense', 'idx_accounting_attachments_vendor',
    'idx_accounting_attachments_period', 'idx_accounting_attachments_scope'
  ];
  const missingIndexes = requiredIndexes.filter((name) => !indexes.has(name));
  if (missingIndexes.length) {
    throw new Error(`Accounting attachment schema is not ready: accounting_attachments is missing index ${missingIndexes.join(', ')}. Apply the current Development migration authority.`);
  }
  return true;
}

export async function listAccountingAttachments(db, { expenseId = 0, vendorId = 0, reconciliationType = '', periodMonth = '', taxYear = '', scopeKey = '', attachmentKind = '', attachmentScope = '', providerScope = '', limit = 50 } = {}) {
  await ensureAccountingAttachmentsTable(db);
  const safeLimit = Math.max(1, Math.min(500, Number(limit || 50) || 50));
  const type = normalizeText(reconciliationType).toLowerCase();
  const kind = cleanAttachmentKind(attachmentKind || 'other');
  const useKind = normalizeText(attachmentKind) ? kind : '';
  const scope = normalizeText(attachmentScope) ? cleanAttachmentScope(attachmentScope) : '';
  const provider = normalizeText(providerScope).toLowerCase();
  const result = await db.prepare(`
    SELECT accounting_attachment_id, attachment_kind, attachment_status, attachment_scope, document_date, scope_key, provider_scope,
           storage_provider, bucket_name, object_key, public_url,
           original_filename, mime_type, file_size_bytes, expense_id, vendor_id,
           reconciliation_type, period_month, tax_year, statement_reference,
           statement_gross_cents, statement_fee_cents, statement_net_cents, statement_tax_cents, statement_shipping_cents, statement_txn_count,
           statement_period_start, statement_period_end, statement_detail_json, notes,
           created_by_user_id, created_at, updated_at
    FROM accounting_attachments
    WHERE (? = 0 OR expense_id = ?)
      AND (? = 0 OR vendor_id = ?)
      AND (? = '' OR reconciliation_type = ?)
      AND (? = '' OR period_month = ?)
      AND (? = '' OR tax_year = ?)
      AND (? = '' OR scope_key = ?)
      AND (? = '' OR attachment_kind = ?)
      AND (? = '' OR attachment_scope = ?)
      AND (? = '' OR LOWER(COALESCE(provider_scope,'')) = ?)
    ORDER BY COALESCE(document_date, created_at) DESC, accounting_attachment_id DESC
    LIMIT ?
  `).bind(
    Number(expenseId || 0), Number(expenseId || 0),
    Number(vendorId || 0), Number(vendorId || 0),
    type, type,
    String(periodMonth || '').trim(), String(periodMonth || '').trim(),
    String(taxYear || '').trim(), String(taxYear || '').trim(),
    String(scopeKey || '').trim(), String(scopeKey || '').trim(),
    useKind, useKind,
    scope, scope,
    provider, provider,
    safeLimit
  ).all().catch(() => ({ results: [] }));

  return rows(result).map((row) => ({
    accounting_attachment_id: Number(row.accounting_attachment_id || 0),
    attachment_kind: row.attachment_kind || 'other',
    attachment_status: row.attachment_status || 'uploaded',
    attachment_scope: row.attachment_scope || 'other',
    document_date: row.document_date || '',
    scope_key: row.scope_key || '',
    provider_scope: row.provider_scope || '',
    storage_provider: row.storage_provider || 'r2',
    bucket_name: row.bucket_name || '',
    object_key: row.object_key || '',
    public_url: row.public_url || null,
    original_filename: row.original_filename || '',
    mime_type: row.mime_type || '',
    file_size_bytes: Number(row.file_size_bytes || 0),
    expense_id: row.expense_id == null ? null : Number(row.expense_id || 0),
    vendor_id: row.vendor_id == null ? null : Number(row.vendor_id || 0),
    reconciliation_type: row.reconciliation_type || '',
    period_month: row.period_month || '',
    tax_year: row.tax_year || '',
    statement_reference: row.statement_reference || '',
    statement_gross_cents: cleanMoneyCents(row.statement_gross_cents),
    statement_fee_cents: cleanMoneyCents(row.statement_fee_cents),
    statement_net_cents: cleanMoneyCents(row.statement_net_cents),
    statement_tax_cents: cleanMoneyCents(row.statement_tax_cents),
    statement_shipping_cents: cleanMoneyCents(row.statement_shipping_cents),
    statement_txn_count: cleanWholeNumber(row.statement_txn_count),
    statement_period_start: row.statement_period_start || '',
    statement_period_end: row.statement_period_end || '',
    statement_detail_json: row.statement_detail_json || '',
    notes: row.notes || '',
    created_by_user_id: row.created_by_user_id == null ? null : Number(row.created_by_user_id || 0),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  }));
}
