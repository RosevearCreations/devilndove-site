// File: /functions/api/checkout-prepare-payment.js

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

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const order_id = Number(body.order_id);
  const payment_method = normalizeText(body.payment_method).toLowerCase();

  if (!Number.isInteger(order_id) || order_id <= 0) {
    return json({ ok: false, error: "A valid order_id is required." }, 400);
  }

  if (!["paypal", "card", "manual"].includes(payment_method)) {
    return json({ ok: false, error: "A valid payment_method is required." }, 400);
  }

  const order = await env.DB.prepare(`
    SELECT
      order_id,
      order_number,
      order_status,
      currency,
      total_cents,
      customer_email,
      customer_name,
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

  if (String(order.order_status || "").toLowerCase() === "cancelled") {
    return json({ ok: false, error: "Cancelled orders cannot be paid." }, 400);
  }

  if (String(order.order_status || "").toLowerCase() === "refunded") {
    return json({ ok: false, error: "Refunded orders cannot be paid." }, 400);
  }

  const existingPendingPayment = await env.DB.prepare(`
    SELECT
      payment_id,
      provider,
      payment_status,
      provider_payment_id,
      provider_order_id,
      amount_cents,
      currency,
      created_at,
      updated_at
    FROM payments
    WHERE order_id = ?
      AND provider = ?
      AND payment_status IN ('pending', 'authorized')
    ORDER BY created_at DESC, payment_id DESC
    LIMIT 1
  `)
    .bind(
      order_id,
      payment_method === "card" ? "other" : payment_method
    )
    .first();

  if (existingPendingPayment) {
    return json({
      ok: true,
      message: "Existing payment preparation found.",
      order,
      payment: existingPendingPayment,
      next_step: {
        type: payment_method,
        ready: false,
        message:
          payment_method === "paypal"
            ? "PayPal connection will attach here next."
            : payment_method === "card"
              ? "Card processor connection will attach here next."
              : "Manual payment flow can be handled by admin."
      }
    });
  }

  const provider = payment_method === "card" ? "other" : payment_method;
  const provider_order_id =
    payment_method === "paypal"
      ? `PAYPAL-PREP-${order.order_id}-${Date.now()}`
      : payment_method === "card"
        ? `CARD-PREP-${order.order_id}-${Date.now()}`
        : `MANUAL-PREP-${order.order_id}-${Date.now()}`;

  const insertResult = await env.DB.prepare(`
    INSERT INTO payments (
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
    )
    VALUES (?, ?, NULL, ?, 'pending', ?, ?, ?, NULL, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)
  `)
    .bind(
      order_id,
      provider,
      provider_order_id,
      Number(order.total_cents || 0),
      order.currency || "CAD",
      payment_method === "paypal"
        ? "PayPal"
        : payment_method === "card"
          ? "Credit Card"
          : "Manual Payment",
      payment_method === "paypal"
        ? "Prepared for PayPal checkout connection."
        : payment_method === "card"
          ? "Prepared for card processor checkout connection."
          : "Prepared for manual/offline payment handling."
    )
    .run();

  const payment_id = insertResult?.meta?.last_row_id;

  const payment = await env.DB.prepare(`
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

  return json({
    ok: true,
    message: "Payment prepared successfully.",
    order,
    payment,
    next_step: {
      type: payment_method,
      ready: false,
      message:
        payment_method === "paypal"
          ? "PayPal redirect/session creation will connect here next."
          : payment_method === "card"
            ? "Credit card processor session creation will connect here next."
            : "Manual payment can now be recorded by admin."
    }
  }, 201);
}
