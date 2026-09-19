// Release 461 base-unit overlay for product/resource availability and costing.
// Legacy loaders remain the identity/catalog compatibility layer; usable/base balance is canonical.
import * as legacy from './_productResourcesDataLegacy.js';
import {
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

function baseAuthorityUnavailableResource(item = {}, link = null) {
  return {
    ...item,
    quantity_authority: Number(item?.site_item_inventory_id || 0) > 0 ? 'base_authority_unavailable' : 'catalog_only',
    base_authority_available: false,
    preview: legacy.resourcePreview(item, link)
  };
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
  let balances;
  try {
    balances = await loadInventoryBaseBalances(db, ids);
  } catch {
    // Live admin availability must not depend on one derived inventory authority.
    // Legacy package quantities are a compatibility fallback only; explicitly mark
    // the base authority unavailable so callers never mistake them for canonical data.
    return resources.map((item) => baseAuthorityUnavailableResource(item));
  }
  return resources.map((item) => {
    const id = Number(item?.site_item_inventory_id || 0);
    if (!id) return { ...item, preview: legacy.resourcePreview(item) };
    const merged = mergeInventoryBaseAuthority(item, balances.get(id) || null);
    return { ...merged, base_authority_available: true, preview: resourcePreview(merged) };
  });
}

export function resourceLinkHealth(link = {}) {
  const resource = link?.resource || {};
  const issues = [];
  const mode = legacy.normalizeConsumptionMode(link?.consumption_mode);
  const kind = String(link?.resource_kind || resource?.item_kind || '').trim().toLowerCase();
  const trackingMode = String(resource?.usage_tracking_mode || (kind === 'tool' ? 'reusable' : 'exact')).trim().toLowerCase();
  const inventoryId = Number(resource?.site_item_inventory_id || 0);
  const unitCostCents = Math.max(0, Math.round(number(resource?.purchase_unit_cost_cents ?? resource?.unit_cost_cents, 0)));
  const lotCount = Math.max(0, Number(resource?.lot_count || 0));
  const lotStatus = String(resource?.lot_reconcile_status || 'needs_review').trim().toLowerCase();
  const quantityDefaulted = Number(link?.quantity_defaulted || 0) === 1;
  const lotSizeDefaulted = Number(link?.lot_size_defaulted || 0) === 1;

  if (!inventoryId) issues.push('missing_inventory_match');
  if (inventoryId && Number(resource?.is_active || 0) !== 1) issues.push('inactive_inventory_match');
  if (mode !== 'story_only' && inventoryId && unitCostCents <= 0) issues.push('missing_cost_evidence');
  if (quantityDefaulted) issues.push('quantity_per_use_defaulted');
  if (mode === 'end_of_lot' && lotSizeDefaulted) issues.push('lot_size_defaulted');
  if (kind === 'supply' && inventoryId && resource?.usage_profile_present === false) issues.push('usage_profile_defaulted');
  if (kind === 'tool' && inventoryId && !['reusable','log_only'].includes(trackingMode)) issues.push('tool_usage_mode_attention');
  if (mode === 'end_of_lot' && inventoryId && lotCount <= 0) issues.push('end_of_lot_without_purchase_lot');
  if (mode === 'end_of_lot' && inventoryId && lotCount > 0 && lotStatus !== 'reconciled') issues.push('lot_reconciliation_attention');

  const preview = resourcePreview(resource, link);
  return {
    status: issues.length ? 'review' : 'ready',
    issue_count: issues.length,
    issues,
    inventory_match: inventoryId > 0,
    site_item_inventory_id: inventoryId,
    usage_tracking_mode: trackingMode,
    quantity_authority: resource?.quantity_authority || (inventoryId ? 'base_migration_required' : 'catalog_only'),
    estimated_cost_per_product_cents: Math.max(0, Number(preview?.estimated_cost_per_product_cents || 0)),
    buildable_products: Math.max(0, Number(preview?.buildable_products || 0)),
    lot_count: lotCount,
    available_lot_count: Math.max(0, Number(resource?.available_lot_count || 0)),
    lot_reconcile_status: lotStatus,
  };
}

export function summarizeProductResourceLinks(links = []) {
  const rows = Array.isArray(links) ? links : [];
  const healthRows = rows.map((link) => link?.health || resourceLinkHealth(link));
  return {
    linked_resource_count: rows.length,
    ready_links: healthRows.filter((row) => row.status === 'ready').length,
    review_links: healthRows.filter((row) => row.status !== 'ready').length,
    missing_inventory_matches: healthRows.filter((row) => row.issues.includes('missing_inventory_match')).length,
    missing_cost_evidence: healthRows.filter((row) => row.issues.includes('missing_cost_evidence')).length,
    usage_setup_attention: healthRows.filter((row) => row.issues.some((code) => ['quantity_per_use_defaulted','usage_profile_defaulted','tool_usage_mode_attention'].includes(code))).length,
    lot_attention: healthRows.filter((row) => row.issues.some((code) => ['lot_size_defaulted','end_of_lot_without_purchase_lot','lot_reconciliation_attention'].includes(code))).length,
    estimated_resource_cost_cents: healthRows.reduce((sum, row) => sum + Math.max(0, Number(row.estimated_cost_per_product_cents || 0)), 0),
    authority: 'product_resource_links + site_item_inventory + base_balances + purchase_lots',
  };
}

export async function loadProductLinks(db, productId) {
  const links = await legacy.loadProductLinks(db, productId);
  const ids = [...new Set(links.map((link) => Number(link?.resource?.site_item_inventory_id || 0)).filter((id) => id > 0))];
  let balances = new Map();
  let baseAuthorityAvailable = true;
  try {
    balances = await loadInventoryBaseBalances(db, ids);
  } catch {
    baseAuthorityAvailable = false;
  }

  return links.map((link) => {
    const inventoryId = Number(link?.resource?.site_item_inventory_id || 0);
    let resource;
    if (!baseAuthorityAvailable) {
      resource = baseAuthorityUnavailableResource(link?.resource || {}, link);
    } else if (inventoryId > 0) {
      resource = mergeInventoryBaseAuthority(link?.resource || {}, balances.get(inventoryId) || null);
      resource.base_authority_available = true;
    } else {
      resource = { ...(link?.resource || {}), base_authority_available: true };
    }
    const shaped = { ...link, resource, preview: resourcePreview(resource, link) };
    return { ...shaped, health: resourceLinkHealth(shaped) };
  });
}

