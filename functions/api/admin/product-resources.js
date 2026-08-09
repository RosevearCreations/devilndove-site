// File: /functions/api/admin/product-resources.js
// Build 243: compatibility endpoint for product/resource links. GET now uses bounded,
// migration-owned schema reads and no longer expands the private Amazon registry or runs PRAGMA.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import {
  loadProducts,
  loadProductLinks,
  normalizeConsumptionMode,
  searchResources
} from './_productResourcesData.js';

function json(data, status = 200) { return jsonResponse(data, status); }
function number(value, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }

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
    const links = Array.isArray(body.links) ? body.links : [];
    if (!productId) return json({ ok: false, error: 'product_id is required.' }, 400);

    const product = await db.prepare(`SELECT product_id FROM products WHERE product_id = ? LIMIT 1`).bind(productId).first();
    if (!product) return json({ ok: false, error: 'Product not found.' }, 404);

    await db.prepare(`DELETE FROM product_resource_links WHERE product_id = ?`).bind(productId).run();

    let saved = 0;
    for (let i = 0; i < links.length; i += 1) {
      const row = links[i] || {};
      const resourceKind = normalizeText(row.resource_kind).toLowerCase();
      const sourceKey = normalizeText(row.source_key);
      if (!['tool', 'supply'].includes(resourceKind) || !sourceKey) continue;

      await db.prepare(`
        INSERT INTO product_resource_links (
          product_id, resource_kind, source_key, quantity_used,
          consumption_mode, lot_size_units, usage_notes, sort_order,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        productId,
        resourceKind,
        sourceKey,
        Math.max(0, number(row.quantity_used, 0)),
        normalizeConsumptionMode(row.consumption_mode),
        Math.max(1, number(row.lot_size_units, 1)),
        normalizeText(row.usage_notes) || null,
        Number(row.sort_order ?? i)
      ).run();
      saved += 1;
    }

    return json({ ok: true, saved_links: saved });
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Failed to save product links.' }, 500);
  }
}
