import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { ensureAccountingReconciliationReviewsTable } from './_accountingReconciliation.js';

function periodValue(value) {
  const raw = String(value || '').trim();
  return /^\d{4}-\d{2}$/.test(raw) ? raw : new Date().toISOString().slice(0,7);
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureAccountingReconciliationReviewsTable(db);
  const url = new URL(context.request.url);
  const periodMonth = periodValue(url.searchParams.get('period_month'));
  const review = await db.prepare(`SELECT * FROM accounting_reconciliation_reviews WHERE reconciliation_type='sales_tax' AND period_month=? AND scope_key='all' LIMIT 1`).bind(periodMonth).first().catch(() => null);
  const detail = (() => { try { return JSON.parse(String(review?.detail_json || '{}')); } catch { return {}; } })();
  const worksheet = {
    period_month: periodMonth,
    tax_collected_cents: Number(detail.tax_collected_cents || review?.reference_amount_cents || 0),
    input_tax_cents: Number(detail.input_tax_cents || 0),
    net_tax_payable_cents: Number(detail.net_tax_payable_cents || review?.book_amount_cents || 0),
    statement_tax_cents: Number(detail.statement_tax_cents || review?.statement_amount_cents || 0),
    gross_sales_cents: Number(detail.gross_sales_cents || 0),
    shipping_cents: Number(detail.shipping_cents || 0),
    discount_cents: Number(detail.discount_cents || 0),
    order_count: Number(detail.order_count || 0),
    expense_count: Number(detail.expense_count || 0),
    filing_difference_cents: Number(review?.difference_cents || 0),
    review_status: review?.review_status || 'draft',
    statement_reference: review?.statement_reference || '',
    note: review?.note || '',
  };
  return jsonResponse({ ok: true, worksheet });
}
