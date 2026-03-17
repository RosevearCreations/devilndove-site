// File: /functions/api/admin/update-order-status.js

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
  const new_status = normalizeText(body.new_status).toLowerCase();
  const note = normalizeText(body.note) || null;

  if (!Number.isInteger(order_id) || order_id <= 0) {
    return json({ ok: false, error: "A valid order_id is required." }, 400);
  }

  const validStatuses = ["draft", "pending", "paid", "fulfilled", "cancelled", "refunded"];

  if (!validStatuses.includes(new_status)) {
    return json({ ok: false, error: "A valid new_status is required." }, 400);
  }

  const existingOrder = await env.DB.prepare(`
    SELECT
      order_id,
      order_number,
      order_status,
      customer_email,
      customer_name,
      fulfillment_type,
      currency,
      subtotal_cents,
      discount_cents,
      shipping_cents,
      tax_cents,
      total_cents,
      created_at,
      updated_at
    FROM orders
    WHERE order_id = ?
    LIMIT 1
  `)
    .bind(order_id)
    .first();

  if (!existingOrder) {
    return json({ ok: false, error: "Order not found." }, 404);
  }

  const old_status = String(existingOrder.order_status || "").toLowerCase();

  if (old_status === new_status) {
    return json({
      ok: true,
      message: "Order status is already set to that value.",
      order: existingOrder
    });
  }

  await env.DB.prepare(`
    UPDATE orders
    SET
      order_status = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE order_id = ?
  `)
    .bind(new_status, order_id)
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
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `)
    .bind(
      order_id,
      old_status || null,
      new_status,
      authCheck.sessionUser.user_id,
      note
    )
    .run();

  const updatedOrder = await env.DB.prepare(`
    SELECT
      order_id,
      order_number,
      order_status,
      customer_email,
      customer_name,
      fulfillment_type,
      currency,
      subtotal_cents,
      discount_cents,
      shipping_cents,
      tax_cents,
      total_cents,
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
