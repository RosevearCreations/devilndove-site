// File: /functions/api/admin/today-tasks.js
// Brief description: Compact admin task queue combining products, requests, orders, inventory, accounting, and runtime incidents, with drilldown details and snooze suppression.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control':'no-store' }); }
function rows(result){return Array.isArray(result?.results)?result.results:[];}
async function scalar(db, sql, binds = []) { try { const row = await db.prepare(sql).bind(...binds).first(); return Number(Object.values(row || {})[0] || 0); } catch { return 0; } }
async function ensure(db){
  await db.prepare(`CREATE TABLE IF NOT EXISTS today_task_actions (today_task_action_id INTEGER PRIMARY KEY AUTOINCREMENT, task_key TEXT NOT NULL, task_label TEXT, action_status TEXT NOT NULL DEFAULT 'completed', notes TEXT, snooze_until TEXT, created_by_user_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run().catch(()=>null);
  await db.prepare(`ALTER TABLE today_task_actions ADD COLUMN snooze_until TEXT`).run().catch(()=>null);
}
async function isSuppressed(db,key){
  const row=await db.prepare(`SELECT action_status,snooze_until FROM today_task_actions WHERE task_key=? ORDER BY datetime(created_at) DESC LIMIT 1`).bind(key).first().catch(()=>null);
  if(!row) return false;
  if(row.action_status==='ignored' || row.action_status==='completed') return true;
  if(row.action_status==='snoozed' && row.snooze_until){ return new Date(row.snooze_until).getTime() > Date.now(); }
  return false;
}
async function failedApiDetails(db){
  return rows(await db.prepare(`SELECT incident_id, incident_code, incident_scope, severity, message, request_path, created_at FROM runtime_incidents WHERE COALESCE(status,'open') NOT IN ('resolved','ignored') AND datetime(created_at) >= datetime('now','-7 days') ORDER BY datetime(created_at) DESC LIMIT 8`).all().catch(()=>({results:[]})));
}
export async function onRequestGet(context) {
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is missing.' }, 500);
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  await ensure(db);
  const rawTasks = [
    { key: 'readiness', label: 'Product readiness blockers', count: await scalar(db, `SELECT COUNT(*) FROM products WHERE COALESCE(status,'draft')!='archived' AND (COALESCE(featured_image_url,'')='' OR COALESCE(price_cents,0)<=0 OR COALESCE(short_description,'')='')`), href: '/admin/readiness/' },
    { key: 'custom_requests', label: 'Custom requests needing review', count: await scalar(db, `SELECT COUNT(*) FROM custom_requests WHERE COALESCE(status,'new') IN ('new','reviewing','quote_needed')`), href: '/admin/operations/#customRequestsAdminMount' },
    { key: 'orders', label: 'Orders pending payment/fulfillment', count: await scalar(db, `SELECT COUNT(*) FROM orders WHERE COALESCE(order_status,'pending') IN ('pending','paid') OR COALESCE(payment_status,'pending')='pending'`), href: '/admin/orders/' },
    { key: 'inventory', label: 'Inventory needing reorder/review', count: await scalar(db, `SELECT COUNT(*) FROM site_items WHERE COALESCE(reorder_status,'') IN ('needed','requested') OR COALESCE(on_hand_quantity,0)<=COALESCE(reorder_threshold,0)`), href: '/admin/inventory-operations/' },
    { key: 'accounting', label: 'Accounting evidence gaps', count: await scalar(db, `SELECT COUNT(*) FROM hst_gst_review_records WHERE COALESCE(remittance_evidence_url,'')='' AND COALESCE(review_status,'draft')!='draft'`), href: '/admin/accounting/#accountingEvidenceCheckMount' },
    { key: 'failed_api', label: 'Recent failed API/runtime incidents', count: await scalar(db, `SELECT COUNT(*) FROM runtime_incidents WHERE COALESCE(status,'open') NOT IN ('resolved','ignored') AND datetime(created_at) >= datetime('now','-7 days')`), href: '/admin/operations/#runtimeIncidentsAdminMount', details: await failedApiDetails(db) }
  ];
  const tasks=[]; for(const task of rawTasks){ if(Number(task.count||0)>0 && !(await isSuppressed(db,task.key))) tasks.push(task); }
  return json({ ok: true, tasks, suppressed_count: rawTasks.length - tasks.length, summary: { total_count: tasks.reduce((sum, row) => sum + Number(row.count || 0), 0), generated_at: new Date().toISOString() } });
}
