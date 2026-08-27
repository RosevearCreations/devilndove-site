import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";
import { requireAdminStepUp } from "../_lib/adminStepUp.js";
import { receiveInventoryItem } from "../_lib/inventoryReceiving.js";

function json(data, status = 200) { return jsonResponse(data, status); }
function normalizeResults(result) { return Array.isArray(result?.results) ? result.results : []; }
function positiveId(value) { const n = Number(value || 0); return Number.isInteger(n) && n > 0 ? n : 0; }
function number(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback; }
function clean(value, max = 1000) { return normalizeText(value).slice(0, max); }

async function loadOrderItems(db, poId) {
  return normalizeResults(await db.prepare(`
    SELECT supplier_purchase_order_item_id, supplier_purchase_order_id, site_item_inventory_id, item_name,
           source_type, external_key, quantity_ordered,
           COALESCE(quantity_received, 0) AS quantity_received,
           unit_cost_cents, line_total_cents,
           incoming_applied_at, received_at, created_at
    FROM supplier_purchase_order_items
    WHERE supplier_purchase_order_id = ?
    ORDER BY supplier_purchase_order_item_id ASC
  `).bind(poId).all().catch(() => ({ results: [] })));
}

async function loadDrafts(db) {
  const drafts = normalizeResults(await db.prepare(`
    SELECT spo.supplier_purchase_order_id, spo.supplier_name, spo.supplier_contact, spo.status,
           spo.notes, spo.total_estimated_cents, spo.created_at, spo.updated_at,
           COUNT(spoi.supplier_purchase_order_item_id) AS item_count,
           COALESCE(SUM(spoi.quantity_ordered), 0) AS total_quantity_ordered,
           COALESCE(SUM(COALESCE(spoi.quantity_received, 0)), 0) AS total_quantity_received
    FROM supplier_purchase_orders spo
    LEFT JOIN supplier_purchase_order_items spoi ON spoi.supplier_purchase_order_id = spo.supplier_purchase_order_id
    GROUP BY spo.supplier_purchase_order_id
    ORDER BY spo.created_at DESC, spo.supplier_purchase_order_id DESC
    LIMIT 50
  `).all().catch(() => ({ results: [] })));
  return drafts.map((row) => ({
    supplier_purchase_order_id: Number(row.supplier_purchase_order_id || 0),
    supplier_name: row.supplier_name || '',
    supplier_contact: row.supplier_contact || '',
    status: row.status || 'draft',
    notes: row.notes || '',
    total_estimated_cents: Number(row.total_estimated_cents || 0),
    item_count: Number(row.item_count || 0),
    total_quantity_ordered: Number(row.total_quantity_ordered || 0),
    total_quantity_received: Number(row.total_quantity_received || 0),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  }));
}

async function writeIncomingMovement(db, existing, item, nextIncoming, actorUserId, note) {
  await db.prepare(`
    INSERT INTO site_inventory_movements (
      site_item_inventory_id, source_type, external_key, item_name, movement_type,
      quantity_delta, previous_on_hand_quantity, new_on_hand_quantity,
      previous_reserved_quantity, new_reserved_quantity,
      previous_incoming_quantity, new_incoming_quantity,
      note, actor_user_id, created_at
    ) VALUES (?, ?, ?, ?, 'incoming', 0, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(
    Number(item.site_item_inventory_id || 0),
    existing.source_type || item.source_type || null,
    existing.external_key || item.external_key || null,
    existing.item_name || item.item_name || null,
    Number(existing.on_hand_quantity || 0),
    Number(existing.on_hand_quantity || 0),
    Number(existing.reserved_quantity || 0),
    Number(existing.reserved_quantity || 0),
    Number(existing.incoming_quantity || 0),
    Number(nextIncoming || 0),
    note || null,
    actorUserId || null
  ).run().catch(() => null);
}

async function applyOrderedQuantities(db, poId, actorUserId) {
  const items = await loadOrderItems(db, poId);
  for (const item of items) {
    if (!Number(item.site_item_inventory_id || 0) || item.incoming_applied_at) continue;
    const existing = await db.prepare(`SELECT * FROM site_item_inventory WHERE site_item_inventory_id = ? LIMIT 1`).bind(Number(item.site_item_inventory_id || 0)).first();
    if (!existing) continue;
    const orderedQty = Math.max(0, Number(item.quantity_ordered || 0));
    const nextIncoming = Math.max(0, Number(existing.incoming_quantity || 0)) + orderedQty;
    const result = await db.batch([
      db.prepare(`UPDATE site_item_inventory SET incoming_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE site_item_inventory_id = ? AND ABS(COALESCE(incoming_quantity,0)-?)<0.000001`).bind(nextIncoming, Number(item.site_item_inventory_id || 0), Number(existing.incoming_quantity || 0)),
      db.prepare(`UPDATE supplier_purchase_order_items SET incoming_applied_at = CURRENT_TIMESTAMP WHERE supplier_purchase_order_item_id = ? AND incoming_applied_at IS NULL`).bind(Number(item.supplier_purchase_order_item_id || 0))
    ]);
    const inventoryChanged = Number(result?.[0]?.meta?.changes || 0) === 1;
    const lineChanged = Number(result?.[1]?.meta?.changes || 0) === 1;
    if (!inventoryChanged || !lineChanged) throw new Error(`Purchase-order incoming quantity changed concurrently for ${item.item_name || item.supplier_purchase_order_item_id}. Reload and try again.`);
    await writeIncomingMovement(db, existing, item, nextIncoming, actorUserId, `Purchase order #${poId} marked ordered.`);
  }
  await db.prepare(`UPDATE supplier_purchase_orders SET ordered_applied_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE supplier_purchase_order_id = ?`).bind(poId).run().catch(() => null);
}

async function releaseCancelledIncoming(db, poId, actorUserId) {
  const items = await loadOrderItems(db, poId);
  for (const item of items) {
    if (!Number(item.site_item_inventory_id || 0) || !item.incoming_applied_at) continue;
    const openQty = Math.max(0, number(item.quantity_ordered, 0) - number(item.quantity_received, 0));
    if (openQty <= 0) continue;
    const existing = await db.prepare(`SELECT * FROM site_item_inventory WHERE site_item_inventory_id=? LIMIT 1`).bind(Number(item.site_item_inventory_id || 0)).first();
    if (!existing) continue;
    const clearQty = Math.min(openQty, Math.max(0, number(existing.incoming_quantity, 0)));
    if (clearQty <= 0) continue;
    const nextIncoming = Math.max(0, number(existing.incoming_quantity, 0) - clearQty);
    const changed = await db.prepare(`UPDATE site_item_inventory SET incoming_quantity=?,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=? AND ABS(COALESCE(incoming_quantity,0)-?)<0.000001`).bind(nextIncoming, Number(item.site_item_inventory_id || 0), number(existing.incoming_quantity,0)).run();
    if (Number(changed?.meta?.changes || 0) !== 1) throw new Error(`Purchase-order cancellation changed concurrently for ${item.item_name || item.supplier_purchase_order_item_id}. Reload and try again.`);
    await writeIncomingMovement(db, existing, item, nextIncoming, actorUserId, `Purchase order #${poId} cancelled; ${clearQty} incoming unit(s) released.`);
  }
}

function lineReceiveDetails(body, item) {
  const map = body && typeof body.receive_lots === 'object' && body.receive_lots ? body.receive_lots : {};
  return map[String(item.supplier_purchase_order_item_id || 0)] || {};
}

async function applyReceivedQuantities(db, po, actorUserId, body = {}) {
  const poId = Number(po.supplier_purchase_order_id || 0);
  const items = await loadOrderItems(db, poId);
  const receiveMap = body && typeof body.receive_quantities === 'object' && body.receive_quantities ? body.receive_quantities : null;
  const batchKey = clean(body.receive_batch_key, 80) || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const receipts = [];

  for (const item of items) {
    if (!positiveId(item.site_item_inventory_id)) continue;
    const orderedQty = Math.max(0, number(item.quantity_ordered, 0));
    const alreadyReceived = Math.max(0, number(item.quantity_received, 0));
    let receiveQty = Math.max(0, orderedQty - alreadyReceived);
    if (receiveMap && Object.prototype.hasOwnProperty.call(receiveMap, String(item.supplier_purchase_order_item_id || 0))) {
      receiveQty = Math.max(0, number(receiveMap[String(item.supplier_purchase_order_item_id || 0)], 0));
    }
    if (receiveQty <= 0) continue;
    const detail = lineReceiveDetails(body, item);
    const result = await receiveInventoryItem(db, {
      action: 'receive',
      receive_key: `po-${poId}-${item.supplier_purchase_order_item_id}-${batchKey}`.slice(0, 120),
      supplier_purchase_order_item_id: Number(item.supplier_purchase_order_item_id || 0),
      site_item_inventory_id: Number(item.site_item_inventory_id || 0),
      quantity_received: receiveQty,
      lot_code: clean(detail.lot_code, 120) || `PO-${poId}-LINE-${item.supplier_purchase_order_item_id}`,
      purchase_date: clean(detail.purchase_date, 20) || null,
      received_date: clean(detail.received_date, 20) || null,
      expiry_date: clean(detail.expiry_date, 20) || null,
      storage_location: clean(detail.storage_location, 180) || null,
      unit_cost_cents: Number(detail.unit_cost_cents || item.unit_cost_cents || 0),
      shipping_cost_cents: Number(detail.shipping_cost_cents || 0),
      tax_cost_cents: Number(detail.tax_cost_cents || 0),
      source_kind: clean(detail.source_kind, 40) || 'supplier',
      source_name: clean(detail.source_name, 220) || po.supplier_name || '',
      supplier_sku: clean(detail.supplier_sku, 180) || '',
      source_url: clean(detail.source_url, 1000) || '',
      source_reference: `Purchase order #${poId}`,
      make_preferred_source: Number(detail.make_preferred_source || 0) === 1 ? 1 : 0,
      verify_source: Number(detail.verify_source || 0) === 1 ? 1 : 0,
      notes: clean(detail.notes || body.note, 1000) || null,
    }, actorUserId);
    receipts.push(result);
  }

  const refreshed = await loadOrderItems(db, poId);
  const remaining = refreshed.reduce((sum, item) => sum + Math.max(0, number(item.quantity_ordered,0) - number(item.quantity_received,0)), 0);
  const finalStatus = remaining <= 0.000001 ? 'received' : 'ordered';
  await db.prepare(`UPDATE supplier_purchase_orders SET status=?,received_completed_at=CASE WHEN ?='received' THEN CURRENT_TIMESTAMP ELSE received_completed_at END,updated_at=CURRENT_TIMESTAMP WHERE supplier_purchase_order_id=?`).bind(finalStatus, finalStatus, poId).run();
  return { receipts, purchase_order_items: refreshed, remaining_quantity: remaining, final_status: finalStatus };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  return json({ ok: true, requested_by: adminUser, purchase_orders: await loadDrafts(db) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  let body = {};
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }

  const supplierName = normalizeText(body.supplier_name);
  const note = normalizeText(body.note).slice(0, 1000);
  const onlyReorderFlagged = Number(body.only_reorder_flagged) === 1 ? 1 : 0;
  const selectedIds = Array.isArray(body.site_item_inventory_ids) ? body.site_item_inventory_ids.map((v) => Number(v || 0)).filter((v) => v > 0) : [];

  const whereBits = [];
  const bindings = [];
  if (supplierName) { whereBits.push(`LOWER(COALESCE(supplier_name,'')) = ?`); bindings.push(supplierName.toLowerCase()); }
  if (selectedIds.length) { whereBits.push(`site_item_inventory_id IN (${selectedIds.map(() => '?').join(',')})`); bindings.push(...selectedIds); }
  if (onlyReorderFlagged) whereBits.push(`(COALESCE(is_on_reorder_list,0)=1 OR (COALESCE(on_hand_quantity,0) + COALESCE(incoming_quantity,0)) <= COALESCE(reorder_level,0))`);

  const rows = normalizeResults(await db.prepare(`
    SELECT * FROM site_item_inventory
    WHERE COALESCE(is_active,1)=1 AND COALESCE(do_not_reorder,0)=0
      ${whereBits.length ? `AND ${whereBits.join(' AND ')}` : ''}
    ORDER BY LOWER(COALESCE(supplier_name,'')) ASC, LOWER(COALESCE(item_name,'')) ASC
  `).bind(...bindings).all().catch(() => ({ results: [] })));
  if (!rows.length) return json({ ok: false, error: 'No eligible inventory items matched the purchase-order draft request.' }, 400);

  const grouped = new Map();
  for (const row of rows) {
    const key = normalizeText(row.supplier_name) || 'Unassigned Supplier';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }

  const created = [];
  for (const [groupName, items] of grouped.entries()) {
    const supplierContact = normalizeText(items.find((item) => normalizeText(item.supplier_contact))?.supplier_contact || '');
    const totalEstimated = items.reduce((sum, item) => {
      const suggestedQty = Math.max(1, Number(item.preferred_reorder_quantity || 0) || Math.max(1, Number(item.reorder_level || 0) - (Number(item.on_hand_quantity || 0) + Number(item.incoming_quantity || 0))));
      return sum + (suggestedQty * Number(item.unit_cost_cents || 0));
    }, 0);
    const insert = await db.prepare(`INSERT INTO supplier_purchase_orders(supplier_name,supplier_contact,status,notes,total_estimated_cents,created_by_user_id,created_at,updated_at) VALUES (?,?,'draft',?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`).bind(groupName, supplierContact || null, note || null, totalEstimated, Number(adminUser.user_id || 0)).run();
    const poId = Number(insert?.meta?.last_row_id || 0);
    for (const item of items) {
      const suggestedQty = Math.max(1, Number(item.preferred_reorder_quantity || 0) || Math.max(1, Number(item.reorder_level || 0) - (Number(item.on_hand_quantity || 0) + Number(item.incoming_quantity || 0))));
      const lineTotal = suggestedQty * Number(item.unit_cost_cents || 0);
      await db.prepare(`INSERT INTO supplier_purchase_order_items(supplier_purchase_order_id,site_item_inventory_id,item_name,source_type,external_key,quantity_ordered,quantity_received,unit_cost_cents,line_total_cents,created_at) VALUES (?,?,?,?,?,?,0,?,?,CURRENT_TIMESTAMP)`).bind(poId, Number(item.site_item_inventory_id || 0), item.item_name || '', item.source_type || '', item.external_key || '', suggestedQty, Number(item.unit_cost_cents || 0), lineTotal).run();
      await db.prepare(`UPDATE site_item_inventory SET last_reorder_requested_at=CURRENT_TIMESTAMP,is_on_reorder_list=1,updated_at=CURRENT_TIMESTAMP WHERE site_item_inventory_id=?`).bind(Number(item.site_item_inventory_id || 0)).run();
    }
    created.push({ supplier_purchase_order_id: poId, supplier_name: groupName, item_count: items.length, total_estimated_cents: totalEstimated });
  }

  await auditAdminAction(env, request, adminUser, { action_type: 'purchase_order_create', target_type: 'supplier_purchase_order', target_key: supplierName || 'grouped', details: { purchase_orders_created: created.length, inventory_item_count: rows.length, only_reorder_flagged: onlyReorderFlagged } });
  return json({ ok: true, message: 'Purchase-order drafts created.', created });
}

export async function onRequestPatch(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  let body = {};
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const poId = Number(body.supplier_purchase_order_id || 0);
  const requestedStatus = normalizeText(body.status).toLowerCase();
  if (!poId) return json({ ok: false, error: 'supplier_purchase_order_id is required.' }, 400);
  if (!['draft','submitted','ordered','received','cancelled'].includes(requestedStatus)) return json({ ok: false, error: 'status must be draft, submitted, ordered, received, or cancelled.' }, 400);
  if (['cancelled','received'].includes(requestedStatus)) {
    const stepUp = await requireAdminStepUp(request, env, adminUser, body, `${requestedStatus} purchase order`);
    if (!stepUp.ok) return stepUp.response;
  }
  const row = await db.prepare(`SELECT * FROM supplier_purchase_orders WHERE supplier_purchase_order_id=? LIMIT 1`).bind(poId).first();
  if (!row) return json({ ok: false, error: 'Purchase order not found.' }, 404);

  let finalStatus = requestedStatus;
  let receiveResult = null;
  try {
    if (requestedStatus === 'ordered' && row.status !== 'ordered' && row.status !== 'received') {
      await applyOrderedQuantities(db, poId, Number(adminUser.user_id || 0));
      await db.prepare(`UPDATE supplier_purchase_orders SET status='ordered',notes=COALESCE(?,notes),updated_at=CURRENT_TIMESTAMP WHERE supplier_purchase_order_id=?`).bind(normalizeText(body.note) || null, poId).run();
    } else if (requestedStatus === 'received' && row.status !== 'received') {
      receiveResult = await applyReceivedQuantities(db, row, Number(adminUser.user_id || 0), body);
      finalStatus = receiveResult.final_status;
    } else if (requestedStatus === 'cancelled') {
      await releaseCancelledIncoming(db, poId, Number(adminUser.user_id || 0));
      await db.prepare(`UPDATE supplier_purchase_orders SET status='cancelled',notes=COALESCE(?,notes),updated_at=CURRENT_TIMESTAMP WHERE supplier_purchase_order_id=?`).bind(normalizeText(body.note) || null, poId).run();
    } else {
      await db.prepare(`UPDATE supplier_purchase_orders SET status=?,notes=COALESCE(?,notes),updated_at=CURRENT_TIMESTAMP WHERE supplier_purchase_order_id=?`).bind(requestedStatus, normalizeText(body.note) || null, poId).run();
    }
  } catch (error) {
    return json({ ok: false, error: error?.message || 'Purchase order update failed safely.', error_code: error?.code || 'purchase_order_update_failed' }, Number(error?.status || 409));
  }

  await auditAdminAction(env, request, adminUser, { action_type: 'purchase_order_update', target_type: 'supplier_purchase_order', target_id: poId, target_key: row.supplier_name || String(poId), details: { previous_status: row.status || 'draft', requested_status: requestedStatus, final_status: finalStatus, receiving_claim_count: receiveResult?.receipts?.length || 0 } });
  return json({
    ok: true,
    message: requestedStatus === 'received' && finalStatus !== 'received' ? 'Partial shipment received. The purchase order remains ordered until all quantities arrive.' : 'Purchase order updated.',
    supplier_purchase_order_id: poId,
    status: finalStatus,
    purchase_order_items: receiveResult?.purchase_order_items || await loadOrderItems(db, poId),
    receiving: receiveResult,
  });
}
