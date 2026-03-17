// File: /functions/api/admin/orders.js

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

export async function onRequestGet(context) {
  const { request, env } = context;

  const authCheck = await requireAdmin(request, env);
  if (authCheck.error) return authCheck.error;

  const url = new URL(request.url);
  const statusFilter = String(url.searchParams.get("status") || "").trim().toLowerCase();

  let sql = `
    SELECT
      order_id,
      order_number,
      customer_email,
      customer_name,
      order_status,
      fulfillment_type,
      currency,
      subtotal_cents,
      discount_cents,
      shipping_cents,
      tax_cents,
      total_cents,
      shipping_city,
      shipping_province,
      shipping_country,
      created_at,
      updated_at
    FROM orders
  `;

  const validStatuses = ["draft", "pending", "paid", "fulfilled", "cancelled", "refunded"];
  let result;

  if (statusFilter && validStatuses.includes(statusFilter)) {
    sql += ` WHERE order_status = ? `;
    sql += ` ORDER BY created_at DESC, order_id DESC `;

    result = await env.DB.prepare(sql)
      .bind(statusFilter)
      .all();
  } else {
    sql += ` ORDER BY created_at DESC, order_id DESC `;

    result = await env.DB.prepare(sql).all();
  }

  return json({
    ok: true,
    orders: result.results || []
  });
}
