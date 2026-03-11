// File: /functions/api/auth/me.js
//
// GET /api/auth/me
// Returns { ok: true, member: {...} } if session is valid, else { ok: false }.
//
// Requires D1 tables:
// - sessions(token TEXT PRIMARY KEY, member_id INTEGER, expires_at TEXT, created_at TEXT ...)
// - members(member_id, email, display_name, role, is_active ...)

function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function getCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  // Simple cookie parse
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
    return json(200, { ok: false });
  }

  const row = await env.DD_DB.prepare(
    `SELECT
       m.member_id,
       m.email,
       m.display_name,
       m.role,
       m.is_active,
       s.expires_at
     FROM sessions s
     JOIN members m ON m.member_id = s.member_id
     WHERE s.token = ?
     LIMIT 1`
  )
    .bind(token)
    .first();

  if (!row) {
    return json(200, { ok: false });
  }

  // Ensure active + not expired
  const expired = await env.DD_DB.prepare(
    `SELECT CASE WHEN datetime(?) <= datetime('now') THEN 1 ELSE 0 END AS is_expired`
  )
    .bind(row.expires_at)
    .first();

  if (row.is_active !== 1 || expired?.is_expired === 1) {
    // Optional cleanup of expired session
    try {
      await env.DD_DB.prepare(`DELETE FROM sessions WHERE token = ?`).bind(token).run();
    } catch {}
    return json(200, { ok: false });
  }

  return json(200, {
    ok: true,
    member: {
      email: row.email,
      display_name: row.display_name || null,
      role: row.role,
    },
  });
}
