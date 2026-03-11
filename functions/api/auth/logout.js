// File: /functions/api/auth/logout.js
//
// POST /api/auth/logout
// Clears dd_session cookie and deletes the session row (if present).

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

function clearSessionCookie() {
  // No Domain= attribute so it works on both preview + custom domain.
  // Secure is fine on Pages (HTTPS). SameSite=Lax helps reduce CSRF risk.
  return "dd_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") return new Response(null, { status: 204 });

  if (request.method !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" });
  }

  if (!env.DD_DB) {
    return json(500, { ok: false, error: "Database binding DD_DB not configured" });
  }

  const token = getCookie(request, "dd_session");
  if (token) {
    // Best-effort delete; even if it fails, still clear cookie.
    try {
      await env.DD_DB.prepare(`DELETE FROM sessions WHERE token = ?`).bind(token).run();
    } catch (_) {}
  }

  return json(
    200,
    { ok: true },
    {
      "set-cookie": clearSessionCookie(),
    }
  );
}
