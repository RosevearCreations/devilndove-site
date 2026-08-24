// Devil n Dove Build 316 — Accounting-owned read service for expenses.
// This service is deliberately read-only: it reports schema readiness and never creates,
// alters, repairs, inserts, updates, or deletes database state during a read.

export const BUILD = 316;
export const CONTRACT_ID = 'accounting-expenses-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLE = 'accounting_expenses';
export const ATTACHMENT_TABLE = 'accounting_attachments';

const REQUIRED_COLUMNS = Object.freeze([
  'expense_id',
  'expense_date',
  'vendor_id',
  'vendor_name',
  'amount',
  'tax_amount',
  'ledger_code',
  'ledger_name',
  'recurring_expense_rule_id',
  'source_mode',
  'reference_number',
  'notes',
  'created_at',
  'updated_at',
]);

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function boundedInt(value, fallback = 100, min = 1, max = 500) {
  const parsed = Number(value);
  const n = Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
  return Math.max(min, Math.min(max, n));
}

function text(value) {
  return String(value ?? '').trim();
}

async function tableExists(db, tableName) {
  try {
    const row = await db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`
    ).bind(tableName).first();
    return Boolean(row?.name);
  } catch {
    return false;
  }
}

async function tableColumns(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(rows(result).map((row) => text(row?.name)).filter(Boolean));
  } catch {
    return new Set();
  }
}

function shapeExpense(row = {}) {
  return Object.freeze({
    expense_id: Number(row.expense_id || 0),
    expense_date: row.expense_date || null,
    vendor_id: row.vendor_id == null ? null : Number(row.vendor_id || 0),
    vendor_name: text(row.vendor_name),
    amount: Number(row.amount || 0),
    tax_amount: Number(row.tax_amount || 0),
    ledger_code: text(row.ledger_code),
    ledger_name: text(row.ledger_name),
    recurring_expense_rule_id: row.recurring_expense_rule_id == null ? null : Number(row.recurring_expense_rule_id || 0),
    source_mode: text(row.source_mode),
    reference_number: text(row.reference_number),
    notes: text(row.notes),
    attachment_count: Number(row.attachment_count || 0),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  });
}

function basePayload(extra = {}) {
  return {
    ok: true,
    build: BUILD,
    contract: CONTRACT_ID,
    owner: OWNER,
    mode: 'read-only-accounting-expenses',
    authority_table: AUTHORITY_TABLE,
    attachment_table: ATTACHMENT_TABLE,
    request_time_schema_mutation: false,
    ...extra,
  };
}

export async function readAccountingExpenses(db, options = {}) {
  if (!db) throw new TypeError('A D1 database binding is required.');

  const limit = boundedInt(options.limit);
  const expenseTableExists = await tableExists(db, AUTHORITY_TABLE);
  if (!expenseTableExists) {
    return basePayload({
      schema_ready: false,
      missing_tables: [AUTHORITY_TABLE],
      missing_columns: [],
      attachment_table_available: false,
      attachment_join_enabled: false,
      expenses: [],
      count: 0,
    });
  }

  const expenseColumns = await tableColumns(db, AUTHORITY_TABLE);
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !expenseColumns.has(column));
  if (missingColumns.length) {
    return basePayload({
      schema_ready: false,
      missing_tables: [],
      missing_columns: missingColumns,
      attachment_table_available: false,
      attachment_join_enabled: false,
      expenses: [],
      count: 0,
    });
  }

  const attachmentTableAvailable = await tableExists(db, ATTACHMENT_TABLE);
  const attachmentColumns = attachmentTableAvailable
    ? await tableColumns(db, ATTACHMENT_TABLE)
    : new Set();
  const attachmentJoinEnabled = attachmentTableAvailable && attachmentColumns.has('expense_id');

  const attachmentJoin = attachmentJoinEnabled
    ? `LEFT JOIN (
         SELECT expense_id, COUNT(*) AS attachment_count
         FROM accounting_attachments
         GROUP BY expense_id
       ) aa ON aa.expense_id = ae.expense_id`
    : '';
  const attachmentSelect = attachmentJoinEnabled
    ? 'COALESCE(aa.attachment_count, 0) AS attachment_count'
    : '0 AS attachment_count';

  const result = await db.prepare(`
    SELECT
      ae.expense_id AS expense_id,
      ae.expense_date AS expense_date,
      ae.vendor_id AS vendor_id,
      ae.vendor_name AS vendor_name,
      ae.amount AS amount,
      ae.tax_amount AS tax_amount,
      ae.ledger_code AS ledger_code,
      ae.ledger_name AS ledger_name,
      ae.recurring_expense_rule_id AS recurring_expense_rule_id,
      ae.source_mode AS source_mode,
      ae.reference_number AS reference_number,
      ae.notes AS notes,
      ${attachmentSelect},
      ae.created_at AS created_at,
      ae.updated_at AS updated_at
    FROM accounting_expenses ae
    ${attachmentJoin}
    ORDER BY COALESCE(ae.expense_date, ae.created_at, '1970-01-01') DESC, ae.expense_id DESC
    LIMIT ?
  `).bind(limit).all();

  const expenses = rows(result).map(shapeExpense);
  return basePayload({
    schema_ready: true,
    missing_tables: [],
    missing_columns: [],
    attachment_table_available: attachmentTableAvailable,
    attachment_join_enabled: attachmentJoinEnabled,
    expenses,
    count: expenses.length,
  });
}
