// Release 467 Build 112 — pure Inventory & Material-Usage reconciliation.
// This module derives review state only. It performs no reads, writes, provider calls, timers, or browser storage.
export const INVENTORY_MATERIAL_RECONCILIATION_STATES = Object.freeze(['ready','review','blocked']);
export const INVENTORY_MATERIAL_RECONCILIATION_BUILD = 112;
const EPSILON = 0.000001;

const number = (value, fallback=0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const id = (value) => {
  const n = Number(value || 0);
  return Number.isInteger(n) && n > 0 ? n : 0;
};
const text = (value) => String(value ?? '').trim();
const round6 = (value) => Number(number(value).toFixed(6));
const stateRank = Object.freeze({ ready:0, review:1, blocked:2 });
const maxState = (a='ready', b='ready') => stateRank[b] > stateRank[a] ? b : a;

function issue(code, state, detail, owner, href='') {
  return Object.freeze({ code, state, detail:text(detail), owner:text(owner), href:text(href) });
}

function groupBy(rows=[], keyFn=()=>0) {
  const out = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const key = keyFn(row);
    if (!out.has(key)) out.set(key, []);
    out.get(key).push(row);
  }
  return out;
}

function reservationEvidence(row={}) {
  return {
    movement_reserved_delta: round6(row.movement_reserved_delta || 0),
    product_reserved_delta: round6(row.product_reserved_delta || 0),
    reserve_release_events: Math.max(0, Math.trunc(number(row.reserve_release_events))),
    product_reservation_events: Math.max(0, Math.trunc(number(row.product_reservation_events))),
    last_reservation_event_at: row.last_reservation_event_at || null,
  };
}

function productPlan(row={}) {
  const mode = text(row.consumption_mode || 'per_unit').toLowerCase();
  const tracking = text(row.usage_tracking_mode || (text(row.resource_kind).toLowerCase()==='tool' ? 'reusable' : 'exact')).toLowerCase();
  const qty = Math.max(0, number(row.quantity_used));
  const lotSize = Math.max(1, number(row.lot_size_units, 1) || 1);
  const perStock = Math.max(EPSILON, number(row.usage_units_per_stock_unit, 1) || 1);
  const reservable = mode === 'per_unit' && ['exact','estimated'].includes(tracking) && text(row.resource_kind).toLowerCase() === 'supply';
  const stockPerFinished = mode === 'story_only' || ['reusable','log_only'].includes(tracking)
    ? 0
    : round6((mode === 'end_of_lot' ? qty / lotSize : qty) / perStock);
  return Object.freeze({
    product_id:id(row.product_id),
    product_name:text(row.product_name || row.name || `Product ${row.product_id || ''}`),
    product_status:text(row.product_status || row.status),
    resource_kind:text(row.resource_kind).toLowerCase(),
    source_key:text(row.source_key),
    consumption_mode:mode,
    tracking_mode:tracking,
    quantity_used:qty,
    lot_size_units:lotSize,
    stock_quantity_per_finished_unit:stockPerFinished,
    reservation_expected:reservable,
    current_cost_cents:Math.max(0, Math.round(number(row.unit_cost_cents))),
    estimated_cost_per_finished_cents:Math.max(0, Math.round(number(row.unit_cost_cents) * stockPerFinished)),
  });
}

function creativeEvidence(row={}) {
  return Object.freeze({
    creative_project_material_review_id:id(row.creative_project_material_review_id),
    creative_work_project_id:id(row.creative_work_project_id),
    creative_work_event_id:id(row.creative_work_event_id),
    review_status:text(row.review_status).toLowerCase(),
    inventory_consumed:Number(row.inventory_consumed || 0) === 1,
    creative_project_inventory_post_id:id(row.creative_project_inventory_post_id) || null,
    usage_detail_id:id(row.creative_project_inventory_usage_detail_id) || null,
    usage_quantity_consumed:Math.max(0, number(row.usage_quantity_consumed)),
    stock_quantity_consumed:Math.max(0, number(row.stock_quantity_consumed)),
    tracking_mode:text(row.posted_tracking_mode || row.tracking_mode).toLowerCase(),
    posted_at:row.posted_at || null,
  });
}

function productUsageEvidence(row={}) {
  return Object.freeze({
    product_production_run_id:id(row.product_production_run_id),
    product_id:id(row.product_id),
    product_name:text(row.product_name),
    run_status:text(row.run_status).toLowerCase(),
    output_quantity:Math.max(0, number(row.output_quantity)),
    posted_at:row.posted_at || null,
    resource_kind:text(row.resource_kind).toLowerCase(),
    source_key:text(row.source_key),
    consumption_mode:text(row.consumption_mode).toLowerCase(),
    tracking_mode:text(row.tracking_mode).toLowerCase(),
    usage_quantity:Math.max(0, number(row.usage_quantity)),
    stock_quantity_consumed:Math.max(0, number(row.stock_quantity_consumed)),
    unit_cost_cents:Math.max(0, Math.round(number(row.unit_cost_cents))),
    recorded_material_cost_cents:Math.max(0, Math.round(number(row.unit_cost_cents) * number(row.stock_quantity_consumed))),
  });
}

function kitComponentEvidence(row={}) {
  const childId=id(row.component_inventory_item_id);
  const onHand=Math.max(0, number(row.child_on_hand_quantity));
  const reserved=Math.max(0, number(row.child_reserved_quantity));
  return Object.freeze({
    inventory_kit_template_id:id(row.inventory_kit_template_id),
    inventory_kit_template_component_id:id(row.inventory_kit_template_component_id),
    template_name:text(row.template_name),
    component_inventory_item_id:childId || null,
    component_name:text(row.component_name || row.child_item_name),
    quantity_per_kit:Math.max(0, number(row.quantity_per_kit)),
    child_on_hand_quantity:onHand,
    child_reserved_quantity:reserved,
    child_available_quantity:round6(Math.max(0, onHand-reserved)),
    current_component_balance_is_aggregate_not_origin_attribution:true,
  });
}

export function reconcileInventoryMaterialItem(item={}, context={}) {
  const inventoryId=id(item.site_item_inventory_id);
  const onHand=Math.max(0, number(item.on_hand_quantity));
  const reserved=Math.max(0, number(item.reserved_quantity));
  const incoming=Math.max(0, number(item.incoming_quantity));
  const available=round6(Math.max(0, onHand-reserved));
  const currentCost=Math.max(0, Math.round(number(item.unit_cost_cents)));
  const tracking=text(item.usage_tracking_mode || (text(item.source_type).toLowerCase()==='tool'?'reusable':'exact')).toLowerCase();
  const inventoryClass=text(item.inventory_class);
  const productPlans=(context.productPlans || []).map(productPlan);
  const creativeRows=(context.creativeEvidence || []).map(creativeEvidence);
  const productUsage=(context.productUsageEvidence || []).map(productUsageEvidence);
  const kitComponents=(context.kitComponents || []).map(kitComponentEvidence);
  const reservation=reservationEvidence(context.reservationEvidence || {});
  const issues=[];
  let state='ready';

  const add=(value)=>{ issues.push(value); state=maxState(state,value.state); };

  if (reserved > onHand + EPSILON) {
    add(issue('reservation_exceeds_on_hand','blocked',`Reserved ${reserved} exceeds on-hand ${onHand}.`,'Inventory','/admin/inventory-operations/'));
  }
  if (Math.abs(reservation.movement_reserved_delta - reserved) > 0.0001) {
    add(issue('reservation_ledger_drift','review',`Current reserved quantity is ${reserved}, while reserve/release movement evidence nets to ${reservation.movement_reserved_delta}. Do not invent attribution; review movement provenance.`,'Inventory','/admin/inventory-operations/'));
  }

  for (const plan of productPlans) {
    if (!inventoryId) continue;
    if (plan.reservation_expected && plan.stock_quantity_per_finished_unit > available + EPSILON) {
      add(issue('planned_product_shortage','blocked',`${plan.product_name} needs about ${plan.stock_quantity_per_finished_unit} stock unit(s) per finished unit but only ${available} is currently unreserved.`,'Product / Inventory','/admin/inventory-operations/'));
    }
  }

  for (const evidence of creativeRows) {
    if (evidence.inventory_consumed && !evidence.creative_project_inventory_post_id) {
      add(issue('creative_consumed_without_post','blocked',`Creative review ${evidence.creative_project_material_review_id} is marked consumed but has no Inventory posting record.`,'Creator / Inventory','/admin/creator/'));
    }
    if (evidence.creative_project_inventory_post_id && !evidence.usage_detail_id) {
      add(issue('creative_post_without_usage_detail','review',`Creative Inventory post ${evidence.creative_project_inventory_post_id} has no detailed usage-unit evidence.`,'Inventory','/admin/inventory-operations/'));
    }
    if (['reusable','log_only'].includes(evidence.tracking_mode) && evidence.stock_quantity_consumed > EPSILON) {
      add(issue('creative_reusable_stock_depletion','blocked',`Creative posting ${evidence.creative_project_inventory_post_id} depleted stock while tracking mode is ${evidence.tracking_mode}.`,'Inventory','/admin/inventory-operations/'));
    }
  }

  for (const evidence of productUsage) {
    if (['reusable','log_only'].includes(evidence.tracking_mode) && evidence.stock_quantity_consumed > EPSILON) {
      add(issue('product_reusable_stock_depletion','blocked',`Product production run ${evidence.product_production_run_id} depleted reusable/log-only stock.`,'Product / Inventory','/admin/inventory-operations/'));
    }
  }

  const hasMeasuredUsage = creativeRows.some(row=>row.stock_quantity_consumed>EPSILON)
    || productUsage.some(row=>row.stock_quantity_consumed>EPSILON)
    || productPlans.some(row=>row.stock_quantity_per_finished_unit>EPSILON);
  if (hasMeasuredUsage && !['reusable','log_only'].includes(tracking) && currentCost <= 0) {
    add(issue('current_cost_authority_missing','review','Measured material usage exists but the current Inventory cost authority is zero. Cost history is evidence only; set or review the Inventory cost through its owner.','Inventory / Finance','/admin/inventory-operations/'));
  }

  for (const component of kitComponents) {
    if (!component.component_inventory_item_id) {
      add(issue('kit_component_unlinked','blocked',`Kit component ${component.component_name || component.inventory_kit_template_component_id} has no child Inventory identity.`,'Inventory Kits','/admin/inventory-operations/'));
    }
  }

  return Object.freeze({
    site_item_inventory_id:inventoryId,
    source_type:text(item.source_type).toLowerCase(),
    external_key:text(item.external_key),
    item_name:text(item.item_name),
    category:text(item.category),
    inventory_class:inventoryClass,
    tracking_mode:tracking,
    stock_unit_label:text(item.stock_unit_label || 'unit'),
    usage_unit_label:text(item.usage_unit_label || 'unit'),
    on_hand_quantity:onHand,
    reserved_quantity:reserved,
    incoming_quantity:incoming,
    available_quantity:available,
    current_unit_cost_cents:currentCost,
    current_inventory_value_cents:Math.max(0, Math.round(currentCost*onHand)),
    reservation_evidence:reservation,
    product_plans:Object.freeze(productPlans),
    creative_usage_evidence:Object.freeze(creativeRows),
    product_usage_evidence:Object.freeze(productUsage),
    kit_component_evidence:Object.freeze(kitComponents),
    issues:Object.freeze(issues),
    state,
  });
}

export function buildInventoryMaterialUsageReconciliation(input={}) {
  const items=Array.isArray(input.inventoryItems)?input.inventoryItems:[];
  const productByItem=groupBy(input.productLinks, row=>id(row.site_item_inventory_id));
  const creativeByItem=groupBy(input.creativeEvidence, row=>id(row.site_item_inventory_id));
  const productUsageByItem=groupBy(input.productUsageEvidence, row=>id(row.site_item_inventory_id));
  const kitByItem=groupBy(input.kitComponents, row=>id(row.component_inventory_item_id));
  const reservationByItem=new Map((Array.isArray(input.reservationEvidence)?input.reservationEvidence:[]).map(row=>[id(row.site_item_inventory_id),row]));

  const records=items.map(item=>reconcileInventoryMaterialItem(item,{
    productPlans:productByItem.get(id(item.site_item_inventory_id)) || [],
    creativeEvidence:creativeByItem.get(id(item.site_item_inventory_id)) || [],
    productUsageEvidence:productUsageByItem.get(id(item.site_item_inventory_id)) || [],
    kitComponents:kitByItem.get(id(item.site_item_inventory_id)) || [],
    reservationEvidence:reservationByItem.get(id(item.site_item_inventory_id)) || {},
  }));

  const orphanProductLinks=(Array.isArray(input.productLinks)?input.productLinks:[]).filter(row=>!id(row.site_item_inventory_id)).map(row=>Object.freeze({
    state:'blocked', code:'product_resource_missing_inventory', product_id:id(row.product_id), product_name:text(row.product_name), source_key:text(row.source_key),
    detail:'Product material/resource link has no active Inventory identity.', owner:'Product / Inventory'
  }));
  const kitOpenIssues=(Array.isArray(input.kitTemplates)?input.kitTemplates:[]).filter(row=>number(row.open_event_count)>0 && number(row.open_component_evidence_count)<=0).map(row=>Object.freeze({
    state:'blocked', code:'kit_open_missing_component_evidence', inventory_kit_template_id:id(row.inventory_kit_template_id),
    template_name:text(row.template_name), detail:'Kit opening history exists without component provenance evidence.', owner:'Inventory Kits'
  }));
  const missingKitLinks=(Array.isArray(input.kitComponents)?input.kitComponents:[]).filter(row=>!id(row.component_inventory_item_id)).map(row=>Object.freeze({
    state:'blocked', code:'kit_component_missing_inventory', inventory_kit_template_id:id(row.inventory_kit_template_id),
    component_name:text(row.component_name), detail:'Kit template component has no linked Inventory identity.', owner:'Inventory Kits'
  }));

  const exceptionCount=records.reduce((sum,row)=>sum+row.issues.length,0)+orphanProductLinks.length+kitOpenIssues.length+missingKitLinks.length;
  const blockedCount=records.filter(row=>row.state==='blocked').length+orphanProductLinks.length+kitOpenIssues.length+missingKitLinks.length;
  const reviewCount=records.filter(row=>row.state==='review').length;
  const state=blockedCount?'blocked':reviewCount?'review':'ready';

  return Object.freeze({
    release:467,
    build:112,
    title:'Inventory & Material-Usage Reconciliation',
    state,
    summary:Object.freeze({
      inventory_item_count:records.length,
      ready_item_count:records.filter(row=>row.state==='ready').length,
      review_item_count:records.filter(row=>row.state==='review').length,
      blocked_item_count:records.filter(row=>row.state==='blocked').length,
      exception_count:exceptionCount,
      product_link_count:Array.isArray(input.productLinks)?input.productLinks.length:0,
      creative_usage_evidence_count:Array.isArray(input.creativeEvidence)?input.creativeEvidence.length:0,
      product_usage_evidence_count:Array.isArray(input.productUsageEvidence)?input.productUsageEvidence.length:0,
      kit_template_count:Array.isArray(input.kitTemplates)?input.kitTemplates.length:0,
      kit_component_count:Array.isArray(input.kitComponents)?input.kitComponents.length:0,
    }),
    records:Object.freeze(records),
    orphan_product_links:Object.freeze(orphanProductLinks),
    kit_open_issues:Object.freeze(kitOpenIssues),
    missing_kit_links:Object.freeze(missingKitLinks),
    evidence_rules:Object.freeze({
      inventory_owner:'site_item_inventory + Inventory lifecycle/movement ledgers',
      reservation_owner:'Build 71 Inventory lifecycle; aggregate reserved quantity is never synthesized into product-specific ownership',
      creative_consumption_owner:'Build 309 Inventory post + existing Inventory reverse authority',
      product_consumption_owner:'Build 440 product production run/material/lot evidence',
      kit_owner:'Build 440 kit open/component provenance',
      current_cost_owner:'site_item_inventory.unit_cost_cents',
      cost_history_role:'optional evidence only',
      kit_remnant_rule:'child Inventory balance is aggregate remnant evidence, not origin-specific attribution',
    }),
    safety:Object.freeze({
      existing_inventory_post_reverse_authorities_preserved:true,
      existing_product_production_authority_preserved:true,
      existing_kit_open_and_component_use_authority_preserved:true,
      existing_product_reservation_authority_preserved:true,
      synthetic_stock_movement:false,
      inventory_mutation:false,
      product_mutation:false,
      creative_mutation:false,
      finance_posting:false,
      provider_execution:false,
      request_time_schema_mutation:false,
    }),
  });
}
