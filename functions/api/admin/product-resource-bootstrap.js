// Build 243/current: lightweight product/resource editor bootstrap. No Amazon registry and no schema PRAGMAs.
// Build 157 bounds Product identity delivery so this secondary workspace cannot preload a 600-row Product universe.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { loadProducts, loadProductLinks, summarizeProductResourceLinks, buildProfitabilityEvidence } from './_productResourcesData.js';

const DEFAULT_PRODUCT_LIMIT = 80;
const MAX_PRODUCT_LIMIT = 120;

function boundedProductLimit(url) {
  const requested = Math.trunc(Number(url.searchParams.get('limit') || DEFAULT_PRODUCT_LIMIT)) || DEFAULT_PRODUCT_LIMIT;
  return Math.max(1, Math.min(MAX_PRODUCT_LIMIT, requested));
}

export async function onRequestGet({ request, env }) {
  const db = getDb(env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401);
  try {
    const url = new URL(request.url);
    const productId = Number(url.searchParams.get('product_id') || 0);
    const productLimit = boundedProductLimit(url);
    const [products, links, selectedProduct] = await Promise.all([
      loadProducts(db, env, productLimit),
      loadProductLinks(db, productId),
      productId > 0
        ? db.prepare(`
            SELECT product_id,name,price_cents,currency,status,review_status,updated_at
            FROM products WHERE product_id=? LIMIT 1
          `).bind(productId).first()
        : Promise.resolve(null),
    ]);
    const profitabilityEvidence = productId > 0 ? buildProfitabilityEvidence(selectedProduct, links) : null;
    return jsonResponse({
      ok: true,
      products,
      links,
      link_health_summary: summarizeProductResourceLinks(links),
      profitability_evidence: profitabilityEvidence,
      selected_product_evidence: selectedProduct ? {
        product_id: Number(selectedProduct.product_id || 0),
        name: selectedProduct.name || '',
        price_cents: Math.max(0, Number(selectedProduct.price_cents || 0)),
        currency: selectedProduct.currency || 'CAD',
        status: selectedProduct.status || '',
        review_status: selectedProduct.review_status || '',
        updated_at: selectedProduct.updated_at || null,
      } : null,
      product_id: productId,
      read_budget: {
        delivery: 'build185-bounded-resource-linkage',
        product_row_limit: productLimit,
        product_row_limit_default: DEFAULT_PRODUCT_LIMIT,
        product_row_limit_max: MAX_PRODUCT_LIMIT,
        resource_catalog_preloaded: false,
        selected_product_links_only: productId > 0,
        base_balance_reads: productId > 0 ? 'single_batched_IN_query' : 'none',
        catalog_inventory_linkage: 'grouped_ranked_once_per_selected_product',
        profitability_evidence: productId > 0 ? 'selected_product_plus_saved_links_only' : 'none',
        unknown_cost_policy: 'unknown_never_zero',
      },
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: error?.message || 'Failed to load product-resource bootstrap data.' }, 500);
  }
}
