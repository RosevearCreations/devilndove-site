import { normalizeText } from '../_lib/adminAudit.js';

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

export function cleanAttachmentKind(value) {
  const raw = normalizeText(value).toLowerCase();
  return ['bill', 'receipt', 'statement', 'workpaper', 'other'].includes(raw) ? raw : 'other';
}

export function buildAccountingAttachmentPublicUrl(env, objectKey) {
  const base = normalizeText(env.ACCOUNTING_ATTACHMENTS_PUBLIC_BASE_URL || env.PRODUCT_MEDIA_PUBLIC_BASE_URL || env.R2_PUBLIC_BASE_URL || env.PUBLIC_R2_BASE_URL);
  if (!base) return null;
  return `${base.replace(/\/$/, '')}/${String(objectKey || '').replace(/^\/+/, '')}`;
}

export async function ensureAccountingAttachmentsTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS accounting_attachments (
      accounting_attachment_id INTEGER PRIMARY KEY AUTOINCREMENT,
      attachment_kind TEXT NOT NULL DEFAULT 'other',
      storage_provider TEXT NOT NULL DEFAULT 'r2',
      bucket_name TEXT,
      object_key TEXT NOT NULL UNIQUE,
      public_url TEXT,
      original_filename TEXT,
      mime_type TEXT,
      file_size_bytes INTEGER NOT NULL DEFAULT 0,
      expense_id INTEGER,
      vendor_id INTEGER,
      reconciliation_type TEXT,
      period_month TEXT,
      tax_year TEXT,
      statement_reference TEXT,
      notes TEXT,
      created_by_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  try { await db.prepare(`CREATE INDEX IF NOT EXISTS idx_accounting_attachments_expense ON accounting_attachments(expense_id, created_at DESC)`).run(); } catch {}
  try { await db.prepare(`CREATE INDEX IF NOT EXISTS idx_accounting_attachments_vendor ON accounting_attachments(vendor_id, created_at DESC)`).run(); } catch {}
  try { await db.prepare(`CREATE INDEX IF NOT EXISTS idx_accounting_attachments_period ON accounting_attachments(period_month, tax_year, reconciliation_type, attachment_kind)`).run(); } catch {}
}

export async function listAccountingAttachments(db, { expenseId = 0, vendorId = 0, reconciliationType = '', periodMonth = '', taxYear = '', limit = 50 } = {}) {
  await ensureAccountingAttachmentsTable(db);
  const safeLimit = Math.max(1, Math.min(200, Number(limit || 50) || 50));
  const type = normalizeText(reconciliationType).toLowerCase();
  const result = await db.prepare(`
    SELECT accounting_attachment_id, attachment_kind, storage_provider, bucket_name, object_key, public_url,
           original_filename, mime_type, file_size_bytes, expense_id, vendor_id,
           reconciliation_type, period_month, tax_year, statement_reference, notes,
           created_by_user_id, created_at, updated_at
    FROM accounting_attachments
    WHERE (? = 0 OR expense_id = ?)
      AND (? = 0 OR vendor_id = ?)
      AND (? = '' OR reconciliation_type = ?)
      AND (? = '' OR period_month = ?)
      AND (? = '' OR tax_year = ?)
    ORDER BY created_at DESC, accounting_attachment_id DESC
    LIMIT ?
  `).bind(
    Number(expenseId || 0), Number(expenseId || 0),
    Number(vendorId || 0), Number(vendorId || 0),
    type, type,
    String(periodMonth || '').trim(), String(periodMonth || '').trim(),
    String(taxYear || '').trim(), String(taxYear || '').trim(),
    safeLimit
  ).all().catch(() => ({ results: [] }));

  return rows(result).map((row) => ({
    accounting_attachment_id: Number(row.accounting_attachment_id || 0),
    attachment_kind: row.attachment_kind || 'other',
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
    notes: row.notes || '',
    created_by_user_id: row.created_by_user_id == null ? null : Number(row.created_by_user_id || 0),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  }));
}
