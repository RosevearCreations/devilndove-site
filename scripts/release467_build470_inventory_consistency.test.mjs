import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reviewInventoryItems470} from '../public/js/inventory-consistency-policy-470.mjs';
import {validateInventoryMutationSource470} from '../functions/api/_lib/inventorySourceValidation470.js';
import {planInventoryUsage} from '../functions/api/_lib/inventoryUnitConversion.js';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const sample=(extra={})=>({site_item_inventory_id:17,item_name:'Wax',source_type:'supply',stock_unit_label:'kilogram',usage_unit_label:'gram',
 usage_units_per_stock_unit:1000,on_hand_quantity:2,reserved_quantity:.5,unit_cost_cents:3000,
 workstation_role:'associated',workstation_site_item_inventory_ids:[21,22],current_location_site_item_inventory_id:21,
 source_url:'https://vendor.example/item',usage_tracking_mode:'exact',...extra});
const codes=row=>row.issues.map(x=>x.code);

test('Build 470 observes a correct 1 kg / 1000 g package without changing the stock engine',()=>{
 const r=reviewInventoryItems470([sample()],{page:3,totalPages:27}),row=r.rows[0];
 assert.equal(r.reviewedRows,1);assert.equal(r.page,3);assert.equal(r.totalPages,27);
 assert.equal(row.availableStock,1.5);assert.equal(row.estimatedCostPerUsageCents,3);
 assert.deepEqual(row.stationIds,[21,22]);assert.equal(row.currentLocationId,21);
 assert.ok(!codes(row).includes('REVIEW_STANDARD_CONVERSION'));
 assert.ok(codes(row).includes('HOLD_ORIGINAL_COST_RECEIPT'));
 assert.ok(codes(row).includes('HOLD_ACTUAL_USE_EVIDENCE'));
 assert.equal(r.automaticStockAdjustment,false);assert.equal(r.ownerAccepted,false);
 const plan=planInventoryUsage(sample({minimum_usage_increment:5}),250);
 assert.equal(plan.purchase_quantity_consumed,.25);
 assert.equal(plan.new_on_hand_quantity,1.75);
 assert.equal(plan.available_base_quantity,1500);
});

test('Standard conversion mismatch or custom pack count is a review, not an auto correction',()=>{
 const r=reviewInventoryItems470([sample({usage_units_per_stock_unit:250}),sample({site_item_inventory_id:18,stock_unit_label:'piece',usage_unit_label:'piece',usage_units_per_stock_unit:12})]);
 assert.ok(codes(r.rows[0]).includes('REVIEW_STANDARD_CONVERSION'));
 assert.ok(codes(r.rows[1]).includes('REVIEW_SAME_UNIT_PACKAGE'));
 assert.equal(r.rows[0].unitsPerStock,250);
});

test('Reject illogical stock, membership and location observations without mutating records',()=>{
 const r=reviewInventoryItems470([sample({on_hand_quantity:1,reserved_quantity:2,workstation_site_item_inventory_ids:[17,21,21],current_location_site_item_inventory_id:17,
  usage_units_per_stock_unit:0})]);
 const c=codes(r.rows[0]);
 for(const item of ['HOLD_RESERVATION_GT_STOCK','HOLD_DUPLICATE_STATION_ID','HOLD_STATION_SELF_REFERENCE','HOLD_LOCATION_SELF_REFERENCE','HOLD_CONVERSION_FACTOR'])assert.ok(c.includes(item),item);
 assert.equal(r.rows[0].estimatedCostPerUsageCents,null);
 assert.equal(r.automaticWorkstationRewrite,false);
});

test('Tools must remain reusable; one real Tool can belong to multiple stations without losing stock',()=>{
 const tool=sample({source_type:'tool',stock_unit_label:'tool',usage_unit_label:'use',usage_units_per_stock_unit:1,
  usage_tracking_mode:'reusable',on_hand_quantity:1,reserved_quantity:0,unit_cost_cents:5000});
 const plan=planInventoryUsage(tool,3);
 assert.equal(plan.tracking_mode,'reusable');assert.equal(plan.purchase_quantity_consumed,0);assert.equal(plan.new_on_hand_quantity,1);
 assert.deepEqual(reviewInventoryItems470([tool]).rows[0].stationIds,[21,22]);
 const bad=reviewInventoryItems470([tool,{...tool,site_item_inventory_id:18,source_type:'supply',workstation_role:'station'}]);
 assert.ok(codes(bad.rows[1]).includes('HOLD_STATION_MUST_BE_TOOL'));
});

test('Unreviewed source receipts and movement history remain HOLD even with a supplier URL',()=>{
 const r=reviewInventoryItems470([sample({source_url:'https://vendor.example/any',amazon_url:'https://amazon.ca/any'})]);
 assert.equal(r.rows[0].hasSupplierSource,true);
 assert.equal(r.sourceReceiptsVerified,false);
 assert.equal(r.actualUseReceiptsVerified,false);
 assert.ok(codes(r.rows[0]).includes('HOLD_ORIGINAL_COST_RECEIPT'));
});

test('Build 470 rejects invalid unit edits before legacy coercion and DB writes',()=>{
 for(const invalid of [
  {usage_units_per_stock_unit:0},{usage_units_per_stock_unit:-2},{usage_units_per_stock_unit:'NaN'},
  {usage_units_per_stock_unit:''},{minimum_usage_increment:0},{stock_unit_label:'   '},
  {unit_cost_cents:-1},{unit_cost_cents:12.4},{workstation_site_item_inventory_ids:[21,21]},
  {workstation_site_item_inventory_ids:[0]},{workstation_site_item_inventory_ids:'21'}
 ])assert.equal(validateInventoryMutationSource470(invalid).ok,false,JSON.stringify(invalid));
 assert.equal(validateInventoryMutationSource470({usage_units_per_stock_unit:1000,stock_unit_label:'kilogram',usage_unit_label:'gram',
  on_hand_quantity:2,reserved_quantity:.5,unit_cost_cents:3000,workstation_site_item_inventory_ids:[]}).ok,true);
 assert.equal(validateInventoryMutationSource470({action:'consume_usage',site_item_inventory_id:17,quantity:250}).ok,true);
});

test('Existing station clear and validation are wired into both UI and API; no background reads',()=>{
 const main=read('public/js/admin-site-item-inventory.js'),multi=read('public/js/admin-site-item-inventory-multistation.js');
 const api=read('functions/api/admin/site-item-inventory.js'),page=read('admin/inventory-operations/index.html'),adapter=read('public/js/admin-inventory-consistency-470.js');
 assert.match(main,/if \(scope\?\.querySelector\?\.\('\.dd-multistation-checklist'\)\) return ids/);
 assert.match(main,/validateInventoryUnitInputs470\(row, true\)/);
 assert.match(main,/validateInventoryUnitInputs470\(document\.getElementById\('siteInventoryForm'\)\)/);
 assert.match(multi,/selectionTouched/);
 assert.match(api,/validateInventoryMutationSource470\(body\)/);
 assert.match(page,/admin-inventory-consistency-470\.js/);
 assert.match(adapter,/siteInventoryList/);
 assert.doesNotMatch(adapter,/\bfetch\s*\(|apiFetch\(|apiJson\(|XMLHttpRequest/);
});
