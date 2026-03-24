// File: /functions/api/admin/payment-actions.js
// Brief description: Records refund and dispute workflows from the admin side, updates local
// payment/order state, and stores a durable audit trail for later provider-side reconciliation.

function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } }); }
function normalizeText(value) { return String(value || '').trim(); }
function getDb(env) { return env.DB || env.DD_DB; }
function getBearerToken(request) { const authHeader = request.headers.get('Authorization') || ''; const match = authHeader.match(/^Bearer\s+(.+)$/i); return match ? String(match[1] || '').trim() : ''; }
async function getAdminUserFromRequest(request, env) {
  const db = getDb(env); const token = getBearerToken(request); if (!token || !db) return null;
  const session = await db.prepare(`SELECT s.user_id, u.user_id AS resolved_user_id, u.email, u.display_name, u.role, u.is_active FROM sessions s INNER JOIN users u ON u.user_id = s.user_id WHERE (s.session_token = ? OR s.token = ?) AND s.expires_at > datetime('now') LIMIT 1`).bind(token, token).first();
  if (!session || Number(session.is_active || 0) !== 1 || String(session.role || '').toLowerCase() !== 'admin') return null;
  return { user_id: Number(session.resolved_user_id || session.user_id || 0), email: session.email || '', display_name: session.display_name || '' };
}
async function addHistory(db, orderId, oldStatus, newStatus, note) {
  await db.prepare(`INSERT INTO order_status_history (order_id, old_status, new_status, changed_by_user_id, note, created_at) VALUES (?, ?, ?, NULL, ?, CURRENT_TIMESTAMP)`).bind(orderId, oldStatus || null, newStatus || null, note || null).run().catch(() => null);
}
export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  let body = {};
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }

  const action = normalizeText(body.action).toLowerCase();
  const paymentId = Number(body.payment_id || 0);
  if (!['refund','dispute'].includes(action)) return json({ ok: false, error: 'Unsupported payment action.' }, 400);
  if (!Number.isInteger(paymentId) || paymentId <= 0) return json({ ok: false, error: 'A valid payment_id is required.' }, 400);

  const payment = await db.prepare(`SELECT payment_id, order_id, provider, provider_payment_id, provider_order_id, payment_status, amount_cents, currency, transaction_reference FROM payments WHERE payment_id = ? LIMIT 1`).bind(paymentId).first();
  if (!payment) return json({ ok: false, error: 'Payment not found.' }, 404);
  const order = await db.prepare(`SELECT order_id, order_status, payment_status, total_cents, currency FROM orders WHERE order_id = ? LIMIT 1`).bind(Number(payment.order_id || 0)).first();
  if (!order) return json({ ok: false, error: 'Order not found for payment.' }, 404);

  if (action === 'refund') {
    const refundAmount = Math.max(0, Number(body.amount_cents || 0));
    const reason = normalizeText(body.reason);
    const note = normalizeText(body.note);
    if (!Number.isFinite(refundAmount) || refundAmount <= 0) return json({ ok: false, error: 'Refund amount must be greater than zero.' }, 400);
    const status = refundAmount >= Number(payment.amount_cents || 0) ? 'refunded' : 'partially_refunded';
    await db.prepare(`INSERT INTO payment_refunds (payment_id, order_id, provider, provider_refund_id, amount_cents, currency, refund_status, reason, note, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
      paymentId,
      Number(payment.order_id || 0),
      payment.provider || 'other',
      normalizeText(body.provider_refund_id) || null,
      refundAmount,
      normalizeText(body.currency || payment.currency || order.currency || 'CAD').toUpperCase(),
      'recorded',
      reason || null,
      note || null,
      adminUser.user_id
    ).run();
    await db.prepare(`UPDATE payments SET payment_status = ?, updated_at = CURRENT_TIMESTAMP, notes = TRIM(COALESCE(notes,'') || CASE WHEN COALESCE(notes,'') = '' THEN '' ELSE ' | ' END || ?) WHERE payment_id = ?`).bind(status, `Refund logged by admin${reason ? `: ${reason}` : ''}`, paymentId).run();
    await db.prepare(`UPDATE orders SET payment_status = ?, order_status = CASE WHEN ? = 'refunded' THEN 'refunded' ELSE order_status END, updated_at = CURRENT_TIMESTAMP WHERE order_id = ?`).bind(status, status, Number(payment.order_id || 0)).run();
    await addHistory(db, Number(payment.order_id || 0), order.order_status || null, status === 'refunded' ? 'refunded' : order.order_status || null, note || `Refund recorded for payment ${paymentId}.`);
    return json({ ok: true, message: 'Refund recorded locally.', action, payment_id: paymentId, order_id: Number(payment.order_id || 0), payment_status: status });
  }

  const disputeAmount = Math.max(0, Number(body.amount_cents || payment.amount_cents || 0));
  const disputeStatus = normalizeText(body.dispute_status || 'open').toLowerCase();
  const reason = normalizeText(body.reason || body.dispute_reason);
  const note = normalizeText(body.note);
  await db.prepare(`INSERT INTO payment_disputes (payment_id, order_id, provider, provider_dispute_id, dispute_status, amount_cents, currency, reason, evidence_due_at, note, created_by_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`).bind(
    paymentId,
    Number(payment.order_id || 0),
    payment.provider || 'other',
    normalizeText(body.provider_dispute_id) || null,
    ['open','under_review','won','lost','closed'].includes(disputeStatus) ? disputeStatus : 'open',
    disputeAmount,
    normalizeText(body.currency || payment.currency || order.currency || 'CAD').toUpperCase(),
    reason || null,
    normalizeText(body.evidence_due_at) || null,
    note || null,
    adminUser.user_id
  ).run();
  await db.prepare(`UPDATE payments SET updated_at = CURRENT_TIMESTAMP, notes = TRIM(COALESCE(notes,'') || CASE WHEN COALESCE(notes,'') = '' THEN '' ELSE ' | ' END || ?) WHERE payment_id = ?`).bind(`Dispute logged by admin${reason ? `: ${reason}` : ''}`, paymentId).run();
  await db.prepare(`UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE order_id = ?`).bind(Number(payment.order_id || 0)).run();
  await addHistory(db, Number(payment.order_id || 0), order.order_status || null, order.order_status || null, note || `Dispute logged for payment ${paymentId}.`);
  return json({ ok: true, message: 'Dispute recorded locally.', action, payment_id: paymentId, order_id: Number(payment.order_id || 0), dispute_status: disputeStatus || 'open' });
}
