// File: /functions/api/admin/site-item-inventory.js
// Brief description: Manages reorder and on-hand inventory for site-linked tools, supplies,
// products, and Amazon-linked items with deeper operational fields and movement history logging.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function normalizeText(value) {
  return String(value || '').trim();
}

function getBearerToken(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? String(match[1] || '').trim() : '';
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function getAdminUserFromRequest(request, env) {
  const token = getBearerToken(request);
  if (!token) return null;
  const session = await env.DB.prepare(`
    SELECT
      s.user_id,
      u.user_id AS resolved_user_id,
      u.email,
      u.display_name,
      u.role,
      u.is_active
    FROM sessions s
    INNER JOIN users u ON u.user_id = s.user_id
    WHERE (s.session_token = ? OR s.token = ?)
      AND s.expires_at > datetime('now')
    LIMIT 1
  `).bind(token, token).first();

  if (!session || Number(session.is_active || 0) !== 1 || String(session.role || '').toLowerCase() !== 'admin') {
    return null;
  }

  return {
    user_id: Number(session.resolved_user_id || session.user_id || 0),
    email: session.email || '',
    display_name: session.display_name || '',
    role: 'admin'
  };
}

function shape(row) {
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
    on_hand_quantity: onHand,
    reserved_quantity: reserved,
    incoming_quantity: incoming,
    reorder_level: reorder,
    unit_cost_cents: Number(row.unit_cost_cents || 0),
    supplier_name: row.supplier_name || '',
    supplier_sku: row.supplier_sku || '',
    reorder_notes: row.reorder_notes || '',
    is_active: Number(row.is_active || 0),
    last_seen_at: row.last_seen_at || null,
    updated_at: row.updated_at || null,
    available_quantity: onHand - reserved,
    projected_quantity: onHand - reserved + incoming,
    needs_reorder: (onHand - reserved + incoming) <= reorder
  };
}

async function logMovement(env, payload) {
  try {
    await env.DB.prepare(`
      INSERT INTO site_inventory_movements (
        site_item_inventory_id,
        source_type,
        external_key,
        item_name,
        movement_type,
        quantity_delta,
        previous_on_hand_quantity,
        new_on_hand_quantity,
        previous_reserved_quantity,
        new_reserved_quantity,
        previous_incoming_quantity,
        new_incoming_quantity,
        note,
        actor_user_id,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      Number(payload.site_item_inventory_id || 0) || null,
      normalizeText(payload.source_type) || null,
      normalizeText(payload.external_key) || null,
      normalizeText(payload.item_name) || null,
      normalizeText(payload.movement_type) || 'adjustment',
      Number(payload.quantity_delta || 0),
      Number(payload.previous_on_hand_quantity || 0),
      Number(payload.new_on_hand_quantity || 0),
      Number(payload.previous_reserved_quantity || 0),
      Number(payload.new_reserved_quantity || 0),
      Number(payload.previous_incoming_quantity || 0),
      Number(payload.new_incoming_quantity || 0),
      normalizeText(payload.note) || null,
      Number(payload.actor_user_id || 0) || null
    ).run();
  } catch {}
}

async function getRecentMovements(env) {
  const result = await env.DB.prepare(`
    SELECT
      site_inventory_movement_id,
      site_item_inventory_id,
      source_type,
      external_key,
      item_name,
      movement_type,
      quantity_delta,
      previous_on_hand_quantity,
      new_on_hand_quantity,
      previous_reserved_quantity,
      new_reserved_quantity,
      previous_incoming_quantity,
      new_incoming_quantity,
      note,
      actor_user_id,
      created_at
    FROM site_inventory_movements
    ORDER BY created_at DESC, site_inventory_movement_id DESC
    LIMIT 20
  `).all();

  return normalizeResults(result).map((row) => ({
    site_inventory_movement_id: Number(row.site_inventory_movement_id || 0),
    site_item_inventory_id: Number(row.site_item_inventory_id || 0),
    source_type: row.source_type || '',
    external_key: row.external_key || '',
    item_name: row.item_name || '',
    movement_type: row.movement_type || '',
    quantity_delta: Number(row.quantity_delta || 0),
    previous_on_hand_quantity: Number(row.previous_on_hand_quantity || 0),
    new_on_hand_quantity: Number(row.new_on_hand_quantity || 0),
    previous_reserved_quantity: Number(row.previous_reserved_quantity || 0),
    new_reserved_quantity: Number(row.new_reserved_quantity || 0),
    previous_incoming_quantity: Number(row.previous_incoming_quantity || 0),
    new_incoming_quantity: Number(row.new_incoming_quantity || 0),
    note: row.note || '',
    actor_user_id: Number(row.actor_user_id || 0),
    created_at: row.created_at || null
  }));
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  const url = new URL(request.url);
  const sourceType = normalizeText(url.searchParams.get('source_type'));
  const query = normalizeText(url.searchParams.get('q')).toLowerCase();
  const includeHistory = Number(url.searchParams.get('include_history') || 0) === 1;

  const rows = normalizeResults(await env.DB.prepare(`
    SELECT
      site_item_inventory_id,
      source_type,
      external_key,
      item_name,
      category,
      source_url,
      amazon_url,
      on_hand_quantity,
      reserved_quantity,
      incoming_quantity,
      reorder_level,
      unit_cost_cents,
      supplier_name,
      supplier_sku,
      reorder_notes,
      is_active,
      last_seen_at,
      updated_at
    FROM site_item_inventory
    WHERE (? = '' OR source_type = ?)
      AND (
        ? = ''
        OR LOWER(COALESCE(item_name, '')) LIKE ?
        OR LOWER(COALESCE(category, '')) LIKE ?
        OR LOWER(COALESCE(supplier_name, '')) LIKE ?
      )
    ORDER BY
      CASE WHEN COALESCE(is_active, 0) = 1 THEN 0 ELSE 1 END,
      CASE WHEN (COALESCE(on_hand_quantity, 0) - COALESCE(reserved_quantity, 0) + COALESCE(incoming_quantity, 0)) <= COALESCE(reorder_level, 0) THEN 0 ELSE 1 END,
      source_type ASC,
      category ASC,
      item_name ASC
  `).bind(sourceType, sourceType, query, `%${query}%`, `%${query}%`, `%${query}%`).all());

  const items = rows.map(shape);

  return json({
    ok: true,
    items,
    summary: {
      total_items: items.length,
      active_items: items.filter((x) => x.is_active === 1).length,
      low_stock_items: items.filter((x) => x.needs_reorder).length,
      total_on_hand: items.reduce((sum, x) => sum + x.on_hand_quantity, 0),
      total_reserved: items.reduce((sum, x) => sum + x.reserved_quantity, 0),
      total_incoming: items.reduce((sum, x) => sum + x.incoming_quantity, 0)
    },
    movements: includeHistory ? await getRecentMovements(env) : []
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  const sourceType = normalizeText(body.source_type) || 'supply';
  const externalKey = normalizeText(body.external_key) || crypto.randomUUID();
  const itemName = normalizeText(body.item_name);
  if (!itemName) return json({ ok: false, error: 'item_name is required.' }, 400);

  await env.DB.prepare(`
    INSERT INTO site_item_inventory (
      source_type,
      external_key,
      item_name,
      category,
      source_url,
      amazon_url,
      on_hand_quantity,
      reserved_quantity,
      incoming_quantity,
      reorder_level,
      unit_cost_cents,
      supplier_name,
      supplier_sku,
      reorder_notes,
      is_active,
      last_seen_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(source_type, external_key) DO UPDATE SET
      item_name = excluded.item_name,
      category = excluded.category,
      source_url = excluded.source_url,
      amazon_url = excluded.amazon_url,
      on_hand_quantity = excluded.on_hand_quantity,
      reserved_quantity = excluded.reserved_quantity,
      incoming_quantity = excluded.incoming_quantity,
      reorder_level = excluded.reorder_level,
      unit_cost_cents = excluded.unit_cost_cents,
      supplier_name = excluded.supplier_name,
      supplier_sku = excluded.supplier_sku,
      reorder_notes = excluded.reorder_notes,
      is_active = excluded.is_active,
      last_seen_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    sourceType,
    externalKey,
    itemName,
    normalizeText(body.category) || null,
    normalizeText(body.source_url) || null,
    normalizeText(body.amazon_url) || null,
    Number(body.on_hand_quantity || 0),
    Number(body.reserved_quantity || 0),
    Number(body.incoming_quantity || 0),
    Number(body.reorder_level || 0),
    Number(body.unit_cost_cents || 0),
    normalizeText(body.supplier_name) || null,
    normalizeText(body.supplier_sku) || null,
    normalizeText(body.reorder_notes) || null,
    Number(body.is_active) === 0 ? 0 : 1
  ).run();

  const saved = await env.DB.prepare(`
    SELECT *
    FROM site_item_inventory
    WHERE source_type = ? AND external_key = ?
    LIMIT 1
  `).bind(sourceType, externalKey).first();

  await logMovement(env, {
    site_item_inventory_id: saved?.site_item_inventory_id,
    source_type: sourceType,
    external_key: externalKey,
    item_name: itemName,
    movement_type: 'create',
    quantity_delta: Number(body.on_hand_quantity || 0),
    previous_on_hand_quantity: 0,
    new_on_hand_quantity: Number(body.on_hand_quantity || 0),
    previous_reserved_quantity: 0,
    new_reserved_quantity: Number(body.reserved_quantity || 0),
    previous_incoming_quantity: 0,
    new_incoming_quantity: Number(body.incoming_quantity || 0),
    note: normalizeText(body.movement_note) || 'Inventory item created or seeded.',
    actor_user_id: adminUser.user_id
  });

  return json({ ok: true, message: 'Site inventory item saved.', source_type: sourceType, external_key: externalKey });
}

export async function onRequestPatch(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.' }, 400);
  }

  const id = Number(body.site_item_inventory_id || 0);
  if (!Number.isInteger(id) || id <= 0) return json({ ok: false, error: 'A valid site_item_inventory_id is required.' }, 400);

  const existing = await env.DB.prepare(`SELECT * FROM site_item_inventory WHERE site_item_inventory_id = ? LIMIT 1`).bind(id).first();
  if (!existing) return json({ ok: false, error: 'Site inventory item not found.' }, 404);

  const nextOnHand = body.on_hand_quantity === undefined ? Number(existing.on_hand_quantity || 0) : Number(body.on_hand_quantity || 0);
  const nextReserved = body.reserved_quantity === undefined ? Number(existing.reserved_quantity || 0) : Number(body.reserved_quantity || 0);
  const nextIncoming = body.incoming_quantity === undefined ? Number(existing.incoming_quantity || 0) : Number(body.incoming_quantity || 0);

  await env.DB.prepare(`
    UPDATE site_item_inventory
    SET
      item_name = ?,
      category = ?,
      source_url = ?,
      amazon_url = ?,
      on_hand_quantity = ?,
      reserved_quantity = ?,
      incoming_quantity = ?,
      reorder_level = ?,
      unit_cost_cents = ?,
      supplier_name = ?,
      supplier_sku = ?,
      reorder_notes = ?,
      is_active = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE site_item_inventory_id = ?
  `).bind(
    normalizeText(body.item_name) || existing.item_name || null,
    body.category === undefined ? existing.category : (normalizeText(body.category) || null),
    body.source_url === undefined ? existing.source_url : (normalizeText(body.source_url) || null),
    body.amazon_url === undefined ? existing.amazon_url : (normalizeText(body.amazon_url) || null),
    nextOnHand,
    nextReserved,
    nextIncoming,
    body.reorder_level === undefined ? Number(existing.reorder_level || 0) : Number(body.reorder_level || 0),
    body.unit_cost_cents === undefined ? Number(existing.unit_cost_cents || 0) : Number(body.unit_cost_cents || 0),
    body.supplier_name === undefined ? existing.supplier_name : (normalizeText(body.supplier_name) || null),
    body.supplier_sku === undefined ? existing.supplier_sku : (normalizeText(body.supplier_sku) || null),
    body.reorder_notes === undefined ? existing.reorder_notes : (normalizeText(body.reorder_notes) || null),
    body.is_active === undefined ? Number(existing.is_active || 0) : (Number(body.is_active) === 0 ? 0 : 1),
    id
  ).run();

  const oldOnHand = Number(existing.on_hand_quantity || 0);
  const oldReserved = Number(existing.reserved_quantity || 0);
  const oldIncoming = Number(existing.incoming_quantity || 0);
  const changedStock = oldOnHand !== nextOnHand || oldReserved !== nextReserved || oldIncoming !== nextIncoming;

  if (changedStock) {
    await logMovement(env, {
      site_item_inventory_id: id,
      source_type: existing.source_type,
      external_key: existing.external_key,
      item_name: normalizeText(body.item_name) || existing.item_name,
      movement_type: normalizeText(body.movement_type) || 'adjustment',
      quantity_delta: nextOnHand - oldOnHand,
      previous_on_hand_quantity: oldOnHand,
      new_on_hand_quantity: nextOnHand,
      previous_reserved_quantity: oldReserved,
      new_reserved_quantity: nextReserved,
      previous_incoming_quantity: oldIncoming,
      new_incoming_quantity: nextIncoming,
      note: normalizeText(body.movement_note) || 'Inventory quantities updated.',
      actor_user_id: adminUser.user_id
    });
  }

  return json({ ok: true, message: 'Site inventory item updated.', site_item_inventory_id: id });
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);

  const url = new URL(request.url);
  const id = Number(url.searchParams.get('site_item_inventory_id') || 0);
  if (!Number.isInteger(id) || id <= 0) return json({ ok: false, error: 'A valid site_item_inventory_id is required.' }, 400);

  const existing = await env.DB.prepare(`SELECT * FROM site_item_inventory WHERE site_item_inventory_id = ? LIMIT 1`).bind(id).first();
  if (existing) {
    await logMovement(env, {
      site_item_inventory_id: id,
      source_type: existing.source_type,
      external_key: existing.external_key,
      item_name: existing.item_name,
      movement_type: 'delete',
      quantity_delta: 0,
      previous_on_hand_quantity: Number(existing.on_hand_quantity || 0),
      new_on_hand_quantity: 0,
      previous_reserved_quantity: Number(existing.reserved_quantity || 0),
      new_reserved_quantity: 0,
      previous_incoming_quantity: Number(existing.incoming_quantity || 0),
      new_incoming_quantity: 0,
      note: 'Inventory item deleted.',
      actor_user_id: adminUser.user_id
    });
  }

  await env.DB.prepare(`DELETE FROM site_item_inventory WHERE site_item_inventory_id = ?`).bind(id).run();
  return json({ ok: true, message: 'Site inventory item deleted.', site_item_inventory_id: id });
}
