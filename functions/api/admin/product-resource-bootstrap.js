// Build 243/current: lightweight product/resource editor bootstrap. No Amazon registry and no schema PRAGMAs.
// Build 157 bounds Product identity delivery so this secondary workspace cannot preload a 600-row Product universe.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { loadProducts, loadProductLinks } from './_productResourcesData.js';

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
    const [products, links] = await Promise.all([
      loadProducts(db, env, productLimit),
      loadProductLinks(db, productId),
    ]);
    return jsonResponse({
      ok: true,
      products,
      links,
      product_id: productId,
      read_budget: {
        delivery: 'build157-bounded-bootstrap',
        product_row_limit: productLimit,
        product_row_limit_default: DEFAULT_PRODUCT_LIMIT,
        product_row_limit_max: MAX_PRODUCT_LIMIT,
        resource_catalog_preloaded: false,
        selected_product_links_only: productId > 0,
      },
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: error?.message || 'Failed to load product-resource bootstrap data.' }, 500);
  }
}
