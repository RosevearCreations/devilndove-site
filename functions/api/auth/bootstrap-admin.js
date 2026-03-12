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

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const bootstrap_token = String(body.bootstrap_token || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const display_name = String(body.display_name || "").trim();

  if (!env.DD_BOOTSTRAP_TOKEN) {
    return json({ ok: false, error: "Bootstrap token is not configured on the server." }, 500);
  }

  if (!bootstrap_token || bootstrap_token !== env.DD_BOOTSTRAP_TOKEN) {
    return json({ ok: false, error: "Invalid bootstrap token." }, 403);
  }

  if (!email) {
    return json({ ok: false, error: "Email is required." }, 400);
  }

  if (!password || password.length < 6) {
    return json({ ok: false, error: "Password must be at least 6 characters." }, 400);
  }

  const existingAdmin = await env.DB.prepare(`
    SELECT user_id
    FROM users
    WHERE role = 'admin'
    LIMIT 1
  `).first();

  if (existingAdmin) {
    return json({ ok: false, error: "An admin account already exists. Use the admin panel instead." }, 409);
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
    VALUES (?, ?, ?, 'admin', 1, datetime('now'))
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
    message: "Initial admin account created successfully.",
    user
  }, 201);
}
