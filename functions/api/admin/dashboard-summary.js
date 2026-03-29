import { getAdminUserFromRequest, getDb, jsonResponse } from "../_lib/adminAudit.js";

function json(data, status = 200) { return jsonResponse(data, status); }
async function safeCount(db, sql) { try { const row = await db.prepare(sql).first(); return Number(row?.count || 0); } catch { return 0; } }
async function safeFirst(db, sql) { try { return await db.prepare(sql).first(); } catch { return null; } }

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  const funnel = await safeFirst(db, `
    SELECT
      (SELECT COUNT(*) FROM site_visitor_sessions WHERE started_at >= datetime('now', '-30 days')) AS visitor_sessions,
      (SELECT COUNT(*) FROM cart_activity WHERE event_type = 'checkout_started' AND created_at >= datetime('now', '-30 days')) AS checkout_starts,
      (SELECT COUNT(*) FROM orders WHERE created_at >= datetime('now', '-30 days')) AS orders_created,
      (SELECT COUNT(*) FROM orders WHERE LOWER(COALESCE(payment_status,'')) IN ('paid','completed','captured','partially_refunded','refunded') AND created_at >= datetime('now', '-30 days')) AS paid_orders
  `) || {};

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
    active_visitor_sessions_count: await safeCount(db, `SELECT COUNT(*) AS count FROM site_visitor_sessions WHERE last_seen_at >= datetime('now', '-30 minutes')`),
    queued_notifications_count: await safeCount(db, `SELECT COUNT(*) AS count FROM notification_outbox WHERE status IN ('queued','retry')`),
    audited_admin_actions_count: await safeCount(db, `SELECT COUNT(*) AS count FROM admin_action_audit WHERE created_at >= datetime('now', '-7 days')`)
  };

  return json({
    ok: true,
    requested_by: { user_id: adminUser.user_id, email: adminUser.email, display_name: adminUser.display_name },
    summary,
    funnel: {
      visitor_sessions: Number(funnel?.visitor_sessions || 0),
      checkout_starts: Number(funnel?.checkout_starts || 0),
      orders_created: Number(funnel?.orders_created || 0),
      paid_orders: Number(funnel?.paid_orders || 0),
      checkout_to_order_rate: Number(funnel?.checkout_starts || 0) > 0 ? Number((Number(funnel?.orders_created || 0) / Number(funnel?.checkout_starts || 0)).toFixed(4)) : 0,
      order_to_paid_rate: Number(funnel?.orders_created || 0) > 0 ? Number((Number(funnel?.paid_orders || 0) / Number(funnel?.orders_created || 0)).toFixed(4)) : 0
    }
  });
}
