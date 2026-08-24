// Devil n Dove Build 311 — Inventory-owned read-only cost contract.
// Current cost authority is site_item_inventory.unit_cost_cents. Cost-history data is optional
// evidence only and this route never creates schema or mutates Inventory.

import {
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText,
} from '../../_lib/adminAudit.js';

export const BUILD = 311;
export const CONTRACT_ID = 'inventory-cost';
export const OWNER = 'inventory';

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function boundedInt(value, fallback = 250, min = 1, max = 1000) {
  const parsed = Number(value);
  const n = Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
  return Math.max(min, Math.min(max, n));
}

function positiveId(value) {
  const n = Number(value || 0);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

function enabled(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

async function tableExists(db, tableName) {
  try {
    const row = await db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`
    ).bind(tableName).first();
    return Boolean(row?.name);
  } catch {
    return false;
  }
}

function shapeCost(row = {}) {
  const unitCostCents = Math.max(0, Math.round(Number(row.unit_cost_cents || 0)));
  const perStock = Math.max(0.001, Number(row.usage_units_per_stock_unit || 1) || 1);
  const onHand = Math.max(0, Number(row.on_hand_quantity || 0));
  return Object.freeze({
    site_item_inventory_id: Number(row.site_item_inventory_id || 0),
    source_type: normalizeText(row.source_type),
    external_key: normalizeText(row.external_key),
    item_name: normalizeText(row.item_name),
    category: normalizeText(row.category),
    unit_cost_cents: unitCostCents,
    currency: 'CAD',
    stock_unit_label: normalizeText(row.stock_unit_label) || 'unit',
    usage_unit_label: normalizeText(row.usage_unit_label) || 'unit',
    usage_units_per_stock_unit: perStock,
    cost_per_usage_unit_cents: unitCostCents / perStock,
    on_hand_quantity: onHand,
    inventory_value_cents: Math.max(0, Math.round(unitCostCents * onHand)),
    supplier_name: normalizeText(row.supplier_name),
    supplier_sku: normalizeText(row.supplier_sku),
    updated_at: row.updated_at || null,
  });
}

function shapeHistory(row = {}) {
  return Object.freeze({
    site_item_inventory_cost_history_id: Number(row.site_item_inventory_cost_history_id || 0),
    site_item_inventory_id: Number(row.site_item_inventory_id || 0) || null,
    previous_unit_cost_cents: Math.max(0, Math.round(Number(row.previous_unit_cost_cents || 0))),
    new_unit_cost_cents: Math.max(0, Math.round(Number(row.new_unit_cost_cents || 0))),
    currency: normalizeText(row.currency || 'CAD').toUpperCase() || 'CAD',
    source_kind: normalizeText(row.source_kind),
    source_id: normalizeText(row.source_id) || null,
    source_reference: normalizeText(row.source_reference) || null,
    reason_note: normalizeText(row.reason_note) || null,
    created_at: row.created_at || null,
  });
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);

  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  const url = new URL(context.request.url);
  const inventoryId = positiveId(url.searchParams.get('inventory_id'));
  const q = normalizeText(url.searchParams.get('q')).toLowerCase();
  const limit = boundedInt(url.searchParams.get('limit'));
  const includeHistory = enabled(url.searchParams.get('include_history'));
  const like = `%${q}%`;

  try {
    const inventoryReady = await tableExists(db, 'site_item_inventory');
    if (!inventoryReady) {
      return json({
        ok: false,
        build: BUILD,
        contract: CONTRACT_ID,
        owner: OWNER,
        schema_ready: false,
        missing_tables: ['site_item_inventory'],
        error: 'Inventory cost authority table is unavailable.',
        error_code: 'inventory_cost_schema_missing',
      }, 503);
    }

    const historyAvailable = await tableExists(db, 'site_item_inventory_cost_history');

    const result = await db.prepare(`
      SELECT site_item_inventory_id,source_type,external_key,item_name,category,
             unit_cost_cents,stock_unit_label,usage_unit_label,usage_units_per_stock_unit,
             on_hand_quantity,supplier_name,supplier_sku,updated_at
      FROM site_item_inventory
      WHERE COALESCE(is_active,1)=1
        AND (?=0 OR site_item_inventory_id=?)
        AND (?='' OR LOWER(COALESCE(item_name,'')) LIKE ?
                   OR LOWER(COALESCE(category,'')) LIKE ?
                   OR LOWER(COALESCE(supplier_name,'')) LIKE ?
                   OR LOWER(COALESCE(external_key,'')) LIKE ?)
      ORDER BY LOWER(COALESCE(item_name,'')),site_item_inventory_id
      LIMIT ?
    `).bind(
      inventoryId, inventoryId,
      q, like, like, like, like,
      limit,
    ).all();

    const items = rows(result).map(shapeCost);
    let history = [];

    if (includeHistory && historyAvailable) {
      const historyLimit = Math.min(250, Math.max(25, limit));
      const historyResult = await db.prepare(`
        SELECT site_item_inventory_cost_history_id,site_item_inventory_id,
               previous_unit_cost_cents,new_unit_cost_cents,currency,source_kind,
               source_id,source_reference,reason_note,created_at
        FROM site_item_inventory_cost_history
        WHERE (?=0 OR site_item_inventory_id=?)
          AND (
            ?='' OR site_item_inventory_id IN (
              SELECT site_item_inventory_id FROM site_item_inventory
              WHERE LOWER(COALESCE(item_name,'')) LIKE ?
                 OR LOWER(COALESCE(category,'')) LIKE ?
                 OR LOWER(COALESCE(supplier_name,'')) LIKE ?
                 OR LOWER(COALESCE(external_key,'')) LIKE ?
            )
          )
        ORDER BY created_at DESC,site_item_inventory_cost_history_id DESC
        LIMIT ?
      `).bind(
        inventoryId, inventoryId,
        q, like, like, like, like,
        historyLimit,
      ).all();
      history = rows(historyResult).map(shapeHistory);
    }

    return json({
      ok: true,
      build: BUILD,
      contract: CONTRACT_ID,
      owner: OWNER,
      mode: 'read-only-current-cost',
      authority_field: 'site_item_inventory.unit_cost_cents',
      schema_ready: true,
      missing_tables: [],
      history_available: historyAvailable,
      requested_by: adminUser,
      items,
      count: items.length,
      history,
      history_count: history.length,
    });
  } catch (error) {
    return json({
      ok: false,
      build: BUILD,
      contract: CONTRACT_ID,
      owner: OWNER,
      error: 'Inventory cost contract failed.',
      error_code: 'inventory_cost_read_failed',
      detail: String(error?.message || error),
    }, 500);
  }
}
