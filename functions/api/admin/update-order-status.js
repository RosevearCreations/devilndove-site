// File: /functions/api/admin/update-order-status.js

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

function normalizeOptionalText(value) {
  const text = String(value || "").trim();
  return text || null;
}

function normalizeOrderStatus(value) {
  const status = normalizeText(value).toLowerCase();

  if (["draft", "pending", "paid", "fulfilled", "cancelled", "refunded"].includes(status)) {
    return status;
  }

  return "";
}

function sanitizeNote(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

async function getAdminUserFromRequest(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match ? match[1].trim() : "";

  if (!token) {
    return null;
  }

  const session = await env.DB.prepare(`
    SELECT
      s.session_id,
      s.user_id,
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
    WHERE s.token = ?
      AND s.expires_at > datetime('now')
    LIMIT 1
  `)
    .bind(token)
    .first();

  if (!session) return null;
  if (Number(session.is_active || 0) !== 1) return null;
  if (String(session.role || "").toLowerCase() !== "admin") return null;

  return {
    user_id: Number(session.resolved_user_id),
    email: session.email,
    display_name: session.display_name,
    role: session.role
  };
}

function getOrderPaymentSummary(payments, orderTotalCents) {
  const safePayments = Array.isArray(payments) ? payments : [];

  let paidTotalCents = 0;
  let hasAuthorized = false;
  let hasPending = false;
  let hasRefunded = false;
  let hasPartiallyRefunded = false;
  let allFailedOrCancelled = safePayments.length > 0;

  for (const payment of safePayments) {
    const status = String(payment?.payment_status || "").toLowerCase();
    const amount = Number(payment?.amount_cents || 0);

    if (["paid", "completed", "captured"].includes(status)) {
      paidTotalCents += amount;
    }

    if (status === "authorized") hasAuthorized = true;
    if (status === "pending") hasPending = true;
    if (status === "refunded") hasRefunded = true;
    if (status === "partially_refunded") hasPartiallyRefunded = true;

    if (!["failed", "cancelled"].includes(status)) {
      allFailedOrCancelled = false;
    }
  }

  let derivedPaymentStatus = "pending";

  if (!safePayments.length) {
    derivedPaymentStatus = "pending";
  } else if (hasRefunded) {
    derivedPaymentStatus = "refunded";
  } else if (hasPartiallyRefunded) {
    derivedPaymentStatus = "partially_refunded";
  } else if (paidTotalCents >= Number(orderTotalCents || 0) && Number(orderTotalCents || 0) > 0) {
    derivedPaymentStatus = "paid";
  } else if (hasAuthorized) {
    derivedPaymentStatus = "authorized";
  } else if (hasPending) {
    derivedPaymentStatus = "pending";
  } else if (allFailedOrCancelled) {
    derivedPaymentStatus = "failed";
  }

  return {
    paid_total_cents: paidTotalCents,
    derived_payment_status: derivedPaymentStatus
  };
}

function validateTransition(currentStatus, newStatus, derivedPaymentStatus) {
  if (!currentStatus) {
    return "Current order status is missing.";
  }

  if (currentStatus === newStatus) {
    return "";
  }

  if (currentStatus === "refunded") {
    return "Refunded orders should not be moved to another status.";
  }

  if (currentStatus === "cancelled" && !["cancelled", "refunded"].includes(newStatus)) {
    return "Cancelled orders can only remain cancelled or move to refunded.";
  }

  if (newStatus === "draft" && currentStatus !== "draft") {
    return "Orders cannot be moved back to draft.";
  }

  if (newStatus === "paid") {
    if (!["paid", "partially_refunded", "refunded"].includes(derivedPaymentStatus)) {
      return "This order does not yet have payment status that supports marking it paid.";
    }
  }

  if (newStatus === "fulfilled") {
    if (!["paid", "partially_refunded"].includes(derivedPaymentStatus)) {
      return "Only paid orders should be fulfilled.";
    }
  }

  if (newStatus === "refunded") {
    if (!["paid", "partially_refunded", "refunded"].includes(derivedPaymentStatus)) {
      return "Only orders with payment activity should be marked refunded.";
    }
  }

  return "";
}

function deriveStoredPaymentStatus(existingOrderPaymentStatus, derivedPaymentStatus, newOrderStatus) {
  if (newOrderStatus === "refunded") {
    return "refunded";
  }

  if (newOrderStatus === "paid" || newOrderStatus === "fulfilled") {
    if (["paid", "partially_refunded", "refunded"].includes(derivedPaymentStatus)) {
      return derivedPaymentStatus === "refunded" ? "refunded" : "paid";
    }
    return existingOrderPaymentStatus || "pending";
  }

  return derivedPaymentStatus || existingOrderPaymentStatus || "pending";
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
  const new_status = normalizeOrderStatus(body.new_status);
  const note = normalizeOptionalText(body.note);

  if (!Number.isInteger(order_id) || order_id <= 0) {
    return json({ ok: false, error: "A valid order_id is required." }, 400);
  }

  if (!new_status) {
    return json({ ok: false, error: "A valid new_status is required." }, 400);
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

  const currentStatus = String(order.order_status || "").toLowerCase();
  const currentPaymentStatus = String(order.payment_status || "pending").toLowerCase();

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

  const payments = Array.isArray(paymentsResult?.results) ? paymentsResult.results : [];
  const paymentSummary = getOrderPaymentSummary(payments, Number(order.total_cents || 0));

  const transitionError = validateTransition(
    currentStatus,
    new_status,
    paymentSummary.derived_payment_status
  );

  if (transitionError) {
    return json({ ok: false, error: transitionError }, 400);
  }

  const storedPaymentStatus = deriveStoredPaymentStatus(
    currentPaymentStatus,
    paymentSummary.derived_payment_status,
    new_status
  );

  await env.DB.prepare(`
    UPDATE orders
    SET
      order_status = ?,
      payment_status = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE order_id = ?
  `)
    .bind(new_status, storedPaymentStatus, order_id)
    .run();

  const actorLabel =
    adminUser.display_name ||
    adminUser.email ||
    `Admin #${adminUser.user_id}`;

  const historyNoteParts = [
    `${actorLabel} changed status from ${currentStatus} to ${new_status}.`
  ];

  if (note) {
    historyNoteParts.push(`Note: ${sanitizeNote(note)}`);
  }

  if (paymentSummary.derived_payment_status) {
    historyNoteParts.push(`Derived payment status at change time: ${paymentSummary.derived_payment_status}.`);
  }

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
      currentStatus,
      new_status,
      adminUser.user_id,
      sanitizeNote(historyNoteParts.join(" "))
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
    message: "Order status updated successfully.",
    order: updatedOrder
  });
}
