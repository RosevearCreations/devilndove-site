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

function normalizeOptionalText(value) {
  const text = String(value || "").trim();
  return text || null;
}

function normalizeProvider(value) {
  const provider = normalizeText(value).toLowerCase();

  if (["paypal", "stripe", "square", "manual", "other"].includes(provider)) {
    return provider;
  }

  return "";
}

function normalizePaymentStatus(value) {
  const status = normalizeText(value).toLowerCase();

  if (
    [
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
  ) {
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

function getOrderPaymentStatusFromPayments(payments) {
  const safePayments = Array.isArray(payments) ? payments : [];

  if (!safePayments.length) {
    return "pending";
  }

  const statuses = safePayments.map((payment) =>
    String(payment.payment_status || "").toLowerCase()
  );

  if (statuses.some((status) => status === "refunded")) {
    return "refunded";
  }

  if (statuses.some((status) => status === "partially_refunded")) {
    return "partially_refunded";
  }

  if (
    statuses.some((status) =>
      ["paid", "completed", "captured"].includes(status)
    )
  ) {
    return "paid";
  }

  if (statuses.some((status) => status === "authorized")) {
    return "authorized";
  }

  if (statuses.some((status) => status === "pending")) {
    return "pending";
  }

  if (statuses.every((status) => ["failed", "cancelled"].includes(status))) {
    return "failed";
  }

  return "pending";
}

function getSuggestedOrderStatus(currentOrderStatus, paymentStatus, orderTotalCents, paidTotalCents) {
  const current = String(currentOrderStatus || "").toLowerCase();

  if (["cancelled", "fulfilled"].includes(current)) {
    return current;
  }

  if (paymentStatus === "refunded") {
    return "refunded";
  }

  if (paymentStatus === "paid" && Number(paidTotalCents || 0) >= Number(orderTotalCents || 0)) {
    return "paid";
  }

  return current || "pending";
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
  const provider = normalizeProvider(body.provider);
  const payment_status = normalizePaymentStatus(body.payment_status);
  const amount_cents = Number(body.amount_cents);
  const currency = normalizeText(body.currency || "CAD").toUpperCase();
  const payment_method_label = normalizeOptionalText(body.payment_method_label);
  const transaction_reference = normalizeOptionalText(body.transaction_reference);
  const provider_payment_id = normalizeOptionalText(body.provider_payment_id);
  const provider_order_id = normalizeOptionalText(body.provider_order_id);
  const notes = normalizeOptionalText(body.notes);

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
    return json({ ok: false, error: "A valid non-negative amount_cents is required." }, 400);
  }

  if (!currency) {
    return json({ ok: false, error: "Currency is required." }, 400);
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

  const currentOrderStatus = String(order.order_status || "").toLowerCase();

  if (currentOrderStatus === "cancelled" && payment_status !== "refunded") {
    return json({
      ok: false,
      error: "Cancelled orders can only receive refund-related payment updates."
    }, 400);
  }

  let matchedPreparedPayment = null;

  if (provider_order_id || provider_payment_id || transaction_reference) {
    matchedPreparedPayment = await env.DB.prepare(`
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
        AND (
          (? IS NOT NULL AND provider_order_id = ?)
          OR (? IS NOT NULL AND provider_payment_id = ?)
          OR (? IS NOT NULL AND transaction_reference = ?)
        )
      ORDER BY payment_id DESC
      LIMIT 1
    `)
      .bind(
        order_id,
        provider,
        provider_order_id, provider_order_id,
        provider_payment_id, provider_payment_id,
        transaction_reference, transaction_reference
      )
      .first();
  }

  if (!matchedPreparedPayment) {
    matchedPreparedPayment = await env.DB.prepare(`
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
      ORDER BY payment_id DESC
      LIMIT 1
    `)
      .bind(order_id, provider)
      .first();
  }

  let savedPaymentId = null;
  let actionTaken = "inserted";

  if (matchedPreparedPayment) {
    await env.DB.prepare(`
      UPDATE payments
      SET
        provider_payment_id = COALESCE(?, provider_payment_id),
        provider_order_id = COALESCE(?, provider_order_id),
        payment_status = ?,
        amount_cents = ?,
        currency = ?,
        payment_method_label = COALESCE(?, payment_method_label),
        transaction_reference = COALESCE(?, transaction_reference),
        paid_at = CASE
          WHEN ? IN ('paid', 'completed', 'captured', 'refunded', 'partially_refunded')
            THEN COALESCE(paid_at, CURRENT_TIMESTAMP)
          ELSE paid_at
        END,
        updated_at = CURRENT_TIMESTAMP,
        notes = CASE
          WHEN ? IS NOT NULL AND notes IS NOT NULL AND TRIM(notes) <> ''
            THEN notes || ' | ' || ?
          WHEN ? IS NOT NULL
            THEN ?
          ELSE notes
        END
      WHERE payment_id = ?
    `)
      .bind(
        provider_payment_id,
        provider_order_id,
        payment_status,
        amount_cents,
        currency,
        payment_method_label,
        transaction_reference,
        payment_status,
        notes, notes,
        notes, notes,
        matchedPreparedPayment.payment_id
      )
      .run();

    savedPaymentId = Number(matchedPreparedPayment.payment_id);
    actionTaken = "updated_prepared";
  } else {
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
      VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, 
        CASE
          WHEN ? IN ('paid', 'completed', 'captured', 'refunded', 'partially_refunded')
            THEN CURRENT_TIMESTAMP
          ELSE NULL
        END,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        ?
      )
    `)
      .bind(
        order_id,
        provider,
        provider_payment_id,
        provider_order_id,
        payment_status,
        amount_cents,
        currency,
        payment_method_label,
        transaction_reference,
        payment_status,
        notes
      )
      .run();

    savedPaymentId = insertResult?.meta?.last_row_id || null;

    if (!savedPaymentId) {
      return json({ ok: false, error: "Payment could not be recorded." }, 500);
    }
  }

  const allPaymentsResult = await env.DB.prepare(`
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
    ORDER BY payment_id DESC
  `)
    .bind(order_id)
    .all();

  const allPayments = Array.isArray(allPaymentsResult?.results)
    ? allPaymentsResult.results
    : [];

  const orderPaymentStatus = getOrderPaymentStatusFromPayments(allPayments);

  const paidTotalCents = allPayments.reduce((sum, payment) => {
    const status = String(payment.payment_status || "").toLowerCase();
    if (["paid", "completed", "captured", "partially_refunded"].includes(status)) {
      return sum + Number(payment.amount_cents || 0);
    }
    return sum;
  }, 0);

  const newOrderStatus = getSuggestedOrderStatus(
    order.order_status,
    orderPaymentStatus,
    Number(order.total_cents || 0),
    paidTotalCents
  );

  await env.DB.prepare(`
    UPDATE orders
    SET
      payment_status = ?,
      order_status = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE order_id = ?
  `)
    .bind(orderPaymentStatus, newOrderStatus, order_id)
    .run();

  const actorLabel =
    adminUser.display_name ||
    adminUser.email ||
    `Admin #${adminUser.user_id}`;

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
      order.order_status || null,
      newOrderStatus,
      adminUser.user_id,
      sanitizeNote(
        `${actorLabel} ${actionTaken === "updated_prepared" ? "updated prepared payment" : "recorded payment"}: provider=${provider}, status=${payment_status}, amount_cents=${amount_cents}${transaction_reference ? `, ref=${transaction_reference}` : ""}`
      )
    )
    .run();

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
    .bind(savedPaymentId)
    .first();

  const refreshedOrder = await env.DB.prepare(`
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
    message:
      actionTaken === "updated_prepared"
        ? "Prepared payment updated successfully."
        : "Payment recorded successfully.",
    action: actionTaken,
    order: refreshedOrder,
    payment
  });
}
