// Release 467 Build 24 — read-only Storefront ↔ Inventory sellability reconciliation.
// This projection reuses the existing admin Product read model. It never changes Product publication,
// finished-goods quantity, Supply quantity, Product resource links, Storefront membership, or provider state.
import { jsonResponse } from '../_lib/adminAudit.js';
import { onRequestGet as loadAdminProducts } from './products.js';

const RELEASE = 467;
const BUILD = 24;
const json = (data, status = 200) => jsonResponse(data, status, { 'Cache-Control': 'no-store' });
const num = (value, fallback = 0) => { const n = Number(value); return Number.isFinite(n) ? n : fallback; };
const text = (value) => String(value == null ? '' : value).trim();
const lower = (value) => text(value).toLowerCase();

function classify(product = {}) {
  const publicationReady = num(product.is_ready_for_storefront) === 1;
  const inventoryTracked = num(product.inventory_tracking) === 1;
  const directStockUnits = Math.max(0, num(product.inventory_quantity));
  const linkedResourceCount = Math.max(0, num(product.linked_resource_count));
  const shortageLinks = Math.max(0, num(product.resource_shortage_links));
  const buildableUnits = product.buildable_units_from_resources == null
    ? null
    : Math.max(0, num(product.buildable_units_from_resources));
  const digital = lower(product.product_type) === 'digital';

  let fulfillmentState = 'unverified';
  let fulfillmentSupported = false;
  if (digital) {
    fulfillmentState = 'not_applicable';
    fulfillmentSupported = true;
  } else if (inventoryTracked && directStockUnits > 0) {
    fulfillmentState = 'in_stock';
    fulfillmentSupported = true;
  } else if (linkedResourceCount > 0 && buildableUnits != null && buildableUnits > 0 && shortageLinks === 0) {
    fulfillmentState = 'buildable';
    fulfillmentSupported = true;
  } else if (linkedResourceCount > 0 && (shortageLinks > 0 || buildableUnits === 0)) {
    fulfillmentState = 'resource_blocked';
  } else if (inventoryTracked && directStockUnits <= 0) {
    fulfillmentState = 'stock_blocked';
  }

  const issues = [];
  if (!publicationReady) {
    issues.push({
      lane: 'storefront',
      code: 'publication_readiness',
      detail: text(product.ready_check_notes) || 'Storefront publication readiness has one or more unmet checks.',
      owner_url: `/admin/products/?product_id=${encodeURIComponent(num(product.product_id))}`,
    });
  }
  if (!digital && fulfillmentState === 'resource_blocked') {
    issues.push({
      lane: 'inventory',
      code: 'resource_shortage',
      detail: `${shortageLinks} linked resource shortage(s); buildable units ${buildableUnits == null ? 'unknown' : buildableUnits}.`,
      owner_url: '/admin/inventory-intelligence/',
    });
  } else if (!digital && fulfillmentState === 'stock_blocked') {
    issues.push({
      lane: 'inventory',
      code: 'finished_stock',
      detail: 'Finished-goods inventory tracking is enabled and available quantity is zero.',
      owner_url: `/admin/products/?product_id=${encodeURIComponent(num(product.product_id))}`,
    });
  } else if (!digital && fulfillmentState === 'unverified') {
    issues.push({
      lane: 'inventory',
      code: 'availability_unverified',
      detail: 'No positive finished-stock or linked-resource buildability evidence is available in this projection.',
      owner_url: '/admin/inventory-intelligence/',
    });
  }

  const sellabilityState = !publicationReady
    ? 'publication_blocked'
    : fulfillmentSupported
      ? 'sellability_supported'
      : fulfillmentState === 'unverified'
        ? 'fulfillment_unverified'
        : 'fulfillment_blocked';

  return {
    product_id: num(product.product_id),
    name: text(product.name) || `Product ${num(product.product_id)}`,
    sku: text(product.sku),
    slug: text(product.slug),
    product_type: text(product.product_type) || 'physical',
    status: text(product.status),
    review_status: text(product.review_status),
    price_cents: num(product.price_cents),
    publication_ready: publicationReady,
    publication_score: num(product.publish_readiness_score),
    publication_notes: text(product.ready_check_notes),
    inventory_tracked: inventoryTracked,
    direct_stock_units: directStockUnits,
    linked_resource_count: linkedResourceCount,
    buildable_units_from_resources: buildableUnits,
    resource_shortage_links: shortageLinks,
    fulfillment_state: fulfillmentState,
    fulfillment_supported: fulfillmentSupported,
    sellability_state: sellabilityState,
    issues,
    correction_owner: !publicationReady ? 'product_storefront' : fulfillmentSupported ? 'none' : 'inventory',
    owner_urls: {
      product: `/admin/products/?product_id=${encodeURIComponent(num(product.product_id))}`,
      storefront_quality: '/admin/storefront-quality/',
      inventory: '/admin/inventory-intelligence/',
    },
  };
}

export async function onRequestGet(context) {
  try {
    const upstream = await loadAdminProducts(context);
    const payload = await upstream.json().catch(() => null);
    if (!upstream.ok || !payload || payload.ok === false) {
      return json({
        ok: false,
        release: RELEASE,
        build: BUILD,
        error: payload?.error || `Admin Product authority returned HTTP ${upstream.status}.`,
      }, upstream.status || 500);
    }

    const products = (Array.isArray(payload.products) ? payload.products : []).map(classify);
    const summary = {
      total_products: products.length,
      publication_blocked: products.filter((p) => p.sellability_state === 'publication_blocked').length,
      sellability_supported: products.filter((p) => p.sellability_state === 'sellability_supported').length,
      fulfillment_blocked: products.filter((p) => p.sellability_state === 'fulfillment_blocked').length,
      fulfillment_unverified: products.filter((p) => p.sellability_state === 'fulfillment_unverified').length,
      resource_blocked: products.filter((p) => p.fulfillment_state === 'resource_blocked').length,
      finished_stock_blocked: products.filter((p) => p.fulfillment_state === 'stock_blocked').length,
      buildable: products.filter((p) => p.fulfillment_state === 'buildable').length,
      in_stock: products.filter((p) => p.fulfillment_state === 'in_stock').length,
    };

    return json({
      ok: true,
      release: RELEASE,
      build: BUILD,
      role: 'read_only_cross_module_sellability_reconciliation',
      authorities: {
        product_read_model: '/api/admin/products',
        product_publication_owner: '/admin/products/',
        storefront_quality_owner: '/admin/storefront-quality/',
        inventory_owner: '/admin/inventory-intelligence/',
        inventory_truth: 'products.inventory_quantity + site_item_inventory + product_resource_links',
      },
      boundaries: {
        automatic_unpublish: false,
        automatic_product_mutation: false,
        automatic_inventory_mutation: false,
        automatic_resource_link_mutation: false,
        public_offer_rule_changed: false,
        provider_execution: false,
        request_time_schema_mutation: false,
      },
      semantics: {
        publication_ready: 'Existing Product/Storefront hard-readiness evidence only.',
        fulfillment_supported: 'Positive finished-stock, linked-resource buildability, or digital-product evidence in the current read model.',
        fulfillment_unverified: 'Not an automatic error; it means this projection has no positive fulfillment evidence to rely on.',
        sellability_supported: 'Review evidence, not an authorization to publish, sell, reserve, build, or ship.',
      },
      upstream_warnings: Array.isArray(payload.warnings) ? payload.warnings : [],
      summary,
      products,
    });
  } catch (error) {
    return json({ ok: false, release: RELEASE, build: BUILD, error: error?.message || 'Sellability reconciliation could not load.' }, 500);
  }
}
