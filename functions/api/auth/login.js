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

function makeToken(length = 48) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return [...bytes].map(b => chars[b % chars.length]).join("");
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email || !password) {
    return json({ ok: false, error: "Email and password are required." }, 400);
  }

  const password_hash = await sha256(password);

  const user = await env.DB.prepare(`
    SELECT user_id, email, display_name, role, is_active
    FROM users
    WHERE email = ?
      AND password_hash = ?
    LIMIT 1
  `)
    .bind(email, password_hash)
    .first();

  if (!user) {
    return json({ ok: false, error: "Invalid email or password." }, 401);
  }

  if (!user.is_active) {
    return json({ ok: false, error: "Account is inactive." }, 403);
  }

  const session_token = makeToken(64);

  await env.DB.prepare(`
    INSERT INTO sessions (user_id, session_token, expires_at)
    VALUES (?, ?, datetime('now', '+30 days'))
  `)
    .bind(user.user_id, session_token)
    .run();

  return json({
    ok: true,
    token: session_token,
    user: {
      user_id: user.user_id,
      email: user.email,
      display_name: user.display_name,
      role: user.role
    },
    redirect_to: user.role === "admin" ? "/admin/" : "/members/"
  });
}
