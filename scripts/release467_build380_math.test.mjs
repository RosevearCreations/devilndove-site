import test from 'node:test';import assert from 'node:assert/strict';
import {quantity,money,summarize} from '../functions/api/admin/_lib/projectMaterialMath.js';
test('rounded three-decimal positive stock units only',()=>{
 assert.equal(quantity(0.125),0.125);assert.equal(quantity(0),null);
 assert.equal(quantity(-1),null);assert.equal(quantity(100000.001),null);
 assert.equal(quantity(0.00001),null);
});
test('known costs only; missing prices are not free',()=>{
 assert.equal(money(2,123),246);assert.equal(money(1,0),null);
 const s=summarize([{original_stock_quantity:5,released_stock_quantity:2}],
  [{stock_quantity_consumed:1,estimated_cost_cents:234},{stock_quantity_consumed:0.5,estimated_cost_cents:null}]);
 assert.equal(s.reserved_stock_units,3);assert.equal(s.actual_posted_stock_units,1.5);
 assert.equal(s.unknown_cost_rows,1);assert.equal(s.actual_posted_cost_estimate_cents,234);
 assert.equal(s.accounting_authority,false);
});
