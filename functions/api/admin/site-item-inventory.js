import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";

function json(data, status = 200) { return jsonResponse(data, status); }
function normalizeResults(result) { return Array.isArray(result?.results) ? result.results : []; }

function shape(row = {}) {
  const onHand = Number(row.on_hand_quantity || 0);
  const reserved = Number(row.reserved_quantity || 0);
  const incoming = Number(row.incoming_quantity || 0);
  const reorder = Number(row.reorder_level || 0);
  return {
    site_item_inventory_id: Number(row.site_item_inventory_id || 0),
    source_type: row.source_type || '',
    external_key: row.external_key || '',
    item_name: row.item_name || '',
    category: row.category || '',
    source_url: row.source_url || '',
    amazon_url: row.amazon_url || '',
    image_url: row.image_url || '',
    on_hand_quantity: onHand,
    reserved_quantity: reserved,
    incoming_quantity: incoming,
    available_quantity: Math.max(0, onHand - reserved),
    reorder_level: reorder,
    unit_cost_cents: Number(row.unit_cost_cents || 0),
    supplier_name: row.supplier_name || '',
    supplier_sku: row.supplier_sku || '',
    supplier_contact: row.supplier_contact || '',
    reorder_notes: row.reorder_notes || '',
    preferred_reorder_quantity: Number(row.preferred_reorder_quantity || 0),
    is_on_reorder_list: Number(row.is_on_reorder_list || 0),
    do_not_reorder: Number(row.do_not_reorder || 0),
    do_not_reuse: Number(row.do_not_reuse || 0),
    reuse_status: row.reuse_status || '',
    reservation_notes: row.reservation_notes || '',
    last_reorder_requested_at: row.last_reorder_requested_at || null,
    last_counted_at: row.last_counted_at || null,
    needs_reorder: reorder > 0 && (onHand + incoming) <= reorder ? 1 : 0,
    is_active: Number(row.is_active || 0),
    linked_product_count: Number(row.linked_product_count || 0),
    linked_product_names: row.linked_product_names || '',
    updated_at: row.updated_at || null
  };
}

async function logMovement(db, payload = {}) {
  await db.prepare(`
    INSERT INTO site_inventory_movements (
      site_item_inventory_id, source_type, external_key, item_name, movement_type,
      quantity_delta, previous_on_hand_quantity, new_on_hand_quantity,
      previous_reserved_quantity, new_reserved_quantity,
      previous_incoming_quantity, new_incoming_quantity,
      note, actor_user_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(
    payload.site_item_inventory_id || null,
    payload.source_type || null,
    payload.external_key || null,
    payload.item_name || null,
    payload.movement_type || 'adjustment',
    Number(payload.quantity_delta || 0),
    Number(payload.previous_on_hand_quantity || 0),
    Number(payload.new_on_hand_quantity || 0),
    Number(payload.previous_reserved_quantity || 0),
    Number(payload.new_reserved_quantity || 0),
    Number(payload.previous_incoming_quantity || 0),
    Number(payload.new_incoming_quantity || 0),
    payload.note || null,
    payload.actor_user_id || null
  ).run().catch(() => null);
}

async function getItems(db, { q = '', stockView = '', includeHistory = false } = {}) {
  const like = `%${q}%`;
  const items = normalizeResults(await db.prepare(`
    SELECT sii.*, 
           COUNT(DISTINCT prl.product_id) AS linked_product_count,
           GROUP_CONCAT(DISTINCT p.name) AS linked_product_names
    FROM site_item_inventory sii
    LEFT JOIN product_resource_links prl
      ON prl.resource_kind = sii.source_type AND prl.source_key = sii.external_key
    LEFT JOIN products p ON p.product_id = prl.product_id
    WHERE (? = ''
       OR LOWER(COALESCE(sii.item_name, '')) LIKE ?
       OR LOWER(COALESCE(sii.category, '')) LIKE ?
       OR LOWER(COALESCE(sii.supplier_name, '')) LIKE ?
       OR LOWER(COALESCE(sii.supplier_sku, '')) LIKE ?)
      AND (
        ? = '' OR
        (? = 'low' AND (COALESCE(sii.on_hand_quantity,0) + COALESCE(sii.incoming_quantity,0)) <= COALESCE(sii.reorder_level,0)) OR
        (? = 'reorder' AND COALESCE(sii.is_on_reorder_list,0) = 1) OR
        (? = 'no_reuse' AND COALESCE(sii.do_not_reuse,0) = 1) OR
        (? = 'inactive' AND COALESCE(sii.is_active,1) = 0)
      )
    GROUP BY sii.site_item_inventory_id
    ORDER BY LOWER(COALESCE(sii.item_name, '')) ASC
  `).bind(q, like, like, like, like, stockView, stockView, stockView, stockView, stockView).all().catch(() => ({ results: [] })));

  const summary = {
    total_items: items.length,
    active_items: items.filter((row) => Number(row.is_active || 1) === 1).length,
    low_stock_items: items.filter((row) => (Number(row.on_hand_quantity || 0) + Number(row.incoming_quantity || 0)) <= Number(row.reorder_level || 0)).length,
    total_reserved: items.reduce((sum, row) => sum + Number(row.reserved_quantity || 0), 0),
    total_incoming: items.reduce((sum, row) => sum + Number(row.incoming_quantity || 0), 0),
    reorder_list_items: items.filter((row) => Number(row.is_on_reorder_list || 0) === 1).length
  };

  const movements = includeHistory ? normalizeResults(await db.prepare(`
    SELECT site_inventory_movement_id, site_item_inventory_id, source_type, external_key, item_name, movement_type,
           quantity_delta, previous_on_hand_quantity, new_on_hand_quantity,
           previous_reserved_quantity, new_reserved_quantity,
           previous_incoming_quantity, new_incoming_quantity, note, created_at
    FROM site_inventory_movements
    ORDER BY created_at DESC, site_inventory_movement_id DESC
    LIMIT 50
  `).all().catch(() => ({ results: [] }))) : [];

  const supplier_reorder_groups = items
    .filter((row) => Number(row.do_not_reorder || 0) !== 1)
    .filter((row) => Number(row.is_on_reorder_list || 0) === 1 || ((Number(row.on_hand_quantity || 0) + Number(row.incoming_quantity || 0)) <= Number(row.reorder_level || 0)))
    .reduce((acc, row) => {
      const key = normalizeText(row.supplier_name) || 'Unassigned Supplier';
      if (!acc[key]) acc[key] = { supplier_name: key, supplier_contact: row.supplier_contact || '', item_count: 0, estimated_total_cents: 0, items: [] };
      const suggested_quantity = Math.max(1, Number(row.preferred_reorder_quantity || 0) || Math.max(1, Number(row.reorder_level || 0) - (Number(row.on_hand_quantity || 0) + Number(row.incoming_quantity || 0))));
      acc[key].item_count += 1;
      acc[key].estimated_total_cents += suggested_quantity * Number(row.unit_cost_cents || 0);
      acc[key].items.push({ site_item_inventory_id: Number(row.site_item_inventory_id || 0), item_name: row.item_name || '', suggested_quantity, unit_cost_cents: Number(row.unit_cost_cents || 0) });
      return acc;
    }, {});

  return { items: items.map(shape), summary, movements, supplier_reorder_groups: Object.values(supplier_reorder_groups) };
}


async function adjustProductResourceReservations(db, { productId = 0, quantityMultiplier = 1, release = false, note = '', actorUserId = null } = {}) {
  const links = normalizeResults(await db.prepare(`
    SELECT prl.product_resource_link_id, prl.resource_kind, prl.source_key, COALESCE(prl.quantity_used, 0) AS quantity_used,
           sii.site_item_inventory_id, sii.item_name, sii.source_type, sii.external_key,
           COALESCE(sii.on_hand_quantity, 0) AS on_hand_quantity,
           COALESCE(sii.reserved_quantity, 0) AS reserved_quantity,
           COALESCE(sii.incoming_quantity, 0) AS incoming_quantity,
           COALESCE(sii.reservation_notes, '') AS reservation_notes
    FROM product_resource_links prl
    LEFT JOIN site_item_inventory sii
      ON sii.source_type = prl.resource_kind AND sii.external_key = prl.source_key
    WHERE prl.product_id = ?
    ORDER BY prl.sort_order ASC, prl.product_resource_link_id ASC
  `).bind(productId).all().catch(() => ({ results: [] })));

  const results = [];
  for (const link of links) {
    const requiredQty = Math.max(0, Number(link.quantity_used || 0) * Math.max(1, Number(quantityMultiplier || 1)));
    if (!Number(link.site_item_inventory_id || 0) || requiredQty <= 0) {
      results.push({
        resource_kind: link.resource_kind || '',
        source_key: link.source_key || '',
        item_name: link.item_name || link.source_key || '',
        required_quantity: requiredQty,
        applied_quantity: 0,
        available_before: 0,
        shortage_quantity: requiredQty,
        missing_inventory_link: 1
      });
      continue;
    }
    const previousReserved = Number(link.reserved_quantity || 0);
    const previousOnHand = Number(link.on_hand_quantity || 0);
    const previousIncoming = Number(link.incoming_quantity || 0);
    const availableBefore = Math.max(0, previousOnHand - previousReserved);
    const appliedQuantity = release ? Math.min(previousReserved, requiredQty) : requiredQty;
    const nextReserved = release ? Math.max(0, previousReserved - requiredQty) : previousReserved + requiredQty;
    const shortageQuantity = release ? 0 : Math.max(0, requiredQty - availableBefore);
    const reservationNote = [normalizeText(note), `product:${productId}`, release ? 'release_product_resources' : 'reserve_product_resources'].filter(Boolean).join(' | ');

    await db.prepare(`
      UPDATE site_item_inventory
      SET reserved_quantity = ?,
          reservation_notes = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE site_item_inventory_id = ?
    `).bind(nextReserved, reservationNote || null, Number(link.site_item_inventory_id || 0)).run();

    await logMovement(db, {
      site_item_inventory_id: Number(link.site_item_inventory_id || 0),
      source_type: link.source_type || link.resource_kind || '',
      external_key: link.external_key || link.source_key || '',
      item_name: link.item_name || link.source_key || '',
      movement_type: release ? 'release' : 'reserve',
      quantity_delta: release ? -appliedQuantity : appliedQuantity,
      previous_on_hand_quantity: previousOnHand,
      new_on_hand_quantity: previousOnHand,
      previous_reserved_quantity: previousReserved,
      new_reserved_quantity: nextReserved,
      previous_incoming_quantity: previousIncoming,
      new_incoming_quantity: previousIncoming,
      note: reservationNote || (release ? 'Product resource release recorded.' : 'Product resource reservation recorded.'),
      actor_user_id: actorUserId
    });

    results.push({
      resource_kind: link.resource_kind || '',
      source_key: link.source_key || '',
      item_name: link.item_name || link.source_key || '',
      required_quantity: requiredQty,
      applied_quantity: appliedQuantity,
      available_before: availableBefore,
      shortage_quantity: shortageQuantity,
      missing_inventory_link: 0,
      site_item_inventory_id: Number(link.site_item_inventory_id || 0)
    });
  }
  return results;
}

async function syncCatalog(db, sourceTypes = []) {
  const rows = normalizeResults(await db.prepare(`
    SELECT item_kind, source_key, name, category, image_url, notes, quantity_on_hand, reorder_point, amazon_url, source_record_json
    FROM catalog_items
    WHERE item_kind IN (${sourceTypes.map(() => '?').join(',')})
  `).bind(...sourceTypes).all().catch(() => ({ results: [] })));
  let synced = 0;
  for (const row of rows) {
    const existing = await db.prepare(`SELECT site_item_inventory_id FROM site_item_inventory WHERE source_type = ? AND external_key = ? LIMIT 1`).bind(row.item_kind, row.source_key).first();
    if (existing) {
      await db.prepare(`
        UPDATE site_item_inventory
        SET item_name = COALESCE(NULLIF(?, ''), item_name),
            category = COALESCE(NULLIF(?, ''), category),
            image_url = COALESCE(NULLIF(?, ''), image_url),
            amazon_url = COALESCE(NULLIF(?, ''), amazon_url),
            reorder_level = CASE WHEN COALESCE(reorder_level,0) = 0 THEN COALESCE(?, reorder_level) ELSE reorder_level END,
            updated_at = CURRENT_TIMESTAMP
        WHERE site_item_inventory_id = ?
      `).bind(row.name || '', row.category || '', row.image_url || '', row.amazon_url || '', Number(row.reorder_point || 0), Number(existing.site_item_inventory_id || 0)).run();
    } else {
      await db.prepare(`
        INSERT INTO site_item_inventory (
          source_type, external_key, item_name, category, image_url, amazon_url,
          on_hand_quantity, reorder_level, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(row.item_kind, row.source_key, row.name || row.source_key, row.category || null, row.image_url || null, row.amazon_url || null, Number(row.quantity_on_hand || 0), Number(row.reorder_point || 0)).run();
    }
    synced += 1;
  }
  return synced;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const url = new URL(request.url);
  const q = normalizeText(url.searchParams.get('q')).toLowerCase();
  const stockView = normalizeText(url.searchParams.get('stock_view')).toLowerCase();
  const includeHistory = Number(url.searchParams.get('include_history') || 0) === 1;
  const data = await getItems(db, { q, stockView, includeHistory });
  return json({ ok: true, requested_by: adminUser, ...data });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  let body = {};
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }

  const action = normalizeText(body.action).toLowerCase();
  if (action === 'reserve_product_resources' || action === 'release_product_resources') {
    const productId = Number(body.product_id || 0);
    const quantityMultiplier = Math.max(1, Number(body.quantity_multiplier || 1));
    if (!productId) return json({ ok: false, error: 'product_id is required for product resource reservations.' }, 400);
    const product = await db.prepare(`SELECT product_id, slug, name FROM products WHERE product_id = ? LIMIT 1`).bind(productId).first();
    if (!product) return json({ ok: false, error: 'Product not found.' }, 404);
    const reservationRows = await adjustProductResourceReservations(db, {
      productId,
      quantityMultiplier,
      release: action === 'release_product_resources',
      note: normalizeText(body.note) || '',
      actorUserId: adminUser.user_id
    });
    await auditAdminAction(env, request, adminUser, {
      action_type: `inventory_${action}`,
      target_type: 'product',
      target_id: productId,
      target_key: `${product.slug || product.name || productId}`,
      details: {
        quantity_multiplier: quantityMultiplier,
        affected_items: reservationRows.length,
        shortages: reservationRows.filter((row) => Number(row.shortage_quantity || 0) > 0).length
      }
    });
    return json({
      ok: true,
      action,
      product: { product_id: Number(product.product_id || 0), slug: product.slug || '', name: product.name || '' },
      summary: {
        affected_items: reservationRows.length,
        total_required_quantity: reservationRows.reduce((sum, row) => sum + Number(row.required_quantity || 0), 0),
        total_applied_quantity: reservationRows.reduce((sum, row) => sum + Number(row.applied_quantity || 0), 0),
        shortage_item_count: reservationRows.filter((row) => Number(row.shortage_quantity || 0) > 0).length
      },
      reservations: reservationRows
    });
  }

  if (action === 'sync_catalog') {
    const sourceTypes = Array.isArray(body.source_types) && body.source_types.length ? body.source_types.map((value) => String(value || '').trim()).filter(Boolean) : ['tool', 'supply'];
    const synced = await syncCatalog(db, sourceTypes);
    await auditAdminAction(env, request, adminUser, { action_type: 'inventory_sync_catalog', target_type: 'inventory', target_key: sourceTypes.join(','), details: { synced } });
    return json({ ok: true, synced, source_types: sourceTypes });
  }

  const inventoryId = Number(body.site_item_inventory_id || 0);
  if (action && inventoryId > 0) {
    const existing = await db.prepare(`SELECT * FROM site_item_inventory WHERE site_item_inventory_id = ? LIMIT 1`).bind(inventoryId).first();
    if (!existing) return json({ ok: false, error: 'Inventory item not found.' }, 404);
    const qty = Math.max(0, Number(body.quantity || 0));
    let nextOnHand = Number(existing.on_hand_quantity || 0);
    let nextReserved = Number(existing.reserved_quantity || 0);
    let nextIncoming = Number(existing.incoming_quantity || 0);
    let movementType = 'adjustment';
    if (action === 'reserve') { nextReserved += qty; movementType = 'reserve'; }
    else if (action === 'release') { nextReserved = Math.max(0, nextReserved - qty); movementType = 'release'; }
    else if (action === 'receive') { nextIncoming = Math.max(0, nextIncoming - qty); nextOnHand += qty; movementType = 'incoming'; }
    else if (action === 'reorder_request') { movementType = 'adjustment'; }
    else return json({ ok: false, error: 'Unsupported inventory action.' }, 400);

    await db.prepare(`
      UPDATE site_item_inventory
      SET reserved_quantity = ?, incoming_quantity = ?, on_hand_quantity = ?,
          is_on_reorder_list = CASE WHEN ? = 'reorder_request' THEN 1 ELSE is_on_reorder_list END,
          last_reorder_requested_at = CASE WHEN ? = 'reorder_request' THEN CURRENT_TIMESTAMP ELSE last_reorder_requested_at END,
          reservation_notes = CASE WHEN ? IN ('reserve','release') THEN ? ELSE reservation_notes END,
          last_counted_at = CASE WHEN ? = 'receive' THEN CURRENT_TIMESTAMP ELSE last_counted_at END,
          updated_at = CURRENT_TIMESTAMP
      WHERE site_item_inventory_id = ?
    `).bind(nextReserved, nextIncoming, nextOnHand, action, action, action, normalizeText(body.note) || null, action, inventoryId).run();

    await logMovement(db, {
      site_item_inventory_id: inventoryId,
      source_type: existing.source_type,
      external_key: existing.external_key,
      item_name: existing.item_name,
      movement_type: movementType,
      quantity_delta: action === 'release' ? -qty : qty,
      previous_on_hand_quantity: Number(existing.on_hand_quantity || 0),
      new_on_hand_quantity: nextOnHand,
      previous_reserved_quantity: Number(existing.reserved_quantity || 0),
      new_reserved_quantity: nextReserved,
      previous_incoming_quantity: Number(existing.incoming_quantity || 0),
      new_incoming_quantity: nextIncoming,
      note: normalizeText(body.note) || `${action} recorded.`,
      actor_user_id: adminUser.user_id
    });

    await auditAdminAction(env, request, adminUser, { action_type: `inventory_${action}`, target_type: 'inventory_item', target_id: inventoryId, target_key: `${existing.source_type}:${existing.external_key}`, details: { quantity: qty } });
    const saved = await db.prepare(`SELECT * FROM site_item_inventory WHERE site_item_inventory_id = ? LIMIT 1`).bind(inventoryId).first();
    return json({ ok: true, item: shape(saved || {}) });
  }

  const itemName = normalizeText(body.item_name);
  const sourceType = normalizeText(body.source_type || 'other').toLowerCase();
  const externalKey = normalizeText(body.external_key || crypto.randomUUID());
  if (!itemName) return json({ ok: false, error: 'item_name is required.' }, 400);
  const existing = await db.prepare(`SELECT site_item_inventory_id FROM site_item_inventory WHERE source_type = ? AND external_key = ? LIMIT 1`).bind(sourceType, externalKey).first();
  if (existing) return json({ ok: false, error: 'That source type / external key already exists.' }, 409);

  const insert = await db.prepare(`
    INSERT INTO site_item_inventory (
      source_type, external_key, item_name, category, source_url, amazon_url, image_url,
      on_hand_quantity, reserved_quantity, incoming_quantity, reorder_level, unit_cost_cents,
      supplier_name, supplier_sku, supplier_contact, reorder_notes, preferred_reorder_quantity,
      is_on_reorder_list, do_not_reorder, do_not_reuse, reuse_status, reservation_notes,
      is_active, last_counted_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    sourceType,
    externalKey,
    itemName,
    normalizeText(body.category) || null,
    normalizeText(body.source_url) || null,
    normalizeText(body.amazon_url) || null,
    normalizeText(body.image_url) || null,
    Number(body.on_hand_quantity || 0),
    Number(body.reserved_quantity || 0),
    Number(body.incoming_quantity || 0),
    Number(body.reorder_level || 0),
    Number(body.unit_cost_cents || 0),
    normalizeText(body.supplier_name) || null,
    normalizeText(body.supplier_sku) || null,
    normalizeText(body.supplier_contact) || null,
    normalizeText(body.reorder_notes) || null,
    Number(body.preferred_reorder_quantity || 0),
    Number(body.is_on_reorder_list) === 1 ? 1 : 0,
    Number(body.do_not_reorder) === 1 ? 1 : 0,
    Number(body.do_not_reuse) === 1 ? 1 : 0,
    normalizeText(body.reuse_status) || null,
    normalizeText(body.reservation_notes) || null,
    Number(body.is_active) === 0 ? 0 : 1
  ).run();
  const newId = Number(insert?.meta?.last_row_id || 0);
  const saved = await db.prepare(`SELECT * FROM site_item_inventory WHERE site_item_inventory_id = ? LIMIT 1`).bind(newId).first();
  await logMovement(db, { site_item_inventory_id: newId, source_type: sourceType, external_key: externalKey, item_name: itemName, movement_type: 'create', quantity_delta: Number(body.on_hand_quantity || 0), previous_on_hand_quantity: 0, new_on_hand_quantity: Number(body.on_hand_quantity || 0), previous_reserved_quantity: 0, new_reserved_quantity: Number(body.reserved_quantity || 0), previous_incoming_quantity: 0, new_incoming_quantity: Number(body.incoming_quantity || 0), note: normalizeText(body.movement_note) || 'Inventory item created.', actor_user_id: adminUser.user_id });
  await auditAdminAction(env, request, adminUser, { action_type: 'inventory_create', target_type: 'inventory_item', target_id: newId, target_key: `${sourceType}:${externalKey}`, details: { item_name: itemName } });
  return json({ ok: true, item: shape(saved || {}) }, 201);
}

export async function onRequestPatch(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  let body = {};
  try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const id = Number(body.site_item_inventory_id || 0);
  if (!id) return json({ ok: false, error: 'site_item_inventory_id is required.' }, 400);
  try {
    const existing = await db.prepare(`SELECT * FROM site_item_inventory WHERE site_item_inventory_id = ? LIMIT 1`).bind(id).first();
    if (!existing) return json({ ok: false, error: 'Inventory item not found.' }, 404);
    const merged = {
      ...existing,
      ...body,
      item_name: normalizeText(body.item_name || existing.item_name),
      category: normalizeText(body.category ?? existing.category),
      source_url: normalizeText(body.source_url ?? existing.source_url),
      amazon_url: normalizeText(body.amazon_url ?? existing.amazon_url),
      image_url: normalizeText(body.image_url ?? existing.image_url),
      supplier_name: normalizeText(body.supplier_name ?? existing.supplier_name),
      supplier_sku: normalizeText(body.supplier_sku ?? existing.supplier_sku),
      supplier_contact: normalizeText(body.supplier_contact ?? existing.supplier_contact),
      reorder_notes: normalizeText(body.reorder_notes ?? existing.reorder_notes),
      reuse_status: normalizeText(body.reuse_status ?? existing.reuse_status),
      reservation_notes: normalizeText(body.reservation_notes ?? existing.reservation_notes)
    };
    await db.prepare(`
      UPDATE site_item_inventory
      SET item_name=?, category=?, source_url=?, amazon_url=?, image_url=?,
          on_hand_quantity=?, reserved_quantity=?, incoming_quantity=?, reorder_level=?, unit_cost_cents=?,
          supplier_name=?, supplier_sku=?, supplier_contact=?, reorder_notes=?,
          is_active=?, preferred_reorder_quantity=?, is_on_reorder_list=?, do_not_reorder=?,
          do_not_reuse=?, reuse_status=?, reservation_notes=?, last_counted_at=?, updated_at=CURRENT_TIMESTAMP
      WHERE site_item_inventory_id=?
    `).bind(
      merged.item_name,
      merged.category || null,
      merged.source_url || null,
      merged.amazon_url || null,
      merged.image_url || null,
      Number(merged.on_hand_quantity || 0),
      Number(merged.reserved_quantity || 0),
      Number(merged.incoming_quantity || 0),
      Number(merged.reorder_level || 0),
      Number(merged.unit_cost_cents || 0),
      merged.supplier_name || null,
      merged.supplier_sku || null,
      merged.supplier_contact || null,
      merged.reorder_notes || null,
      Number(merged.is_active) === 0 ? 0 : 1,
      Number(merged.preferred_reorder_quantity || 0),
      Number(merged.is_on_reorder_list) === 1 ? 1 : 0,
      Number(merged.do_not_reorder) === 1 ? 1 : 0,
      Number(merged.do_not_reuse) === 1 ? 1 : 0,
      merged.reuse_status || null,
      merged.reservation_notes || null,
      normalizeText(body.last_counted_at) || existing.last_counted_at || null,
      id
    ).run();
    await logMovement(db, {
      site_item_inventory_id: id,
      source_type: existing.source_type,
      external_key: existing.external_key,
      item_name: merged.item_name,
      movement_type: 'update',
      quantity_delta: Number(merged.on_hand_quantity || 0) - Number(existing.on_hand_quantity || 0),
      previous_on_hand_quantity: Number(existing.on_hand_quantity || 0),
      new_on_hand_quantity: Number(merged.on_hand_quantity || 0),
      previous_reserved_quantity: Number(existing.reserved_quantity || 0),
      new_reserved_quantity: Number(merged.reserved_quantity || 0),
      previous_incoming_quantity: Number(existing.incoming_quantity || 0),
      new_incoming_quantity: Number(merged.incoming_quantity || 0),
      note: normalizeText(body.movement_note) || 'Inventory item updated.',
      actor_user_id: adminUser.user_id
    });
    const saved = await db.prepare(`SELECT * FROM site_item_inventory WHERE site_item_inventory_id = ? LIMIT 1`).bind(id).first();
    await auditAdminAction(env, request, adminUser, {
      action_type: 'inventory_update',
      target_type: 'inventory_item',
      target_id: id,
      target_key: `${existing.source_type}:${existing.external_key}`,
      details: {
        item_name: merged.item_name,
        previous_on_hand_quantity: Number(existing.on_hand_quantity || 0),
        new_on_hand_quantity: Number(merged.on_hand_quantity || 0),
        previous_reserved_quantity: Number(existing.reserved_quantity || 0),
        new_reserved_quantity: Number(merged.reserved_quantity || 0),
        previous_incoming_quantity: Number(existing.incoming_quantity || 0),
        new_incoming_quantity: Number(merged.incoming_quantity || 0)
      }
    });
    return json({ ok: true, item: shape(saved || {}) });
  } catch (e) {
    return json({ ok: false, error: e.message || 'Failed to update inventory item.' }, 500);
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const db = getDb(env);
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const id = Number(new URL(request.url).searchParams.get('site_item_inventory_id') || 0);
  if (!id) return json({ ok: false, error: 'site_item_inventory_id is required.' }, 400);
  try {
    const existing = await db.prepare(`SELECT * FROM site_item_inventory WHERE site_item_inventory_id = ? LIMIT 1`).bind(id).first();
    if (!existing) return json({ ok: false, error: 'Inventory item not found.' }, 404);
    await db.prepare(`DELETE FROM site_item_inventory WHERE site_item_inventory_id = ?`).bind(id).run();
    await logMovement(db, { site_item_inventory_id: id, source_type: existing.source_type, external_key: existing.external_key, item_name: existing.item_name, movement_type: 'delete', quantity_delta: 0, previous_on_hand_quantity: Number(existing.on_hand_quantity || 0), new_on_hand_quantity: 0, previous_reserved_quantity: Number(existing.reserved_quantity || 0), new_reserved_quantity: 0, previous_incoming_quantity: Number(existing.incoming_quantity || 0), new_incoming_quantity: 0, note: 'Inventory item deleted.', actor_user_id: adminUser.user_id });
    await auditAdminAction(env, request, adminUser, { action_type: 'inventory_delete', target_type: 'inventory_item', target_id: id, target_key: `${existing.source_type}:${existing.external_key}`, details: { item_name: existing.item_name, on_hand_quantity: Number(existing.on_hand_quantity || 0) } });
    return json({ ok: true, message: 'Inventory item removed.' });
  } catch (e) {
    return json({ ok: false, error: e.message || 'Failed to remove inventory item.' }, 500);
  }
}
