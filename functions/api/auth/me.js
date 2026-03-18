// File: /functions/api/auth/me.js

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
    return json({ ok: false, error: "Invalid or expired session." }, 401);
  }

  const isActive = Number(session.is_active || 0) === 1;

  if (!isActive) {
    return json({ ok: false, error: "Account is inactive." }, 403);
  }

  return json({
    ok: true,
    user: {
      user_id: Number(session.resolved_user_id || session.user_id || 0),
      email: session.email || "",
      display_name: session.display_name || "",
      role: session.role || "member",
      is_active: isActive ? 1 : 0,
      created_at: session.user_created_at || null,
      updated_at: session.user_updated_at || null
    },
    session: {
      session_id: Number(session.session_id || 0),
      expires_at: session.expires_at || null,
      created_at: session.session_created_at || null
    }
  });
}
