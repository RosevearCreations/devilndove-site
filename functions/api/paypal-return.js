// File: /functions/api/paypal-return.js
// Brief description: Handles the PayPal approval return flow, captures the PayPal order,
// updates local payment/order records, and records order history.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function normalizeText(value) {
  return String(value || '').trim();
}

async function getPaypalAccessToken(env) {
  const clientId = normalizeText(env.PAYPAL_CLIENT_ID);
  const secret = normalizeText(env.PAYPAL_SECRET);
  const mode = normalizeText(env.PAYPAL_ENV || 'sandbox').toLowerCase() || 'sandbox';
  if (!clientId || !secret) return null;

  const base = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const basic = btoa(`${clientId}:${secret}`);
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.access_token) {
    throw new Error(data?.error_description || data?.error || 'Failed to obtain PayPal access token.');
  }
  return { access_token: data.access_token, base, mode };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let body = {};
  try { body = await request.json(); } catch { body = {}; }

  const order_id = Number(body.order_id || 0);
  const paypal_order_id = normalizeText(body.paypal_order_id || body.token || body.provider_order_id);

  if (!Number.isInteger(order_id) || order_id <= 0) {
    return json({ ok: false, error: 'A valid order_id is required.' }, 400);
  }
  if (!paypal_order_id) {
    return json({ ok: false, error: 'A valid paypal_order_id is required.' }, 400);
  }

  const localOrder = await env.DB.prepare(`
    SELECT order_id, order_number, order_status, payment_status, total_cents, currency
    FROM orders
    WHERE order_id = ?
    LIMIT 1
  `).bind(order_id).first();

  if (!localOrder) {
    return json({ ok: false, error: 'Order not found.' }, 404);
  }

  const auth = await getPaypalAccessToken(env);
  if (!auth) {
    return json({ ok: false, error: 'PayPal credentials are not configured.' }, 500);
  }

  const captureResponse = await fetch(`${auth.base}/v2/checkout/orders/${encodeURIComponent(paypal_order_id)}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.access_token}`,
      'Content-Type': 'application/json'
    }
  });
  const captureData = await captureResponse.json().catch(() => null);

  if (!captureResponse.ok || !captureData?.status) {
    return json({ ok: false, error: captureData?.message || captureData?.details?.[0]?.description || 'Failed to capture PayPal order.' }, 400);
  }

  const captureId = captureData?.purchase_units?.[0]?.payments?.captures?.[0]?.id || '';
  const captureStatus = String(captureData?.status || '').toLowerCase();
  const amountValue = Number(captureData?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || 0);
  const amountCents = Math.round(amountValue * 100);
  const paidAt = captureData?.purchase_units?.[0]?.payments?.captures?.[0]?.create_time || new Date().toISOString();
  const paymentStatus = captureStatus === 'completed' ? 'paid' : 'authorized';

  await env.DB.prepare(`
    UPDATE payments
    SET provider = 'paypal',
        provider_order_id = ?,
        provider_payment_id = ?,
        payment_status = ?,
        transaction_reference = ?,
        paid_at = ?,
        updated_at = CURRENT_TIMESTAMP,
        notes = COALESCE(notes, '') || ' PayPal return capture processed.'
    WHERE order_id = ? AND provider = 'paypal'
  `).bind(paypal_order_id, captureId || null, paymentStatus, captureId || paypal_order_id, paidAt, order_id).run();

  await env.DB.prepare(`
    UPDATE orders
    SET payment_status = ?,
        order_status = CASE WHEN ? = 'paid' AND order_status = 'pending' THEN 'paid' ELSE order_status END,
        updated_at = CURRENT_TIMESTAMP
    WHERE order_id = ?
  `).bind(paymentStatus, paymentStatus, order_id).run();

  await env.DB.prepare(`
    INSERT INTO order_status_history (order_id, old_status, new_status, changed_by_user_id, note, created_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(order_id, String(localOrder.order_status || 'pending').toLowerCase(), paymentStatus === 'paid' ? 'paid' : String(localOrder.order_status || 'pending').toLowerCase(), null, `PayPal return processed for provider order ${paypal_order_id}.`).run();

  return json({
    ok: true,
    message: 'PayPal return processed.',
    payment_status: paymentStatus,
    provider_order_id: paypal_order_id,
    provider_payment_id: captureId || null,
    amount_cents: amountCents
  });
}
