export const BUILD = 337;
export const CONTRACT_ID = 'accounting-sales-tax-filing-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLE = 'accounting_reconciliation_reviews';

const REQUIRED_COLUMNS = Object.freeze([
  'reconciliation_type','period_month','scope_key','review_status','note','statement_reference','detail_json',
  'reference_amount_cents','book_amount_cents','statement_amount_cents','difference_cents'
]);

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function periodValue(value) { const raw = String(value || '').trim(); return /^\d{4}-\d{2}$/.test(raw) ? raw : new Date().toISOString().slice(0, 7); }
async function tableExists(db) { try { return !!(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(AUTHORITY_TABLE).first()); } catch { return false; } }
async function columnSet(db) { try { return new Set(rows(await db.prepare(`PRAGMA table_info(${AUTHORITY_TABLE})`).all()).map((row) => String(row?.name || '').trim()).filter(Boolean)); } catch { return new Set(); } }
function emptyWorksheet(periodMonth) { return { period_month: periodMonth, tax_collected_cents: 0, input_tax_cents: 0, net_tax_payable_cents: 0, statement_tax_cents: 0, gross_sales_cents: 0, shipping_cents: 0, discount_cents: 0, order_count: 0, expense_count: 0, filing_difference_cents: 0, review_status: 'draft', statement_reference: '', note: '' }; }
function payload(extra = {}) { return { ok: true, build: BUILD, contract: CONTRACT_ID, owner: OWNER, mode: 'read-only-accounting-sales-tax-filing', authority_table: AUTHORITY_TABLE, request_time_schema_mutation: false, ...extra }; }

export async function readAccountingSalesTaxFiling(db, { periodMonth = '' } = {}) {
  if (!db) throw new TypeError('A D1 database binding is required.');
  const period = periodValue(periodMonth);
  if (!(await tableExists(db))) return payload({ schema_ready: false, missing_tables: [AUTHORITY_TABLE], missing_columns: [], worksheet: emptyWorksheet(period) });
  const cols = await columnSet(db);
  const missingColumns = REQUIRED_COLUMNS.filter((name) => !cols.has(name)).map((name) => `${AUTHORITY_TABLE}.${name}`);
  if (missingColumns.length) return payload({ schema_ready: false, missing_tables: [], missing_columns: missingColumns, worksheet: emptyWorksheet(period) });
  const review = await db.prepare(`SELECT reconciliation_type, period_month, scope_key, review_status, note, statement_reference, detail_json, reference_amount_cents, book_amount_cents, statement_amount_cents, difference_cents FROM accounting_reconciliation_reviews WHERE reconciliation_type='sales_tax' AND period_month=? AND scope_key='all' LIMIT 1`).bind(period).first().catch(() => null);
  let detail = {}; try { detail = JSON.parse(String(review?.detail_json || '{}')); } catch { detail = {}; }
  const worksheet = {
    period_month: period,
    tax_collected_cents: Number(detail.tax_collected_cents || review?.reference_amount_cents || 0),
    input_tax_cents: Number(detail.input_tax_cents || 0),
    net_tax_payable_cents: Number(detail.net_tax_payable_cents || review?.book_amount_cents || 0),
    statement_tax_cents: Number(detail.statement_tax_cents || review?.statement_amount_cents || 0),
    gross_sales_cents: Number(detail.gross_sales_cents || 0), shipping_cents: Number(detail.shipping_cents || 0), discount_cents: Number(detail.discount_cents || 0),
    order_count: Number(detail.order_count || 0), expense_count: Number(detail.expense_count || 0), filing_difference_cents: Number(review?.difference_cents || 0),
    review_status: review?.review_status || 'draft', statement_reference: review?.statement_reference || '', note: review?.note || '',
  };
  return payload({ schema_ready: true, missing_tables: [], missing_columns: [], worksheet });
}
