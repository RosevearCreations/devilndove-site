import { normalizeText } from '../_lib/adminAudit.js';

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
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

export function cleanReconciliationType(value) {
  const raw = normalizeText(value).toLowerCase();
  return ['sales_tax', 'processor_fees', 'shipping'].includes(raw) ? raw : 'sales_tax';
}

export function cleanReconciliationStatus(value) {
  const raw = normalizeText(value).toLowerCase();
  return ['draft', 'reviewed', 'needs_accountant', 'finalized'].includes(raw) ? raw : 'draft';
}

export function cleanPeriodMonth(value, fallback = '') {
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.slice(0, 7);
  if (fallback && /^\d{4}-\d{2}$/.test(String(fallback))) return String(fallback);
  return new Date().toISOString().slice(0, 7);
}

export async function ensureAccountingReconciliationReviewsTable(db) {
  const columns = await tableColumns(db, 'accounting_reconciliation_reviews');
  const requiredColumns = [
    'accounting_reconciliation_review_id', 'reconciliation_type', 'period_month', 'scope_key', 'review_status', 'note',
    'statement_reference', 'difference_reason', 'detail_json', 'attachment_count', 'statement_amount_cents', 'book_amount_cents',
    'tolerance_cents', 'expected_rate_basis_points', 'observed_rate_basis_points', 'unresolved_item_count',
    'reference_amount_cents', 'compared_amount_cents', 'difference_cents', 'created_by_user_id', 'updated_by_user_id', 'created_at', 'updated_at'
  ];
  const missingColumns = requiredColumns.filter((name) => !columns.has(name));
  if (missingColumns.length) {
    throw new Error(`Accounting reconciliation schema is not ready: accounting_reconciliation_reviews is missing ${missingColumns.join(', ')}. Apply the current Development migration authority.`);
  }
  const indexes = await tableIndexes(db, 'accounting_reconciliation_reviews');
  if (!indexes.has('idx_accounting_reconciliation_reviews_type_period')) {
    throw new Error('Accounting reconciliation schema is not ready: accounting_reconciliation_reviews is missing index idx_accounting_reconciliation_reviews_type_period. Apply the current Development migration authority.');
  }
  return true;
}

export async function listAccountingReconciliationReviews(db, { reconciliationType = '', periodMonth = '', includeAllPeriods = false } = {}) {
  await ensureAccountingReconciliationReviewsTable(db);
  const type = cleanReconciliationType(reconciliationType || 'sales_tax');
  const period = periodMonth ? cleanPeriodMonth(periodMonth) : '';
  const result = await db.prepare(`
    SELECT accounting_reconciliation_review_id, reconciliation_type, period_month, scope_key, review_status,
           note, statement_reference, difference_reason, detail_json, attachment_count,
           statement_amount_cents, book_amount_cents, tolerance_cents,
           expected_rate_basis_points, observed_rate_basis_points, unresolved_item_count,
           reference_amount_cents, compared_amount_cents, difference_cents,
           created_by_user_id, updated_by_user_id, created_at, updated_at
    FROM accounting_reconciliation_reviews
    WHERE reconciliation_type = ?
      AND (? = '' OR period_month = ? OR ? = '1')
    ORDER BY period_month DESC, scope_key ASC
  `).bind(type, period, period, includeAllPeriods ? '1' : '0').all().catch(() => ({ results: [] }));
  return rows(result).map((row) => ({
    accounting_reconciliation_review_id: Number(row.accounting_reconciliation_review_id || 0),
    reconciliation_type: row.reconciliation_type || type,
    period_month: row.period_month || period,
    scope_key: row.scope_key || 'all',
    review_status: cleanReconciliationStatus(row.review_status),
    note: row.note || '',
    statement_reference: row.statement_reference || '',
    difference_reason: row.difference_reason || '',
    detail_json: row.detail_json || '',
    attachment_count: Number(row.attachment_count || 0),
    statement_amount_cents: Number(row.statement_amount_cents || 0),
    book_amount_cents: Number(row.book_amount_cents || 0),
    tolerance_cents: Number(row.tolerance_cents || 0),
    expected_rate_basis_points: Number(row.expected_rate_basis_points || 0),
    observed_rate_basis_points: Number(row.observed_rate_basis_points || 0),
    unresolved_item_count: Number(row.unresolved_item_count || 0),
    reference_amount_cents: Number(row.reference_amount_cents || 0),
    compared_amount_cents: Number(row.compared_amount_cents || 0),
    difference_cents: Number(row.difference_cents || 0),
    created_by_user_id: row.created_by_user_id == null ? null : Number(row.created_by_user_id || 0),
    updated_by_user_id: row.updated_by_user_id == null ? null : Number(row.updated_by_user_id || 0),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  }));
}
