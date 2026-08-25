// Devil n Dove Build 317 — Accounting-owned read service for write-offs.
// This service is deliberately read-only: it reports schema readiness and never creates,
// alters, repairs, inserts, updates, or deletes database state during a read.

export const BUILD = 317;
export const CONTRACT_ID = 'accounting-writeoffs-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLE = 'accounting_writeoffs';

const REQUIRED_COLUMNS = Object.freeze([
  'writeoff_id',
  'writeoff_date',
  'item_name',
  'amount',
  'reason_code',
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

function shapeWriteoff(row = {}) {
  return Object.freeze({
    writeoff_id: Number(row.writeoff_id || 0),
    writeoff_date: row.writeoff_date || null,
    item_name: text(row.item_name),
    amount: Number(row.amount || 0),
    reason_code: text(row.reason_code) || 'other',
    notes: text(row.notes),
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
    mode: 'read-only-accounting-writeoffs',
    authority_table: AUTHORITY_TABLE,
    request_time_schema_mutation: false,
    ...extra,
  };
}

export async function readAccountingWriteoffs(db, options = {}) {
  if (!db) throw new TypeError('A D1 database binding is required.');

  const limit = boundedInt(options.limit);
  const exists = await tableExists(db, AUTHORITY_TABLE);
  if (!exists) {
    return basePayload({
      schema_ready: false,
      missing_tables: [AUTHORITY_TABLE],
      missing_columns: [],
      writeoffs: [],
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
      writeoffs: [],
      count: 0,
    });
  }

  const result = await db.prepare(`
    SELECT
      aw.writeoff_id AS writeoff_id,
      aw.writeoff_date AS writeoff_date,
      aw.item_name AS item_name,
      aw.amount AS amount,
      aw.reason_code AS reason_code,
      aw.notes AS notes,
      aw.created_at AS created_at,
      aw.updated_at AS updated_at
    FROM accounting_writeoffs aw
    ORDER BY COALESCE(aw.writeoff_date, aw.created_at, '1970-01-01') DESC, aw.writeoff_id DESC
    LIMIT ?
  `).bind(limit).all();

  const writeoffs = rows(result).map(shapeWriteoff);
  return basePayload({
    schema_ready: true,
    missing_tables: [],
    missing_columns: [],
    writeoffs,
    count: writeoffs.length,
  });
}
