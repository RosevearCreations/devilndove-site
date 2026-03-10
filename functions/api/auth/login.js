// /functions/api/auth/login.js
// POST { "email": "...", "password": "..." }

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.DD_DB) return json({ ok: false, error: "Missing D1 binding DD_DB." }, 500);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email || !password) {
    return json({ ok: false, error: "Email and password are required." }, 400);
  }

  // 1) Find member
  const member = await env.DD_DB
    .prepare(
      `SELECT member_id, email, password_hash, display_name, role, is_active
       FROM members
       WHERE email = ? LIMIT 1`
    )
    .bind(email)
    .first();

  if (!member || member.is_active !== 1) {
    return json({ ok: false, error: "Invalid credentials." }, 401);
  }

  // 2) Verify password (pbkdf2 format)
  const ok = await verifyPassword(password, member.password_hash);
  if (!ok) return json({ ok: false, error: "Invalid credentials." }, 401);

  // 3) Create session
  const sessionId = randomHex(32); // 64 hex chars
  const now = Date.now();
  const sessionDays = 30;
  const expiresAt = new Date(now + sessionDays * 24 * 60 * 60 * 1000).toISOString();

  const ip = request.headers.get("CF-Connecting-IP") || "";
  const ua = request.headers.get("User-Agent") || "";
  const ipHash = ip ? await shortSha256(ip) : null;

  await env.DD_DB
    .prepare(
      `INSERT INTO member_sessions (session_id, member_id, expires_at, ip_hash, user_agent)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(sessionId, member.member_id, expiresAt, ipHash, ua.slice(0, 500))
    .run();

  await env.DD_DB
    .prepare(`UPDATE members SET last_login_at = CURRENT_TIMESTAMP WHERE member_id = ?`)
    .bind(member.member_id)
    .run();

  // 4) Set cookie
  const cookie = makeSessionCookie(sessionId, sessionDays);

  return new Response(
    JSON.stringify({
      ok: true,
      member: {
        member_id: member.member_id,
        email: member.email,
        display_name: member.display_name || "",
        role: member.role || "member",
      },
    }, null, 2),
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "set-cookie": cookie,
        "cache-control": "no-store",
      },
    }
  );
}

/* ---------------- helpers ---------------- */

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function makeSessionCookie(sessionId, sessionDays) {
  const maxAge = sessionDays * 24 * 60 * 60;
  // Secure is correct on HTTPS (Pages is HTTPS)
  return [
    `dd_session=${sessionId}`,
    `Max-Age=${maxAge}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ].join("; ");
}

function randomHex(bytes) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return [...buf].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function shortSha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(hash).slice(0, 16); // store only first 16 bytes
  return b64(bytes);
}

function b64(u8) {
  let s = "";
  for (const c of u8) s += String.fromCharCode(c);
  return btoa(s);
}

function b64ToU8(b64str) {
  const bin = atob(b64str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// password_hash format: "pbkdf2$100000$<salt_b64>$<hash_b64>"
async function verifyPassword(password, stored) {
  try {
    const parts = String(stored).split("$");
    if (parts.length !== 4) return false;
    const [algo, iterStr, saltB64, hashB64] = parts;
    if (algo !== "pbkdf2") return false;

    const iterations = parseInt(iterStr, 10);
    if (!Number.isFinite(iterations) || iterations < 10000) return false;

    const salt = b64ToU8(saltB64);
    const expected = b64ToU8(hashB64);

    const actual = await pbkdf2(password, salt, iterations, expected.length);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

async function pbkdf2(password, salt, iterations, outLen) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    outLen * 8
  );

  return new Uint8Array(bits);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= (a[i] ^ b[i]);
  return diff === 0;
}
