// Build 221 — lot-level purchase history, reconciliation evidence and depletion preferences.
import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { ensureProductOffersSchema, normalizeRows } from '../_lib/productOffers.js';

function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function number(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) && n >= 0 ? n : fallback; }
function whole(value) { const n = Number(value); return Number.isInteger(n) && n > 0 ? n : 0; }
function text(value, max = 500) { return normalizeText(value).slice(0, max); }

async function access(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { error: json({ ok: false, error: 'Admin access required.' }, 401) };
  const db = getDb(context.env);
  if (!db) return { error: json({ ok: false, error: 'Database binding is not configured.' }, 500) };
  return { adminUser, db };
}

async function tableExists(db, tableName) {
  const row = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(tableName).first().catch(() => null);
  return Boolean(row?.name);
}

async function ensureLotControlSchema(db) {
  await ensureProductOffersSchema(db);
  const statements = [
    `CREATE TABLE IF NOT EXISTS inventory_lot_policies (
      site_item_inventory_id INTEGER PRIMARY KEY,
      depletion_method TEXT NOT NULL DEFAULT 'manual',
      reconcile_status TEXT NOT NULL DEFAULT 'needs_review',
      last_reconciled_quantity REAL,
      last_reconciled_at TEXT,
      updated_by_user_id INTEGER,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS inventory_lot_reconciliations (
      inventory_lot_reconciliation_id INTEGER PRIMARY KEY AUTOINCREMENT,
      site_item_inventory_id INTEGER NOT NULL,
      main_on_hand_quantity REAL NOT NULL DEFAULT 0,
      lot_remaining_quantity REAL NOT NULL DEFAULT 0,
      discrepancy_quantity REAL NOT NULL DEFAULT 0,
      applied_to_main_inventory INTEGER NOT NULL DEFAULT 0,
      previous_on_hand_quantity REAL,
      new_on_hand_quantity REAL,
      depletion_method TEXT NOT NULL DEFAULT 'manual',
      review_note TEXT NOT NULL,
      reviewed_by_user_id INTEGER,
      reviewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_inventory_lot_reconciliations_item ON inventory_lot_reconciliations(site_item_inventory_id, reviewed_at DESC)`
  ];
  for (const sql of statements) await db.prepare(sql).run();
}

async function load(db, itemId) {
  const item = await db.prepare(`SELECT site_item_inventory_id,item_name,source_type,external_key,on_hand_quantity,reserved_quantity,incoming_quantity,stock_unit_label,usage_unit_label,usage_units_per_stock_unit,unit_cost_cents,supplier_name,supplier_sku,amazon_url,source_url FROM site_item_inventory WHERE site_item_inventory_id=?`).bind(itemId).first();
  if (!item) return null;
  const lotResult = await db.prepare(`SELECT * FROM inventory_purchase_lots WHERE site_item_inventory_id=? ORDER BY COALESCE(purchase_date,received_date,created_at) DESC, inventory_purchase_lot_id DESC`).bind(itemId).all();
  const lots = normalizeRows(lotResult).map((row) => ({
    ...row,
    inventory_purchase_lot_id: Number(row.inventory_purchase_lot_id || 0),
    quantity_received: number(row.quantity_received),
    quantity_remaining: number(row.quantity_remaining),
    unit_cost_cents: number(row.unit_cost_cents),
    shipping_cost_cents: number(row.shipping_cost_cents),
    tax_cost_cents: number(row.tax_cost_cents)
  }));
  const lotRemaining = lots.reduce((sum, row) => sum + number(row.quantity_remaining), 0);
  const mainOnHand = number(item.on_hand_quantity);
  const policy = await db.prepare(`SELECT * FROM inventory_lot_policies WHERE site_item_inventory_id=?`).bind(itemId).first().catch(() => null) || {
    site_item_inventory_id: itemId,
    depletion_method: 'manual',
    reconcile_status: 'needs_review',
    last_reconciled_quantity: null,
    last_reconciled_at: null
  };
  const reconciliationResult = await db.prepare(`SELECT * FROM inventory_lot_reconciliations WHERE site_item_inventory_id=? ORDER BY reviewed_at DESC,inventory_lot_reconciliation_id DESC LIMIT 25`).bind(itemId).all().catch(() => ({ results: [] }));
  return {
    item,
    lots,
    policy,
    reconciliations: normalizeRows(reconciliationResult),
    summary: {
      lot_count: lots.length,
      available_lot_count: lots.filter((row) => row.lot_status === 'available' && row.quantity_remaining > 0).length,
      quantity_remaining: lotRemaining,
      main_on_hand_quantity: mainOnHand,
      discrepancy_quantity: Math.round((lotRemaining - mainOnHand) * 10000) / 10000,
      is_reconciled: Math.abs(lotRemaining - mainOnHand) < 0.0001 ? 1 : 0,
      total_purchase_value_cents: lots.reduce((sum, row) => sum + Math.round(number(row.quantity_received) * number(row.unit_cost_cents)), 0)
    }
  };
}

export async function onRequestGet(context) {
  const a = await access(context); if (a.error) return a.error;
  try {
    await ensureLotControlSchema(a.db);
    const itemId = whole(new URL(context.request.url).searchParams.get('site_item_inventory_id'));
    if (!itemId) return json({ ok: false, error: 'An inventory item is required.' }, 400);
    const detail = await load(a.db, itemId);
    if (!detail) return json({ ok: false, error: 'Inventory item not found.' }, 404);
    return json({ ok: true, build: '221', detail });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, { incident_scope: 'inventory_lots', incident_code: 'inventory_lots_get_failed', severity: 'error', message: error?.message || 'Inventory lots could not load.', related_user_id: a.adminUser.user_id, details: { error: String(error?.stack || error) } }).catch(() => null);
    return json({ ok: false, error: 'Inventory lots could not load.' }, 500);
  }
}

export async function onRequestPost(context) {
  const a = await access(context); if (a.error) return a.error;
  let body = {};
  try { body = await context.request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const action = text(body.action || 'save_lot', 60).toLowerCase();
  try {
    await ensureLotControlSchema(a.db);
    const itemId = whole(body.site_item_inventory_id);
    if (!itemId) throw new Error('An inventory item is required.');

    if (action === 'save_policy') {
      const method = ['manual', 'fifo', 'fefo'].includes(text(body.depletion_method, 20).toLowerCase()) ? text(body.depletion_method, 20).toLowerCase() : 'manual';
      const status = ['needs_review', 'reconciled', 'blocked'].includes(text(body.reconcile_status, 30).toLowerCase()) ? text(body.reconcile_status, 30).toLowerCase() : 'needs_review';
      await a.db.prepare(`INSERT INTO inventory_lot_policies (site_item_inventory_id,depletion_method,reconcile_status,updated_by_user_id,updated_at) VALUES (?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(site_item_inventory_id) DO UPDATE SET depletion_method=excluded.depletion_method,reconcile_status=excluded.reconcile_status,updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP`).bind(itemId, method, status, a.adminUser.user_id).run();
      const detail = await load(a.db, itemId);
      await auditAdminAction(context.env, context.request, a.adminUser, { action_type: 'inventory_lot_policy_update', target_type: 'site_item_inventory', target_id: itemId, target_key: detail?.item?.item_name || String(itemId), details: { depletion_method: method, reconcile_status: status } });
      return json({ ok: true, message: 'Lot depletion and reconciliation policy saved.', detail });
    }

    if (action === 'reconcile_lot_totals') {
      const reviewNote = text(body.review_note, 1000);
      if (reviewNote.length < 8) throw new Error('Enter a clear reconciliation note of at least 8 characters.');
      const before = await load(a.db, itemId);
      if (!before) throw new Error('Inventory item was not found.');
      const applyToMain = Number(body.apply_to_main_inventory || 0) === 1;
      if (applyToMain && text(body.confirmation_phrase, 80).toUpperCase() !== 'APPLY LOT TOTAL') throw new Error('Type APPLY LOT TOTAL exactly before changing the main on-hand quantity.');
      const previous = number(before.item.on_hand_quantity);
      const lotTotal = number(before.summary.quantity_remaining);
      const next = applyToMain ? lotTotal : previous;
      const method = ['manual', 'fifo', 'fefo'].includes(text(body.depletion_method, 20).toLowerCase()) ? text(body.depletion_method, 20).toLowerCase() : String(before.policy?.depletion_method || 'manual');
      const statements = [];
      if (applyToMain && Math.abs(next - previous) >= 0.0001) {
        statements.push(a.db.prepare(`UPDATE site_item_inventory SET on_hand_quantity=?,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=? AND on_hand_quantity=?`).bind(next, itemId, previous));
        if (await tableExists(a.db, 'site_inventory_movements')) {
          statements.push(a.db.prepare(`INSERT INTO site_inventory_movements (site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at) VALUES (?,?,?,?, 'adjustment',?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(itemId, before.item.source_type || null, before.item.external_key || null, before.item.item_name, next - previous, previous, next, number(before.item.reserved_quantity), number(before.item.reserved_quantity), number(before.item.incoming_quantity), number(before.item.incoming_quantity), `Reviewed purchase-lot reconciliation. ${reviewNote}`, a.adminUser.user_id));
        }
      }
      statements.push(a.db.prepare(`INSERT INTO inventory_lot_reconciliations (site_item_inventory_id,main_on_hand_quantity,lot_remaining_quantity,discrepancy_quantity,applied_to_main_inventory,previous_on_hand_quantity,new_on_hand_quantity,depletion_method,review_note,reviewed_by_user_id,reviewed_at) VALUES (?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)`).bind(itemId, previous, lotTotal, lotTotal - previous, applyToMain ? 1 : 0, previous, next, method, reviewNote, a.adminUser.user_id));
      statements.push(a.db.prepare(`INSERT INTO inventory_lot_policies (site_item_inventory_id,depletion_method,reconcile_status,last_reconciled_quantity,last_reconciled_at,updated_by_user_id,updated_at) VALUES (?,?,'reconciled',?,CURRENT_TIMESTAMP,?,CURRENT_TIMESTAMP) ON CONFLICT(site_item_inventory_id) DO UPDATE SET depletion_method=excluded.depletion_method,reconcile_status='reconciled',last_reconciled_quantity=excluded.last_reconciled_quantity,last_reconciled_at=CURRENT_TIMESTAMP,updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP`).bind(itemId, method, lotTotal, a.adminUser.user_id));
      if (typeof a.db.batch === 'function') await a.db.batch(statements); else for (const statement of statements) await statement.run();
      const detail = await load(a.db, itemId);
      await auditAdminAction(context.env, context.request, a.adminUser, { action_type: applyToMain ? 'inventory_lot_reconcile_apply' : 'inventory_lot_reconcile_review', target_type: 'site_item_inventory', target_id: itemId, target_key: detail?.item?.item_name || String(itemId), details: { previous_on_hand_quantity: previous, lot_remaining_quantity: lotTotal, new_on_hand_quantity: next, applied_to_main_inventory: applyToMain, depletion_method: method, review_note: reviewNote } });
      return json({ ok: true, message: applyToMain ? 'Lot total was reviewed and applied to the main on-hand quantity.' : 'Lot totals were reviewed and recorded without changing main inventory.', detail });
    }

    const lotId = whole(body.inventory_purchase_lot_id);
    const lotCode = text(body.lot_code, 120);
    if (!lotCode) throw new Error('A lot or batch code is required.');
    const quantityReceived = number(body.quantity_received);
    const quantityRemaining = Math.min(quantityReceived, number(body.quantity_remaining, quantityReceived));
    const fields = [
      itemId, lotCode, text(body.purchase_date, 20) || null, text(body.received_date, 20) || null,
      text(body.supplier_name, 180) || null, text(body.supplier_order_number, 180) || null,
      text(body.supplier_sku, 180) || null, text(body.asin, 40) || null, text(body.source_url, 1000) || null,
      quantityReceived, quantityRemaining, Math.round(number(body.unit_cost_cents)), Math.round(number(body.shipping_cost_cents)),
      Math.round(number(body.tax_cost_cents)), text(body.expiry_date, 20) || null, text(body.storage_location, 180) || null,
      ['available', 'consumed', 'expired', 'quarantined', 'returned'].includes(text(body.lot_status, 30)) ? text(body.lot_status, 30) : 'available',
      text(body.notes, 1000) || null, a.adminUser.user_id
    ];
    if (lotId) {
      await a.db.prepare(`UPDATE inventory_purchase_lots SET lot_code=?2,purchase_date=?3,received_date=?4,supplier_name=?5,supplier_order_number=?6,supplier_sku=?7,asin=?8,source_url=?9,quantity_received=?10,quantity_remaining=?11,unit_cost_cents=?12,shipping_cost_cents=?13,tax_cost_cents=?14,expiry_date=?15,storage_location=?16,lot_status=?17,notes=?18,updated_at=CURRENT_TIMESTAMP WHERE inventory_purchase_lot_id=?1 AND site_item_inventory_id=?19`).bind(lotId, ...fields.slice(1, 18), itemId).run();
    } else {
      await a.db.prepare(`INSERT INTO inventory_purchase_lots (site_item_inventory_id,lot_code,purchase_date,received_date,supplier_name,supplier_order_number,supplier_sku,asin,source_url,quantity_received,quantity_remaining,unit_cost_cents,shipping_cost_cents,tax_cost_cents,expiry_date,storage_location,lot_status,notes,created_by_user_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(...fields).run();
    }
    await a.db.prepare(`INSERT INTO inventory_lot_policies (site_item_inventory_id,reconcile_status,updated_by_user_id,updated_at) VALUES (?,'needs_review',?,CURRENT_TIMESTAMP) ON CONFLICT(site_item_inventory_id) DO UPDATE SET reconcile_status='needs_review',updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP`).bind(itemId, a.adminUser.user_id).run();
    const detail = await load(a.db, itemId);
    await auditAdminAction(context.env, context.request, a.adminUser, { action_type: lotId ? 'inventory_lot_update' : 'inventory_lot_create', target_type: 'site_item_inventory', target_id: itemId, target_key: detail?.item?.item_name || String(itemId), details: { lot_code: lotCode, quantity_received: quantityReceived, quantity_remaining: quantityRemaining } });
    return json({ ok: true, message: lotId ? 'Purchase lot updated.' : 'Purchase lot added.', detail });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, { incident_scope: 'inventory_lots', incident_code: 'inventory_lots_post_failed', severity: 'warning', message: error?.message || 'Inventory lot could not be saved.', related_user_id: a.adminUser.user_id, details: { action, error: String(error?.stack || error) } }).catch(() => null);
    return json({ ok: false, error: error?.message || 'Inventory lot could not be saved.' }, 400);
  }
}

export async function onRequestDelete(context) {
  const a = await access(context); if (a.error) return a.error;
  try {
    await ensureLotControlSchema(a.db);
    const lotId = whole(new URL(context.request.url).searchParams.get('inventory_purchase_lot_id'));
    if (!lotId) return json({ ok: false, error: 'A purchase lot is required.' }, 400);
    const existing = await a.db.prepare(`SELECT * FROM inventory_purchase_lots WHERE inventory_purchase_lot_id=?`).bind(lotId).first();
    if (!existing) return json({ ok: false, error: 'Purchase lot not found.' }, 404);
    await a.db.batch([
      a.db.prepare(`DELETE FROM inventory_purchase_lots WHERE inventory_purchase_lot_id=?`).bind(lotId),
      a.db.prepare(`INSERT INTO inventory_lot_policies (site_item_inventory_id,reconcile_status,updated_by_user_id,updated_at) VALUES (?,'needs_review',?,CURRENT_TIMESTAMP) ON CONFLICT(site_item_inventory_id) DO UPDATE SET reconcile_status='needs_review',updated_by_user_id=excluded.updated_by_user_id,updated_at=CURRENT_TIMESTAMP`).bind(Number(existing.site_item_inventory_id || 0), a.adminUser.user_id)
    ]);
    await auditAdminAction(context.env, context.request, a.adminUser, { action_type: 'inventory_lot_delete', target_type: 'site_item_inventory', target_id: Number(existing.site_item_inventory_id || 0), target_key: existing.lot_code || String(lotId), details: { quantity_remaining: number(existing.quantity_remaining) } });
    return json({ ok: true, message: 'Purchase lot removed. Reconciliation is marked for review.' });
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Purchase lot could not be removed.' }, 400);
  }
}
