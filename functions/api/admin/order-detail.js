// File: /functions/api/admin/order-detail.js

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

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
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

export async function onRequestGet(context) {
  const { request, env } = context;

  const adminUser = await getAdminUserFromRequest(request, env);

  if (!adminUser) {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  const url = new URL(request.url);
  const order_id = Number(url.searchParams.get("order_id"));

  if (!Number.isInteger(order_id) || order_id <= 0) {
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
      COALESCE(discount_cents, 0) AS discount_cents,
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
    .bind(order_id)
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
    .bind(order_id)
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
    .bind(order_id)
    .all();

  const paymentCountsRow = await env.DB.prepare(`
    SELECT
      COUNT(*) AS payment_count,
      COALESCE(SUM(
        CASE
          WHEN LOWER(COALESCE(payment_status, '')) IN ('paid', 'completed', 'captured')
            THEN COALESCE(amount_cents, 0)
          ELSE 0
        END
      ), 0) AS paid_total_cents
    FROM payments
    WHERE order_id = ?
  `)
    .bind(order_id)
    .first();

  return json({
    ok: true,
    requested_by: {
      user_id: adminUser.user_id,
      email: adminUser.email,
      display_name: adminUser.display_name,
      role: adminUser.role
    },
    order: {
      order_id: Number(order.order_id || 0),
      order_number: order.order_number || "",
      user_id: Number(order.user_id || 0),
      customer_email: order.customer_email || "",
      customer_name: order.customer_name || "",
      order_status: order.order_status || "pending",
      payment_status: order.payment_status || "pending",
      payment_method: order.payment_method || "",
      fulfillment_type: order.fulfillment_type || "shipping",
      currency: order.currency || "CAD",
      subtotal_cents: Number(order.subtotal_cents || 0),
      discount_cents: Number(order.discount_cents || 0),
      shipping_cents: Number(order.shipping_cents || 0),
      tax_cents: Number(order.tax_cents || 0),
      total_cents: Number(order.total_cents || 0),
      shipping_name: order.shipping_name || "",
      shipping_company: order.shipping_company || "",
      shipping_address1: order.shipping_address1 || "",
      shipping_address2: order.shipping_address2 || "",
      shipping_city: order.shipping_city || "",
      shipping_province: order.shipping_province || "",
      shipping_postal_code: order.shipping_postal_code || "",
      shipping_country: order.shipping_country || "",
      billing_name: order.billing_name || "",
      billing_company: order.billing_company || "",
      billing_address1: order.billing_address1 || "",
      billing_address2: order.billing_address2 || "",
      billing_city: order.billing_city || "",
      billing_province: order.billing_province || "",
      billing_postal_code: order.billing_postal_code || "",
      billing_country: order.billing_country || "",
      notes: order.notes || "",
      created_at: order.created_at || null,
      updated_at: order.updated_at || null
    },
    items: normalizeResults(itemsResult).map((item) => ({
      order_item_id: Number(item.order_item_id || 0),
      order_id: Number(item.order_id || 0),
      product_id: Number(item.product_id || 0),
      sku: item.sku || "",
      product_name: item.product_name || "",
      product_type: item.product_type || "",
      unit_price_cents: Number(item.unit_price_cents || 0),
      quantity: Number(item.quantity || 0),
      line_subtotal_cents: Number(item.line_subtotal_cents || 0),
      taxable: Number(item.taxable || 0),
      tax_class_code: item.tax_class_code || "",
      requires_shipping: Number(item.requires_shipping || 0),
      digital_file_url: item.digital_file_url || "",
      created_at: item.created_at || null
    })),
    status_history: normalizeResults(historyResult).map((row) => ({
      order_status_history_id: Number(row.order_status_history_id || 0),
      order_id: Number(row.order_id || 0),
      old_status: row.old_status || "",
      new_status: row.new_status || "",
      changed_by_user_id: Number(row.changed_by_user_id || 0),
      changed_by_email: row.changed_by_email || "",
      changed_by_display_name: row.changed_by_display_name || "",
      note: row.note || "",
      created_at: row.created_at || null
    })),
    payment_snapshot: {
      payment_count: Number(paymentCountsRow?.payment_count || 0),
      paid_total_cents: Number(paymentCountsRow?.paid_total_cents || 0),
      outstanding_cents: Math.max(
        Number(order.total_cents || 0) - Number(paymentCountsRow?.paid_total_cents || 0),
        0
      )
    }
  });
}
