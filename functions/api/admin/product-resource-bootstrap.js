// Build 243: lightweight product/resource editor bootstrap. No Amazon registry and no schema PRAGMAs.
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { loadProducts, loadProductLinks } from './_productResourcesData.js';

export async function onRequestGet({ request, env }) {
  const db = getDb(env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Unauthorized.' }, 401);
  try {
    const url = new URL(request.url);
    const productId = Number(url.searchParams.get('product_id') || 0);
    const [products, links] = await Promise.all([loadProducts(db, env, 600), loadProductLinks(db, productId)]);
    return jsonResponse({ ok: true, products, links, product_id: productId });
  } catch (error) {
    return jsonResponse({ ok: false, error: error?.message || 'Failed to load product-resource bootstrap data.' }, 500);
  }
}
