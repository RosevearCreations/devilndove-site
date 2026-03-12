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

export async function onRequestPost(context) {
  const { request, env } = context;

  const allowPublicRegistration =
    String(env.ALLOW_PUBLIC_REGISTRATION || "").trim() === "1";

  if (!allowPublicRegistration) {
    return json({
      ok: false,
      error: "Public registration is disabled. Please contact an administrator for an account."
    }, 403);
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

  if (!email || !password) {
    return json({ ok: false, error: "Email and password are required." }, 400);
  }

  if (password.length < 6) {
    return json({ ok: false, error: "Password must be at least 6 characters." }, 400);
  }

  const existing = await env.DB.prepare(`
    SELECT user_id
    FROM users
    WHERE email = ?
    LIMIT 1
  `)
    .bind(email)
    .first();

  if (existing) {
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
    VALUES (?, ?, ?, 'member', 1, datetime('now'))
  `)
    .bind(email, password_hash, display_name || null)
    .run();

  const user = await env.DB.prepare(`
    SELECT user_id, email, display_name, role, is_active, created_at
    FROM users
    WHERE user_id = ?
    LIMIT 1
  `)
    .bind(result.meta.last_row_id)
    .first();

  return json({
    ok: true,
    message: "Registration successful.",
    user
  }, 201);
}
