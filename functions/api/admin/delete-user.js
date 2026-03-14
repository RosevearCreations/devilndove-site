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

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const user_id = Number(body.user_id);

  if (!Number.isInteger(user_id) || user_id <= 0) {
    return json({ ok: false, error: "Valid user_id is required." }, 400);
  }

  if (user_id === sessionUser.user_id) {
    return json({ ok: false, error: "You cannot delete your own account." }, 400);
  }

  const existingUser = await env.DB.prepare(`
    SELECT
      user_id,
      email,
      display_name,
      role,
      is_active,
      created_at
    FROM users
    WHERE user_id = ?
    LIMIT 1
  `)
    .bind(user_id)
    .first();

  if (!existingUser) {
    return json({ ok: false, error: "User not found." }, 404);
  }

  if (existingUser.role === "admin") {
    const adminCountResult = await env.DB.prepare(`
      SELECT COUNT(*) AS count
      FROM users
      WHERE role = 'admin'
    `).first();

    const adminCount = Number(adminCountResult?.count || 0);

    if (adminCount <= 1) {
      return json({
        ok: false,
        error: "You cannot delete the last remaining admin account."
      }, 400);
    }
  }

  await env.DB.prepare(`
    DELETE FROM sessions
    WHERE user_id = ?
  `)
    .bind(user_id)
    .run();

  await env.DB.prepare(`
    DELETE FROM users
    WHERE user_id = ?
  `)
    .bind(user_id)
    .run();

  return json({
    ok: true,
    message: "User deleted successfully.",
    deleted_user: {
      user_id: existingUser.user_id,
      email: existingUser.email,
      display_name: existingUser.display_name,
      role: existingUser.role
    }
  });
}
