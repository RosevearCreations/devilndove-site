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

function getBearerToken(request) {
  const authHeader = request.headers.get("Authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? String(match[1] || "").trim() : "";
}

function normalizeOrderStatus(value) {
  const status = normalizeText(value).toLowerCase();
  return [
    "draft",
    "pending",
    "paid",
    "fulfilled",
    "cancelled",
    "refunded"
  ].includes(status)
    ? status
    : "";
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
  const note = normalizeText(body.note || "");

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

  const old_status = String(order.order_status || "").toLowerCase();

  if (old_status === new_status) {
    return json({
      ok: true,
      message: "Order status is already set to that value.",
      order: {
        order_id: Number(order.order_id || 0),
        order_number: order.order_number || "",
        order_status: old_status,
        payment_status: order.payment_status || "pending",
        total_cents: Number(order.total_cents || 0),
        currency: order.currency || "CAD",
        created_at: order.created_at || null,
        updated_at: order.updated_at || null
      }
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

  const actorLabel =
    adminUser.display_name ||
    adminUser.email ||
    `Admin #${adminUser.user_id}`;

  const historyNote = note
    ? `${actorLabel} updated order status. ${note}`
    : `${actorLabel} updated order status.`;

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
      old_status,
      new_status,
      adminUser.user_id,
      historyNote
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
    updated_by: {
      user_id: adminUser.user_id,
      email: adminUser.email,
      display_name: adminUser.display_name
    },
    order: {
      order_id: Number(updatedOrder?.order_id || order_id || 0),
      order_number: updatedOrder?.order_number || order.order_number || "",
      order_status: updatedOrder?.order_status || new_status,
      payment_status: updatedOrder?.payment_status || order.payment_status || "pending",
      total_cents: Number(updatedOrder?.total_cents || order.total_cents || 0),
      currency: updatedOrder?.currency || order.currency || "CAD",
      created_at: updatedOrder?.created_at || order.created_at || null,
      updated_at: updatedOrder?.updated_at || null
    }
  });
}
