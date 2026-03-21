// File: /functions/api/admin/dashboard-summary.js
// Brief description: Returns the top-level admin dashboard counts for users, products,
// orders, and payments. It validates the active admin bearer-token session and provides
// the summary data used by public/js/admin-dashboard-summary.js.

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

async function getCount(env, sql) {
  const row = await env.DB.prepare(sql).first();
  return Number(row?.count || 0);
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const adminUser = await getAdminUserFromRequest(request, env);

  if (!adminUser) {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  const [
    users_count,
    products_count,
    orders_count,
    payments_count
  ] = await Promise.all([
    getCount(env, `SELECT COUNT(*) AS count FROM users`),
    getCount(env, `SELECT COUNT(*) AS count FROM products`),
    getCount(env, `SELECT COUNT(*) AS count FROM orders`),
    getCount(env, `SELECT COUNT(*) AS count FROM payments`)
  ]);

  return json({
    ok: true,
    requested_by: {
      user_id: adminUser.user_id,
      email: adminUser.email,
      display_name: adminUser.display_name
    },
    summary: {
      users_count,
      products_count,
      orders_count,
      payments_count
    }
  });
}
