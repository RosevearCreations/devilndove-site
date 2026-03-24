// File: /functions/api/admin/order-payments.js
// Brief description: Returns payment summary data for an order including refunds and disputes
// so the admin detail view can reconcile payment workflow state in one request.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function getBearerToken(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? String(match[1] || '').trim() : '';
}

async function getAdminUserFromRequest(request, env) {
  const token = getBearerToken(request);
  if (!token) return null;
  const session = await env.DB.prepare(`
    SELECT s.session_id, s.user_id, u.user_id AS resolved_user_id, u.email, u.display_name, u.role, u.is_active
    FROM sessions s
    INNER JOIN users u ON u.user_id = s.user_id
    WHERE (s.session_token = ? OR s.token = ?)
      AND s.expires_at > datetime('now')
    LIMIT 1
  `).bind(token, token).first();
  if (!session) return null;
  if (Number(session.is_active || 0) !== 1) return null;
  if (String(session.role || '').toLowerCase() !== 'admin') return null;
  return {
    session_id: Number(session.session_id || 0),
    user_id: Number(session.resolved_user_id || session.user_id || 0),
    email: session.email || '',
    display_name: session.display_name || '',
    role: 'admin'
  };
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function summarizePayments(orderTotalCents, payments) {
  const safePayments = Array.isArray(payments) ? payments : [];
  let paid_total_cents = 0;
  let pending_total_cents = 0;
  let refunded_total_cents = 0;
  let payment_count = safePayments.length;
  let hasAuthorized = false;
  let hasPending = false;
  let hasRefunded = false;
  let hasPartiallyRefunded = false;
  let allFailedOrCancelled = safePayments.length > 0;

  for (const payment of safePayments) {
    const status = String(payment.payment_status || '').toLowerCase();
    const amount = Number(payment.amount_cents || 0);
    if (['paid', 'completed', 'captured'].includes(status)) paid_total_cents += amount;
    if (['pending', 'authorized'].includes(status)) pending_total_cents += amount;
    if (status === 'authorized') hasAuthorized = true;
    if (status === 'pending') hasPending = true;
    if (status === 'refunded') { hasRefunded = true; refunded_total_cents += amount; }
    if (status === 'partially_refunded') { hasPartiallyRefunded = true; refunded_total_cents += amount; }
    if (!['failed', 'cancelled'].includes(status)) allFailedOrCancelled = false;
  }

  let derived_payment_status = 'pending';
  if (!payment_count) derived_payment_status = 'pending';
  else if (hasRefunded) derived_payment_status = 'refunded';
  else if (hasPartiallyRefunded) derived_payment_status = 'partially_refunded';
  else if (paid_total_cents >= Number(orderTotalCents || 0) && Number(orderTotalCents || 0) > 0) derived_payment_status = 'paid';
  else if (hasAuthorized) derived_payment_status = 'authorized';
  else if (hasPending) derived_payment_status = 'pending';
  else if (allFailedOrCancelled) derived_payment_status = 'failed';

  return {
    payment_count,
    paid_total_cents,
    pending_total_cents,
    refunded_total_cents,
    outstanding_cents: Math.max(Number(orderTotalCents || 0) - paid_total_cents, 0),
    derived_payment_status
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  const url = new URL(request.url);
  const order_id = Number(url.searchParams.get('order_id'));
  if (!Number.isInteger(order_id) || order_id <= 0) return json({ ok: false, error: 'A valid order_id is required.' }, 400);

  const order = await env.DB.prepare(`
    SELECT order_id, order_number, payment_status, total_cents, currency, created_at, updated_at
    FROM orders
    WHERE order_id = ?
    LIMIT 1
  `).bind(order_id).first();
  if (!order) return json({ ok: false, error: 'Order not found.' }, 404);

  const payments = normalizeResults(await env.DB.prepare(`
    SELECT payment_id, order_id, provider, provider_payment_id, provider_order_id, payment_status, amount_cents,
           currency, payment_method_label, transaction_reference, paid_at, created_at, updated_at, notes
    FROM payments
    WHERE order_id = ?
    ORDER BY created_at DESC, payment_id DESC
  `).bind(order_id).all());

  const refunds = normalizeResults(await env.DB.prepare(`
    SELECT refund_id, payment_id, order_id, provider, provider_refund_id, amount_cents, currency, refund_status, reason, note, created_at, updated_at
    FROM payment_refunds
    WHERE order_id = ?
    ORDER BY created_at DESC, refund_id DESC
  `).bind(order_id).all().catch(() => ({ results: [] })));

  const disputes = normalizeResults(await env.DB.prepare(`
    SELECT dispute_id, payment_id, order_id, provider, provider_dispute_id, dispute_status, amount_cents, currency, reason, evidence_due_at, note, created_at, updated_at
    FROM payment_disputes
    WHERE order_id = ?
    ORDER BY created_at DESC, dispute_id DESC
  `).bind(order_id).all().catch(() => ({ results: [] })));

  const summary = summarizePayments(order.total_cents, payments);

  return json({
    ok: true,
    requested_by: { user_id: adminUser.user_id, email: adminUser.email, display_name: adminUser.display_name },
    order: {
      order_id: Number(order.order_id || 0),
      order_number: order.order_number || '',
      payment_status: order.payment_status || 'pending',
      total_cents: Number(order.total_cents || 0),
      currency: order.currency || 'CAD',
      created_at: order.created_at || null,
      updated_at: order.updated_at || null
    },
    summary,
    payments: payments.map((payment) => ({
      payment_id: Number(payment.payment_id || 0),
      order_id: Number(payment.order_id || 0),
      provider: payment.provider || '',
      provider_payment_id: payment.provider_payment_id || null,
      provider_order_id: payment.provider_order_id || null,
      payment_status: payment.payment_status || 'pending',
      amount_cents: Number(payment.amount_cents || 0),
      currency: payment.currency || order.currency || 'CAD',
      payment_method_label: payment.payment_method_label || null,
      transaction_reference: payment.transaction_reference || null,
      paid_at: payment.paid_at || null,
      created_at: payment.created_at || null,
      updated_at: payment.updated_at || null,
      notes: payment.notes || null
    })),
    refunds: refunds.map((refund) => ({
      refund_id: Number(refund.refund_id || 0),
      payment_id: Number(refund.payment_id || 0),
      provider: refund.provider || '',
      provider_refund_id: refund.provider_refund_id || null,
      amount_cents: Number(refund.amount_cents || 0),
      currency: refund.currency || order.currency || 'CAD',
      refund_status: refund.refund_status || 'recorded',
      reason: refund.reason || null,
      note: refund.note || null,
      created_at: refund.created_at || null,
      updated_at: refund.updated_at || null
    })),
    disputes: disputes.map((dispute) => ({
      dispute_id: Number(dispute.dispute_id || 0),
      payment_id: Number(dispute.payment_id || 0),
      provider: dispute.provider || '',
      provider_dispute_id: dispute.provider_dispute_id || null,
      dispute_status: dispute.dispute_status || 'open',
      amount_cents: Number(dispute.amount_cents || 0),
      currency: dispute.currency || order.currency || 'CAD',
      reason: dispute.reason || null,
      evidence_due_at: dispute.evidence_due_at || null,
      note: dispute.note || null,
      created_at: dispute.created_at || null,
      updated_at: dispute.updated_at || null
    }))
  });
}
