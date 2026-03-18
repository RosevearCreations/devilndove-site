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

function normalizePaymentMethod(value) {
  const method = normalizeText(value).toLowerCase();

  if (["paypal", "stripe", "square", "manual", "other"].includes(method)) {
    return method;
  }

  if (method === "card") {
    return "stripe";
  }

  return "";
}

function mapMethodToProvider(method) {
  switch (method) {
    case "paypal":
      return "paypal";
    case "stripe":
      return "stripe";
    case "square":
      return "square";
    case "manual":
      return "manual";
    case "other":
      return "other";
    default:
      return "other";
  }
}

function mapMethodToLabel(method) {
  switch (method) {
    case "paypal":
      return "PayPal";
    case "stripe":
      return "Credit / Debit Card";
    case "square":
      return "Square";
    case "manual":
      return "Manual Payment";
    case "other":
      return "Other Payment";
    default:
      return "Payment";
  }
}

function buildProviderOrderId(method, orderId) {
  const now = Date.now();

  switch (method) {
    case "paypal":
      return `PAYPAL-PREP-${orderId}-${now}`;
    case "stripe":
      return `STRIPE-PREP-${orderId}-${now}`;
    case "square":
      return `SQUARE-PREP-${orderId}-${now}`;
    case "manual":
      return `MANUAL-PREP-${orderId}-${now}`;
    case "other":
      return `OTHER-PREP-${orderId}-${now}`;
    default:
      return `PAYMENT-PREP-${orderId}-${now}`;
  }
}

function buildNextStep(method, hasExisting = false) {
  switch (method) {
    case "paypal":
      return {
        action: "paypal_redirect_pending",
        type: "paypal",
        ready: false,
        message: hasExisting
          ? "Existing PayPal payment preparation was found."
          : "PayPal redirect/session creation will connect here next."
      };

    case "stripe":
      return {
        action: "stripe_checkout_pending",
        type: "stripe",
        ready: false,
        message: hasExisting
          ? "Existing Stripe/card payment preparation was found."
          : "Stripe checkout/session creation will connect here next."
      };

    case "square":
      return {
        action: "square_checkout_pending",
        type: "square",
        ready: false,
        message: hasExisting
          ? "Existing Square payment preparation was found."
          : "Square checkout/session creation will connect here next."
      };

    case "manual":
      return {
        action: "manual_followup_required",
        type: "manual",
        ready: false,
        message: hasExisting
          ? "Existing manual payment preparation was found."
          : "Manual or offline payment can now be handled by admin."
      };

    case "other":
    default:
      return {
        action: "payment_method_followup_required",
        type: "other",
        ready: false,
        message: hasExisting
          ? "Existing payment preparation was found."
          : "This payment method now requires admin follow-up."
      };
  }
}

function buildPaymentNotes(method) {
  switch (method) {
    case "paypal":
      return "Prepared for PayPal checkout connection.";
    case "stripe":
      return "Prepared for Stripe/card checkout connection.";
    case "square":
      return "Prepared for Square checkout connection.";
    case "manual":
      return "Prepared for manual/offline payment handling.";
    case "other":
    default:
      return "Prepared for other payment handling.";
  }
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
  const payment_method = normalizePaymentMethod(body.payment_method);

  if (!Number.isInteger(order_id) || order_id <= 0) {
    return json({ ok: false, error: "A valid order_id is required." }, 400);
  }

  if (!payment_method) {
    return json({
      ok: false,
      error: "A valid payment_method is required."
    }, 400);
  }

  const order = await env.DB.prepare(`
    SELECT
      order_id,
      order_number,
      order_status,
      fulfillment_type,
      currency,
      subtotal_cents,
      shipping_cents,
      tax_cents,
      total_cents,
      customer_email,
      customer_name,
      shipping_name,
      shipping_address1,
      shipping_address2,
      shipping_city,
      shipping_province,
      shipping_postal_code,
      shipping_country,
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

  if (orderStatus === "cancelled") {
    return json({ ok: false, error: "Cancelled orders cannot be paid." }, 400);
  }

  if (orderStatus === "refunded") {
    return json({ ok: false, error: "Refunded orders cannot be paid." }, 400);
  }

  const provider = mapMethodToProvider(payment_method);

  const existingActivePayment = await env.DB.prepare(`
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
    WHERE order_id = ?
      AND provider = ?
      AND payment_status IN ('pending', 'authorized')
    ORDER BY created_at DESC, payment_id DESC
    LIMIT 1
  `)
    .bind(order_id, provider)
    .first();

  if (existingActivePayment) {
    return json({
      ok: true,
      message: "Existing payment preparation found.",
      order,
      payment: {
        ...existingActivePayment,
        method: payment_method,
        provider
      },
      next_step: buildNextStep(payment_method, true)
    });
  }

  const alreadyPaidPayment = await env.DB.prepare(`
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
    WHERE order_id = ?
      AND payment_status IN ('paid', 'completed', 'captured')
    ORDER BY created_at DESC, payment_id DESC
    LIMIT 1
  `)
    .bind(order_id)
    .first();

  if (alreadyPaidPayment) {
    return json({
      ok: true,
      message: "A completed payment already exists for this order.",
      order,
      payment: {
        ...alreadyPaidPayment,
        method: payment_method,
        provider: alreadyPaidPayment.provider || provider
      },
      next_step: {
        action: "no_action_required",
        type: payment_method,
        ready: true,
        message: "This order already has a completed payment."
      }
    });
  }

  const provider_order_id = buildProviderOrderId(payment_method, order.order_id);

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
      mapMethodToLabel(payment_method),
      buildPaymentNotes(payment_method)
    )
    .run();

  const payment_id = insertResult?.meta?.last_row_id;

  if (!payment_id) {
    return json({
      ok: false,
      error: "Payment preparation could not be created."
    }, 500);
  }

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

  await env.DB.prepare(`
    INSERT INTO order_status_history (
      order_id,
      old_status,
      new_status,
      changed_by_user_id,
      note,
      created_at
    )
    VALUES (?, ?, ?, NULL, ?, CURRENT_TIMESTAMP)
  `)
    .bind(
      order_id,
      order.order_status || "pending",
      order.order_status || "pending",
      `Payment prepared for method: ${payment_method}`
    )
    .run();

  return json({
    ok: true,
    message: "Payment prepared successfully.",
    order,
    payment: {
      ...payment,
      method: payment_method,
      provider
    },
    next_step: buildNextStep(payment_method, false)
  }, 201);
}
