import { resolveSessionUser } from "../_lib/accountAuthCompat.js";
// File: /functions/api/admin/access-tiers.js

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

async function requireAdmin(request, env) {
  const db = env.DB || env.DD_DB;
  if (!db) return { error: json({ ok: false, error: "User access is temporarily unavailable." }, 503) };
  const sessionUser = await resolveSessionUser(request, db, { requireAdmin: true });
  if (!sessionUser) return { error: json({ ok: false, error: "Unauthorized." }, 401) };
  return { sessionUser };
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const authCheck = await requireAdmin(request, env);
  if (authCheck.error) return authCheck.error;

  const result = await env.DB.prepare(`
    SELECT
      access_tier_id,
      code,
      name,
      description,
      is_active,
      created_at
    FROM access_tiers
    WHERE is_active = 1
    ORDER BY name ASC, access_tier_id ASC
  `).all();

  return json({
    ok: true,
    access_tiers: result.results || []
  });
}
