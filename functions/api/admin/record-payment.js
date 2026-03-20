// File: /functions/api/admin/record-payment.js

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

function getBearerToken(request) {
  const authHeader = request.headers.get("Authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? String(match[1] || "").trim() : "";
}

function normalizeProvider(value) {
  const provider = normalizeText(value).toLowerCase();
  return ["paypal", "stripe", "square", "manual", "other"].includes(provider)
    ? provider
    : "";
}

function normalizePaymentStatus(value) {
  const status = normalizeText(value).toLowerCase();
  return [
    "pending",
    "authorized",
    "paid",
    "completed",
    "captured",
    "failed",
    "cancelled",
    "refunded",
    "partially_refunded"
  ].includes(status)
    ? status
    : "";
}

async function getAdminUserFromRequest(request, env) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  const session = await env.DB.prepare(`
    SELECT
      s.session_id,
      s.user_id,
      s.session_token,
      s.token,
      s.expires_at,
      u.user_id AS resolved_user_id,
      u.email,
      u.display_name,
      u.role,
      u.is_active
    FROM sessions s
    INNER JOIN users u
      ON u.user_id = s.user_id
    WHERE (
      s.session_token = ?
      OR s.token = ?
    )
      AND s.expires_at > datetime('now')
    LIMIT 1
  `)
    .bind(token, token)
    .first();

  if (!session) return null;
  if (Number(session.is_active || 0) !== 1) return null;
  if (String(session.role || "").toLowerCase() !== "admin") return null;

  return {
    session_id: Number(session.session_id || 0),
    user_id: Number(session.resolved_user_id || session.user_id || 0),
    email: session.email || "",
    display_name: session.display_name || "",
    role: session.role || "admin"
  };
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function summarizePayments(orderTotalCents, payments) {
  const safePayments = Array.isArray(payments) ? payments : [];

  let paid_total_cents = 0;
  let refunded_total_cents = 0;
  let pending_total_cents = 0;

  let hasRefunded = false;
  let hasPartiallyRefunded = false;
  let hasAuthorized = false;
  let hasPending = false;
  let allFailedOrCancelled = safePayments.length > 0;

  for (const payment of safePayments) {
    const status = String(payment.payment_status || "").toLowerCase();
    const amount = Number(payment.amount_cents || 0);

    if (["paid", "completed", "captured"].includes(status)) {
      paid_total_cents += amount;
    }

    if (["pending", "authorized"].includes(status)) {
      pending_total_cents += amount;
    }

    if (status === "refunded") {
      hasRefunded = true;
      refunded_total_cents += amount;
    }

    if (status === "partially_refunded") {
      hasPartiallyRefunded = true;
      refunded_total_cents += amount;
    }

    if (status === "authorized") {
      hasAuthorized = true;
    }

    if (status === "pending") {
      hasPending = true;
    }

    if (!["failed", "cancelled"].includes(status)) {
      allFailedOrCancelled = false;
    }
  }

  let derived_payment_status = "pending";

  if (!safePayments.length) {
    derived_payment_status = "pending";
  } else if (hasRefunded) {
    derived_payment_status = "refunded";
  } else if (hasPartiallyRefunded) {
    derived_payment_status = "partially_refunded";
  } else if (paid_total_cents >= Number(orderTotalCents || 0) && Number(orderTotalCents || 0) > 0) {
    derived_payment_status = "paid";
  } else if (hasAuthorized) {
    derived_payment_status = "authorized";
  } else if (hasPending) {
    derived_payment_status = "pending";
  } else if (allFailedOrCancelled) {
    derived_payment_status = "failed";
  }

  return {
    payment_count: safePayments.length,
    paid_total_cents,
    pending_total_cents,
    refunded_total_cents,
    outstanding_cents: Math.max(Number(orderTotalCents || 0) - paid_total_cents, 0),
    derived_payment_status
  };
}

function deriveStoredOrderPaymentStatus(derivedPaymentStatus, existingPaymentStatus) {
  if (["refunded", "partially_refunded"].includes(derivedPaymentStatus)) {
    return derivedPaymentStatus;
  }

  if (derivedPaymentStatus === "paid") {
    return "paid";
  }

  if (derivedPaymentStatus === "authorized") {
    return "authorized";
  }

  if (derivedPaymentStatus === "failed") {
    return "failed";
  }

  if (derivedPaymentStatus === "pending") {
    return "pending";
  }

  return existingPaymentStatus || "pending";
}

function maybeAdvanceOrderStatus(currentOrderStatus, storedPaymentStatus) {
  const current = String(currentOrderStatus || "").toLowerCase();

  if (current === "pending" && storedPaymentStatus === "paid") {
    return "paid";
  }

  if (current === "paid" && storedPaymentStatus === "refunded") {
    return "refunded";
  }

  if (current === "fulfilled" && storedPaymentStatus === "refunded") {
    return "refunded";
  }

  return current;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const adminUser = await getAdminUserFromRequest(request, env);

  if (!adminUser) {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const order_id = Number(body.order_id);
  const provider = normalizeProvider(body.provider || "manual");
  const payment_status = normalizePaymentStatus(body.payment_status);
  const amount_cents = Number(body.amount_cents);
  const currency = normalizeText(body.currency || "CAD").toUpperCase();
  const payment_method_label = normalizeText(body.payment_method_label || "");
  const transaction_reference = normalizeText(body.transaction_reference || "");
  const provider_payment_id = normalizeText(body.provider_payment_id || "");
  const provider_order_id = normalizeText(body.provider_order_id || "");
  const paid_at = normalizeText(body.paid_at || "");
  const notes = normalizeText(body.notes || "");

  if (!Number.isInteger(order_id) || order_id <= 0) {
    return json({ ok: false, error: "A valid order_id is required." }, 400);
  }

  if (!provider) {
    return json({ ok: false, error: "A valid provider is required." }, 400);
  }

  if (!payment_status) {
    return json({ ok: false, error: "A valid payment_status is required." }, 400);
  }

  if (!Number.isInteger(amount_cents) || amount_cents < 0) {
    return json({ ok: false, error: "amount_cents must be a whole number of cents." }, 400);
  }

  if (!currency || currency.length < 3) {
    return json({ ok: false, error: "A valid currency is required." }, 400);
  }

  const order = await env.DB.prepare(`
    SELECT
      order_id,
      order_number,
      order_status,
      payment_status,
      total_cents,
      currency,
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

  await env.DB.prepare(`
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
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)
  `)
    .bind(
      order_id,
      provider,
      provider_payment_id || null,
      provider_order_id || null,
      payment_status,
      amount_cents,
      currency || order.currency || "CAD",
      payment_method_label || null,
      transaction_reference || null,
      paid_at || null,
      notes || null
    )
    .run();

  const paymentsResult = await env.DB.prepare(`
    SELECT
      payment_id,
      payment_status,
      amount_cents
    FROM payments
    WHERE order_id = ?
    ORDER BY payment_id DESC
  `)
    .bind(order_id)
    .all();

  const payments = normalizeResults(paymentsResult);
  const summary = summarizePayments(order.total_cents, payments);
  const storedPaymentStatus = deriveStoredOrderPaymentStatus(
    summary.derived_payment_status,
    String(order.payment_status || "pending").toLowerCase()
  );
  const nextOrderStatus = maybeAdvanceOrderStatus(order.order_status, storedPaymentStatus);

  await env.DB.prepare(`
    UPDATE orders
    SET
      payment_status = ?,
      order_status = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE order_id = ?
  `)
    .bind(
      storedPaymentStatus,
      nextOrderStatus,
      order_id
    )
    .run();

  const actorLabel =
    adminUser.display_name ||
    adminUser.email ||
    `Admin #${adminUser.user_id}`;

  const historyNote = [
    `${actorLabel} recorded payment.`,
    `Provider: ${provider}.`,
    `Status: ${payment_status}.`,
    `Amount: ${amount_cents} ${currency || order.currency || "CAD"}.`,
    transaction_reference ? `Reference: ${transaction_reference}.` : "",
    notes ? `Note: ${notes}` : ""
  ]
    .filter(Boolean)
    .join(" ");

  await env.DB.prepare(`
    INSERT INTO order_status_history (
      order_id,
      old_status,
      new_status,
      changed_by_user_id,
      note,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `)
    .bind(
      order_id,
      String(order.order_status || "").toLowerCase(),
      nextOrderStatus,
      adminUser.user_id,
      historyNote
    )
    .run();

  const updatedOrder = await env.DB.prepare(`
    SELECT
      order_id,
      order_number,
      order_status,
      payment_status,
      total_cents,
      currency,
      created_at,
      updated_at
    FROM orders
    WHERE order_id = ?
    LIMIT 1
  `)
    .bind(order_id)
    .first();

  return json({
    ok: true,
    message: "Payment recorded successfully.",
    order: {
      order_id: Number(updatedOrder?.order_id || order_id || 0),
      order_number: updatedOrder?.order_number || order.order_number || "",
      order_status: updatedOrder?.order_status || nextOrderStatus,
      payment_status: updatedOrder?.payment_status || storedPaymentStatus,
      total_cents: Number(updatedOrder?.total_cents || order.total_cents || 0),
      currency: updatedOrder?.currency || order.currency || currency || "CAD",
      created_at: updatedOrder?.created_at || order.created_at || null,
      updated_at: updatedOrder?.updated_at || null
    },
    payment_summary: summary,
    recorded_by: {
      user_id: adminUser.user_id,
      email: adminUser.email,
      display_name: adminUser.display_name
    }
  }, 201);
}
