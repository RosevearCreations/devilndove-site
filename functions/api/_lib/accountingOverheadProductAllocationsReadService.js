// Devil n Dove Build 321 — Accounting-owned read service for overhead-to-product allocations.

export const BUILD = 321;
export const CONTRACT_ID = 'accounting-overhead-product-allocations-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLE = 'accounting_overhead_product_allocations';
export const PRODUCT_TABLE = 'products';

const REQUIRED_COLUMNS = Object.freeze([
  'overhead_product_allocation_id',
  'period_month',
  'ledger_code',
  'product_id',
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

function boundedInt(value, fallback = 150, min = 1, max = 500) {
  const parsed = Number(value);
  const n = Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
  return Math.max(min, Math.min(max, n));
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

function mapRow(row) {
  return Object.freeze({
    overhead_product_allocation_id: Number(row?.overhead_product_allocation_id || 0),
    period_month: row?.period_month || '',
    ledger_code: row?.ledger_code || '',
    product_id: Number(row?.product_id || 0),
    product_number: row?.product_number == null ? null : Number(row.product_number || 0),
    product_name: row?.product_name || '',
    product_status: row?.product_status || '',
    review_status: row?.review_status || '',
    amount_cents: Number(row?.amount_cents || 0),
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
    mode: 'read-only-accounting-overhead-product-allocations',
    authority_table: AUTHORITY_TABLE,
    product_table: PRODUCT_TABLE,
    request_time_schema_mutation: false,
    ...extra,
  };
}

export async function readAccountingOverheadProductAllocations(db, options = {}) {
  if (!db) throw new TypeError('A D1 database binding is required.');

  const periodMonth = text(options.month || options.periodMonth);
  const limit = boundedInt(options.limit);

  if (!(await tableExists(db, AUTHORITY_TABLE))) {
    return payload({
      schema_ready: false,
      missing_tables: [AUTHORITY_TABLE],
      missing_columns: [],
      product_table_available: false,
      product_join_enabled: false,
      allocations: [],
      count: 0,
      summary: { allocation_count: 0, total_amount_cents: 0, period_month: periodMonth || null },
    });
  }

  const columns = await tableColumns(db, AUTHORITY_TABLE);
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !columns.has(column));
  if (missingColumns.length) {
    return payload({
      schema_ready: false,
      missing_tables: [],
      missing_columns: missingColumns,
      product_table_available: false,
      product_join_enabled: false,
      allocations: [],
      count: 0,
      summary: { allocation_count: 0, total_amount_cents: 0, period_month: periodMonth || null },
    });
  }

  const productTableAvailable = await tableExists(db, PRODUCT_TABLE);
  const productColumns = productTableAvailable ? await tableColumns(db, PRODUCT_TABLE) : new Set();
  const productJoinEnabled = productTableAvailable && ['product_id', 'product_number', 'name', 'status', 'review_status'].every((column) => productColumns.has(column));

  const where = [];
  const bindings = [];
  if (periodMonth) {
    where.push('opa.period_month = ?');
    bindings.push(periodMonth);
  }
  bindings.push(limit);

  const joinSql = productJoinEnabled ? 'LEFT JOIN products p ON p.product_id = opa.product_id' : '';
  const productSelect = productJoinEnabled
    ? `p.product_number AS product_number,
      p.name AS product_name,
      p.status AS product_status,
      p.review_status AS review_status`
    : `NULL AS product_number,
      '' AS product_name,
      '' AS product_status,
      '' AS review_status`;
  const productOrder = productJoinEnabled ? "LOWER(COALESCE(p.name, ''))" : "''";

  const result = await db.prepare(`
    SELECT
      opa.overhead_product_allocation_id,
      opa.period_month,
      opa.ledger_code,
      opa.product_id,
      opa.amount_cents,
      opa.notes,
      opa.created_at,
      opa.updated_at,
      ${productSelect}
    FROM accounting_overhead_product_allocations opa
    ${joinSql}
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY opa.period_month DESC, opa.ledger_code ASC, ${productOrder} ASC, opa.product_id ASC
    LIMIT ?
  `).bind(...bindings).all();

  const allocations = rows(result).map(mapRow);
  return payload({
    schema_ready: true,
    missing_tables: [],
    missing_columns: [],
    product_table_available: productTableAvailable,
    product_join_enabled: productJoinEnabled,
    allocations,
    count: allocations.length,
    summary: {
      allocation_count: allocations.length,
      total_amount_cents: allocations.reduce((sum, row) => sum + Number(row.amount_cents || 0), 0),
      period_month: periodMonth || null,
    },
  });
}
