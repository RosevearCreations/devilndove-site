// Release 467 Build 63 — central D1 read-budget guardrails.
// Extended in Build 72 for bounded Inventory / Reorder Economics projections.
// Extended in Build 73 for the bounded Product Media / Photo Studio convergence projection.
// This module exposes source-side caps and operator metadata. It does not claim to
// replace Cloudflare's provider-side D1 usage metering.

// Keep the Build 63 contract version stable: later builds may extend route budgets,
// but existing clients/gates use this as the compatibility identity of the guardrail layer.
export const D1_READ_BUDGET_VERSION = 'R467B63_V1';

export const D1_READ_BUDGETS = Object.freeze({
  admin_products: Object.freeze({
    route: '/api/admin/products',
    risk: 'critical',
    contract: 'one_primary_rollup_per_short_browser_window',
    browser_cache_ms: 45000,
    max_concurrent_identical_gets: 1,
    notes: 'Legacy full Product rollup remains one bounded primary read until the Product workspace split. Secondary Product startup callers must reuse the shared response.'
  }),
  admin_product_picker: Object.freeze({
    route: '/api/admin/product-picker',
    risk: 'low',
    contract: 'keyset_first_page_or_prefix_search',
    default_limit: 100,
    max_limit: 150,
    min_search_length: 3,
    search_mode: 'prefix_only',
    cursor: 'product_id_desc',
    browser_cache_ms: 60000,
    notes: 'Used for degraded Product picker recovery instead of the heavier Product resource bootstrap.'
  }),
  admin_product_mobile_bootstrap: Object.freeze({
    route: '/api/admin/product-mobile-bootstrap',
    risk: 'medium',
    contract: 'options_only_preferred_for_editor_startup',
    browser_cache_ms: 60000,
    max_concurrent_identical_gets: 1
  }),
  admin_product_resource_bootstrap: Object.freeze({
    route: '/api/admin/product-resource-bootstrap',
    risk: 'high',
    contract: 'explicit_product_resource_work_only',
    browser_cache_ms: 30000,
    max_concurrent_identical_gets: 1,
    notes: 'No longer used for Product picker recovery in Build 63.'
  }),
  admin_product_readiness: Object.freeze({
    route: '/api/admin/product-readiness',
    risk: 'medium',
    contract: 'bounded_projection',
    server_max_limit: 300,
    browser_cache_ms: 30000,
    max_concurrent_identical_gets: 1
  }),
  admin_product_media_authority: Object.freeze({
    route: '/api/admin/product-media-authority',
    risk: 'medium',
    contract: 'selected_product_media_convergence_only',
    server_caps: Object.freeze({
      product: 1,
      seo: 1,
      product_images: 20,
      media_assets: 30,
      role_assignments: 20,
      annotations: 30,
      quality_reviews: 30,
      quality_assessments: 30
    }),
    max_concurrent_identical_gets: 1,
    notes: 'Build 73 is loaded only after an operator selects one Product in Catalog Media. The projection is read-only, never performs blank catalog scans, and never copies/deletes R2 objects or publishes to social providers.'
  }),
  admin_inventory_replenishment: Object.freeze({
    route: '/api/admin/inventory-replenishment',
    risk: 'medium',
    contract: 'bounded_operator_projection',
    server_caps: Object.freeze({
      inventory: 500,
      purchase_orders: 120,
      recent_receipts: 40,
      usage_aggregate_items: 500,
      supplier_landed_cost_groups: 300,
      product_resource_links: 800
    }),
    max_concurrent_identical_gets: 1,
    notes: 'Build 72 adds recommendation-only stock coverage, received-lot landed-cost comparison and linked-Product resource economics. Every contributing query has an explicit hard cap and this route remains an operator-opened workspace, not admin startup work.'
  }),
  admin_pending_actions: Object.freeze({
    route: '/api/admin/pending-actions',
    risk: 'medium',
    contract: 'secondary_startup_only',
    browser_cache_ms: 20000,
    max_concurrent_identical_gets: 1
  })
});

export function clampBudgetInteger(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(parsed)));
}

export function resolveProductPickerBudget(url) {
  const budget = D1_READ_BUDGETS.admin_product_picker;
  const requestedLimit = Number(url.searchParams.get('limit'));
  const limit = clampBudgetInteger(requestedLimit, budget.default_limit, 1, budget.max_limit);
  const rawCursor = Number(url.searchParams.get('cursor'));
  const cursor = Number.isInteger(rawCursor) && rawCursor > 0 ? rawCursor : null;
  const searchProvided = url.searchParams.has('q');
  const q = String(url.searchParams.get('q') ?? '').trim();
  const searchBlocked = searchProvided && q.length < budget.min_search_length;
  const warnings = [];

  if (Number.isFinite(requestedLimit) && requestedLimit > budget.max_limit) {
    warnings.push(`limit_clamped_to_${budget.max_limit}`);
  }
  if (searchBlocked) warnings.push(`search_term_requires_${budget.min_search_length}_characters`);

  return {
    limit,
    cursor,
    q,
    searchProvided,
    searchBlocked,
    warnings,
    budget
  };
}

export function buildReadBudgetHeaders(routeKey, state = {}) {
  const budget = D1_READ_BUDGETS[routeKey] || {};
  const cap = Number(state.limit || budget.max_limit || budget.server_max_limit || 0);
  return {
    'X-DD-D1-Read-Budget-Version': D1_READ_BUDGET_VERSION,
    'X-DD-D1-Route-Key': routeKey,
    'X-DD-D1-Guard': String(budget.contract || 'bounded_read'),
    ...(cap > 0 ? { 'X-DD-D1-Row-Return-Cap': String(cap) } : {})
  };
}

export function publicReadBudgetSnapshot() {
  return {
    version: D1_READ_BUDGET_VERSION,
    provider_metering_note: 'These are application guardrails and row-return/request caps, not Cloudflare provider-side rows-read usage totals.',
    routes: Object.fromEntries(Object.entries(D1_READ_BUDGETS).map(([key, value]) => [key, { ...value }]))
  };
}
