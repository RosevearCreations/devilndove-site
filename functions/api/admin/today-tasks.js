// File: /functions/api/admin/today-tasks.js
// Brief description: Compact admin task queue combining products, requests, orders, inventory, accounting, and runtime incidents.

import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
function json(data, status = 200) { return jsonResponse(data, status); }
async function scalar(db, sql, binds = []) { try { const row = await db.prepare(sql).bind(...binds).first(); return Number(Object.values(row || {})[0] || 0); } catch { return 0; } }
export async function onRequestGet(context) {
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const tasks = [
    { key: 'readiness', label: 'Product readiness blockers', count: await scalar(db, `SELECT COUNT(*) FROM products WHERE COALESCE(status,'draft')!='archived' AND (COALESCE(featured_image_url,'')='' OR COALESCE(price_cents,0)<=0 OR COALESCE(short_description,'')='')`), href: '/admin/readiness/' },
    { key: 'custom_requests', label: 'Custom requests needing review', count: await scalar(db, `SELECT COUNT(*) FROM custom_requests WHERE COALESCE(status,'new') IN ('new','reviewing','quote_needed')`), href: '/admin/operations/#customRequestsAdminMount' },
    { key: 'orders', label: 'Orders pending payment/fulfillment', count: await scalar(db, `SELECT COUNT(*) FROM orders WHERE COALESCE(order_status,'pending') IN ('pending','paid') OR COALESCE(payment_status,'pending')='pending'`), href: '/admin/orders/' },
    { key: 'inventory', label: 'Inventory needing reorder/review', count: await scalar(db, `SELECT COUNT(*) FROM site_items WHERE COALESCE(reorder_status,'') IN ('needed','requested') OR COALESCE(on_hand_quantity,0)<=COALESCE(reorder_threshold,0)`), href: '/admin/inventory-operations/' },
    { key: 'accounting', label: 'Accounting evidence gaps', count: await scalar(db, `SELECT COUNT(*) FROM hst_gst_review_records WHERE COALESCE(remittance_evidence_url,'')='' AND COALESCE(review_status,'draft')!='draft'`), href: '/admin/accounting/#accountingEvidenceCheckMount' },
    { key: 'failed_api', label: 'Recent failed API/runtime incidents', count: await scalar(db, `SELECT COUNT(*) FROM runtime_incidents WHERE COALESCE(status,'open') NOT IN ('resolved','ignored') AND datetime(created_at) >= datetime('now','-7 days')`), href: '/admin/operations/#runtimeIncidentsAdminMount' }
  ];
  return json({ ok: true, tasks, summary: { total_count: tasks.reduce((sum, row) => sum + Number(row.count || 0), 0), generated_at: new Date().toISOString() } });
}
