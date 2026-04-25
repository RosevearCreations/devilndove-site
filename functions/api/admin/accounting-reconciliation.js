import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { cleanPeriodMonth, cleanReconciliationStatus, cleanReconciliationType, ensureAccountingReconciliationReviewsTable, listAccountingReconciliationReviews } from './_accountingReconciliation.js';
import { ensureAccountingPeriodClosuresTable } from './_accountingPeriods.js';
import { ensureAccountingVendorsTable } from './_accountingVendors.js';

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function centsFromDollars(value) {
  return Math.round(Number(value || 0) * 100);
}


async function getTableColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(rows(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

function firstExisting(cols, names, fallback = '0') {
  for (const name of names) {
    if (cols.has(name)) return name;
  }
  return fallback;
}
async function tableExists(db, tableName) {
  try {
    const row = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(tableName).first();
    return !!row;
  } catch {
    return false;
  }
}

function providerScopeFromText(text) {
  const raw = normalizeText(text).toLowerCase();
  if (!raw) return 'other';
  if (raw.includes('paypal')) return 'paypal';
  if (raw.includes('stripe')) return 'stripe';
  if (raw.includes('square')) return 'square';
  if (raw.includes('bank')) return 'bank';
  return 'other';
}

async function loadSalesTaxSummary(db, periodMonth) {
  const start = `${periodMonth}-01`;
  const end = new Date(Date.UTC(Number(periodMonth.slice(0, 4)), Number(periodMonth.slice(5, 7)), 1)).toISOString().slice(0, 10);
  const hasOrders = await tableExists(db, 'orders');
  const hasExpenses = await tableExists(db, 'accounting_expenses');
  const orderCols = hasOrders ? await getTableColumnSet(db, 'orders') : new Set();
  let collected = 0;
  let inputTax = 0;
  let orderCount = 0;
  let expenseCount = 0;

  if (hasOrders) {
    const taxExpr = orderCols.has('tax_cents') ? 'COALESCE(tax_cents,0)' : (orderCols.has('tax_amount') ? 'CAST(ROUND(COALESCE(tax_amount,0) * 100.0) AS INTEGER)' : (orderCols.has('tax_total') ? 'CAST(ROUND(COALESCE(tax_total,0) * 100.0) AS INTEGER)' : '0'));
    const statusCol = firstExisting(orderCols, ['order_status', 'status'], "''");
    const createdCol = firstExisting(orderCols, ['created_at'], "datetime('now')");
    const row = await db.prepare(`
      SELECT COALESCE(SUM(${taxExpr}),0) AS collected_cents,
             COUNT(*) AS order_count
      FROM orders
      WHERE substr(COALESCE(${createdCol}, datetime('now')),1,10) >= ?
        AND substr(COALESCE(${createdCol}, datetime('now')),1,10) < ?
        AND LOWER(COALESCE(${statusCol}, '')) IN ('paid','fulfilled','refunded')
    `).bind(start, end).first().catch(() => null);
    collected = Number(row?.collected_cents || 0);
    orderCount = Number(row?.order_count || 0);
  }

  if (hasExpenses) {
    const row = await db.prepare(`
      SELECT COALESCE(SUM(CAST(ROUND(COALESCE(tax_amount,0) * 100.0) AS INTEGER)),0) AS input_tax_cents,
             COUNT(*) AS expense_count
      FROM accounting_expenses
      WHERE substr(COALESCE(expense_date, created_at, datetime('now')),1,10) >= ?
        AND substr(COALESCE(expense_date, created_at, datetime('now')),1,10) < ?
    `).bind(start, end).first().catch(() => null);
    inputTax = Number(row?.input_tax_cents || 0);
    expenseCount = Number(row?.expense_count || 0);
  }

  return {
    period_month: periodMonth,
    rows: [{
      scope_key: 'all',
      label: 'Sales tax collected vs input tax credits',
      reference_amount_cents: collected,
      compared_amount_cents: inputTax,
      difference_cents: collected - inputTax,
      order_count: orderCount,
      expense_count: expenseCount,
    }],
  };
}

async function loadProcessorFeeSummary(db, periodMonth) {
  const start = `${periodMonth}-01`;
  const end = new Date(Date.UTC(Number(periodMonth.slice(0, 4)), Number(periodMonth.slice(5, 7)), 1)).toISOString().slice(0, 10);
  const hasPayments = await tableExists(db, 'payments');
  const hasExpenses = await tableExists(db, 'accounting_expenses');
  const paymentCols = hasPayments ? await getTableColumnSet(db, 'payments') : new Set();
  const providerRows = [];

  if (hasPayments) {
    const amountExpr = paymentCols.has('amount_cents') ? 'COALESCE(amount_cents,0)' : (paymentCols.has('amount') ? 'CAST(ROUND(COALESCE(amount,0) * 100.0) AS INTEGER)' : '0');
    const paidAtCol = firstExisting(paymentCols, ['paid_at','created_at'], "datetime('now')");
    const paymentStatusCol = firstExisting(paymentCols, ['payment_status'], "''");
    const paymentRows = rows(await db.prepare(`
      SELECT LOWER(COALESCE(provider,'other')) AS provider,
             COALESCE(SUM(${amountExpr}),0) AS gross_paid_cents,
             COUNT(*) AS payment_count
      FROM payments
      WHERE substr(COALESCE(${paidAtCol}, datetime('now')),1,10) >= ?
        AND substr(COALESCE(${paidAtCol}, datetime('now')),1,10) < ?
        AND LOWER(COALESCE(${paymentStatusCol},'')) IN ('paid','partially_refunded','refunded')
      GROUP BY provider
      ORDER BY provider ASC
    `).bind(start, end).all().catch(() => ({ results: [] })));
    providerRows.push(...paymentRows.map((row) => ({
      scope_key: row.provider || 'other',
      label: `${row.provider || 'other'} paid volume vs booked fees`,
      reference_amount_cents: Number(row.gross_paid_cents || 0),
      compared_amount_cents: 0,
      difference_cents: 0,
      payment_count: Number(row.payment_count || 0),
      booked_expense_count: 0,
    })));
  }

  if (hasExpenses) {
    const feeRows = rows(await db.prepare(`
      SELECT LOWER(COALESCE(vendor_name,'')) AS vendor_name,
             LOWER(COALESCE(notes,'')) AS notes,
             COALESCE(SUM(CAST(ROUND((COALESCE(amount,0) + COALESCE(tax_amount,0)) * 100.0) AS INTEGER)),0) AS booked_fee_cents,
             COUNT(*) AS expense_count
      FROM accounting_expenses
      WHERE substr(COALESCE(expense_date, created_at, datetime('now')),1,10) >= ?
        AND substr(COALESCE(expense_date, created_at, datetime('now')),1,10) < ?
        AND (
          COALESCE(ledger_code,'') IN ('6715','6720')
          OR LOWER(COALESCE(vendor_name,'')) LIKE '%paypal%'
          OR LOWER(COALESCE(vendor_name,'')) LIKE '%stripe%'
          OR LOWER(COALESCE(vendor_name,'')) LIKE '%square%'
          OR LOWER(COALESCE(vendor_name,'')) LIKE '%bank%'
          OR LOWER(COALESCE(notes,'')) LIKE '%merchant%'
          OR LOWER(COALESCE(notes,'')) LIKE '%processor%'
        )
      GROUP BY vendor_name, notes
    `).bind(start, end).all().catch(() => ({ results: [] })));
    for (const fee of feeRows) {
      const scope = providerScopeFromText(`${fee.vendor_name} ${fee.notes}`);
      let row = providerRows.find((item) => item.scope_key === scope);
      if (!row) {
        row = { scope_key: scope, label: `${scope} paid volume vs booked fees`, reference_amount_cents: 0, compared_amount_cents: 0, difference_cents: 0, payment_count: 0, booked_expense_count: 0 };
        providerRows.push(row);
      }
      row.compared_amount_cents += Number(fee.booked_fee_cents || 0);
      row.booked_expense_count += Number(fee.expense_count || 0);
    }
  }

  for (const row of providerRows) {
    row.difference_cents = Number(row.reference_amount_cents || 0) - Number(row.compared_amount_cents || 0);
    row.fee_ratio_basis_points = row.reference_amount_cents > 0 ? Math.round((Number(row.compared_amount_cents || 0) / Number(row.reference_amount_cents || 0)) * 10000) : 0;
  }
  providerRows.sort((a, b) => String(a.scope_key).localeCompare(String(b.scope_key)));
  return { period_month: periodMonth, rows: providerRows };
}

async function loadShippingSummary(db, periodMonth) {
  const start = `${periodMonth}-01`;
  const end = new Date(Date.UTC(Number(periodMonth.slice(0, 4)), Number(periodMonth.slice(5, 7)), 1)).toISOString().slice(0, 10);
  const hasOrders = await tableExists(db, 'orders');
  const hasExpenses = await tableExists(db, 'accounting_expenses');
  const orderCols = hasOrders ? await getTableColumnSet(db, 'orders') : new Set();
  let charged = 0;
  let booked = 0;
  let fulfilledCount = 0;
  let expenseCount = 0;

  if (hasOrders) {
    const shippingExpr = orderCols.has('shipping_cents') ? 'COALESCE(shipping_cents,0)' : (orderCols.has('shipping_amount') ? 'CAST(ROUND(COALESCE(shipping_amount,0) * 100.0) AS INTEGER)' : '0');
    const statusCol = firstExisting(orderCols, ['order_status','status'], "''");
    const createdCol = firstExisting(orderCols, ['created_at'], "datetime('now')");
    const row = await db.prepare(`
      SELECT COALESCE(SUM(${shippingExpr}),0) AS shipping_charged_cents,
             COUNT(*) AS fulfilled_count
      FROM orders
      WHERE substr(COALESCE(${createdCol}, datetime('now')),1,10) >= ?
        AND substr(COALESCE(${createdCol}, datetime('now')),1,10) < ?
        AND LOWER(COALESCE(${statusCol}, '')) IN ('fulfilled','paid')
    `).bind(start, end).first().catch(() => null);
    charged = Number(row?.shipping_charged_cents || 0);
    fulfilledCount = Number(row?.fulfilled_count || 0);
  }

  if (hasExpenses) {
    const row = await db.prepare(`
      SELECT COALESCE(SUM(CAST(ROUND((COALESCE(amount,0) + COALESCE(tax_amount,0)) * 100.0) AS INTEGER)),0) AS shipping_expense_cents,
             COUNT(*) AS expense_count
      FROM accounting_expenses
      WHERE substr(COALESCE(expense_date, created_at, datetime('now')),1,10) >= ?
        AND substr(COALESCE(expense_date, created_at, datetime('now')),1,10) < ?
        AND (
          COALESCE(ledger_code,'') IN ('9270','9205')
          OR LOWER(COALESCE(vendor_name,'')) LIKE '%canada post%'
          OR LOWER(COALESCE(vendor_name,'')) LIKE '%courier%'
          OR LOWER(COALESCE(vendor_name,'')) LIKE '%ups%'
          OR LOWER(COALESCE(vendor_name,'')) LIKE '%fedex%'
          OR LOWER(COALESCE(notes,'')) LIKE '%shipping%'
          OR LOWER(COALESCE(notes,'')) LIKE '%postage%'
        )
    `).bind(start, end).first().catch(() => null);
    booked = Number(row?.shipping_expense_cents || 0);
    expenseCount = Number(row?.expense_count || 0);
  }

  return {
    period_month: periodMonth,
    rows: [{
      scope_key: 'all',
      label: 'Shipping charged vs booked shipping costs',
      reference_amount_cents: charged,
      compared_amount_cents: booked,
      difference_cents: charged - booked,
      fulfilled_order_count: fulfilledCount,
      shipping_expense_count: expenseCount,
    }],
  };
}

async function loadSummaryByType(db, reconciliationType, periodMonth) {
  if (reconciliationType === 'processor_fees') return loadProcessorFeeSummary(db, periodMonth);
  if (reconciliationType === 'shipping') return loadShippingSummary(db, periodMonth);
  return loadSalesTaxSummary(db, periodMonth);
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureAccountingReconciliationReviewsTable(db);
  await ensureAccountingPeriodClosuresTable(db);
  await ensureAccountingVendorsTable(db);

  const url = new URL(context.request.url);
  const reconciliationType = cleanReconciliationType(url.searchParams.get('type'));
  const periodMonth = cleanPeriodMonth(url.searchParams.get('period_month'));
  const computed = await loadSummaryByType(db, reconciliationType, periodMonth);
  const reviews = await listAccountingReconciliationReviews(db, { reconciliationType, periodMonth, includeAllPeriods: url.searchParams.get('all_periods') === '1' });
  const reviewMap = new Map(reviews.map((row) => [`${row.period_month}|${row.scope_key}`, row]));
  const rowsWithReviews = computed.rows.map((row) => ({ ...row, review: reviewMap.get(`${periodMonth}|${row.scope_key}`) || null }));
  return jsonResponse({
    ok: true,
    type: reconciliationType,
    period_month: periodMonth,
    rows: rowsWithReviews,
    reviews,
    summary: {
      row_count: rowsWithReviews.length,
      finalized_count: reviews.filter((row) => row.review_status === 'finalized').length,
      reviewed_count: reviews.filter((row) => row.review_status === 'reviewed' || row.review_status === 'finalized').length,
    },
  });
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureAccountingReconciliationReviewsTable(db);
  let body = {};
  try { body = await context.request.json(); } catch { return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400); }

  const reconciliationType = cleanReconciliationType(body.reconciliation_type || body.type);
  const periodMonth = cleanPeriodMonth(body.period_month);
  const scopeKey = normalizeText(body.scope_key) || 'all';
  const reviewStatus = cleanReconciliationStatus(body.review_status);
  const note = normalizeText(body.note);
  const referenceAmountCents = Number(body.reference_amount_cents || 0);
  const comparedAmountCents = Number(body.compared_amount_cents || 0);
  const differenceCents = Number(body.difference_cents || 0);

  await db.prepare(`
    INSERT INTO accounting_reconciliation_reviews (
      reconciliation_type, period_month, scope_key, review_status, note,
      reference_amount_cents, compared_amount_cents, difference_cents,
      created_by_user_id, updated_by_user_id, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(reconciliation_type, period_month, scope_key) DO UPDATE SET
      review_status = excluded.review_status,
      note = excluded.note,
      reference_amount_cents = excluded.reference_amount_cents,
      compared_amount_cents = excluded.compared_amount_cents,
      difference_cents = excluded.difference_cents,
      updated_by_user_id = excluded.updated_by_user_id,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    reconciliationType, periodMonth, scopeKey, reviewStatus, note || null,
    Math.round(referenceAmountCents || 0), Math.round(comparedAmountCents || 0), Math.round(differenceCents || 0),
    Number(adminUser.user_id || 0), Number(adminUser.user_id || 0)
  ).run();

  await auditAdminAction(context.env, context.request, adminUser, {
    action_type: 'save_accounting_reconciliation_review',
    target_type: 'accounting_reconciliation_review',
    target_key: `${reconciliationType}:${periodMonth}:${scopeKey}`,
    details: { reconciliation_type: reconciliationType, period_month: periodMonth, scope_key: scopeKey, review_status: reviewStatus },
  });

  return jsonResponse({ ok: true, reconciliation_type: reconciliationType, period_month: periodMonth, scope_key: scopeKey });
}
