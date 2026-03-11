// File: /functions/api/auth/logout.js
//
// POST /api/auth/logout
// Clears cookie + deletes session row (if present).

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
  // Secure is fine for production (HTTPS). Browsers may ignore Secure on http://localhost.
  return [
    "dd_session=;",
    "Path=/;",
    "HttpOnly;",
    "SameSite=Lax;",
    "Secure;",
    "Max-Age=0;",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ].join(" ");
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

  // Best effort: delete session row if we have a token
  if (token) {
    try {
      await env.DD_DB.prepare(`DELETE FROM sessions WHERE token = ?`).bind(token).run();
    } catch {
      // ignore (we still clear cookie)
    }
  }

  return json(
    200,
    { ok: true },
    {
      "set-cookie": clearSessionCookie(),
    }
  );
}
