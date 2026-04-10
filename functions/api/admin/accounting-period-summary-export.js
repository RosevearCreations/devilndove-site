import { getAdminUserFromRequest, getDb, jsonResponse } from "../_lib/adminAudit.js";

function csvCell(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return /[",

]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}
function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  return [headers.map(csvCell).join(','), ...rows.map((row) => headers.map((key) => csvCell(row[key])).join(','))].join('
');
}
function normalizeResults(result) { return Array.isArray(result?.results) ? result.results : []; }
async function tableExists(db, tableName) { try { return !!(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(tableName).first()); } catch { return false; } }
async function safeQuery(db, sql, bindings=[]) { try { return normalizeResults(await db.prepare(sql).bind(...bindings).all()); } catch { return []; } }
function getRange(scope, period) {
  const raw = String(period || '').trim();
  if (scope === 'year') {
    if (!/^\d{4}$/.test(raw)) return null;
    return { label: raw, start: `${raw}-01-01`, end: `${String(Number(raw)+1)}-01-01` };
  }
  if (scope === 'quarter') {
    const m = raw.match(/^(\d{4})-Q([1-4])$/i);
    if (!m) return null;
    const year = Number(m[1]); const q = Number(m[2]);
    const month = (q-1)*3 + 1; const endMonth = month + 3;
    const nextYear = endMonth > 12 ? year + 1 : year;
    const nextMonth = endMonth > 12 ? 1 : endMonth;
    return { label: `${year}-Q${q}`, start: `${year}-${String(month).padStart(2,'0')}-01`, end: `${nextYear}-${String(nextMonth).padStart(2,'0')}-01` };
  }
  return null;
}
async function loadRows(db, range) {
  const rows = [];
  if (await tableExists(db, 'accounting_order_records')) {
    rows.push(...await safeQuery(db, `SELECT 'accounting_order' AS row_type, substr(COALESCE(last_synced_at, updated_at, created_at, datetime('now')),1,10) AS entry_date, COALESCE(order_number, CAST(order_id AS TEXT)) AS reference_code, COALESCE(customer_email,'') AS party, COALESCE(entry_status,'') AS status, ROUND(COALESCE(revenue_cents,0) / 100.0,2) AS amount, ROUND(COALESCE(tax_liability_cents,0) / 100.0,2) AS tax_amount, '' AS ledger_code, '' AS ledger_name, COALESCE(notes,'') AS notes FROM accounting_order_records WHERE substr(COALESCE(last_synced_at, updated_at, created_at, datetime('now')),1,10) >= ? AND substr(COALESCE(last_synced_at, updated_at, created_at, datetime('now')),1,10) < ? ORDER BY COALESCE(last_synced_at, updated_at, created_at, datetime('now')) DESC`, [range.start, range.end]));
  } else if (await tableExists(db, 'orders')) {
    rows.push(...await safeQuery(db, `SELECT 'order' AS row_type, substr(COALESCE(created_at, datetime('now')),1,10) AS entry_date, COALESCE(order_number, CAST(order_id AS TEXT)) AS reference_code, COALESCE(customer_email,'') AS party, TRIM(COALESCE(order_status,'') || CASE WHEN COALESCE(payment_status,'') <> '' THEN ' / ' || payment_status ELSE '' END) AS status, ROUND(COALESCE(total_cents,0) / 100.0,2) AS amount, ROUND(COALESCE(tax_cents,0) / 100.0,2) AS tax_amount, '' AS ledger_code, '' AS ledger_name, COALESCE(notes,'') AS notes FROM orders WHERE substr(COALESCE(created_at, datetime('now')),1,10) >= ? AND substr(COALESCE(created_at, datetime('now')),1,10) < ? ORDER BY COALESCE(created_at, datetime('now')) DESC`, [range.start, range.end]));
  }
  if (await tableExists(db, 'accounting_expenses')) rows.push(...await safeQuery(db, `SELECT 'expense' AS row_type, substr(COALESCE(expense_date, created_at, datetime('now')),1,10) AS entry_date, COALESCE(CAST(expense_id AS TEXT), '') AS reference_code, COALESCE(vendor_name,'') AS party, '' AS status, ROUND(COALESCE(amount,0),2) AS amount, ROUND(COALESCE(tax_amount,0),2) AS tax_amount, COALESCE(ledger_code,'') AS ledger_code, COALESCE(ledger_name,'') AS ledger_name, COALESCE(notes,'') AS notes FROM accounting_expenses WHERE substr(COALESCE(expense_date, created_at, datetime('now')),1,10) >= ? AND substr(COALESCE(expense_date, created_at, datetime('now')),1,10) < ? ORDER BY COALESCE(expense_date, created_at, datetime('now')) DESC`, [range.start, range.end]));
  if (await tableExists(db, 'accounting_writeoffs')) rows.push(...await safeQuery(db, `SELECT 'writeoff' AS row_type, substr(COALESCE(writeoff_date, created_at, datetime('now')),1,10) AS entry_date, COALESCE(CAST(writeoff_id AS TEXT), '') AS reference_code, COALESCE(item_name,'') AS party, COALESCE(reason_code,'') AS status, ROUND(COALESCE(amount,0),2) AS amount, 0 AS tax_amount, 'WRITEOFF' AS ledger_code, 'Write-Offs' AS ledger_name, COALESCE(notes,'') AS notes FROM accounting_writeoffs WHERE substr(COALESCE(writeoff_date, created_at, datetime('now')),1,10) >= ? AND substr(COALESCE(writeoff_date, created_at, datetime('now')),1,10) < ? ORDER BY COALESCE(writeoff_date, created_at, datetime('now')) DESC`, [range.start, range.end]));
  return rows;
}
export async function onRequestGet(context) {
  const db = getDb(context.env); if (!db) return jsonResponse({ ok:false, error:'Database binding is not configured.' }, 500);
  const adminUser = await getAdminUserFromRequest(context.request, context.env); if (!adminUser) return jsonResponse({ ok:false, error:'Admin access required.' }, 401);
  const url = new URL(context.request.url); const scope = String(url.searchParams.get('scope') || '').trim().toLowerCase(); const period = url.searchParams.get('period');
  const range = getRange(scope, period); if (!range) return jsonResponse({ ok:false, error:'Provide a valid quarter like 2026-Q2 or year like 2026.' }, 400);
  const rows = await loadRows(db, range);
  const csv = toCsv(rows.length ? rows : [{ row_type:'empty', entry_date:range.start, reference_code:'', party:'', status:'', amount:0, tax_amount:0, ledger_code:'', ledger_name:'', notes:'' }]);
  return new Response(csv, { status:200, headers:{ 'content-type':'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="accounting-${scope}-${range.label}.csv"`, 'cache-control':'no-store' } });
}
