// File: /functions/api/member/order-detail.js

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function getBearerToken(request) {
  const authHeader = request.headers.get("Authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? String(match[1] || "").trim() : "";
}

async function getSessionUser(env, token) {
  if (!token) return null;

  const sessionUser = await env.DB.prepare(`
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

  return sessionUser || null;
}

async function requireMember(request, env) {
  const token = getBearerToken(request);

  if (!token) {
    return { error: json({ ok: false, error: "Unauthorized." }, 401) };
  }

  const sessionUser = await getSessionUser(env, token);

  if (!sessionUser) {
    return { error: json({ ok: false, error: "Invalid or expired session." }, 401) };
  }

  if (Number(sessionUser.is_active || 0) !== 1) {
    return { error: json({ ok: false, error: "Account is inactive." }, 403) };
  }

  const role = String(sessionUser.role || "").trim().toLowerCase();

  if (!["member", "admin"].includes(role)) {
    return { error: json({ ok: false, error: "Forbidden." }, 403) };
  }

  return {
    sessionUser: {
      user_id: Number(sessionUser.resolved_user_id || sessionUser.user_id || 0),
      email: sessionUser.email || "",
      display_name: sessionUser.display_name || "",
      role
    }
  };
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function summarizePayments(order, payments) {
  const safePayments = Array.isArray(payments) ? payments : [];
  const orderTotalCents = Number(order?.total_cents || 0);

  let paidTotalCents = 0;
  let pendingTotalCents = 0;
  let refundedTotalCents = 0;

  let hasPaidLike = false;
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
      hasPaidLike = true;
    }

    if (["pending", "authorized"].includes(status)) {
      pendingTotalCents += amount;
    }

    if (status === "authorized") {
      hasAuthorized = true;
    }

    if (status === "pending") {
      hasPending = true;
    }

    if (status === "refunded") {
      hasRefunded = true;
      refundedTotalCents += amount;
    }

    if (status === "partially_refunded") {
      hasPartiallyRefunded = true;
      refundedTotalCents += amount;
    }

    if (!["failed", "cancelled"].includes(status)) {
      allFailedOrCancelled = false;
    }
  }

  let derivedPaymentStatus = String(order?.payment_status || "pending").toLowerCase();

  if (!safePayments.length) {
    derivedPaymentStatus = String(order?.payment_status || "pending").toLowerCase();
  } else if (hasRefunded) {
    derivedPaymentStatus = "refunded";
  } else if (hasPartiallyRefunded) {
    derivedPaymentStatus = "partially_refunded";
  } else if (paidTotalCents >= orderTotalCents && orderTotalCents > 0) {
    derivedPaymentStatus = "paid";
  } else if (hasAuthorized) {
    derivedPaymentStatus = "authorized";
  } else if (hasPending) {
    derivedPaymentStatus = "pending";
  } else if (allFailedOrCancelled) {
    derivedPaymentStatus = "failed";
  }

  return {
    payment_count: safePayments.length,
    paid_total_cents: paidTotalCents,
    pending_total_cents: pendingTotalCents,
    refunded_total_cents: refundedTotalCents,
    outstanding_cents: Math.max(orderTotalCents - paidTotalCents, 0),
    derived_payment_status: derivedPaymentStatus
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const authCheck = await requireMember(request, env);
  if (authCheck.error) return authCheck.error;

  const sessionUser = authCheck.sessionUser;
  const url = new URL(request.url);
  const orderId = Number(url.searchParams.get("order_id"));

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return json({ ok: false, error: "A valid order_id is required." }, 400);
  }

  const order = await env.DB.prepare(`
    SELECT
      o.order_id,
      o.order_number,
      o.user_id,
      o.customer_email,
      o.customer_name,
      o.order_status,
      o.payment_status,
      o.payment_method,
      o.fulfillment_type,
      o.currency,
      o.subtotal_cents,
      COALESCE(o.discount_cents, 0) AS discount_cents,
      o.shipping_cents,
      o.tax_cents,
      o.total_cents,
      o.shipping_name,
      o.shipping_address1,
      o.shipping_address2,
      o.shipping_city,
      o.shipping_province,
      o.shipping_postal_code,
      o.shipping_country,
      o.notes,
      o.created_at,
      o.updated_at
    FROM orders o
    WHERE o.order_id = ?
      AND (
        o.user_id = ?
        OR LOWER(COALESCE(o.customer_email, '')) = LOWER(?)
      )
    LIMIT 1
  `)
    .bind(orderId, sessionUser.user_id, sessionUser.email)
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
      currency,
      created_at
    FROM order_items
    WHERE order_id = ?
    ORDER BY order_item_id ASC
  `)
    .bind(orderId)
    .all();

  const paymentsResult = await env.DB.prepare(`
    SELECT
      payment_id,
      order_id,
      provider,
      payment_status,
      amount_cents,
      currency,
      payment_method_label,
      transaction_reference,
      paid_at,
      created_at,
      updated_at
    FROM payments
    WHERE order_id = ?
    ORDER BY created_at DESC, payment_id DESC
  `)
    .bind(orderId)
    .all();

  const items = normalizeResults(itemsResult);
  const payments = normalizeResults(paymentsResult);
  const payment_summary = summarizePayments(order, payments);

  return json({
    ok: true,
    user: {
      user_id: sessionUser.user_id,
      email: sessionUser.email,
      display_name: sessionUser.display_name,
      role: sessionUser.role
    },
    order,
    items,
    payments,
    payment_summary
  });
}
