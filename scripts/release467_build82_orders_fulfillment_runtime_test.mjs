import assert from 'node:assert/strict';
import {
  ORDER_FULFILLMENT_STAGE_IDS,
  ORDER_FULFILLMENT_WRITE_STATUSES,
  allowedFulfillmentTransitions,
  buildFulfillmentWorkflow,
  buildFulfillmentWorkflowOrder,
  fulfillmentReadyLabel,
} from '../functions/api/_lib/orderFulfillmentWorkflow.js';

function order(overrides = {}) {
  return {
    order_id: 10,
    order_number: 'DD-82-TEST',
    customer_name: 'Test Customer',
    customer_email: 'test@example.com',
    order_status: 'paid',
    payment_status: 'paid',
    derived_payment_status: 'paid',
    fulfillment_type: 'shipping',
    currency: 'CAD',
    total_cents: 10000,
    paid_total_cents: 10000,
    latest_history_status: 'paid',
    latest_history_note: 'Payment confirmed.',
    latest_history_at: '2026-09-09T12:00:00Z',
    history_count: 2,
    ...overrides,
  };
}

assert.deepEqual(
  ORDER_FULFILLMENT_WRITE_STATUSES,
  ['preparing','making','packing','evidence','ready','fulfilled','returned'],
);
for (const id of ['paid','preparing','making','packing','evidence','ready','fulfilled','returned','refunded']) {
  assert.equal(ORDER_FULFILLMENT_STAGE_IDS.includes(id), true, `missing stage ${id}`);
}

let row = buildFulfillmentWorkflowOrder(order());
assert.equal(row.workflow_stage, 'paid');
assert.deepEqual(row.workflow_actions.map((a) => a.new_status), ['preparing']);
assert.equal(row.customer_communication.send_automatically, false);

row = buildFulfillmentWorkflowOrder(order({ order_status:'preparing' }));
assert.deepEqual(row.workflow_actions.map((a) => a.new_status), ['making','packing']);

row = buildFulfillmentWorkflowOrder(order({ order_status:'preparing', fulfillment_type:'digital' }));
assert.deepEqual(row.workflow_actions.map((a) => a.new_status), ['evidence']);
assert.equal(row.workflow_actions[0].note_required, true);

row = buildFulfillmentWorkflowOrder(order({ order_status:'packing' }));
assert.deepEqual(row.workflow_actions.map((a) => a.new_status), ['evidence']);
assert.equal(row.workflow_actions[0].note_required, true);

row = buildFulfillmentWorkflowOrder(order({ order_status:'evidence', fulfillment_type:'pickup' }));
assert.equal(row.workflow_stage, 'evidence');
assert.deepEqual(row.workflow_actions.map((a) => a.new_status), ['ready']);
assert.equal(row.workflow_actions[0].label, 'Mark pickup ready');

row = buildFulfillmentWorkflowOrder(order({ order_status:'ready', fulfillment_type:'pickup' }));
assert.equal(row.workflow_stage_label, 'Pickup ready');
assert.deepEqual(row.workflow_actions.map((a) => a.new_status), ['fulfilled']);

row = buildFulfillmentWorkflowOrder(order({ order_status:'fulfilled' }));
assert.deepEqual(row.workflow_actions.map((a) => a.new_status), ['returned']);
assert.equal(row.workflow_actions[0].note_required, true);

row = buildFulfillmentWorkflowOrder(order({ order_status:'returned' }));
assert.equal(row.workflow_stage, 'returned');
assert.equal(row.workflow_actions.length, 0);
assert.match(row.blockers.join(' '), /refund/i);

row = buildFulfillmentWorkflowOrder(order({ order_status:'returned', payment_status:'refunded', derived_payment_status:'refunded' }));
assert.equal(row.workflow_stage, 'refunded');
assert.equal(row.terminal, true);
assert.equal(row.workflow_actions.length, 0);

row = buildFulfillmentWorkflowOrder(order({ order_status:'preparing', payment_status:'pending', derived_payment_status:'pending' }));
assert.equal(row.workflow_actions.length, 0);
assert.match(row.blockers.join(' '), /Payment must be confirmed/);

row = buildFulfillmentWorkflowOrder(order({ order_status:'legacy_unknown' }));
assert.equal(row.workflow_stage, 'review');
assert.equal(row.workflow_actions.length, 0);

assert.equal(fulfillmentReadyLabel('shipping'), 'Shipping ready');
assert.equal(fulfillmentReadyLabel('pickup'), 'Pickup ready');
assert.equal(fulfillmentReadyLabel('digital'), 'Delivery ready');

const workflow = buildFulfillmentWorkflow([
  order({ order_id:1, order_status:'paid' }),
  order({ order_id:2, order_status:'ready', fulfillment_type:'pickup' }),
  order({ order_id:3, order_status:'fulfilled' }),
  order({ order_id:4, order_status:'returned', payment_status:'refunded', derived_payment_status:'refunded' }),
]);
assert.equal(workflow.summary.total_orders, 4);
assert.equal(workflow.summary.ready, 1);
assert.equal(workflow.summary.fulfilled, 1);
assert.equal(workflow.summary.refunded, 1);
assert.equal(workflow.boundaries.customer_message_send, false);
assert.equal(workflow.boundaries.provider_shipping_execution, false);
assert.equal(workflow.boundaries.payment_execution, false);
assert.equal(workflow.boundaries.refund_execution, false);
assert.equal(workflow.boundaries.accounting_posting, false);
assert.equal(workflow.boundaries.request_time_schema_mutation, false);
assert.equal(workflow.boundaries.audit_authority, 'order_status_history');

const transition = allowedFulfillmentTransitions(order({ order_status:'preparing' }));
assert.deepEqual(transition.actions.map((a) => a.new_status), ['making','packing']);

console.log('RELEASE 467 BUILD 82 ORDERS / FULFILMENT WORKFLOW RUNTIME: PASS');
console.log('Reviewed forward stages: paid -> preparing -> making/packing -> evidence -> ready -> fulfilled -> returned');
console.log('Customer communication: DRAFT/COPY ONLY');
console.log('Refund/provider/accounting execution: OWNER PRESERVED / NONE');
