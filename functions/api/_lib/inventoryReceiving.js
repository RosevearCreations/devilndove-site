// Devil n Dove Build 440 — shared Tool/Supply receiving service.
// Stock authority: site_item_inventory + site_inventory_movements.
// Purchase-lot authority: inventory_purchase_lots.
// inventory_receiving_claims provides idempotency/audit only; it is not a second stock ledger.
// Schema is migration-owned. No request-time CREATE/ALTER/repair.

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
const IDENTIFIER_TYPES = new Set(['barcode','upc','ean','gtin','supplier_sku','manufacturer_sku','asin','external_key','internal_sku']);
const BARCODE_TYPES = new Set(['barcode','upc','ean','gtin']);
const SOURCE_KINDS = new Set(['supplier','manufacturer','retailer','amazon','marketplace','import','manual']);

const resultRows = (result) => Array.isArray(result?.results) ? result.results : [];
const positiveId = (value) => { const n = Number(value || 0); return Number.isInteger(n) && n > 0 ? n : 0; };
const finiteNumber = (value, fallback = 0) => { const n = Number(value); return Number.isFinite(n) ? n : fallback; };
const cents = (value) => Math.max(0, Math.round(finiteNumber(value, 0)));
const cleanText = (value, max = 1000) => normalizeText(value).slice(0, max);
const lowerText = (value) => cleanText(value).toLowerCase();
const qty = (value) => Number(finiteNumber(value, 0).toFixed(6));
const nearlyEqual = (a, b) => Math.abs(finiteNumber(a, 0) - finiteNumber(b, 0)) < EPSILON;

function errorWith(message, status = 400, code = 'inventory_receiving_invalid', details = null) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
}

export function inferIdentifierType(value, hint = '') {
  const requested = lowerText(hint);
  if (IDENTIFIER_TYPES.has(requested)) return requested;
  const raw = cleanText(value, 180);
  const compact = raw.replace(/\s/g, '');
  if (/^\d+$/.test(compact)) {
    if (compact.length === 12) return 'upc';
    if (compact.length === 8 || compact.length === 13) return 'ean';
    if (compact.length === 14) return 'gtin';
  }
  return 'barcode';
}

export function normalizeIdentifierValue(value, type = '') {
  const raw = cleanText(value, 180);
  const kind = lowerText(type);
  if (BARCODE_TYPES.has(kind)) {
    const digits = raw.replace(/\D/g, '');
    return digits || raw.toUpperCase().replace(/\s+/g, '');
  }
  if (kind === 'supplier_sku' || kind === 'manufacturer_sku') return raw.toUpperCase().replace(/\s+/g, '');
  return raw.toUpperCase().trim();
}

const normalizeSourceName = (value) => lowerText(value);
const normalizeSourceSku = (value) => cleanText(value, 180).toUpperCase().replace(/\s+/g, '');
const normalizeSourceUrl = (value) => lowerText(value).replace(/\/$/, '');

function makeLotCode(value, receiveKey) {
  const explicit = cleanText(value, 120);
  if (explicit) return explicit;
  const token = cleanText(receiveKey, 120).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 72) || String(Date.now());
  return `RCV-${token}`.slice(0, 120);
}

function shapeItem(row) {
  if (!row) return null;
  const onHand = Math.max(0, finiteNumber(row.on_hand_quantity, 0));
  const reserved = Math.max(0, finiteNumber(row.reserved_quantity, 0));
  const incoming = Math.max(0, finiteNumber(row.incoming_quantity, 0));
  return {
    ...row,
    site_item_inventory_id: positiveId(row.site_item_inventory_id),
    on_hand_quantity: onHand,
    reserved_quantity: reserved,
    incoming_quantity: incoming,
    available_quantity: Math.max(0, onHand - reserved),
    reorder_level: Math.max(0, finiteNumber(row.reorder_level, 0)),
    unit_cost_cents: cents(row.unit_cost_cents),
    is_active: Number(row.is_active || 0) === 1 ? 1 : 0,
  };
}

export async function inventoryReceivingSchemaReadiness(db) {
  if (!db) return { ok: false, missing_tables: [...REQUIRED_TABLES] };
  const placeholders = REQUIRED_TABLES.map(() => '?').join(',');
  const result = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name IN (${placeholders})`).bind(...REQUIRED_TABLES).all().catch(() => ({ results: [] }));
  const present = new Set(resultRows(result).map((row) => String(row.name || '')));
  const missing = REQUIRED_TABLES.filter((name) => !present.has(name));
  return { ok: missing.length === 0, missing_tables: missing };
}

export async function loadReceivingInventoryItem(db, inventoryId) {
  const id = positiveId(inventoryId);
  if (!id) return null;
  const row = await db.prepare(`
    SELECT site_item_inventory_id,source_type,external_key,item_name,category,
           COALESCE(on_hand_quantity,0) on_hand_quantity,COALESCE(reserved_quantity,0) reserved_quantity,
           COALESCE(incoming_quantity,0) incoming_quantity,COALESCE(reorder_level,0) reorder_level,
           COALESCE(unit_cost_cents,0) unit_cost_cents,COALESCE(stock_unit_label,'unit') stock_unit_label,
           COALESCE(usage_unit_label,'unit') usage_unit_label,supplier_name,supplier_sku,supplier_contact,
           source_url,amazon_url,COALESCE(is_active,1) is_active,COALESCE(do_not_reorder,0) do_not_reorder,updated_at
    FROM site_item_inventory WHERE site_item_inventory_id=? LIMIT 1
  `).bind(id).first().catch(() => null);
  return shapeItem(row);
}

export async function resolveInventoryByIdentifier(db, value, typeHint = '') {
  const raw = cleanText(value, 180);
  if (!raw) return { resolved: null, ambiguous: false, candidates: [], identifier_type: '', normalized_value: '' };
  const identifierType = inferIdentifierType(raw, typeHint);
  const normalized = normalizeIdentifierValue(raw, identifierType);
  let matches = resultRows(await db.prepare(`
    SELECT ii.site_item_inventory_id,ii.identifier_type,ii.identifier_value,ii.verification_status,
           sii.source_type,sii.external_key,sii.item_name,sii.category,
           COALESCE(sii.on_hand_quantity,0) on_hand_quantity,COALESCE(sii.reserved_quantity,0) reserved_quantity,
           COALESCE(sii.incoming_quantity,0) incoming_quantity,COALESCE(sii.reorder_level,0) reorder_level,
           COALESCE(sii.unit_cost_cents,0) unit_cost_cents,COALESCE(sii.stock_unit_label,'unit') stock_unit_label,
           COALESCE(sii.usage_unit_label,'unit') usage_unit_label,sii.supplier_name,sii.supplier_sku,sii.supplier_contact,
           sii.source_url,sii.amazon_url,COALESCE(sii.is_active,1) is_active,sii.updated_at
    FROM inventory_item_identifiers ii
    INNER JOIN site_item_inventory sii ON sii.site_item_inventory_id=ii.site_item_inventory_id
    WHERE ii.normalized_value=? AND ii.verification_status<>'rejected' AND COALESCE(sii.is_active,1)=1
    ORDER BY CASE WHEN ii.identifier_type=? THEN 0 ELSE 1 END,
             CASE WHEN ii.verification_status='verified' THEN 0 ELSE 1 END,ii.is_primary DESC,ii.inventory_item_identifier_id
    LIMIT 20
  `).bind(normalized, identifierType).all().catch(() => ({ results: [] })));

  if (!matches.length) {
    matches = resultRows(await db.prepare(`
      SELECT site_item_inventory_id,source_type,external_key,item_name,category,
             COALESCE(on_hand_quantity,0) on_hand_quantity,COALESCE(reserved_quantity,0) reserved_quantity,
             COALESCE(incoming_quantity,0) incoming_quantity,COALESCE(reorder_level,0) reorder_level,
             COALESCE(unit_cost_cents,0) unit_cost_cents,COALESCE(stock_unit_label,'unit') stock_unit_label,
             COALESCE(usage_unit_label,'unit') usage_unit_label,supplier_name,supplier_sku,supplier_contact,
             source_url,amazon_url,COALESCE(is_active,1) is_active,updated_at
      FROM site_item_inventory
      WHERE COALESCE(is_active,1)=1 AND (
        UPPER(REPLACE(TRIM(COALESCE(supplier_sku,'')),' ',''))=? OR UPPER(TRIM(COALESCE(external_key,'')))=?
      )
      ORDER BY site_item_inventory_id LIMIT 20
    `).bind(normalized, normalized).all().catch(() => ({ results: [] })));
  }

  const unique = new Map();
  for (const row of matches) {
    const item = shapeItem(row);
    if (item?.site_item_inventory_id && !unique.has(item.site_item_inventory_id)) unique.set(item.site_item_inventory_id, item);
  }
  const candidates = [...unique.values()];
  return { resolved: candidates.length === 1 ? candidates[0] : null, ambiguous: candidates.length > 1, candidates, identifier_type: identifierType, normalized_value: normalized };
}

export async function searchReceivingInventory(db, query, limit = 30) {
  const q = cleanText(query, 180).toLowerCase();
  if (!q) return [];
  const bounded = Math.max(1, Math.min(50, Math.floor(finiteNumber(limit, 30))));
  const like = `%${q}%`;
  const result = await db.prepare(`
    SELECT site_item_inventory_id,source_type,external_key,item_name,category,
           COALESCE(on_hand_quantity,0) on_hand_quantity,COALESCE(reserved_quantity,0) reserved_quantity,
           COALESCE(incoming_quantity,0) incoming_quantity,COALESCE(reorder_level,0) reorder_level,
           COALESCE(unit_cost_cents,0) unit_cost_cents,COALESCE(stock_unit_label,'unit') stock_unit_label,
           COALESCE(usage_unit_label,'unit') usage_unit_label,supplier_name,supplier_sku,supplier_contact,
           source_url,amazon_url,COALESCE(is_active,1) is_active,updated_at
    FROM site_item_inventory
    WHERE COALESCE(is_active,1)=1 AND LOWER(TRIM(COALESCE(source_type,''))) IN ('tool','supply')
      AND (LOWER(COALESCE(item_name,'')) LIKE ? OR LOWER(COALESCE(external_key,'')) LIKE ? OR
           LOWER(COALESCE(supplier_sku,'')) LIKE ? OR LOWER(COALESCE(supplier_name,'')) LIKE ? OR CAST(site_item_inventory_id AS TEXT)=?)
    ORDER BY CASE WHEN LOWER(COALESCE(item_name,''))=? THEN 0 ELSE 1 END,LOWER(COALESCE(item_name,'')),site_item_inventory_id
    LIMIT ?
  `).bind(like, like, like, like, q, q, bounded).all().catch(() => ({ results: [] }));
  return resultRows(result).map(shapeItem);
}

export async function loadReceivingItemContext(db, inventoryId) {
  const item = await loadReceivingInventoryItem(db, inventoryId);
  if (!item) return null;
  const [identifiers, sources, lots] = await Promise.all([
    db.prepare(`SELECT inventory_item_identifier_id,identifier_type,identifier_value,normalized_value,source_name,is_primary,verification_status,verified_at,created_at FROM inventory_item_identifiers WHERE site_item_inventory_id=? AND verification_status<>'rejected' ORDER BY is_primary DESC,identifier_type,inventory_item_identifier_id LIMIT 40`).bind(item.site_item_inventory_id).all().catch(() => ({ results: [] })),
    db.prepare(`SELECT inventory_item_source_id,source_kind,source_name,supplier_sku,source_url,source_reference,is_preferred,verification_status,receipt_count,last_received_at,last_verified_at,updated_at FROM inventory_item_sources WHERE site_item_inventory_id=? AND verification_status<>'rejected' ORDER BY is_preferred DESC,last_received_at DESC,inventory_item_source_id DESC LIMIT 30`).bind(item.site_item_inventory_id).all().catch(() => ({ results: [] })),
    db.prepare(`SELECT inventory_purchase_lot_id,lot_code,purchase_date,received_date,supplier_name,supplier_order_number,supplier_sku,source_url,quantity_received,quantity_remaining,unit_cost_cents,shipping_cost_cents,tax_cost_cents,expiry_date,storage_location,lot_status,notes,created_at,updated_at FROM inventory_purchase_lots WHERE site_item_inventory_id=? ORDER BY COALESCE(received_date,purchase_date,created_at) DESC,inventory_purchase_lot_id DESC LIMIT 20`).bind(item.site_item_inventory_id).all().catch(() => ({ results: [] })),
  ]);
  return { item, identifiers: resultRows(identifiers), sources: resultRows(sources), lots: resultRows(lots) };
}

export async function loadRecentReceivingClaims(db, limit = 25) {
  const bounded = Math.max(1, Math.min(100, Math.floor(finiteNumber(limit, 25))));
  const result = await db.prepare(`
    SELECT rc.*,sii.item_name,sii.source_type,sii.external_key,sii.stock_unit_label
    FROM inventory_receiving_claims rc
    INNER JOIN site_item_inventory sii ON sii.site_item_inventory_id=rc.site_item_inventory_id
    ORDER BY rc.inventory_receiving_claim_id DESC LIMIT ?
  `).bind(bounded).all().catch(() => ({ results: [] }));
  return resultRows(result);
}

async function loadPurchaseOrderLine(db, poItemId) {
  const id = positiveId(poItemId);
  if (!id) return null;
  return db.prepare(`
    SELECT spoi.supplier_purchase_order_item_id,spoi.supplier_purchase_order_id,spoi.site_item_inventory_id,
           spoi.item_name,spoi.source_type,spoi.external_key,spoi.quantity_ordered,COALESCE(spoi.quantity_received,0) quantity_received,
           COALESCE(spoi.unit_cost_cents,0) unit_cost_cents,spoi.incoming_applied_at,spoi.received_at,
           spo.supplier_name po_supplier_name,spo.supplier_contact po_supplier_contact,spo.status po_status
    FROM supplier_purchase_order_items spoi
    INNER JOIN supplier_purchase_orders spo ON spo.supplier_purchase_order_id=spoi.supplier_purchase_order_id
    WHERE spoi.supplier_purchase_order_item_id=? LIMIT 1
  `).bind(id).first().catch(() => null);
}

async function loadClaim(db, receiveKey) {
  return db.prepare(`SELECT * FROM inventory_receiving_claims WHERE receive_key=? LIMIT 1`).bind(receiveKey).first().catch(() => null);
}

async function verifyIdentifierCanBind(db, inventoryId, value, type) {
  const normalized = normalizeIdentifierValue(value, type);
  const result = await db.prepare(`SELECT site_item_inventory_id,identifier_type,identifier_value,verification_status FROM inventory_item_identifiers WHERE normalized_value=? AND verification_status<>'rejected' ORDER BY inventory_item_identifier_id LIMIT 5`).bind(normalized).all().catch(() => ({ results: [] }));
  const conflicts = resultRows(result).filter((row) => positiveId(row.site_item_inventory_id) !== inventoryId);
  if (BARCODE_TYPES.has(type) && conflicts.length) throw errorWith('That barcode is already linked to another Inventory item. Receiving stopped before stock changed.', 409, 'inventory_receiving_barcode_conflict', { conflicts });
  return normalized;
}

async function prepareReceipt(db, raw, actorUserId) {
  const receiveKey = cleanText(raw?.receive_key, 120);
  if (receiveKey.length < 8) throw errorWith('A stable receiving idempotency key is required.', 400, 'inventory_receiving_key_required');
  const receivedQty = qty(raw?.quantity_received);
  if (!(receivedQty > EPSILON)) throw errorWith('Received quantity must be greater than zero.', 400, 'inventory_receiving_quantity_required');

  let inventoryId = positiveId(raw?.site_item_inventory_id);
  if (!inventoryId && cleanText(raw?.identifier, 180)) {
    const resolved = await resolveInventoryByIdentifier(db, raw.identifier, raw.identifier_type);
    if (resolved.ambiguous) throw errorWith('The scanned identifier matches more than one Inventory item. Select the intended item before receiving.', 409, 'inventory_receiving_identifier_ambiguous', { candidates: resolved.candidates });
    inventoryId = positiveId(resolved.resolved?.site_item_inventory_id);
  }
  if (!inventoryId) throw errorWith('Choose or resolve an Inventory item before receiving.', 400, 'inventory_receiving_item_required');

  const item = await loadReceivingInventoryItem(db, inventoryId);
  if (!item) throw errorWith('Inventory item was not found.', 404, 'inventory_receiving_item_not_found');
  if (!item.is_active) throw errorWith('Inactive Inventory items cannot receive stock.', 409, 'inventory_receiving_item_inactive');
  const sourceType = lowerText(item.source_type);
  if (!['tool','supply'].includes(sourceType)) throw errorWith('Barcode receiving is restricted to Tool and Supply Inventory. Finished Product stock must use its owning production/commerce workflow.', 409, 'inventory_receiving_wrong_owner');

  const existingClaim = await loadClaim(db, receiveKey);
  if (existingClaim) {
    if (String(existingClaim.claim_status || '') === 'completed' && positiveId(existingClaim.site_item_inventory_id) === inventoryId && nearlyEqual(existingClaim.quantity_received, receivedQty)) {
      return { idempotent: true, claim: existingClaim, item };
    }
    throw errorWith('That receiving key was already used for a different or incomplete receipt. Use a new receive action.', 409, 'inventory_receiving_key_conflict');
  }

  const poItemId = positiveId(raw?.supplier_purchase_order_item_id);
  const poLine = poItemId ? await loadPurchaseOrderLine(db, poItemId) : null;
  if (poItemId && !poLine) throw errorWith('Purchase-order line was not found.', 404, 'inventory_receiving_po_line_not_found');
  if (poLine && positiveId(poLine.site_item_inventory_id) !== inventoryId) throw errorWith('Purchase-order line belongs to a different Inventory item.', 409, 'inventory_receiving_po_item_mismatch');
  if (poLine && lowerText(poLine.po_status) === 'cancelled') throw errorWith('Cancelled purchase orders cannot receive stock.', 409, 'inventory_receiving_po_cancelled');
  if (poLine) {
    const remaining = Math.max(0, finiteNumber(poLine.quantity_ordered, 0) - finiteNumber(poLine.quantity_received, 0));
    if (receivedQty > remaining + EPSILON) throw errorWith(`Only ${remaining} unit(s) remain open on this purchase-order line.`, 409, 'inventory_receiving_po_over_receive');
  }

  const scannedIdentifier = cleanText(raw?.identifier, 180);
  const identifierType = scannedIdentifier ? inferIdentifierType(scannedIdentifier, raw?.identifier_type) : '';
  const bindIdentifier = Boolean(scannedIdentifier && Number(raw?.bind_identifier || 0) === 1);
  const normalizedIdentifier = bindIdentifier ? await verifyIdentifierCanBind(db, inventoryId, scannedIdentifier, identifierType) : '';

  const lotCode = makeLotCode(raw?.lot_code, receiveKey);
  const existingLot = await db.prepare(`SELECT * FROM inventory_purchase_lots WHERE site_item_inventory_id=? AND lot_code=? LIMIT 1`).bind(inventoryId, lotCode).first().catch(() => null);
  if (existingLot && ['expired','quarantined','returned'].includes(lowerText(existingLot.lot_status))) throw errorWith(`Lot ${lotCode} is ${existingLot.lot_status}; receive under a new lot code or review the existing lot first.`, 409, 'inventory_receiving_lot_not_receivable');

  const requestedCost = cents(raw?.unit_cost_cents);
  const unitCost = requestedCost || cents(poLine?.unit_cost_cents) || cents(existingLot?.unit_cost_cents) || cents(item.unit_cost_cents);
  if (existingLot && requestedCost > 0 && cents(existingLot.unit_cost_cents) > 0 && requestedCost !== cents(existingLot.unit_cost_cents)) throw errorWith(`Lot ${lotCode} already has a different unit cost. Use a new lot code rather than mixing unlike costs.`, 409, 'inventory_receiving_lot_cost_mismatch');

  const previousOnHand = Math.max(0, finiteNumber(item.on_hand_quantity, 0));
  const previousIncoming = Math.max(0, finiteNumber(item.incoming_quantity, 0));
  const requestedIncomingClear = poLine ? receivedQty : (Number(raw?.clear_incoming || 0) === 1 ? receivedQty : Math.max(0, finiteNumber(raw?.quantity_incoming_cleared, 0)));
  const incomingCleared = Math.min(previousIncoming, requestedIncomingClear);

  const rawSourceKind = lowerText(raw?.source_kind || (poLine?.po_supplier_name ? 'supplier' : (item.amazon_url ? 'amazon' : 'manual')));
  const sourceKind = SOURCE_KINDS.has(rawSourceKind) ? rawSourceKind : 'manual';

  return {
    idempotent: false,
    receive_key: receiveKey,
    actor_user_id: positiveId(actorUserId) || null,
    item,
    inventory_id: inventoryId,
    source_type: sourceType,
    quantity: receivedQty,
    previous_on_hand: previousOnHand,
    next_on_hand: qty(previousOnHand + receivedQty),
    previous_incoming: previousIncoming,
    incoming_cleared: incomingCleared,
    next_incoming: qty(previousIncoming - incomingCleared),
    po_line: poLine,
    po_item_id: poItemId || null,
    lot_code: lotCode,
    existing_lot: existingLot,
    unit_cost_cents: unitCost,
    shipping_cost_cents: cents(raw?.shipping_cost_cents),
    tax_cost_cents: cents(raw?.tax_cost_cents),
    purchase_date: cleanText(raw?.purchase_date, 20) || null,
    received_date: cleanText(raw?.received_date, 20) || new Date().toISOString().slice(0, 10),
    expiry_date: cleanText(raw?.expiry_date, 20) || null,
    storage_location: cleanText(raw?.storage_location, 180) || null,
    notes: cleanText(raw?.notes, 1000) || null,
    source_kind: sourceKind,
    source_name: cleanText(raw?.source_name || raw?.supplier_name || poLine?.po_supplier_name || item.supplier_name, 220),
    supplier_sku: cleanText(raw?.supplier_sku || item.supplier_sku, 180),
    source_url: cleanText(raw?.source_url || item.source_url || item.amazon_url, 1000),
    source_reference: cleanText(raw?.source_reference || (poLine ? `Purchase order #${poLine.supplier_purchase_order_id}` : ''), 500) || null,
    scanned_identifier: scannedIdentifier || null,
    identifier_type: identifierType || null,
    normalized_identifier: normalizedIdentifier || null,
    bind_identifier: bindIdentifier,
    make_preferred_source: Number(raw?.make_preferred_source || 0) === 1,
    verify_source: Number(raw?.verify_source || 0) === 1,
  };
}

async function compensateReceipt(db, plan, result, indices) {
  const inventoryChanged = Number(result?.[indices.inventory]?.meta?.changes || 0) === 1;
  const lotChanged = Number(result?.[indices.lot]?.meta?.changes || 0) === 1;
  const poChanged = indices.po == null ? false : Number(result?.[indices.po]?.meta?.changes || 0) === 1;
  const statements = [];
  if (inventoryChanged) {
    statements.push(db.prepare(`UPDATE site_item_inventory SET on_hand_quantity=?,incoming_quantity=?,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=? AND ABS(COALESCE(on_hand_quantity,0)-?)<? AND ABS(COALESCE(incoming_quantity,0)-?)<?`).bind(plan.previous_on_hand, plan.previous_incoming, plan.inventory_id, plan.next_on_hand, EPSILON, plan.next_incoming, EPSILON));
    statements.push(db.prepare(`INSERT INTO site_inventory_movements(site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at) VALUES (?,?,?,?, 'correction',?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(plan.inventory_id, plan.item.source_type || null, plan.item.external_key || null, plan.item.item_name || null, -plan.quantity, plan.next_on_hand, plan.previous_on_hand, finiteNumber(plan.item.reserved_quantity,0), finiteNumber(plan.item.reserved_quantity,0), plan.next_incoming, plan.previous_incoming, `Automatic compensation for failed receiving claim ${plan.receive_key}`.slice(0,500), plan.actor_user_id));
  }
  if (lotChanged) {
    if (plan.existing_lot) {
      statements.push(db.prepare(`UPDATE inventory_purchase_lots SET quantity_received=?,quantity_remaining=?,shipping_cost_cents=?,tax_cost_cents=?,lot_status=?,updated_at=CURRENT_TIMESTAMP WHERE inventory_purchase_lot_id=?`).bind(finiteNumber(plan.existing_lot.quantity_received,0), finiteNumber(plan.existing_lot.quantity_remaining,0), cents(plan.existing_lot.shipping_cost_cents), cents(plan.existing_lot.tax_cost_cents), plan.existing_lot.lot_status || 'available', positiveId(plan.existing_lot.inventory_purchase_lot_id)));
    } else {
      statements.push(db.prepare(`DELETE FROM inventory_purchase_lots WHERE site_item_inventory_id=? AND lot_code=? AND ABS(COALESCE(quantity_received,0)-?)<? AND ABS(COALESCE(quantity_remaining,0)-?)<?`).bind(plan.inventory_id, plan.lot_code, plan.quantity, EPSILON, plan.quantity, EPSILON));
    }
  }
  if (poChanged && plan.po_line) statements.push(db.prepare(`UPDATE supplier_purchase_order_items SET quantity_received=?,received_at=? WHERE supplier_purchase_order_item_id=?`).bind(finiteNumber(plan.po_line.quantity_received,0), plan.po_line.received_at || null, plan.po_item_id));
  statements.push(db.prepare(`UPDATE inventory_receiving_claims SET claim_status='failed',error_note='Automatic compensation after receiving verification failure.',updated_at=CURRENT_TIMESTAMP WHERE receive_key=?`).bind(plan.receive_key));
  if (statements.length) await db.batch(statements);
}

async function persistProvenance(db, plan) {
  const warnings = [];
  if (plan.bind_identifier && plan.scanned_identifier && plan.normalized_identifier) {
    try {
      await db.prepare(`
        INSERT INTO inventory_item_identifiers(site_item_inventory_id,identifier_type,identifier_value,normalized_value,source_name,is_primary,verification_status,verified_by_user_id,verified_at,created_by_user_id,created_at,updated_at)
        VALUES (?,?,?,?,?,0,'verified',?,CURRENT_TIMESTAMP,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
        ON CONFLICT(site_item_inventory_id,identifier_type,normalized_value,source_name) DO UPDATE SET identifier_value=excluded.identifier_value,verification_status='verified',verified_by_user_id=excluded.verified_by_user_id,verified_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
      `).bind(plan.inventory_id, plan.identifier_type, plan.scanned_identifier, plan.normalized_identifier, normalizeSourceName(plan.source_name), plan.actor_user_id, plan.actor_user_id).run();
    } catch (error) {
      warnings.push(`Stock was received, but barcode/SKU binding needs review: ${String(error?.message || error)}`);
    }
  }

  if (plan.source_name || plan.supplier_sku || plan.source_url) {
    try {
      if (plan.make_preferred_source) await db.prepare(`UPDATE inventory_item_sources SET is_preferred=0,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=?`).bind(plan.inventory_id).run();
      await db.prepare(`
        INSERT INTO inventory_item_sources(site_item_inventory_id,source_kind,source_name,source_name_normalized,supplier_sku,supplier_sku_normalized,source_url,source_url_normalized,source_reference,is_preferred,verification_status,receipt_count,last_received_at,last_verified_at,created_by_user_id,updated_by_user_id,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,1,CURRENT_TIMESTAMP,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
        ON CONFLICT(site_item_inventory_id,source_kind,source_name_normalized,supplier_sku_normalized,source_url_normalized) DO UPDATE SET
          source_name=excluded.source_name,supplier_sku=excluded.supplier_sku,source_url=excluded.source_url,
          source_reference=COALESCE(excluded.source_reference,inventory_item_sources.source_reference),
          is_preferred=CASE WHEN excluded.is_preferred=1 THEN 1 ELSE inventory_item_sources.is_preferred END,
          verification_status=CASE WHEN excluded.verification_status='verified' THEN 'verified' ELSE inventory_item_sources.verification_status END,
          receipt_count=COALESCE(inventory_item_sources.receipt_count,0)+1,last_received_at=CURRENT_TIMESTAMP,
          last_verified_at=CASE WHEN excluded.verification_status='verified' THEN CURRENT_TIMESTAMP ELSE inventory_item_sources.last_verified_at END,
          updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP
      `).bind(plan.inventory_id, plan.source_kind, plan.source_name, normalizeSourceName(plan.source_name), plan.supplier_sku, normalizeSourceSku(plan.supplier_sku), plan.source_url, normalizeSourceUrl(plan.source_url), plan.source_reference, plan.make_preferred_source ? 1 : 0, plan.verify_source ? 'verified' : 'needs_review', plan.verify_source ? new Date().toISOString() : null, plan.actor_user_id, plan.actor_user_id).run();
      if (plan.make_preferred_source) await db.prepare(`UPDATE site_item_inventory SET supplier_name=?,supplier_sku=?,source_url=?,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=?`).bind(plan.source_name || null, plan.supplier_sku || null, plan.source_url || null, plan.inventory_id).run();
    } catch (error) {
      warnings.push(`Stock was received, but supplier/source provenance needs review: ${String(error?.message || error)}`);
    }
  }
  return warnings;
}

export async function receiveInventoryItem(db, rawReceipt, actorUserId) {
  const schema = await inventoryReceivingSchemaReadiness(db);
  if (!schema.ok) throw errorWith(`Build 440 receiving schema is not ready (${schema.missing_tables.join(', ')}).`, 503, 'inventory_receiving_schema_not_ready', schema);
  const plan = await prepareReceipt(db, rawReceipt || {}, actorUserId);
  if (plan.idempotent) return { ok: true, idempotent_replay: true, claim: plan.claim, item: plan.item, warnings: [] };

  const statements = [];
  const indices = {};
  indices.claim = statements.length;
  statements.push(db.prepare(`
    INSERT INTO inventory_receiving_claims(receive_key,site_item_inventory_id,supplier_purchase_order_item_id,lot_code,quantity_received,quantity_incoming_cleared,unit_cost_cents,shipping_cost_cents,tax_cost_cents,source_kind,source_name,supplier_sku,source_url,scanned_identifier,previous_on_hand_quantity,new_on_hand_quantity,previous_incoming_quantity,new_incoming_quantity,claim_status,received_by_user_id,received_at,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'applying',?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
  `).bind(plan.receive_key, plan.inventory_id, plan.po_item_id, plan.lot_code, plan.quantity, plan.incoming_cleared, plan.unit_cost_cents, plan.shipping_cost_cents, plan.tax_cost_cents, plan.source_kind, plan.source_name || null, plan.supplier_sku || null, plan.source_url || null, plan.scanned_identifier || null, plan.previous_on_hand, plan.next_on_hand, plan.previous_incoming, plan.next_incoming, plan.actor_user_id));

  indices.inventory = statements.length;
  statements.push(db.prepare(`
    UPDATE site_item_inventory SET on_hand_quantity=?,incoming_quantity=?,
      is_on_reorder_list=CASE WHEN (? + ?) > COALESCE(reorder_level,0) THEN 0 ELSE is_on_reorder_list END,
      last_counted_at=CURRENT_TIMESTAMP,last_seen_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
    WHERE site_item_inventory_id=? AND ABS(COALESCE(on_hand_quantity,0)-?)<? AND ABS(COALESCE(incoming_quantity,0)-?)<?
      AND EXISTS(SELECT 1 FROM inventory_receiving_claims WHERE receive_key=? AND claim_status='applying')
  `).bind(plan.next_on_hand, plan.next_incoming, plan.next_on_hand, plan.next_incoming, plan.inventory_id, plan.previous_on_hand, EPSILON, plan.previous_incoming, EPSILON, plan.receive_key));

  indices.lot = statements.length;
  if (plan.existing_lot) {
    statements.push(db.prepare(`
      UPDATE inventory_purchase_lots SET quantity_received=?,quantity_remaining=?,shipping_cost_cents=COALESCE(shipping_cost_cents,0)+?,tax_cost_cents=COALESCE(tax_cost_cents,0)+?,
        received_date=COALESCE(?,received_date),supplier_name=COALESCE(NULLIF(?,''),supplier_name),supplier_sku=COALESCE(NULLIF(?,''),supplier_sku),source_url=COALESCE(NULLIF(?,''),source_url),
        expiry_date=COALESCE(?,expiry_date),storage_location=COALESCE(?,storage_location),lot_status='available',notes=COALESCE(?,notes),updated_at=CURRENT_TIMESTAMP
      WHERE inventory_purchase_lot_id=? AND site_item_inventory_id=? AND ABS(COALESCE(quantity_received,0)-?)<? AND ABS(COALESCE(quantity_remaining,0)-?)<?
        AND EXISTS(SELECT 1 FROM inventory_receiving_claims WHERE receive_key=? AND claim_status='applying')
    `).bind(qty(finiteNumber(plan.existing_lot.quantity_received,0)+plan.quantity), qty(finiteNumber(plan.existing_lot.quantity_remaining,0)+plan.quantity), plan.shipping_cost_cents, plan.tax_cost_cents, plan.received_date, plan.source_name, plan.supplier_sku, plan.source_url, plan.expiry_date, plan.storage_location, plan.notes, positiveId(plan.existing_lot.inventory_purchase_lot_id), plan.inventory_id, finiteNumber(plan.existing_lot.quantity_received,0), EPSILON, finiteNumber(plan.existing_lot.quantity_remaining,0), EPSILON, plan.receive_key));
  } else {
    statements.push(db.prepare(`
      INSERT INTO inventory_purchase_lots(site_item_inventory_id,lot_code,purchase_date,received_date,supplier_name,supplier_order_number,supplier_sku,asin,source_url,quantity_received,quantity_remaining,unit_cost_cents,shipping_cost_cents,tax_cost_cents,expiry_date,storage_location,lot_status,notes,created_by_user_id,created_at,updated_at)
      SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
      WHERE EXISTS(SELECT 1 FROM inventory_receiving_claims WHERE receive_key=? AND claim_status='applying')
    `).bind(plan.inventory_id, plan.lot_code, plan.purchase_date, plan.received_date, plan.source_name || null, plan.po_line?.supplier_purchase_order_id ? String(plan.po_line.supplier_purchase_order_id) : null, plan.supplier_sku || null, null, plan.source_url || null, plan.quantity, plan.quantity, plan.unit_cost_cents, plan.shipping_cost_cents, plan.tax_cost_cents, plan.expiry_date, plan.storage_location, 'available', plan.notes, plan.actor_user_id, plan.receive_key));
  }

  statements.push(db.prepare(`
    INSERT INTO site_inventory_movements(site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at)
    SELECT site_item_inventory_id,source_type,external_key,item_name,'incoming',?,?,?,COALESCE(reserved_quantity,0),COALESCE(reserved_quantity,0),?,?,?,?,CURRENT_TIMESTAMP
    FROM site_item_inventory
    WHERE site_item_inventory_id=? AND ABS(COALESCE(on_hand_quantity,0)-?)<? AND ABS(COALESCE(incoming_quantity,0)-?)<?
      AND EXISTS(SELECT 1 FROM inventory_receiving_claims WHERE receive_key=? AND claim_status='applying')
  `).bind(plan.quantity, plan.previous_on_hand, plan.next_on_hand, plan.previous_incoming, plan.next_incoming, `Received ${plan.quantity} ${plan.item.stock_unit_label || 'unit'} · lot ${plan.lot_code} · claim ${plan.receive_key}${plan.po_line ? ` · PO #${plan.po_line.supplier_purchase_order_id}` : ''}`.slice(0,500), plan.actor_user_id, plan.inventory_id, plan.next_on_hand, EPSILON, plan.next_incoming, EPSILON, plan.receive_key));

  indices.po = null;
  if (plan.po_line) {
    indices.po = statements.length;
    const nextReceived = qty(finiteNumber(plan.po_line.quantity_received,0) + plan.quantity);
    statements.push(db.prepare(`
      UPDATE supplier_purchase_order_items SET quantity_received=?,received_at=CURRENT_TIMESTAMP
      WHERE supplier_purchase_order_item_id=? AND ABS(COALESCE(quantity_received,0)-?)<? AND COALESCE(quantity_ordered,0)+?>=?
        AND EXISTS(SELECT 1 FROM inventory_receiving_claims WHERE receive_key=? AND claim_status='applying')
    `).bind(nextReceived, plan.po_item_id, finiteNumber(plan.po_line.quantity_received,0), EPSILON, EPSILON, nextReceived, plan.receive_key));
  }

  if (plan.source_type === 'supply') {
    statements.push(db.prepare(`
      INSERT INTO inventory_lot_policies(site_item_inventory_id,depletion_method,reconcile_status,last_reconciled_quantity,last_reconciled_at,updated_by_user_id,updated_at)
      VALUES (?,'fifo','reconciled',?,CURRENT_TIMESTAMP,?,CURRENT_TIMESTAMP)
      ON CONFLICT(site_item_inventory_id) DO UPDATE SET reconcile_status='reconciled',last_reconciled_quantity=excluded.last_reconciled_quantity,last_reconciled_at=CURRENT_TIMESTAMP,updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP
    `).bind(plan.inventory_id, plan.next_on_hand, plan.actor_user_id));
  }

  indices.complete = statements.length;
  const poCompletionGuard = plan.po_line ? `AND EXISTS(SELECT 1 FROM supplier_purchase_order_items WHERE supplier_purchase_order_item_id=? AND ABS(COALESCE(quantity_received,0)-?)<?)` : '';
  const completeBindings = [plan.inventory_id, plan.lot_code, plan.receive_key, plan.inventory_id, plan.next_on_hand, EPSILON, plan.next_incoming, EPSILON, plan.inventory_id, plan.lot_code];
  if (plan.po_line) completeBindings.push(plan.po_item_id, qty(finiteNumber(plan.po_line.quantity_received,0)+plan.quantity), EPSILON);
  statements.push(db.prepare(`
    UPDATE inventory_receiving_claims
    SET inventory_purchase_lot_id=(SELECT inventory_purchase_lot_id FROM inventory_purchase_lots WHERE site_item_inventory_id=? AND lot_code=? LIMIT 1),claim_status='completed',completed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
    WHERE receive_key=? AND claim_status='applying'
      AND EXISTS(SELECT 1 FROM site_item_inventory WHERE site_item_inventory_id=? AND ABS(COALESCE(on_hand_quantity,0)-?)<? AND ABS(COALESCE(incoming_quantity,0)-?)<?)
      AND EXISTS(SELECT 1 FROM inventory_purchase_lots WHERE site_item_inventory_id=? AND lot_code=?)
      ${poCompletionGuard}
  `).bind(...completeBindings));

  let batchResult;
  try {
    batchResult = await db.batch(statements);
  } catch (error) {
    throw errorWith('The receiving transaction failed before completion. No successful receipt should be assumed.', 409, 'inventory_receiving_transaction_failed', String(error?.message || error));
  }

  const claimChanged = Number(batchResult?.[indices.claim]?.meta?.changes || 0) === 1;
  const inventoryChanged = Number(batchResult?.[indices.inventory]?.meta?.changes || 0) === 1;
  const lotChanged = Number(batchResult?.[indices.lot]?.meta?.changes || 0) === 1;
  const poChanged = indices.po == null || Number(batchResult?.[indices.po]?.meta?.changes || 0) === 1;
  const completed = Number(batchResult?.[indices.complete]?.meta?.changes || 0) === 1;
  if (!claimChanged || !inventoryChanged || !lotChanged || !poChanged || !completed) {
    await compensateReceipt(db, plan, batchResult, indices).catch(() => null);
    throw errorWith('Inventory changed while receiving was being posted. Any verified partial stock changes were compensated; reload and receive again.', 409, 'inventory_receiving_concurrent_change', { claimChanged, inventoryChanged, lotChanged, poChanged, completed });
  }

  const warnings = await persistProvenance(db, plan);
  const [claim, context] = await Promise.all([loadClaim(db, plan.receive_key), loadReceivingItemContext(db, plan.inventory_id)]);
  return { ok: true, idempotent_replay: false, claim, item: context?.item || plan.item, context, warnings };
}

export { EPSILON };
