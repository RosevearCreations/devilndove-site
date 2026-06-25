// File: /functions/api/admin/delete-product.js
// Permanent deletion is intentionally limited to unused products. Ordered or referenced
// products stay in history and must be archived instead.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse } from "../_lib/adminAudit.js";
import { requireAdminStepUp } from "../_lib/adminStepUp.js";

function json(data, status = 200) { return jsonResponse(data, status); }

async function requireAdmin(request, env) {
  const sessionUser = await getAdminUserFromRequest(request, env);
  if (!sessionUser) return { error: json({ ok: false, error: "Unauthorized." }, 401) };
  return { sessionUser };
}

function quoteIdentifier(value) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}

async function getTableColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${quoteIdentifier(tableName)})`).all();
    const rows = Array.isArray(result?.results) ? result.results : [];
    return new Set(rows.map((row) => String(row?.name || "").trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function tableExists(db, tableName) {
  try {
    const row = await db.prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table' AND name = ?
      LIMIT 1
    `).bind(tableName).first();
    return Boolean(row?.name);
  } catch {
    return false;
  }
}

async function discoverProductReferences(db, productId) {
  const tablesResult = await db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
  `).all().catch(() => ({ results: [] }));
  const tables = Array.isArray(tablesResult?.results) ? tablesResult.results.map((row) => String(row?.name || "")).filter(Boolean) : [];
  const references = [];

  for (const tableName of tables) {
    if (tableName === 'products' || tableName === 'product_deletion_audit') continue;
    let foreignKeys = [];
    try {
      const result = await db.prepare(`PRAGMA foreign_key_list(${quoteIdentifier(tableName)})`).all();
      foreignKeys = Array.isArray(result?.results) ? result.results : [];
    } catch {
      foreignKeys = [];
    }

    for (const foreignKey of foreignKeys) {
      if (String(foreignKey?.table || '').toLowerCase() !== 'products') continue;
      const childColumn = String(foreignKey?.from || '').trim();
      if (!childColumn) continue;
      let count = 0;
      try {
        const row = await db.prepare(`
          SELECT COUNT(*) AS count
          FROM ${quoteIdentifier(tableName)}
          WHERE ${quoteIdentifier(childColumn)} = ?
        `).bind(productId).first();
        count = Number(row?.count || 0);
      } catch {
        count = 0;
      }
      if (count > 0) {
        references.push({
          table_name: tableName,
          column_name: childColumn,
          count,
          on_delete: String(foreignKey?.on_delete || 'NO ACTION').toUpperCase()
        });
      }
    }
  }

  return references.sort((a, b) => a.table_name.localeCompare(b.table_name));
}

async function safeProductImages(db, productId) {
  if (!(await tableExists(db, 'product_images'))) return [];
  try {
    const result = await db.prepare(`
      SELECT product_image_id, image_url, alt_text, caption, display_order
      FROM product_images
      WHERE product_id = ?
      ORDER BY display_order ASC, product_image_id ASC
    `).bind(productId).all();
    return Array.isArray(result?.results) ? result.results : [];
  } catch {
    return [];
  }
}


async function ensureMaterialReturnAuditTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS product_material_return_audit (
      product_material_return_audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id_deleted INTEGER NOT NULL,
      product_resource_link_id INTEGER,
      site_item_inventory_id INTEGER,
      resource_kind TEXT,
      source_key TEXT,
      item_name TEXT,
      action_key TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      previous_on_hand_quantity INTEGER NOT NULL DEFAULT 0,
      new_on_hand_quantity INTEGER NOT NULL DEFAULT 0,
      previous_reserved_quantity INTEGER NOT NULL DEFAULT 0,
      new_reserved_quantity INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      created_by_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run().catch(() => null);
}

async function loadProductMaterialPreview(db, productId) {
  if (!(await tableExists(db, 'product_resource_links')) || !(await tableExists(db, 'site_item_inventory'))) return [];
  const linkColumns = await getTableColumnSet(db, 'product_resource_links');
  const inventoryColumns = await getTableColumnSet(db, 'site_item_inventory');
  const supportsConsumptionMode = linkColumns.has('consumption_mode');
  const supportsLotSize = linkColumns.has('lot_size_units');
  const supportsUsageUnits = inventoryColumns.has('usage_units_per_stock_unit');
  const supportsStockLabel = inventoryColumns.has('stock_unit_label');
  const supportsUsageLabel = inventoryColumns.has('usage_unit_label');
  const result = await db.prepare(`
    SELECT
      prl.product_resource_link_id,
      prl.resource_kind,
      prl.source_key,
      COALESCE(prl.quantity_used, 0) AS quantity_used,
      ${supportsConsumptionMode ? `COALESCE(prl.consumption_mode, 'per_unit')` : `'per_unit'`} AS consumption_mode,
      ${supportsLotSize ? `COALESCE(prl.lot_size_units, 1)` : `1`} AS lot_size_units,
      sii.site_item_inventory_id,
      sii.item_name,
      COALESCE(sii.on_hand_quantity, 0) AS on_hand_quantity,
      COALESCE(sii.reserved_quantity, 0) AS reserved_quantity,
      COALESCE(sii.incoming_quantity, 0) AS incoming_quantity,
      COALESCE(sii.unit_cost_cents, 0) AS unit_cost_cents,
      ${supportsUsageUnits ? `COALESCE(NULLIF(sii.usage_units_per_stock_unit, 0), 1)` : `1`} AS usage_units_per_stock_unit,
      ${supportsStockLabel ? `COALESCE(NULLIF(sii.stock_unit_label, ''), 'unit')` : `'unit'`} AS stock_unit_label,
      ${supportsUsageLabel ? `COALESCE(NULLIF(sii.usage_unit_label, ''), 'unit')` : `'unit'`} AS usage_unit_label
    FROM product_resource_links prl
    LEFT JOIN site_item_inventory sii
      ON sii.source_type = prl.resource_kind
     AND sii.external_key = prl.source_key
    WHERE prl.product_id = ?
    ORDER BY prl.sort_order ASC, prl.product_resource_link_id ASC
  `).bind(productId).all().catch(() => ({ results: [] }));
  const rows = Array.isArray(result?.results) ? result.results : [];
  return rows.map((row) => {
    const mode = String(row?.consumption_mode || 'per_unit').toLowerCase();
    const perStock = Math.max(1, Number(row?.usage_units_per_stock_unit || 1) || 1);
    const canRelease = Number(row?.site_item_inventory_id || 0) > 0 && mode === 'per_unit' && perStock === 1;
    const canReturn = Number(row?.site_item_inventory_id || 0) > 0 && String(row?.resource_kind || '').toLowerCase() === 'supply';
    return {
      ...row,
      quantity_used: Number(row?.quantity_used || 0),
      on_hand_quantity: Number(row?.on_hand_quantity || 0),
      reserved_quantity: Number(row?.reserved_quantity || 0),
      incoming_quantity: Number(row?.incoming_quantity || 0),
      usage_units_per_stock_unit: perStock,
      can_release_reservation: canRelease ? 1 : 0,
      can_return_on_hand: canReturn ? 1 : 0,
      suggested_release_quantity: canRelease ? Math.max(0, Math.min(Number(row?.quantity_used || 0), Number(row?.reserved_quantity || 0))) : 0
    };
  });
}

function wholeNonNegative(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

async function applyReviewedMaterialActions(db, { productId, actions = [], deletionReason = '', actorUserId = null }) {
  if (!Array.isArray(actions) || !actions.length) return { affected_items: 0, release_quantity: 0, returned_on_hand_quantity: 0, rows: [] };
  const previewRows = await loadProductMaterialPreview(db, productId);
  const rowByLink = new Map(previewRows.map((row) => [Number(row.product_resource_link_id || 0), row]));
  const inventoryMovementExists = await tableExists(db, 'site_inventory_movements');
  await ensureMaterialReturnAuditTable(db);
  const auditExists = await tableExists(db, 'product_material_return_audit');
  const statements = [];
  const outputRows = [];
  let totalRelease = 0;
  let totalReturn = 0;

  for (const action of actions) {
    const linkId = Number(action?.product_resource_link_id || 0);
    if (!linkId || !rowByLink.has(linkId)) throw new Error('A requested raw-inventory action no longer matches this product. Refresh the correction panel and review again.');
    const row = rowByLink.get(linkId);
    const releaseQuantity = wholeNonNegative(action?.release_quantity);
    const returnQuantity = wholeNonNegative(action?.return_on_hand_quantity);
    if (releaseQuantity === null || returnQuantity === null) throw new Error('Raw inventory return quantities must be whole numbers of stock units.');
    if (!releaseQuantity && !returnQuantity) continue;
    const inventoryId = Number(row.site_item_inventory_id || 0);
    if (!inventoryId) throw new Error(`No raw inventory item is linked to ${row.item_name || row.source_key || 'one resource'}. Leave this line at zero and correct the inventory manually.`);
    if (releaseQuantity && Number(row.can_release_reservation || 0) !== 1) throw new Error(`Reservation release is not available for ${row.item_name || row.source_key || 'this resource'}. Review that item manually.`);
    if (releaseQuantity > Number(row.reserved_quantity || 0)) throw new Error(`Cannot release more than the currently reserved quantity for ${row.item_name || row.source_key || 'this resource'}.`);
    if (returnQuantity && Number(row.can_return_on_hand || 0) !== 1) throw new Error(`Only raw supplies can be physically returned through this product correction. Tools should normally only have reservations released.`);

    const previousOnHand = Number(row.on_hand_quantity || 0);
    const previousReserved = Number(row.reserved_quantity || 0);
    const previousIncoming = Number(row.incoming_quantity || 0);
    const newOnHand = previousOnHand + returnQuantity;
    const newReserved = Math.max(0, previousReserved - releaseQuantity);
    const note = `Product correction/delete #${productId}. ${deletionReason || 'Unused product correction.'}`;

    statements.push(db.prepare(`
      UPDATE site_item_inventory
      SET on_hand_quantity = ?, reserved_quantity = ?, updated_at = CURRENT_TIMESTAMP
      WHERE site_item_inventory_id = ?
    `).bind(newOnHand, newReserved, inventoryId));

    if (inventoryMovementExists) {
      statements.push(db.prepare(`
        INSERT INTO site_inventory_movements (
          site_item_inventory_id, source_type, external_key, item_name, movement_type,
          quantity_delta, previous_on_hand_quantity, new_on_hand_quantity,
          previous_reserved_quantity, new_reserved_quantity,
          previous_incoming_quantity, new_incoming_quantity,
          note, actor_user_id, created_at
        ) VALUES (?, ?, ?, ?, 'correction', ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        inventoryId,
        row.resource_kind || null,
        row.source_key || null,
        row.item_name || null,
        returnQuantity,
        previousOnHand,
        newOnHand,
        previousReserved,
        newReserved,
        previousIncoming,
        previousIncoming,
        note,
        actorUserId || null
      ));
    }

    if (auditExists) {
      if (releaseQuantity) statements.push(db.prepare(`
        INSERT INTO product_material_return_audit (
          product_id_deleted, product_resource_link_id, site_item_inventory_id,
          resource_kind, source_key, item_name, action_key, quantity,
          previous_on_hand_quantity, new_on_hand_quantity,
          previous_reserved_quantity, new_reserved_quantity,
          note, created_by_user_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'release_reservation', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(productId, linkId, inventoryId, row.resource_kind || null, row.source_key || null, row.item_name || null, releaseQuantity, previousOnHand, newOnHand, previousReserved, newReserved, note, actorUserId || null));
      if (returnQuantity) statements.push(db.prepare(`
        INSERT INTO product_material_return_audit (
          product_id_deleted, product_resource_link_id, site_item_inventory_id,
          resource_kind, source_key, item_name, action_key, quantity,
          previous_on_hand_quantity, new_on_hand_quantity,
          previous_reserved_quantity, new_reserved_quantity,
          note, created_by_user_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'return_on_hand', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(productId, linkId, inventoryId, row.resource_kind || null, row.source_key || null, row.item_name || null, returnQuantity, previousOnHand, newOnHand, previousReserved, newReserved, note, actorUserId || null));
    }

    totalRelease += releaseQuantity;
    totalReturn += returnQuantity;
    outputRows.push({
      product_resource_link_id: linkId,
      site_item_inventory_id: inventoryId,
      item_name: row.item_name || row.source_key || '',
      release_quantity: releaseQuantity,
      return_on_hand_quantity: returnQuantity,
      previous_on_hand_quantity: previousOnHand,
      new_on_hand_quantity: newOnHand,
      previous_reserved_quantity: previousReserved,
      new_reserved_quantity: newReserved,
      previous_incoming_quantity: previousIncoming,
      new_incoming_quantity: previousIncoming
    });
  }

  if (statements.length) {
    if (typeof db.batch === 'function') await db.batch(statements);
    else for (const statement of statements) await statement.run();
  }

  return { affected_items: outputRows.length, release_quantity: totalRelease, returned_on_hand_quantity: totalReturn, rows: outputRows };
}

async function runCleanup(db, productId) {
  // These are product-owned working records; removing an unused incorrect draft should
  // remove their D1 rows too. Other non-cascading business references block deletion.
  const cleanupTables = [
    'product_images',
    'product_tags',
    'product_seo',
    'product_resource_links',
    'product_listing_profiles',
    'product_media_role_assignments',
    'product_image_annotations',
    'product_media_score_history',
    'product_image_derivatives',
    'product_publish_qa_results',
    'product_qa_panel_states',
    'product_story_public_notes'
  ];

  const statements = [];
  for (const tableName of cleanupTables) {
    if (!(await tableExists(db, tableName))) continue;
    const columns = await getTableColumnSet(db, tableName);
    if (!columns.has('product_id')) continue;
    statements.push(db.prepare(`DELETE FROM ${quoteIdentifier(tableName)} WHERE product_id = ?`).bind(productId));
  }
  statements.push(db.prepare(`DELETE FROM products WHERE product_id = ?`).bind(productId));

  if (typeof db.batch === 'function') {
    await db.batch(statements);
  } else {
    for (const statement of statements) await statement.run();
  }
}


export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  const authCheck = await requireAdmin(request, env);
  if (authCheck.error) return authCheck.error;
  const url = new URL(request.url);
  const productId = Number(url.searchParams.get('product_id') || 0);
  if (!Number.isInteger(productId) || productId <= 0) return json({ ok: false, error: 'A valid product_id is required.' }, 400);
  const product = await db.prepare(`SELECT product_id, product_number, sku, name, slug, status FROM products WHERE product_id = ? LIMIT 1`).bind(productId).first();
  if (!product) return json({ ok: false, error: 'Product not found.' }, 404);
  const references = await discoverProductReferences(db, productId);
  const blockingReferences = references.filter((row) => row.on_delete !== 'CASCADE');
  const materials = await loadProductMaterialPreview(db, productId);
  return json({
    ok: true,
    product,
    materials,
    deletion_allowed: blockingReferences.length ? 0 : 1,
    blocking_references: blockingReferences,
    instructions: {
      release_reservation: 'Use only for raw stock already reserved for this unfinished product. It makes stock available again without changing on-hand quantity.',
      return_on_hand: 'Use only for unused physical raw supplies that had been removed from on-hand stock and are truly available again. Enter whole stock units.'
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const db = getDb(env);

  const authCheck = await requireAdmin(request, env);
  if (authCheck.error) return authCheck.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const stepUp = await requireAdminStepUp(request, env, authCheck.sessionUser, body, 'product deletion');
  if (!stepUp.ok) return stepUp.response;

  const confirmationPhrase = String(body.confirmation_phrase || '').trim().toUpperCase();
  if (confirmationPhrase !== 'DELETE PRODUCT') {
    return json({
      ok: false,
      error: 'Type DELETE PRODUCT exactly to permanently delete an unused product.',
      requires_typed_confirmation: true
    }, 400);
  }

  const productId = Number(body.product_id);
  if (!Number.isInteger(productId) || productId <= 0) {
    return json({ ok: false, error: "A valid product_id is required." }, 400);
  }

  const existingProduct = await db.prepare(`
    SELECT *
    FROM products
    WHERE product_id = ?
    LIMIT 1
  `).bind(productId).first();

  if (!existingProduct) {
    return json({ ok: false, error: "Product not found." }, 404);
  }

  const references = await discoverProductReferences(db, productId);
  const blockingReferences = references.filter((row) => row.on_delete !== 'CASCADE');
  if (blockingReferences.length) {
    const summary = blockingReferences.map((row) => `${row.count} ${row.table_name}`).join(', ');
    return json({
      ok: false,
      error: `This product has saved business/history references (${summary}) and cannot be permanently deleted. Archive it instead.`,
      requires_archive: true,
      references: blockingReferences
    }, 409);
  }

  const images = await safeProductImages(db, productId);
  const deletionReason = String(body.deletion_reason || '').trim().slice(0, 500) || 'Incorrect or unused product entry.';
  const materialSummary = await applyReviewedMaterialActions(db, {
    productId,
    actions: Array.isArray(body.material_actions) ? body.material_actions : [],
    deletionReason,
    actorUserId: Number(authCheck.sessionUser?.user_id || 0) || null
  });
  const snapshot = {
    product: existingProduct,
    images,
    material_return_summary: materialSummary,
    deleted_from_storefront: true,
    r2_cleanup_note: images.length
      ? 'Image database rows were removed. Review any R2 objects separately before deleting files because media may be reused outside this product.'
      : 'No product image rows were attached.'
  };

  await runCleanup(db, productId);

  if (await tableExists(db, 'product_deletion_audit')) {
    await db.prepare(`
      INSERT INTO product_deletion_audit (
        product_id_deleted, product_number, sku, product_name, product_slug,
        deletion_reason, deleted_by_user_id, product_snapshot_json,
        orphan_media_urls_json, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      productId,
      existingProduct.product_number || null,
      existingProduct.sku || null,
      existingProduct.name || null,
      existingProduct.slug || null,
      deletionReason,
      Number(authCheck.sessionUser?.user_id || 0) || null,
      JSON.stringify(snapshot),
      JSON.stringify(images.map((row) => row.image_url).filter(Boolean))
    ).run().catch(() => null);
  }

  await auditAdminAction(env, request, authCheck.sessionUser, {
    action_type: "product_delete",
    target_type: "product",
    target_id: productId,
    target_key: existingProduct?.slug || existingProduct?.sku || String(productId),
    details: {
      product_number: existingProduct.product_number || null,
      sku: existingProduct.sku || null,
      name: existingProduct.name || null,
      deletion_reason: deletionReason,
      image_row_count: images.length,
      material_return_summary: materialSummary,
      product_snapshot: snapshot
    }
  });

  return json({
    ok: true,
    message: "Unused product deleted. Its product number stays retired and will not be reused.",
    product: existingProduct,
    deleted_media_rows: images.length,
    material_summary: materialSummary,
    r2_cleanup_note: snapshot.r2_cleanup_note
  });
}
