// File: /functions/api/admin/record-payment.js

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
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

function normalizeText(value) {
  return String(value || "").trim();
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const authCheck = await requireAdmin(request, env);
  if (authCheck.error) return authCheck.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const order_id = Number(body.order_id);
  const provider = normalizeText(body.provider || "manual").toLowerCase();
  const payment_status = normalizeText(body.payment_status || "paid").toLowerCase();
  const amount_cents = Number(body.amount_cents);
  const currency = normalizeText(body.currency || "CAD").toUpperCase();
  const payment_method_label = normalizeText(body.payment_method_label) || null;
  const provider_payment_id = normalizeText(body.provider_payment_id) || null;
  const provider_order_id = normalizeText(body.provider_order_id) || null;
  const transaction_reference = normalizeText(body.transaction_reference) || null;
  const notes = normalizeText(body.notes) || null;

  if (!Number.isInteger(order_id) || order_id <= 0) {
    return json({ ok: false, error: "A valid order_id is required." }, 400);
  }

  const validProviders = ["paypal", "stripe", "square", "manual", "other"];
  if (!validProviders.includes(provider)) {
    return json({ ok: false, error: "A valid provider is required." }, 400);
  }

  const validStatuses = ["pending", "authorized", "paid", "failed", "cancelled", "refunded", "partially_refunded"];
  if (!validStatuses.includes(payment_status)) {
    return json({ ok: false, error: "A valid payment_status is required." }, 400);
  }

  if (!Number.isInteger(amount_cents) || amount_cents < 0) {
    return json({ ok: false, error: "amount_cents must be a valid whole number." }, 400);
  }

  const order = await env.DB.prepare(`
    SELECT
      order_id,
      order_number,
      order_status,
      currency,
      total_cents
    FROM orders
    WHERE order_id = ?
    LIMIT 1
  `)
    .bind(order_id)
    .first();

  if (!order) {
    return json({ ok: false, error: "Order not found." }, 404);
  }

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
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)
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
      payment_status === "paid" ? new Date().toISOString().replace("T", " ").replace("Z", "") : null,
      notes
    )
    .run();

  const payment_id = insertResult?.meta?.last_row_id;

  if (payment_status === "paid" && String(order.order_status || "").toLowerCase() === "pending") {
    await env.DB.prepare(`
      UPDATE orders
      SET
        order_status = 'paid',
        updated_at = CURRENT_TIMESTAMP
      WHERE order_id = ?
    `)
      .bind(order_id)
      .run();

    await env.DB.prepare(`
      INSERT INTO order_status_history (
        order_id,
        old_status,
        new_status,
        changed_by_user_id,
        note,
        created_at
      )
      VALUES (?, ?, 'paid', ?, ?, CURRENT_TIMESTAMP)
    `)
      .bind(
        order_id,
        order.order_status || "pending",
        authCheck.sessionUser.user_id,
        `Order marked paid from payment record #${payment_id}`
      )
      .run();
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

  return json({
    ok: true,
    message: "Payment recorded successfully.",
    payment
  }, 201);
}
