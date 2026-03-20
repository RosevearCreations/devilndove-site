// File: /functions/api/checkout-prepare-payment.js
// Brief description: Prepares a payment handoff for an existing order. It validates the order,
// returns a safe payment-preparation payload for the frontend, and creates a pending payment
// stub when appropriate so the project can bridge into future PayPal/card-provider work.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeProvider(value) {
  const provider = normalizeText(value).toLowerCase();
  return ["paypal", "stripe", "square", "manual", "other"].includes(provider)
    ? provider
    : "";
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const order_id = Number(body.order_id);
  const provider = normalizeProvider(body.provider || "paypal");

  if (!Number.isInteger(order_id) || order_id <= 0) {
    return json({ ok: false, error: "A valid order_id is required." }, 400);
  }

  if (!provider) {
    return json({ ok: false, error: "A valid payment provider is required." }, 400);
  }

  const order = await env.DB.prepare(`
    SELECT
      order_id,
      order_number,
      user_id,
      customer_email,
      customer_name,
      order_status,
      payment_status,
      payment_method,
      fulfillment_type,
      currency,
      total_cents,
      created_at,
      updated_at
    FROM orders
    WHERE order_id = ?
    LIMIT 1
  `)
    .bind(order_id)
    .first();

  if (!order) {
    return json({ ok: false, error: "Order not found." }, 404);
  }

  const orderStatus = String(order.order_status || "").toLowerCase();
  const paymentStatus = String(order.payment_status || "").toLowerCase();

  if (["cancelled", "refunded"].includes(orderStatus)) {
    return json({
      ok: false,
      error: "This order cannot accept a new payment in its current state."
    }, 400);
  }

  if (["paid", "completed"].includes(paymentStatus)) {
    return json({
      ok: true,
      message: "Order is already paid.",
      already_paid: true,
      payment_preparation: {
        provider,
        order_id: Number(order.order_id || 0),
        order_number: order.order_number || "",
        currency: order.currency || "CAD",
        total_cents: Number(order.total_cents || 0),
        customer_email: order.customer_email || "",
        customer_name: order.customer_name || ""
      }
    });
  }

  const existingPendingPaymentsResult = await env.DB.prepare(`
    SELECT
      payment_id,
      provider,
      provider_payment_id,
      provider_order_id,
      payment_status,
      amount_cents,
      currency,
      payment_method_label,
      transaction_reference,
      paid_at,
      created_at,
      updated_at,
      notes
    FROM payments
    WHERE order_id = ?
      AND LOWER(COALESCE(provider, '')) = ?
      AND LOWER(COALESCE(payment_status, '')) IN ('pending', 'authorized')
    ORDER BY payment_id DESC
  `)
    .bind(order_id, provider)
    .all();

  const existingPendingPayments = normalizeResults(existingPendingPaymentsResult);

  let paymentRecord = existingPendingPayments[0] || null;

  if (!paymentRecord) {
    const insertResult = await env.DB.prepare(`
      INSERT INTO payments (
        order_id,
        provider,
        payment_status,
        amount_cents,
        currency,
        payment_method_label,
        created_at,
        updated_at,
        notes
      )
      VALUES (?, ?, 'pending', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)
    `)
      .bind(
        order_id,
        provider,
        Number(order.total_cents || 0),
        order.currency || "CAD",
        provider,
        `Prepared for ${provider} checkout handoff.`
      )
      .run();

    const payment_id = Number(insertResult?.meta?.last_row_id || 0);

    if (payment_id > 0) {
      paymentRecord = await env.DB.prepare(`
        SELECT
          payment_id,
          order_id,
          provider,
          provider_payment_id,
          provider_order_id,
          payment_status,
          amount_cents,
          currency,
          payment_method_label,
          transaction_reference,
          paid_at,
          created_at,
          updated_at,
          notes
        FROM payments
        WHERE payment_id = ?
        LIMIT 1
      `)
        .bind(payment_id)
        .first();
    }
  }

  if (paymentStatus !== "pending") {
    await env.DB.prepare(`
      UPDATE orders
      SET
        payment_status = 'pending',
        updated_at = CURRENT_TIMESTAMP
      WHERE order_id = ?
    `)
      .bind(order_id)
      .run();
  }

  const payment_preparation = {
    provider,
    provider_mode: "stub",
    order_id: Number(order.order_id || 0),
    order_number: order.order_number || "",
    currency: order.currency || "CAD",
    total_cents: Number(order.total_cents || 0),
    customer_email: order.customer_email || "",
    customer_name: order.customer_name || "",
    return_url: `/checkout/confirmation/?order_id=${encodeURIComponent(String(order.order_id || order_id))}`,
    cancel_url: `/checkout/?order_id=${encodeURIComponent(String(order.order_id || order_id))}`,
    payment_stub: paymentRecord
      ? {
          payment_id: Number(paymentRecord.payment_id || 0),
          provider: paymentRecord.provider || provider,
          payment_status: paymentRecord.payment_status || "pending",
          amount_cents: Number(paymentRecord.amount_cents || order.total_cents || 0),
          currency: paymentRecord.currency || order.currency || "CAD",
          payment_method_label: paymentRecord.payment_method_label || provider,
          created_at: paymentRecord.created_at || null,
          updated_at: paymentRecord.updated_at || null
        }
      : null
  };

  return json({
    ok: true,
    message: "Payment preparation ready.",
    already_paid: false,
    payment_preparation
  });
}
