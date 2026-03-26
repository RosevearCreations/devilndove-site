function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
function getDb(env) { return env.DB || env.DD_DB; }
function getBearerToken(request) { const authHeader = request.headers.get("Authorization") || ""; const match = authHeader.match(/^Bearer\s+(.+)$/i); return match ? String(match[1] || "").trim() : ""; }
async function getAdminUserFromRequest(request, env) {
  const db = getDb(env); const token = getBearerToken(request); if (!db || !token) return null;
  try {
    const session = await db.prepare(`SELECT s.session_id,s.user_id,s.session_token,s.token,s.expires_at,u.user_id AS resolved_user_id,u.email,u.display_name,u.role,u.is_active FROM sessions s INNER JOIN users u ON u.user_id = s.user_id WHERE (s.session_token = ? OR s.token = ?) AND s.expires_at > datetime('now') LIMIT 1`).bind(token, token).first();
    if (!session || Number(session.is_active || 0) !== 1 || String(session.role || '').toLowerCase() !== 'admin') return null;
    return { session_id: Number(session.session_id || 0), user_id: Number(session.resolved_user_id || session.user_id || 0), email: session.email || '', display_name: session.display_name || '', role: 'admin' };
  } catch { return null; }
}
async function safeCount(db, sql) { try { const row = await db.prepare(sql).first(); return Number(row?.count || 0); } catch { return 0; } }
export async function onRequestGet(context) {
  const { request, env } = context; const db = getDb(env); const adminUser = await getAdminUserFromRequest(request, env); if (!adminUser) return json({ ok:false, error:'Unauthorized.' },401);
  const summary = {
    users_count: await safeCount(db, `SELECT COUNT(*) AS count FROM users`),
    products_count: await safeCount(db, `SELECT COUNT(*) AS count FROM products`),
    orders_count: await safeCount(db, `SELECT COUNT(*) AS count FROM orders`),
    payments_count: await safeCount(db, `SELECT COUNT(*) AS count FROM payments`),
    low_stock_count: await safeCount(db, `SELECT COUNT(*) AS count FROM site_item_inventory WHERE COALESCE(is_active,1)=1 AND (COALESCE(on_hand_quantity,0) + COALESCE(incoming_quantity,0)) <= COALESCE(reorder_level,0)`),
    failed_webhooks_count: await safeCount(db, `SELECT COUNT(*) AS count FROM webhook_events WHERE process_status = 'failed'`),
    open_disputes_count: await safeCount(db, `SELECT COUNT(*) AS count FROM payment_disputes WHERE dispute_status IN ('open','under_review')`),
    open_recovery_requests_count: await safeCount(db, `SELECT COUNT(*) AS count FROM auth_recovery_requests WHERE status IN ('open','reviewed')`),
    recent_searches_count: await safeCount(db, `SELECT COUNT(*) AS count FROM site_search_events WHERE created_at >= datetime('now', '-1 day')`),
    active_visitor_sessions_count: await safeCount(db, `SELECT COUNT(*) AS count FROM site_visitor_sessions WHERE last_seen_at >= datetime('now', '-30 minutes')`)
  };
  return json({ ok:true, requested_by:{ user_id: adminUser.user_id, email: adminUser.email, display_name: adminUser.display_name }, summary });
}
