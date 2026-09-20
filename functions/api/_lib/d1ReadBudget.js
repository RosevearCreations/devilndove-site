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
  admin_catalog_health_v181: Object.freeze({
    route: '/api/admin/catalog-health',
    risk: 'high',
    contract: 'explicit_only_grouped_authority_scan',
    returned_rows_max: 40,
    browser_cache_ms: 30000,
    max_concurrent_identical_gets: 1,
    notes: 'Build 184 quota hardening: Catalog Health no longer reads on page startup. Inventory/catalog evidence must use grouped CTEs/joins rather than correlated per-row rescans.'
  }),
  admin_inventory_identity_health_v183: Object.freeze({
    route: '/api/admin/inventory-identity-health',
    risk: 'critical',
    contract: 'explicit_only_linear_inventory_catalog_scan',
    returned_rows_max: 40,
    browser_cache_ms: 30000,
    max_concurrent_identical_gets: 1,
    notes: 'Build 184 quota hardening: duplicate and catalog-reference evidence is pre-aggregated once. Correlated Inventory/catalog subqueries are prohibited.'
  }),
  admin_catalog_image_repair_v184: Object.freeze({
    route: '/api/admin/catalog-image-repair',
    risk: 'high',
    contract: 'explicit_only_grouped_image_inventory_scan',
    returned_rows_max: 40,
    browser_cache_ms: 30000,
    max_concurrent_identical_gets: 1,
    notes: 'Build 184 quota hardening: Product/Inventory image health is explicit-only; Tool/Supply catalog matching is one grouped/ranked pass and R2 evidence is one object HEAD.'
  }),
  admin_product_resource_linkage_v185: Object.freeze({
    route: '/api/admin/product-resource-bootstrap',
    risk: 'medium',
    contract: 'explicit_selected_product_grouped_linkage',
    server_caps: Object.freeze({
      products: 120,
      selected_product_links: 120,
      resource_search: 120,
      base_balance_ids: 120
    }),
    browser_cache_ms: 30000,
    max_concurrent_identical_gets: 1,
    notes: 'Build 185: Product resource work remains explicit-only. Inventory/catalog identity is grouped/ranked once, base-unit balances are loaded in one batched IN query, and blank resource search returns zero rows.'
  }),
  admin_catalog_repair_recheck_v187: Object.freeze({
    route: '/api/admin/catalog-health',
    risk: 'low',
    contract: 'explicit_one_record_recheck_no_mutation',
    returned_rows_max: 1,
    browser_cache_ms: 0,
    max_concurrent_identical_gets: 1,
    notes: 'Build 187: explicit Product or Inventory target recheck only. Returns routing/stale evidence and never mutates Product, Inventory, R2, provider, payment or accounting state.'
  }),
  admin_product_buyer_recheck_v188: Object.freeze({
    route: '/api/admin/product-buyer-readiness',
    risk: 'low',
    contract: 'explicit_one_product_buyer_readiness_recheck',
    returned_rows_max: 1,
    browser_cache_ms: 0,
    max_concurrent_identical_gets: 1,
    notes: 'Build 188: explicit one-Product buyer-readiness recheck. It returns blocker/advisory/public-visibility evidence and performs no Product save or publication action.'
  }),
  admin_inventory_evidence_recheck_v189: Object.freeze({
    route: '/api/admin/inventory-identity-health',
    risk: 'low',
    contract: 'explicit_one_inventory_record_evidence_recheck',
    returned_rows_max: 1,
    browser_cache_ms: 0,
    max_concurrent_identical_gets: 1,
    notes: 'Build 189: one Inventory target plus at most 12 duplicate-group and 12 catalog-reference evidence rows. Build 200 may expose those supplier/source values as candidates only; no auto-fill, merge, count, stock, cost, reorder, purchasing or catalog mutation.'
  }),
  admin_inventory_supplier_source_workbench_v200: Object.freeze({
    route: '/api/admin/inventory-identity-health',
    risk: 'medium',
    contract: 'explicit_supplier_source_evidence_queue',
    returned_rows_max: 40,
    browser_cache_ms: 0,
    max_concurrent_identical_gets: 1,
    notes: 'Build 200: explicit-only supplier/source queue. Blank provenance stays unknown; reviewed N/A uses explicit Inventory notes markers, and candidate values are never selected automatically.'
  }),
  admin_media_evidence_recheck_v190: Object.freeze({
    route: '/api/admin/catalog-image-repair',
    risk: 'low',
    contract: 'explicit_one_media_record_plus_single_r2_head',
    returned_rows_max: 1,
    browser_cache_ms: 0,
    max_concurrent_identical_gets: 1,
    notes: 'Build 190: one selected Product image or Inventory image metadata read plus at most one canonical R2 object HEAD. No bucket listing, reassignment, upload, copy or delete.'
  }),
  admin_product_profitability_evidence_v191: Object.freeze({
    route: '/api/admin/product-resource-bootstrap',
    risk: 'low',
    contract: 'explicit_selected_product_profitability_evidence',
    returned_rows_max: 1,
    browser_cache_ms: 0,
    max_concurrent_identical_gets: 1,
    notes: 'Build 191: selected Product price plus its already-bounded saved resource links only. Missing cost remains unknown; no accounting, Inventory, Product, purchasing or payment mutation.'
  }),
  admin_cost_margin_readiness_v203: Object.freeze({
    route: '/api/admin/cost-margin-readiness',
    risk: 'medium',
    contract: 'explicit_only_grouped_product_resource_cost_evidence',
    returned_rows_max: 40,
    browser_cache_ms: 0,
    max_concurrent_identical_gets: 1,
    notes: 'Build 203: explicit missing-cost and linked-resource margin-readiness evidence. Inventory/Product Resources remain mutation owners; missing cost is unknown and never coerced to zero.'
  }),
  admin_cost_margin_recheck_v203: Object.freeze({
    route: '/api/admin/cost-margin-readiness',
    risk: 'low',
    contract: 'explicit_one_product_resource_cost_recheck',
    returned_rows_max: 1,
    browser_cache_ms: 0,
    max_concurrent_identical_gets: 1,
    notes: 'Build 203: one selected Product-resource link recheck after operator repair. It reports stale evidence and never writes Inventory cost, Product price or accounting state.'
  }),
  admin_storefront_launch_set_v204: Object.freeze({
    route: '/api/admin/storefront-launch-set',
    risk: 'high',
    contract: 'explicit_only_grouped_launch_readiness_projection',
    returned_rows_max: 40,
    browser_cache_ms: 0,
    max_concurrent_identical_gets: 1,
    notes: 'Build 204: bounded Product launch-set convergence over buyer, media, linked Inventory/cost and current publication evidence. Ready never authorizes automatic publication or provider/payment execution.'
  }),
  admin_storefront_launch_recheck_v204: Object.freeze({
    route: '/api/admin/storefront-launch-set',
    risk: 'low',
    contract: 'explicit_one_product_launch_evidence_recheck',
    returned_rows_max: 1,
    browser_cache_ms: 0,
    max_concurrent_identical_gets: 1,
    notes: 'Build 204: one Product launch-evidence recheck with stale token detection and zero Product/Inventory/R2/provider/payment/accounting mutation.'
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
