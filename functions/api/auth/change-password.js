// File: /functions/api/auth/change-password.js

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function normalizeText(value) {
  return String(value || "").trim();
}

function getBearerToken(request) {
  const authHeader = request.headers.get("Authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? String(match[1] || "").trim() : "";
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

function formatStoredPasswordHashFromPlaintext(password) {
  return sha256Hex(password).then((hex) => `sha256$${hex}`);
}

async function verifyPassword(inputPassword, storedPasswordHash) {
  const incoming = String(inputPassword || "");
  const stored = String(storedPasswordHash || "").trim();

  if (!stored) return false;

  if (stored.startsWith("sha256$")) {
    const expected = stored.slice("sha256$".length).trim().toLowerCase();
    const actual = await sha256Hex(incoming);
    return actual === expected;
  }

  if (stored.startsWith("plain$")) {
    return incoming === stored.slice("plain$".length);
  }

  if (/^[a-f0-9]{64}$/i.test(stored)) {
    const actual = await sha256Hex(incoming);
    return actual === stored.toLowerCase();
  }

  return incoming === stored;
}

async function getSessionUser(env, token) {
  if (!token) return null;

  const sessionUser = await env.DB.prepare(`
    SELECT
      s.session_id,
      s.user_id,
      s.session_token,
      s.token,
      s.expires_at,
      u.user_id AS resolved_user_id,
      u.email,
      u.display_name,
      u.role,
      u.is_active,
      u.password_hash,
      u.created_at AS user_created_at,
      u.updated_at AS user_updated_at
    FROM sessions s
    INNER JOIN users u
      ON u.user_id = s.user_id
    WHERE (
      s.session_token = ?
      OR s.token = ?
    )
      AND s.expires_at > datetime('now')
    LIMIT 1
  `)
    .bind(token, token)
    .first();

  return sessionUser || null;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const token = getBearerToken(request);

  if (!token) {
    return json({ ok: false, error: "Unauthorized." }, 401);
  }

  const sessionUser = await getSessionUser(env, token);

  if (!sessionUser) {
    return json({ ok: false, error: "Invalid or expired session." }, 401);
  }

  if (Number(sessionUser.is_active || 0) !== 1) {
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
    return json({
      ok: false,
      error: "Current password and new password are required."
    }, 400);
  }

  if (new_password.length < 6) {
    return json({
      ok: false,
      error: "New password must be at least 6 characters."
    }, 400);
  }

  const currentPasswordOk = await verifyPassword(
    current_password,
    sessionUser.password_hash
  );

  if (!currentPasswordOk) {
    return json({
      ok: false,
      error: "Current password is incorrect."
    }, 403);
  }

  const newPasswordMatchesCurrent = await verifyPassword(
    new_password,
    sessionUser.password_hash
  );

  if (newPasswordMatchesCurrent) {
    return json({
      ok: false,
      error: "New password must be different from the current password."
    }, 400);
  }

  const new_password_hash = await formatStoredPasswordHashFromPlaintext(new_password);
  const userId = Number(sessionUser.resolved_user_id || sessionUser.user_id || 0);

  await env.DB.prepare(`
    UPDATE users
    SET
      password_hash = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `)
    .bind(new_password_hash, userId)
    .run();

  await env.DB.prepare(`
    DELETE FROM sessions
    WHERE user_id = ?
      AND session_id != ?
  `)
    .bind(userId, Number(sessionUser.session_id || 0))
    .run();

  return json({
    ok: true,
    message: "Password changed successfully.",
    user: {
      user_id: userId,
      email: sessionUser.email || "",
      display_name: sessionUser.display_name || "",
      role: sessionUser.role || "member",
      is_active: Number(sessionUser.is_active || 0),
      created_at: sessionUser.user_created_at || null,
      updated_at: new Date().toISOString()
    },
    session: {
      session_id: Number(sessionUser.session_id || 0),
      session_token: sessionUser.session_token || sessionUser.token || token,
      token: sessionUser.token || sessionUser.session_token || token,
      expires_at: sessionUser.expires_at || null
    }
  });
}
