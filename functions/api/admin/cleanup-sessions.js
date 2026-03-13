function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

async function getSessionUser(env, token) {
  if (!token) return null;

  const sessionUser = await env.DB.prepare(`
    SELECT
      users.user_id,
      users.email,
      users.display_name,
      users.role,
      users.is_active,
      users.created_at
    FROM sessions
    JOIN users ON sessions.user_id = users.user_id
    WHERE sessions.session_token = ?
      AND sessions.expires_at > datetime('now')
    LIMIT 1
  `)
    .bind(token)
    .first();

  return sessionUser || null;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  const token = auth.slice(7).trim();
  if (!token) {
    return json({ ok: false, error: "Missing session token." }, 401);
  }

  const sessionUser = await getSessionUser(env, token);

  if (!sessionUser) {
    return json({ ok: false, error: "Invalid session." }, 401);
  }

  if (!sessionUser.is_active) {
    return json({ ok: false, error: "Account is inactive." }, 403);
  }

  if (sessionUser.role !== "admin") {
    return json({ ok: false, error: "Forbidden." }, 403);
  }

  const beforeResult = await env.DB.prepare(`
    SELECT COUNT(*) AS count
    FROM sessions
    WHERE expires_at <= datetime('now')
  `).first();

  await env.DB.prepare(`
    DELETE FROM sessions
    WHERE expires_at <= datetime('now')
  `).run();

  return json({
    ok: true,
    message: "Expired sessions cleaned up successfully.",
    deleted_sessions: Number(beforeResult?.count || 0)
  });
}
