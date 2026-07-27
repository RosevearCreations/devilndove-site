// File: /functions/api/admin/delete-product.js
// Permanent deletion is intentionally limited to unused products. Ordered or referenced
// products stay in history and must be archived instead.

import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse } from "../_lib/adminAudit.js";
import { requireAdminStepUp } from "../_lib/adminStepUp.js";

function json(data, status = 200) { return jsonResponse(data, status); }

const PRODUCT_OWNED_CLEANUP_RELATIONS = new Set([
  'product_images.product_id',
  'product_image_annotations.product_id',
  'product_image_derivatives.product_id',
  'product_tags.product_id',
  'product_seo.product_id',
  'product_resource_links.product_id',
  'product_listing_profiles.product_id',
  'product_media_role_assignments.product_id',
  'product_media_score_history.product_id',
  'product_publish_qa_results.product_id',
  'product_qa_panel_states.product_id',
  'product_qa_bulk_fix_preview_items.product_id',
  'product_detail_visual_polish_checks.product_id',
  'product_story_public_notes.product_id',
  'product_quantity_price_tiers.product_id',
  'product_bundle_settings.bundle_product_id',
  'product_bundle_components.bundle_product_id',
  'product_cost_profiles.product_id',
  'product_cost_margin_review_rows.product_id',
  'product_margin_warning_rows.product_id',
  'product_story_notes.product_id',
  'custom_candle_soap_product_specs.product_id',
  'marketplace_export_image_selections.product_id',
  'marketplace_export_row_validation_results.product_id'
]);

// These records are useful independently of a disposable product row. Preserve them and
// remove only the product association when permanent cleanup is allowed.
const PRODUCT_DETACH_RELATIONS = new Set([
  'media_assets.product_id',
  'mobile_resumable_upload_runtime_rows.attached_product_id',
  'mobile_resumable_upload_sessions.product_id'
]);

// A permissive FK action such as SET NULL or CASCADE must not make customer, accounting,
// publishing or project history disposable. These relations always block permanent removal.
const PROTECTED_PRODUCT_REFERENCES = new Set([
  'order_items.product_id',
  'creative_projects.product_id',
  'content_projects.product_id',
  'creative_project_cost_allocations.product_id',
  'accounting_overhead_product_allocations.product_id',
  'packaging_projects.product_id',
  'product_bundle_components.component_product_id',
  'marketplace_margin_override_history.product_id',
  'product_media_change_audit.product_id',
  'approved_before_after_gallery_items.product_id',
  'customer_story_approval_batches.product_id',
  'customer_story_output_drafts.product_id',
  'public_proof_candidates.product_id',
  'recall_customer_match_previews.product_id',
  'trust_block_items.related_product_id'
]);

const EXPLICIT_PRODUCT_RELATIONS = new Set([
  ...PRODUCT_OWNED_CLEANUP_RELATIONS,
  ...PRODUCT_DETACH_RELATIONS,
  ...PROTECTED_PRODUCT_REFERENCES
]);

function relationKey(row = {}) {
  return `${String(row.table_name || '')}.${String(row.column_name || '')}`;
}

function isAutomaticallySafeReference(row = {}) {
  const key = relationKey(row);
  if (PROTECTED_PRODUCT_REFERENCES.has(key)) return false;
  if (PRODUCT_OWNED_CLEANUP_RELATIONS.has(key) || PRODUCT_DETACH_RELATIONS.has(key)) return true;
  const onDelete = String(row.on_delete || 'NO ACTION').toUpperCase();
  return ['CASCADE', 'SET NULL', 'SET DEFAULT'].includes(onDelete);
}

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
  const tables = Array.isArray(tablesResult?.results)
    ? tablesResult.results.map((row) => String(row?.name || '')).filter(Boolean)
    : [];
  const tableSet = new Set(tables);
  const references = [];
  const seen = new Set();

  async function addReference(tableName, columnName, onDelete = 'NO FOREIGN KEY') {
    const key = `${tableName}.${columnName}`;
    if (seen.has(key) || tableName === 'products' || tableName === 'product_deletion_audit') return;
    if (!tableSet.has(tableName)) return;
    const columns = await getTableColumnSet(db, tableName);
    if (!columns.has(columnName)) return;
    let count = 0;
    try {
      const row = await db.prepare(`
        SELECT COUNT(*) AS count
        FROM ${quoteIdentifier(tableName)}
        WHERE ${quoteIdentifier(columnName)} = ?
      `).bind(productId).first();
      count = Number(row?.count || 0);
    } catch {
      count = 0;
    }
    seen.add(key);
    if (count < 1) return;
    const reference = {
      table_name: tableName,
      column_name: columnName,
      count,
      on_delete: String(onDelete || 'NO FOREIGN KEY').toUpperCase()
    };
    reference.cleanup_owned = PRODUCT_OWNED_CLEANUP_RELATIONS.has(key) ? 1 : 0;
    reference.detach_preserved = PRODUCT_DETACH_RELATIONS.has(key) ? 1 : 0;
    reference.protected_history = PROTECTED_PRODUCT_REFERENCES.has(key) ? 1 : 0;
    reference.automatically_safe = isAutomaticallySafeReference(reference) ? 1 : 0;
    references.push(reference);
  }

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
      await addReference(tableName, childColumn, foreignKey?.on_delete || 'NO ACTION');
    }
  }

  // Older migrations contain a few product references without declared foreign keys.
  // Scan the explicit allow/block lists as well so they cannot become invisible or orphaned.
  for (const key of EXPLICIT_PRODUCT_RELATIONS) {
    const separator = key.lastIndexOf('.');
    if (separator < 1) continue;
    await addReference(key.slice(0, separator), key.slice(separator + 1), 'NO FOREIGN KEY');
  }

  return references.sort((a, b) => {
    if (Number(b.protected_history || 0) !== Number(a.protected_history || 0)) {
      return Number(b.protected_history || 0) - Number(a.protected_history || 0);
    }
    return `${a.table_name}.${a.column_name}`.localeCompare(`${b.table_name}.${b.column_name}`);
  });
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

function materialRowsRequiringReview(materials = []) {
  return materials.filter((row) => {
    const suggestedRelease = Number(row?.suggested_release_quantity || 0);
    const reserved = Number(row?.reserved_quantity || 0);
    const linkedQuantity = Number(row?.quantity_used || 0);
    return suggestedRelease > 0 || (reserved > 0 && linkedQuantity > 0 && Number(row?.can_release_reservation || 0) !== 1);
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
  // Delete only product-owned working rows. Preserve independent uploads/media by
  // detaching them, and never reach this function while protected history exists.
  const statements = [];

  for (const key of PRODUCT_OWNED_CLEANUP_RELATIONS) {
    const separator = key.lastIndexOf('.');
    const tableName = key.slice(0, separator);
    const columnName = key.slice(separator + 1);
    if (!(await tableExists(db, tableName))) continue;
    const columns = await getTableColumnSet(db, tableName);
    if (!columns.has(columnName)) continue;
    statements.push(db.prepare(
      `DELETE FROM ${quoteIdentifier(tableName)} WHERE ${quoteIdentifier(columnName)} = ?`
    ).bind(productId));
  }

  for (const key of PRODUCT_DETACH_RELATIONS) {
    const separator = key.lastIndexOf('.');
    const tableName = key.slice(0, separator);
    const columnName = key.slice(separator + 1);
    if (!(await tableExists(db, tableName))) continue;
    const columns = await getTableColumnSet(db, tableName);
    if (!columns.has(columnName)) continue;
    statements.push(db.prepare(
      `UPDATE ${quoteIdentifier(tableName)} SET ${quoteIdentifier(columnName)} = NULL WHERE ${quoteIdentifier(columnName)} = ?`
    ).bind(productId));
  }

  statements.push(db.prepare(`DELETE FROM products WHERE product_id = ?`).bind(productId));

  if (typeof db.batch === 'function') {
    const results = await db.batch(statements);
    const productDeleteResult = Array.isArray(results) ? results[results.length - 1] : null;
    if (productDeleteResult && Number(productDeleteResult?.meta?.changes || 0) < 1) {
      throw new Error('The product was not removed. Refresh the cleanup preflight and try again.');
    }
  } else {
    for (let index = 0; index < statements.length; index += 1) {
      const result = await statements[index].run();
      if (index === statements.length - 1 && Number(result?.meta?.changes || 0) < 1) {
        throw new Error('The product was not removed. Refresh the cleanup preflight and try again.');
      }
    }
  }
}


async function handleGet(context) {
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
  const blockingReferences = references.filter((row) => !isAutomaticallySafeReference(row));
  const materials = await loadProductMaterialPreview(db, productId);
  const materialsRequiringReview = materialRowsRequiringReview(materials);
  return json({
    ok: true,
    product,
    materials,
    materials_requiring_review: materialsRequiringReview,
    material_review_required: materialsRequiringReview.length ? 1 : 0,
    deletion_allowed: blockingReferences.length ? 0 : 1,
    references,
    blocking_references: blockingReferences,
    automatically_safe_references: references.filter((row) => isAutomaticallySafeReference(row)),
    instructions: {
      release_reservation: 'Use only for raw stock already reserved for this unfinished product. It makes stock available again without changing on-hand quantity.',
      return_on_hand: 'Use only for unused physical raw supplies that had been removed from on-hand stock and are truly available again. Enter whole stock units.'
    }
  });
}

async function handlePost(context) {
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
  const blockingReferences = references.filter((row) => !isAutomaticallySafeReference(row));
  if (blockingReferences.length) {
    const summary = blockingReferences.map((row) => `${row.count} ${row.table_name}`).join(', ');
    return json({
      ok: false,
      error: `This product has saved business/history references (${summary}) and cannot be permanently deleted. Archive it instead.`,
      requires_archive: true,
      references: blockingReferences
    }, 409);
  }

  const materialPreview = await loadProductMaterialPreview(db, productId);
  const materialReviewRows = materialRowsRequiringReview(materialPreview);
  if (materialReviewRows.length && Number(body.material_review_confirmed || 0) !== 1) {
    return json({
      ok: false,
      error: 'Linked material rows may involve reserved stock. Open Correct / remove, review the quantities, and confirm the material review before deletion.',
      requires_material_review: true,
      materials_requiring_review: materialReviewRows
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

export async function onRequestGet(context) {
  try {
    return await handleGet(context);
  } catch (error) {
    const adminUser = await getAdminUserFromRequest(context.request, context.env).catch(() => null);
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'product_cleanup',
      incident_code: 'product_delete_preflight_failed',
      severity: 'error',
      message: error?.message || 'Product deletion preflight failed.',
      related_user_id: adminUser?.user_id || null,
      details: { error: String(error?.stack || error) }
    }).catch(() => null);
    return json({ ok: false, error: 'Product removal preflight could not complete. No product was changed.' }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    return await handlePost(context);
  } catch (error) {
    const adminUser = await getAdminUserFromRequest(context.request, context.env).catch(() => null);
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'product_cleanup',
      incident_code: 'product_delete_failed',
      severity: 'error',
      message: error?.message || 'Product deletion failed.',
      related_user_id: adminUser?.user_id || null,
      details: { error: String(error?.stack || error) }
    }).catch(() => null);
    return json({ ok: false, error: 'Product removal failed safely. The product may still exist; refresh the cleanup list before trying again.' }, 500);
  }
}
