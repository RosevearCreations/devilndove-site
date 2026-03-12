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
    SELECT users.user_id, users.role
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
    return json({ ok:false, error:"Unauthorized." },401);
  }

  const token = auth.slice(7).trim();
  const sessionUser = await getSessionUser(env, token);

  if (!sessionUser) {
    return json({ ok:false, error:"Invalid session." },401);
  }

  if (sessionUser.role !== "admin") {
    return json({ ok:false, error:"Forbidden." },403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok:false, error:"Invalid JSON." },400);
  }

  const user_id = Number(body.user_id);
  const password = String(body.password || "");

  if (!user_id || user_id <= 0) {
    return json({ ok:false, error:"Valid user_id required." },400);
  }

  if (!password || password.length < 6) {
    return json({ ok:false, error:"Password must be at least 6 characters." },400);
  }

  const password_hash = await sha256(password);

  const existing = await env.DB.prepare(`
    SELECT user_id FROM users WHERE user_id = ?
  `)
  .bind(user_id)
  .first();

  if (!existing) {
    return json({ ok:false, error:"User not found." },404);
  }

  await env.DB.prepare(`
    UPDATE users
    SET password_hash = ?
    WHERE user_id = ?
  `)
  .bind(password_hash, user_id)
  .run();

  return json({
    ok:true,
    message:"Password reset successfully."
  });
}
