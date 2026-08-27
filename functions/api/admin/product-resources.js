// File: /functions/api/admin/product-resources.js
// Build 440: bounded Product/resource compatibility endpoint with atomic link persistence.
// Missing/non-positive use-per-batch and lot-size values default to 1; submitted identities are deduplicated.

import { getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import {
  loadProducts,
  loadProductLinks,
  normalizeConsumptionMode,
  searchResources
} from './_productResourcesData.js';

function json(data, status = 200) { return jsonResponse(data, status); }
function number(value, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
function positive(value, fallback = 1) { const parsed = number(value, fallback); return parsed > 0 ? parsed : fallback; }

function normalizeSubmittedLinks(input = []) {
  const out = [];
  const seen = new Set();
  for (let i = 0; i < input.length; i += 1) {
    const row = input[i] || {};
    const resourceKind = normalizeText(row.resource_kind).toLowerCase();
    const sourceKey = normalizeText(row.source_key);
    if (!['tool', 'supply'].includes(resourceKind) || !sourceKey) continue;
    const identity = `${resourceKind}\u0000${sourceKey}`;
    if (seen.has(identity)) continue;
    seen.add(identity);
    out.push({
      resource_kind: resourceKind,
      source_key: sourceKey,
      quantity_used: positive(row.quantity_used, 1),
      consumption_mode: normalizeConsumptionMode(row.consumption_mode),
      lot_size_units: positive(row.lot_size_units, 1),
      usage_notes: normalizeText(row.usage_notes) || null,
      sort_order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : i,
      is_label_ingredient: Number(row.is_label_ingredient || 0) === 1 ? 1 : 0,
      ingredient_name_en: normalizeText(row.ingredient_name_en) || null,
      ingredient_name_fr: normalizeText(row.ingredient_name_fr) || null,
      inci_name: normalizeText(row.inci_name) || null,
      label_sort_order: Number.isFinite(Number(row.label_sort_order)) ? Number(row.label_sort_order) : i,
    });
  }
  return out;
}

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

    const links = normalizeSubmittedLinks(Array.isArray(body.links) ? body.links : []);
    const statements = [db.prepare(`DELETE FROM product_resource_links WHERE product_id = ?`).bind(productId)];

    for (const row of links) {
      statements.push(db.prepare(`
        INSERT INTO product_resource_links (
          product_id, resource_kind, source_key, quantity_used,
          consumption_mode, lot_size_units, usage_notes, sort_order,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        productId,row.resource_kind,row.source_key,row.quantity_used,row.consumption_mode,
        row.lot_size_units,row.usage_notes,row.sort_order
      ));
      if (row.resource_kind === 'supply') {
        statements.push(db.prepare(`
          INSERT INTO product_resource_ingredient_profiles (
            product_resource_link_id,is_label_ingredient,ingredient_name_en,ingredient_name_fr,inci_name,
            label_sort_order,translation_review_status,updated_by_user_id,created_at,updated_at
          )
          SELECT product_resource_link_id,?,?,?,?,?,'needs_review',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
          FROM product_resource_links
          WHERE product_id=? AND resource_kind=? AND source_key=?
          ORDER BY product_resource_link_id DESC LIMIT 1
        `).bind(
          row.is_label_ingredient,row.ingredient_name_en,row.ingredient_name_fr,row.inci_name,
          row.label_sort_order,Number(adminUser.user_id || 0) || null,
          productId,row.resource_kind,row.source_key
        ));
      }
    }

    try { await db.batch(statements); }
    catch (error) {
      const wrapped = new Error('Product resource links were not saved; the atomic D1 batch failed safely.');
      wrapped.cause = error;
      throw wrapped;
    }

    const persistedLinks = await loadProductLinks(db, productId);
    return json({ ok: true, saved_links: links.length, links: persistedLinks });
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Failed to save product links.' }, 500);
  }
}

export { normalizeSubmittedLinks };
