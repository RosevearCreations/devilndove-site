import test from 'node:test';import assert from 'node:assert/strict';
import {costTaxEstimate as tax,validQuickEdit} from '../functions/api/admin/_lib/inventoryQuickEdit387.js';
test('Ontario 13 percent HST extra and included',()=>{
 assert.deepEqual([tax(10000,13,false).tax_estimate_cents,tax(10000,13,false).gross_unit_cost_cents],[1300,11300]);
 assert.deepEqual([tax(11300,13,true).net_unit_cost_cents,tax(11300,13,true).tax_estimate_cents],[10000,1300]);
});
test('Ontario small-cost cents round, zero tax and alternate rates',()=>{
 assert.equal(tax(29,13,false).tax_estimate_cents,4);
 assert.equal(tax(29,13.01,false).tax_rate_basis_points,1301);
 assert.equal(tax(1000,0,true).tax_estimate_cents,0);
 assert.equal(tax(1000,5,false).gross_unit_cost_cents,1050);
});
test('invalid taxes and prices rejected',()=>{
 for(const price of [-1,NaN,1.25])assert.throws(()=>tax(price,13,false));
 for(const rate of [-1,31,NaN])assert.throws(()=>tax(1000,rate,true));
});
test('factual counts and units validated',()=>{
 const item={on_hand_quantity:1.25,stock_unit_label:'pack',usage_unit_label:'gram',usage_units_per_stock_unit:75,note:'Verified stock and cost at workshop'};
 assert.equal(validQuickEdit(item).usage_units_per_stock_unit,75);
 for(const bad of [{on_hand_quantity:-1},{usage_units_per_stock_unit:0},{note:'short'},{stock_unit_label:'<bad>'}])assert.throws(()=>validQuickEdit({...item,...bad}));
});
