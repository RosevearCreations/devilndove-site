// File: /functions/api/auth/logout-all.js

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
    return json({
      ok: false,
      error: "Unauthorized."
    }, 401);
  }

  const currentSession = await env.DB.prepare(`
    SELECT
      s.session_id,
      s.user_id,
      s.session_token,
      s.token,
      s.expires_at,
      u.user_id AS resolved_user_id,
      u.email,
      u.display_name,
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

  if (!currentSession) {
    return json({
      ok: false,
      error: "Invalid or expired session."
    }, 401);
  }

  if (Number(currentSession.is_active || 0) !== 1) {
    return json({
      ok: false,
      error: "Account is inactive."
    }, 403);
  }

  const userId = Number(currentSession.resolved_user_id || currentSession.user_id || 0);

  if (!Number.isInteger(userId) || userId <= 0) {
    return json({
      ok: false,
      error: "Unable to resolve session user."
    }, 401);
  }

  const allSessionsResult = await env.DB.prepare(`
    SELECT
      session_id
    FROM sessions
    WHERE user_id = ?
  `)
    .bind(userId)
    .all();

  const sessionRows = Array.isArray(allSessionsResult?.results)
    ? allSessionsResult.results
    : [];

  const sessionIds = sessionRows
    .map((row) => Number(row.session_id))
    .filter((id) => Number.isInteger(id) && id > 0);

  if (!sessionIds.length) {
    return json({
      ok: true,
      message: "No active sessions found for this user.",
      logged_out: true,
      deleted_sessions: 0
    });
  }

  const placeholders = sessionIds.map(() => "?").join(", ");

  await env.DB.prepare(`
    DELETE FROM sessions
    WHERE session_id IN (${placeholders})
  `)
    .bind(...sessionIds)
    .run();

  return json({
    ok: true,
    message: "All sessions logged out successfully.",
    logged_out: true,
    deleted_sessions: sessionIds.length,
    user: {
      user_id: userId,
      email: currentSession.email || "",
      display_name: currentSession.display_name || ""
    }
  });
}
