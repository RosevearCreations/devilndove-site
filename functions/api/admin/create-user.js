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
      users.is_active
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

  if (sessionUser.role !== "admin") {
    return json({ ok: false, error: "Forbidden." }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const display_name = String(body.display_name || "").trim();
  const role = String(body.role || "member").trim().toLowerCase();
  const is_active = Number(body.is_active) === 0 ? 0 : 1;

  if (!email) {
    return json({ ok: false, error: "Email is required." }, 400);
  }

  if (!password || password.length < 6) {
    return json({ ok: false, error: "Password must be at least 6 characters." }, 400);
  }

  if (role !== "member" && role !== "admin") {
    return json({ ok: false, error: "Role must be member or admin." }, 400);
  }

  const existingUser = await env.DB.prepare(`
    SELECT user_id
    FROM users
    WHERE email = ?
    LIMIT 1
  `)
    .bind(email)
    .first();

  if (existingUser) {
    return json({ ok: false, error: "Email is already registered." }, 409);
  }

  const password_hash = await sha256(password);

  const result = await env.DB.prepare(`
    INSERT INTO users (
      email,
      password_hash,
      display_name,
      role,
      is_active,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `)
    .bind(email, password_hash, display_name || null, role, is_active)
    .run();

  const userId =
    result?.meta?.last_row_id ??
    result?.meta?.last_row_id?.toString?.() ??
    null;

  const createdUser = await env.DB.prepare(`
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
    .bind(userId)
    .first();

  return json({
    ok: true,
    message: "User created successfully.",
    user: createdUser
  }, 201);
}
