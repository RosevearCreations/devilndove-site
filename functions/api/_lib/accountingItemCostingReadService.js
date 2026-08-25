// Devil n Dove Build 325 — Accounting-owned non-mutating monthly item-costing read service.

import { computeMonthlyItemCosting } from '../admin/_costing.js';

export const BUILD = 325;
export const CONTRACT_ID = 'accounting-item-costing-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLE = 'products';
export const OPTIONAL_SOURCE_TABLES = Object.freeze([
  'product_costs',
  'product_resource_links',
  'site_item_inventory',
  'accounting_overhead_allocations',
  'accounting_overhead_product_allocations',
  'orders',
  'order_items',
]);

const REQUIRED_PRODUCT_COLUMNS = Object.freeze([
  'product_id',
  'product_number',
  'name',
  'slug',
  'status',
  'review_status',
  'currency',
  'price_cents',
]);

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function text(value) {
  return String(value ?? '').trim();
}

export function monthRange(monthValue) {
  const raw = text(monthValue);
  const match = /^(\d{4})-(\d{2})$/.exec(raw);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!year || month < 1 || month > 12) return null;
  const start = `${match[1]}-${match[2]}-01`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const end = `${String(nextYear).padStart(4, '0')}-${String(nextMonth).padStart(2, '0')}-01`;
  return { raw, start, end };
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

function emptySummary() {
  return {
    active_product_count: 0,
    draft_product_count: 0,
    priced_product_count: 0,
    total_allocated_overhead_cents: 0,
    average_allocated_overhead_cents: 0,
    average_full_unit_cost_cents: 0,
    negative_margin_count: 0,
    missing_cost_link_count: 0,
    uncosted_product_count: 0,
    rough_costed_margin_cents_total: 0,
    sold_quantity_in_period: 0,
    sold_order_count_in_period: 0,
    products_sold_in_period: 0,
    estimated_recognized_base_cogs_cents: 0,
    estimated_recognized_overhead_cogs_cents: 0,
    estimated_recognized_full_cogs_cents: 0,
    overhead_pools: [],
    explicit_product_overrides_count: 0,
  };
}

function payload(extra = {}) {
  return {
    ok: true,
    build: BUILD,
    contract: CONTRACT_ID,
    owner: OWNER,
    mode: 'read-only-accounting-item-costing',
    authority_table: AUTHORITY_TABLE,
    source_tables: OPTIONAL_SOURCE_TABLES,
    request_time_schema_mutation: false,
    ...extra,
  };
}

export async function readAccountingItemCosting(db, options = {}) {
  if (!db) throw new TypeError('A D1 database binding is required.');

  const range = monthRange(options.month || new Date().toISOString().slice(0, 7));
  if (!range) {
    const error = new RangeError('Please provide month in YYYY-MM format.');
    error.code = 'invalid_accounting_month';
    throw error;
  }

  const hasProducts = await tableExists(db, AUTHORITY_TABLE);
  const productColumns = hasProducts ? await tableColumns(db, AUTHORITY_TABLE) : new Set();
  const missingTables = hasProducts ? [] : [AUTHORITY_TABLE];
  const missingColumns = hasProducts
    ? REQUIRED_PRODUCT_COLUMNS.filter((column) => !productColumns.has(column)).map((column) => `${AUTHORITY_TABLE}.${column}`)
    : [];

  const optionalTableAvailability = {};
  for (const table of OPTIONAL_SOURCE_TABLES) optionalTableAvailability[table] = await tableExists(db, table);

  const schemaReady = missingTables.length === 0 && missingColumns.length === 0;
  if (!schemaReady) {
    return payload({
      period: range.raw,
      schema_ready: false,
      missing_tables: missingTables,
      missing_columns: missingColumns,
      optional_table_availability: optionalTableAvailability,
      items: [],
      count: 0,
      summary: emptySummary(),
    });
  }

  const report = await computeMonthlyItemCosting(db, range);
  const items = Array.isArray(report?.items) ? report.items : [];
  return payload({
    period: report?.period || range.raw,
    schema_ready: true,
    missing_tables: [],
    missing_columns: [],
    optional_table_availability: optionalTableAvailability,
    items,
    count: items.length,
    summary: report?.summary || emptySummary(),
  });
}
