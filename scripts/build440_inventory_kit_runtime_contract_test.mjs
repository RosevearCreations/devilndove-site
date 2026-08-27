#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const { openInventoryKit, consumeKitComponent }=await import(pathToFileURL(path.join(root,'functions/api/_lib/inventoryKitService.js')).href);

function placeholderCount(sql){
  let count=0,state='normal';
  for(let i=0;i<sql.length;i++){
    const ch=sql[i],next=sql[i+1]||'';
    if(state==='single'){if(ch==="'"){if(next==="'"){i++;}else state='normal';}continue;}
    if(state==='double'){if(ch==='"'){if(next==='"'){i++;}else state='normal';}continue;}
    if(state==='line'){if(ch==='\n')state='normal';continue;}
    if(state==='block'){if(ch==='*'&&next==='/'){state='normal';i++;}continue;}
    if(ch==="'"){state='single';continue;} if(ch==='"'){state='double';continue;}
    if(ch==='-'&&next==='-'){state='line';i++;continue;} if(ch==='/'&&next==='*'){state='block';i++;continue;}
    if(ch==='?')count++;
  }
  return count;
}

class Statement{
  constructor(db,sql){this.db=db;this.sql=sql;this.bindings=[];}
  bind(...args){const expected=placeholderCount(this.sql);if(expected!==args.length)throw new Error(`Bind mismatch: expected ${expected}, got ${args.length}: ${this.sql.slice(0,180)}`);this.bindings=args;return this;}
  async first(){return this.db.first(this.sql,this.bindings);}
  async all(){return {results:await this.db.all(this.sql,this.bindings)};}
  async run(){this.db.runs.push(this);return {meta:{changes:1,last_row_id:++this.db.lastId}};}
}
class FakeD1{
  constructor(){this.batches=[];this.runs=[];this.lastId=100;}
  prepare(sql){return new Statement(this,sql);}
  async batch(statements){for(const stmt of statements){if(!(stmt instanceof Statement))throw new Error('Non-statement passed to batch');}this.batches.push(statements);return statements.map(()=>({meta:{changes:1}}));}
  async first(sql,b){
    if(sql.includes('FROM inventory_kit_templates t JOIN site_item_inventory s'))return {inventory_kit_template_id:7,kit_inventory_item_id:1,template_name:'Candle Kit',allocation_method:'equal',item_name:'Candle Making Kit',source_type:'supply',external_key:'kit-parent',on_hand_quantity:3,reserved_quantity:0,incoming_quantity:0,unit_cost_cents:3000,stock_unit_label:'kit',supplier_name:'Kit Supplier',supplier_sku:'KIT-1',source_url:'https://example.test/kit'};
    if(sql.includes('SELECT * FROM site_item_inventory WHERE site_item_inventory_id=? LIMIT 1')){
      const itemId=Number(b[0]);
      if(itemId===2)return {site_item_inventory_id:2,source_type:'supply',external_key:'wax',item_name:'Wax',on_hand_quantity:4,reserved_quantity:0,incoming_quantity:0,unit_cost_cents:500,stock_unit_label:'kg',usage_unit_label:'g',usage_units_per_stock_unit:1000,supplier_sku:'WAX'};
      if(itemId===3)return {site_item_inventory_id:3,source_type:'tool',external_key:'thermometer',item_name:'Thermometer',on_hand_quantity:1,reserved_quantity:0,incoming_quantity:0,unit_cost_cents:1000,stock_unit_label:'unit',usage_unit_label:'use',usage_units_per_stock_unit:1,do_not_reuse:0};
    }
    if(sql.includes('FROM inventory_lot_policies WHERE site_item_inventory_id=?'))return {site_item_inventory_id:Number(b[0]),depletion_method:'fifo',reconcile_status:'reconciled',last_reconciled_quantity:10,last_reconciled_at:'2026-08-27'};
    if(sql.includes('FROM inventory_kit_template_components c JOIN inventory_kit_templates t')){
      const componentId=Number(b[0]);
      if(componentId===12)return {inventory_kit_template_component_id:12,inventory_kit_template_id:7,component_inventory_item_id:3,component_name:'Thermometer',template_name:'Candle Kit',site_item_inventory_id:3,source_type:'tool',external_key:'thermometer',item_name:'Thermometer',on_hand_quantity:1,reserved_quantity:0,incoming_quantity:0,stock_unit_label:'unit',usage_unit_label:'use',usage_units_per_stock_unit:1,do_not_reuse:0,usage_tracking_mode:'exact',minimum_usage_increment:1};
      return {inventory_kit_template_component_id:11,inventory_kit_template_id:7,component_inventory_item_id:2,component_name:'Wax',template_name:'Candle Kit',site_item_inventory_id:2,source_type:'supply',external_key:'wax',item_name:'Wax',on_hand_quantity:5,reserved_quantity:0,incoming_quantity:0,stock_unit_label:'kg',usage_unit_label:'g',usage_units_per_stock_unit:1000,do_not_reuse:0,usage_tracking_mode:'exact',minimum_usage_increment:1};
    }
    return null;
  }
  async all(sql,b){
    if(sql.includes('FROM inventory_kit_template_components WHERE inventory_kit_template_id=?'))return [
      {inventory_kit_template_component_id:11,inventory_kit_template_id:7,component_inventory_item_id:2,component_name:'Wax',component_source_type:'supply',component_category:'wax',quantity_per_kit:1,stock_unit_label:'kg',usage_unit_label:'g',usage_units_per_stock_unit:1000,usage_tracking_mode:'exact',inventory_class:'raw_material',cost_share_percent:0,supplier_sku:'WAX',sort_order:1},
      {inventory_kit_template_component_id:12,inventory_kit_template_id:7,component_inventory_item_id:3,component_name:'Thermometer',component_source_type:'tool',quantity_per_kit:1,stock_unit_label:'unit',usage_unit_label:'use',usage_units_per_stock_unit:1,usage_tracking_mode:'exact',inventory_class:'reusable_equipment',cost_share_percent:0,sort_order:2},
    ];
    if(sql.includes('FROM inventory_purchase_lots WHERE site_item_inventory_id=?')){
      const itemId=Number(b[0]);
      return [{inventory_purchase_lot_id:itemId===1?101:102,site_item_inventory_id:itemId,lot_code:itemId===1?'KIT-PARENT-LOT':'WAX-LOT',purchase_date:'2026-08-01',received_date:'2026-08-02',supplier_name:'Supplier',supplier_sku:'SKU',source_url:'https://example.test',quantity_received:10,quantity_remaining:itemId===1?3:5,unit_cost_cents:itemId===1?3000:500,shipping_cost_cents:0,tax_cost_cents:0,expiry_date:null,lot_status:'available'}];
    }
    return [];
  }
}

const checks=[];function check(ok,label){if(!ok)throw new Error(label);checks.push(label);console.log(`${String(checks.length).padStart(2,'0')}. PASS — ${label}`);}
console.log('BUILD 440 KIT D1 RUNTIME CONTRACT TEST');console.log('Remote access: NONE\n');
const db=new FakeD1();const admin={user_id:1};
const opened=await openInventoryKit(db,admin,{inventory_kit_template_id:7,kit_quantity_opened:1,note:'Runtime contract opening'});
check(opened.component_count===2 && opened.parent_lot_allocations.length===1,'kit opening plans exact parent lot allocation');
check(db.batches.length===1,'linked-component kit opening is one atomic stock transaction');
const openStatements=db.batches[0];
const openBatch=openStatements.map(s=>s.sql).join('\n');
const openBindings=openStatements.flatMap(s=>s.bindings);
check(openBatch.includes('UPDATE inventory_purchase_lots') && openBatch.includes('INSERT INTO inventory_purchase_lots') && openBindings.some(v=>String(v).startsWith('KIT-B440-')),'opening batch depletes parent lot and creates parameter-bound child Supply lot');
check(openBatch.includes('inventory_kit_open_events') && openBatch.includes('inventory_kit_open_components'),'opening batch includes provenance event and component evidence');
check(openBatch.includes('site_inventory_movements'),'opening batch includes parent/child Inventory movement evidence');

const beforeConsumeBatches=db.batches.length;
const consumed=await consumeKitComponent(db,admin,{inventory_kit_template_component_id:11,usage_quantity:250,note:'Runtime contract wax use'});
check(consumed.plan.stock_quantity===0.25 && consumed.lot_allocations.length===1,'Supply component use converts and allocates exact purchase lot');
check(db.batches.length===beforeConsumeBatches+1,'Supply component stock change is one atomic D1 batch');
const consumeBatch=db.batches.at(-1).map(s=>s.sql).join('\n');
check(consumeBatch.includes('UPDATE inventory_purchase_lots') && consumeBatch.includes('site_inventory_usage_movements'),'Supply component batch contains lot depletion and usage evidence');

const batchesBeforeTool=db.batches.length,runsBeforeTool=db.runs.length;
const toolUse=await consumeKitComponent(db,admin,{inventory_kit_template_component_id:12,usage_quantity:1,note:'Runtime contract reusable use'});
check(toolUse.plan.tracking_mode==='reusable' && toolUse.plan.stock_quantity===0,'Tool component is forced reusable even when stale template/profile says exact');
check(db.batches.length===batchesBeforeTool && db.runs.length===runsBeforeTool+1,'Reusable Tool use writes usage evidence without stock-changing batch');
console.log(`\nBUILD 440 KIT D1 RUNTIME CONTRACT TEST: PASS (${checks.length}/${checks.length})`);
