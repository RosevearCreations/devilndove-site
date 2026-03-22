// File: /functions/api/admin/tax-classes.js
// Brief description: Returns the available tax classes for the admin product tools.
// It validates the active admin bearer-token session and provides the tax-class
// list used by the product create/edit flows.

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

  const result = await env.DB.prepare(`
    SELECT
      tax_class_id,
      code,
      name,
      rate_percent,
      is_active,
      created_at,
      updated_at
    FROM tax_classes
    ORDER BY
      CASE WHEN COALESCE(is_active, 0) = 1 THEN 0 ELSE 1 END,
      name ASC,
      tax_class_id ASC
  `).all();

  const tax_classes = normalizeResults(result).map((row) => ({
    tax_class_id: Number(row.tax_class_id || 0),
    code: row.code || "",
    name: row.name || "",
    rate_percent: Number(row.rate_percent || 0),
    is_active: Number(row.is_active || 0),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  }));

  return json({
    ok: true,
    requested_by: {
      user_id: adminUser.user_id,
      email: adminUser.email,
      display_name: adminUser.display_name
    },
    tax_classes
  });
}
