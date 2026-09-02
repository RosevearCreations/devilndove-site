// Release 467 Build 19 — read-only Inventory Replenishment & Procurement Readiness projection.
// Stock, reorder, purchase-order, receiving and supplier facts remain owned by their existing operational authorities.
import { captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

const RELEASE = 467;
const BUILD = 19;
const STALE_DRAFT_DAYS = 3;
const STALE_ORDERED_DAYS = 10;
const STALE_COUNT_DAYS = 30;

function json(data, status = 200) { return jsonResponse({ release: RELEASE, build: BUILD, ...data }, status, { 'Cache-Control': 'no-store' }); }
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function n(value) { const x = Number(value || 0); return Number.isFinite(x) ? x : 0; }
function text(value) { return String(value ?? '').trim(); }
function lower(value) { return text(value).toLowerCase(); }
function daysSince(value) { const stamp = Date.parse(String(value || '')); return Number.isFinite(stamp) ? Math.max(0, (Date.now() - stamp) / 86400000) : 0; }
function rank(value) { return ({ critical: 4, high: 3, medium: 2, low: 1 })[value] || 0; }
function queueItem({ key, severity = 'medium', lane, title, detail, owner_href, owner_label, inventory_id = null, purchase_order_id = null, supplier_name = '', updated_at = null }) {
  return { key, severity, lane, title, detail, owner_href, owner_label, inventory_id, purchase_order_id, supplier_name, updated_at };
}
async function safeAll(db, sql) { try { return rows(await db.prepare(sql).all()); } catch { return []; } }

async function inventoryFacts(db) {
  return safeAll(db, `
    SELECT site_item_inventory_id,source_type,external_key,item_name,category,
      COALESCE(on_hand_quantity,0) on_hand_quantity,COALESCE(reserved_quantity,0) reserved_quantity,
      COALESCE(incoming_quantity,0) incoming_quantity,COALESCE(reorder_level,0) reorder_level,
      COALESCE(preferred_reorder_quantity,0) preferred_reorder_quantity,COALESCE(unit_cost_cents,0) unit_cost_cents,
      COALESCE(stock_unit_label,'unit') stock_unit_label,supplier_name,supplier_sku,supplier_contact,
      COALESCE(is_on_reorder_list,0) is_on_reorder_list,COALESCE(do_not_reorder,0) do_not_reorder,
      last_reorder_requested_at,last_counted_at,updated_at
    FROM site_item_inventory
    WHERE COALESCE(is_active,1)=1
    ORDER BY LOWER(COALESCE(item_name,'')),site_item_inventory_id
    LIMIT 500
  `);
}

async function purchaseOrderFacts(db) {
  return safeAll(db, `
    SELECT spo.supplier_purchase_order_id,spo.supplier_name,spo.supplier_contact,spo.status,spo.notes,
      COALESCE(spo.total_estimated_cents,0) total_estimated_cents,spo.ordered_applied_at,spo.received_completed_at,spo.created_at,spo.updated_at,
      COUNT(spoi.supplier_purchase_order_item_id) item_count,
      COALESCE(SUM(spoi.quantity_ordered),0) total_quantity_ordered,
      COALESCE(SUM(COALESCE(spoi.quantity_received,0)),0) total_quantity_received,
      COALESCE(SUM(CASE WHEN COALESCE(spoi.quantity_ordered,0)>COALESCE(spoi.quantity_received,0) THEN 1 ELSE 0 END),0) open_line_count,
      COALESCE(SUM(CASE WHEN COALESCE(spoi.unit_cost_cents,0)<=0 THEN 1 ELSE 0 END),0) missing_cost_line_count
    FROM supplier_purchase_orders spo
    LEFT JOIN supplier_purchase_order_items spoi ON spoi.supplier_purchase_order_id=spo.supplier_purchase_order_id
    GROUP BY spo.supplier_purchase_order_id
    ORDER BY datetime(COALESCE(spo.updated_at,spo.created_at)) DESC,spo.supplier_purchase_order_id DESC
    LIMIT 120
  `);
}

async function recentReceivingFacts(db) {
  return safeAll(db, `
    SELECT rc.inventory_receiving_claim_id,rc.receive_key,rc.site_item_inventory_id,rc.supplier_purchase_order_item_id,
      rc.quantity_received,rc.quantity_incoming_cleared,rc.inventory_purchase_lot_id,rc.lot_code,rc.created_at,
      sii.item_name,sii.stock_unit_label
    FROM inventory_receiving_claims rc
    INNER JOIN site_item_inventory sii ON sii.site_item_inventory_id=rc.site_item_inventory_id
    ORDER BY rc.inventory_receiving_claim_id DESC
    LIMIT 40
  `);
}

function deriveInventoryQueue(item) {
  const out = [];
  const id = n(item.site_item_inventory_id);
  const onHand = Math.max(0, n(item.on_hand_quantity));
  const reserved = Math.max(0, n(item.reserved_quantity));
  const incoming = Math.max(0, n(item.incoming_quantity));
  const reorder = Math.max(0, n(item.reorder_level));
  const available = Math.max(0, onHand - reserved);
  const projected = available + incoming;
  const canonicalNeedsReorder = reorder > 0 && (onHand + incoming) <= reorder;
  const listed = n(item.is_on_reorder_list) === 1;
  const blocked = n(item.do_not_reorder) === 1;
  const supplier = text(item.supplier_name);
  const owner = `/admin/inventory-operations/?site_item_inventory_id=${id}`;
  const updated = item.updated_at || item.last_reorder_requested_at || null;

  if (canonicalNeedsReorder && blocked) {
    out.push(queueItem({ key:`inventory-${id}-blocked`,severity:'critical',lane:'replenishment',title:`${item.item_name || `Inventory ${id}`} — reorder need conflicts with do-not-reorder`,detail:`Existing stock is at/below its reorder threshold, but this item is marked do not reorder. Review the inventory record before procurement.`,owner_href:owner,owner_label:'Open Inventory owner',inventory_id:id,supplier_name:supplier,updated_at:updated }));
  } else if (canonicalNeedsReorder && !supplier) {
    out.push(queueItem({ key:`inventory-${id}-supplier`,severity:'high',lane:'supplier',title:`${item.item_name || `Inventory ${id}`} — supplier missing`,detail:`Replenishment is due, but no supplier is assigned to the inventory record. Add/review supplier facts in Inventory Operations before drafting a purchase order.`,owner_href:owner,owner_label:'Review supplier facts',inventory_id:id,updated_at:updated }));
  } else if (canonicalNeedsReorder && incoming <= 0) {
    out.push(queueItem({ key:`inventory-${id}-reorder`,severity:'high',lane:'replenishment',title:`${item.item_name || `Inventory ${id}`} — replenishment due`,detail:`On hand ${onHand} ${item.stock_unit_label || 'unit'}, reorder level ${reorder}, and no incoming quantity is recorded. Purchase-order creation remains an explicit Inventory action.`,owner_href:owner,owner_label:'Open replenishment owner',inventory_id:id,supplier_name:supplier,updated_at:updated }));
  } else if (canonicalNeedsReorder && incoming > 0) {
    out.push(queueItem({ key:`inventory-${id}-incoming`,severity:'medium',lane:'receiving',title:`${item.item_name || `Inventory ${id}`} — low stock with incoming supply`,detail:`Available ${available} ${item.stock_unit_label || 'unit'}; ${incoming} incoming. Confirm the open purchase order/receipt when stock arrives.`,owner_href:'/admin/inventory-operations/#inventoryReceivingMount',owner_label:'Open Receiving owner',inventory_id:id,supplier_name:supplier,updated_at:updated }));
  } else if (listed && !blocked) {
    out.push(queueItem({ key:`inventory-${id}-listed`,severity:'low',lane:'replenishment',title:`${item.item_name || `Inventory ${id}`} — reorder list review`,detail:`The item remains on the reorder list. Current projected available + incoming stock is ${projected} ${item.stock_unit_label || 'unit'}. Confirm whether the reorder flag still reflects operator intent.`,owner_href:owner,owner_label:'Review Inventory record',inventory_id:id,supplier_name:supplier,updated_at:updated }));
  }

  if (item.last_counted_at && daysSince(item.last_counted_at) >= STALE_COUNT_DAYS && (canonicalNeedsReorder || listed)) {
    out.push(queueItem({ key:`inventory-${id}-count`,severity:'medium',lane:'inventory_accuracy',title:`${item.item_name || `Inventory ${id}`} — count may be stale`,detail:`Last recorded count is ${Math.floor(daysSince(item.last_counted_at))} days old while this item is in replenishment attention. Verify physical stock before committing procurement.`,owner_href:owner,owner_label:'Verify inventory count',inventory_id:id,supplier_name:supplier,updated_at:item.last_counted_at }));
  }
  return out;
}

function derivePurchaseOrderQueue(po) {
  const out = [];
  const id = n(po.supplier_purchase_order_id);
  const status = lower(po.status || 'draft');
  const ordered = Math.max(0, n(po.total_quantity_ordered));
  const received = Math.max(0, n(po.total_quantity_received));
  const remaining = Math.max(0, ordered - received);
  const age = daysSince(po.updated_at || po.created_at);
  const owner = '/admin/inventory-operations/';
  const updated = po.updated_at || po.created_at;

  if (status === 'draft' && age >= STALE_DRAFT_DAYS) {
    out.push(queueItem({ key:`po-${id}-draft`,severity:'medium',lane:'procurement',title:`Purchase order #${id} — draft review due`,detail:`Draft has not changed for ${Math.floor(age)} days. Review, revise, order, or cancel it in the existing Purchase Order owner.`,owner_href:owner,owner_label:'Open Purchase Order owner',purchase_order_id:id,supplier_name:po.supplier_name,updated_at:updated }));
  }
  if (status === 'ordered' && remaining > 0 && age >= STALE_ORDERED_DAYS) {
    out.push(queueItem({ key:`po-${id}-ordered`,severity:'high',lane:'receiving',title:`Purchase order #${id} — open receiving review`,detail:`${remaining} unit(s) remain unreceived and the order record has not changed for ${Math.floor(age)} days. This is a stale-record review, not a supplier due-date claim.`,owner_href:'/admin/inventory-operations/#inventoryReceivingMount',owner_label:'Open Receiving owner',purchase_order_id:id,supplier_name:po.supplier_name,updated_at:updated }));
  } else if (status === 'ordered' && received > 0 && remaining > 0) {
    out.push(queueItem({ key:`po-${id}-partial`,severity:'medium',lane:'receiving',title:`Purchase order #${id} — partially received`,detail:`Received ${received} of ${ordered}; ${remaining} unit(s) remain open. Continue receiving only through the existing audited receiving workflow.`,owner_href:'/admin/inventory-operations/#inventoryReceivingMount',owner_label:'Continue Receiving',purchase_order_id:id,supplier_name:po.supplier_name,updated_at:updated }));
  }
  if (!text(po.supplier_name) || lower(po.supplier_name) === 'unassigned supplier') {
    out.push(queueItem({ key:`po-${id}-supplier`,severity:'high',lane:'supplier',title:`Purchase order #${id} — supplier needs review`,detail:'This purchase order does not have a confirmed supplier identity. Correct the source inventory records before relying on the draft.',owner_href:owner,owner_label:'Review supplier/source',purchase_order_id:id,updated_at:updated }));
  }
  if (n(po.missing_cost_line_count) > 0 && !['cancelled','canceled','received'].includes(status)) {
    out.push(queueItem({ key:`po-${id}-cost`,severity:'low',lane:'procurement',title:`Purchase order #${id} — cost completeness review`,detail:`${n(po.missing_cost_line_count)} line(s) have no recorded unit cost. Confirm costs in the existing inventory/purchase-order owner before financial reliance.`,owner_href:owner,owner_label:'Review purchase costs',purchase_order_id:id,supplier_name:po.supplier_name,updated_at:updated }));
  }
  return out;
}

function supplierSummary(inventory, purchaseOrders) {
  const map = new Map();
  const ensure = (name) => {
    const label = text(name) || 'Unassigned Supplier';
    const key = lower(label);
    if (!map.has(key)) map.set(key,{ supplier_name:label,inventory_items:0,replenishment_items:0,incoming_quantity:0,open_purchase_orders:0,open_order_quantity:0,total_open_estimated_cents:0 });
    return map.get(key);
  };
  for (const item of inventory) {
    const row=ensure(item.supplier_name); row.inventory_items++;
    if (n(item.reorder_level)>0 && (n(item.on_hand_quantity)+n(item.incoming_quantity))<=n(item.reorder_level)) row.replenishment_items++;
    row.incoming_quantity += Math.max(0,n(item.incoming_quantity));
  }
  for (const po of purchaseOrders) {
    if (['received','cancelled','canceled'].includes(lower(po.status))) continue;
    const row=ensure(po.supplier_name); row.open_purchase_orders++;
    row.open_order_quantity += Math.max(0,n(po.total_quantity_ordered)-n(po.total_quantity_received));
    row.total_open_estimated_cents += Math.max(0,n(po.total_estimated_cents));
  }
  return Array.from(map.values()).sort((a,b)=>b.replenishment_items-a.replenishment_items || b.open_purchase_orders-a.open_purchase_orders || a.supplier_name.localeCompare(b.supplier_name)).slice(0,120);
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok:false,error:'Admin access required.' },401);
  const db = getDb(context.env);
  if (!db) return json({ ok:false,error:'Database binding is not configured.' },500);
  try {
    const [inventory,purchaseOrders,recentReceipts] = await Promise.all([inventoryFacts(db),purchaseOrderFacts(db),recentReceivingFacts(db)]);
    const queue=[...inventory.flatMap(deriveInventoryQueue),...purchaseOrders.flatMap(derivePurchaseOrderQueue)]
      .sort((a,b)=>rank(b.severity)-rank(a.severity) || String(a.updated_at||'').localeCompare(String(b.updated_at||'')));
    const suppliers=supplierSummary(inventory,purchaseOrders);
    const summary={
      inventory_items:inventory.length,
      replenishment_due:inventory.filter(x=>n(x.reorder_level)>0 && (n(x.on_hand_quantity)+n(x.incoming_quantity))<=n(x.reorder_level)).length,
      reorder_list:inventory.filter(x=>n(x.is_on_reorder_list)===1).length,
      incoming_items:inventory.filter(x=>n(x.incoming_quantity)>0).length,
      open_purchase_orders:purchaseOrders.filter(x=>!['received','cancelled','canceled'].includes(lower(x.status))).length,
      open_receiving_quantity:purchaseOrders.reduce((sum,x)=>['received','cancelled','canceled'].includes(lower(x.status))?sum:sum+Math.max(0,n(x.total_quantity_ordered)-n(x.total_quantity_received)),0),
      attention_total:queue.length,
      critical:queue.filter(x=>x.severity==='critical').length,
      high:queue.filter(x=>x.severity==='high').length
    };
    return json({
      ok:true,read_only:true,automatic_purchase_order_creation:false,automatic_purchase_order_submission:false,
      automatic_inventory_adjustment:false,automatic_receiving_action:false,automatic_supplier_message:false,provider_execution:false,
      requested_by:{ user_id:adminUser.user_id,email:adminUser.email,display_name:adminUser.display_name },
      summary,queue,inventory,purchase_orders:purchaseOrders,recent_receipts:recentReceipts,suppliers,
      owners:{ inventory:'/admin/inventory-operations/',purchase_orders:'/admin/inventory-operations/',receiving:'/admin/inventory-operations/#inventoryReceivingMount',creator:'/admin/creator/' }
    });
  } catch (error) {
    await captureRuntimeIncident(context.env,context.request,{ incident_scope:'inventory_replenishment_procurement',incident_code:'build19_read_projection_failed',severity:'warning',message:error?.message||'Inventory replenishment projection failed.',related_user_id:adminUser.user_id,details:{ build:BUILD,error:String(error?.stack||error) } }).catch(()=>null);
    return json({ ok:false,read_only:true,error:'Inventory Replenishment & Procurement Readiness could not be loaded.' },503);
  }
}
