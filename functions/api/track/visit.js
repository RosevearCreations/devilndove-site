// Build 279 — lightweight public analytics. Migrations own schema; routine visits never run DDL/PRAGMA probes.
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function text(value, max = 0) {
  const clean = String(value ?? '').trim();
  return max > 0 ? clean.slice(0, max) : clean;
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseUtm(queryString, referrer) {
  const out = { utm_source: '', utm_medium: '', utm_campaign: '', utm_content: '', utm_term: '' };
  try {
    const params = new URLSearchParams(String(queryString || '').replace(/^\?/, ''));
    for (const key of Object.keys(out)) out[key] = text(params.get(key), 180);
  } catch {}
  if (!out.utm_source && referrer) {
    try {
      const host = new URL(referrer).hostname.replace(/^www\./, '');
      if (/facebook|instagram|tiktok|pinterest|youtube|x\.com|twitter/i.test(host)) {
        out.utm_source = host.slice(0, 180);
        out.utm_medium = out.utm_medium || 'social_referral';
      }
    } catch {}
  }
  return out;
}

function referrerHost(referrer) {
  if (!referrer) return '';
  try { return new URL(referrer).hostname.slice(0, 240); } catch { return ''; }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.DB) return json({ ok: true, skipped: true, reason: 'analytics_db_unavailable' });

  let body;
  try { body = await request.json(); }
  catch { return json({ ok: true, skipped: true, reason: 'invalid_json' }); }

  const path = text(body?.path || '/', 500) || '/';
  // Admin has dedicated operational telemetry. Do not spend public-analytics CPU on admin navigation.
  if (path === '/admin' || path.startsWith('/admin/')) {
    return json({ ok: true, skipped: true, reason: 'admin_path' });
  }

  const userAgent = text(request.headers.get('User-Agent'), 500);
  if (/bot|crawl|spider|preview|wget|curl|headless/i.test(userAgent)) {
    return json({ ok: true, skipped: true, reason: 'automated_client' });
  }

  const visitorToken = text(body?.visitor_token, 180) || crypto.randomUUID();
  const sessionToken = text(body?.browser_session_token, 180) || crypto.randomUUID();
  const queryString = text(body?.query_string, 1200);
  const referrer = text(body?.referrer || request.headers.get('Referer'), 800);
  const pageTitle = text(body?.page_title, 320);
  const pageH1 = text(body?.page_h1, 320);
  const eventType = text(body?.event_type || 'page_view', 80).toLowerCase() || 'page_view';
  const durationMs = Number.isFinite(Number(body?.duration_ms)) ? Math.max(0, Math.round(number(body.duration_ms))) : null;
  let metaJson = null;
  if (body?.meta && typeof body.meta === 'object') {
    try { metaJson = JSON.stringify(body.meta).slice(0, 2400); } catch {}
  }
  const country = text(request.headers.get('CF-IPCountry'), 12);
  const utm = parseUtm(queryString, referrer);
  const host = referrerHost(referrer);

  try {
    // One upsert replaces existence-check + insert/update and intentionally avoids IP hashing.
    const visitor = await env.DB.prepare(`
      INSERT INTO site_visitors (
        visitor_token, country, user_agent, referrer_host,
        first_seen_at, last_seen_at, visit_count, is_bot
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, 0)
      ON CONFLICT(visitor_token) DO UPDATE SET
        last_seen_at = CURRENT_TIMESTAMP,
        visit_count = COALESCE(site_visitors.visit_count, 0) + 1,
        country = COALESCE(NULLIF(excluded.country, ''), site_visitors.country),
        user_agent = COALESCE(NULLIF(excluded.user_agent, ''), site_visitors.user_agent),
        referrer_host = COALESCE(NULLIF(excluded.referrer_host, ''), site_visitors.referrer_host)
      RETURNING site_visitor_id
    `).bind(visitorToken, country || null, userAgent || null, host || null).first();

    const visitorId = Number(visitor?.site_visitor_id || 0);
    if (!visitorId) return json({ ok: true, skipped: true, reason: 'visitor_upsert_unavailable' });

    const pageIncrement = eventType === 'page_view' ? 1 : 0;
    const checkoutIncrement = path.includes('/checkout') ? 1 : 0;
    const session = await env.DB.prepare(`
      INSERT INTO site_visitor_sessions (
        site_visitor_id, session_token, user_id, entry_path, last_path, country,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        started_at, last_seen_at, page_view_count, event_count,
        is_checkout_started, is_abandoned_cart
      ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, 1, ?, 0)
      ON CONFLICT(site_visitor_id, session_token) DO UPDATE SET
        last_path = excluded.last_path,
        country = COALESCE(NULLIF(excluded.country, ''), site_visitor_sessions.country),
        utm_source = COALESCE(NULLIF(excluded.utm_source, ''), site_visitor_sessions.utm_source),
        utm_medium = COALESCE(NULLIF(excluded.utm_medium, ''), site_visitor_sessions.utm_medium),
        utm_campaign = COALESCE(NULLIF(excluded.utm_campaign, ''), site_visitor_sessions.utm_campaign),
        utm_content = COALESCE(NULLIF(excluded.utm_content, ''), site_visitor_sessions.utm_content),
        utm_term = COALESCE(NULLIF(excluded.utm_term, ''), site_visitor_sessions.utm_term),
        last_seen_at = CURRENT_TIMESTAMP,
        page_view_count = COALESCE(site_visitor_sessions.page_view_count, 0) + excluded.page_view_count,
        event_count = COALESCE(site_visitor_sessions.event_count, 0) + 1,
        is_checkout_started = CASE WHEN excluded.is_checkout_started = 1 THEN 1 ELSE site_visitor_sessions.is_checkout_started END
      RETURNING site_visitor_session_id
    `).bind(
      visitorId, sessionToken, path, path, country || null,
      utm.utm_source || null, utm.utm_medium || null, utm.utm_campaign || null, utm.utm_content || null, utm.utm_term || null,
      pageIncrement, checkoutIncrement
    ).first();

    const visitorSessionId = Number(session?.site_visitor_session_id || 0) || null;

    await env.DB.prepare(`
      INSERT INTO site_page_views (
        site_visitor_id, site_visitor_session_id, user_id, path, query_string,
        referrer, page_title, page_h1, event_type, duration_ms, meta_json,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term, created_at
      ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      visitorId, visitorSessionId, path,
      queryString || null, referrer || null, pageTitle || null, pageH1 || null,
      eventType, durationMs, metaJson,
      utm.utm_source || null, utm.utm_medium || null, utm.utm_campaign || null, utm.utm_content || null, utm.utm_term || null
    ).run();

    // Legacy callers may still use DDAnalytics.trackSearch(). Search-page code normally writes directly to /api/site-search-event.
    if (eventType === 'search' && body?.meta && typeof body.meta === 'object') {
      await env.DB.prepare(`
        INSERT INTO site_search_events (
          site_visitor_id, site_visitor_session_id, user_id, search_term, result_count, path, created_at
        ) VALUES (?, ?, NULL, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        visitorId, visitorSessionId,
        text(body.meta.search_term, 200), Math.max(0, Math.round(number(body.meta.result_count))), path
      ).run().catch(() => null);
    }

    return json({ ok: true, visitor_token: visitorToken, browser_session_token: sessionToken, event_type: eventType, path });
  } catch (error) {
    // Analytics is explicitly fail-open: public/admin business actions must never depend on it.
    return json({ ok: true, skipped: true, reason: 'analytics_write_unavailable' });
  }
}
