#!/usr/bin/env node
// Release 467 Build 70 pure runtime acceptance for package/base Inventory conversion.
// No D1, R2, provider, Pages, Production, network or filesystem mutation.

import assert from 'node:assert/strict';
import {
  InventoryUnitError,
  baseToPurchase,
  isUsageIncrementAligned,
  normalizeInventoryTrackingMode,
  normalizeInventoryUnitLabel,
  planInventoryUsage,
  purchaseToBase,
} from '../functions/api/_lib/inventoryUnitConversion.js';

function expectCode(fn, code) {
  let caught = null;
  try { fn(); } catch (error) { caught = error; }
  assert.ok(caught instanceof InventoryUnitError, `expected InventoryUnitError ${code}`);
  assert.equal(caught.code, code);
}

assert.equal(normalizeInventoryUnitLabel('kg'), 'kilogram');
assert.equal(normalizeInventoryUnitLabel('ML'), 'millilitre');
assert.equal(normalizeInventoryTrackingMode('exact', 'tool'), 'reusable');
assert.equal(purchaseToBase(2, 1000), 2000);
assert.equal(baseToPurchase(250, 1000), 0.25);
assert.equal(isUsageIncrementAligned(250, 5), true);
assert.equal(isUsageIncrementAligned(252, 5), false);

const grams = {
  source_type: 'supply',
  stock_unit_label: 'kg',
  usage_unit_label: 'g',
  usage_units_per_stock_unit: 1000,
  usage_tracking_mode: 'exact',
  minimum_usage_increment: 5,
  on_hand_quantity: 2,
  reserved_quantity: 0.5,
  unit_cost_cents: 2400,
};
const exact = planInventoryUsage(grams, 250);
assert.equal(exact.stock_quantity, 0.25);
assert.equal(exact.previous_on_hand_quantity, 2);
assert.equal(exact.available_quantity, 1.5);
assert.equal(exact.available_base_quantity, 1500);
assert.equal(exact.new_on_hand_quantity, 1.75);
assert.equal(exact.allocated_cost_cents, 600);
assert.equal(exact.stock_unit_label, 'kilogram');
assert.equal(exact.usage_unit_label, 'gram');

expectCode(() => planInventoryUsage(grams, 252), 'inventory_usage_increment_misaligned');
expectCode(() => planInventoryUsage(grams, 1600), 'inventory_usage_insufficient_available');
expectCode(() => planInventoryUsage({ ...grams, minimum_usage_increment: 10 }, 5), 'inventory_usage_below_minimum_increment');

const reusable = planInventoryUsage({
  source_type: 'tool',
  stock_unit_label: 'unit',
  usage_unit_label: 'use',
  usage_units_per_stock_unit: 1,
  usage_tracking_mode: 'exact',
  minimum_usage_increment: 1,
  on_hand_quantity: 1,
  reserved_quantity: 0,
  unit_cost_cents: 5000,
}, 3);
assert.equal(reusable.tracking_mode, 'reusable');
assert.equal(reusable.stock_quantity, 0);
assert.equal(reusable.new_on_hand_quantity, 1);
assert.equal(reusable.allocated_cost_cents, 0);

const logOnly = planInventoryUsage({ ...grams, usage_tracking_mode: 'log_only', minimum_usage_increment: 1 }, 1800);
assert.equal(logOnly.stock_quantity, 0);
assert.equal(logOnly.new_on_hand_quantity, 2);

const estimated = planInventoryUsage({ ...grams, usage_tracking_mode: 'estimated' }, 500);
assert.equal(estimated.tracking_mode, 'estimated');
assert.equal(estimated.is_estimated, 1);
assert.equal(estimated.stock_quantity, 0.5);
assert.equal(estimated.new_on_hand_quantity, 1.5);

expectCode(() => planInventoryUsage({ ...grams, source_type: 'product' }, 250), 'inventory_usage_wrong_owner');
expectCode(() => planInventoryUsage({
  source_type: 'tool',
  stock_unit_label: 'unit',
  usage_unit_label: 'use',
  usage_units_per_stock_unit: 1,
  usage_tracking_mode: 'reusable',
  minimum_usage_increment: 1,
  on_hand_quantity: 1,
  do_not_reuse: 1,
}, 1), 'inventory_usage_tool_do_not_reuse');

console.log('RELEASE 467 BUILD 70 INVENTORY UNIT RUNTIME: PASS');
console.log('Package/base conversion: PASS');
console.log('Reserved stock exclusion: PASS');
console.log('Minimum increment + alignment: PASS');
console.log('Reusable/log-only no-decrement: PASS');
console.log('Estimated consumption: PASS');
console.log('Product ownership boundary: PASS');
