// File: /functions/api/admin/_productResourcePersistence.js
// Build 440: one shared Product -> Tool/Supply persistence authority for desktop and mobile capture.
// Product resource replacement is one atomic D1 batch. Submitted identities are normalized and
// deduplicated case-insensitively; missing/non-positive use-per-batch and lot-size values default to 1.

import { normalizeText } from '../_lib/adminAudit.js';
import { normalizeConsumptionMode } from './_productResourcesData.js';

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function positive(value, fallback = 1) {
  const parsed = number(value, fallback);
  return parsed > 0 ? parsed : fallback;
}

export function parseProductResourceLinksJson(rawValue) {
  if (Array.isArray(rawValue)) return rawValue;
  try {
    const parsed = JSON.parse(String(rawValue || '[]'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function normalizeSubmittedLinks(input = []) {
  const out = [];
  const seen = new Set();

  for (let i = 0; i < input.length; i += 1) {
    const row = input[i] || {};
    const resourceKind = normalizeText(row.resource_kind).toLowerCase();
    const sourceKey = normalizeText(row.source_key);
    if (!['tool', 'supply'].includes(resourceKind) || !sourceKey) continue;

    const identity = `${resourceKind}\u0000${sourceKey.toLowerCase()}`;
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

export async function persistProductResourceLinks({ db, productId, links = [], adminUserId = null }) {
  const normalizedProductId = Number(productId || 0);
  if (!db || !normalizedProductId) {
    throw new Error('A database binding and product id are required to save Product resource links.');
  }

  const normalizedLinks = normalizeSubmittedLinks(Array.isArray(links) ? links : []);
  const statements = [
    db.prepare('DELETE FROM product_resource_links WHERE product_id = ?').bind(normalizedProductId)
  ];

  for (const row of normalizedLinks) {
    statements.push(db.prepare(`
      INSERT INTO product_resource_links (
        product_id, resource_kind, source_key, quantity_used,
        consumption_mode, lot_size_units, usage_notes, sort_order,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      normalizedProductId,
      row.resource_kind,
      row.source_key,
      row.quantity_used,
      row.consumption_mode,
      row.lot_size_units,
      row.usage_notes,
      row.sort_order
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
        row.is_label_ingredient,
        row.ingredient_name_en,
        row.ingredient_name_fr,
        row.inci_name,
        row.label_sort_order,
        Number(adminUserId || 0) || null,
        normalizedProductId,
        row.resource_kind,
        row.source_key
      ));
    }
  }

  try {
    await db.batch(statements);
  } catch (error) {
    const wrapped = new Error('Product resource links were not saved; the atomic D1 batch failed safely.');
    wrapped.cause = error;
    throw wrapped;
  }

  return normalizedLinks;
}
