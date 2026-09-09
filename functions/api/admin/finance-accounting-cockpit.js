// Release 467 Build 81 — authenticated, GET-only Finance & Accounting Cockpit.
// Existing Accounting read services retain ownership; this endpoint only derives a sanitized monthly projection.

import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { readAccountingCloseWorkflow } from '../_lib/accountingCloseWorkflowReadService.js';
import { readAccountingExpenses } from '../_lib/accountingExpensesReadService.js';
import { readAccountingItemCosting } from '../_lib/accountingItemCostingReadService.js';
import { readAccountingJournal } from '../_lib/accountingJournalReadService.js';
import { readAccountingReconciliation } from '../_lib/accountingReconciliationReadService.js';
import { buildFinanceAccountingCockpit } from '../_lib/financeAccountingCockpit.js';

const REQUIRED_COMMERCE_COLUMNS = Object.freeze({
  orders: ['order_id', 'total_cents', 'created_at'],
  payments: ['payment_id', 'amount_cents', 'payment_status', 'created_at'],
  payment_refunds: ['refund_id', 'amount_cents', 'refund_status', 'provider_sync_status', 'created_at'],
});
const REQUIRED_COMMITMENT_COLUMNS = Object.freeze({
  supplier_purchase_orders: ['supplier_purchase_order_id', 'status', 'total_estimated_cents'],
});

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function text(value) { return String(value ?? '').trim(); }
function validMonth(value) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(text(value)) ? text(value) : new Date().toISOString().slice(0, 7); }

async function tableReadiness(db, requirements) {
  const missing_tables = [];
  const missing_columns = [];
  for (const [table, required] of Object.entries(requirements)) {
    const exists = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1").bind(table).first().catch(() => null);
    if (!exists?.name) { missing_tables.push(table); continue; }
    const columns = new Set(rows(await db.prepare(`PRAGMA table_info(${table})`).all().catch(() => ({ results: [] }))).map((row) => text(row.name)));
    for (const column of required) if (!columns.has(column)) missing_columns.push(`${table}.${column}`);
  }
  return { schema_ready: missing_tables.length === 0 && missing_columns.length === 0, missing_tables, missing_columns };
}

async function readCommerce(db, period) {
  const readiness = await tableReadiness(db, REQUIRED_COMMERCE_COLUMNS);
  if (!readiness.schema_ready) return { ...readiness, orders: {}, payments: {}, refunds: {} };
  const [orders, payments, refunds] = await Promise.all([
    db.prepare(`SELECT COUNT(*) AS count,COALESCE(SUM(total_cents),0) AS total_cents FROM orders WHERE substr(COALESCE(created_at,''),1,7)=?`).bind(period).first(),
    db.prepare(`SELECT COUNT(*) AS count,COALESCE(SUM(CASE WHEN LOWER(COALESCE(payment_status,'')) IN ('paid','completed','captured') THEN 1 ELSE 0 END),0) AS settled_count,COALESCE(SUM(CASE WHEN LOWER(COALESCE(payment_status,'')) IN ('paid','completed','captured') THEN amount_cents ELSE 0 END),0) AS settled_cents,COALESCE(SUM(CASE WHEN LOWER(COALESCE(payment_status,'')) IN ('pending','authorized') THEN 1 ELSE 0 END),0) AS pending_count FROM payments WHERE substr(COALESCE(created_at,''),1,7)=?`).bind(period).first(),
    db.prepare(`SELECT COUNT(*) AS count,COALESCE(SUM(CASE WHEN LOWER(COALESCE(refund_status,'')) IN ('recorded','submitted','succeeded') AND LOWER(COALESCE(provider_sync_status,''))<>'failed' THEN 1 ELSE 0 END),0) AS accepted_count,COALESCE(SUM(CASE WHEN LOWER(COALESCE(refund_status,'')) IN ('recorded','submitted','succeeded') AND LOWER(COALESCE(provider_sync_status,''))<>'failed' THEN amount_cents ELSE 0 END),0) AS accepted_cents,COALESCE(SUM(CASE WHEN LOWER(COALESCE(refund_status,'')) IN ('requested','submitted') OR LOWER(COALESCE(provider_sync_status,'')) IN ('pending','failed') THEN 1 ELSE 0 END),0) AS attention_count FROM payment_refunds WHERE substr(COALESCE(created_at,''),1,7)=?`).bind(period).first(),
  ]);
  return { ...readiness, orders: orders || {}, payments: payments || {}, refunds: refunds || {} };
}

async function readPurchaseCommitments(db) {
  const readiness = await tableReadiness(db, REQUIRED_COMMITMENT_COLUMNS);
  if (!readiness.schema_ready) return { ...readiness, open_purchase_order_count: 0, open_commitment_cents: 0 };
  const summary = await db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN LOWER(COALESCE(status,'draft')) IN ('draft','submitted','ordered') THEN 1 ELSE 0 END),0) AS open_purchase_order_count,
      COALESCE(SUM(CASE WHEN LOWER(COALESCE(status,'draft')) IN ('draft','submitted','ordered') THEN total_estimated_cents ELSE 0 END),0) AS open_commitment_cents
    FROM supplier_purchase_orders
  `).first();
  return { ...readiness, ...(summary || {}) };
}

async function source(read) {
  try { return { available: true, data: await read() }; }
  catch (error) { return { available: false, code: text(error?.code) || 'read_failed' }; }
}

function journalPayables(journal) {
  const lines = (Array.isArray(journal?.entries) ? journal.entries : []).flatMap((entry) => Array.isArray(entry.lines) ? entry.lines : []);
  return {
    ...journal,
    ap_debit_cents: lines.filter((line) => text(line.ledger_code) === '2100').reduce((sum, line) => sum + Number(line.debit_cents || 0), 0),
    ap_credit_cents: lines.filter((line) => text(line.ledger_code) === '2100').reduce((sum, line) => sum + Number(line.credit_cents || 0), 0),
  };
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, release: 467, build: 81, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, release: 467, build: 81, error: 'Database binding is not configured.' }, 500);
  const period = validMonth(new URL(context.request.url).searchParams.get('period_month'));

  const [commerce, commitments, reconciliation, expenses, costing, journal, close] = await Promise.all([
    source(() => readCommerce(db, period)),
    source(() => readPurchaseCommitments(db)),
    source(() => readAccountingReconciliation(db, { reconciliationType: 'processor_fees', periodMonth: period })),
    source(() => readAccountingExpenses(db, { month: period, limit: 500 })),
    source(() => readAccountingItemCosting(db, { month: period })),
    source(async () => journalPayables(await readAccountingJournal(db, { month: period }))),
    source(() => readAccountingCloseWorkflow(db, { periodMonth: period })),
  ]);

  const cockpit = buildFinanceAccountingCockpit(period, { commerce, commitments, reconciliation, expenses, costing, journal, close });
  return jsonResponse({ ok: true, ...cockpit }, 200, { 'Cache-Control': 'no-store' });
}
