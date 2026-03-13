function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hashBuffer)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
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
  const password = String(body.password || "");

  if (!Number.isInteger(user_id) || user_id <= 0) {
    return json({ ok: false, error: "Valid user_id is required." }, 400);
  }

  if (!password || password.length < 6) {
    return json({ ok: false, error: "Password must be at least 6 characters." }, 400);
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

  const password_hash = await sha256(password);

  await env.DB.prepare(`
    UPDATE users
    SET password_hash = ?
    WHERE user_id = ?
  `)
    .bind(password_hash, user_id)
    .run();

  await env.DB.prepare(`
    DELETE FROM sessions
    WHERE user_id = ?
  `)
    .bind(user_id)
    .run();

  return json({
    ok: true,
    message: "Password reset successfully. Existing sessions were signed out."
  });
}
