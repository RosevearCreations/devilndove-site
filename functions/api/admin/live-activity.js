// File: /functions/api/admin/live-activity.js
// Brief description: Returns a short live activity feed for the admin dashboard using recent visitor, search, cart, order, and webhook records.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
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
    SELECT s.user_id, u.user_id AS resolved_user_id, u.email, u.display_name, u.role, u.is_active
    FROM sessions s
    INNER JOIN users u ON u.user_id = s.user_id
    WHERE (s.session_token = ? OR s.token = ?)
      AND s.expires_at > datetime('now')
    LIMIT 1
  `).bind(token, token).first();
  if (!session || Number(session.is_active || 0) !== 1 || String(session.role || '').toLowerCase() !== 'admin') return null;
  return { user_id: Number(session.resolved_user_id || session.user_id || 0), email: session.email || '', display_name: session.display_name || '' };
}

function normalizeResults(result) { return Array.isArray(result?.results) ? result.results : []; }

export async function onRequestGet(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  const feed = [];

  const [searches, carts, orders, webhooks, sessions] = await Promise.all([
    env.DB.prepare(`SELECT created_at, search_term, result_count, path FROM site_search_events ORDER BY created_at DESC LIMIT 8`).all().catch(() => ({ results: [] })),
    env.DB.prepare(`SELECT created_at, event_type, path, cart_count, cart_value_cents FROM cart_activity ORDER BY created_at DESC LIMIT 8`).all().catch(() => ({ results: [] })),
    env.DB.prepare(`SELECT created_at, order_number, email, order_status, payment_status, grand_total_cents FROM orders ORDER BY created_at DESC LIMIT 8`).all().catch(() => ({ results: [] })),
    env.DB.prepare(`SELECT received_at, provider_name, event_type, process_status, attempt_count FROM webhook_events ORDER BY COALESCE(last_attempt_at, received_at) DESC LIMIT 8`).all().catch(() => ({ results: [] })),
    env.DB.prepare(`SELECT last_seen_at, entry_path, last_path, country, city, page_view_count, is_checkout_started, is_abandoned_cart FROM site_visitor_sessions ORDER BY last_seen_at DESC LIMIT 8`).all().catch(() => ({ results: [] }))
  ]);

  for (const row of normalizeResults(searches)) {
    feed.push({
      type: 'search',
      at: row.created_at || null,
      title: `Search: ${row.search_term || 'Unknown'}`,
      detail: `${Number(row.result_count || 0)} result(s) from ${row.path || '/'}`,
      severity: 'info'
    });
  }

  for (const row of normalizeResults(carts)) {
    feed.push({
      type: 'cart',
      at: row.created_at || null,
      title: `Cart event: ${row.event_type || 'activity'}`,
      detail: `${Number(row.cart_count || 0)} item(s) • ${(Number(row.cart_value_cents || 0) / 100).toFixed(2)} from ${row.path || '/'}`,
      severity: row.event_type === 'cart_abandoned' ? 'warning' : 'info'
    });
  }

  for (const row of normalizeResults(orders)) {
    feed.push({
      type: 'order',
      at: row.created_at || null,
      title: `Order ${row.order_number || 'draft'}`,
      detail: `${row.email || 'customer'} • ${row.order_status || 'pending'} / ${row.payment_status || 'pending'} • ${(Number(row.grand_total_cents || 0) / 100).toFixed(2)}`,
      severity: ['failed','cancelled','refunded'].includes(String(row.payment_status || '').toLowerCase()) ? 'warning' : 'success'
    });
  }

  for (const row of normalizeResults(webhooks)) {
    feed.push({
      type: 'webhook',
      at: row.received_at || null,
      title: `Webhook ${row.provider_name || 'provider'}: ${row.event_type || 'event'}`,
      detail: `${row.process_status || 'received'} • attempt ${Number(row.attempt_count || 0)}`,
      severity: String(row.process_status || '').toLowerCase() === 'failed' ? 'danger' : 'info'
    });
  }

  for (const row of normalizeResults(sessions)) {
    const flags = [];
    if (Number(row.is_checkout_started || 0) === 1) flags.push('checkout');
    if (Number(row.is_abandoned_cart || 0) === 1) flags.push('abandoned');
    feed.push({
      type: 'visitor',
      at: row.last_seen_at || null,
      title: `Visitor session`,
      detail: `${row.country || 'Unknown'}${row.city ? ' / ' + row.city : ''} • ${row.entry_path || '/'} → ${row.last_path || '/'} • ${Number(row.page_view_count || 0)} view(s)${flags.length ? ' • ' + flags.join(', ') : ''}`,
      severity: Number(row.is_abandoned_cart || 0) === 1 ? 'warning' : 'info'
    });
  }

  feed.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));

  return json({
    ok: true,
    requested_by: adminUser,
    generated_at: new Date().toISOString(),
    items: feed.slice(0, 18)
  });
}
