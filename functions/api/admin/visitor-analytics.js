// File: /functions/api/admin/visitor-analytics.js
// Brief description: Returns visitor, page, abandonment, and path analytics for the admin dashboard.

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

async function getAdminUserFromRequest(request, env) {
  const token = getBearerToken(request);
  if (!token) return null;

  const session = await env.DB.prepare(`
    SELECT
      s.session_id,
      s.user_id,
      u.user_id AS resolved_user_id,
      u.email,
      u.display_name,
      u.role,
      u.is_active
    FROM sessions s
    INNER JOIN users u ON u.user_id = s.user_id
    WHERE (s.session_token = ? OR s.token = ?)
      AND s.expires_at > datetime('now')
    LIMIT 1
  `).bind(token, token).first();

  if (!session) return null;
  if (Number(session.is_active || 0) !== 1) return null;
  if (String(session.role || '').toLowerCase() !== 'admin') return null;

  return {
    user_id: Number(session.resolved_user_id || session.user_id || 0),
    email: session.email || '',
    display_name: session.display_name || '',
    role: 'admin'
  };
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}


export async function onRequestGet(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  const sinceDays = Math.max(1, Math.min(90, Number(new URL(request.url).searchParams.get('days') || 30)));

  const summary = await env.DB.prepare(`
    SELECT
      (SELECT COUNT(*) FROM site_visitors WHERE first_seen_at >= datetime('now', '-' || ? || ' days')) AS unique_visitors,
      (SELECT COUNT(*) FROM site_page_views WHERE created_at >= datetime('now', '-' || ? || ' days')) AS page_views,
      (SELECT COUNT(*) FROM cart_activity WHERE event_type = 'cart_abandoned' AND created_at >= datetime('now', '-' || ? || ' days')) AS abandoned_carts,
      (SELECT COUNT(*) FROM cart_activity WHERE event_type = 'checkout_started' AND created_at >= datetime('now', '-' || ? || ' days')) AS checkout_starts
  `).bind(sinceDays, sinceDays, sinceDays, sinceDays).first();

  const topPaths = normalizeResults(await env.DB.prepare(`
    SELECT path, COUNT(*) AS view_count
    FROM site_page_views
    WHERE created_at >= datetime('now', '-' || ? || ' days')
    GROUP BY path
    ORDER BY view_count DESC, path ASC
    LIMIT 15
  `).bind(sinceDays).all());

  const countries = normalizeResults(await env.DB.prepare(`
    SELECT COALESCE(country, 'Unknown') AS country, COUNT(*) AS visitor_count
    FROM site_visitors
    WHERE first_seen_at >= datetime('now', '-' || ? || ' days')
    GROUP BY COALESCE(country, 'Unknown')
    ORDER BY visitor_count DESC, country ASC
    LIMIT 15
  `).bind(sinceDays).all());

  const abandoned = normalizeResults(await env.DB.prepare(`
    SELECT visitor_token, path, cart_count, cart_value_cents, created_at, meta_json
    FROM cart_activity
    WHERE event_type = 'cart_abandoned'
      AND created_at >= datetime('now', '-' || ? || ' days')
    ORDER BY created_at DESC
    LIMIT 25
  `).bind(sinceDays).all());

  const visitorTable = normalizeResults(await env.DB.prepare(`
    SELECT visitor_token, country, region, city, referrer_host, first_seen_at, last_seen_at, visit_count, is_bot
    FROM site_visitors
    ORDER BY last_seen_at DESC
    LIMIT 50
  `).all());

  return json({
    ok: true,
    requested_by: adminUser,
    range_days: sinceDays,
    summary: {
      unique_visitors: Number(summary?.unique_visitors || 0),
      page_views: Number(summary?.page_views || 0),
      abandoned_carts: Number(summary?.abandoned_carts || 0),
      checkout_starts: Number(summary?.checkout_starts || 0)
    },
    top_paths: topPaths.map((row) => ({ path: row.path || '/', view_count: Number(row.view_count || 0) })),
    countries: countries.map((row) => ({ country: row.country || 'Unknown', visitor_count: Number(row.visitor_count || 0) })),
    abandoned_carts: abandoned.map((row) => ({
      visitor_token: row.visitor_token || '',
      path: row.path || '',
      cart_count: Number(row.cart_count || 0),
      cart_value_cents: Number(row.cart_value_cents || 0),
      created_at: row.created_at || null,
      meta_json: row.meta_json || null
    })),
    recent_visitors: visitorTable.map((row) => ({
      visitor_token: row.visitor_token || '',
      country: row.country || 'Unknown',
      region: row.region || '',
      city: row.city || '',
      referrer_host: row.referrer_host || '',
      first_seen_at: row.first_seen_at || null,
      last_seen_at: row.last_seen_at || null,
      visit_count: Number(row.visit_count || 0),
      is_bot: Number(row.is_bot || 0)
    }))
  });
}
