// File: /functions/api/auth/session-info.js
// Brief description: Returns the current authenticated session details and a small
// session summary for the logged-in user. It is used by the member/account tools
// so users can see their current session state and account/session metadata cleanly.

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

export async function onRequestGet(context) {
  const { request, env } = context;

  const token = getBearerToken(request);

  if (!token) {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  const sessionUser = await env.DB.prepare(`
    SELECT
      s.session_id,
      s.user_id,
      s.session_token,
      s.token,
      s.expires_at,
      s.created_at AS session_created_at,
      u.user_id AS resolved_user_id,
      u.email,
      u.display_name,
      u.role,
      u.is_active,
      u.created_at,
      u.updated_at
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

  const allSessionsResult = await env.DB.prepare(`
    SELECT
      session_id,
      expires_at
    FROM sessions
    WHERE user_id = ?
  `)
    .bind(Number(sessionUser.resolved_user_id || sessionUser.user_id || 0))
    .all();

  const sessions = Array.isArray(allSessionsResult?.results) ? allSessionsResult.results : [];

  const total_sessions = sessions.length;
  const active_sessions = sessions.filter((row) => {
    return typeof row?.expires_at === "string";
  }).length;

  return json({
    ok: true,
    user: {
      user_id: Number(sessionUser.resolved_user_id || sessionUser.user_id || 0),
      email: sessionUser.email || "",
      display_name: sessionUser.display_name || "",
      role: sessionUser.role || "member",
      is_active: Number(sessionUser.is_active || 0),
      created_at: sessionUser.created_at || null,
      updated_at: sessionUser.updated_at || null
    },
    session: {
      session_id: Number(sessionUser.session_id || 0),
      expires_at: sessionUser.expires_at || null,
      created_at: sessionUser.session_created_at || null,
      is_current: true
    },
    session_summary: {
      total_sessions,
      active_sessions
    }
  });
}
