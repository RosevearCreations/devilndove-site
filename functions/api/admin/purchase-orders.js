import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";
import { requireAdminStepUp } from "../_lib/adminStepUp.js";

function json(data, status = 200) { return jsonResponse(data, status); }
function normalizeResults(result) { return Array.isArray(result?.results) ? result.results : []; }

async function loadDrafts(db) {
  const drafts = normalizeResults(await db.prepare(`
    SELECT spo.supplier_purchase_order_id, spo.supplier_name, spo.supplier_contact, spo.status,
           spo.notes, spo.total_estimated_cents, spo.created_at, spo.updated_at,
           COUNT(spoi.supplier_purchase_order_item_id) AS item_count
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
    created_at: row.created_at || null,
    updated_at: row.updated_at || null
  }));
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const drafts = await loadDrafts(db);
  return json({ ok: true, requested_by: adminUser, purchase_orders: drafts });
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
  if (supplierName) {
    whereBits.push(`LOWER(COALESCE(supplier_name,'')) = ?`);
    bindings.push(supplierName.toLowerCase());
  }
  if (selectedIds.length) {
    whereBits.push(`site_item_inventory_id IN (${selectedIds.map(() => '?').join(',')})`);
    bindings.push(...selectedIds);
  }
  if (onlyReorderFlagged) {
    whereBits.push(`(COALESCE(is_on_reorder_list,0)=1 OR (COALESCE(on_hand_quantity,0) + COALESCE(incoming_quantity,0)) <= COALESCE(reorder_level,0))`);
  }
  const rows = normalizeResults(await db.prepare(`
    SELECT *
    FROM site_item_inventory
    WHERE COALESCE(is_active,1)=1
      AND COALESCE(do_not_reorder,0)=0
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
    const insert = await db.prepare(`
      INSERT INTO supplier_purchase_orders (
        supplier_name, supplier_contact, status, notes, total_estimated_cents, created_by_user_id, created_at, updated_at
      ) VALUES (?, ?, 'draft', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(groupName, supplierContact || null, note || null, totalEstimated, Number(adminUser.user_id || 0)).run();
    const poId = Number(insert?.meta?.last_row_id || 0);

    for (const item of items) {
      const suggestedQty = Math.max(1, Number(item.preferred_reorder_quantity || 0) || Math.max(1, Number(item.reorder_level || 0) - (Number(item.on_hand_quantity || 0) + Number(item.incoming_quantity || 0))));
      const lineTotal = suggestedQty * Number(item.unit_cost_cents || 0);
      await db.prepare(`
        INSERT INTO supplier_purchase_order_items (
          supplier_purchase_order_id, site_item_inventory_id, item_name, source_type, external_key,
          quantity_ordered, unit_cost_cents, line_total_cents, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(poId, Number(item.site_item_inventory_id || 0), item.item_name || '', item.source_type || '', item.external_key || '', suggestedQty, Number(item.unit_cost_cents || 0), lineTotal).run();

      await db.prepare(`
        UPDATE site_item_inventory
        SET last_reorder_requested_at = CURRENT_TIMESTAMP,
            is_on_reorder_list = 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE site_item_inventory_id = ?
      `).bind(Number(item.site_item_inventory_id || 0)).run();
    }

    created.push({ supplier_purchase_order_id: poId, supplier_name: groupName, item_count: items.length, total_estimated_cents: totalEstimated });
  }

  await auditAdminAction(env, request, adminUser, {
    action_type: 'purchase_order_create',
    target_type: 'supplier_purchase_order',
    target_key: supplierName || 'grouped',
    details: { purchase_orders_created: created.length, inventory_item_count: rows.length, only_reorder_flagged: onlyReorderFlagged }
  });

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
  const status = normalizeText(body.status).toLowerCase();
  if (!poId) return json({ ok: false, error: 'supplier_purchase_order_id is required.' }, 400);
  if (!['draft','submitted','ordered','received','cancelled'].includes(status)) return json({ ok: false, error: 'status must be draft, submitted, ordered, received, or cancelled.' }, 400);
  if (['cancelled','received'].includes(status)) {
    const stepUp = await requireAdminStepUp(request, env, adminUser, body, `${status} purchase order`);
    if (!stepUp.ok) return stepUp.response;
  }
  const row = await db.prepare(`SELECT * FROM supplier_purchase_orders WHERE supplier_purchase_order_id = ? LIMIT 1`).bind(poId).first();
  if (!row) return json({ ok: false, error: 'Purchase order not found.' }, 404);
  await db.prepare(`UPDATE supplier_purchase_orders SET status = ?, notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP WHERE supplier_purchase_order_id = ?`).bind(status, normalizeText(body.note) || null, poId).run();
  await auditAdminAction(env, request, adminUser, { action_type: 'purchase_order_update', target_type: 'supplier_purchase_order', target_id: poId, target_key: row.supplier_name || String(poId), details: { previous_status: row.status || 'draft', new_status: status } });
  return json({ ok: true, message: 'Purchase order updated.', supplier_purchase_order_id: poId, status });
}
