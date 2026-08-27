// Devil n Dove Build 440 — one-time compensating reversal for completed Tool/Supply receipts.
// Original receiving claims remain immutable. Reversal is allowed only while the linked purchase lot
// still contains at least the received quantity, so consumed material is never silently recreated.

import { normalizeText } from './adminAudit.js';
import { EPSILON, loadReceivingInventoryItem } from './inventoryReceiving.js';

const id = (value) => { const n = Number(value || 0); return Number.isInteger(n) && n > 0 ? n : 0; };
const num = (value, fallback = 0) => { const n = Number(value); return Number.isFinite(n) ? n : fallback; };
const qty = (value) => Number(num(value, 0).toFixed(6));
const text = (value, max = 1000) => normalizeText(value).slice(0, max);
function fail(message, status = 400, code = 'inventory_receiving_reversal_invalid', details = null) { const e = new Error(message); e.status = status; e.code = code; e.details = details; return e; }

export async function receivingReversalSchemaReadiness(db) {
  const row = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='inventory_receiving_reversals' LIMIT 1`).first().catch(() => null);
  return { ok: Boolean(row?.name), missing_tables: row?.name ? [] : ['inventory_receiving_reversals'] };
}

export async function loadRecentReceivingReversals(db, limit = 100) {
  const bounded = Math.max(1, Math.min(200, Math.floor(num(limit, 100))));
  const result = await db.prepare(`SELECT inventory_receiving_reversal_id,inventory_receiving_claim_id,reversal_key,site_item_inventory_id,inventory_purchase_lot_id,supplier_purchase_order_item_id,quantity_reversed,quantity_incoming_restored,reversal_reason,reversed_by_user_id,reversed_at FROM inventory_receiving_reversals ORDER BY inventory_receiving_reversal_id DESC LIMIT ?`).bind(bounded).all().catch(() => ({ results: [] }));
  return Array.isArray(result?.results) ? result.results : [];
}

async function loadClaimContext(db, claimId) {
  const claim = await db.prepare(`SELECT * FROM inventory_receiving_claims WHERE inventory_receiving_claim_id=? LIMIT 1`).bind(claimId).first().catch(() => null);
  if (!claim) throw fail('Receiving claim was not found.', 404, 'inventory_receiving_reversal_claim_not_found');
  if (String(claim.claim_status || '') !== 'completed') throw fail('Only completed receiving claims can be reversed.', 409, 'inventory_receiving_reversal_claim_not_completed');
  const existingReversal = await db.prepare(`SELECT * FROM inventory_receiving_reversals WHERE inventory_receiving_claim_id=? LIMIT 1`).bind(claimId).first().catch(() => null);
  if (existingReversal) throw fail('This receiving claim has already been reversed. A receipt can only be reversed once.', 409, 'inventory_receiving_reversal_already_reversed', { reversal: existingReversal });
  const item = await loadReceivingInventoryItem(db, claim.site_item_inventory_id);
  if (!item) throw fail('The Inventory item from this receiving claim no longer exists.', 409, 'inventory_receiving_reversal_item_missing');
  const lot = await db.prepare(`SELECT * FROM inventory_purchase_lots WHERE inventory_purchase_lot_id=? AND site_item_inventory_id=? LIMIT 1`).bind(id(claim.inventory_purchase_lot_id), id(claim.site_item_inventory_id)).first().catch(() => null);
  if (!lot) throw fail('The purchase lot from this receiving claim no longer exists.', 409, 'inventory_receiving_reversal_lot_missing');
  let poLine = null;
  if (id(claim.supplier_purchase_order_item_id)) {
    poLine = await db.prepare(`
      SELECT spoi.*,spo.status po_status
      FROM supplier_purchase_order_items spoi
      INNER JOIN supplier_purchase_orders spo ON spo.supplier_purchase_order_id=spoi.supplier_purchase_order_id
      WHERE spoi.supplier_purchase_order_item_id=? LIMIT 1
    `).bind(id(claim.supplier_purchase_order_item_id)).first().catch(() => null);
    if (!poLine) throw fail('The purchase-order line from this receiving claim no longer exists.', 409, 'inventory_receiving_reversal_po_line_missing');
  }
  return { claim, item, lot, poLine };
}

export async function previewReceivingReversal(db, claimId) {
  const schema = await receivingReversalSchemaReadiness(db);
  if (!schema.ok) throw fail('Build 440 receiving reversal schema is not ready.', 503, 'inventory_receiving_reversal_schema_not_ready', schema);
  const { claim, item, lot, poLine } = await loadClaimContext(db, id(claimId));
  const quantity = Math.max(0, num(claim.quantity_received, 0));
  const lotRemaining = Math.max(0, num(lot.quantity_remaining, 0));
  const lotReceived = Math.max(0, num(lot.quantity_received, 0));
  const onHand = Math.max(0, num(item.on_hand_quantity, 0));
  const incoming = Math.max(0, num(item.incoming_quantity, 0));
  const poReceived = poLine ? Math.max(0, num(poLine.quantity_received, 0)) : null;
  const restoreIncoming = poLine && String(poLine.po_status || '').toLowerCase() === 'cancelled' ? 0 : Math.max(0, num(claim.quantity_incoming_cleared, 0));
  const blockers = [];
  if (!(quantity > EPSILON)) blockers.push('The receiving claim has no positive quantity to reverse.');
  if (lotRemaining + EPSILON < quantity) blockers.push(`Only ${lotRemaining} unit(s) remain in lot ${lot.lot_code}; the received quantity can no longer be proven unconsumed.`);
  if (lotReceived + EPSILON < quantity) blockers.push('The purchase lot total is already below this receiving claim quantity.');
  if (onHand + EPSILON < quantity) blockers.push(`Only ${onHand} unit(s) are currently on hand, but this receipt added ${quantity}.`);
  if (poLine && poReceived + EPSILON < quantity) blockers.push('The purchase-order received quantity is already below this receiving claim quantity.');
  return {
    eligible: blockers.length ? 0 : 1,
    blockers,
    claim,
    item,
    lot,
    po_line: poLine,
    quantity_reversed: quantity,
    quantity_incoming_restored: restoreIncoming,
    next_on_hand_quantity: qty(onHand - quantity),
    next_incoming_quantity: qty(incoming + restoreIncoming),
    next_lot_received_quantity: qty(lotReceived - quantity),
    next_lot_remaining_quantity: qty(lotRemaining - quantity),
    next_po_received_quantity: poLine ? qty(poReceived - quantity) : null,
  };
}

async function compensate(db, preview, result, indices, reversalKey) {
  const statements = [];
  if (Number(result?.[indices.inventory]?.meta?.changes || 0) === 1) {
    statements.push(db.prepare(`UPDATE site_item_inventory SET on_hand_quantity=?,incoming_quantity=?,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=? AND ABS(COALESCE(on_hand_quantity,0)-?)<? AND ABS(COALESCE(incoming_quantity,0)-?)<?`).bind(preview.item.on_hand_quantity, preview.item.incoming_quantity, id(preview.item.site_item_inventory_id), preview.next_on_hand_quantity, EPSILON, preview.next_incoming_quantity, EPSILON));
  }
  if (Number(result?.[indices.lot]?.meta?.changes || 0) === 1) {
    statements.push(db.prepare(`UPDATE inventory_purchase_lots SET quantity_received=?,quantity_remaining=?,lot_status=?,updated_at=CURRENT_TIMESTAMP WHERE inventory_purchase_lot_id=? AND ABS(COALESCE(quantity_received,0)-?)<? AND ABS(COALESCE(quantity_remaining,0)-?)<?`).bind(num(preview.lot.quantity_received,0), num(preview.lot.quantity_remaining,0), preview.lot.lot_status || 'available', id(preview.lot.inventory_purchase_lot_id), preview.next_lot_received_quantity, EPSILON, preview.next_lot_remaining_quantity, EPSILON));
  }
  if (indices.po != null && Number(result?.[indices.po]?.meta?.changes || 0) === 1) {
    statements.push(db.prepare(`UPDATE supplier_purchase_order_items SET quantity_received=?,received_at=? WHERE supplier_purchase_order_item_id=? AND ABS(COALESCE(quantity_received,0)-?)<?`).bind(num(preview.po_line.quantity_received,0), preview.po_line.received_at || null, id(preview.po_line.supplier_purchase_order_item_id), preview.next_po_received_quantity, EPSILON));
  }
  statements.push(db.prepare(`DELETE FROM inventory_receiving_reversals WHERE reversal_key=?`).bind(reversalKey));
  if (statements.length) await db.batch(statements);
}

export async function reverseReceivingClaim(db, { inventory_receiving_claim_id, reversal_key, reversal_reason }, actorUserId) {
  const claimId = id(inventory_receiving_claim_id);
  const key = text(reversal_key, 120);
  const reason = text(reversal_reason, 1000);
  if (!claimId) throw fail('A receiving claim is required.', 400, 'inventory_receiving_reversal_claim_required');
  if (key.length < 8) throw fail('A stable reversal idempotency key is required.', 400, 'inventory_receiving_reversal_key_required');
  if (reason.length < 8) throw fail('Enter a clear reversal reason of at least 8 characters.', 400, 'inventory_receiving_reversal_reason_required');
  const existingKey = await db.prepare(`SELECT * FROM inventory_receiving_reversals WHERE reversal_key=? LIMIT 1`).bind(key).first().catch(() => null);
  if (existingKey) {
    if (id(existingKey.inventory_receiving_claim_id) === claimId) return { idempotent_replay: true, reversal: existingKey, preview: null };
    throw fail('That reversal key was already used for another receiving claim.', 409, 'inventory_receiving_reversal_key_conflict');
  }
  const preview = await previewReceivingReversal(db, claimId);
  if (!preview.eligible) throw fail('This receipt cannot be reversed safely.', 409, 'inventory_receiving_reversal_not_eligible', { blockers: preview.blockers });
  const userId = id(actorUserId) || null;
  const statements = [];
  const indices = {};
  indices.claim = statements.length;
  statements.push(db.prepare(`
    INSERT INTO inventory_receiving_reversals(
      inventory_receiving_claim_id,reversal_key,site_item_inventory_id,inventory_purchase_lot_id,supplier_purchase_order_item_id,
      quantity_reversed,quantity_incoming_restored,previous_on_hand_quantity,new_on_hand_quantity,previous_incoming_quantity,new_incoming_quantity,
      previous_lot_received_quantity,new_lot_received_quantity,previous_lot_remaining_quantity,new_lot_remaining_quantity,
      previous_po_received_quantity,new_po_received_quantity,reversal_reason,reversed_by_user_id,reversed_at,created_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
  `).bind(
    claimId,key,id(preview.item.site_item_inventory_id),id(preview.lot.inventory_purchase_lot_id),id(preview.po_line?.supplier_purchase_order_item_id)||null,
    preview.quantity_reversed,preview.quantity_incoming_restored,num(preview.item.on_hand_quantity,0),preview.next_on_hand_quantity,num(preview.item.incoming_quantity,0),preview.next_incoming_quantity,
    num(preview.lot.quantity_received,0),preview.next_lot_received_quantity,num(preview.lot.quantity_remaining,0),preview.next_lot_remaining_quantity,
    preview.po_line ? num(preview.po_line.quantity_received,0) : null,preview.next_po_received_quantity,reason,userId
  ));
  indices.inventory = statements.length;
  statements.push(db.prepare(`
    UPDATE site_item_inventory SET on_hand_quantity=?,incoming_quantity=?,last_seen_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
    WHERE site_item_inventory_id=? AND ABS(COALESCE(on_hand_quantity,0)-?)<? AND ABS(COALESCE(incoming_quantity,0)-?)<?
      AND EXISTS(SELECT 1 FROM inventory_receiving_reversals WHERE reversal_key=? AND inventory_receiving_claim_id=?)
  `).bind(preview.next_on_hand_quantity, preview.next_incoming_quantity, id(preview.item.site_item_inventory_id), num(preview.item.on_hand_quantity,0), EPSILON, num(preview.item.incoming_quantity,0), EPSILON, key, claimId));
  indices.lot = statements.length;
  statements.push(db.prepare(`
    UPDATE inventory_purchase_lots SET quantity_received=?,quantity_remaining=?,lot_status=CASE WHEN ?>? THEN 'available' ELSE 'consumed' END,updated_at=CURRENT_TIMESTAMP
    WHERE inventory_purchase_lot_id=? AND site_item_inventory_id=? AND ABS(COALESCE(quantity_received,0)-?)<? AND ABS(COALESCE(quantity_remaining,0)-?)<?
      AND COALESCE(quantity_remaining,0)>=?
      AND EXISTS(SELECT 1 FROM inventory_receiving_reversals WHERE reversal_key=? AND inventory_receiving_claim_id=?)
  `).bind(preview.next_lot_received_quantity, preview.next_lot_remaining_quantity, preview.next_lot_remaining_quantity, EPSILON, id(preview.lot.inventory_purchase_lot_id), id(preview.item.site_item_inventory_id), num(preview.lot.quantity_received,0), EPSILON, num(preview.lot.quantity_remaining,0), EPSILON, preview.quantity_reversed, key, claimId));
  statements.push(db.prepare(`
    INSERT INTO site_inventory_movements(site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at)
    SELECT site_item_inventory_id,source_type,external_key,item_name,'correction',?,?,?,?,COALESCE(reserved_quantity,0),COALESCE(reserved_quantity,0),?,?,?, ?,CURRENT_TIMESTAMP
    FROM site_item_inventory
    WHERE site_item_inventory_id=? AND ABS(COALESCE(on_hand_quantity,0)-?)<? AND ABS(COALESCE(incoming_quantity,0)-?)<?
      AND EXISTS(SELECT 1 FROM inventory_receiving_reversals WHERE reversal_key=? AND inventory_receiving_claim_id=?)
  `).bind(-preview.quantity_reversed, num(preview.item.on_hand_quantity,0), preview.next_on_hand_quantity, num(preview.item.incoming_quantity,0), preview.next_incoming_quantity, `Reversal of receiving claim ${preview.claim.receive_key}. Reason: ${reason}`.slice(0,500), userId, id(preview.item.site_item_inventory_id), preview.next_on_hand_quantity, EPSILON, preview.next_incoming_quantity, EPSILON, key, claimId));
  indices.po = null;
  if (preview.po_line) {
    indices.po = statements.length;
    statements.push(db.prepare(`UPDATE supplier_purchase_order_items SET quantity_received=?,received_at=CASE WHEN ?>0 THEN received_at ELSE NULL END WHERE supplier_purchase_order_item_id=? AND ABS(COALESCE(quantity_received,0)-?)<? AND COALESCE(quantity_received,0)>=?`).bind(preview.next_po_received_quantity, preview.next_po_received_quantity, id(preview.po_line.supplier_purchase_order_item_id), num(preview.po_line.quantity_received,0), EPSILON, preview.quantity_reversed));
    statements.push(db.prepare(`UPDATE supplier_purchase_orders SET status='ordered',received_completed_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE supplier_purchase_order_id=? AND status='received'`).bind(id(preview.po_line.supplier_purchase_order_id)));
  }
  if (String(preview.item.source_type || '').toLowerCase() === 'supply') {
    statements.push(db.prepare(`UPDATE inventory_lot_policies SET reconcile_status=CASE WHEN ABS(?-COALESCE((SELECT SUM(COALESCE(quantity_remaining,0)) FROM inventory_purchase_lots WHERE site_item_inventory_id=?),0))<? THEN 'reconciled' ELSE 'blocked' END,last_reconciled_quantity=?,last_reconciled_at=CURRENT_TIMESTAMP,updated_by_user_id=?,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=?`).bind(preview.next_on_hand_quantity, id(preview.item.site_item_inventory_id), EPSILON, preview.next_on_hand_quantity, userId, id(preview.item.site_item_inventory_id)));
  }
  let result;
  try { result = await db.batch(statements); }
  catch (error) { throw fail('The receipt reversal transaction failed before it could be verified.', 409, 'inventory_receiving_reversal_transaction_failed', String(error?.message || error)); }
  const claimChanged = Number(result?.[indices.claim]?.meta?.changes || 0) === 1;
  const inventoryChanged = Number(result?.[indices.inventory]?.meta?.changes || 0) === 1;
  const lotChanged = Number(result?.[indices.lot]?.meta?.changes || 0) === 1;
  const poChanged = indices.po == null || Number(result?.[indices.po]?.meta?.changes || 0) === 1;
  if (!claimChanged || !inventoryChanged || !lotChanged || !poChanged) {
    await compensate(db, preview, result, indices, key).catch(() => null);
    throw fail('Inventory changed while the receipt reversal was posting. Any verified partial changes were compensated; refresh and review again.', 409, 'inventory_receiving_reversal_concurrent_change', { claimChanged, inventoryChanged, lotChanged, poChanged });
  }
  const reversal = await db.prepare(`SELECT * FROM inventory_receiving_reversals WHERE reversal_key=? LIMIT 1`).bind(key).first();
  return { idempotent_replay: false, reversal, preview };
}
