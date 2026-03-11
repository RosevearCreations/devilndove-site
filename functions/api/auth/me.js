// File: /functions/api/auth/me.js
//
// GET /api/auth/me
// Returns the currently logged-in member (if dd_session cookie is valid).

function json(status, data, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

function getCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const parts = cookie.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (!part) continue;
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1);
    if (k === name) return v;
  }
  return null;
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") return new Response(null, { status: 204 });

  if (request.method !== "GET") {
    return json(405, { ok: false, error: "Method not allowed" });
  }

  if (!env.DD_DB) {
    return json(500, { ok: false, error: "Database binding DD_DB not configured" });
  }

  const token = getCookie(request, "dd_session");
  if (!token) {
    return json(200, { ok: true, loggedIn: false });
  }

  // Valid session = token exists AND not expired AND member active
  const row = await env.DD_DB
    .prepare(
      `
      SELECT
        m.member_id   AS member_id,
        m.email       AS email,
        m.display_name AS display_name,
        m.role        AS role
      FROM sessions s
      JOIN members m ON m.member_id = s.member_id
      WHERE s.token = ?
        AND s.expires_at > datetime('now')
        AND m.is_active = 1
      LIMIT 1
    `
    )
    .bind(token)
    .first();

  if (!row) {
    return json(200, { ok: true, loggedIn: false });
  }

  return json(200, {
    ok: true,
    loggedIn: true,
    member: {
      member_id: row.member_id,
      email: row.email,
      display_name: row.display_name,
      role: row.role,
    },
  });
}
