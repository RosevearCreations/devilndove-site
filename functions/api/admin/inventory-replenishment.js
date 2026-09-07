// Release 467 Build 72 — read-only Inventory / Reorder Economics projection.
// Replenishment recommendations, landed-cost comparisons, stock coverage and resource buildability are advisory only.
// Stock, purchase orders, receiving, supplier facts and purchasing remain owned by their existing operational authorities.
import { captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { planInventoryReorderEconomics } from '../_lib/inventoryReorderEconomics.js';

const RELEASE = 467;
const BUILD = 72;
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
function inventoryKey(sourceType, externalKey) { return `${lower(sourceType)}:${text(externalKey)}`; }
function queueItem({ key, severity = 'medium', lane, title, detail, owner_href, owner_label, inventory_id = null, purchase_order_id = null, supplier_name = '', updated_at = null }) {
  return { key, severity, lane, title, detail, owner_href, owner_label, inventory_id, purchase_order_id, supplier_name, updated_at };
}
async function safeAll(db, sql) { try { return rows(await db.prepare(sql).all()); } catch { return []; } }

async function inventoryFacts(db) {
  return safeAll(db, `
    SELECT sii.site_item_inventory_id,sii.source_type,sii.external_key,sii.item_name,sii.category,
      COALESCE(sii.on_hand_quantity,0) on_hand_quantity,COALESCE(sii.reserved_quantity,0) reserved_quantity,
      COALESCE(sii.incoming_quantity,0) incoming_quantity,COALESCE(sii.reorder_level,0) reorder_level,
      COALESCE(sii.preferred_reorder_quantity,0) preferred_reorder_quantity,COALESCE(sii.unit_cost_cents,0) unit_cost_cents,
      COALESCE(sii.stock_unit_label,'unit') stock_unit_label,COALESCE(sii.usage_unit_label,'unit') usage_unit_label,
      COALESCE(NULLIF(sii.usage_units_per_stock_unit,0),1) usage_units_per_stock_unit,
      COALESCE(siup.usage_tracking_mode,CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END) usage_tracking_mode,
      sii.supplier_name,sii.supplier_sku,sii.supplier_contact,sii.source_url,
      COALESCE(sii.is_on_reorder_list,0) is_on_reorder_list,COALESCE(sii.do_not_reorder,0) do_not_reorder,
      sii.last_reorder_requested_at,sii.last_counted_at,sii.updated_at
    FROM site_item_inventory sii
    LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id=sii.site_item_inventory_id
    WHERE COALESCE(sii.is_active,1)=1
    ORDER BY LOWER(COALESCE(sii.item_name,'')),sii.site_item_inventory_id
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

async function usageEconomicsFacts(db) {
  return safeAll(db, `
    SELECT site_item_inventory_id,
      COALESCE(SUM(CASE WHEN datetime(created_at)>=datetime('now','-30 days') AND movement_type='consume' AND quantity_delta<0 THEN -quantity_delta ELSE 0 END),0) consumed_30d,
      COALESCE(SUM(CASE WHEN movement_type='consume' AND quantity_delta<0 THEN -quantity_delta ELSE 0 END),0) consumed_90d,
      MAX(CASE WHEN movement_type='consume' AND quantity_delta<0 THEN created_at ELSE NULL END) last_consumed_at
    FROM site_inventory_movements
    WHERE datetime(created_at)>=datetime('now','-90 days')
    GROUP BY site_item_inventory_id
    ORDER BY site_item_inventory_id
    LIMIT 500
  `);
}

async function supplierLandedCostFacts(db) {
  return safeAll(db, `
    SELECT site_item_inventory_id,
      COALESCE(NULLIF(TRIM(supplier_name),''),'Unassigned Supplier') supplier_name,
      COUNT(inventory_purchase_lot_id) observed_lot_count,
      COALESCE(SUM(CASE WHEN quantity_received>0 THEN quantity_received ELSE 0 END),0) observed_quantity,
      CAST(ROUND(
        COALESCE(SUM(CASE WHEN quantity_received>0 THEN (COALESCE(unit_cost_cents,0)*quantity_received)+COALESCE(shipping_cost_cents,0)+COALESCE(tax_cost_cents,0) ELSE 0 END),0)
        / NULLIF(COALESCE(SUM(CASE WHEN quantity_received>0 THEN quantity_received ELSE 0 END),0),0)
      ) AS INTEGER) weighted_landed_unit_cost_cents,
      MAX(COALESCE(received_date,purchase_date,created_at)) latest_received_at,
      MAX(COALESCE(source_url,'')) source_url
    FROM inventory_purchase_lots
    WHERE COALESCE(quantity_received,0)>0
      AND LOWER(COALESCE(lot_status,'available')) NOT IN ('void','cancelled','canceled')
    GROUP BY site_item_inventory_id,COALESCE(NULLIF(TRIM(supplier_name),''),'Unassigned Supplier')
    ORDER BY datetime(latest_received_at) DESC,site_item_inventory_id
    LIMIT 300
  `);
}

async function productResourceEconomicsFacts(db) {
  return safeAll(db, `
    SELECT prl.resource_kind,prl.source_key,prl.product_id,
      p.name product_name,p.slug product_slug,COALESCE(p.price_cents,0) product_price_cents,
      COALESCE(prl.quantity_used,0) quantity_used,
      COALESCE(prl.consumption_mode,'per_unit') consumption_mode,
      COALESCE(NULLIF(prl.lot_size_units,0),1) lot_size_units
    FROM product_resource_links prl
    INNER JOIN products p ON p.product_id=prl.product_id
    WHERE LOWER(TRIM(COALESCE(prl.resource_kind,''))) IN ('tool','supply')
      AND COALESCE(prl.quantity_used,0)>0
    ORDER BY prl.product_id,prl.sort_order,prl.product_resource_link_id
    LIMIT 800
  `);
}

function enrichEconomics(inventory, usageFacts, landedFacts, resourceFacts) {
  const usageById = new Map(usageFacts.map((row) => [Number(row.site_item_inventory_id || 0), row]));
  const landedById = new Map();
  for (const row of landedFacts) {
    const id = Number(row.site_item_inventory_id || 0);
    if (!landedById.has(id)) landedById.set(id, []);
    landedById.get(id).push(row);
  }
  const linksByKey = new Map();
  for (const row of resourceFacts) {
    const key = inventoryKey(row.resource_kind, row.source_key);
    if (!linksByKey.has(key)) linksByKey.set(key, []);
    linksByKey.get(key).push(row);
  }
  return inventory.map((item) => {
    const id = Number(item.site_item_inventory_id || 0);
    const demand = usageById.get(id) || {};
    const supplierOffers = landedById.get(id) || [];
    const resourceLinks = linksByKey.get(inventoryKey(item.source_type, item.external_key)) || [];
    return {
      ...item,
      last_consumed_at: demand.last_consumed_at || null,
      reorder_economics: planInventoryReorderEconomics(item, demand, supplierOffers, resourceLinks),
    };
  });
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
  const canonicalNeedsReorder = reorder > 0 && projected <= reorder;
  const listed = n(item.is_on_reorder_list) === 1;
  const blocked = n(item.do_not_reorder) === 1;
  const supplier = text(item.supplier_name);
  const owner = `/admin/inventory-operations/?site_item_inventory_id=${id}`;
  const updated = item.updated_at || item.last_reorder_requested_at || null;
  const economics = item.reorder_economics || {};
  const recommendation = Math.max(0, n(economics.recommended_reorder_quantity));
  const economicsNote = recommendation > 0
    ? ` Advisory Build 72 quantity: ${recommendation} ${item.stock_unit_label || 'unit'}; operator review is required before any purchase order.`
    : '';

  if (canonicalNeedsReorder && blocked) {
    out.push(queueItem({ key:`inventory-${id}-blocked`,severity:'critical',lane:'replenishment',title:`${item.item_name || `Inventory ${id}`} — reorder need conflicts with do-not-reorder`,detail:`Available plus incoming stock is at/below its reorder threshold, but this item is marked do not reorder. Review the inventory record before procurement.`,owner_href:owner,owner_label:'Open Inventory owner',inventory_id:id,supplier_name:supplier,updated_at:updated }));
  } else if (canonicalNeedsReorder && !supplier) {
    out.push(queueItem({ key:`inventory-${id}-supplier`,severity:'high',lane:'supplier',title:`${item.item_name || `Inventory ${id}`} — supplier missing`,detail:`Replenishment is due, but no supplier is assigned to the inventory record. Add/review supplier facts in Inventory Operations before drafting a purchase order.${economicsNote}`,owner_href:owner,owner_label:'Review supplier facts',inventory_id:id,updated_at:updated }));
  } else if (canonicalNeedsReorder && incoming <= 0) {
    out.push(queueItem({ key:`inventory-${id}-reorder`,severity:'high',lane:'replenishment',title:`${item.item_name || `Inventory ${id}`} — replenishment due`,detail:`Available ${available} ${item.stock_unit_label || 'unit'}, reorder level ${reorder}, and no incoming quantity is recorded.${economicsNote}`,owner_href:owner,owner_label:'Open replenishment owner',inventory_id:id,supplier_name:supplier,updated_at:updated }));
  } else if (canonicalNeedsReorder && incoming > 0) {
    out.push(queueItem({ key:`inventory-${id}-incoming`,severity:'medium',lane:'receiving',title:`${item.item_name || `Inventory ${id}`} — low stock with incoming supply`,detail:`Available ${available} ${item.stock_unit_label || 'unit'}; ${incoming} incoming. Confirm the open purchase order/receipt when stock arrives.${economicsNote}`,owner_href:'/admin/inventory-operations/#inventoryReceivingMount',owner_label:'Open Receiving owner',inventory_id:id,supplier_name:supplier,updated_at:updated }));
  } else if (listed && !blocked) {
    out.push(queueItem({ key:`inventory-${id}-listed`,severity:'low',lane:'replenishment',title:`${item.item_name || `Inventory ${id}`} — reorder list review`,detail:`The item remains on the reorder list. Projected available + incoming stock is ${projected} ${item.stock_unit_label || 'unit'}.${economicsNote}`,owner_href:owner,owner_label:'Review Inventory record',inventory_id:id,supplier_name:supplier,updated_at:updated }));
  }

  if (!blocked && economics.projected_coverage_band === 'critical' && !canonicalNeedsReorder) {
    out.push(queueItem({ key:`inventory-${id}-coverage`,severity:'high',lane:'economics',title:`${item.item_name || `Inventory ${id}`} — less than 7 days projected coverage`,detail:`Recent consumption implies about ${economics.projected_coverage_days ?? 'unknown'} days of coverage after incoming stock. Recommendation is advisory only.${economicsNote}`,owner_href:owner,owner_label:'Review stock economics',inventory_id:id,supplier_name:supplier,updated_at:item.last_consumed_at || updated }));
  }

  if (item.last_counted_at && daysSince(item.last_counted_at) >= STALE_COUNT_DAYS && (canonicalNeedsReorder || listed || recommendation > 0)) {
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
    if (!map.has(key)) map.set(key,{ supplier_name:label,inventory_items:0,replenishment_items:0,incoming_quantity:0,open_purchase_orders:0,open_order_quantity:0,total_open_estimated_cents:0,recommended_reorder_units:0,recommended_reorder_landed_cents:0 });
    return map.get(key);
  };
  for (const item of inventory) {
    const row=ensure(item.supplier_name); row.inventory_items++;
    const econ=item.reorder_economics||{};
    if (n(econ.recommended_reorder_quantity)>0) row.replenishment_items++;
    row.incoming_quantity += Math.max(0,n(item.incoming_quantity));
    row.recommended_reorder_units += Math.max(0,n(econ.recommended_reorder_quantity));
    row.recommended_reorder_landed_cents += Math.max(0,n(econ.estimated_reorder_landed_cost_cents));
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
    const [inventoryRaw,purchaseOrders,recentReceipts,usageFacts,landedFacts,resourceFacts] = await Promise.all([
      inventoryFacts(db),purchaseOrderFacts(db),recentReceivingFacts(db),usageEconomicsFacts(db),supplierLandedCostFacts(db),productResourceEconomicsFacts(db)
    ]);
    const inventory=enrichEconomics(inventoryRaw,usageFacts,landedFacts,resourceFacts);
    const queue=[...inventory.flatMap(deriveInventoryQueue),...purchaseOrders.flatMap(derivePurchaseOrderQueue)]
      .sort((a,b)=>rank(b.severity)-rank(a.severity) || String(a.updated_at||'').localeCompare(String(b.updated_at||'')));
    const suppliers=supplierSummary(inventory,purchaseOrders);
    const recommendations=inventory.filter((row)=>n(row?.reorder_economics?.recommended_reorder_quantity)>0);
    const summary={
      inventory_items:inventory.length,
      replenishment_due:inventory.filter(x=>n(x?.reorder_economics?.recommended_reorder_quantity)>0).length,
      reorder_list:inventory.filter(x=>n(x.is_on_reorder_list)===1).length,
      incoming_items:inventory.filter(x=>n(x.incoming_quantity)>0).length,
      open_purchase_orders:purchaseOrders.filter(x=>!['received','cancelled','canceled'].includes(lower(x.status))).length,
      open_receiving_quantity:purchaseOrders.reduce((sum,x)=>['received','cancelled','canceled'].includes(lower(x.status))?sum:sum+Math.max(0,n(x.total_quantity_ordered)-n(x.total_quantity_received)),0),
      recommended_reorder_items:recommendations.length,
      recommended_reorder_units:recommendations.reduce((sum,x)=>sum+n(x.reorder_economics.recommended_reorder_quantity),0),
      recommended_landed_cost_cents:recommendations.reduce((sum,x)=>sum+n(x.reorder_economics.estimated_reorder_landed_cost_cents),0),
      low_coverage_items:inventory.filter(x=>['critical','low'].includes(x?.reorder_economics?.projected_coverage_band)).length,
      supplier_comparison_items:inventory.filter(x=>n(x?.reorder_economics?.supplier_economics?.supplier_offer_count)>1).length,
      buildability_links:inventory.reduce((sum,x)=>sum+n(x?.reorder_economics?.buildable_economics?.constraining_link_count),0),
      attention_total:queue.length,
      critical:queue.filter(x=>x.severity==='critical').length,
      high:queue.filter(x=>x.severity==='high').length
    };
    return json({
      ok:true,read_only:true,recommendation_only:true,automatic_purchase:false,
      automatic_purchase_order_creation:false,automatic_purchase_order_submission:false,
      automatic_inventory_adjustment:false,automatic_receiving_action:false,automatic_supplier_message:false,provider_execution:false,
      economics_policy:{ target_coverage_days:30,demand_window_days:[30,90],landed_cost_basis:'received lot unit cost + lot shipping + lot tax, weighted by received quantity',supplier_comparison:'historical observed cost only; operator chooses supplier',buildable_scope:'per linked resource; not a promise that every other Product resource is available' },
      requested_by:{ user_id:adminUser.user_id,email:adminUser.email,display_name:adminUser.display_name },
      summary,queue,inventory,purchase_orders:purchaseOrders,recent_receipts:recentReceipts,suppliers,
      owners:{ inventory:'/admin/inventory-operations/',purchase_orders:'/admin/inventory-operations/',receiving:'/admin/inventory-operations/#inventoryReceivingMount',creator:'/admin/creator/' }
    });
  } catch (error) {
    await captureRuntimeIncident(context.env,context.request,{ incident_scope:'inventory_replenishment_procurement',incident_code:'build72_read_projection_failed',severity:'warning',message:error?.message||'Inventory reorder economics projection failed.',related_user_id:adminUser.user_id,details:{ build:BUILD,error:String(error?.stack||error) } }).catch(()=>null);
    return json({ ok:false,read_only:true,recommendation_only:true,error:'Inventory / Reorder Economics could not be loaded.' },503);
  }
}
