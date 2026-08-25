// Devil n Dove Build 320 — Accounting-owned read service for monthly overhead allocations.
// GET/read paths inspect schema and SELECT only; schema creation/repair remains outside reads.

export const BUILD = 320;
export const CONTRACT_ID = 'accounting-overhead-allocations-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLE = 'accounting_overhead_allocations';

const REQUIRED_COLUMNS = Object.freeze([
  'allocation_id',
  'period_month',
  'ledger_code',
  'ledger_name',
  'allocation_basis',
  'amount_cents',
  'notes',
  'created_at',
  'updated_at',
]);

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function text(value) {
  return String(value ?? '').trim();
}

function monthValue(value) {
  const raw = text(value);
  return /^\d{4}-\d{2}$/.test(raw) ? raw : new Date().toISOString().slice(0, 7);
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

function mapRow(row, period) {
  return Object.freeze({
    allocation_id: Number(row?.allocation_id || 0),
    period_month: row?.period_month || period,
    ledger_code: row?.ledger_code || '',
    ledger_name: row?.ledger_name || '',
    allocation_basis: row?.allocation_basis || 'manual',
    amount_cents: Number(row?.amount_cents || 0),
    amount: Number((Number(row?.amount_cents || 0) / 100).toFixed(2)),
    notes: row?.notes || '',
    created_at: row?.created_at || null,
    updated_at: row?.updated_at || null,
  });
}

function payload(extra = {}) {
  return {
    ok: true,
    build: BUILD,
    contract: CONTRACT_ID,
    owner: OWNER,
    mode: 'read-only-accounting-overhead-allocations',
    authority_table: AUTHORITY_TABLE,
    request_time_schema_mutation: false,
    ...extra,
  };
}

export async function readAccountingOverheadAllocations(db, options = {}) {
  if (!db) throw new TypeError('A D1 database binding is required.');

  const period = monthValue(options.month || options.periodMonth);
  if (!(await tableExists(db, AUTHORITY_TABLE))) {
    return payload({
      schema_ready: false,
      missing_tables: [AUTHORITY_TABLE],
      missing_columns: [],
      period_month: period,
      allocations: [],
      count: 0,
    });
  }

  const columns = await tableColumns(db, AUTHORITY_TABLE);
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !columns.has(column));
  if (missingColumns.length) {
    return payload({
      schema_ready: false,
      missing_tables: [],
      missing_columns: missingColumns,
      period_month: period,
      allocations: [],
      count: 0,
    });
  }

  const result = await db.prepare(`
    SELECT
      allocation_id,
      period_month,
      ledger_code,
      ledger_name,
      allocation_basis,
      amount_cents,
      notes,
      created_at,
      updated_at
    FROM accounting_overhead_allocations
    WHERE period_month = ?
    ORDER BY ledger_code ASC, ledger_name ASC
  `).bind(period).all();

  const allocations = rows(result).map((row) => mapRow(row, period));
  return payload({
    schema_ready: true,
    missing_tables: [],
    missing_columns: [],
    period_month: period,
    allocations,
    count: allocations.length,
  });
}
