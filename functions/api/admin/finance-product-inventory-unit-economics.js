// Release 467 Build 25 — read-only Finance ↔ Product/Inventory unit-economics readiness.
// Reconciles Build 24 sellability evidence with the Accounting-owned monthly item-costing read service.
// It does not define accounting profit, target margin, publication authority, inventory authority, or posting authority.
import { getDb, jsonResponse } from '../_lib/adminAudit.js';
import { readAccountingItemCosting } from '../_lib/accountingItemCostingReadService.js';
import { onRequestGet as loadSellability } from './storefront-inventory-sellability.js';

const RELEASE = 467;
const BUILD = 25;
const json = (data, status = 200) => jsonResponse(data, status, { 'Cache-Control': 'no-store' });
const num = (value, fallback = 0) => { const n = Number(value); return Number.isFinite(n) ? n : fallback; };
const text = (value) => String(value == null ? '' : value).trim();

function classify(sellability = {}, costing = null, schemaReady = true) {
  const price = Math.max(0, num(costing?.price_cents, sellability.price_cents));
  const directCost = Math.max(0, num(costing?.direct_unit_cost_cents));
  const resourceCost = Math.max(0, num(costing?.linked_resource_cost_cents));
  const overheadCost = Math.max(0, num(costing?.allocated_overhead_cents));
  const fullCost = Math.max(0, num(costing?.estimated_full_unit_cost_cents));
  const missingCostLinks = Math.max(0, num(costing?.missing_cost_links));
  const hasCostEvidence = directCost > 0 || resourceCost > 0 || overheadCost > 0;
  const headroom = price - fullCost;
  const headroomPercent = price > 0 ? Math.round((headroom / price) * 1000) / 10 : null;

  let costingState = 'estimated_cost_available';
  if (!schemaReady) costingState = 'schema_unavailable';
  else if (!costing) costingState = 'product_costing_unavailable';
  else if (missingCostLinks > 0) costingState = 'missing_cost_links';
  else if (!hasCostEvidence) costingState = 'costing_unverified_zero_cost';

  let economicsState = 'review_supported';
  if (sellability.sellability_state === 'publication_blocked') economicsState = 'publication_blocked';
  else if (sellability.sellability_state === 'fulfillment_blocked') economicsState = 'fulfillment_blocked';
  else if (sellability.sellability_state === 'fulfillment_unverified') economicsState = 'fulfillment_unverified';
  else if (costingState === 'missing_cost_links') economicsState = 'costing_incomplete';
  else if (costingState !== 'estimated_cost_available') economicsState = 'costing_unverified';
  else if (price <= 0) economicsState = 'price_unverified';
  else if (headroom <= 0) economicsState = 'nonpositive_estimated_headroom';

  const issues = [...(Array.isArray(sellability.issues) ? sellability.issues : [])];
  if (costingState === 'missing_cost_links') {
    issues.push({ lane: 'finance_inventory', code: 'missing_cost_links', detail: `${missingCostLinks} linked resource cost reference(s) are missing or unusable.`, owner_url: '/admin/accounting/' });
  } else if (costingState === 'schema_unavailable') {
    issues.push({ lane: 'finance', code: 'costing_schema_unavailable', detail: 'The Accounting item-costing read contract reports required schema evidence unavailable.', owner_url: '/admin/accounting/' });
  } else if (costingState === 'product_costing_unavailable') {
    issues.push({ lane: 'finance', code: 'product_costing_unavailable', detail: 'No Accounting item-costing row was returned for this Product in the selected period.', owner_url: '/admin/accounting/' });
  } else if (costingState === 'costing_unverified_zero_cost') {
    issues.push({ lane: 'finance', code: 'zero_cost_evidence', detail: 'No positive direct, linked-resource, or allocated-overhead cost evidence is present. This is unverified, not automatically zero-cost.', owner_url: '/admin/accounting/' });
  }
  if (economicsState === 'nonpositive_estimated_headroom') {
    issues.push({ lane: 'finance_product', code: 'nonpositive_estimated_headroom', detail: 'Selected-period estimated full unit cost meets or exceeds the current Product price. Review pricing and Finance cost evidence.', owner_url: '/admin/accounting/' });
  }

  return {
    product_id: num(sellability.product_id),
    name: text(sellability.name),
    sku: text(sellability.sku),
    slug: text(sellability.slug),
    product_type: text(sellability.product_type) || 'physical',
    status: text(sellability.status),
    review_status: text(sellability.review_status),
    currency: text(costing?.currency) || 'CAD',
    price_cents: price,
    sellability_state: text(sellability.sellability_state),
    fulfillment_state: text(sellability.fulfillment_state),
    publication_ready: Boolean(sellability.publication_ready),
    fulfillment_supported: Boolean(sellability.fulfillment_supported),
    direct_stock_units: Math.max(0, num(sellability.direct_stock_units)),
    buildable_units_from_resources: sellability.buildable_units_from_resources == null ? null : Math.max(0, num(sellability.buildable_units_from_resources)),
    resource_shortage_links: Math.max(0, num(sellability.resource_shortage_links)),
    linked_resource_count: Math.max(0, num(costing?.linked_resource_count, sellability.linked_resource_count)),
    missing_cost_links: missingCostLinks,
    direct_unit_cost_cents: directCost,
    linked_resource_cost_cents: resourceCost,
    allocated_overhead_cents: overheadCost,
    allocated_overhead_pool_cents: Math.max(0, num(costing?.allocated_overhead_pool_cents)),
    estimated_full_unit_cost_cents: fullCost,
    estimated_price_headroom_cents: headroom,
    estimated_price_headroom_percent: headroomPercent,
    sold_quantity_in_period: Math.max(0, num(costing?.sold_quantity_in_period)),
    sold_order_count_in_period: Math.max(0, num(costing?.sold_order_count_in_period)),
    sold_revenue_cents_in_period: Math.max(0, num(costing?.sold_revenue_cents_in_period)),
    direct_cost_effective_date: text(costing?.direct_cost_effective_date),
    allocation_basis: text(costing?.allocation_basis),
    costing_state: costingState,
    economics_state: economicsState,
    economics_review_supported: economicsState === 'review_supported',
    issues,
    owner_urls: {
      product: sellability.owner_urls?.product || `/admin/products/?product_id=${encodeURIComponent(num(sellability.product_id))}`,
      storefront_inventory: '/admin/storefront-inventory-sellability/',
      inventory: '/admin/inventory-intelligence/',
      finance: '/admin/accounting/',
    },
  };
}

export async function onRequestGet(context) {
  try {
    const sellabilityResponse = await loadSellability(context);
    const sellabilityPayload = await sellabilityResponse.json().catch(() => null);
    if (!sellabilityResponse.ok || !sellabilityPayload || sellabilityPayload.ok === false) {
      return json({ ok: false, release: RELEASE, build: BUILD, error: sellabilityPayload?.error || `Sellability authority returned HTTP ${sellabilityResponse.status}.` }, sellabilityResponse.status || 500);
    }

    const url = new URL(context.request.url);
    const month = text(url.searchParams.get('month')) || new Date().toISOString().slice(0, 7);
    const costing = await readAccountingItemCosting(getDb(context.env), { month });
    const costingByProduct = new Map((Array.isArray(costing.items) ? costing.items : []).map((item) => [num(item.product_id), item]));
    const products = (Array.isArray(sellabilityPayload.products) ? sellabilityPayload.products : [])
      .map((product) => classify(product, costingByProduct.get(num(product.product_id)) || null, costing.schema_ready !== false));

    const summary = {
      total_products: products.length,
      review_supported: products.filter((p) => p.economics_state === 'review_supported').length,
      publication_blocked: products.filter((p) => p.economics_state === 'publication_blocked').length,
      fulfillment_blocked: products.filter((p) => p.economics_state === 'fulfillment_blocked').length,
      fulfillment_unverified: products.filter((p) => p.economics_state === 'fulfillment_unverified').length,
      costing_incomplete: products.filter((p) => p.economics_state === 'costing_incomplete').length,
      costing_unverified: products.filter((p) => p.economics_state === 'costing_unverified').length,
      nonpositive_estimated_headroom: products.filter((p) => p.economics_state === 'nonpositive_estimated_headroom').length,
      products_sold_in_period: products.filter((p) => p.sold_quantity_in_period > 0).length,
    };

    return json({
      ok: true,
      release: RELEASE,
      build: BUILD,
      role: 'read_only_cross_module_unit_economics_readiness',
      period: costing.period || month,
      authorities: {
        sellability: '/api/admin/storefront-inventory-sellability',
        finance_item_costing_contract: costing.contract || 'accounting-item-costing-read',
        finance_item_costing_owner: costing.owner || 'accounting',
        product_owner: '/admin/products/',
        inventory_owner: '/admin/inventory-intelligence/',
        finance_owner: '/admin/accounting/',
      },
      boundaries: {
        accounting_profit_claimed: false,
        target_margin_defined: false,
        economics_review_is_authorization: false,
        automatic_price_mutation: false,
        automatic_product_mutation: false,
        automatic_inventory_mutation: false,
        accounting_posting: false,
        public_offer_rule_changed: false,
        provider_execution: false,
        request_time_schema_mutation: false,
      },
      semantics: {
        estimated_full_unit_cost_cents: 'Accounting-owned selected-period estimate: direct Product cost + linked-resource cost + allocated overhead evidence.',
        estimated_price_headroom_cents: 'Current Product price minus Accounting estimated full unit cost. This is review evidence, not accounting profit.',
        costing_unverified: 'Not an automatic zero-cost conclusion. Finance evidence is absent or unavailable.',
        review_supported: 'Sellability evidence is supported, costing evidence is present, and estimated price headroom is positive. It does not authorize pricing, publication, fulfillment, or accounting action.',
      },
      costing_schema_ready: costing.schema_ready !== false,
      costing_optional_table_availability: costing.optional_table_availability || {},
      finance_summary: costing.summary || {},
      sellability_summary: sellabilityPayload.summary || {},
      upstream_warnings: Array.isArray(sellabilityPayload.upstream_warnings) ? sellabilityPayload.upstream_warnings : [],
      summary,
      products,
    });
  } catch (error) {
    const status = error?.code === 'invalid_accounting_month' ? 400 : 500;
    return json({ ok: false, release: RELEASE, build: BUILD, error: error?.message || 'Unit-economics readiness could not load.' }, status);
  }
}
