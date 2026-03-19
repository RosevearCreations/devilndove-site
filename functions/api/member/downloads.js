// File: /functions/api/member/downloads.js

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

export async function onRequestGet(context) {
  const { request, env } = context;

  const authCheck = await requireMember(request, env);
  if (authCheck.error) return authCheck.error;

  const sessionUser = authCheck.sessionUser;

  const sql = `
    SELECT
      o.order_id,
      o.order_number,
      oi.order_item_id,
      oi.product_id,
      oi.product_name,
      oi.product_type,
      oi.digital_file_url AS file_url,
      oi.created_at,
      'available' AS access_status,
      NULL AS expires_at
    FROM orders o
    INNER JOIN order_items oi
      ON oi.order_id = o.order_id
    WHERE (
      o.user_id = ?
      OR LOWER(COALESCE(o.customer_email, '')) = LOWER(?)
    )
      AND LOWER(COALESCE(oi.product_type, '')) IN ('digital', 'download', 'file')
      AND COALESCE(oi.digital_file_url, '') <> ''
      AND LOWER(COALESCE(o.order_status, '')) NOT IN ('cancelled')
      AND LOWER(COALESCE(o.payment_status, 'pending')) IN (
        'paid',
        'completed',
        'captured',
        'authorized',
        'pending'
      )
    ORDER BY o.created_at DESC, oi.order_item_id DESC
  `;

  const result = await env.DB.prepare(sql)
    .bind(sessionUser.user_id, sessionUser.email)
    .all();

  return json({
    ok: true,
    user: {
      user_id: sessionUser.user_id,
      email: sessionUser.email,
      display_name: sessionUser.display_name,
      role: sessionUser.role
    },
    downloads: normalizeResults(result).map((row) => ({
      order_id: Number(row.order_id || 0),
      order_number: row.order_number || "",
      order_item_id: Number(row.order_item_id || 0),
      product_id: Number(row.product_id || 0),
      product_name: row.product_name || "",
      product_type: row.product_type || "",
      title: row.product_name || "Download",
      file_url: row.file_url || "",
      access_status: row.access_status || "available",
      expires_at: row.expires_at || null,
      created_at: row.created_at || null
    }))
  });
}
