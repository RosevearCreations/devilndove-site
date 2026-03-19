// File: /functions/api/auth/login.js

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

async function verifyPassword(inputPassword, storedPasswordHash) {
  const incoming = String(inputPassword || "");
  const stored = String(storedPasswordHash || "").trim();

  if (!stored) return false;

  // Preferred tagged format: sha256$<hex>
  if (stored.startsWith("sha256$")) {
    const expected = stored.slice("sha256$".length).trim().toLowerCase();
    const actual = await sha256Hex(incoming);
    return actual === expected;
  }

  // Legacy tagged plaintext format: plain$<password>
  if (stored.startsWith("plain$")) {
    return incoming === stored.slice("plain$".length);
  }

  // Legacy raw SHA-256 hex storage
  if (/^[a-f0-9]{64}$/i.test(stored)) {
    const actual = await sha256Hex(incoming);
    return actual === stored.toLowerCase();
  }

  // Last-resort legacy exact match fallback
  return incoming === stored;
}

function makeSessionToken() {
  return `${crypto.randomUUID()}${crypto.randomUUID().replace(/-/g, "")}`;
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
  const password = String(body.password || "");

  if (!email) {
    return json({ ok: false, error: "Email is required." }, 400);
  }

  if (!password) {
    return json({ ok: false, error: "Password is required." }, 400);
  }

  const user = await env.DB.prepare(`
    SELECT
      user_id,
      email,
      display_name,
      password_hash,
      role,
      is_active,
      created_at,
      updated_at
    FROM users
    WHERE LOWER(email) = LOWER(?)
    LIMIT 1
  `)
    .bind(email)
    .first();

  if (!user) {
    return json({ ok: false, error: "Invalid email or password." }, 401);
  }

  if (Number(user.is_active || 0) !== 1) {
    return json({ ok: false, error: "Account is inactive." }, 403);
  }

  const passwordOk = await verifyPassword(password, user.password_hash);

  if (!passwordOk) {
    return json({ ok: false, error: "Invalid email or password." }, 401);
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
      Number(user.user_id),
      sessionToken,
      sessionToken
    )
    .run();

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
    message: "Login successful.",
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
      user_id: Number(user.user_id || 0),
      email: user.email || "",
      display_name: user.display_name || "",
      role: user.role || "member",
      is_active: Number(user.is_active || 0),
      created_at: user.created_at || null,
      updated_at: user.updated_at || null
    }
  });
}
