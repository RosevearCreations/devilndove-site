// Release 461 base-unit overlay for product/resource availability and costing.
// Legacy loaders remain the identity/catalog compatibility layer; usable/base balance is canonical.
import * as legacy from './_productResourcesDataLegacy.js';
import {
  loadInventoryBaseBalanceByIdentity,
  loadInventoryBaseBalances,
  mergeInventoryBaseAuthority
} from './_inventoryBaseAuthority.js';

export const normalizeResourceImageUrl = legacy.normalizeResourceImageUrl;
export const normalizeConsumptionMode = legacy.normalizeConsumptionMode;
export const loadProducts = legacy.loadProducts;

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
function positive(value, fallback = 1) {
  const parsed = number(value, fallback);
  return parsed > 0 ? parsed : fallback;
}

export function resourcePreview(resource = {}, link = null) {
  if (String(resource?.quantity_authority || '') !== 'base') return legacy.resourcePreview(resource, link);
  const packageCostCents = Math.max(0, Math.round(number(resource.purchase_unit_cost_cents ?? resource.unit_cost_cents, 0)));
  const baseAvailable = Math.max(0, number(resource.base_available_quantity, number(resource.base_on_hand_quantity, 0) - number(resource.base_reserved_quantity, 0)));
  const perPurchase = positive(resource.base_units_per_purchase_unit ?? resource.usage_units_per_stock_unit, 1);
  const quantityUsed = positive(link?.quantity_used, 1);
  const productsPerLot = positive(link?.lot_size_units, 1);
  const consumptionMode = legacy.normalizeConsumptionMode(link?.consumption_mode);
  let estimatedCostPerProductCents = 0;
  let buildableProducts = 0;

  if (consumptionMode === 'end_of_lot') {
    const completePurchaseUnits = Math.floor(baseAvailable / perPurchase);
    estimatedCostPerProductCents = productsPerLot > 0 ? Math.round(packageCostCents / productsPerLot) : packageCostCents;
    buildableProducts = completePurchaseUnits * productsPerLot;
  } else if (consumptionMode !== 'story_only') {
    const costPerBaseUnit = packageCostCents / perPurchase;
    estimatedCostPerProductCents = Math.round(costPerBaseUnit * quantityUsed);
    buildableProducts = quantityUsed > 0 ? Math.floor(baseAvailable / quantityUsed) : 0;
  }

  return {
    stock_unit_label: resource.purchase_unit_label || resource.stock_unit_label || 'purchase unit',
    usage_unit_label: resource.base_unit_label || resource.usage_unit_label || 'unit',
    usage_units_per_stock_unit: perPurchase,
    quantity_authority: 'base',
    base_available_quantity: baseAvailable,
    estimated_cost_per_product_cents: Math.max(0, estimatedCostPerProductCents),
    buildable_products: Math.max(0, buildableProducts)
  };
}

export async function searchResources(db, env, query = '', limit = 240) {
  const resources = await legacy.searchResources(db, env, query, limit);
  const ids = resources.map((item) => Number(item?.site_item_inventory_id || 0)).filter((id) => id > 0);
  const balances = await loadInventoryBaseBalances(db, ids);
  return resources.map((item) => {
    const id = Number(item?.site_item_inventory_id || 0);
    if (!id) return { ...item, preview: legacy.resourcePreview(item) };
    const merged = mergeInventoryBaseAuthority(item, balances.get(id) || null);
    return { ...merged, preview: resourcePreview(merged) };
  });
}

export async function loadProductLinks(db, productId) {
  const links = await legacy.loadProductLinks(db, productId);
  const out = [];
  for (const link of links) {
    const balance = await loadInventoryBaseBalanceByIdentity(db, link?.resource_kind, link?.source_key);
    const resource = balance ? mergeInventoryBaseAuthority(link?.resource || {}, balance) : { ...(link?.resource || {}) };
    out.push({ ...link, resource, preview: resourcePreview(resource, link) });
  }
  return out;
}
