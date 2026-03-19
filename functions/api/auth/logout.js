// File: /functions/api/auth/logout.js

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
      ok: true,
      message: "No active session token was provided.",
      logged_out: true,
      deleted_sessions: 0
    });
  }

  const matchingSessions = await env.DB.prepare(`
    SELECT
      session_id
    FROM sessions
    WHERE session_token = ?
       OR token = ?
  `)
    .bind(token, token)
    .all();

  const sessions = Array.isArray(matchingSessions?.results)
    ? matchingSessions.results
    : [];

  if (!sessions.length) {
    return json({
      ok: true,
      message: "Session already cleared.",
      logged_out: true,
      deleted_sessions: 0
    });
  }

  const placeholders = sessions.map(() => "?").join(", ");
  const sessionIds = sessions.map((row) => Number(row.session_id)).filter((id) => Number.isInteger(id) && id > 0);

  if (!sessionIds.length) {
    return json({
      ok: true,
      message: "Session already cleared.",
      logged_out: true,
      deleted_sessions: 0
    });
  }

  await env.DB.prepare(`
    DELETE FROM sessions
    WHERE session_id IN (${placeholders})
  `)
    .bind(...sessionIds)
    .run();

  return json({
    ok: true,
    message: "Logged out successfully.",
    logged_out: true,
    deleted_sessions: sessionIds.length
  });
}
