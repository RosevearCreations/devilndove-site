// File: /functions/api/auth/logout.js
// Brief description: Logs out the current session tied to the bearer token.
// It deletes only the active session token being used, leaving any other sessions intact.

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

export async function onRequestPost(context) {
  const { request, env } = context;

  const token = getBearerToken(request);

  if (!token) {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  const session = await env.DB.prepare(`
    SELECT
      session_id,
      user_id
    FROM sessions
    WHERE (
      session_token = ?
      OR token = ?
    )
    LIMIT 1
  `)
    .bind(token, token)
    .first();

  if (!session) {
    return json({
      ok: true,
      message: "Session was already logged out."
    });
  }

  await env.DB.prepare(`
    DELETE FROM sessions
    WHERE session_id = ?
  `)
    .bind(Number(session.session_id || 0))
    .run();

  return json({
    ok: true,
    message: "Logged out successfully."
  });
}
