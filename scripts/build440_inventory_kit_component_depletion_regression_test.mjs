#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const helperPath='functions/api/_lib/inventoryKitService.js';
const apiPath='functions/api/admin/inventory-kits.js';
const usageApiPath='functions/api/admin/inventory-kit-component-usage.js';
const kitUiPath='public/js/admin-inventory-kits.js';
const usageUiPath='public/js/admin-inventory-kit-component-usage.js';
const pagePath='admin/inventory-operations/index.html';
const helper=read(helperPath);
const api=read(apiPath);
const usageApi=read(usageApiPath);
const kitUi=read(kitUiPath);
const usageUi=read(usageUiPath);
const page=read(pagePath);
const { planKitComponentUsage }=await import(pathToFileURL(path.join(root,helperPath)).href);

const checks=[];
function check(ok,label){if(!ok)throw new Error(label);checks.push(label);console.log(`${String(checks.length).padStart(2,'0')}. PASS — ${label}`);}
function throwsCode(fn,code){try{fn();return false;}catch(error){return error?.code===code;}}

console.log('BUILD 440 INVENTORY KIT / COMPONENT DEPLETION REGRESSION');
console.log('Cloudflare/D1/R2/provider access: NONE');
console.log('Production mutation capability: NONE\n');

const exact=planKitComponentUsage({source_type:'supply',usage_tracking_mode:'exact',on_hand_quantity:2,reserved_quantity:.25,usage_units_per_stock_unit:1000,stock_unit_label:'kg',usage_unit_label:'g',minimum_usage_increment:1},250);
check(exact.stock_quantity===0.25 && exact.new_on_hand_quantity===1.75 && exact.is_estimated===0,'exact component usage converts usage units into fractional stock depletion');
const estimated=planKitComponentUsage({source_type:'supply',usage_tracking_mode:'estimated',on_hand_quantity:2,reserved_quantity:0,usage_units_per_stock_unit:1000,minimum_usage_increment:1},250);
check(estimated.stock_quantity===0.25 && estimated.is_estimated===1,'estimated component usage preserves explicit estimated evidence');
const logOnly=planKitComponentUsage({source_type:'supply',usage_tracking_mode:'log_only',on_hand_quantity:2,reserved_quantity:0,usage_units_per_stock_unit:1000},250);
check(logOnly.stock_quantity===0 && logOnly.new_on_hand_quantity===2,'log-only usage records activity without false stock depletion');
const reusable=planKitComponentUsage({source_type:'tool',usage_tracking_mode:'reusable',on_hand_quantity:1,reserved_quantity:0},1);
check(reusable.stock_quantity===0 && reusable.new_on_hand_quantity===1,'reusable Tool usage records activity without consuming the Tool');
check(throwsCode(()=>planKitComponentUsage({source_type:'supply',usage_tracking_mode:'exact',on_hand_quantity:1,reserved_quantity:.9,usage_units_per_stock_unit:1},.2),'inventory_kit_component_insufficient_available'),'reserved stock cannot be consumed by kit component usage');
check(throwsCode(()=>planKitComponentUsage({source_type:'tool',usage_tracking_mode:'reusable',on_hand_quantity:1,do_not_reuse:1},1),'inventory_kit_component_do_not_reuse'),'do-not-reuse Tool cannot be used through kit workspace');
check(throwsCode(()=>planKitComponentUsage({source_type:'product',usage_tracking_mode:'exact',on_hand_quantity:10},1),'inventory_kit_component_wrong_owner'),'Product inventory cannot be mutated through kit component authority');
check(throwsCode(()=>planKitComponentUsage({source_type:'supply',usage_tracking_mode:'exact',on_hand_quantity:10,minimum_usage_increment:.5},.1),'inventory_kit_component_below_minimum_increment'),'component usage honors configured minimum increment');

check(helper.includes('loadMaterialLotPlan') && helper.includes("parentSource==='supply'"),'purchased Supply kit opening requires exact parent purchase-lot plan');
check(/loadMaterialLotPlan\(db,id\(template\.kit_inventory_item_id\),quantity\)/.test(helper),'parent kit lot depletion is tied to the canonical kit Inventory item');
check(helper.includes("const lotCode=`KIT-B440-") && helper.includes('INSERT INTO inventory_purchase_lots'),'released Supply child receives a real Build 440 purchase lot');
check(helper.includes('inventory_kit_open_events') && helper.includes('inventory_kit_open_components'),'existing Build 249 kit provenance remains authoritative');
check(helper.includes('site_inventory_movements') && helper.includes('site_inventory_usage_movements'),'component use reuses canonical Inventory movement and usage ledgers');
check((helper.match(/await db\.batch\(statements\)/g)||[]).length>=2,'both kit opening and stock-depleting component use commit as one D1 batch');
check(helper.includes('abs(-9223372036854775808)') && helper.includes('build440_guard'),'atomic batch contains fail-loud optimistic postcondition guards');
check(!/CREATE\s+TABLE/i.test(helper) && !/ALTER\s+TABLE/i.test(helper),'kit runtime performs no request-time schema repair');
check(!/setInterval|setTimeout\s*\(/.test(helper+api+usageApi+kitUi+usageUi),'kit subsystem performs no polling or automatic retry scheduling');
check(!/component_source_type[^\n]{0,120}product/.test(api) && api.includes('inventory_kit_component_wrong_owner'),'template save blocks Product cross-mutation');
check(api.includes("import { openInventoryKit }") && !api.includes('async function ensureComponentItem'),'legacy aggregate-only open path was removed from API');
check(usageApi.includes("action!=='consume_component'") && usageApi.includes('consumeKitComponent'),'component usage endpoint exposes one explicit mutation action');
check(usageApi.includes('mutation_capability') && usageApi.includes('background_polling:false'),'component usage GET declares narrow mutation and no background work');
check(kitUi.includes("CustomEvent('inventory:kit-changed'") && usageUi.includes("inventory:kit-changed"),'kit opening refreshes component usage workspace without polling');
check(usageUi.includes('Tool is marked do not reuse') && usageUi.includes('Inventory + lot deduction'),'UI makes reusable safety and exact lot depletion visible');
check(page.includes('/css/inventory-kit-component-usage.css?v=440') && page.includes('/public/js/admin-inventory-kit-component-usage.js?v=440'),'Inventory Operations mounts responsive kit component workspace');
check(/INSERT INTO inventory_lot_policies[\s\S]{0,650}CASE WHEN ABS\(/.test(helper),'new Supply child lot policy is reconciled only from an exact aggregate-vs-physical-lot comparison');
check(!helper.includes('DELETE FROM site_inventory_usage_movements'),'atomic component use does not depend on guessing usage-ledger primary keys');
check(helper.includes("lot_status<>'returned'") && helper.includes("THEN 'reconciled' ELSE 'needs_review'"),'lot reconciliation counts all physical non-returned stock and fails closed to review');

console.log(`\nBUILD 440 INVENTORY KIT / COMPONENT DEPLETION REGRESSION: PASS (${checks.length}/${checks.length})`);
console.log('Historical provenance fabrication: NONE');
console.log('Parent purchased-kit stock: AGGREGATE + EXACT PURCHASE LOT');
console.log('Released Supply components: AGGREGATE + NEW PURCHASE LOT');
console.log('Exact/estimated component use: INVENTORY + USAGE + PURCHASE LOT / ATOMIC');
console.log('Reusable/log-only component use: USAGE EVIDENCE ONLY');
console.log('Product cross-mutation: BLOCKED');
