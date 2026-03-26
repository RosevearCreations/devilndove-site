// File: /functions/api/admin/site-item-inventory.js
// Brief description: Admin CRUD for tools, supplies, and other inventory-backed workshop items.
// This version adds reorder-list and do-not-reuse controls, image support, and richer movement logging.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
function normalizeText(value) { return String(value || '').trim(); }
function getBearerToken(request) {
  const authHeader = request.headers.get('Authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? String(match[1] || '').trim() : '';
}
function normalizeResults(result) { return Array.isArray(result?.results) ? result.results : []; }

async function getAdminUserFromRequest(request, env) {
  const token = getBearerToken(request);
  if (!token) return null;
  const session = await env.DB.prepare(`
    SELECT s.user_id, u.user_id AS resolved_user_id, u.email, u.display_name, u.role, u.is_active
    FROM sessions s INNER JOIN users u ON u.user_id = s.user_id
    WHERE (s.session_token = ? OR s.token = ?) AND s.expires_at > datetime('now') LIMIT 1
  `).bind(token, token).first();
  if (!session || Number(session.is_active || 0) !== 1 || String(session.role || '').toLowerCase() !== 'admin') return null;
  return { user_id: Number(session.resolved_user_id || session.user_id || 0), email: session.email || '', display_name: session.display_name || '', role: 'admin' };
}

function shape(row) {
  const onHand = Number(row.on_hand_quantity || 0);
  const reserved = Number(row.reserved_quantity || 0);
  const incoming = Number(row.incoming_quantity || 0);
  const reorder = Number(row.reorder_level || 0);
  const preferred = Number(row.preferred_reorder_quantity || 0);
  const doNotReorder = Number(row.do_not_reorder || 0) === 1;
  const doNotReuse = Number(row.do_not_reuse || 0) === 1;
  const reorderListed = Number(row.is_on_reorder_list || 0) === 1;
  return {
    site_item_inventory_id: Number(row.site_item_inventory_id || 0),
    source_type: row.source_type || '', external_key: row.external_key || '', item_name: row.item_name || '',
    category: row.category || '', source_url: row.source_url || '', amazon_url: row.amazon_url || '', image_url: row.image_url || '',
    on_hand_quantity: onHand, reserved_quantity: reserved, incoming_quantity: incoming, reorder_level: reorder,
    unit_cost_cents: Number(row.unit_cost_cents || 0), supplier_name: row.supplier_name || '', supplier_sku: row.supplier_sku || '',
    reorder_notes: row.reorder_notes || '', is_active: Number(row.is_active || 0), last_seen_at: row.last_seen_at || null,
    updated_at: row.updated_at || null, preferred_reorder_quantity: preferred, is_on_reorder_list: reorderListed ? 1 : 0,
    do_not_reorder: doNotReorder ? 1 : 0, do_not_reuse: doNotReuse ? 1 : 0, reuse_status: row.reuse_status || '',
    available_quantity: onHand - reserved, projected_quantity: onHand - reserved + incoming,
    needs_reorder: !doNotReorder && ((onHand - reserved + incoming) <= reorder || reorderListed),
    linked_product_count: Number(row.linked_product_count || 0),
    linked_product_names: row.linked_product_names || ''
  };
}

async function logMovement(env, payload) {
  try {
    await env.DB.prepare(`
      INSERT INTO site_inventory_movements (
        site_item_inventory_id, source_type, external_key, item_name, movement_type, quantity_delta,
        previous_on_hand_quantity, new_on_hand_quantity, previous_reserved_quantity, new_reserved_quantity,
        previous_incoming_quantity, new_incoming_quantity, note, actor_user_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      Number(payload.site_item_inventory_id || 0) || null, normalizeText(payload.source_type) || null,
      normalizeText(payload.external_key) || null, normalizeText(payload.item_name) || null,
      normalizeText(payload.movement_type) || 'adjustment', Number(payload.quantity_delta || 0),
      Number(payload.previous_on_hand_quantity || 0), Number(payload.new_on_hand_quantity || 0),
      Number(payload.previous_reserved_quantity || 0), Number(payload.new_reserved_quantity || 0),
      Number(payload.previous_incoming_quantity || 0), Number(payload.new_incoming_quantity || 0),
      normalizeText(payload.note) || null, Number(payload.actor_user_id || 0) || null
    ).run();
  } catch {}
}

async function getRecentMovements(env) {
  const result = await env.DB.prepare(`SELECT * FROM site_inventory_movements ORDER BY created_at DESC, site_inventory_movement_id DESC LIMIT 30`).all();
  return normalizeResults(result).map((row) => ({ ...row,
    site_inventory_movement_id: Number(row.site_inventory_movement_id || 0), site_item_inventory_id: Number(row.site_item_inventory_id || 0),
    quantity_delta: Number(row.quantity_delta || 0), previous_on_hand_quantity: Number(row.previous_on_hand_quantity || 0),
    new_on_hand_quantity: Number(row.new_on_hand_quantity || 0), previous_reserved_quantity: Number(row.previous_reserved_quantity || 0),
    new_reserved_quantity: Number(row.new_reserved_quantity || 0), previous_incoming_quantity: Number(row.previous_incoming_quantity || 0),
    new_incoming_quantity: Number(row.new_incoming_quantity || 0), actor_user_id: Number(row.actor_user_id || 0)
  }));
}



async function syncInventoryFromCatalog(env, adminUser, sourceTypes = ['tool', 'supply']) {
  const placeholders = sourceTypes.map(() => '?').join(',');
  const rows = normalizeResults(await env.DB.prepare(`
    SELECT item_kind, source_key, name, category, image_url, amazon_url
    FROM catalog_items
    WHERE item_kind IN (${placeholders}) AND COALESCE(status,'active') != 'archived'
    ORDER BY item_kind ASC, LOWER(name) ASC
  `).bind(...sourceTypes).all());
  let synced = 0;
  for (const row of rows) {
    const existing = await env.DB.prepare(`SELECT * FROM site_item_inventory WHERE source_type = ? AND external_key = ? LIMIT 1`).bind(row.item_kind, row.source_key).first();
    const onHand = Number(existing?.on_hand_quantity || 0);
    const reserved = Number(existing?.reserved_quantity || 0);
    const incoming = Number(existing?.incoming_quantity || 0);
    const reorderLevel = Number(existing?.reorder_level || 0);
    const unitCost = Number(existing?.unit_cost_cents || 0);
    const preferredQty = Number(existing?.preferred_reorder_quantity || 0);
    await env.DB.prepare(`
      INSERT INTO site_item_inventory (
        source_type, external_key, item_name, category, amazon_url, image_url,
        on_hand_quantity, reserved_quantity, incoming_quantity, reorder_level, unit_cost_cents,
        preferred_reorder_quantity, is_active, last_seen_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(source_type, external_key) DO UPDATE SET
        item_name=excluded.item_name,
        category=excluded.category,
        amazon_url=COALESCE(site_item_inventory.amazon_url, excluded.amazon_url),
        image_url=COALESCE(site_item_inventory.image_url, excluded.image_url),
        last_seen_at=CURRENT_TIMESTAMP,
        updated_at=CURRENT_TIMESTAMP
    `).bind(row.item_kind, row.source_key, row.name, row.category || null, row.amazon_url || null, row.image_url || null, onHand, reserved, incoming, reorderLevel, unitCost, preferredQty).run();
    if (!existing) {
      await logMovement(env, { source_type: row.item_kind, external_key: row.source_key, item_name: row.name, movement_type: 'sync_create', quantity_delta: 0, previous_on_hand_quantity: 0, new_on_hand_quantity: onHand, previous_reserved_quantity: 0, new_reserved_quantity: reserved, previous_incoming_quantity: 0, new_incoming_quantity: incoming, note: 'Synced inventory item from catalog.', actor_user_id: adminUser.user_id });
    }
    synced += 1;
  }
  return synced;
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
    SELECT sii.*,
           COUNT(DISTINCT prl.product_id) AS linked_product_count,
           GROUP_CONCAT(DISTINCT p.name) AS linked_product_names
    FROM site_item_inventory sii
    LEFT JOIN product_resource_links prl ON prl.resource_kind = sii.source_type AND prl.source_key = sii.external_key
    LEFT JOIN products p ON p.product_id = prl.product_id
    WHERE (? = '' OR sii.source_type = ?)
      AND (? = '' OR LOWER(COALESCE(sii.item_name,'')) LIKE ? OR LOWER(COALESCE(sii.category,'')) LIKE ? OR LOWER(COALESCE(sii.supplier_name,'')) LIKE ?)
    GROUP BY sii.site_item_inventory_id
    ORDER BY CASE WHEN COALESCE(sii.is_active,0)=1 THEN 0 ELSE 1 END,
             CASE WHEN COALESCE(do_not_reuse,0)=1 THEN 1 ELSE 0 END,
             CASE WHEN COALESCE(do_not_reorder,0)=1 THEN 1 ELSE 0 END,
             CASE WHEN (COALESCE(on_hand_quantity,0)-COALESCE(reserved_quantity,0)+COALESCE(incoming_quantity,0)) <= COALESCE(reorder_level,0) OR COALESCE(is_on_reorder_list,0)=1 THEN 0 ELSE 1 END,
             source_type ASC, category ASC, item_name ASC
  `).bind(sourceType, sourceType, query, `%${query}%`, `%${query}%`, `%${query}%`).all());
  const items = rows.map(shape);
  return json({ ok: true, items, summary: {
    total_items: items.length, active_items: items.filter((x) => x.is_active === 1).length,
    low_stock_items: items.filter((x) => x.needs_reorder).length, total_on_hand: items.reduce((s, x) => s + x.on_hand_quantity, 0),
    total_reserved: items.reduce((s, x) => s + x.reserved_quantity, 0), total_incoming: items.reduce((s, x) => s + x.incoming_quantity, 0),
    reorder_list_items: items.filter((x) => x.is_on_reorder_list === 1).length, do_not_reuse_items: items.filter((x) => x.do_not_reuse === 1).length
  }, movements: includeHistory ? await getRecentMovements(env) : [] });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  let body = {}; try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  if (normalizeText(body.action).toLowerCase() === 'sync_catalog') {
    const sourceTypes = Array.isArray(body.source_types) && body.source_types.length ? body.source_types.map((v) => normalizeText(v).toLowerCase()).filter((v) => ['tool','supply'].includes(v)) : ['tool','supply'];
    const synced = await syncInventoryFromCatalog(env, adminUser, sourceTypes);
    return json({ ok: true, synced, source_types: sourceTypes });
  }
  const sourceType = normalizeText(body.source_type) || 'supply';
  const externalKey = normalizeText(body.external_key) || crypto.randomUUID();
  const itemName = normalizeText(body.item_name);
  if (!itemName) return json({ ok: false, error: 'item_name is required.' }, 400);
  await env.DB.prepare(`
    INSERT INTO site_item_inventory (
      source_type, external_key, item_name, category, source_url, amazon_url, image_url,
      on_hand_quantity, reserved_quantity, incoming_quantity, reorder_level, unit_cost_cents,
      supplier_name, supplier_sku, reorder_notes, is_active, preferred_reorder_quantity,
      is_on_reorder_list, do_not_reorder, do_not_reuse, reuse_status, last_seen_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(source_type, external_key) DO UPDATE SET
      item_name=excluded.item_name, category=excluded.category, source_url=excluded.source_url, amazon_url=excluded.amazon_url, image_url=excluded.image_url,
      on_hand_quantity=excluded.on_hand_quantity, reserved_quantity=excluded.reserved_quantity, incoming_quantity=excluded.incoming_quantity,
      reorder_level=excluded.reorder_level, unit_cost_cents=excluded.unit_cost_cents, supplier_name=excluded.supplier_name, supplier_sku=excluded.supplier_sku,
      reorder_notes=excluded.reorder_notes, is_active=excluded.is_active, preferred_reorder_quantity=excluded.preferred_reorder_quantity,
      is_on_reorder_list=excluded.is_on_reorder_list, do_not_reorder=excluded.do_not_reorder, do_not_reuse=excluded.do_not_reuse, reuse_status=excluded.reuse_status,
      last_seen_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP
  `).bind(
    sourceType, externalKey, itemName, normalizeText(body.category) || null, normalizeText(body.source_url) || null,
    normalizeText(body.amazon_url) || null, normalizeText(body.image_url) || null, Number(body.on_hand_quantity || 0),
    Number(body.reserved_quantity || 0), Number(body.incoming_quantity || 0), Number(body.reorder_level || 0), Number(body.unit_cost_cents || 0),
    normalizeText(body.supplier_name) || null, normalizeText(body.supplier_sku) || null, normalizeText(body.reorder_notes) || null,
    Number(body.is_active) === 0 ? 0 : 1, Number(body.preferred_reorder_quantity || 0), Number(body.is_on_reorder_list) === 1 ? 1 : 0,
    Number(body.do_not_reorder) === 1 ? 1 : 0, Number(body.do_not_reuse) === 1 ? 1 : 0, normalizeText(body.reuse_status) || null
  ).run();
  const saved = await env.DB.prepare(`SELECT * FROM site_item_inventory WHERE source_type = ? AND external_key = ? LIMIT 1`).bind(sourceType, externalKey).first();
  await logMovement(env, {
    site_item_inventory_id: saved?.site_item_inventory_id, source_type: sourceType, external_key: externalKey, item_name: itemName,
    movement_type: 'create', quantity_delta: Number(body.on_hand_quantity || 0), previous_on_hand_quantity: 0, new_on_hand_quantity: Number(body.on_hand_quantity || 0),
    previous_reserved_quantity: 0, new_reserved_quantity: Number(body.reserved_quantity || 0), previous_incoming_quantity: 0, new_incoming_quantity: Number(body.incoming_quantity || 0),
    note: normalizeText(body.movement_note) || 'Inventory item created.', actor_user_id: adminUser.user_id
  });
  return json({ ok: true, item: shape(saved) });
}

export async function onRequestPatch(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  let body = {}; try { body = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const id = Number(body.site_item_inventory_id || 0);
  if (!id) return json({ ok: false, error: 'site_item_inventory_id is required.' }, 400);
  const existing = await env.DB.prepare(`SELECT * FROM site_item_inventory WHERE site_item_inventory_id = ? LIMIT 1`).bind(id).first();
  if (!existing) return json({ ok: false, error: 'Inventory item not found.' }, 404);
  const merged = {
    source_type: normalizeText(body.source_type || existing.source_type), external_key: normalizeText(body.external_key || existing.external_key),
    item_name: normalizeText(body.item_name || existing.item_name), category: normalizeText(body.category ?? existing.category),
    source_url: normalizeText(body.source_url ?? existing.source_url), amazon_url: normalizeText(body.amazon_url ?? existing.amazon_url), image_url: normalizeText(body.image_url ?? existing.image_url),
    on_hand_quantity: body.on_hand_quantity == null ? Number(existing.on_hand_quantity || 0) : Number(body.on_hand_quantity || 0),
    reserved_quantity: body.reserved_quantity == null ? Number(existing.reserved_quantity || 0) : Number(body.reserved_quantity || 0),
    incoming_quantity: body.incoming_quantity == null ? Number(existing.incoming_quantity || 0) : Number(body.incoming_quantity || 0),
    reorder_level: body.reorder_level == null ? Number(existing.reorder_level || 0) : Number(body.reorder_level || 0),
    unit_cost_cents: body.unit_cost_cents == null ? Number(existing.unit_cost_cents || 0) : Number(body.unit_cost_cents || 0),
    supplier_name: normalizeText(body.supplier_name ?? existing.supplier_name), supplier_sku: normalizeText(body.supplier_sku ?? existing.supplier_sku),
    reorder_notes: normalizeText(body.reorder_notes ?? existing.reorder_notes), is_active: body.is_active == null ? Number(existing.is_active || 0) : (Number(body.is_active) === 0 ? 0 : 1),
    preferred_reorder_quantity: body.preferred_reorder_quantity == null ? Number(existing.preferred_reorder_quantity || 0) : Number(body.preferred_reorder_quantity || 0),
    is_on_reorder_list: body.is_on_reorder_list == null ? Number(existing.is_on_reorder_list || 0) : (Number(body.is_on_reorder_list) === 1 ? 1 : 0),
    do_not_reorder: body.do_not_reorder == null ? Number(existing.do_not_reorder || 0) : (Number(body.do_not_reorder) === 1 ? 1 : 0),
    do_not_reuse: body.do_not_reuse == null ? Number(existing.do_not_reuse || 0) : (Number(body.do_not_reuse) === 1 ? 1 : 0),
    reuse_status: normalizeText(body.reuse_status ?? existing.reuse_status)
  };
  await env.DB.prepare(`
    UPDATE site_item_inventory SET source_type=?, external_key=?, item_name=?, category=?, source_url=?, amazon_url=?, image_url=?, on_hand_quantity=?, reserved_quantity=?, incoming_quantity=?,
      reorder_level=?, unit_cost_cents=?, supplier_name=?, supplier_sku=?, reorder_notes=?, is_active=?, preferred_reorder_quantity=?, is_on_reorder_list=?, do_not_reorder=?, do_not_reuse=?, reuse_status=?, updated_at=CURRENT_TIMESTAMP
    WHERE site_item_inventory_id = ?
  `).bind(merged.source_type, merged.external_key, merged.item_name, merged.category || null, merged.source_url || null, merged.amazon_url || null, merged.image_url || null,
    merged.on_hand_quantity, merged.reserved_quantity, merged.incoming_quantity, merged.reorder_level, merged.unit_cost_cents, merged.supplier_name || null, merged.supplier_sku || null,
    merged.reorder_notes || null, merged.is_active, merged.preferred_reorder_quantity, merged.is_on_reorder_list, merged.do_not_reorder, merged.do_not_reuse, merged.reuse_status || null, id).run();
  const saved = await env.DB.prepare(`SELECT * FROM site_item_inventory WHERE site_item_inventory_id = ? LIMIT 1`).bind(id).first();
  await logMovement(env, {
    site_item_inventory_id: id, source_type: saved?.source_type, external_key: saved?.external_key, item_name: saved?.item_name,
    movement_type: 'adjustment', quantity_delta: Number(saved?.on_hand_quantity || 0) - Number(existing?.on_hand_quantity || 0),
    previous_on_hand_quantity: Number(existing?.on_hand_quantity || 0), new_on_hand_quantity: Number(saved?.on_hand_quantity || 0),
    previous_reserved_quantity: Number(existing?.reserved_quantity || 0), new_reserved_quantity: Number(saved?.reserved_quantity || 0),
    previous_incoming_quantity: Number(existing?.incoming_quantity || 0), new_incoming_quantity: Number(saved?.incoming_quantity || 0),
    note: normalizeText(body.movement_note) || 'Inventory item updated.', actor_user_id: adminUser.user_id
  });
  return json({ ok: true, item: shape(saved) });
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const id = Number(new URL(request.url).searchParams.get('site_item_inventory_id') || 0);
  if (!id) return json({ ok: false, error: 'site_item_inventory_id is required.' }, 400);
  const existing = await env.DB.prepare(`SELECT * FROM site_item_inventory WHERE site_item_inventory_id = ? LIMIT 1`).bind(id).first();
  if (!existing) return json({ ok: false, error: 'Inventory item not found.' }, 404);
  await env.DB.prepare(`DELETE FROM site_item_inventory WHERE site_item_inventory_id = ?`).bind(id).run();
  await logMovement(env, { site_item_inventory_id: id, source_type: existing.source_type, external_key: existing.external_key, item_name: existing.item_name, movement_type: 'delete', quantity_delta: -Number(existing.on_hand_quantity || 0), previous_on_hand_quantity: Number(existing.on_hand_quantity || 0), new_on_hand_quantity: 0, previous_reserved_quantity: Number(existing.reserved_quantity || 0), new_reserved_quantity: 0, previous_incoming_quantity: Number(existing.incoming_quantity || 0), new_incoming_quantity: 0, note: 'Inventory item deleted.', actor_user_id: adminUser.user_id });
  return json({ ok: true, deleted: true });
}
