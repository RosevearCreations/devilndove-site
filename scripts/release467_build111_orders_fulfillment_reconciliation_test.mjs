import assert from 'node:assert/strict';
import { buildOrderFulfillmentReconciliation, reconcileFulfillmentOrder } from '../functions/api/_lib/orderFulfillmentReconciliation.js';

function workflow(overrides={}) {
  return {
    order_id: 10,
    order_number: 'DD-10',
    order_status: 'paid',
    workflow_stage: 'paid',
    workflow_stage_label: 'paid',
    fulfillment_type: 'shipping',
    blockers: [],
    terminal: false,
    audit: { latest_status:'paid', latest_at:'2026-09-01T00:00:00Z', history_count:2 },
    ...overrides,
  };
}
function finance(overrides={}) { return { order_id:10, settlement_state:'settlement_supported', settlement_supported:true, detail:'agree', ...overrides }; }
function profile(overrides={}) { return { order_id:10, line_count:1, total_units:1, physical_units:1, digital_units:0, unresolved_product_units:0, product_ids_csv:'5', evidence_event_count:0, evidence_note_present:0, ready_event_count:0, fulfilled_event_count:0, returned_event_count:0, returned_note_present:0, ...overrides }; }
function product(overrides={}) { return { product_id:5, name:'Test piece', readiness_state:'finished_stock_supported', readiness_supported:true, production_release_state:'no_production_required', detail:'supported', ...overrides }; }

{
  const row = reconcileFulfillmentOrder({ workflow:workflow(), finance:finance(), profile:profile(), productRowsById:new Map([[5,product()]]) });
  assert.equal(row.reconciliation_state, 'ready');
  assert.equal(row.transition_supported, true);
  assert.equal(row.blockers.length, 0);
}
{
  const row = reconcileFulfillmentOrder({ workflow:workflow({ audit:{ latest_status:'preparing', history_count:2 } }), finance:finance(), profile:profile(), productRowsById:new Map([[5,product()]]) });
  assert.equal(row.reconciliation_state, 'blocked');
  assert(row.blockers.some((x)=>x.code==='status_history_drift'));
}
{
  const row = reconcileFulfillmentOrder({ workflow:workflow({ fulfillment_type:'digital' }), finance:finance(), profile:profile(), productRowsById:new Map([[5,product()]]) });
  assert.equal(row.reconciliation_state, 'blocked');
  assert(row.blockers.some((x)=>x.code==='digital_fulfilment_has_physical_units'));
}
{
  const row = reconcileFulfillmentOrder({ workflow:workflow(), finance:finance({ settlement_state:'paid_amount_mismatch', settlement_supported:false }), profile:profile(), productRowsById:new Map([[5,product()]]) });
  assert.equal(row.reconciliation_state, 'blocked');
  assert(row.blockers.some((x)=>x.code==='finance_paid_amount_mismatch'));
}
{
  const driftProduct = product({ readiness_state:'demand_unverified', readiness_supported:false, production_release_state:'demand_unverified', unclassified_statuses:['making','packing'] });
  const row = reconcileFulfillmentOrder({ workflow:workflow({ order_status:'making', workflow_stage:'making', audit:{latest_status:'making',history_count:4} }), finance:finance(), profile:profile(), productRowsById:new Map([[5,driftProduct]]) });
  assert.equal(row.reconciliation_state, 'review');
  assert(row.reviews.some((x)=>x.code==='legacy_inventory_stage_taxonomy'));
}
{
  const row = reconcileFulfillmentOrder({ workflow:workflow({ order_status:'ready', workflow_stage:'ready', audit:{latest_status:'ready',history_count:5} }), finance:finance(), profile:profile({ ready_event_count:1 }), productRowsById:new Map([[5,product()]]) });
  assert.equal(row.reconciliation_state, 'blocked');
  assert(row.blockers.some((x)=>x.code==='evidence_stage_missing'));
}
{
  const result = buildOrderFulfillmentReconciliation({ workflowOrders:[workflow()], financeRows:[finance()], profiles:[profile()], productReadinessRows:[product()] });
  assert.equal(result.summary.total_orders, 1);
  assert.equal(result.summary.ready, 1);
  assert.equal(result.boundaries.new_order_mutation, false);
}

console.log('RELEASE 467 BUILD 111 ORDERS-TO-FULFILMENT RECONCILIATION RUNTIME TEST: PASS');
