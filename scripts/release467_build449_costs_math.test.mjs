import test from 'node:test';
import assert from 'node:assert/strict';
import {projectCostProjection} from '../functions/api/admin/_lib/projectCosting.mjs';
const extras={packaging_cents:300,consumables_cents:100,rework_cents:0,finishing_cents:0,outside_service_cents:0};

test('good one-off compares reviewed plan, real materials, labour and machine with optional CAD margin',()=>{
 const result=projectCostProjection({review:{labour_rate_cents_per_hour:2000,machine_rate_cents_per_hour:5000,machine_minutes:30,
  overhead_cents:200,proposed_price_cents:10000,pricing_quantity:1,...extras},planned:{line_count:1,valued_lines:1,estimated_cents:1500},
  actual:{post_count:1,valued_posts:1,actual_cents:1200,scrap_cents:200},time:{time_rows:1,actual_minutes:60},production:{},quality:{}});
 assert.equal(result.total_cost_cents,6300);
 assert.equal(result.planned_bom_estimate_cents,1500);
 assert.equal(result.project_profit_estimate_cents,3700);
 assert.equal(result.gross_margin_percent,37);
 assert.equal(result.scrap_is_in_materials_not_additive,true);
 assert.equal(result.pricing_does_not_book_revenue,true);
});
test('failed batch has a real cost, scrap is only attributed and no phantom sale or margin',()=>{
 const result=projectCostProjection({review:{labour_rate_cents_per_hour:2000,machine_rate_cents_per_hour:0,machine_minutes:0,
  packaging_cents:0,consumables_cents:0,rework_cents:1000,finishing_cents:0,outside_service_cents:0,overhead_cents:200,
  pricing_quantity:2},actual:{post_count:2,valued_posts:2,actual_cents:4000,scrap_cents:2000},time:{time_rows:1,actual_minutes:90},
  quality:{failed_attempts:2}});
 assert.equal(result.total_cost_cents,8200);
 assert.equal(result.classified_scrap_cost_cents,2000);
 assert.equal(result.proposed_total_price_cents,null);
 assert.equal(result.project_profit_estimate_cents,null);
 assert.equal(result.failed_attempts,2);
 assert.match(result.warnings.join(' '),/Failed\/reworked/);
});
test('commission: unknown material price or hourly rate blocks total and margin even with a suggested price',()=>{
 const result=projectCostProjection({review:{labour_rate_cents_per_hour:null,machine_rate_cents_per_hour:0,machine_minutes:0,
  packaging_cents:0,consumables_cents:0,rework_cents:0,finishing_cents:0,outside_service_cents:0,overhead_cents:0,
  proposed_price_cents:5000,pricing_quantity:4},actual:{post_count:2,valued_posts:1,actual_cents:2000},time:{time_rows:1,actual_minutes:90}});
 assert.equal(result.total_cost_cents,null);
 assert.equal(result.proposed_total_price_cents,20000);
 assert.equal(result.project_profit_estimate_cents,null);
 assert.ok(result.missing_categories.includes('Actual Inventory materials'));
 assert.ok(result.missing_categories.includes('Hands-on labour'));
});
test('production cost evidence overrides fallback; source minutes and Work Order time are never counted twice',()=>{
 const result=projectCostProjection({review:{no_material_use_confirmed:1,no_labour_confirmed:1,
  labour_rate_cents_per_hour:0,machine_rate_cents_per_hour:6000,machine_minutes:10,
  packaging_cents:900,consumables_cents:0,rework_cents:0,finishing_cents:0,outside_service_cents:0,overhead_cents:0,
  proposed_price_cents:null},production:{machine_minutes:20,packaging_cents:100,prototype_waste_cents:500},
  actual:{post_count:0,valued_posts:0},time:{time_rows:0,actual_minutes:0}});
 assert.equal(result.total_cost_cents,2100);
 assert.equal(result.prototype_waste_evidence_cents,500);
 assert.equal(result.proposed_total_price_cents,null);
 assert.equal(result.components.find(x=>x.label==='Packaging').amount_cents,100);
});
test('private therapeutic work can explicitly record zero uses and no suggested selling price',()=>{
 const result=projectCostProjection({review:{no_material_use_confirmed:1,no_labour_confirmed:1,labour_rate_cents_per_hour:0,
  machine_rate_cents_per_hour:0,machine_minutes:0,packaging_cents:0,consumables_cents:0,rework_cents:0,
  finishing_cents:0,outside_service_cents:0,overhead_cents:0},actual:{post_count:0},time:{time_rows:0}});
 assert.equal(result.total_cost_cents,0);
 assert.equal(result.proposed_unit_price_cents,null);
 assert.equal(result.project_profit_estimate_cents,null);
});
