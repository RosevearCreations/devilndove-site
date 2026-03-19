// File: /functions/api/auth/session-info.js

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

function safeIso(value) {
  return value || null;
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const token = getBearerToken(request);

  if (!token) {
    return json({
      ok: false,
      error: "Unauthorized."
    }, 401);
  }

  const session = await env.DB.prepare(`
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
      u.created_at AS user_created_at,
      u.updated_at AS user_updated_at
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

  if (!session) {
    return json({
      ok: false,
      error: "Invalid or expired session."
    }, 401);
  }

  const isActive = Number(session.is_active || 0) === 1;

  if (!isActive) {
    return json({
      ok: false,
      error: "Account is inactive."
    }, 403);
  }

  return json({
    ok: true,
    session: {
      session_id: Number(session.session_id || 0),
      session_token: session.session_token || session.token || null,
      token: session.token || session.session_token || null,
      user_id: Number(session.resolved_user_id || session.user_id || 0),
      expires_at: safeIso(session.expires_at),
      created_at: safeIso(session.session_created_at),
      is_expired: false
    },
    user: {
      user_id: Number(session.resolved_user_id || session.user_id || 0),
      email: session.email || "",
      display_name: session.display_name || "",
      role: session.role || "member",
      is_active: 1,
      created_at: safeIso(session.user_created_at),
      updated_at: safeIso(session.user_updated_at)
    }
  });
}
