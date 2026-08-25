// Devil n Dove Build 322 — Accounting-owned read service for historical product-cost records.

export const BUILD = 322;
export const CONTRACT_ID = 'accounting-product-costs-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLE = 'product_costs';

const REQUIRED_COLUMNS = Object.freeze([
  'product_cost_id',
  'product_number',
  'cost_per_unit',
  'effective_date',
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

function optionalLimit(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  const n = Number.isFinite(parsed) ? Math.trunc(parsed) : 500;
  return Math.max(1, Math.min(5000, n));
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
    product_cost_id: Number(row?.product_cost_id || 0),
    product_number: row?.product_number || '',
    cost_per_unit: Number(row?.cost_per_unit || 0),
    effective_date: row?.effective_date || null,
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
    mode: 'read-only-accounting-product-costs',
    authority_table: AUTHORITY_TABLE,
    request_time_schema_mutation: false,
    ...extra,
  };
}

export async function readAccountingProductCosts(db, options = {}) {
  if (!db) throw new TypeError('A D1 database binding is required.');

  if (!(await tableExists(db, AUTHORITY_TABLE))) {
    return payload({
      schema_ready: false,
      missing_tables: [AUTHORITY_TABLE],
      missing_columns: [],
      product_costs: [],
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
      product_costs: [],
      count: 0,
    });
  }

  const limit = optionalLimit(options.limit);
  const sql = `
    SELECT
      product_cost_id,
      product_number,
      cost_per_unit,
      effective_date,
      notes,
      created_at,
      updated_at
    FROM product_costs
    ORDER BY COALESCE(effective_date, created_at, '1970-01-01') DESC, product_cost_id DESC
    ${limit == null ? '' : 'LIMIT ?'}
  `;

  const statement = db.prepare(sql);
  const result = limit == null ? await statement.all() : await statement.bind(limit).all();
  const productCosts = rows(result).map(mapRow);

  return payload({
    schema_ready: true,
    missing_tables: [],
    missing_columns: [],
    product_costs: productCosts,
    count: productCosts.length,
  });
}
