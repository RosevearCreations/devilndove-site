// Release 461: canonical usable/base-unit inventory balance authority.
// Purchase-package fields remain on site_item_inventory for receiving/costing compatibility.
// This module never creates or repairs schema at runtime; migration ownership is mandatory.

import { normalizeText } from '../_lib/adminAudit.js';

function numeric(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nonNegative(value, fallback = 0) {
  return Math.max(0, numeric(value, fallback));
}

function positive(value, fallback = 1) {
  const parsed = numeric(value, fallback);
  return parsed > 0 ? parsed : fallback;
}

function unit(value, fallback = 'unit') {
  return normalizeText(value).toLowerCase() || fallback;
}

export async function assertInventoryBaseAuthorityReady(db) {
  try {
    await db.prepare('SELECT site_item_inventory_id FROM site_inventory_base_balances LIMIT 1').first();
    return true;
  } catch (error) {
    const wrapped = new Error('Inventory base-unit authority requires the current Release 461 Development migration.');
    wrapped.code = 'inventory_base_authority_migration_required';
    wrapped.cause = error;
    throw wrapped;
  }
}

export function baseBalanceFromInventory(row = {}) {
  const perPurchase = positive(row.usage_units_per_stock_unit, 1);
  return {
    site_item_inventory_id: Number(row.site_item_inventory_id || 0),
    purchase_unit_label: unit(row.stock_unit_label, 'unit'),
    base_unit_label: unit(row.usage_unit_label, 'unit'),
    base_units_per_purchase_unit: perPurchase,
    purchase_unit_cost_cents: Math.max(0, Math.round(numeric(row.unit_cost_cents, 0))),
    base_on_hand_quantity: nonNegative(row.on_hand_quantity) * perPurchase,
    base_reserved_quantity: nonNegative(row.reserved_quantity) * perPurchase,
    base_incoming_quantity: nonNegative(row.incoming_quantity) * perPurchase,
    base_reorder_level: nonNegative(row.reorder_level) * perPurchase,
    base_preferred_reorder_quantity: nonNegative(row.preferred_reorder_quantity) * perPurchase
  };
}

export async function syncInventoryBaseBalance(db, siteItemInventoryId, userId = null) {
  const id = Number(siteItemInventoryId || 0);
  if (!id) return null;
  const row = await db.prepare(`
    SELECT site_item_inventory_id, stock_unit_label, usage_unit_label, usage_units_per_stock_unit,
           unit_cost_cents, on_hand_quantity, reserved_quantity, incoming_quantity,
           reorder_level, preferred_reorder_quantity
    FROM site_item_inventory
    WHERE site_item_inventory_id = ?
    LIMIT 1
  `).bind(id).first();
  if (!row) return null;
  const balance = baseBalanceFromInventory(row);
  await db.prepare(`
    INSERT INTO site_inventory_base_balances (
      site_item_inventory_id, purchase_unit_label, base_unit_label, base_units_per_purchase_unit,
      purchase_unit_cost_cents, base_on_hand_quantity, base_reserved_quantity, base_incoming_quantity,
      base_reorder_level, base_preferred_reorder_quantity, updated_by_user_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(site_item_inventory_id) DO UPDATE SET
      purchase_unit_label = excluded.purchase_unit_label,
      base_unit_label = excluded.base_unit_label,
      base_units_per_purchase_unit = excluded.base_units_per_purchase_unit,
      purchase_unit_cost_cents = excluded.purchase_unit_cost_cents,
      base_on_hand_quantity = excluded.base_on_hand_quantity,
      base_reserved_quantity = excluded.base_reserved_quantity,
      base_incoming_quantity = excluded.base_incoming_quantity,
      base_reorder_level = excluded.base_reorder_level,
      base_preferred_reorder_quantity = excluded.base_preferred_reorder_quantity,
      updated_by_user_id = excluded.updated_by_user_id,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    balance.site_item_inventory_id,
    balance.purchase_unit_label,
    balance.base_unit_label,
    balance.base_units_per_purchase_unit,
    balance.purchase_unit_cost_cents,
    balance.base_on_hand_quantity,
    balance.base_reserved_quantity,
    balance.base_incoming_quantity,
    balance.base_reorder_level,
    balance.base_preferred_reorder_quantity,
    Number(userId || 0) || null
  ).run();
  return balance;
}

export async function syncInventoryBaseBalances(db, ids = [], userId = null) {
  const unique = [...new Set((Array.isArray(ids) ? ids : []).map(Number).filter((id) => id > 0))].slice(0, 500);
  const saved = [];
  for (const id of unique) {
    const row = await syncInventoryBaseBalance(db, id, userId);
    if (row) saved.push(row);
  }
  return saved;
}

export async function syncInventoryBaseBalancesBySource(db, sourceTypes = [], userId = null) {
  const types = [...new Set((Array.isArray(sourceTypes) ? sourceTypes : [])
    .map((value) => unit(value, ''))
    .filter((value) => ['tool', 'supply'].includes(value)))];
  const wanted = types.length ? types : ['tool', 'supply'];
  const placeholders = wanted.map(() => '?').join(', ');
  const result = await db.prepare(`
    SELECT site_item_inventory_id
    FROM site_item_inventory
    WHERE COALESCE(is_active, 1) = 1
      AND LOWER(TRIM(COALESCE(source_type, ''))) IN (${placeholders})
    ORDER BY site_item_inventory_id ASC
    LIMIT 2000
  `).bind(...wanted).all();
  const ids = Array.isArray(result?.results) ? result.results.map((row) => Number(row.site_item_inventory_id || 0)) : [];
  return syncInventoryBaseBalances(db, ids, userId);
}

export async function loadInventoryBaseBalances(db, ids = []) {
  const unique = [...new Set((Array.isArray(ids) ? ids : []).map(Number).filter((id) => id > 0))].slice(0, 1000);
  if (!unique.length) return new Map();
  const placeholders = unique.map(() => '?').join(', ');
  const result = await db.prepare(`
    SELECT site_item_inventory_id, purchase_unit_label, base_unit_label, base_units_per_purchase_unit,
           purchase_unit_cost_cents, base_on_hand_quantity, base_reserved_quantity, base_incoming_quantity,
           base_reorder_level, base_preferred_reorder_quantity, updated_at
    FROM site_inventory_base_balances
    WHERE site_item_inventory_id IN (${placeholders})
  `).bind(...unique).all();
  return new Map((Array.isArray(result?.results) ? result.results : []).map((row) => [Number(row.site_item_inventory_id || 0), row]));
}

export async function loadInventoryBaseBalanceByIdentity(db, sourceType, externalKey) {
  const kind = unit(sourceType, '');
  const key = normalizeText(externalKey);
  if (!kind || !key) return null;
  return db.prepare(`
    SELECT sibb.*, sii.site_item_inventory_id
    FROM site_item_inventory sii
    JOIN site_inventory_base_balances sibb ON sibb.site_item_inventory_id = sii.site_item_inventory_id
    WHERE LOWER(TRIM(COALESCE(sii.source_type, ''))) = ?
      AND LOWER(TRIM(COALESCE(sii.external_key, ''))) = LOWER(TRIM(?))
      AND COALESCE(sii.is_active, 1) = 1
    ORDER BY sii.site_item_inventory_id DESC
    LIMIT 1
  `).bind(kind, key).first();
}

export function mergeInventoryBaseAuthority(item = {}, balance = null) {
  if (!balance) return { ...item, quantity_authority: item?.site_item_inventory_id ? 'base_migration_required' : 'catalog_only' };
  const baseOnHand = nonNegative(balance.base_on_hand_quantity);
  const baseReserved = nonNegative(balance.base_reserved_quantity);
  const baseIncoming = nonNegative(balance.base_incoming_quantity);
  const perPurchase = positive(balance.base_units_per_purchase_unit, 1);
  return {
    ...item,
    quantity_authority: 'base',
    purchase_on_hand_quantity: nonNegative(item.on_hand_quantity),
    purchase_reserved_quantity: nonNegative(item.reserved_quantity),
    purchase_incoming_quantity: nonNegative(item.incoming_quantity),
    purchase_reorder_level: nonNegative(item.reorder_level),
    purchase_preferred_reorder_quantity: nonNegative(item.preferred_reorder_quantity),
    purchase_unit_label: unit(balance.purchase_unit_label || item.stock_unit_label, 'unit'),
    purchase_unit_cost_cents: Math.max(0, Math.round(numeric(balance.purchase_unit_cost_cents ?? item.unit_cost_cents, 0))),
    base_unit_label: unit(balance.base_unit_label || item.usage_unit_label, 'unit'),
    base_units_per_purchase_unit: perPurchase,
    base_on_hand_quantity: baseOnHand,
    base_reserved_quantity: baseReserved,
    base_incoming_quantity: baseIncoming,
    base_available_quantity: Math.max(0, baseOnHand - baseReserved),
    base_reorder_level: nonNegative(balance.base_reorder_level),
    base_preferred_reorder_quantity: nonNegative(balance.base_preferred_reorder_quantity),
    base_unit_cost_cents: Math.max(0, numeric(balance.purchase_unit_cost_cents ?? item.unit_cost_cents, 0) / perPurchase),
    base_balance_updated_at: balance.updated_at || null
  };
}
