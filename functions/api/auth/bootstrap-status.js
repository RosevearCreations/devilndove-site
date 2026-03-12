function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequestGet(context) {
  const { env } = context;

  const existingAdmin = await env.DB.prepare(`
    SELECT user_id, email, display_name, created_at
    FROM users
    WHERE role = 'admin'
    ORDER BY user_id ASC
    LIMIT 1
  `).first();

  return json({
    ok: true,
    bootstrap_needed: !existingAdmin,
    admin_exists: !!existingAdmin,
    admin: existingAdmin
      ? {
          user_id: existingAdmin.user_id,
          email: existingAdmin.email,
          display_name: existingAdmin.display_name,
          created_at: existingAdmin.created_at
        }
      : null
  });
}
