// Release 467 Build 27 — read-only Order ↔ Finance settlement-readiness reconciliation.
// Compares current order/payment/refund evidence with the Accounting-owned bounded read contract.
// No payment, refund, accounting, order, schema, provider, Access, main or Production action is performed.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { onRequestGet as loadAccounting } from './contracts/accounting-read.js';

const RELEASE = 467;
const BUILD = 27;
const CLOSED_STATUSES = new Set(['completed','cancelled','canceled','refunded']);
const PAID_STATUSES = new Set(['paid','completed','captured']);
const json = (data, status = 200) => jsonResponse(data, status, { 'Cache-Control': 'no-store' });
const n = (value, fallback = 0) => { const x = Number(value); return Number.isFinite(x) ? x : fallback; };
const text = (value) => String(value == null ? '' : value).trim();
const lower = (value) => text(value).toLowerCase();

async function loadOrders(db) {
  const result = await db.prepare(`
    WITH payment_summary AS (
      SELECT order_id,
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(payment_status,'')) IN ('paid','completed','captured') THEN COALESCE(amount_cents,0) ELSE 0 END),0) AS paid_cents,
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(payment_status,'')) IN ('pending','authorized') THEN COALESCE(amount_cents,0) ELSE 0 END),0) AS pending_cents
      FROM payments
      GROUP BY order_id
    ),
    refund_summary AS (
      SELECT order_id,
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(refund_status,'')) IN ('recorded','submitted','succeeded')
          AND LOWER(COALESCE(provider_sync_status,'')) <> 'failed' THEN COALESCE(amount_cents,0) ELSE 0 END),0) AS refunded_cents,
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(refund_status,'')) IN ('requested','submitted')
          OR LOWER(COALESCE(provider_sync_status,'')) IN ('pending','failed') THEN 1 ELSE 0 END),0) AS refund_attention_count
      FROM payment_refunds
      GROUP BY order_id
    )
    SELECT o.order_id,o.order_number,o.order_status,o.payment_status,o.currency,o.total_cents,o.created_at,o.updated_at,
      COALESCE(ps.paid_cents,0) AS paid_cents,
      COALESCE(ps.pending_cents,0) AS pending_cents,
      COALESCE(rs.refunded_cents,0) AS refunded_cents,
      COALESCE(rs.refund_attention_count,0) AS refund_attention_count
    FROM orders o
    LEFT JOIN payment_summary ps ON ps.order_id=o.order_id
    LEFT JOIN refund_summary rs ON rs.order_id=o.order_id
    WHERE LOWER(COALESCE(o.order_status,'pending')) NOT IN ('cancelled','canceled')
       OR COALESCE(rs.refund_attention_count,0) > 0
    ORDER BY datetime(o.updated_at) DESC,o.order_id DESC
    LIMIT 100
  `).all();
  return Array.isArray(result?.results) ? result.results : [];
}

async function accountingSnapshot(context) {
  const u = new URL(context.request.url);
  u.search = '?limit=100';
  const request = new Request(u.toString(), { method: 'GET', headers: context.request.headers });
  const response = await loadAccounting({ ...context, request });
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

function reconcile(order, record, schemaReady) {
  const orderId = n(order.order_id);
  const total = Math.max(0, n(order.total_cents));
  const paid = Math.max(0, n(order.paid_cents));
  const refunded = Math.max(0, n(order.refunded_cents));
  const effectivePaid = Math.max(0, paid - refunded);
  const outstanding = Math.max(0, total - effectivePaid);
  const orderStatus = lower(order.order_status || 'pending');
  const paymentStatus = lower(order.payment_status || 'pending');
  const currency = text(order.currency || 'CAD').toUpperCase() || 'CAD';
  const closed = CLOSED_STATUSES.has(orderStatus);
  const ownerUrls = {
    order: `/admin/stripe-purchases/?order_id=${encodeURIComponent(orderId)}`,
    accounting: '/admin/accounting/',
    fulfillment: '/admin/order-fulfillment-care/',
    inventory: '/admin/order-inventory-fulfillment-readiness/',
  };

  if (!schemaReady) return {
    ...order, effective_paid_cents: effectivePaid, expected_outstanding_cents: outstanding,
    settlement_state: 'accounting_unverified', settlement_supported: false,
    detail: 'Accounting read authority is not schema-ready, so settlement evidence cannot be relied on.',
    owner_urls: ownerUrls,
  };
  if (!record) return {
    ...order, effective_paid_cents: effectivePaid, expected_outstanding_cents: outstanding,
    settlement_state: 'accounting_record_missing', settlement_supported: false,
    detail: 'This order has no matching Accounting-owned order record. Review Accounting before relying on settlement state.',
    owner_urls: ownerUrls,
  };

  const financeTotal = Math.max(0, n(record.total_cents));
  const financePaid = Math.max(0, n(record.amount_paid_cents));
  const financeOutstanding = Math.max(0, n(record.amount_outstanding_cents));
  const financeCurrency = text(record.currency || 'CAD').toUpperCase() || 'CAD';
  let state = 'settlement_supported';
  let supported = true;
  let detail = 'Order totals and current Accounting-owned payment/outstanding evidence agree for review purposes.';

  if (n(order.refund_attention_count) > 0) {
    state = 'refund_review';
    supported = false;
    detail = `${n(order.refund_attention_count)} refund item(s) still require review; Build 27 never executes or approves refunds.`;
  } else if (currency !== financeCurrency) {
    state = 'currency_mismatch'; supported = false;
    detail = `Order currency ${currency} differs from Accounting currency ${financeCurrency}.`;
  } else if (total !== financeTotal) {
    state = 'order_total_mismatch'; supported = false;
    detail = `Order total ${total} cents differs from Accounting total ${financeTotal} cents.`;
  } else if (effectivePaid !== financePaid) {
    state = 'paid_amount_mismatch'; supported = false;
    detail = `Effective paid evidence ${effectivePaid} cents differs from Accounting paid evidence ${financePaid} cents.`;
  } else if (outstanding !== financeOutstanding) {
    state = 'outstanding_amount_mismatch'; supported = false;
    detail = `Expected outstanding ${outstanding} cents differs from Accounting outstanding ${financeOutstanding} cents.`;
  } else if (!closed && PAID_STATUSES.has(paymentStatus) && outstanding > 0) {
    state = 'payment_status_mismatch'; supported = false;
    detail = 'Order payment status is paid/captured but the reconciled outstanding balance is still positive.';
  }

  return {
    ...order,
    effective_paid_cents: effectivePaid,
    expected_outstanding_cents: outstanding,
    accounting_order_record_id: n(record.accounting_order_record_id) || null,
    accounting_entry_status: record.entry_status || '',
    accounting_total_cents: financeTotal,
    accounting_paid_cents: financePaid,
    accounting_outstanding_cents: financeOutstanding,
    accounting_currency: financeCurrency,
    accounting_source_order_status: record.source_order_status || '',
    accounting_source_payment_status: record.source_payment_status || '',
    settlement_state: state,
    settlement_supported: supported,
    detail,
    owner_urls: ownerUrls,
  };
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok:false, release:RELEASE, build:BUILD, error:'Admin access required.' },401);
  const db = getDb(context.env);
  if (!db) return json({ ok:false, release:RELEASE, build:BUILD, error:'Database binding is not configured.' },500);

  try {
    const [{ response, payload }, orders] = await Promise.all([accountingSnapshot(context), loadOrders(db)]);
    if (!response.ok || !payload || payload.ok === false) {
      return json({ ok:false, release:RELEASE, build:BUILD, error:payload?.error || `Accounting read authority returned HTTP ${response.status}.` }, response.status || 500);
    }
    const records = new Map((Array.isArray(payload.records) ? payload.records : []).map((r) => [n(r.order_id), r]));
    const schemaReady = payload.schema_ready === true;
    const rows = orders.map((order) => reconcile(order, records.get(n(order.order_id)), schemaReady))
      .sort((a,b) => Number(a.settlement_supported) - Number(b.settlement_supported)
        || n(b.refund_attention_count) - n(a.refund_attention_count)
        || String(b.updated_at || '').localeCompare(String(a.updated_at || '')));
    const count = (state) => rows.filter((x) => x.settlement_state === state).length;
    return json({
      ok:true,
      release:RELEASE,
      build:BUILD,
      role:'read_only_order_finance_settlement_readiness_reconciliation',
      accounting_contract:payload.contract || 'accounting-read',
      accounting_schema_ready:schemaReady,
      summary:{
        orders_reviewed:rows.length,
        settlement_supported:count('settlement_supported'),
        accounting_unverified:count('accounting_unverified'),
        accounting_record_missing:count('accounting_record_missing'),
        refund_review:count('refund_review'),
        currency_mismatch:count('currency_mismatch'),
        order_total_mismatch:count('order_total_mismatch'),
        paid_amount_mismatch:count('paid_amount_mismatch'),
        outstanding_amount_mismatch:count('outstanding_amount_mismatch'),
        payment_status_mismatch:count('payment_status_mismatch'),
      },
      rows,
      boundaries:{
        settlement_readiness_is_posting_authorization:false,
        payment_execution:false,
        refund_execution:false,
        accounting_posting:false,
        order_mutation:false,
        inventory_mutation:false,
        request_time_schema_mutation:false,
        provider_execution:false,
        main_mutation:false,
        production_mutation:false,
      },
    });
  } catch (error) {
    return json({ ok:false, release:RELEASE, build:BUILD, error:'Order/Finance settlement readiness failed.', detail:String(error?.message || error) },500);
  }
}
