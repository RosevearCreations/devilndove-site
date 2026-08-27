// File: /functions/api/admin/product-resources.js
// Build 440: bounded Product/resource compatibility endpoint using the shared atomic persistence authority.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import {
  loadProducts,
  loadProductLinks,
  searchResources
} from './_productResourcesData.js';
import {
  normalizeSubmittedLinks,
  persistProductResourceLinks
} from './_productResourcePersistence.js';

function json(data, status = 200) { return jsonResponse(data, status); }

export async function onRequestGet({ request, env }) {
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  try {
    const url = new URL(request.url);
    const productId = Number(url.searchParams.get('product_id') || 0);
    const q = normalizeText(url.searchParams.get('q')).toLowerCase();
    const [products, resources, links] = await Promise.all([
      loadProducts(db, env, 600),
      searchResources(db, env, q, 240),
      loadProductLinks(db, productId)
    ]);
    return json({ ok: true, products, resources, links });
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Failed to load product tools and supplies.' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  let body = {};
  try { body = await request.json(); }
  catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }

  try {
    const productId = Number(body.product_id || 0);
    if (!productId) return json({ ok: false, error: 'product_id is required.' }, 400);
    const product = await db.prepare(`SELECT product_id FROM products WHERE product_id = ? LIMIT 1`).bind(productId).first();
    if (!product) return json({ ok: false, error: 'Product not found.' }, 404);

    const links = await persistProductResourceLinks({
      db,
      productId,
      links: Array.isArray(body.links) ? body.links : [],
      adminUserId: Number(adminUser.user_id || 0) || null
    });

    const persistedLinks = await loadProductLinks(db, productId);
    return json({ ok: true, saved_links: links.length, links: persistedLinks });
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Failed to save product links.' }, 500);
  }
}

export { normalizeSubmittedLinks };
