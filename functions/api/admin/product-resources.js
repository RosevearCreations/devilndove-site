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

      const inserted = await db.prepare(`
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
      const linkId = Number(inserted?.meta?.last_row_id || 0);
      if (linkId && resourceKind === 'supply') {
        await db.prepare(`
          INSERT INTO product_resource_ingredient_profiles (
            product_resource_link_id,is_label_ingredient,ingredient_name_en,ingredient_name_fr,inci_name,
            label_sort_order,translation_review_status,updated_by_user_id,created_at,updated_at
          ) VALUES (?,?,?,?,?,?,'needs_review',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
          ON CONFLICT(product_resource_link_id) DO UPDATE SET
            is_label_ingredient=excluded.is_label_ingredient,
            ingredient_name_en=excluded.ingredient_name_en,
            ingredient_name_fr=excluded.ingredient_name_fr,
            inci_name=excluded.inci_name,
            label_sort_order=excluded.label_sort_order,
            translation_review_status='needs_review',
            updated_by_user_id=excluded.updated_by_user_id,
            updated_at=CURRENT_TIMESTAMP
        `).bind(
          linkId,
          Number(row.is_label_ingredient || 0) === 1 ? 1 : 0,
          normalizeText(row.ingredient_name_en) || null,
          normalizeText(row.ingredient_name_fr) || null,
          normalizeText(row.inci_name) || null,
          Number(row.label_sort_order ?? i),
          Number(adminUser.user_id || 0) || null
        ).run();
      }
      saved += 1;
    }

    const persistedLinks = await loadProductLinks(db, productId);
    return json({ ok: true, saved_links: saved, links: persistedLinks });
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Failed to save product links.' }, 500);
  }
}
