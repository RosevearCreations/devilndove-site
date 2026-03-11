// File: /functions/api/auth/login.js
//
// POST /api/auth/login
// Body: { "email": "...", "password": "...", "rememberMe": true|false }
//
// Requires D1 tables:
// - members(member_id, email, password_hash, display_name, role, is_active, last_login_at, ...)
// - sessions(token TEXT PRIMARY KEY, member_id INTEGER, expires_at TEXT, created_at TEXT DEFAULT (datetime('now')))
//
// Cookie set: dd_session=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=...

function json(status, data, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });
}

function base64UrlEncode(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function timingSafeEqual(a, b) {
  if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array)) return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function pbkdf2Sha256(password, saltBytes, iterations, dkLenBytes = 32) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: saltBytes,
      iterations,
    },
    keyMaterial,
    dkLenBytes * 8
  );

  return new Uint8Array(bits);
}

function b64ToBytes(b64) {
  // Accept base64url or base64
  const norm = b64.replace(/-/g, "+").replace(/_/g, "/");
  const pad = norm.length % 4 === 0 ? norm : norm + "===".slice(0, 4 - (norm.length % 4));
  const bin = atob(pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function verifyPassword(password, stored) {
  // Expected format: pbkdf2_sha256$250000$<salt_b64url>$<hash_b64url>
  if (typeof stored !== "string") return false;
  const parts = stored.split("$");
  if (parts.length !== 4) return false;
  const [scheme, iterStr, saltB64, hashB64] = parts;
  if (scheme !== "pbkdf2_sha256") return false;

  const iterations = Number(iterStr);
  if (!Number.isFinite(iterations) || iterations < 100_000) return false;

  const saltBytes = b64ToBytes(saltB64);
  const expected = b64ToBytes(hashB64);

  const derived = await pbkdf2Sha256(password, saltBytes, iterations, expected.length);
  return timingSafeEqual(derived, expected);
}

function cookieString(name, value, opts = {}) {
  const parts = [`${name}=${value}`];

  if (opts.maxAge != null) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.path) parts.push(`Path=${opts.path}`);
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.secure) parts.push("Secure");
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);

  return parts.join("; ");
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  if (request.method !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" }, { Allow: "POST, OPTIONS" });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { ok: false, error: "Invalid JSON" });
  }

  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const rememberMe = Boolean(body?.rememberMe);

  if (!email || !password) {
    return json(400, { ok: false, error: "Email and password are required" });
  }

  if (!env.DD_DB) {
    return json(500, { ok: false, error: "Database binding DD_DB not configured" });
  }

  // Look up member
  const memberRes = await env.DD_DB
    .prepare(
      `SELECT member_id, email, password_hash, display_name, role, is_active
       FROM members
       WHERE email = ?
       LIMIT 1`
    )
    .bind(email)
    .first();

  // Do not reveal whether email exists
  if (!memberRes || memberRes.is_active !== 1) {
    return json(401, { ok: false, error: "Invalid email or password" });
  }

  const ok = await verifyPassword(password, memberRes.password_hash);
  if (!ok) {
    return json(401, { ok: false, error: "Invalid email or password" });
  }

  // Create session
  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const token = base64UrlEncode(tokenBytes);

  const days = rememberMe ? 30 : 7;
  const maxAge = days * 24 * 60 * 60;
  const expiresModifier = `+${days} days`;

  // Store session in D1
  await env.DD_DB
    .prepare(
      `INSERT INTO sessions (token, member_id, expires_at)
       VALUES (?, ?, datetime('now', ?))`
    )
    .bind(token, memberRes.member_id, expiresModifier)
    .run();

  // Update last login
  await env.DD_DB
    .prepare(`UPDATE members SET last_login_at = datetime('now') WHERE member_id = ?`)
    .bind(memberRes.member_id)
    .run();

  const setCookie = cookieString("dd_session", token, {
    maxAge,
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  });

  return json(
    200,
    {
      ok: true,
      member: {
        email: memberRes.email,
        display_name: memberRes.display_name || null,
        role: memberRes.role,
      },
    },
    { "Set-Cookie": setCookie }
  );
}
