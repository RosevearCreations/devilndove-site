// File: /functions/api/stripe-return.js
// Brief description: Confirms a Stripe Checkout return by retrieving the Checkout Session,
// updating local payment and order records, and recording order history even when the
// webhook has not been processed yet.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' }
  });
}

function normalizeText(value) {
  return String(value || '').trim();
}

function getDb(env) {
  return env.DB || env.DD_DB;
}

async function addHistory(env, orderId, oldStatus, newStatus, note) {
  const db = getDb(env);
  await db.prepare(`
    INSERT INTO order_status_history (
      order_id, old_status, new_status, changed_by_user_id, note, created_at
    ) VALUES (?, ?, ?, NULL, ?, CURRENT_TIMESTAMP)
  `).bind(orderId, oldStatus || null, newStatus, note || null).run().catch(() => null);
}

function deriveOrderStatus(existingOrderStatus, localPaymentStatus) {
  const current = normalizeText(existingOrderStatus).toLowerCase() || 'pending';
  if (localPaymentStatus === 'paid' && ['pending', 'draft'].includes(current)) return 'paid';
  if (['refunded', 'partially_refunded'].includes(localPaymentStatus) && ['paid', 'fulfilled'].includes(current)) return 'refunded';
  if (localPaymentStatus === 'failed' && current === 'draft') return 'pending';
  return current;
}

function mapStripeSessionStatus(session) {
  const paymentStatus = normalizeText(session?.payment_status).toLowerCase();
  const overallStatus = normalizeText(session?.status).toLowerCase();
  const amountTotal = Number(session?.amount_total || 0);
  const amountSubtotal = Number(session?.amount_subtotal || 0);
  const amountRefunded = Number(session?.amount_refunded || 0);

  if (paymentStatus === 'paid') return 'paid';
  if (amountRefunded > 0 && amountTotal > 0) return amountRefunded < amountTotal ? 'partially_refunded' : 'refunded';
  if (['expired', 'canceled'].includes(overallStatus)) return 'failed';
  if (paymentStatus === 'unpaid' || overallStatus === 'open' || amountSubtotal >= 0) return 'pending';
  return 'pending';
}

async function retrieveStripeSession(env, sessionId) {
  const secretKey = normalizeText(env.STRIPE_SECRET_KEY);
  if (!secretKey) throw new Error('Stripe credentials are not configured.');
  const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=payment_intent`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${secretKey}` }
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.id) {
    throw new Error(data?.error?.message || 'Failed to retrieve Stripe Checkout session.');
  }
  return data;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  let body = {};
  try { body = await request.json(); } catch { body = {}; }

  const orderId = Number(body.order_id || 0);
  const sessionId = normalizeText(body.session_id || body.provider_order_id || body.checkout_session_id);
  if (!Number.isInteger(orderId) || orderId <= 0) return json({ ok: false, error: 'A valid order_id is required.' }, 400);
  if (!sessionId) return json({ ok: false, error: 'A valid session_id is required.' }, 400);

  const localOrder = await db.prepare(`
    SELECT order_id, order_number, order_status, payment_status, total_cents, currency, customer_email
    FROM orders
    WHERE order_id = ?
    LIMIT 1
  `).bind(orderId).first();
  if (!localOrder) return json({ ok: false, error: 'Order not found.' }, 404);

  const existingPaid = await db.prepare(`
    SELECT payment_id, payment_status, provider_order_id, provider_payment_id, amount_cents, paid_at
    FROM payments
    WHERE order_id = ?
      AND LOWER(COALESCE(provider, '')) = 'stripe'
      AND LOWER(COALESCE(provider_order_id, '')) = LOWER(?)
      AND LOWER(COALESCE(payment_status, '')) = 'paid'
    ORDER BY payment_id DESC
    LIMIT 1
  `).bind(orderId, sessionId).first();

  if (existingPaid) {
    return json({
      ok: true,
      message: 'Stripe payment was already confirmed locally.',
      payment_status: 'paid',
      provider_order_id: existingPaid.provider_order_id || sessionId,
      provider_payment_id: existingPaid.provider_payment_id || null,
      order: {
        order_id: Number(localOrder.order_id || 0),
        order_number: localOrder.order_number || '',
        order_status: localOrder.order_status || 'paid',
        payment_status: 'paid'
      }
    });
  }

  const session = await retrieveStripeSession(env, sessionId);
  const metadataOrderId = Number(session?.metadata?.order_id || session?.payment_intent?.metadata?.order_id || 0);
  if (metadataOrderId > 0 && metadataOrderId !== orderId) {
    return json({ ok: false, error: 'Stripe session does not match the requested order.' }, 409);
  }

  const paymentIntent = session?.payment_intent || {};
  const paymentIntentId = normalizeText(paymentIntent?.id || session?.payment_intent);
  const localPaymentStatus = mapStripeSessionStatus(session);
  const amountCents = Number(session?.amount_total || paymentIntent?.amount_received || paymentIntent?.amount || localOrder.total_cents || 0);
  const paidAt = paymentIntent?.created
    ? new Date(Number(paymentIntent.created) * 1000).toISOString()
    : (session?.created ? new Date(Number(session.created) * 1000).toISOString() : new Date().toISOString());

  const localPayment = await db.prepare(`
    SELECT payment_id, provider_order_id, provider_payment_id, payment_status
    FROM payments
    WHERE order_id = ?
      AND LOWER(COALESCE(provider, '')) = 'stripe'
      AND (
        LOWER(COALESCE(provider_order_id, '')) = LOWER(?)
        OR LOWER(COALESCE(provider_payment_id, '')) = LOWER(?)
        OR provider_order_id IS NULL
        OR provider_order_id = ''
      )
    ORDER BY payment_id DESC
    LIMIT 1
  `).bind(orderId, sessionId, paymentIntentId || '').first();

  if (localPayment) {
    await db.prepare(`
      UPDATE payments
      SET provider = 'stripe',
          provider_order_id = ?,
          provider_payment_id = CASE WHEN ? != '' THEN ? ELSE provider_payment_id END,
          payment_status = ?,
          amount_cents = CASE WHEN ? > 0 THEN ? ELSE amount_cents END,
          transaction_reference = COALESCE(?, transaction_reference),
          paid_at = CASE WHEN ? = 'paid' THEN COALESCE(paid_at, ?) ELSE paid_at END,
          updated_at = CURRENT_TIMESTAMP,
          notes = COALESCE(notes, '') || ?
      WHERE payment_id = ?
    `).bind(
      sessionId,
      paymentIntentId || '',
      paymentIntentId || '',
      localPaymentStatus,
      amountCents,
      amountCents,
      paymentIntentId || sessionId || null,
      localPaymentStatus,
      paidAt,
      ` Stripe return confirmation processed from checkout session ${sessionId}.`,
      Number(localPayment.payment_id || 0)
    ).run();
  } else {
    await db.prepare(`
      INSERT INTO payments (
        order_id, provider, provider_payment_id, provider_order_id, payment_status,
        amount_cents, currency, payment_method_label, transaction_reference,
        paid_at, created_at, updated_at, notes
      ) VALUES (?, 'stripe', ?, ?, ?, ?, ?, 'stripe', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)
    `).bind(
      orderId,
      paymentIntentId || null,
      sessionId,
      localPaymentStatus,
      amountCents,
      localOrder.currency || 'CAD',
      paymentIntentId || sessionId || null,
      localPaymentStatus === 'paid' ? paidAt : null,
      'Stripe return confirmation inserted local payment record.'
    ).run();
  }

  const nextOrderStatus = deriveOrderStatus(localOrder.order_status, localPaymentStatus);
  await db.prepare(`
    UPDATE orders
    SET payment_status = ?,
        order_status = ?,
        payment_method = 'stripe',
        updated_at = CURRENT_TIMESTAMP
    WHERE order_id = ?
  `).bind(localPaymentStatus, nextOrderStatus, orderId).run();

  await addHistory(env, orderId, normalizeText(localOrder.order_status).toLowerCase() || 'pending', nextOrderStatus, `Stripe return confirmation processed for checkout session ${sessionId}.`);

  return json({
    ok: true,
    message: localPaymentStatus === 'paid' ? 'Stripe payment confirmed successfully.' : 'Stripe checkout session confirmed.',
    payment_status: localPaymentStatus,
    provider_order_id: sessionId,
    provider_payment_id: paymentIntentId || null,
    stripe_session_status: normalizeText(session?.status).toLowerCase() || null,
    stripe_payment_status: normalizeText(session?.payment_status).toLowerCase() || null,
    order: {
      order_id: Number(localOrder.order_id || 0),
      order_number: localOrder.order_number || '',
      order_status: nextOrderStatus,
      payment_status: localPaymentStatus
    }
  });
}
