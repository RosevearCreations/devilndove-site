// Build 279 — scoped dashboard summaries. Avoid dozens of sequential D1 reads for data the current view never renders.
import { getAdminUserFromRequest, getDb, jsonResponse } from "../_lib/adminAudit.js";

function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function normalizeView(value) { const v=String(value||'').trim().toLowerCase(); return v==='mobile_health' ? 'mobile_health' : 'compact'; }

async function compactSummary(db) {
  return await db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM users) AS users_count,
      (SELECT COUNT(*) FROM products) AS products_count,
      (SELECT COUNT(*) FROM orders) AS orders_count,
      (SELECT COUNT(*) FROM payments) AS payments_count,
      (SELECT COUNT(*) FROM site_item_inventory WHERE COALESCE(is_active,1)=1 AND (COALESCE(on_hand_quantity,0)+COALESCE(incoming_quantity,0))<=COALESCE(reorder_level,0)) AS low_stock_count,
      (SELECT COUNT(*) FROM webhook_events WHERE process_status='failed') AS failed_webhooks_count,
      (SELECT COUNT(*) FROM payment_disputes WHERE dispute_status IN ('open','under_review')) AS open_disputes_count,
      (SELECT COUNT(*) FROM site_search_events WHERE created_at>=datetime('now','-1 day')) AS recent_searches_count,
      (SELECT COUNT(*) FROM site_visitor_sessions WHERE last_seen_at>=datetime('now','-30 minutes')) AS active_visitor_sessions_count,
      (SELECT COUNT(*) FROM products WHERE COALESCE(featured_image_url,'')='' AND COALESCE(status,'draft')!='archived') AS products_missing_featured_image_count,
      (SELECT COUNT(*) FROM (
        SELECT p.product_id FROM products p
        LEFT JOIN product_images pi ON pi.product_id=p.product_id
        LEFT JOIN product_image_annotations pia ON pia.product_image_id=pi.product_image_id
        WHERE COALESCE(p.status,'draft')!='archived'
        GROUP BY p.product_id
        HAVING COUNT(DISTINCT pi.product_image_id)>0 AND SUM(CASE WHEN COALESCE(pia.image_role,'')='' THEN 1 ELSE 0 END)>0
      )) AS products_missing_image_roles_count,
      (SELECT COUNT(*) FROM (
        SELECT p.product_id FROM products p
        LEFT JOIN product_images pi ON pi.product_id=p.product_id
        LEFT JOIN product_image_annotations pia ON pia.product_image_id=pi.product_image_id
        WHERE COALESCE(p.status,'draft')!='archived'
        GROUP BY p.product_id
        HAVING COUNT(DISTINCT pi.product_image_id)>0 AND SUM(CASE WHEN LOWER(COALESCE(pia.image_role,''))='hero_front' THEN 1 ELSE 0 END)=0
      )) AS products_missing_hero_role_count,
      (SELECT COUNT(*) FROM (
        SELECT p.product_id FROM products p
        LEFT JOIN product_images pi ON pi.product_id=p.product_id
        WHERE COALESCE(p.status,'draft')!='archived'
        GROUP BY p.product_id
        HAVING COUNT(DISTINCT pi.product_image_id)>0 AND SUM(CASE WHEN LENGTH(TRIM(COALESCE(pi.alt_text,'')))>=5 THEN 1 ELSE 0 END)<MIN(3,COUNT(DISTINCT pi.product_image_id))
      )) AS products_missing_alt_text_count,
      (SELECT COUNT(DISTINCT p.product_id) FROM products p
        INNER JOIN product_images pi ON pi.product_id=p.product_id
        INNER JOIN product_image_annotations pia ON pia.product_image_id=pi.product_image_id
        WHERE LOWER(COALESCE(pia.public_use_status,'')) IN ('consent_needed','blocked') AND COALESCE(p.status,'draft')!='archived'
      ) AS products_blocked_public_images_count,
      (SELECT COUNT(*) FROM products p LEFT JOIN product_seo ps ON ps.product_id=p.product_id
        WHERE COALESCE(p.status,'draft')!='archived' AND (LENGTH(TRIM(COALESCE(ps.meta_title,'')))<10 OR LENGTH(TRIM(COALESCE(ps.meta_description,'')))<50)
      ) AS products_missing_seo_count
  `).first();
}

async function mobileHealthSummary(db) {
  return await db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM runtime_incidents WHERE created_at>=datetime('now','-7 days')) AS recent_runtime_incidents_count,
      (SELECT COUNT(*) FROM runtime_incidents WHERE incident_scope='admin_orders' AND created_at>=datetime('now','-7 days')) AS admin_order_runtime_incidents_count,
      (SELECT COUNT(*) FROM runtime_incidents WHERE incident_scope IN ('admin_order_status_update','admin_record_payment','admin_payment_actions','admin_product_review_actions','admin_product_update') AND created_at>=datetime('now','-7 days')) AS admin_write_runtime_incidents_count,
      (SELECT COUNT(*) FROM admin_pending_actions WHERE queue_status IN ('queued','retrying','failed')) AS pending_shared_admin_actions_count,
      (SELECT COUNT(*) FROM admin_pending_actions WHERE queue_status='failed') AS failed_shared_admin_actions_count,
      (SELECT COUNT(*) FROM admin_pending_actions WHERE order_id IS NOT NULL AND queue_status IN ('queued','retrying','failed')) AS pending_shared_admin_order_actions_count,
      (SELECT COUNT(*) FROM admin_pending_actions WHERE LOWER(COALESCE(action_scope,''))='product_review' AND queue_status IN ('queued','retrying','failed')) AS pending_shared_product_review_actions_count,
      (SELECT COUNT(*) FROM admin_pending_actions WHERE LOWER(COALESCE(action_scope,''))='product_update' AND queue_status IN ('queued','retrying','failed')) AS pending_shared_product_update_actions_count,
      (SELECT COUNT(*) FROM orders WHERE LOWER(COALESCE(payment_status,'')) IN ('pending','authorized','partially_refunded') OR LOWER(COALESCE(order_status,'')) IN ('pending','paid')) AS outstanding_orders_count,
      (SELECT COUNT(*) FROM payment_refunds WHERE provider_sync_status='failed') AS payment_sync_failures_count,
      (SELECT COUNT(*) FROM accounting_journal_entries WHERE COALESCE(imbalance_cents,0)!=0) AS journal_imbalance_count,
      (SELECT COUNT(*) FROM accounting_overhead_product_allocations) AS overhead_product_override_count
  `).first();
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  const view = normalizeView(new URL(request.url).searchParams.get('view'));
  try {
    const summary = view === 'mobile_health' ? await mobileHealthSummary(db) : await compactSummary(db);
    return json({
      ok: true,
      view,
      requested_by: { user_id: adminUser.user_id, email: adminUser.email, display_name: adminUser.display_name },
      summary: summary || {}
    });
  } catch (error) {
    return json({ ok: false, error: 'Dashboard summary is temporarily unavailable.', view }, 503);
  }
}
