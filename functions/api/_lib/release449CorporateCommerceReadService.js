// Devil n Dove Release 449 — corporate reporting and commerce completeness read authority.
// Extends the existing Accounting/GIFI ledger authority. This service performs no schema mutation.

import { readAccountingGifiSummary } from './accountingGifiSummaryReadService.js';

export const RELEASE = 449;
export const OWNER = 'accounting';
export const CONTRACT_ID = 'release449-corporate-commerce-read';

const REQUIRED_TABLES = Object.freeze([
  'provider_setup_authorities',
  'marketplace_channels',
  'marketplace_syndication_drafts',
  'sales_invoices',
  'sales_refunds',
  'commerce_transaction_costs',
  'gifi_reporting_snapshots',
]);

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function text(value) {
  return String(value ?? '').trim();
}

function cents(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

async function existingTables(db) {
  const result = await db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name IN (${REQUIRED_TABLES.map(() => '?').join(',')})`
  ).bind(...REQUIRED_TABLES).all();
  return new Set(rows(result).map((row) => text(row?.name)).filter(Boolean));
}

function gifiBucket(code) {
  const n = Number.parseInt(String(code || ''), 10);
  if (!Number.isFinite(n)) return 'unclassified';
  if (n >= 1000 && n <= 2599) return 'assets';
  if (n >= 2600 && n <= 3499) return 'liabilities';
  if (n >= 3500 && n <= 3999) return 'equity';
  return 'unclassified';
}

function normalizeBalanceLine(row) {
  const bucket = gifiBucket(row?.gifi_code);
  const raw = cents(row?.net_cents);
  // Journal net is debit minus credit. Assets normally carry debit balances;
  // liabilities/equity normally carry credit balances, so normalize those positive for presentation.
  const amount = bucket === 'liabilities' || bucket === 'equity' ? -raw : raw;
  return {
    gifi_code: text(row?.gifi_code),
    gifi_label: text(row?.gifi_label),
    ledger_codes: text(row?.ledger_codes),
    bucket,
    amount_cents: amount,
    source_count: Number(row?.source_count || 0),
  };
}

async function commerceCompleteness(db, year, available) {
  if (!available.has('commerce_transaction_costs')) {
    return {
      schema_ready: false,
      total_count: 0,
      incomplete_count: 0,
      quarters: [1, 2, 3, 4].map((quarter) => ({ quarter, total_count: 0, incomplete_count: 0 })),
    };
  }

  const start = `${year}-01-01`;
  const end = `${Number(year) + 1}-01-01`;
  const result = await db.prepare(`
    SELECT
      CAST(((CAST(substr(transaction_date,6,2) AS INTEGER) - 1) / 3) AS INTEGER) + 1 AS quarter,
      COUNT(*) AS total_count,
      SUM(CASE WHEN completeness_status='complete' THEN 0 ELSE 1 END) AS incomplete_count
    FROM commerce_transaction_costs
    WHERE transaction_date >= ? AND transaction_date < ?
    GROUP BY quarter
    ORDER BY quarter
  `).bind(start, end).all();

  const map = new Map(rows(result).map((row) => [Number(row.quarter), row]));
  const quarters = [1, 2, 3, 4].map((quarter) => ({
    quarter,
    total_count: Number(map.get(quarter)?.total_count || 0),
    incomplete_count: Number(map.get(quarter)?.incomplete_count || 0),
  }));
  return {
    schema_ready: true,
    total_count: quarters.reduce((sum, row) => sum + row.total_count, 0),
    incomplete_count: quarters.reduce((sum, row) => sum + row.incomplete_count, 0),
    quarters,
  };
}

export async function readCorporateCommerceReadiness(db, options = {}) {
  if (!db) throw new TypeError('A D1 database binding is required.');
  const year = String(options.year || new Date().getFullYear());
  if (!/^\d{4}$/.test(year)) {
    const error = new RangeError('Please provide year in YYYY format.');
    error.code = 'invalid_accounting_year';
    throw error;
  }

  const available = await existingTables(db);
  const missingTables = REQUIRED_TABLES.filter((name) => !available.has(name));
  const gifi = await readAccountingGifiSummary(db, { year });
  const balanceRows = (gifi?.gifi_rows || [])
    .filter((row) => text(row?.gifi_section).toLowerCase() === 'balance_sheet')
    .map(normalizeBalanceLine);

  const assets = balanceRows.filter((row) => row.bucket === 'assets').reduce((sum, row) => sum + row.amount_cents, 0);
  const liabilities = balanceRows.filter((row) => row.bucket === 'liabilities').reduce((sum, row) => sum + row.amount_cents, 0);
  const equity = balanceRows.filter((row) => row.bucket === 'equity').reduce((sum, row) => sum + row.amount_cents, 0);
  const balanceDifference = assets - liabilities - equity;
  const commerce = await commerceCompleteness(db, year, available);

  const issues = [];
  if (missingTables.length) issues.push({ key: 'schema', severity: 'blocking', count: missingTables.length, message: 'Release 449 Development schema is not fully applied.' });
  if (gifi?.schema_ready === false) issues.push({ key: 'gifi_schema', severity: 'blocking', count: (gifi?.missing_tables || []).length + (gifi?.missing_columns || []).length, message: 'Existing GIFI ledger authority is not schema-ready.' });
  if (Number(gifi?.summary?.unmapped_line_count || 0) > 0) issues.push({ key: 'gifi_mapping', severity: 'review', count: Number(gifi.summary.unmapped_line_count), message: 'GIFI ledger lines still need mapping review.' });
  if (commerce.incomplete_count > 0) issues.push({ key: 'transaction_costs', severity: 'review', count: commerce.incomplete_count, message: 'Commerce transactions still need tax/shipping/provider/marketplace cost confirmation.' });
  if (balanceRows.length && balanceDifference !== 0) issues.push({ key: 'balance_sheet', severity: 'review', count: 1, message: 'Derived Balance Sheet is not currently balanced; review ledger classification and opening balances.' });

  return {
    ok: true,
    release: RELEASE,
    owner: OWNER,
    contract: CONTRACT_ID,
    mode: 'read-only-corporate-commerce-readiness',
    request_time_schema_mutation: false,
    year,
    schema_ready: missingTables.length === 0 && gifi?.schema_ready !== false,
    missing_tables: missingTables,
    readiness_status: issues.some((issue) => issue.severity === 'blocking') ? 'blocked' : issues.length ? 'needs_review' : 'ready',
    issues,
    balance_sheet: {
      source: 'existing-accounting-journal-and-gifi-authority',
      assets_cents: assets,
      liabilities_cents: liabilities,
      equity_cents: equity,
      balance_difference_cents: balanceDifference,
      balanced: balanceRows.length > 0 && balanceDifference === 0,
      line_count: balanceRows.length,
      lines: balanceRows,
    },
    gifi: {
      source_used: gifi?.source_used || '',
      readiness_percent: Number(gifi?.summary?.readiness_percent || 0),
      mapped_line_count: Number(gifi?.summary?.mapped_line_count || 0),
      unmapped_line_count: Number(gifi?.summary?.unmapped_line_count || 0),
      review: gifi?.gl_review_summary || {},
    },
    quarterly_completeness: commerce,
    notes: [
      'Balance Sheet/GIFI figures are derived from the existing Accounting ledger authority; no parallel ledger is created.',
      'Quarterly completeness is a control surface, not a tax filing.',
    ],
  };
}
