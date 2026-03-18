// File: /functions/api/admin/order-detail.js

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function getSessionUser(env, token) {
  if (!token) return null;

  const sessionUser = await env.DB.prepare(`
    SELECT
      users.user_id,
      users.email,
      users.display_name,
      users.role,
      users.is_active
    FROM sessions
    JOIN users ON sessions.user_id = users.user_id
    WHERE sessions.session_token = ?
      AND sessions.expires_at > datetime('now')
    LIMIT 1
  `)
    .bind(token)
    .first();

  return sessionUser || null;
}

async function requireAdmin(request, env) {
  const auth = request.headers.get("Authorization") || "";

  if (!auth.startsWith("Bearer ")) {
    return { error: json({ ok: false, error: "Unauthorized." }, 401) };
  }

  const token = auth.slice(7).trim();

  if (!token) {
    return { error: json({ ok: false, error: "Missing session token." }, 401) };
  }

  const sessionUser = await getSessionUser(env, token);

  if (!sessionUser) {
    return { error: json({ ok: false, error: "Invalid session." }, 401) };
  }

  if (!sessionUser.is_active) {
    return { error: json({ ok: false, error: "Account is inactive." }, 403) };
  }

  if (sessionUser.role !== "admin") {
    return { error: json({ ok: false, error: "Forbidden." }, 403) };
  }

  return { sessionUser };
}

function summarizePayments(order, payments) {
  const safePayments = Array.isArray(payments) ? payments : [];
  const orderTotalCents = Number(order?.total_cents || 0);

  const paidStatuses = new Set(["paid", "completed", "captured"]);
  const refundableStatuses = new Set(["partially_refunded", "refunded"]);
  const pendingStatuses = new Set(["pending", "authorized"]);

  let paidTotalCents = 0;
  let refundedTotalCents = 0;
  let pendingTotalCents = 0;

  for (const payment of safePayments) {
    const status = String(payment?.payment_status || "").toLowerCase();
    const amount = Number(payment?.amount_cents || 0);

    if (paidStatuses.has(status)) {
      paidTotalCents += amount;
    }

    if (refundableStatuses.has(status)) {
      refundedTotalCents += amount;
    }

    if (pendingStatuses.has(status)) {
      pendingTotalCents += amount;
    }
  }

  const preparedPayment =
    safePayments.find((payment) => {
      const status = String(payment?.payment_status || "").toLowerCase();
      return status === "pending" || status === "authorized";
    }) || null;

  const latestCompletedPayment =
    safePayments.find((payment) => {
      const status = String(payment?.payment_status || "").toLowerCase();
      return status === "paid" || status === "completed" || status === "captured";
    }) || null;

  const outstandingCents = Math.max(orderTotalCents - paidTotalCents, 0);

  let derivedPaymentStatus = "pending";

  if (safePayments.length === 0) {
    derivedPaymentStatus = "pending";
  } else if (safePayments.some((payment) => String(payment?.payment_status || "").toLowerCase() === "refunded")) {
    derivedPaymentStatus = "refunded";
  } else if (safePayments.some((payment) => String(payment?.payment_status || "").toLowerCase() === "partially_refunded")) {
    derivedPaymentStatus = "partially_refunded";
  } else if (paidTotalCents >= orderTotalCents && orderTotalCents > 0) {
    derivedPaymentStatus = "paid";
  } else if (safePayments.some((payment) => String(payment?.payment_status || "").toLowerCase() === "authorized")) {
    derivedPaymentStatus = "authorized";
  } else if (safePayments.some((payment) => String(payment?.payment_status || "").toLowerCase() === "pending")) {
    derivedPaymentStatus = "pending";
  } else if (
    safePayments.every((payment) => {
      const status = String(payment?.payment_status || "").toLowerCase();
      return status === "failed" || status === "cancelled";
    })
  ) {
    derivedPaymentStatus = "failed";
  }

  return {
    payment_count: safePayments.length,
    paid_total_cents: paidTotalCents,
    refunded_total_cents: refundedTotalCents,
    pending_total_cents: pendingTotalCents,
    outstanding_cents: outstandingCents,
    derived_payment_status: derivedPaymentStatus,
    prepared_payment: preparedPayment,
    latest_completed_payment: latestCompletedPayment
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const authCheck = await requireAdmin(request, env);
  if (authCheck.error) return authCheck.error;

  const url = new URL(request.url);
  const orderId = Number(url.searchParams.get("order_id"));

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return json({ ok: false, error: "A valid order_id is required." }, 400);
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
      subtotal_cents,
      discount_cents,
      shipping_cents,
      tax_cents,
      total_cents,
      shipping_name,
      shipping_company,
      shipping_address1,
      shipping_address2,
      shipping_city,
      shipping_province,
      shipping_postal_code,
      shipping_country,
      billing_name,
      billing_company,
      billing_address1,
      billing_address2,
      billing_city,
      billing_province,
      billing_postal_code,
      billing_country,
      notes,
      created_at,
      updated_at
    FROM orders
    WHERE order_id = ?
    LIMIT 1
  `)
    .bind(orderId)
    .first();

  if (!order) {
    return json({ ok: false, error: "Order not found." }, 404);
  }

  const itemsResult = await env.DB.prepare(`
    SELECT
      order_item_id,
      order_id,
      product_id,
      sku,
      product_name,
      product_type,
      unit_price_cents,
      quantity,
      line_subtotal_cents,
      taxable,
      tax_class_code,
      requires_shipping,
      digital_file_url,
      created_at
    FROM order_items
    WHERE order_id = ?
    ORDER BY order_item_id ASC
  `)
    .bind(orderId)
    .all();

  const historyResult = await env.DB.prepare(`
    SELECT
      osh.order_status_history_id,
      osh.order_id,
      osh.old_status,
      osh.new_status,
      osh.changed_by_user_id,
      osh.note,
      osh.created_at,
      u.email AS changed_by_email,
      u.display_name AS changed_by_display_name
    FROM order_status_history osh
    LEFT JOIN users u
      ON osh.changed_by_user_id = u.user_id
    WHERE osh.order_id = ?
    ORDER BY osh.created_at ASC, osh.order_status_history_id ASC
  `)
    .bind(orderId)
    .all();

  const paymentsResult = await env.DB.prepare(`
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
    ORDER BY created_at DESC, payment_id DESC
  `)
    .bind(orderId)
    .all();

  const items = normalizeResults(itemsResult);
  const history = normalizeResults(historyResult);
  const payments = normalizeResults(paymentsResult);

  const payment_summary = summarizePayments(order, payments);

  return json({
    ok: true,
    admin_user: {
      user_id: authCheck.sessionUser.user_id,
      email: authCheck.sessionUser.email,
      display_name: authCheck.sessionUser.display_name,
      role: authCheck.sessionUser.role
    },
    order,
    items,
    history,
    payments,
    payment_summary
  });
}
