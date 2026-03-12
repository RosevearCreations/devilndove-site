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
      users.password_hash
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
  const sessionUser = await getSessionUser(env, token);

  if (!sessionUser) {
    return json({ ok: false, error: "Invalid session." }, 401);
  }

  if (!sessionUser.is_active) {
    return json({ ok: false, error: "Account is inactive." }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const current_password = String(body.current_password || "");
  const new_password = String(body.new_password || "");

  if (!current_password || !new_password) {
    return json({ ok: false, error: "Current password and new password are required." }, 400);
  }

  if (new_password.length < 6) {
    return json({ ok: false, error: "New password must be at least 6 characters." }, 400);
  }

  const current_password_hash = await sha256(current_password);

  if (current_password_hash !== sessionUser.password_hash) {
    return json({ ok: false, error: "Current password is incorrect." }, 403);
  }

  const new_password_hash = await sha256(new_password);

  if (new_password_hash === sessionUser.password_hash) {
    return json({ ok: false, error: "New password must be different from the current password." }, 400);
  }

  await env.DB.prepare(`
    UPDATE users
    SET password_hash = ?
    WHERE user_id = ?
  `)
    .bind(new_password_hash, sessionUser.user_id)
    .run();

  await env.DB.prepare(`
    DELETE FROM sessions
    WHERE user_id = ?
      AND session_token != ?
  `)
    .bind(sessionUser.user_id, token)
    .run();

  return json({
    ok: true,
    message: "Password changed successfully."
  });
}
