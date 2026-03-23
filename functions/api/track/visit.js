// File: /functions/api/track/visit.js
// Brief description: Logs visitor sessions and page views for analytics, country insights,
// site journeys, and admin security/statistics dashboards.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function normalizeText(value) {
  return String(value || "").trim();
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(input) {
  const encoded = new TextEncoder().encode(String(input || ''));
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return toHex(digest);
}

function getBearerToken(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? String(match[1] || '').trim() : '';
}

async function getSessionUser(env, token) {
  if (!token) return null;
  return env.DB.prepare(`
    SELECT s.session_id, s.user_id, u.email, u.display_name, u.role, u.is_active
    FROM sessions s
    INNER JOIN users u ON u.user_id = s.user_id
    WHERE (s.session_token = ? OR s.token = ?)
      AND s.expires_at > datetime('now')
    LIMIT 1
  `).bind(token, token).first();
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body = {};
  try { body = await request.json(); } catch { body = {}; }

  const visitor_token = normalizeText(body.visitor_token) || crypto.randomUUID();
  const path = normalizeText(body.path || new URL(request.url).pathname) || '/';
  const query_string = normalizeText(body.query_string);
  const referrer = normalizeText(body.referrer || request.headers.get('Referer'));
  const page_title = normalizeText(body.page_title);
  const event_type = normalizeText(body.event_type || 'page_view') || 'page_view';
  const duration_ms = Number.isFinite(Number(body.duration_ms)) ? Number(body.duration_ms) : null;
  const meta_json = body.meta ? JSON.stringify(body.meta).slice(0, 5000) : null;
  const user_agent = normalizeText(request.headers.get('User-Agent'));
  const ip = normalizeText(request.headers.get('CF-Connecting-IP'));
  const ip_hash = ip ? await sha256Hex(ip) : null;
  const country = normalizeText(request.headers.get('CF-IPCountry'));
  const region = normalizeText(request.headers.get('CF-Region'));
  const city = normalizeText(request.headers.get('CF-IPCity'));
  const referrer_host = referrer ? (() => { try { return new URL(referrer).hostname; } catch { return ''; } })() : '';
  const is_bot = /bot|crawl|spider|preview|wget|curl/i.test(user_agent) ? 1 : 0;

  const token = getBearerToken(request);
  const sessionUser = await getSessionUser(env, token);
  const user_id = Number(sessionUser?.user_id || 0) || null;

  let visitor = await env.DB.prepare(`SELECT site_visitor_id, visit_count FROM site_visitors WHERE visitor_token = ? LIMIT 1`)
    .bind(visitor_token)
    .first();

  if (!visitor) {
    const insert = await env.DB.prepare(`
      INSERT INTO site_visitors (
        visitor_token, ip_hash, country, region, city, user_agent, referrer_host, first_seen_at, last_seen_at, visit_count, is_bot
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, ?)
    `).bind(visitor_token, ip_hash, country || null, region || null, city || null, user_agent || null, referrer_host || null, is_bot).run();
    visitor = { site_visitor_id: Number(insert?.meta?.last_row_id || 0), visit_count: 1 };
  } else {
    await env.DB.prepare(`
      UPDATE site_visitors
      SET last_seen_at = CURRENT_TIMESTAMP,
          visit_count = COALESCE(visit_count, 0) + 1,
          ip_hash = COALESCE(?, ip_hash),
          country = COALESCE(NULLIF(?, ''), country),
          region = COALESCE(NULLIF(?, ''), region),
          city = COALESCE(NULLIF(?, ''), city),
          user_agent = COALESCE(NULLIF(?, ''), user_agent),
          referrer_host = COALESCE(NULLIF(?, ''), referrer_host)
      WHERE site_visitor_id = ?
    `).bind(ip_hash, country, region, city, user_agent, referrer_host, Number(visitor.site_visitor_id || 0)).run();
  }

  await env.DB.prepare(`
    INSERT INTO site_page_views (
      site_visitor_id, user_id, path, query_string, referrer, page_title, event_type, duration_ms, meta_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(Number(visitor.site_visitor_id || 0), user_id, path, query_string || null, referrer || null, page_title || null, event_type, duration_ms, meta_json).run();

  return json({ ok: true, visitor_token, country, event_type, path });
}
