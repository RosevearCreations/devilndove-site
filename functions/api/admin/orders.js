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
      o.order_id,
      o.order_number,
      o.customer_email,
      o.customer_name,
      o.order_status,
      o.fulfillment_type,
      o.currency,
      o.subtotal_cents,
      o.discount_cents,
      o.shipping_cents,
      o.tax_cents,
      o.total_cents,
      o.shipping_city,
      o.shipping_province,
      o.shipping_country,
      o.created_at,
      o.updated_at,

      COALESCE((
        SELECT COUNT(*)
        FROM payments p
        WHERE p.order_id = o.order_id
      ), 0) AS payment_count,

      COALESCE((
        SELECT SUM(
          CASE
            WHEN p.payment_status IN ('paid', 'partially_refunded', 'refunded')
            THEN p.amount_cents
            ELSE 0
          END
        )
        FROM payments p
        WHERE p.order_id = o.order_id
      ), 0) AS paid_amount_cents,

      (
        SELECT p.payment_status
        FROM payments p
        WHERE p.order_id = o.order_id
        ORDER BY p.created_at DESC, p.payment_id DESC
        LIMIT 1
      ) AS latest_payment_status,

      (
        SELECT p.provider
        FROM payments p
        WHERE p.order_id = o.order_id
        ORDER BY p.created_at DESC, p.payment_id DESC
        LIMIT 1
      ) AS latest_payment_provider

    FROM orders o
  `;

  const validStatuses = ["draft", "pending", "paid", "fulfilled", "cancelled", "refunded"];
  let result;

  if (statusFilter && validStatuses.includes(statusFilter)) {
    sql += ` WHERE o.order_status = ? `;
    sql += ` ORDER BY o.created_at DESC, o.order_id DESC `;

    result = await env.DB.prepare(sql)
      .bind(statusFilter)
      .all();
  } else {
    sql += ` ORDER BY o.created_at DESC, o.order_id DESC `;
    result = await env.DB.prepare(sql).all();
  }

  return json({
    ok: true,
    orders: result.results || []
  });
}
