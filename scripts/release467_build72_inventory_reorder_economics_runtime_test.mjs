import assert from 'node:assert/strict';
import {
  compareSupplierEconomics,
  planInventoryReorderEconomics,
  resourceBuildableEconomics,
} from '../functions/api/_lib/inventoryReorderEconomics.js';

const checks = [];
function check(label, fn) {
  fn();
  checks.push(label);
  console.log(`${String(checks.length).padStart(2, '0')}. PASS — ${label}`);
}

const baseItem = {
  site_item_inventory_id: 10,
  source_type: 'supply',
  external_key: 'wax-kg',
  item_name: 'Soy wax',
  on_hand_quantity: 6,
  reserved_quantity: 2,
  incoming_quantity: 1,
  reorder_level: 4,
  preferred_reorder_quantity: 6,
  unit_cost_cents: 1100,
  stock_unit_label: 'kilogram',
  usage_unit_label: 'gram',
  usage_units_per_stock_unit: 1000,
  usage_tracking_mode: 'exact',
  supplier_name: 'Preferred Wax Co',
  is_on_reorder_list: 0,
  do_not_reorder: 0,
};

const suppliers = [
  { supplier_name: 'Preferred Wax Co', observed_lot_count: 3, observed_quantity: 12, weighted_landed_unit_cost_cents: 1200 },
  { supplier_name: 'Budget Wax Co', observed_lot_count: 2, observed_quantity: 10, weighted_landed_unit_cost_cents: 1000 },
];
const links = [
  { product_id: 1, product_name: 'Candle A', product_slug: 'candle-a', product_price_cents: 3000, quantity_used: 500, consumption_mode: 'per_unit', lot_size_units: 1 },
];

const plan = planInventoryReorderEconomics(baseItem, { consumed_30d: 6, consumed_90d: 12 }, suppliers, links);

check('coverage demand can trigger reorder before the static threshold', () => {
  assert.equal(plan.coverage_triggered, true);
  assert.equal(plan.threshold_triggered, false);
  assert.equal(plan.projected_coverage_days, 25);
});

check('preferred reorder quantity acts as a minimum advisory order quantity', () => {
  assert.equal(plan.recommended_reorder_quantity, 6);
  assert.equal(plan.status, 'recommend_review');
  assert.equal(plan.recommendation_only, true);
  assert.equal(plan.automatic_purchase, false);
});

check('preferred supplier observed landed cost is the recommendation cost basis', () => {
  assert.equal(plan.supplier_economics.cost_basis_supplier, 'Preferred Wax Co');
  assert.equal(plan.supplier_economics.cost_basis_unit_cents, 1200);
  assert.equal(plan.supplier_economics.cost_basis_kind, 'preferred_supplier_observed_landed_cost');
  assert.equal(plan.estimated_reorder_landed_cost_cents, 7200);
});

check('supplier comparison surfaces a lower observed alternative without selecting it', () => {
  assert.equal(plan.supplier_economics.lowest_observed_supplier, 'Budget Wax Co');
  assert.equal(plan.supplier_economics.lowest_observed_landed_unit_cost_cents, 1000);
  assert.equal(plan.supplier_economics.comparison_only, true);
});

check('linked Product buildability uses Build 70 package/base conversion', () => {
  assert.equal(plan.buildable_economics.links[0].required_base_quantity_per_product, 500);
  assert.equal(plan.buildable_economics.links[0].required_purchase_quantity_per_product, 0.5);
  assert.equal(plan.buildable_economics.links[0].current_resource_buildable_units, 8);
  assert.equal(plan.buildable_economics.links[0].projected_resource_buildable_units, 22);
  assert.equal(plan.buildable_economics.links[0].estimated_resource_cost_per_product_cents, 600);
});

check('do-not-reorder blocks the advisory quantity even when coverage is low', () => {
  const blocked = planInventoryReorderEconomics({ ...baseItem, do_not_reorder: 1 }, { consumed_30d: 6, consumed_90d: 12 }, suppliers, links);
  assert.equal(blocked.recommended_reorder_quantity, 0);
  assert.equal(blocked.status, 'blocked_do_not_reorder');
});

check('no threshold, no demand and no reorder-list signal yields no recommendation', () => {
  const quiet = planInventoryReorderEconomics({ ...baseItem, on_hand_quantity: 20, reserved_quantity: 0, incoming_quantity: 0, reorder_level: 2, preferred_reorder_quantity: 4 }, { consumed_30d: 0, consumed_90d: 0 }, suppliers, []);
  assert.equal(quiet.recommended_reorder_quantity, 0);
  assert.equal(quiet.available_coverage_days, null);
  assert.equal(quiet.status, 'no_reorder_recommended');
});

check('operator reorder-list intent can carry a configured preferred quantity', () => {
  const listed = planInventoryReorderEconomics({ ...baseItem, on_hand_quantity: 20, reserved_quantity: 0, incoming_quantity: 0, reorder_level: 0, preferred_reorder_quantity: 3, is_on_reorder_list: 1 }, { consumed_30d: 0, consumed_90d: 0 }, [], []);
  assert.equal(listed.recommended_reorder_quantity, 3);
  assert.equal(listed.reorder_list_triggered, true);
});

check('lowest observed supplier is only a fallback when preferred supplier has no received-cost history', () => {
  const comparison = compareSupplierEconomics({ ...baseItem, supplier_name: 'Unknown Preferred', unit_cost_cents: 1300 }, suppliers);
  assert.equal(comparison.cost_basis_supplier, 'Budget Wax Co');
  assert.equal(comparison.cost_basis_kind, 'lowest_observed_landed_cost_fallback');
});

check('reusable Tool usage does not constrain buildability or pretend to consume stock', () => {
  const reusable = resourceBuildableEconomics({ ...baseItem, source_type: 'tool', usage_tracking_mode: 'reusable', stock_unit_label: 'tool', usage_unit_label: 'use', usage_units_per_stock_unit: 1 }, links, 0, 5000);
  assert.equal(reusable.links[0].non_depleting, true);
  assert.equal(reusable.links[0].current_resource_buildable_units, null);
  assert.equal(reusable.links[0].estimated_resource_cost_per_product_cents, 0);
});

check('end-of-lot links amortize required base quantity by lot size', () => {
  const endOfLot = resourceBuildableEconomics(baseItem, [{ ...links[0], quantity_used: 1000, consumption_mode: 'end_of_lot', lot_size_units: 10 }], 0, 1200);
  assert.equal(endOfLot.links[0].required_base_quantity_per_product, 100);
  assert.equal(endOfLot.links[0].required_purchase_quantity_per_product, 0.1);
  assert.equal(endOfLot.links[0].current_resource_buildable_units, 40);
});

console.log(`BUILD 72 INVENTORY / REORDER ECONOMICS RUNTIME: PASS (${checks.length} checks)`);
