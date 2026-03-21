// File: /functions/api/auth/logout-all.js
// Brief description: Logs out all sessions for the currently authenticated user.
// It deletes every session tied to that user, including the current one, so the
// shared auth helper can fully clear access everywhere.

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

  const sessionUser = await env.DB.prepare(`
    SELECT
      s.session_id,
      s.user_id,
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

  if (!sessionUser) {
    return json({ ok: false, error: "Invalid or expired session." }, 401);
  }

  if (Number(sessionUser.is_active || 0) !== 1) {
    return json({ ok: false, error: "Account is inactive." }, 403);
  }

  const user_id = Number(sessionUser.resolved_user_id || sessionUser.user_id || 0);

  const sessionsResult = await env.DB.prepare(`
    SELECT
      session_id
    FROM sessions
    WHERE user_id = ?
  `)
    .bind(user_id)
    .all();

  const sessionIds = (Array.isArray(sessionsResult?.results) ? sessionsResult.results : [])
    .map((row) => Number(row.session_id || 0))
    .filter((id) => Number.isInteger(id) && id > 0);

  let deleted_sessions = 0;

  if (sessionIds.length) {
    const placeholders = sessionIds.map(() => "?").join(", ");

    await env.DB.prepare(`
      DELETE FROM sessions
      WHERE session_id IN (${placeholders})
    `)
      .bind(...sessionIds)
      .run();

    deleted_sessions = sessionIds.length;
  }

  return json({
    ok: true,
    message: "All sessions were logged out successfully.",
    deleted_sessions
  });
}
