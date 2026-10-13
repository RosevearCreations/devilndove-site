import test from 'node:test';import assert from 'node:assert/strict';
import {deriveOrders,evidenceFlags,TYPES} from '../functions/api/admin/_lib/projectFinanceEvidence.js';
test('collected money is not booked revenue',()=>{
 const r=deriveOrders([{total_cents:1200,tax_cents:100,gross_paid_cents:1200,refund_cents:200}]);
 assert.equal(r.net_paid_cents,1000);assert.equal(r.recorded_order_tax_cents,100);
 assert.equal(r.revenue_posted_by_these_payments,false);
 assert.equal(r.deposit_is_paid_inferred,false);
 assert.equal(deriveOrders([]).net_paid_cents,null);
});
test('missing evidence must be reported',()=>{
 assert.equal(evidenceFlags({finance:null,work:null,production:null,inventory:null,orders:deriveOrders([]),links:false}).length,6);
 assert.equal(TYPES.includes('tax_source'),true);
});
