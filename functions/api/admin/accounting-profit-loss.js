// File: /functions/api/admin/accounting-profit-loss.js
// Brief description: Returns a simple monthly profit/loss style summary so the
// accounting screen can show revenue, expenses, write-offs, overhead, and a
// rough sold-unit costing view.

import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { computeMonthlyItemCosting, tableExists } from './_costing.js';

function monthRange(monthValue) {
  const raw = String(monthValue || '').trim();
  const match = /^(\d{4})-(\d{2})$/.exec(raw);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!year || month < 1 || month > 12) return null;
  const start = `${match[1]}-${match[2]}-01`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const end = `${String(nextYear).padStart(4,'0')}-${String(nextMonth).padStart(2,'0')}-01`;
  return { raw, start, end };
}

async function scalar(db, sql, bindings = []) {
  try {
    const row = await db.prepare(sql).bind(...bindings).first();
    return row || {};
  } catch { return {}; }
}

async function safeAll(db, sql, bindings = []) {
  try {
    const result = await db.prepare(sql).bind(...bindings).all();
    return Array.isArray(result?.results) ? result.results : [];
  } catch { return []; }
}

function centsFromDollars(value) {
  return Math.round(Number(value || 0) * 100);
}

function cents(value) {
  return Number(value || 0);
}

async function loadRevenueSummary(db, range) {
  const hasAccountingOrders = await tableExists(db, 'accounting_order_records');
  if (hasAccountingOrders) {
    const summary = await scalar(db, `
      SELECT
        COALESCE(SUM(COALESCE(total_cents,0)),0) AS booked_cents,
        COALESCE(SUM(COALESCE(tax_liability_cents,0)),0) AS recognized_tax_cents,
        COALESCE(SUM(COALESCE(revenue_cents,0)),0) AS recognized_cents,
        COUNT(*) AS order_count,
        SUM(CASE WHEN COALESCE(revenue_cents,0) > 0 THEN 1 ELSE 0 END) AS recognized_order_count
      FROM accounting_order_records
      WHERE substr(COALESCE(last_synced_at, updated_at, created_at, datetime('now')),1,10) >= ?
        AND substr(COALESCE(last_synced_at, updated_at, created_at, datetime('now')),1,10) < ?
    `, [range.start, range.end]);
    return {
      source: 'accounting_order_records',
      order_count: cents(summary.order_count),
      recognized_order_count: cents(summary.recognized_order_count),
      booked_cents: cents(summary.booked_cents),
      recognized_cents: cents(summary.recognized_cents),
      recognized_tax_cents: cents(summary.recognized_tax_cents),
    };
  }

  const hasOrders = await tableExists(db, 'orders');
  if (!hasOrders) {
    return { source: 'none', order_count: 0, recognized_order_count: 0, booked_cents: 0, recognized_cents: 0, recognized_tax_cents: 0 };
  }

  const summary = await scalar(db, `
    SELECT
      COALESCE(SUM(COALESCE(total_cents,0)),0) AS booked_cents,
      COALESCE(SUM(CASE
        WHEN LOWER(COALESCE(payment_status,'')) IN ('paid','completed','captured','partially_refunded','refunded')
          OR LOWER(COALESCE(order_status,'')) IN ('paid','fulfilled','refunded')
        THEN COALESCE(tax_cents,0)
        ELSE 0
      END),0) AS recognized_tax_cents,
      COALESCE(SUM(CASE
        WHEN LOWER(COALESCE(payment_status,'')) IN ('paid','completed','captured','partially_refunded','refunded')
          OR LOWER(COALESCE(order_status,'')) IN ('paid','fulfilled','refunded')
        THEN COALESCE(total_cents,0)
        ELSE 0
      END),0) AS recognized_cents,
      COUNT(*) AS order_count,
      SUM(CASE
        WHEN LOWER(COALESCE(payment_status,'')) IN ('paid','completed','captured','partially_refunded','refunded')
          OR LOWER(COALESCE(order_status,'')) IN ('paid','fulfilled','refunded')
        THEN 1 ELSE 0 END) AS recognized_order_count
    FROM orders
    WHERE substr(COALESCE(created_at, datetime('now')),1,10) >= ?
      AND substr(COALESCE(created_at, datetime('now')),1,10) < ?
  `, [range.start, range.end]);

  return {
    source: 'orders',
    order_count: cents(summary.order_count),
    recognized_order_count: cents(summary.recognized_order_count),
    booked_cents: cents(summary.booked_cents),
    recognized_cents: cents(summary.recognized_cents),
    recognized_tax_cents: cents(summary.recognized_tax_cents),
  };
}

export async function onRequestGet(context) {
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok:false, error:'Database binding is not configured.' }, 500);
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok:false, error:'Admin access required.' }, 401);

  const url = new URL(context.request.url);
  const range = monthRange(url.searchParams.get('month') || new Date().toISOString().slice(0,7));
  if (!range) return jsonResponse({ ok:false, error:'Please provide month in YYYY-MM format.' }, 400);

  const hasExpenses = await tableExists(db, 'accounting_expenses');
  const hasWriteoffs = await tableExists(db, 'accounting_writeoffs');
  const hasGl = await tableExists(db, 'general_ledger_accounts');
  const hasOverhead = await tableExists(db, 'accounting_overhead_allocations');

  const revenueSummary = await loadRevenueSummary(db, range);
  const costing = await computeMonthlyItemCosting(db, range);

  const expenseSummary = hasExpenses ? await scalar(db, `
    SELECT
      COALESCE(SUM(CAST(ROUND(COALESCE(amount,0) * 100.0) AS INTEGER)),0) AS expense_cents,
      COALESCE(SUM(CAST(ROUND(COALESCE(tax_amount,0) * 100.0) AS INTEGER)),0) AS expense_tax_cents,
      COUNT(*) AS expense_count
    FROM accounting_expenses
    WHERE substr(COALESCE(expense_date, created_at, datetime('now')),1,10) >= ?
      AND substr(COALESCE(expense_date, created_at, datetime('now')),1,10) < ?
  `, [range.start, range.end]) : {};

  const writeoffSummary = hasWriteoffs ? await scalar(db, `
    SELECT
      COALESCE(SUM(CAST(ROUND(COALESCE(amount,0) * 100.0) AS INTEGER)),0) AS writeoff_cents,
      COUNT(*) AS writeoff_count
    FROM accounting_writeoffs
    WHERE substr(COALESCE(writeoff_date, created_at, datetime('now')),1,10) >= ?
      AND substr(COALESCE(writeoff_date, created_at, datetime('now')),1,10) < ?
  `, [range.start, range.end]) : {};

  const groupedExpenses = hasExpenses ? await safeAll(db, `
    SELECT
      COALESCE(NULLIF(ledger_code,''), 'UNASSIGNED') AS ledger_code,
      COALESCE(NULLIF(ledger_name,''), 'Unassigned') AS ledger_name,
      COALESCE(SUM(CAST(ROUND((COALESCE(amount,0) + COALESCE(tax_amount,0)) * 100.0) AS INTEGER)),0) AS total_cents,
      COUNT(*) AS entry_count
    FROM accounting_expenses
    WHERE substr(COALESCE(expense_date, created_at, datetime('now')),1,10) >= ?
      AND substr(COALESCE(expense_date, created_at, datetime('now')),1,10) < ?
    GROUP BY ledger_code, ledger_name
    ORDER BY total_cents DESC, ledger_name ASC
  `, [range.start, range.end]) : [];

  const overheadSummary = hasOverhead ? await scalar(db, `
    SELECT
      COALESCE(SUM(COALESCE(amount_cents,0)),0) AS overhead_cents,
      COUNT(*) AS overhead_count
    FROM accounting_overhead_allocations
    WHERE period_month = ?
  `, [range.raw]) : {};

  const overheadGroups = hasOverhead ? await safeAll(db, `
    SELECT
      COALESCE(NULLIF(ledger_code,''), 'UNASSIGNED') AS ledger_code,
      COALESCE(NULLIF(ledger_name,''), 'Unassigned') AS ledger_name,
      COALESCE(SUM(COALESCE(amount_cents,0)),0) AS total_cents,
      COUNT(*) AS entry_count,
      COALESCE(MIN(allocation_basis),'manual') AS allocation_basis
    FROM accounting_overhead_allocations
    WHERE period_month = ?
    GROUP BY ledger_code, ledger_name
    ORDER BY total_cents DESC, ledger_name ASC
  `, [range.raw]) : [];

  const glAccounts = hasGl ? await safeAll(db, `
    SELECT code, name, category, parent_group, normal_balance, sort_order
    FROM general_ledger_accounts
    ORDER BY category ASC, sort_order ASC, code ASC
    LIMIT 250
  `) : [];

  const recognizedRevenueCents = cents(revenueSummary.recognized_cents);
  const expenseCents = cents(expenseSummary.expense_cents);
  const expenseTaxCents = cents(expenseSummary.expense_tax_cents);
  const writeoffCents = cents(writeoffSummary.writeoff_cents);
  const overheadCents = cents(overheadSummary.overhead_cents);
  const roughNetBeforeOverheadCents = recognizedRevenueCents - expenseCents - expenseTaxCents - writeoffCents;
  const estimatedSoldUnitCogs = cents(costing.summary?.estimated_recognized_full_cogs_cents);

  return jsonResponse({
    ok: true,
    period: range.raw,
    summary: {
      revenue_source: revenueSummary.source,
      order_count: revenueSummary.order_count,
      recognized_order_count: revenueSummary.recognized_order_count,
      expense_count: cents(expenseSummary.expense_count),
      writeoff_count: cents(writeoffSummary.writeoff_count),
      overhead_count: cents(overheadSummary.overhead_count),
      booked_amount: Number((cents(revenueSummary.booked_cents) / 100).toFixed(2)),
      booked_tax: Number((cents(revenueSummary.recognized_tax_cents) / 100).toFixed(2)),
      recognized_amount: Number((recognizedRevenueCents / 100).toFixed(2)),
      recognized_amount_cents: recognizedRevenueCents,
      operating_expense_cents: expenseCents,
      operating_expense_tax_cents: expenseTaxCents,
      writeoff_cents: writeoffCents,
      rough_net_before_cogs_cents: roughNetBeforeOverheadCents,
      overhead_allocated_cents: overheadCents,
      rough_net_after_overhead_cents: roughNetBeforeOverheadCents - overheadCents,
      sold_quantity_in_period: cents(costing.summary?.sold_quantity_in_period),
      sold_order_count_in_period: cents(costing.summary?.sold_order_count_in_period),
      products_sold_in_period: cents(costing.summary?.products_sold_in_period),
      estimated_recognized_base_cogs_cents: cents(costing.summary?.estimated_recognized_base_cogs_cents),
      estimated_recognized_overhead_cogs_cents: cents(costing.summary?.estimated_recognized_overhead_cogs_cents),
      estimated_recognized_full_cogs_cents: estimatedSoldUnitCogs,
      rough_gross_after_estimated_cogs_cents: recognizedRevenueCents - estimatedSoldUnitCogs,
    },
    expense_groups: groupedExpenses.map((row) => ({
      ledger_code: row.ledger_code || 'UNASSIGNED',
      ledger_name: row.ledger_name || 'Unassigned',
      total_cents: cents(row.total_cents),
      entry_count: cents(row.entry_count),
    })),
    overhead_groups: overheadGroups.map((row) => ({
      ledger_code: row.ledger_code || 'UNASSIGNED',
      ledger_name: row.ledger_name || 'Unassigned',
      total_cents: cents(row.total_cents),
      entry_count: cents(row.entry_count),
      allocation_basis: row.allocation_basis || 'manual',
    })),
    costing_summary: costing.summary || {},
    general_ledger_accounts: glAccounts.map((row) => ({
      code: row.code || '',
      name: row.name || '',
      category: row.category || '',
      parent_group: row.parent_group || '',
      normal_balance: row.normal_balance || '',
      sort_order: Number(row.sort_order || 0),
    })),
  });
}
