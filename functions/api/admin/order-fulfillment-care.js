// Release 467 Build 18 — read-only Order Fulfillment & Customer Care projection.
// This endpoint does not change orders, payments, refunds, customer communications, custom-request stages, D1 schema, R2, or providers.
import {
  captureRuntimeIncident,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
} from '../_lib/adminAudit.js';

const RELEASE = 467;
const BUILD = 18;
const STALE_PAID_HOURS = 24;
const STALE_CUSTOM_DAYS = 7;

function json(data, status = 200) {
  return jsonResponse({ release: RELEASE, build: BUILD, ...data }, status, { 'Cache-Control': 'no-store' });
}
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function n(value) { const x = Number(value || 0); return Number.isFinite(x) ? x : 0; }
function text(value) { return String(value ?? '').trim(); }
function lower(value) { return text(value).toLowerCase(); }
function hoursSince(value) {
  const stamp = Date.parse(String(value || ''));
  return Number.isFinite(stamp) ? Math.max(0, (Date.now() - stamp) / 3600000) : 0;
}
function daysSince(value) { return hoursSince(value) / 24; }
function safeDate(value) { return value || null; }
function severityRank(value) { return ({ critical: 4, high: 3, medium: 2, low: 1 })[value] || 0; }
function queueItem({ key, severity = 'medium', lane, title, detail, owner_href, owner_label, order_id = null, custom_request_id = null, customer_email = '', updated_at = null }) {
  return { key, severity, lane, title, detail, owner_href, owner_label, order_id, custom_request_id, customer_email, updated_at };
}

async function safeAll(db, sql, bindings = []) {
  try {
    const statement = db.prepare(sql);
    return rows(bindings.length ? await statement.bind(...bindings).all() : await statement.all());
  } catch {
    return [];
  }
}

async function standardOrders(db) {
  return safeAll(db, `
    WITH payment_summary AS (
      SELECT p.order_id,
        COUNT(*) payment_count,
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(p.payment_status,'')) IN ('paid','completed','captured') THEN COALESCE(p.amount_cents,0) ELSE 0 END),0) paid_total_cents,
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(p.payment_status,'')) IN ('pending','authorized') THEN COALESCE(p.amount_cents,0) ELSE 0 END),0) pending_total_cents
      FROM payments p GROUP BY p.order_id
    ), refund_summary AS (
      SELECT pr.order_id,
        COUNT(*) refund_count,
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(pr.refund_status,'')) IN ('recorded','submitted','succeeded') AND LOWER(COALESCE(pr.provider_sync_status,'')) <> 'failed' THEN COALESCE(pr.amount_cents,0) ELSE 0 END),0) refunded_total_cents,
        SUM(CASE WHEN LOWER(COALESCE(pr.refund_status,'')) IN ('requested','submitted') OR LOWER(COALESCE(pr.provider_sync_status,'')) IN ('pending','failed') THEN 1 ELSE 0 END) refund_attention_count
      FROM payment_refunds pr GROUP BY pr.order_id
    )
    SELECT o.order_id,o.order_number,o.customer_email,o.customer_name,o.order_status,o.payment_status,o.payment_method,o.fulfillment_type,o.currency,
      o.subtotal_cents,o.discount_cents,o.shipping_cents,o.tax_cents,o.total_cents,o.shipping_country,o.shipping_province,o.shipping_city,o.shipping_postal_code,
      o.created_at,o.updated_at,
      COALESCE(ps.payment_count,0) payment_count,COALESCE(ps.paid_total_cents,0) paid_total_cents,COALESCE(ps.pending_total_cents,0) pending_total_cents,
      COALESCE(rs.refund_count,0) refund_count,COALESCE(rs.refunded_total_cents,0) refunded_total_cents,COALESCE(rs.refund_attention_count,0) refund_attention_count,
      (SELECT h.new_status FROM order_status_history h WHERE h.order_id=o.order_id ORDER BY datetime(h.created_at) DESC,h.rowid DESC LIMIT 1) latest_history_status,
      (SELECT h.created_at FROM order_status_history h WHERE h.order_id=o.order_id ORDER BY datetime(h.created_at) DESC,h.rowid DESC LIMIT 1) latest_history_at
    FROM orders o
    LEFT JOIN payment_summary ps ON ps.order_id=o.order_id
    LEFT JOIN refund_summary rs ON rs.order_id=o.order_id
    ORDER BY datetime(o.updated_at) DESC,o.order_id DESC
    LIMIT 180
  `);
}

async function customOrders(db) {
  return safeAll(db, `
    SELECT r.custom_request_id,r.request_key,r.name customer_name,r.email customer_email,r.status request_status,r.deadline_date,r.created_at request_created_at,r.updated_at request_updated_at,
      d.custom_request_order_draft_id,d.order_draft_key,d.order_draft_status,d.order_id,d.total_cents,d.currency,d.fulfillment_notes,d.updated_at order_draft_updated_at,
      o.order_number,o.order_status,o.payment_status,o.fulfillment_type,o.shipping_country,o.created_at order_created_at,o.updated_at order_updated_at,
      (SELECT e.stage_key FROM custom_request_order_stage_events e WHERE e.custom_request_id=r.custom_request_id ORDER BY datetime(e.created_at) DESC,e.custom_request_order_stage_event_id DESC LIMIT 1) latest_stage_key,
      (SELECT e.stage_label FROM custom_request_order_stage_events e WHERE e.custom_request_id=r.custom_request_id ORDER BY datetime(e.created_at) DESC,e.custom_request_order_stage_event_id DESC LIMIT 1) latest_stage_label,
      (SELECT e.created_at FROM custom_request_order_stage_events e WHERE e.custom_request_id=r.custom_request_id ORDER BY datetime(e.created_at) DESC,e.custom_request_order_stage_event_id DESC LIMIT 1) latest_stage_at,
      (SELECT p.prompt_status FROM custom_request_fulfillment_prompts p WHERE p.custom_request_id=r.custom_request_id ORDER BY datetime(p.updated_at) DESC,p.custom_request_fulfillment_prompt_id DESC LIMIT 1) latest_prompt_status,
      (SELECT p.public_response_status FROM custom_request_fulfillment_prompts p WHERE p.custom_request_id=r.custom_request_id ORDER BY datetime(p.updated_at) DESC,p.custom_request_fulfillment_prompt_id DESC LIMIT 1) latest_prompt_response_status,
      (SELECT p.updated_at FROM custom_request_fulfillment_prompts p WHERE p.custom_request_id=r.custom_request_id ORDER BY datetime(p.updated_at) DESC,p.custom_request_fulfillment_prompt_id DESC LIMIT 1) latest_prompt_updated_at,
      (SELECT l.link_status FROM custom_request_order_status_links l WHERE l.custom_request_id=r.custom_request_id ORDER BY datetime(l.updated_at) DESC,l.custom_request_order_status_link_id DESC LIMIT 1) order_status_link_status
    FROM custom_requests r
    LEFT JOIN custom_request_order_drafts d ON d.custom_request_order_draft_id=(
      SELECT d2.custom_request_order_draft_id FROM custom_request_order_drafts d2 WHERE d2.custom_request_id=r.custom_request_id ORDER BY datetime(d2.updated_at) DESC,d2.custom_request_order_draft_id DESC LIMIT 1
    )
    LEFT JOIN orders o ON o.order_id=d.order_id
    WHERE LOWER(COALESCE(r.status,'new')) <> 'archived'
    ORDER BY datetime(COALESCE(o.updated_at,d.updated_at,r.updated_at,r.created_at)) DESC,r.custom_request_id DESC
    LIMIT 160
  `);
}

function deriveStandardQueue(order) {
  const items = [];
  const orderId = n(order.order_id);
  const status = lower(order.order_status || order.latest_history_status || 'pending');
  const payment = lower(order.payment_status || 'pending');
  const fulfillment = lower(order.fulfillment_type || 'shipping');
  const total = n(order.total_cents);
  const paid = n(order.paid_total_cents);
  const outstanding = Math.max(0, total - paid);
  const owner = `/admin/stripe-purchases/?order_id=${orderId}`;
  const updated = order.updated_at || order.latest_history_at || order.created_at;
  const closed = ['completed','cancelled','canceled','refunded'].includes(status);

  if (fulfillment === 'shipping' && text(order.shipping_country).toUpperCase() && text(order.shipping_country).toUpperCase() !== 'CA') {
    items.push(queueItem({ key:`order-${orderId}-country`,severity:'critical',lane:'policy',title:`${order.order_number || `Order ${orderId}`} — shipping policy mismatch`,detail:`Shipping country is ${order.shipping_country}; current fulfillment policy is Canada-only. Review the order before any fulfillment action.`,owner_href:owner,owner_label:'Open order owner',order_id:orderId,customer_email:order.customer_email,updated_at:updated }));
  }
  if (!closed && outstanding > 0 && !['paid','completed','captured'].includes(payment)) {
    items.push(queueItem({ key:`order-${orderId}-payment`,severity:hoursSince(order.created_at)>48?'high':'medium',lane:'payment',title:`${order.order_number || `Order ${orderId}`} — payment incomplete`,detail:`Outstanding ${(outstanding/100).toLocaleString('en-CA',{style:'currency',currency:order.currency||'CAD'})}. Payment/refund execution remains in the existing order/payment owner.`,owner_href:owner,owner_label:'Review payment/order',order_id:orderId,customer_email:order.customer_email,updated_at:updated }));
  }
  if (!closed && paid >= total && total > 0 && ['pending','draft','processing','paid'].includes(status) && hoursSince(updated) >= STALE_PAID_HOURS) {
    items.push(queueItem({ key:`order-${orderId}-fulfillment`,severity:'high',lane:'fulfillment',title:`${order.order_number || `Order ${orderId}`} — paid and awaiting fulfillment review`,detail:`Paid order has remained ${status || 'pending'} for ${Math.floor(hoursSince(updated))} hours. Confirm ${fulfillment === 'pickup' ? 'pickup readiness' : 'packing/shipping readiness'} in the existing order workflow.`,owner_href:owner,owner_label:'Open fulfillment owner',order_id:orderId,customer_email:order.customer_email,updated_at:updated }));
  }
  if (n(order.refund_attention_count) > 0) {
    items.push(queueItem({ key:`order-${orderId}-refund`,severity:'high',lane:'refund',title:`${order.order_number || `Order ${orderId}`} — refund needs review`,detail:`${n(order.refund_attention_count)} refund record(s) are requested, pending, submitted, or failed. This command center never executes refunds.`,owner_href:owner,owner_label:'Open refund/payment owner',order_id:orderId,customer_email:order.customer_email,updated_at:updated }));
  }
  return items;
}

function deriveCustomQueue(row) {
  const items = [];
  const requestId = n(row.custom_request_id);
  const requestStatus = lower(row.request_status || 'new');
  const draftStatus = lower(row.order_draft_status || '');
  const orderStatus = lower(row.order_status || '');
  const paymentStatus = lower(row.payment_status || '');
  const stage = lower(row.latest_stage_key || '');
  const owner = `/admin/custom-request/?custom_request_id=${requestId}`;
  const updated = row.order_updated_at || row.order_draft_updated_at || row.request_updated_at || row.request_created_at;

  if (['quoted','accepted'].includes(requestStatus) && (!draftStatus || draftStatus !== 'converted_to_order' || n(row.order_id) <= 0)) {
    items.push(queueItem({ key:`custom-${requestId}-order`,severity:'high',lane:'custom_order',title:`${row.request_key || `Custom request ${requestId}`} — real order handoff incomplete`,detail:'The request is quoted/accepted but its latest order draft is not yet connected to a real order. Conversion remains an explicit Custom Requests action.',owner_href:owner,owner_label:'Open Custom Requests',custom_request_id:requestId,customer_email:row.customer_email,updated_at:updated }));
  }
  if (n(row.order_id) > 0 && !['paid','completed','captured'].includes(paymentStatus) && !['cancelled','canceled','refunded'].includes(orderStatus)) {
    items.push(queueItem({ key:`custom-${requestId}-payment`,severity:'high',lane:'payment',title:`${row.request_key || `Custom request ${requestId}`} — customer payment still open`,detail:`Linked order ${row.order_number || row.order_id} is ${paymentStatus || 'pending'} for payment. Use the existing reviewed payment-link/order workflow; no message or charge is triggered here.`,owner_href:owner,owner_label:'Review custom payment',custom_request_id:requestId,order_id:n(row.order_id),customer_email:row.customer_email,updated_at:updated }));
  }
  if (n(row.order_id) > 0 && !['complete','completed'].includes(stage) && !['completed','cancelled','canceled','refunded'].includes(orderStatus) && (!row.latest_stage_at || daysSince(row.latest_stage_at) >= STALE_CUSTOM_DAYS)) {
    items.push(queueItem({ key:`custom-${requestId}-stage`,severity:'medium',lane:'customer_care',title:`${row.request_key || `Custom request ${requestId}`} — progress review due`,detail:row.latest_stage_at?`Latest reviewed stage “${row.latest_stage_label || stage || 'unknown'}” is ${Math.floor(daysSince(row.latest_stage_at))} days old.`:'No reviewed order-stage event is recorded yet. Customer-safe progress remains managed by Custom Requests / Made Today.',owner_href:owner,owner_label:'Review progress',custom_request_id:requestId,order_id:n(row.order_id)||null,customer_email:row.customer_email,updated_at:updated }));
  }
  if (['complete','completed'].includes(stage) || orderStatus === 'completed') {
    const promptStatus = lower(row.latest_prompt_status || '');
    const responseStatus = lower(row.latest_prompt_response_status || '');
    if (!promptStatus || ['draft','active'].includes(promptStatus) && !['responded','declined'].includes(responseStatus)) {
      items.push(queueItem({ key:`custom-${requestId}-aftercare`,severity:'low',lane:'after_sale',title:`${row.request_key || `Custom request ${requestId}`} — after-sale follow-up available`,detail:'Work appears complete but post-fulfillment review/consent follow-up is not closed. Any customer contact remains an explicit Custom Requests action.',owner_href:owner,owner_label:'Review after-sale follow-up',custom_request_id:requestId,order_id:n(row.order_id)||null,customer_email:row.customer_email,updated_at:row.latest_prompt_updated_at||updated }));
    }
  }
  return items;
}

function buildCustomerSummary(orders, customRows, queue) {
  const map = new Map();
  const ensure = (email, name='') => {
    const key = lower(email);
    if (!key) return null;
    if (!map.has(key)) map.set(key,{ customer_email:email,customer_name:name||email,standard_orders:0,custom_requests:0,open_attention:0,last_activity_at:null });
    const row = map.get(key); if (name && (!row.customer_name || row.customer_name===row.customer_email)) row.customer_name=name; return row;
  };
  for (const order of orders) { const c=ensure(order.customer_email,order.customer_name); if(!c) continue; c.standard_orders++; const at=order.updated_at||order.created_at; if(!c.last_activity_at || String(at)>String(c.last_activity_at)) c.last_activity_at=at; }
  for (const row of customRows) { const c=ensure(row.customer_email,row.customer_name); if(!c) continue; c.custom_requests++; const at=row.order_updated_at||row.request_updated_at||row.request_created_at; if(!c.last_activity_at || String(at)>String(c.last_activity_at)) c.last_activity_at=at; }
  for (const item of queue) { const c=ensure(item.customer_email); if(c) c.open_attention++; }
  return Array.from(map.values()).sort((a,b)=>b.open_attention-a.open_attention || String(b.last_activity_at||'').localeCompare(String(a.last_activity_at||''))).slice(0,120);
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok:false,error:'Admin access required.' },401);
  const db = getDb(context.env);
  if (!db) return json({ ok:false,error:'Database binding is not configured.' },500);
  try {
    const [orders, custom] = await Promise.all([standardOrders(db), customOrders(db)]);
    const queue = [...orders.flatMap(deriveStandardQueue), ...custom.flatMap(deriveCustomQueue)]
      .sort((a,b)=>severityRank(b.severity)-severityRank(a.severity) || String(a.updated_at||'').localeCompare(String(b.updated_at||'')));
    const customers = buildCustomerSummary(orders,custom,queue);
    const summary = {
      standard_orders: orders.length,
      custom_requests: custom.length,
      attention_total: queue.length,
      critical: queue.filter(x=>x.severity==='critical').length,
      high: queue.filter(x=>x.severity==='high').length,
      payment_attention: queue.filter(x=>x.lane==='payment').length,
      fulfillment_attention: queue.filter(x=>x.lane==='fulfillment').length,
      customer_care_attention: queue.filter(x=>['customer_care','after_sale'].includes(x.lane)).length,
      refund_attention: queue.filter(x=>x.lane==='refund').length,
    };
    return json({
      ok:true,
      read_only:true,
      automatic_order_mutation:false,
      automatic_customer_message:false,
      refund_provider_execution:false,
      shipping_provider_execution:false,
      canada_only_shipping_policy_preserved:true,
      us_sales_shipping_suspension_preserved:true,
      requested_by:{ user_id:adminUser.user_id,email:adminUser.email,display_name:adminUser.display_name },
      summary,queue,orders,custom_orders:custom,customers,
      owners:{ orders:'/admin/orders/',custom_requests:'/admin/custom-request/',customers:'/admin/customers/',finance:'/admin/accounting/' }
    });
  } catch (error) {
    await captureRuntimeIncident(context.env,context.request,{ incident_scope:'order_fulfillment_customer_care',incident_code:'build18_read_projection_failed',severity:'warning',message:error?.message||'Fulfillment/customer-care projection failed.',related_user_id:adminUser.user_id,details:{ build:BUILD,error:String(error?.stack||error) } }).catch(()=>null);
    return json({ ok:false,read_only:true,error:'Order Fulfillment & Customer Care could not be loaded.' },503);
  }
}
