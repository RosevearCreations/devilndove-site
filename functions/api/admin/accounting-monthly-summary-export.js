// File: /functions/api/admin/accounting-monthly-summary-export.js
// Brief description: CSV monthly summary export for accountants.
import { getAdminUserFromRequest, getDb } from "../_lib/adminAudit.js";

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",
]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
  return text;
}

async function ensureTables(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS general_ledger_accounts (gl_account_id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL, category TEXT NOT NULL, parent_group TEXT, normal_balance TEXT NOT NULL DEFAULT 'debit', is_active INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0, notes TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS accounting_expenses (expense_id INTEGER PRIMARY KEY AUTOINCREMENT, expense_date TEXT NOT NULL, vendor TEXT, category TEXT, description TEXT, amount_cents INTEGER NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'CAD', tax_cents INTEGER NOT NULL DEFAULT 0, receipt_url TEXT, notes TEXT, created_by_user_id INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS accounting_writeoffs (writeoff_id INTEGER PRIMARY KEY AUTOINCREMENT, writeoff_date TEXT NOT NULL, writeoff_type TEXT NOT NULL, description TEXT, amount_cents INTEGER NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'CAD', gl_account_code TEXT, product_id INTEGER, quantity REAL, notes TEXT, created_by_user_id INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
  await db.prepare(`CREATE TABLE IF NOT EXISTS accounting_order_records (accounting_order_record_id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER, order_number TEXT, customer_email TEXT, currency TEXT NOT NULL DEFAULT 'CAD', subtotal_cents INTEGER NOT NULL DEFAULT 0, shipping_cents INTEGER NOT NULL DEFAULT 0, tax_cents INTEGER NOT NULL DEFAULT 0, discount_cents INTEGER NOT NULL DEFAULT 0, total_cents INTEGER NOT NULL DEFAULT 0, paid_cents INTEGER NOT NULL DEFAULT 0, refunded_cents INTEGER NOT NULL DEFAULT 0, outstanding_cents INTEGER NOT NULL DEFAULT 0, entry_status TEXT NOT NULL DEFAULT 'open', payment_provider TEXT, payment_status TEXT, notes TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  await ensureTables(db);
  const adminUser = await getAdminUserFromRequest(env, request);
  if (!adminUser?.ok) return new Response('Unauthorized', { status: 401 });
  const url = new URL(request.url);
  const month = (url.searchParams.get('month') || new Date().toISOString().slice(0,7)).slice(0,7);
  const start = `${month}-01`;
  const end = `${month}-31`;
  const rows = [];
  rows.push(['Section','Date','GL Code','Category','Description','Amount','Currency','Notes']);
  const revenue = await db.prepare(`SELECT created_at, total_cents, tax_cents, shipping_cents, refunded_cents, payment_status, order_number FROM accounting_order_records WHERE substr(created_at,1,7)=? ORDER BY created_at ASC`).bind(month).all();
  for (const r of (revenue.results||[])) {
    rows.push(['Revenue', String(r.created_at||''), '4000', 'Sales Revenue', `Order ${r.order_number||''}`.trim(), ((Number(r.total_cents||0)-Number(r.tax_cents||0)-Number(r.shipping_cents||0))/100).toFixed(2), r.currency||'CAD', r.payment_status||'']);
    if (Number(r.shipping_cents||0)) rows.push(['Revenue', String(r.created_at||''), '4050', 'Shipping Income', `Order ${r.order_number||''} shipping`, (Number(r.shipping_cents||0)/100).toFixed(2), r.currency||'CAD', '']);
    if (Number(r.refunded_cents||0)) rows.push(['Adjustments', String(r.created_at||''), '6900', 'Refund/Write-Off Adjustments', `Order ${r.order_number||''} refunded`, (Number(r.refunded_cents||0)/100).toFixed(2), r.currency||'CAD', 'Refunded']);
  }
  const expenses = await db.prepare(`SELECT expense_date, category, description, amount_cents, tax_cents, currency, vendor, notes FROM accounting_expenses WHERE expense_date >= ? AND expense_date <= ? ORDER BY expense_date ASC`).bind(start,end).all();
  for (const r of (expenses.results||[])) rows.push(['Expense', r.expense_date||'', '', r.category||'Operating Expense', [r.vendor,r.description].filter(Boolean).join(' — '), (Number(r.amount_cents||0)/100).toFixed(2), r.currency||'CAD', r.notes||'']);
  const writeoffs = await db.prepare(`SELECT writeoff_date, gl_account_code, writeoff_type, description, amount_cents, currency, notes FROM accounting_writeoffs WHERE writeoff_date >= ? AND writeoff_date <= ? ORDER BY writeoff_date ASC`).bind(start,end).all();
  for (const r of (writeoffs.results||[])) rows.push(['Write-Off', r.writeoff_date||'', r.gl_account_code||'6900', r.writeoff_type||'Write-Off', r.description||'', (Number(r.amount_cents||0)/100).toFixed(2), r.currency||'CAD', r.notes||'']);
  const body = rows.map(row => row.map(csvEscape).join(',')).join('
');
  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="accounting-monthly-summary-${month}.csv"` } });
}
