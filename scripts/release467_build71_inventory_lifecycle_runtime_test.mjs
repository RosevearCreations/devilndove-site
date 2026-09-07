import assert from 'node:assert/strict';
import { planInventoryLifecycleAction } from '../functions/api/_lib/inventoryLifecycle.js';

function throwsCode(fn, code) {
  try {
    fn();
    return false;
  } catch (error) {
    return error?.code === code;
  }
}

const supply = {
  site_item_inventory_id: 10,
  source_type: 'supply',
  on_hand_quantity: 10,
  reserved_quantity: 2,
  incoming_quantity: 4,
  unit_cost_cents: 500,
  stock_unit_label: 'kilogram',
  usage_unit_label: 'gram',
  usage_units_per_stock_unit: 1000,
  usage_tracking_mode: 'exact',
  minimum_usage_increment: 5,
  is_active: 1,
  do_not_reorder: 0,
};

const reserve = planInventoryLifecycleAction(supply, 'reserve', 3, { note: 'Reserve for production' });
assert.equal(reserve.new_reserved_quantity, 5);
assert.equal(reserve.available_quantity_after, 5);
assert.equal(reserve.accounting.inventory_value_delta_cents, 0);
assert.equal(reserve.lifecycle_stage, 'storage_to_reserved');

assert.equal(
  throwsCode(() => planInventoryLifecycleAction(supply, 'reserve', 9), 'inventory_lifecycle_insufficient_available_for_reservation'),
  true,
);

const release = planInventoryLifecycleAction(supply, 'release', 1.5, { note: 'Release unused reservation' });
assert.equal(release.new_reserved_quantity, 0.5);
assert.equal(release.lifecycle_stage, 'reserved_to_storage');
assert.equal(
  throwsCode(() => planInventoryLifecycleAction(supply, 'release', 3), 'inventory_lifecycle_release_exceeds_reserved'),
  true,
);

const receive = planInventoryLifecycleAction(supply, 'receive', 2, { note: 'Manual receiving correction' });
assert.equal(receive.new_on_hand_quantity, 12);
assert.equal(receive.new_incoming_quantity, 2);
assert.equal(receive.accounting.inventory_value_delta_cents, 1000);
assert.equal(receive.accounting.finance_review_required, 1);

const manualExtraReceive = planInventoryLifecycleAction({ ...supply, incoming_quantity: 1 }, 'receive', 3, { note: 'Received extra supplier quantity' });
assert.equal(manualExtraReceive.new_incoming_quantity, 0);
assert.equal(manualExtraReceive.new_on_hand_quantity, 13);

const use = planInventoryLifecycleAction(supply, 'consume_usage', 500, { note: 'Used in candle batch' });
assert.equal(use.new_on_hand_quantity, 9.5);
assert.equal(use.new_reserved_quantity, 2);
assert.equal(use.quantity_delta, -0.5);
assert.equal(use.accounting.inventory_value_delta_cents, -250);
assert.equal(use.usage.usage_unit_label, 'gram');

assert.equal(
  throwsCode(() => planInventoryLifecycleAction(supply, 'consume_usage', 252), 'inventory_usage_increment_misaligned'),
  true,
);

const returned = planInventoryLifecycleAction(supply, 'return_stock', 0.25, { note: 'Unused wax returned to stock' });
assert.equal(returned.new_on_hand_quantity, 10.25);
assert.equal(returned.accounting.inventory_value_delta_cents, 125);
assert.equal(returned.lifecycle_stage, 'usage_return_to_storage');
assert.equal(
  throwsCode(() => planInventoryLifecycleAction(supply, 'return_stock', 0.25, { note: 'short' }), 'inventory_lifecycle_reason_required'),
  true,
);

const writeoff = planInventoryLifecycleAction(supply, 'write_off', 1.25, { note: 'Material contaminated during storage' });
assert.equal(writeoff.new_on_hand_quantity, 8.75);
assert.equal(writeoff.new_reserved_quantity, 2);
assert.equal(writeoff.accounting.inventory_value_delta_cents, -625);
assert.equal(writeoff.accounting.finance_review_required, 1);
assert.equal(writeoff.lifecycle_stage, 'storage_to_writeoff');
assert.equal(
  throwsCode(() => planInventoryLifecycleAction(supply, 'write_off', 9, { note: 'Material damaged beyond use' }), 'inventory_lifecycle_writeoff_exceeds_available'),
  true,
);

const reorder = planInventoryLifecycleAction(supply, 'reorder_request', 6, { note: 'Request supplier reorder' });
assert.equal(reorder.new_incoming_quantity, 4, 'reorder request must not invent incoming stock');
assert.equal(reorder.accounting.requested_reorder_quantity, 6);
assert.equal(reorder.lifecycle_stage, 'reorder_requested');
assert.equal(
  throwsCode(() => planInventoryLifecycleAction({ ...supply, do_not_reorder: 1 }, 'reorder_request', 2), 'inventory_lifecycle_do_not_reorder'),
  true,
);

const tool = {
  ...supply,
  source_type: 'tool',
  on_hand_quantity: 1,
  reserved_quantity: 0,
  incoming_quantity: 0,
  stock_unit_label: 'each',
  usage_unit_label: 'use',
  usage_units_per_stock_unit: 1,
  minimum_usage_increment: 1,
  usage_tracking_mode: 'reusable',
  unit_cost_cents: 3200,
};
const toolUse = planInventoryLifecycleAction(tool, 'consume_usage', 3, { note: 'Used for production work' });
assert.equal(toolUse.new_on_hand_quantity, 1);
assert.equal(toolUse.quantity_delta, 0);
assert.equal(toolUse.accounting.inventory_value_delta_cents, 0);
assert.equal(toolUse.lifecycle_stage, 'usage_log_only');
assert.equal(
  throwsCode(() => planInventoryLifecycleAction(tool, 'consume', 1), 'inventory_lifecycle_use_usage_authority'),
  true,
);
assert.equal(
  throwsCode(() => planInventoryLifecycleAction({ ...tool, do_not_reuse: 1 }, 'consume_usage', 1), 'inventory_usage_tool_do_not_reuse'),
  true,
);

assert.equal(
  throwsCode(() => planInventoryLifecycleAction({ ...supply, source_type: 'product' }, 'write_off', 1, { note: 'Invalid Product-owned writeoff' }), 'inventory_lifecycle_wrong_owner'),
  true,
);

console.log('RELEASE 467 BUILD 71 INVENTORY LIFECYCLE RUNTIME: PASS');
console.log('Reservation: AVAILABLE-ONLY / FAIL-CLOSED');
console.log('Release: RESERVED-ONLY / FAIL-CLOSED');
console.log('Receiving: STOCK INCREASE + CONFIRMED INCOMING REDUCTION');
console.log('Usage: BUILD 70 UNIT AUTHORITY REUSED');
console.log('Return / write-off: EXPLICIT + ACCOUNTING CONTEXT');
console.log('Reorder request: PLANNING SIGNAL / INCOMING STOCK UNCHANGED');
