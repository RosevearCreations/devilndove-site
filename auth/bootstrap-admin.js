// functions/api/auth/bootstrap-admin.js
//
// Legacy compatibility endpoint.
//
// What this file does:
// - keeps old /api/auth/bootstrap-admin callers from failing with 401/JSON errors
// - always returns a safe JSON response
// - tells callers the legacy endpoint is deprecated
// - points to the new bootstrap route
//
// Notes:
// - this is intentionally non-destructive
// - it does NOT bootstrap anything
// - it only prevents stale callers from breaking page behavior

export async function onRequestOptions() {
  return new Response("", {
    status: 204,
    headers: corsHeaders()
  });
}

export async function onRequestPost() {
  return withCors(
    json({
      ok: false,
      legacy: true,
      deprecated: true,
      message:
        "Legacy bootstrap endpoint is disabled. Use /admin-bootstrap or /api/admin/auth_bootstrap_admin_password instead.",
      next_route: "/api/admin/auth_bootstrap_admin_password",
      next_page: "/admin-bootstrap"
    })
  );
}

export async function onRequestGet() {
  return withCors(
    json({
      ok: false,
      legacy: true,
      deprecated: true,
      message:
        "Legacy bootstrap endpoint is disabled. Use /admin-bootstrap or /api/admin/auth_bootstrap_admin_password instead.",
      next_route: "/api/admin/auth_bootstrap_admin_password",
      next_page: "/admin-bootstrap"
    })
  );
}

/* ---------------- helpers ---------------- */

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-password",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [key, value] of Object.entries(corsHeaders())) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
