import test from 'node:test';import assert from 'node:assert/strict';
import {sample,summarize} from '../functions/api/admin/_lib/operationsAnalytics.js';
test('caps every report and exposes incomplete sample instead of global counts',()=>{
 const projects=sample({results:Array.from({length:101},(_,i)=>({creative_work_project_id:i+1,project_status:'active'}))});
 const empty=()=>sample({results:[]});
 const report=summarize({projects,requests:empty(),work:empty(),materials:empty(),calendar:empty(),commission:empty(),finance:empty()});
 assert.equal(projects.rows.length,100);assert.equal(projects.truncated,true);
 assert.equal(report.any_truncated,true);assert.equal(report.count_is_global,false);
 assert.equal(report.history_complete,false);assert.equal(report.modules.projects.active,100);
});
test('never treats reservations as postings or sums unlike stock units',()=>{
 const empty=()=>sample({results:[]});
 const materials=sample({results:[{original_stock_quantity:4,released_stock_quantity:1},{original_stock_quantity:20,released_stock_quantity:10}]});
 const s=summarize({projects:empty(),requests:empty(),work:empty(),materials,calendar:empty(),commission:empty(),finance:empty()});
 assert.equal(s.modules.materials.open_reservations,2);
 assert.equal(s.modules.materials.unreleased_stock_units,null);
 assert.equal(s.modules.materials.inventory_cost_postings_created,0);
});
