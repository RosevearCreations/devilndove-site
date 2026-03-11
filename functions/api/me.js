export async function onRequest(context) {
  const { env, request } = context;

  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  const token = auth.replace("Bearer ", "");

  const result = await env.DB.prepare(`
    SELECT user_id, email, display_name, role, created_at
    FROM sessions
    JOIN users ON sessions.user_id = users.user_id
    WHERE sessions.session_token = ?
    AND sessions.expires_at > datetime('now')
  `)
  .bind(token)
  .first();

  if (!result) {
    return new Response(JSON.stringify({ error: "Invalid session" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({
    ok: true,
    user: result
  }), {
    headers: { "Content-Type": "application/json" }
  });
}
