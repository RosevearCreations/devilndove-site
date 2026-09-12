import assert from 'node:assert/strict';
import { buildInventoryMaterialUsageReconciliation, reconcileInventoryMaterialItem } from '../functions/api/_lib/inventoryMaterialUsageReconciliation.js';

const base={site_item_inventory_id:7,source_type:'supply',item_name:'Silver wire',on_hand_quantity:10,reserved_quantity:2,incoming_quantity:0,unit_cost_cents:500,stock_unit_label:'spool',usage_unit_label:'m',usage_units_per_stock_unit:10,usage_tracking_mode:'exact'};
const ready=reconcileInventoryMaterialItem(base,{reservationEvidence:{site_item_inventory_id:7,movement_reserved_delta:2,product_reserved_delta:2,reserve_release_events:2,product_reservation_events:2},productPlans:[{product_id:2,product_name:'Pendant',resource_kind:'supply',source_key:'wire',quantity_used:5,consumption_mode:'per_unit',lot_size_units:1,usage_units_per_stock_unit:10,usage_tracking_mode:'exact',unit_cost_cents:500}]});
assert.equal(ready.state,'ready');
assert.equal(ready.product_plans[0].stock_quantity_per_finished_unit,0.5);

const drift=reconcileInventoryMaterialItem({...base,reserved_quantity:4},{reservationEvidence:{movement_reserved_delta:1}});
assert.equal(drift.state,'review');
assert.ok(drift.issues.some(x=>x.code==='reservation_ledger_drift'));

const blocked=reconcileInventoryMaterialItem({...base,on_hand_quantity:1,reserved_quantity:2},{reservationEvidence:{movement_reserved_delta:2}});
assert.equal(blocked.state,'blocked');
assert.ok(blocked.issues.some(x=>x.code==='reservation_exceeds_on_hand'));

const creative=reconcileInventoryMaterialItem(base,{reservationEvidence:{movement_reserved_delta:2},creativeEvidence:[{creative_project_material_review_id:9,creative_work_project_id:1,creative_work_event_id:2,review_status:'approved',inventory_consumed:1,site_item_inventory_id:7}]});
assert.equal(creative.state,'blocked');
assert.ok(creative.issues.some(x=>x.code==='creative_consumed_without_post'));

const aggregate=buildInventoryMaterialUsageReconciliation({
  inventoryItems:[base],
  productLinks:[{product_id:2,product_name:'Pendant',resource_kind:'supply',source_key:'wire',site_item_inventory_id:7,quantity_used:5,consumption_mode:'per_unit',lot_size_units:1,usage_units_per_stock_unit:10,usage_tracking_mode:'exact',unit_cost_cents:500}],
  reservationEvidence:[{site_item_inventory_id:7,movement_reserved_delta:2,product_reserved_delta:2}],
  creativeEvidence:[],
  productUsageEvidence:[],
  kitTemplates:[{inventory_kit_template_id:3,template_name:'Soap kit',open_event_count:1,open_component_evidence_count:1}],
  kitComponents:[{inventory_kit_template_id:3,inventory_kit_template_component_id:4,component_inventory_item_id:7,component_name:'Wire',child_on_hand_quantity:10,child_reserved_quantity:2}],
});
assert.equal(aggregate.build,112);
assert.equal(aggregate.state,'ready');
assert.equal(aggregate.summary.inventory_item_count,1);
assert.equal(aggregate.safety.synthetic_stock_movement,false);
assert.equal(aggregate.evidence_rules.current_cost_owner,'site_item_inventory.unit_cost_cents');

const orphan=buildInventoryMaterialUsageReconciliation({inventoryItems:[base],productLinks:[{product_id:4,product_name:'Broken',resource_kind:'supply',source_key:'missing',site_item_inventory_id:null}],reservationEvidence:[{site_item_inventory_id:7,movement_reserved_delta:2}],kitTemplates:[],kitComponents:[]});
assert.equal(orphan.state,'blocked');
assert.equal(orphan.orphan_product_links.length,1);

console.log('Release 467 Build 112 Inventory & Material-Usage reconciliation tests: PASS');
