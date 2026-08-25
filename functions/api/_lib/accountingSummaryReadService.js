// Devil n Dove Build 319 — Accounting-owned read service for the accounting summary.
// Read-only by design: schema readiness is reported, never repaired, during a GET/read.

export const BUILD = 319;
export const CONTRACT_ID = 'accounting-summary-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLE = 'accounting_order_records';

const REQUIRED_COLUMNS = Object.freeze([
  'accounting_order_record_id', 'order_id', 'order_number', 'entry_status',
  'customer_name', 'customer_email', 'currency', 'total_cents', 'amount_paid_cents',
  'amount_outstanding_cents', 'tax_liability_cents', 'source_order_status',
  'source_payment_status', 'created_at', 'updated_at',
]);

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function boundedInt(value, fallback = 25, min = 1, max = 100) {
  const parsed = Number(value);
  const n = Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
  return Math.max(min, Math.min(max, n));
}

function text(value) {
  return String(value ?? '').trim();
}

async function tableExists(db, tableName) {
  try {
    const row = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(tableName).first();
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

function emptySummary() {
  return Object.freeze({
    records_count: 0,
    total_booked_cents: 0,
    total_paid_cents: 0,
    total_outstanding_cents: 0,
    total_tax_cents: 0,
    open_records_count: 0,
  });
}

function shapeSummary(row = {}) {
  return Object.freeze({
    records_count: Number(row.records_count || 0),
    total_booked_cents: Number(row.total_booked_cents || 0),
    total_paid_cents: Number(row.total_paid_cents || 0),
    total_outstanding_cents: Number(row.total_outstanding_cents || 0),
    total_tax_cents: Number(row.total_tax_cents || 0),
    open_records_count: Number(row.open_records_count || 0),
  });
}

function shapeRecord(row = {}) {
  return Object.freeze({
    accounting_order_record_id: Number(row.accounting_order_record_id || 0),
    order_id: Number(row.order_id || 0),
    order_number: text(row.order_number),
    entry_status: text(row.entry_status) || 'open',
    customer_name: text(row.customer_name),
    customer_email: text(row.customer_email),
    currency: text(row.currency || 'CAD').toUpperCase() || 'CAD',
    total_cents: Number(row.total_cents || 0),
    amount_paid_cents: Number(row.amount_paid_cents || 0),
    amount_outstanding_cents: Number(row.amount_outstanding_cents || 0),
    tax_liability_cents: Number(row.tax_liability_cents || 0),
    source_order_status: text(row.source_order_status),
    source_payment_status: text(row.source_payment_status),
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
    mode: 'read-only-accounting-summary',
    authority_table: AUTHORITY_TABLE,
    request_time_schema_mutation: false,
    ...extra,
  };
}

export async function readAccountingSummary(db, options = {}) {
  if (!db) throw new TypeError('A D1 database binding is required.');
  const limit = boundedInt(options.limit);

  const exists = await tableExists(db, AUTHORITY_TABLE);
  if (!exists) {
    return basePayload({
      schema_ready: false,
      missing_tables: [AUTHORITY_TABLE],
      missing_columns: [],
      warnings: ['accounting_summary_schema_not_ready'],
      summary: emptySummary(),
      records: [],
      count: 0,
    });
  }

  const columns = await tableColumns(db, AUTHORITY_TABLE);
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !columns.has(column));
  if (missingColumns.length) {
    return basePayload({
      schema_ready: false,
      missing_tables: [],
      missing_columns: missingColumns,
      warnings: ['accounting_summary_schema_not_ready'],
      summary: emptySummary(),
      records: [],
      count: 0,
    });
  }

  const summaryRow = await db.prepare(`
    SELECT
      COUNT(*) AS records_count,
      COALESCE(SUM(total_cents),0) AS total_booked_cents,
      COALESCE(SUM(amount_paid_cents),0) AS total_paid_cents,
      COALESCE(SUM(amount_outstanding_cents),0) AS total_outstanding_cents,
      COALESCE(SUM(tax_liability_cents),0) AS total_tax_cents,
      COALESCE(SUM(CASE WHEN entry_status IN ('open','partially_paid') THEN 1 ELSE 0 END),0) AS open_records_count
    FROM accounting_order_records
  `).first();

  const recent = await db.prepare(`
    SELECT
      accounting_order_record_id, order_id, order_number, entry_status,
      customer_name, customer_email, currency, total_cents, amount_paid_cents,
      amount_outstanding_cents, tax_liability_cents, source_order_status,
      source_payment_status, created_at, updated_at
    FROM accounting_order_records
    ORDER BY created_at DESC, accounting_order_record_id DESC
    LIMIT ?
  `).bind(limit).all();

  const records = rows(recent).map(shapeRecord);
  return basePayload({
    schema_ready: true,
    missing_tables: [],
    missing_columns: [],
    warnings: [],
    summary: shapeSummary(summaryRow),
    records,
    count: records.length,
  });
}
