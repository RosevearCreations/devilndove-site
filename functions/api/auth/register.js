// File: /functions/api/auth/register.js

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function normalizeText(value) {
  return String(value || "").trim();
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(input) {
  const encoded = new TextEncoder().encode(String(input || ""));
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return toHex(digest);
}

async function formatStoredPasswordHashFromPlaintext(password) {
  const hex = await sha256Hex(password);
  return `sha256$${hex}`;
}

function makeSessionToken() {
  return `${crypto.randomUUID()}${crypto.randomUUID().replace(/-/g, "")}`;
}

function isValidEmail(email) {
  const value = String(email || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const email = normalizeText(body.email).toLowerCase();
  const display_name = normalizeText(body.display_name || body.name);
  const password = String(body.password || "");
  const password_confirm = String(body.password_confirm || body.confirm_password || "");

  if (!email) {
    return json({ ok: false, error: "Email is required." }, 400);
  }

  if (!isValidEmail(email)) {
    return json({ ok: false, error: "A valid email is required." }, 400);
  }

  if (!password) {
    return json({ ok: false, error: "Password is required." }, 400);
  }

  if (password.length < 6) {
    return json({ ok: false, error: "Password must be at least 6 characters." }, 400);
  }

  if (password_confirm && password !== password_confirm) {
    return json({ ok: false, error: "Passwords do not match." }, 400);
  }

  const existingUser = await env.DB.prepare(`
    SELECT
      user_id,
      email
    FROM users
    WHERE LOWER(email) = LOWER(?)
    LIMIT 1
  `)
    .bind(email)
    .first();

  if (existingUser) {
    return json({ ok: false, error: "An account with this email already exists." }, 409);
  }

  const password_hash = await formatStoredPasswordHashFromPlaintext(password);

  const insertResult = await env.DB.prepare(`
    INSERT INTO users (
      email,
      password_hash,
      display_name,
      role,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      ?,
      ?,
      ?,
      'member',
      1,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    )
  `)
    .bind(
      email,
      password_hash,
      display_name || null
    )
    .run();

  const user_id = insertResult?.meta?.last_row_id;

  if (!user_id) {
    return json({ ok: false, error: "Account could not be created." }, 500);
  }

  const sessionToken = makeSessionToken();

  await env.DB.prepare(`
    INSERT INTO sessions (
      user_id,
      session_token,
      token,
      expires_at,
      created_at
    )
    VALUES (
      ?,
      ?,
      ?,
      datetime('now', '+30 days'),
      CURRENT_TIMESTAMP
    )
  `)
    .bind(
      Number(user_id),
      sessionToken,
      sessionToken
    )
    .run();

  const user = await env.DB.prepare(`
    SELECT
      user_id,
      email,
      display_name,
      role,
      is_active,
      created_at,
      updated_at
    FROM users
    WHERE user_id = ?
    LIMIT 1
  `)
    .bind(Number(user_id))
    .first();

  const session = await env.DB.prepare(`
    SELECT
      session_id,
      user_id,
      session_token,
      token,
      expires_at,
      created_at
    FROM sessions
    WHERE (session_token = ? OR token = ?)
    ORDER BY session_id DESC
    LIMIT 1
  `)
    .bind(sessionToken, sessionToken)
    .first();

  return json({
    ok: true,
    message: "Account created successfully.",
    session_token: sessionToken,
    token: sessionToken,
    session: session
      ? {
          session_id: Number(session.session_id || 0),
          session_token: session.session_token || sessionToken,
          token: session.token || sessionToken,
          expires_at: session.expires_at || null,
          created_at: session.created_at || null
        }
      : {
          session_id: null,
          session_token: sessionToken,
          token: sessionToken,
          expires_at: null,
          created_at: null
        },
    user: {
      user_id: Number(user?.user_id || user_id || 0),
      email: user?.email || email,
      display_name: user?.display_name || "",
      role: user?.role || "member",
      is_active: Number(user?.is_active || 1),
      created_at: user?.created_at || null,
      updated_at: user?.updated_at || null
    }
  }, 201);
}
