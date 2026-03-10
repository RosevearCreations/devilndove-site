// /functions/api/auth/bootstrap-admin.js
// POST { "email": "...", "password": "...", "display_name": "...", "token": "..." }

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.DD_DB) return json({ ok: false, error: "Missing D1 binding DD_DB." }, 500);

  // Must be set in Pages env vars (Production + Preview if you need both)
  const requiredToken = env.DD_BOOTSTRAP_TOKEN;
  if (!requiredToken) {
    return json(
      { ok: false, error: "Missing DD_BOOTSTRAP_TOKEN env var. Set it in Cloudflare Pages." },
      500
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const displayName = (body.display_name || "").trim();
  const token = String(body.token || "");

  if (!token || token !== requiredToken) {
    return json({ ok: false, error: "Invalid bootstrap token." }, 401);
  }

  if (!email || !password) {
    return json({ ok: false, error: "Email and password are required." }, 400);
  }

  if (!isValidEmail(email)) {
    return json({ ok: false, error: "Invalid email format." }, 400);
  }

  if (password.length < 10) {
    return json({ ok: false, error: "Password must be at least 10 characters." }, 400);
  }

  // Safety: only allow if no admin exists yet
  const row = await env.DD_DB
    .prepare(`SELECT COUNT(*) AS c FROM members WHERE role='admin'`)
    .first();

  const adminCount = Number(row?.c || 0);
  if (adminCount > 0) {
    return json({ ok: false, error: "An admin already exists. Bootstrap is disabled." }, 409);
  }

  // Create hash
  const iterations = 100000;
  const salt = randomBytes(16);
  const hash = await pbkdf2(password, salt, iterations, 32); // 32 bytes (SHA-256)
  const passwordHash = `pbkdf2$${iterations}$${u8ToB64(salt)}$${u8ToB64(hash)}`;

  try {
    const res = await env.DD_DB
      .prepare(
        `INSERT INTO members (email, password_hash, display_name, role, is_active)
         VALUES (?, ?, ?, 'admin', 1)`
      )
      .bind(email, passwordHash, displayName || null)
      .run();

    if (!res?.success) {
      return json({ ok: false, error: "Insert failed." }, 500);
    }

    return json({
      ok: true,
      message:
        "Admin created. IMPORTANT: remove or change DD_BOOTSTRAP_TOKEN in Pages env vars now.",
      admin: { email, display_name: displayName || "", role: "admin" },
    });
  } catch (e) {
    // Likely UNIQUE constraint on email
    return json({ ok: false, error: "Could not create admin (email may already exist)." }, 409);
  }
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

function isValidEmail(email) {
  // simple sanity check (good enough for bootstrap)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function randomBytes(len) {
  const u8 = new Uint8Array(len);
  crypto.getRandomValues(u8);
  return u8;
}

function u8ToB64(u8) {
  let s = "";
  for (const c of u8) s += String.fromCharCode(c);
  return btoa(s);
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
