// Release 467 Build 72 — recommendation-only Inventory / Reorder Economics.
// Pure calculation only: no D1, R2, provider, network, purchasing or mutation behavior.

import {
  INVENTORY_QUANTITY_EPSILON,
  baseToPurchase,
  normalizeInventoryTrackingMode,
  normalizeInventoryUnitLabel,
  normalizeUnitsPerPurchase,
  purchaseToBase,
  roundInventoryQuantity,
} from './inventoryUnitConversion.js';

export const INVENTORY_REORDER_ECONOMICS_BUILD = 72;
export const INVENTORY_REORDER_ECONOMICS_CONTRACT = 'recommendation-only-reorder-economics';
export const DEFAULT_STOCK_COVERAGE_TARGET_DAYS = 30;

function finite(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function positive(value) {
  return Math.max(0, finite(value, 0));
}

function clean(value, max = 240) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, max);
}

function lower(value) {
  return clean(value).toLowerCase();
}

function roundedMoney(value) {
  return Math.max(0, Math.round(finite(value, 0)));
}

function coverageDays(quantity, dailyUsage) {
  if (!(dailyUsage > INVENTORY_QUANTITY_EPSILON)) return null;
  return Number((Math.max(0, quantity) / dailyUsage).toFixed(1));
}

function coverageBand(days) {
  if (days == null) return 'unknown';
  if (days < 7) return 'critical';
  if (days < 14) return 'low';
  if (days < DEFAULT_STOCK_COVERAGE_TARGET_DAYS) return 'watch';
  return 'healthy';
}

function normalizeSupplierOffer(raw = {}) {
  const supplierName = clean(raw.supplier_name) || 'Unassigned Supplier';
  const landed = roundedMoney(raw.weighted_landed_unit_cost_cents ?? raw.landed_unit_cost_cents);
  return Object.freeze({
    supplier_name: supplierName,
    supplier_key: lower(supplierName),
    observed_lot_count: Math.max(0, Math.trunc(finite(raw.observed_lot_count, 0))),
    observed_quantity: roundInventoryQuantity(positive(raw.observed_quantity)),
    weighted_landed_unit_cost_cents: landed,
    latest_received_at: raw.latest_received_at || null,
    source_url: clean(raw.source_url, 500) || '',
  });
}

export function compareSupplierEconomics(item = {}, rawOffers = []) {
  const preferredSupplier = lower(item.supplier_name);
  const offers = (Array.isArray(rawOffers) ? rawOffers : [])
    .map(normalizeSupplierOffer)
    .filter((row) => row.observed_lot_count > 0 || row.weighted_landed_unit_cost_cents > 0);

  const positiveCostOffers = offers.filter((row) => row.weighted_landed_unit_cost_cents > 0);
  const preferredObserved = positiveCostOffers.find((row) => row.supplier_key === preferredSupplier) || null;
  const lowestObserved = positiveCostOffers
    .slice()
    .sort((a, b) => a.weighted_landed_unit_cost_cents - b.weighted_landed_unit_cost_cents || b.observed_lot_count - a.observed_lot_count)[0] || null;
  const currentRecorded = roundedMoney(item.unit_cost_cents);
  const costBasis = preferredObserved || lowestObserved || (currentRecorded > 0 ? {
    supplier_name: clean(item.supplier_name) || 'Current Inventory record',
    supplier_key: preferredSupplier,
    observed_lot_count: 0,
    observed_quantity: 0,
    weighted_landed_unit_cost_cents: currentRecorded,
    latest_received_at: null,
    source_url: clean(item.source_url, 500) || '',
  } : null);

  const basisCost = roundedMoney(costBasis?.weighted_landed_unit_cost_cents);
  const comparisons = positiveCostOffers
    .map((row) => ({
      ...row,
      preferred_supplier_match: preferredSupplier && row.supplier_key === preferredSupplier ? 1 : 0,
      delta_vs_cost_basis_cents: basisCost > 0 ? row.weighted_landed_unit_cost_cents - basisCost : 0,
      percent_vs_cost_basis: basisCost > 0
        ? Number((((row.weighted_landed_unit_cost_cents - basisCost) / basisCost) * 100).toFixed(1))
        : 0,
    }))
    .sort((a, b) => b.preferred_supplier_match - a.preferred_supplier_match || a.weighted_landed_unit_cost_cents - b.weighted_landed_unit_cost_cents || b.observed_lot_count - a.observed_lot_count)
    .slice(0, 8);

  return Object.freeze({
    comparison_only: true,
    preferred_supplier: clean(item.supplier_name) || '',
    cost_basis_supplier: costBasis?.supplier_name || '',
    cost_basis_unit_cents: basisCost,
    cost_basis_kind: preferredObserved ? 'preferred_supplier_observed_landed_cost' : lowestObserved ? 'lowest_observed_landed_cost_fallback' : currentRecorded > 0 ? 'current_inventory_unit_cost_fallback' : 'missing',
    supplier_offer_count: comparisons.length,
    lowest_observed_supplier: lowestObserved?.supplier_name || '',
    lowest_observed_landed_unit_cost_cents: roundedMoney(lowestObserved?.weighted_landed_unit_cost_cents),
    comparisons,
  });
}

export function resourceBuildableEconomics(item = {}, rawLinks = [], projectedPurchaseQuantity = 0, costBasisUnitCents = 0) {
  const sourceType = lower(item.source_type);
  const trackingMode = normalizeInventoryTrackingMode(item.usage_tracking_mode, sourceType);
  const unitsPerPurchase = normalizeUnitsPerPurchase(item.usage_units_per_stock_unit, 1);
  const availablePurchase = roundInventoryQuantity(Math.max(0, positive(item.on_hand_quantity) - positive(item.reserved_quantity)));
  const projectedPurchase = roundInventoryQuantity(availablePurchase + positive(item.incoming_quantity) + positive(projectedPurchaseQuantity));
  const baseUnitLabel = normalizeInventoryUnitLabel(item.usage_unit_label, 'unit');
  const purchaseUnitLabel = normalizeInventoryUnitLabel(item.stock_unit_label, 'unit');

  const links = (Array.isArray(rawLinks) ? rawLinks : []).map((raw) => {
    const mode = lower(raw.consumption_mode || 'per_unit') || 'per_unit';
    const quantityUsed = positive(raw.quantity_used);
    const lotSize = Math.max(INVENTORY_QUANTITY_EPSILON, positive(raw.lot_size_units) || 1);
    const nonDepleting = mode === 'story_only' || ['reusable', 'log_only'].includes(trackingMode);
    const requiredBasePerProduct = nonDepleting || !(quantityUsed > INVENTORY_QUANTITY_EPSILON)
      ? 0
      : roundInventoryQuantity(mode === 'end_of_lot' ? quantityUsed / lotSize : quantityUsed);
    const requiredPurchasePerProduct = requiredBasePerProduct > 0
      ? baseToPurchase(requiredBasePerProduct, unitsPerPurchase)
      : 0;
    const currentBuildable = requiredPurchasePerProduct > INVENTORY_QUANTITY_EPSILON
      ? Math.max(0, Math.floor((availablePurchase + INVENTORY_QUANTITY_EPSILON) / requiredPurchasePerProduct))
      : null;
    const projectedBuildable = requiredPurchasePerProduct > INVENTORY_QUANTITY_EPSILON
      ? Math.max(0, Math.floor((projectedPurchase + INVENTORY_QUANTITY_EPSILON) / requiredPurchasePerProduct))
      : null;
    const materialCost = requiredPurchasePerProduct > 0 && costBasisUnitCents > 0
      ? Math.max(0, Math.round(requiredPurchasePerProduct * costBasisUnitCents))
      : 0;
    return Object.freeze({
      product_id: Math.max(0, Math.trunc(finite(raw.product_id, 0))),
      product_name: clean(raw.product_name || raw.name) || 'Product',
      product_slug: clean(raw.product_slug || raw.slug) || '',
      product_price_cents: roundedMoney(raw.product_price_cents ?? raw.price_cents),
      consumption_mode: mode,
      quantity_used: roundInventoryQuantity(quantityUsed),
      required_base_quantity_per_product: requiredBasePerProduct,
      required_purchase_quantity_per_product: requiredPurchasePerProduct,
      base_unit_label: baseUnitLabel,
      purchase_unit_label: purchaseUnitLabel,
      non_depleting: nonDepleting,
      current_resource_buildable_units: currentBuildable,
      projected_resource_buildable_units: projectedBuildable,
      incremental_buildable_units: currentBuildable == null || projectedBuildable == null ? null : Math.max(0, projectedBuildable - currentBuildable),
      estimated_resource_cost_per_product_cents: materialCost,
    });
  });

  const constraining = links.filter((row) => row.current_resource_buildable_units != null);
  return Object.freeze({
    linked_product_count: links.length,
    constraining_link_count: constraining.length,
    current_lowest_resource_buildable_units: constraining.length ? Math.min(...constraining.map((row) => row.current_resource_buildable_units)) : null,
    projected_lowest_resource_buildable_units: constraining.length ? Math.min(...constraining.map((row) => row.projected_resource_buildable_units)) : null,
    links: links.sort((a, b) => {
      const av = a.current_resource_buildable_units == null ? Number.MAX_SAFE_INTEGER : a.current_resource_buildable_units;
      const bv = b.current_resource_buildable_units == null ? Number.MAX_SAFE_INTEGER : b.current_resource_buildable_units;
      return av - bv || a.product_name.localeCompare(b.product_name);
    }).slice(0, 20),
  });
}

export function planInventoryReorderEconomics(item = {}, demand = {}, supplierOffers = [], resourceLinks = [], options = {}) {
  const onHand = positive(item.on_hand_quantity);
  const reserved = positive(item.reserved_quantity);
  const incoming = positive(item.incoming_quantity);
  const available = roundInventoryQuantity(Math.max(0, onHand - reserved));
  const projected = roundInventoryQuantity(available + incoming);
  const reorderLevel = positive(item.reorder_level);
  const preferredReorderQuantity = positive(item.preferred_reorder_quantity);
  const consumed30 = positive(demand.consumed_30d);
  const consumed90 = positive(demand.consumed_90d);
  const daily30 = consumed30 / 30;
  const daily90 = consumed90 / 90;
  const forecastDailyUsage = roundInventoryQuantity(Math.max(daily30, daily90));
  const targetCoverageDays = Math.max(7, Math.min(120, finite(options.target_coverage_days, DEFAULT_STOCK_COVERAGE_TARGET_DAYS)));
  const availableCoverageDays = coverageDays(available, forecastDailyUsage);
  const projectedCoverageDays = coverageDays(projected, forecastDailyUsage);
  const demandTarget = roundInventoryQuantity(forecastDailyUsage * targetCoverageDays);
  const policyTarget = roundInventoryQuantity(reorderLevel + (preferredReorderQuantity > 0 ? preferredReorderQuantity : reorderLevel));
  const targetStock = roundInventoryQuantity(Math.max(reorderLevel, demandTarget, policyTarget));
  const listed = Number(item.is_on_reorder_list || 0) === 1;
  const blocked = Number(item.do_not_reorder || 0) === 1;
  const thresholdTriggered = reorderLevel > 0 && projected <= reorderLevel + INVENTORY_QUANTITY_EPSILON;
  const coverageTriggered = forecastDailyUsage > INVENTORY_QUANTITY_EPSILON && (projectedCoverageDays == null || projectedCoverageDays < targetCoverageDays);
  const recommendationSignal = thresholdTriggered || coverageTriggered || listed;
  const gap = roundInventoryQuantity(Math.max(0, targetStock - projected));
  let recommended = recommendationSignal ? Math.max(gap, preferredReorderQuantity > 0 ? preferredReorderQuantity : 0) : 0;
  if (listed && recommended <= INVENTORY_QUANTITY_EPSILON && preferredReorderQuantity > 0) recommended = preferredReorderQuantity;
  if (blocked) recommended = 0;
  recommended = roundInventoryQuantity(recommended);

  const supplier = compareSupplierEconomics(item, supplierOffers);
  const estimatedReorderLandedCostCents = supplier.cost_basis_unit_cents > 0 && recommended > 0
    ? Math.max(0, Math.round(recommended * supplier.cost_basis_unit_cents))
    : 0;
  const buildable = resourceBuildableEconomics(item, resourceLinks, recommended, supplier.cost_basis_unit_cents);

  const status = blocked && recommendationSignal
    ? 'blocked_do_not_reorder'
    : recommended > INVENTORY_QUANTITY_EPSILON
      ? 'recommend_review'
      : recommendationSignal
        ? 'manual_review_no_quantity_basis'
        : 'no_reorder_recommended';

  return Object.freeze({
    recommendation_only: true,
    automatic_purchase: false,
    status,
    stock_unit_label: normalizeInventoryUnitLabel(item.stock_unit_label, 'unit'),
    on_hand_quantity: roundInventoryQuantity(onHand),
    reserved_quantity: roundInventoryQuantity(reserved),
    available_quantity: available,
    incoming_quantity: roundInventoryQuantity(incoming),
    projected_available_quantity: projected,
    reorder_level: roundInventoryQuantity(reorderLevel),
    preferred_reorder_quantity: roundInventoryQuantity(preferredReorderQuantity),
    consumed_30d: roundInventoryQuantity(consumed30),
    consumed_90d: roundInventoryQuantity(consumed90),
    forecast_daily_usage: forecastDailyUsage,
    target_coverage_days: targetCoverageDays,
    available_coverage_days: availableCoverageDays,
    projected_coverage_days: projectedCoverageDays,
    available_coverage_band: coverageBand(availableCoverageDays),
    projected_coverage_band: coverageBand(projectedCoverageDays),
    target_stock_quantity: targetStock,
    threshold_triggered: thresholdTriggered,
    coverage_triggered: coverageTriggered,
    reorder_list_triggered: listed,
    do_not_reorder: blocked,
    recommended_reorder_quantity: recommended,
    estimated_reorder_landed_cost_cents: estimatedReorderLandedCostCents,
    supplier_economics: supplier,
    buildable_economics: buildable,
    base_available_quantity: purchaseToBase(available, item.usage_units_per_stock_unit),
    base_projected_quantity: purchaseToBase(projected + recommended, item.usage_units_per_stock_unit),
  });
}
