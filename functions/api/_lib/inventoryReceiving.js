// Devil n Dove Build 440 — shared Tool/Supply receiving service.
// Stock authority: site_item_inventory + site_inventory_movements.
// Purchase-lot authority: inventory_purchase_lots.
// inventory_receiving_claims provides idempotency/audit only; it is not a second stock ledger.
// Schema is migration-owned. This module never CREATEs or ALTERs tables at request time.

import { normalizeText } from './adminAudit.js';

const EPSILON = 0.000001;
const REQUIRED_TABLES = [
  'site_item_inventory',
  'site_inventory_movements',
  'inventory_purchase_lots',
  'inventory_lot_policies',
  'inventory_item_identifiers',
  'inventory_item_sources',
  'inventory_receiving_claims',
];
const BARCODE_TYPES = new Set(['barcode', 'upc', 'ean', 'gtin']);
const IDENTIFIER_TYPES = new Set([
  'barcode','upc','ean','gtin','supplier_sku','manufacturer_sku','asin','external_key','internal_sku',
]);
const SOURCE_KINDS = new Set(['supplier','manufacturer','retailer','amazon','marketplace','import','manual']);

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function id(value) { const n = Number(value || 0); return Number.isInteger(n) && n > 0 ? n : 0; }
function number(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function money(value) { return Math.max(0, Math.round(number(value, 0))); }
function text(value, max = 1000) { return normalizeText(value).slice(0, max); }
function lower(value) { return text(value).toLowerCase(); }
function rounded(value) { return Number(number(value, 0).toFixed(6)); }
function sameNumber(a, b) { return Math.abs(number(a, 0) - number(b, 0)) < EPSILON; }
function fail(message, status = 400, code = 'inventory_receiving_invalid', details = null) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
}

export function inferIdentifierType(value, hint = '') {
  const requested = lower(hint);
  if (IDENTIFIER_TYPES.has(requested)) return requested;
  const raw = text(value, 180);
  const digits = raw.replace(/\D/g, '');
  if (digits && digits.length === raw.replace(/\s/g, '').length) {
    if (digits.length === 12) return 'upc';
    if (digits.length === 8 || digits.length === 13) return 'ean';
    if (digits.length === 14) return 'gtin';
  }
  return 'barcode';
}

export function normalizeIdentifierValue(value, type = '') {
  const raw = text(value, 180);
  const kind = lower(type);
  if (BARCODE_TYPES.has(kind)) {
    const digits = raw.replace(/\D/g, '');
    return digits || raw.toUpperCase().replace(/\s+/g, '');
  }
  if (kind === 'supplier_sku' || kind === 'manufacturer_sku') {
    return raw.toUpperCase().replace(/\s+/g, '');
  }
  return raw.toUpperCase().trim();
}

function normalizeSourceName(value) { return lower(value); }
function normalizeSourceSku(value) { return text(value, 180).toUpperCase().replace(/\s+/g, ''); }
function normalizeSourceUrl(value) { return lower(value).replace(/\/$/, ''); }
function receiveLotCode(value, receiveKey) {
  const explicit = text(value, 120);
  if (explicit) return explicit;
  const token = text(receiveKey, 120).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 72) || String(Date.now());
  return `RCV-${token}`.slice(0, 120);
}

export async function inventoryReceivingSchemaReadiness(db) {
  if (!db) return { ok: false, missing_tables: [...REQUIRED_TABLES] };
  const placeholders = REQUIRED_TABLES.map(() => '?').join(',');
  const result = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN (${placeholders})`).bind(...REQUIRED_TABLES).all().catch(() => ({ results: [] }));
  const present = new Set(rows(result).map((row) => String(row.name || '')));
  const missing = REQUIRED_TABLES.filter((name) => !present.has(name));
  return { ok: missing.length === 0, missing_tables: missing };
}

export async function loadReceivingInventoryItem(db, inventoryId) {
  const itemId = id(inventoryId);
  if (!itemId) return null;
  return db.prepare(`
    SELECT site_item_inventory_id,source_type,external_key,item_name,category,
           COALESCE(on_hand_quantity,0) on_hand_quantity,
           COALESCE(reserved_quantity,0) reserved_quantity,
           COALESCE(incoming_quantity,0) incoming_quantity,
           COALESCE(reorder_level,0) reorder_level,
           COALESCE(unit_cost_cents,0) unit_cost_cents,
           COALESCE(stock_unit_label,'unit') stock_unit_label,
           COALESCE(usage_unit_label,'unit') usage_unit_label,
           supplier_name,supplier_sku,supplier_contact,source_url,amazon_url,
           COALESCE(is_active,1) is_active,COALESCE(do_not_reorder,0) do_not_reorder,
           updated_at
    FROM site_item_inventory
    WHERE site_item_inventory_id=?
    LIMIT 1
  `).bind(itemId).first().catch(() => null);
}

function itemShape(row) {
  if (!row) return null;
  const onHand = Math.max(0, number(row.on_hand_quantity, 0));
  const reserved = Math.max(0, number(row.reserved_quantity, 0));
  const incoming = Math.max(0, number(row.incoming_quantity, 0));
  return {
    ...row,
    site_item_inventory_id: id(row.site_item_inventory_id),
    on_hand_quantity: onHand,
    reserved_quantity: reserved,
    incoming_quantity: incoming,
    available_quantity: Math.max(0, onHand - reserved),
    reorder_level: Math.max(0, number(row.reorder_level, 0)),
    unit_cost_cents: money(row.unit_cost_cents),
    is_active: Number(row.is_active || 0) === 1 ? 1 : 0,
  };
}

export async function resolveInventoryByIdentifier(db, value, typeHint = '') {
  const raw = text(value, 180);
  if (!raw) return { resolved: null, ambiguous: false, candidates: [], identifier_type: '', normalized_value: '' };
  const inferredType = inferIdentifierType(raw, typeHint);
  const normalized = normalizeIdentifierValue(raw, inferredType);
  const result = await db.prepare(`
    SELECT ii.inventory_item_identifier_id,ii.site_item_inventory_id,ii.identifier_type,ii.identifier_value,
           ii.normalized_value,ii.source_name,ii.verification_status,
           sii.source_type,sii.external_key,sii.item_name,sii.category,
           COALESCE(sii.on_hand_quantity,0) on_hand_quantity,COALESCE(sii.reserved_quantity,0) reserved_quantity,
           COALESCE(sii.incoming_quantity,0) incoming_quantity,COALESCE(sii.reorder_level,0) reorder_level,
           COALESCE(sii.unit_cost_cents,0) unit_cost_cents,COALESCE(sii.stock_unit_label,'unit') stock_unit_label,
           COALESCE(sii.usage_unit_label,'unit') usage_unit_label,sii.supplier_name,sii.supplier_sku,sii.supplier_contact,
           sii.source_url,sii.amazon_url,COALESCE(sii.is_active,1) is_active,sii.updated_at
    FROM inventory_item_identifiers ii
    INNER JOIN site_item_inventory sii ON sii.site_item_inventory_id=ii.site_item_inventory_id
    WHERE ii.normalized_value=?
      AND ii.verification_status<>'rejected'
      AND COALESCE(sii.is_active,1)=1
    ORDER BY CASE WHEN ii.identifier_type=? THEN 0 ELSE 1 END,
             CASE WHEN ii.verification_status='verified' THEN 0 ELSE 1 END,
             ii.is_primary DESC,ii.inventory_item_identifier_id
    LIMIT 20
  `).bind(normalized, inferredType).all().catch(() => ({ results: [] }));
  let matches = rows(result);

  // Legacy-safe fallback while the migration/backfill is being adopted. This is read-only;
  // new durable identity should be written into inventory_item_identifiers through receiving.
  if (!matches.length) {
    const fallback = await db.prepare(`
      SELECT NULL inventory_item_identifier_id,site_item_inventory_id,
             CASE WHEN UPPER(REPLACE(TRIM(COALESCE(supplier_sku,'')),' ',''))=? THEN 'supplier_sku' ELSE 'external_key' END identifier_type,
             CASE WHEN UPPER(REPLACE(TRIM(COALESCE(supplier_sku,'')),' ',''))=? THEN supplier_sku ELSE external_key END identifier_value,
             ? normalized_value,LOWER(TRIM(COALESCE(supplier_name,''))) source_name,'needs_review' verification_status,
             source_type,external_key,item_name,category,
             COALESCE(on_hand_quantity,0) on_hand_quantity,COALESCE(reserved_quantity,0) reserved_quantity,
             COALESCE(incoming_quantity,0) incoming_quantity,COALESCE(reorder_level,0) reorder_level,
             COALESCE(unit_cost_cents,0) unit_cost_cents,COALESCE(stock_unit_label,'unit') stock_unit_label,
             COALESCE(usage_unit_label,'unit') usage_unit_label,supplier_name,supplier_sku,supplier_contact,
             source_url,amazon_url,COALESCE(is_active,1) is_active,updated_at
      FROM site_item_inventory
      WHERE COALESCE(is_active,1)=1
        AND (UPPER(REPLACE(TRIM(COALESCE(supplier_sku,'')),' ',''))=? OR UPPER(TRIM(COALESCE(external_key,'')))=?)
      ORDER BY site_item_inventory_id
      LIMIT 20
    `).bind(normalized, normalized, normalized, normalized, normalized).all().catch(() => ({ results: [] }));
    matches = rows(fallback);
  }

  const byItem = new Map();
  for (const match of matches) {
    const itemId = id(match.site_item_inventory_id);
    if (!itemId || byItem.has(itemId)) continue;
    byItem.set(itemId, itemShape(match));
  }
  const candidates = [...byItem.values()];
  return {
    resolved: candidates.length === 1 ? candidates[0] : null,
    ambiguous: candidates.length > 1,
    candidates,
    identifier_type: inferredType,
    normalized_value: normalized,
  };
}

export async function searchReceivingInventory(db, query, limit = 30) {
  const q = text(query, 180).toLowerCase();
  if (!q) return [];
  const bounded = Math.max(1, Math.min(50, Math.floor(number(limit, 30))));
  const like = `%${q}%`;
  const result = await db.prepare(`
    SELECT site_item_inventory_id,source_type,external_key,item_name,category,
           COALESCE(on_hand_quantity,0) on_hand_quantity,COALESCE(reserved_quantity,0) reserved_quantity,
           COALESCE(incoming_quantity,0) incoming_quantity,COALESCE(reorder_level,0) reorder_level,
           COALESCE(unit_cost_cents,0) unit_cost_cents,COALESCE(stock_unit_label,'unit') stock_unit_label,
           COALESCE(usage_unit_label,'unit') usage_unit_label,supplier_name,supplier_sku,supplier_contact,
           source_url,amazon_url,COALESCE(is_active,1) is_active,updated_at
    FROM site_item_inventory
    WHERE COALESCE(is_active,1)=1
      AND LOWER(TRIM(COALESCE(source_type,''))) IN ('tool','supply')
      AND (
        LOWER(COALESCE(item_name,'')) LIKE ? OR LOWER(COALESCE(external_key,'')) LIKE ? OR
        LOWER(COALESCE(supplier_sku,'')) LIKE ? OR LOWER(COALESCE(supplier_name,'')) LIKE ? OR
        CAST(site_item_inventory_id AS TEXT)=?
      )
    ORDER BY CASE WHEN LOWER(COALESCE(item_name,''))=? THEN 0 ELSE 1 END,
             LOWER(COALESCE(item_name,'')),site_item_inventory_id
    LIMIT ?
  `).bind(like, like, like, like, q, q, bounded).all().catch(() => ({ results: [] }));
  return rows(result).map(itemShape);
}

export async function loadReceivingItemContext(db, inventoryId) {
  const item = itemShape(await loadReceivingInventoryItem(db, inventoryId));
  if (!item) return null;
  const [identifierResult, sourceResult, lotResult] = await Promise.all([
    db.prepare(`SELECT inventory_item_identifier_id,identifier_type,identifier_value,normalized_value,source_name,is_primary,verification_status,verified_at,created_at FROM inventory_item_identifiers WHERE site_item_inventory_id=? AND verification_status<>'rejected' ORDER BY is_primary DESC,identifier_type,inventory_item_identifier_id LIMIT 40`).bind(item.site_item_inventory_id).all().catch(() => ({ results: [] })),
    db.prepare(`SELECT inventory_item_source_id,source_kind,source_name,supplier_sku,source_url,source_reference,is_preferred,verification_status,receipt_count,last_received_at,last_verified_at,updated_at FROM inventory_item_sources WHERE site_item_inventory_id=? AND verification_status<>'rejected' ORDER BY is_preferred DESC,last_received_at DESC,inventory_item_source_id DESC LIMIT 30`).bind(item.site_item_inventory_id).all().catch(() => ({ results: [] })),
    db.prepare(`SELECT inventory_purchase_lot_id,lot_code,purchase_date,received_date,supplier_name,supplier_order_number,supplier_sku,source_url,quantity_received,quantity_remaining,unit_cost_cents,shipping_cost_cents,tax_cost_cents,expiry_date,storage_location,lot_status,notes,created_at,updated_at FROM inventory_purchase_lots WHERE site_item_inventory_id=? ORDER BY COALESCE(received_date,purchase_date,created_at) DESC,inventory_purchase_lot_id DESC LIMIT 20`).bind(item.site_item_inventory_id).all().catch(() => ({ results: [] })),
  ]);
  return { item, identifiers: rows(identifierResult), sources: rows(sourceResult), lots: rows(lotResult) };
}

export async function loadRecentReceivingClaims(db, limit = 25) {
  const bounded = Math.max(1, Math.min(100, Math.floor(number(limit, 25))));
  const result = await db.prepare(`
    SELECT rc.inventory_receiving_claim_id,rc.receive_key,rc.site_item_inventory_id,rc.supplier_purchase_order_item_id,
           rc.inventory_purchase_lot_id,rc.lot_code,rc.quantity_received,rc.quantity_incoming_cleared,
           rc.unit_cost_cents,rc.shipping_cost_cents,rc.tax_cost_cents,rc.source_kind,rc.source_name,rc.supplier_sku,
           rc.source_url,rc.scanned_identifier,rc.previous_on_hand_quantity,rc.new_on_hand_quantity,
           rc.previous_incoming_quantity,rc.new_incoming_quantity,rc.claim_status,rc.error_note,
           rc.received_by_user_id,rc.received_at,rc.completed_at,
           sii.item_name,sii.source_type,sii.external_key,sii.stock_unit_label
    FROM inventory_receiving_claims rc
    INNER JOIN site_item_inventory sii ON sii.site_item_inventory_id=rc.site_item_inventory_id
    ORDER BY rc.inventory_receiving_claim_id DESC
    LIMIT ?
  `).bind(bounded).all().catch(() => ({ results: [] }));
  return rows(result);
}

async function loadPurchaseOrderItem(db, poItemId) {
  const lineId = id(poItemId);
  if (!lineId) return null;
  return db.prepare(`
    SELECT spoi.supplier_purchase_order_item_id,spoi.supplier_purchase_order_id,spoi.site_item_inventory_id,
           spoi.item_name,spoi.source_type,spoi.external_key,spoi.quantity_ordered,COALESCE(spoi.quantity_received,0) quantity_received,
           COALESCE(spoi.unit_cost_cents,0) unit_cost_cents,spoi.incoming_applied_at,spoi.received_at,
           spo.supplier_name po_supplier_name,spo.supplier_contact po_supplier_contact,spo.status po_status,spo.notes po_notes
    FROM supplier_purchase_order_items spoi
    INNER JOIN supplier_purchase_orders spo ON spo.supplier_purchase_order_id=spoi.supplier_purchase_order_id
    WHERE spoi.supplier_purchase_order_item_id=?
    LIMIT 1
  `).bind(lineId).first().catch(() => null);
}

async function existingClaim(db, receiveKey) {
  return db.prepare(`SELECT * FROM inventory_receiving_claims WHERE receive_key=? LIMIT 1`).bind(receiveKey).first().catch(() => null);
}

async function precheckIdentifierBinding(db, inventoryId, scannedValue, identifierType) {
  const normalized = normalizeIdentifierValue(scannedValue, identifierType);
  if (!normalized) return null;
  const existing = await db.prepare(`
    SELECT inventory_item_identifier_id,site_item_inventory_id,identifier_type,identifier_value,normalized_value,verification_status
    FROM inventory_item_identifiers
    WHERE normalized_value=? AND verification_status<>'rejected'
    ORDER BY inventory_item_identifier_id
    LIMIT 5
  `).bind(normalized).all().catch(() => ({ results: [] }));
  const conflicts = rows(existing).filter((row) => id(row.site_item_inventory_id) !== inventoryId);
  if (BARCODE_TYPES.has(identifierType) && conflicts.length) {
    throw fail('That barcode is already linked to another Inventory item. Receiving stopped before stock changed.', 409, 'inventory_receiving_barcode_conflict', { conflicts });
  }
  return { identifier_type: identifierType, normalized_value: normalized };
}

async function prepareReceipt(db, raw, actorUserId) {
  const receiveKey = text(raw?.receive_key, 120);
  if (receiveKey.length < 8) throw fail('A stable receiving idempotency key is required.', 400, 'inventory_receiving_key_required');
  const quantity = rounded(raw?.quantity_received);
  if (!(quantity > EPSILON)) throw fail('Received quantity must be greater than zero.', 400, 'inventory_receiving_quantity_required');

  let inventoryId = id(raw?.site_item_inventory_id);
  let resolver = null;
  if (!inventoryId && text(raw?.identifier, 180)) {
    resolver = await resolveInventoryByIdentifier(db, raw.identifier, raw.identifier_type);
    if (resolver.ambiguous) throw fail('The scanned identifier matches more than one Inventory item. Select the intended item before receiving.', 409, 'inventory_receiving_identifier_ambiguous', { candidates: resolver.candidates });
    inventoryId = id(resolver.resolved?.site_item_inventory_id);
  }
  if (!inventoryId) throw fail('Choose or resolve an Inventory item before receiving.', 400, 'inventory_receiving_item_required');

  const item = itemShape(await loadReceivingInventoryItem(db, inventoryId));
  if (!item) throw fail('Inventory item was not found.', 404, 'inventory_receiving_item_not_found');
  if (!item.is_active) throw fail('Inactive Inventory items cannot receive stock.', 409, 'inventory_receiving_item_inactive');
  const sourceType = lower(item.source_type);
  if (!['tool', 'supply'].includes(sourceType)) {
    throw fail('Barcode receiving is restricted to Tool and Supply Inventory. Finished Product stock must use its owning production/commerce workflow.', 409, 'inventory_receiving_wrong_owner');
  }

  const priorClaim = await existingClaim(db, receiveKey);
  if (priorClaim) {
    if (String(priorClaim.claim_status || '') === 'completed'
      && id(priorClaim.site_item_inventory_id) === inventoryId
      && sameNumber(priorClaim.quantity_received, quantity)) {
      return { idempotent: true, claim: priorClaim, item };
    }
    throw fail('That receiving key was already used for a different or incomplete receipt. Use a new receive action.', 409, 'inventory_receiving_key_conflict', { claim_status: priorClaim.claim_status || '' });
  }

  let poItem = null;
  const poItemId = id(raw?.supplier_purchase_order_item_id);
  if (poItemId) {
    poItem = await loadPurchaseOrderItem(db, poItemId);
    if (!poItem) throw fail('Purchase-order line was not found.', 404, 'inventory_receiving_po_line_not_found');
    if (id(poItem.site_item_inventory_id) !== inventoryId) throw fail('Purchase-order line belongs to a different Inventory item.', 409, 'inventory_receiving_po_item_mismatch');
    if (lower(poItem.po_status) === 'cancelled') throw fail('Cancelled purchase orders cannot receive stock.', 409, 'inventory_receiving_po_cancelled');
    const remaining = Math.max(0, number(poItem.quantity_ordered, 0) - number(poItem.quantity_received, 0));
    if (quantity > remaining + EPSILON) {
      throw fail(`Only ${remaining} unit(s) remain open on this purchase-order line.`, 409, 'inventory_receiving_po_over_receive');
    }
  }

  const scannedValue = text(raw?.identifier, 180);
  const identifierType = scannedValue ? inferIdentifierType(scannedValue, raw?.identifier_type) : '';
  let identifierBinding = null;
  if (scannedValue && Number(raw?.bind_identifier || 0) === 1) {
    identifierBinding = await precheckIdentifierBinding(db, inventoryId, scannedValue, identifierType);
  }

  const lotCode = receiveLotCode(raw?.lot_code, receiveKey);
  const existingLot = await db.prepare(`SELECT * FROM inventory_purchase_lots WHERE site_item_inventory_id=? AND lot_code=? LIMIT 1`).bind(inventoryId, lotCode).first().catch(() => null);
  if (existingLot && ['expired','quarantined','returned'].includes(lower(existingLot.lot_status))) {
    throw fail(`Lot ${lotCode} is ${existingLot.lot_status}; receive this shipment under a new lot code or review the existing lot first.`, 409, 'inventory_receiving_lot_not_receivable');
  }

  const requestedCost = money(raw?.unit_cost_cents);
  const unitCost = requestedCost || money(poItem?.unit_cost_cents) || money(existingLot?.unit_cost_cents) || money(item.unit_cost_cents);
  if (existingLot && requestedCost > 0 && money(existingLot.unit_cost_cents) > 0 && requestedCost !== money(existingLot.unit_cost_cents)) {
    throw fail(`Lot ${lotCode} already has a different unit cost. Use a new lot code rather than mixing unlike costs.`, 409, 'inventory_receiving_lot_cost_mismatch');
  }
  const shippingCost = money(raw?.shipping_cost_cents);
  const taxCost = money(raw?.tax_cost_cents);
  const previousOnHand = Math.max(0, number(item.on_hand_quantity, 0));
  const previousIncoming = Math.max(0, number(item.incoming_quantity, 0));
  const incomingClearRequested = poItem ? quantity : (Number(raw?.clear_incoming || 0) === 1 ? quantity : Math.max(0, number(raw?.quantity_incoming_cleared, 0)));
  const incomingCleared = Math.min(previousIncoming, incomingClearRequested);
  const nextOnHand = rounded(previousOnHand + quantity);
  const nextIncoming = rounded(previousIncoming - incomingCleared);

  const sourceKindRaw = lower(raw?.source_kind || (text(poItem?.po_supplier_name) ? 'supplier' : (text(item.amazon_url) ? 'amazon' : 'manual')));
  const sourceKind = SOURCE_KINDS.has(sourceKindRaw) ? sourceKindRaw : 'manual';
  const sourceName = text(raw?.source_name || raw?.supplier_name || poItem?.po_supplier_name || item.supplier_name, 220);
  const supplierSku = text(raw?.supplier_sku || item.supplier_sku, 180);
  const sourceUrl = text(raw?.source_url || item.source_url || item.amazon_url, 1000);

  return {
    idempotent: false,
    receive_key: receiveKey,
    actor_user_id: id(actorUserId) || null,
    item,
    inventory_id: inventoryId,
    source_type: sourceType,
    quantity,
    previous_on_hand: previousOnHand,
    next_on_hand: nextOnHand,
    previous_incoming: previousIncoming,
    incoming_cleared: incomingCleared,
    next_incoming: nextIncoming,
    po_item: poItem,
    po_item_id: poItemId || null,
    lot_code: lotCode,
    existing_lot: existingLot,
    unit_cost_cents: unitCost,
    shipping_cost_cents: shippingCost,
    tax_cost_cents: taxCost,
    received_date: text(raw?.received_date, 20) || new Date().toISOString().slice(0, 10),
    purchase_date: text(raw?.purchase_date, 20) || null,
    expiry_date: text(raw?.expiry_date, 20) || null,
    storage_location: text(raw?.storage_location, 180) || null,
    notes: text(raw?.notes, 1000) || null,
    source_kind: sourceKind,
    source_name: sourceName,
    supplier_sku: supplierSku,
    source_url: sourceUrl,
    source_reference: text(raw?.source_reference || (poItem ? `Purchase order #${poItem.supplier_purchase_order_id}` : ''), 500) || null,
    scanned_identifier: scannedValue || null,
    identifier_type: identifierType || null,
    identifier_binding: identifierBinding,
    make_preferred_source: Number(raw?.make_preferred_source || 0) === 1,
    verify_source: Number(raw?.verify_source || 0) === 1,
  };
}

async function compensateReceiptPlans(db, plans, batchResult, indicesByKey) {
  const statements = [];
  for (const plan of plans) {
    if (plan.idempotent) continue;
    const idx = indicesByKey.get(plan.receive_key);
    if (!idx) continue;
    const inventoryChanged = Number(batchResult?.[idx.inventory]?.meta?.changes || 0) === 1;
    const lotChanged = Number(batchResult?.[idx.lot]?.meta?.changes || 0) === 1;
    const poChanged = idx.po == null ? false : Number(batchResult?.[idx.po]?.meta?.changes || 0) === 1;

    if (inventoryChanged) {
      statements.push(db.prepare(`UPDATE site_item_inventory SET on_hand_quantity=?,incoming_quantity=?,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=? AND ABS(COALESCE(on_hand_quantity,0)-?)<? AND ABS(COALESCE(incoming_quantity,0)-?)<?`).bind(plan.previous_on_hand, plan.previous_incoming, plan.inventory_id, plan.next_on_hand, EPSILON, plan.next_incoming, EPSILON));
      statements.push(db.prepare(`INSERT INTO site_inventory_movements(site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at) VALUES (?,?,?,?, 'correction',?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(
        plan.inventory_id,plan.item.source_type||null,plan.item.external_key||null,plan.item.item_name||null,-plan.quantity,
        plan.next_on_hand,plan.previous_on_hand,number(plan.item.reserved_quantity,0),number(plan.item.reserved_quantity,0),
        plan.next_incoming,plan.previous_incoming,`Automatic compensation for failed receiving claim ${plan.receive_key}`.slice(0,500),plan.actor_user_id
      ));
    }

    if (lotChanged) {
      if (plan.existing_lot) {
        statements.push(db.prepare(`UPDATE inventory_purchase_lots SET quantity_received=?,quantity_remaining=?,shipping_cost_cents=?,tax_cost_cents=?,lot_status=?,updated_at=CURRENT_TIMESTAMP WHERE inventory_purchase_lot_id=?`).bind(
          number(plan.existing_lot.quantity_received,0),number(plan.existing_lot.quantity_remaining,0),money(plan.existing_lot.shipping_cost_cents),money(plan.existing_lot.tax_cost_cents),plan.existing_lot.lot_status||'available',id(plan.existing_lot.inventory_purchase_lot_id)
        ));
      } else {
        statements.push(db.prepare(`DELETE FROM inventory_purchase_lots WHERE site_item_inventory_id=? AND lot_code=? AND ABS(COALESCE(quantity_received,0)-?)<? AND ABS(COALESCE(quantity_remaining,0)-?)<?`).bind(plan.inventory_id,plan.lot_code,plan.quantity,EPSILON,plan.quantity,EPSILON));
      }
    }

    if (poChanged && plan.po_item) {
      statements.push(db.prepare(`UPDATE supplier_purchase_order_items SET quantity_received=?,received_at=? WHERE supplier_purchase_order_item_id=?`).bind(number(plan.po_item.quantity_received,0),plan.po_item.received_at||null,plan.po_item_id));
    }
    statements.push(db.prepare(`UPDATE inventory_receiving_claims SET claim_status='failed',error_note='Automatic compensation after receiving verification failure.',updated_at=CURRENT_TIMESTAMP WHERE receive_key=?`).bind(plan.receive_key));
  }
  if (statements.length) await db.batch(statements);
}

async function persistReceiptProvenance(db, plan) {
  const warnings = [];
  if (plan.scanned_identifier && plan.identifier_binding) {
    try {
      await db.prepare(`
        INSERT INTO inventory_item_identifiers(
          site_item_inventory_id,identifier_type,identifier_value,normalized_value,source_name,is_primary,
          verification_status,verified_by_user_id,verified_at,created_by_user_id,created_at,updated_at
        ) VALUES (?,?,?,?,?,0,'verified',?,CURRENT_TIMESTAMP,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
        ON CONFLICT(site_item_inventory_id,identifier_type,normalized_value,source_name) DO UPDATE SET
          identifier_value=excluded.identifier_value,verification_status='verified',verified_by_user_id=excluded.verified_by_user_id,
          verified_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
      `).bind(
        plan.inventory_id,plan.identifier_type,plan.scanned_identifier,plan.identifier_binding.normalized_value,
        normalizeSourceName(plan.source_name),plan.actor_user_id,plan.actor_user_id
      ).run();
    } catch (error) {
      warnings.push(`Stock was received, but the scanned identifier could not be bound: ${String(error?.message || error)}`);
    }
  }

  if (plan.source_name || plan.supplier_sku || plan.source_url) {
    const sourceNameNorm = normalizeSourceName(plan.source_name);
    const sourceSkuNorm = normalizeSourceSku(plan.supplier_sku);
    const sourceUrlNorm = normalizeSourceUrl(plan.source_url);
    try {
      if (plan.make_preferred_source) {
        await db.prepare(`UPDATE inventory_item_sources SET is_preferred=0,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=?`).bind(plan.inventory_id).run();
      }
      await db.prepare(`
        INSERT INTO inventory_item_sources(
          site_item_inventory_id,source_kind,source_name,source_name_normalized,supplier_sku,supplier_sku_normalized,
          source_url,source_url_normalized,source_reference,is_preferred,verification_status,receipt_count,
          last_received_at,last_verified_at,created_by_user_id,updated_by_user_id,created_at,updated_at
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,1,CURRENT_TIMESTAMP,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
        ON CONFLICT(site_item_inventory_id,source_kind,source_name_normalized,supplier_sku_normalized,source_url_normalized)
        DO UPDATE SET
          source_name=excluded.source_name,supplier_sku=excluded.supplier_sku,source_url=excluded.source_url,
          source_reference=COALESCE(excluded.source_reference,inventory_item_sources.source_reference),
          is_preferred=CASE WHEN excluded.is_preferred=1 THEN 1 ELSE inventory_item_sources.is_preferred END,
          verification_status=CASE WHEN excluded.verification_status='verified' THEN 'verified' ELSE inventory_item_sources.verification_status END,
          receipt_count=COALESCE(inventory_item_sources.receipt_count,0)+1,last_received_at=CURRENT_TIMESTAMP,
          last_verified_at=CASE WHEN excluded.verification_status='verified' THEN CURRENT_TIMESTAMP ELSE inventory_item_sources.last_verified_at END,
          updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP
      `).bind(
        plan.inventory_id,plan.source_kind,plan.source_name,sourceNameNorm,plan.supplier_sku,sourceSkuNorm,
        plan.source_url,sourceUrlNorm,plan.source_reference,plan.make_preferred_source?1:0,plan.verify_source?'verified':'needs_review',
        plan.verify_source?new Date().toISOString():null,plan.actor_user_id,plan.actor_user_id
      ).run();

      if (plan.make_preferred_source) {
        await db.prepare(`UPDATE site_item_inventory SET supplier_name=?,supplier_sku=?,source_url=?,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=?`).bind(plan.source_name||null,plan.supplier_sku||null,plan.source_url||null,plan.inventory_id).run();
      }
    } catch (error) {
      warnings.push(`Stock was received, but supplier/source provenance could not be refreshed: ${String(error?.message || error)}`);
    }
  }
  return warnings;
}

export async function receiveInventoryBatch(db, rawReceipts, actorUserId) {
  const schema = await inventoryReceivingSchemaReadiness(db);
  if (!schema.ok) throw fail(`Build 440 receiving schema is not ready (${schema.missing_tables.join(', ')}).`, 503, 'inventory_receiving_schema_not_ready', schema);
  const incoming = Array.isArray(rawReceipts) ? rawReceipts : [rawReceipts];
  if (!incoming.length || incoming.length > 50) throw fail('Receive between 1 and 50 Inventory lines at a time.', 400, 'inventory_receiving_batch_size');

  const plans = [];
  const inventorySeen = new Set();
  for (const raw of incoming) {
    const plan = await prepareReceipt(db, raw || {}, actorUserId);
    if (!plan.idempotent) {
      if (inventorySeen.has(plan.inventory_id)) {
        throw fail('A receiving batch cannot contain the same Inventory item twice. Combine the quantity or receive the lines separately.', 409, 'inventory_receiving_duplicate_item_in_batch');
      }
      inventorySeen.add(plan.inventory_id);
    }
    plans.push(plan);
  }

  const active = plans.filter((plan) => !plan.idempotent);
  if (!active.length) {
    return {
      ok: true,
      idempotent_replay: true,
      receipts: plans.map((plan) => ({ receive_key: plan.claim.receive_key, claim: plan.claim, item: plan.item, warnings: [] })),
    };
  }

  const statements = [];
  const indicesByKey = new Map();
  for (const plan of active) {
    const indices = {};
    indices.claim = statements.length;
    statements.push(db.prepare(`
      INSERT INTO inventory_receiving_claims(
        receive_key,site_item_inventory_id,supplier_purchase_order_item_id,lot_code,quantity_received,quantity_incoming_cleared,
        unit_cost_cents,shipping_cost_cents,tax_cost_cents,source_kind,source_name,supplier_sku,source_url,scanned_identifier,
        previous_on_hand_quantity,new_on_hand_quantity,previous_incoming_quantity,new_incoming_quantity,claim_status,received_by_user_id,received_at,created_at,updated_at
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'applying',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    `).bind(
      plan.receive_key,plan.inventory_id,plan.po_item_id,plan.lot_code,plan.quantity,plan.incoming_cleared,
      plan.unit_cost_cents,plan.shipping_cost_cents,plan.tax_cost_cents,plan.source_kind,plan.source_name||null,plan.supplier_sku||null,
      plan.source_url||null,plan.scanned_identifier||null,plan.previous_on_hand,plan.next_on_hand,plan.previous_incoming,plan.next_incoming,plan.actor_user_id
    ));

    indices.inventory = statements.length;
    statements.push(db.prepare(`
      UPDATE site_item_inventory
      SET on_hand_quantity=?,incoming_quantity=?,
          is_on_reorder_list=CASE WHEN (? + ?) > COALESCE(reorder_level,0) THEN 0 ELSE is_on_reorder_list END,
          last_counted_at=CURRENT_TIMESTAMP,last_seen_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
      WHERE site_item_inventory_id=?
        AND ABS(COALESCE(on_hand_quantity,0)-?)<?
        AND ABS(COALESCE(incoming_quantity,0)-?)<?
        AND EXISTS(SELECT 1 FROM inventory_receiving_claims WHERE receive_key=? AND claim_status='applying')
    `).bind(plan.next_on_hand,plan.next_incoming,plan.next_on_hand,plan.next_incoming,plan.inventory_id,plan.previous_on_hand,EPSILON,plan.previous_incoming,EPSILON,plan.receive_key));

    indices.lot = statements.length;
    if (plan.existing_lot) {
      const lotNextReceived = rounded(number(plan.existing_lot.quantity_received,0) + plan.quantity);
      const lotNextRemaining = rounded(number(plan.existing_lot.quantity_remaining,0) + plan.quantity);
      statements.push(db.prepare(`
        UPDATE inventory_purchase_lots
        SET quantity_received=?,quantity_remaining=?,shipping_cost_cents=COALESCE(shipping_cost_cents,0)+?,tax_cost_cents=COALESCE(tax_cost_cents,0)+?,
            received_date=COALESCE(?,received_date),supplier_name=COALESCE(NULLIF(?,''),supplier_name),supplier_sku=COALESCE(NULLIF(?,''),supplier_sku),
            source_url=COALESCE(NULLIF(?,''),source_url),expiry_date=COALESCE(?,expiry_date),storage_location=COALESCE(?,storage_location),
            lot_status='available',notes=COALESCE(?,notes),updated_at=CURRENT_TIMESTAMP
        WHERE inventory_purchase_lot_id=? AND site_item_inventory_id=?
          AND ABS(COALESCE(quantity_received,0)-?)<? AND ABS(COALESCE(quantity_remaining,0)-?)<?
          AND EXISTS(SELECT 1 FROM inventory_receiving_claims WHERE receive_key=? AND claim_status='applying')
      `).bind(
        lotNextReceived,lotNextRemaining,plan.shipping_cost_cents,plan.tax_cost_cents,plan.received_date,plan.source_name,plan.supplier_sku,
        plan.source_url,plan.expiry_date,plan.storage_location,plan.notes,id(plan.existing_lot.inventory_purchase_lot_id),plan.inventory_id,
        number(plan.existing_lot.quantity_received,0),EPSILON,number(plan.existing_lot.quantity_remaining,0),EPSILON,plan.receive_key
      ));
    } else {
      statements.push(db.prepare(`
        INSERT INTO inventory_purchase_lots(
          site_item_inventory_id,lot_code,purchase_date,received_date,supplier_name,supplier_order_number,supplier_sku,asin,source_url,
          quantity_received,quantity_remaining,unit_cost_cents,shipping_cost_cents,tax_cost_cents,expiry_date,storage_location,lot_status,notes,
          created_by_user_id,created_at,updated_at
        )
        SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
        WHERE EXISTS(SELECT 1 FROM inventory_receiving_claims WHERE receive_key=? AND claim_status='applying')
      `).bind(
        plan.inventory_id,plan.lot_code,plan.purchase_date,plan.received_date,plan.source_name||null,
        plan.po_item?.supplier_purchase_order_id?String(plan.po_item.supplier_purchase_order_id):null,plan.supplier_sku||null,null,plan.source_url||null,
        plan.quantity,plan.quantity,plan.unit_cost_cents,plan.shipping_cost_cents,plan.tax_cost_cents,plan.expiry_date,plan.storage_location,
        'available',plan.notes,plan.actor_user_id,plan.receive_key
      ));
    }

    statements.push(db.prepare(`
      INSERT INTO site_inventory_movements(
        site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,
        previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,
        previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at
      )
      SELECT site_item_inventory_id,source_type,external_key,item_name,'incoming',?,?,?,?,
             COALESCE(reserved_quantity,0),COALESCE(reserved_quantity,0),?,?,?, ?,CURRENT_TIMESTAMP
      FROM site_item_inventory
      WHERE site_item_inventory_id=?
        AND ABS(COALESCE(on_hand_quantity,0)-?)<? AND ABS(COALESCE(incoming_quantity,0)-?)<?
        AND EXISTS(SELECT 1 FROM inventory_receiving_claims WHERE receive_key=? AND claim_status='applying')
    `).bind(
      plan.quantity,plan.previous_on_hand,plan.next_on_hand,plan.previous_incoming,plan.next_incoming,
      `Received ${plan.quantity} ${plan.item.stock_unit_label||'unit'} · lot ${plan.lot_code} · claim ${plan.receive_key}${plan.po_item?` · PO #${plan.po_item.supplier_purchase_order_id}`:''}`.slice(0,500),
      plan.actor_user_id,plan.inventory_id,plan.next_on_hand,EPSILON,plan.next_incoming,EPSILON,plan.receive_key
    ));

    indices.po = null;
    if (plan.po_item) {
      indices.po = statements.length;
      const poNextReceived = rounded(number(plan.po_item.quantity_received,0) + plan.quantity);
      statements.push(db.prepare(`
        UPDATE supplier_purchase_order_items
        SET quantity_received=?,received_at=CURRENT_TIMESTAMP
        WHERE supplier_purchase_order_item_id=?
          AND ABS(COALESCE(quantity_received,0)-?)<?
          AND COALESCE(quantity_ordered,0)+?>=?
          AND EXISTS(SELECT 1 FROM inventory_receiving_claims WHERE receive_key=? AND claim_status='applying')
      `).bind(poNextReceived,plan.po_item_id,number(plan.po_item.quantity_received,0),EPSILON,EPSILON,poNextReceived,plan.receive_key));
    }

    if (plan.source_type === 'supply') {
      statements.push(db.prepare(`
        INSERT INTO inventory_lot_policies(site_item_inventory_id,depletion_method,reconcile_status,last_reconciled_quantity,last_reconciled_at,updated_by_user_id,updated_at)
        VALUES (?,'fifo','reconciled',?,CURRENT_TIMESTAMP,?,CURRENT_TIMESTAMP)
        ON CONFLICT(site_item_inventory_id) DO UPDATE SET
          reconcile_status='reconciled',last_reconciled_quantity=excluded.last_reconciled_quantity,last_reconciled_at=CURRENT_TIMESTAMP,
          updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP
      `).bind(plan.inventory_id,plan.next_on_hand,plan.actor_user_id));
    }

    indices.complete = statements.length;
    statements.push(db.prepare(`
      UPDATE inventory_receiving_claims
      SET inventory_purchase_lot_id=(SELECT inventory_purchase_lot_id FROM inventory_purchase_lots WHERE site_item_inventory_id=? AND lot_code=? LIMIT 1),
          claim_status='completed',completed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
      WHERE receive_key=? AND claim_status='applying'
        AND EXISTS(SELECT 1 FROM site_item_inventory WHERE site_item_inventory_id=? AND ABS(COALESCE(on_hand_quantity,0)-?)<? AND ABS(COALESCE(incoming_quantity,0)-?)<?)
        AND EXISTS(SELECT 1 FROM inventory_purchase_lots WHERE site_item_inventory_id=? AND lot_code=?)
        ${plan.po_item ? `AND EXISTS(SELECT 1 FROM supplier_purchase_order_items WHERE supplier_purchase_order_item_id=? AND ABS(COALESCE(quantity_received,0)-?)<?)` : ''}
    `).bind(
      plan.inventory_id,plan.lot_code,plan.receive_key,plan.inventory_id,plan.next_on_hand,EPSILON,plan.next_incoming,EPSILON,
      plan.inventory_id,plan.lot_code,
      ...(plan.po_item ? [plan.po_item_id,rounded(number(plan.po_item.quantity_received,0)+plan.quantity),EPSILON] : [])
    ));
    indicesByKey.set(plan.receive_key, indices);
  }

  let batchResult;
  try {
    batchResult = await db.batch(statements);
  } catch (error) {
    throw fail('The receiving transaction failed before completion. No successful receipt should be assumed.', 409, 'inventory_receiving_transaction_failed', String(error?.message || error));
  }

  const failed = [];
  for (const plan of active) {
    const idx = indicesByKey.get(plan.receive_key);
    const claimChanged = Number(batchResult?.[idx.claim]?.meta?.changes || 0) === 1;
    const inventoryChanged = Number(batchResult?.[idx.inventory]?.meta?.changes || 0) === 1;
    const lotChanged = Number(batchResult?.[idx.lot]?.meta?.changes || 0) === 1;
    const poChanged = idx.po == null || Number(batchResult?.[idx.po]?.meta?.changes || 0) === 1;
    const completed = Number(batchResult?.[idx.complete]?.meta?.changes || 0) === 1;
    if (!claimChanged || !inventoryChanged || !lotChanged || !poChanged || !completed) {
      failed.push({ receive_key: plan.receive_key, claimChanged, inventoryChanged, lotChanged, poChanged, completed });
    }
  }
  if (failed.length) {
    await compensateReceiptPlans(db, active, batchResult, indicesByKey).catch(() => null);
    throw fail('Inventory changed while receiving was being posted. Any verified partial stock changes were compensated; reload and receive again.', 409, 'inventory_receiving_concurrent_change', failed);
  }

  const receipts = [];
  for (const plan of plans) {
    if (plan.idempotent) {
      receipts.push({ receive_key: plan.claim.receive_key, claim: plan.claim, item: plan.item, warnings: [], idempotent_replay: true });
      continue;
    }
    const warnings = await persistReceiptProvenance(db, plan);
    const [claim, context] = await Promise.all([
      existingClaim(db, plan.receive_key),
      loadReceivingItemContext(db, plan.inventory_id),
    ]);
    receipts.push({ receive_key: plan.receive_key, claim, item: context?.item || plan.item, context, warnings, idempotent_replay: false });
  }

  return { ok: true, idempotent_replay: false, receipts };
}

export { EPSILON };
