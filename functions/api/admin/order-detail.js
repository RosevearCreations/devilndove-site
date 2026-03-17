// File: /functions/api/admin/order-detail.js

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

  return json({
    ok: true,
    order,
    items: itemsResult.results || [],
    history: historyResult.results || []
  });
}
