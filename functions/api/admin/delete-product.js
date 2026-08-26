// File: /functions/api/admin/delete-product.js
// Build 232: resource-bounded correction preflight and atomic reviewed removal.
// Permanent deletion is intentionally limited to unused products. Ordered or referenced
// products stay in history and must be archived instead.

import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse } from "../_lib/adminAudit.js";
import { requireAdminStepUp } from "../_lib/adminStepUp.js";

function json(data, status = 200) { return jsonResponse(data, status); }

const PRODUCT_OWNED_CLEANUP_RELATIONS = new Set([
  'product_images.product_id',
  'product_image_annotations.product_id',
  'product_image_derivatives.product_id',
  'product_review_actions.product_id',
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
  'marketplace_export_row_validation_results.product_id',
  'creative_project_product_links.product_id',
  'product_media_change_audit.product_id',
  'product_media_integrity_snapshots.product_id'
]);

// These records are useful independently of a disposable product row. Preserve them and
// remove only the product association when permanent cleanup is allowed.
const PRODUCT_DETACH_RELATIONS = new Set([
  'media_assets.product_id',
  'mobile_resumable_upload_runtime_rows.attached_product_id',
  'mobile_resumable_upload_sessions.product_id',
  'soap_products.product_id'
]);

// A permissive FK action such as SET NULL or CASCADE must not make customer, accounting,
// publishing or project history disposable. These relations always block permanent removal.
const PROTECTED_PRODUCT_REFERENCES = new Set([
  'order_items.product_id',
  'product_production_runs.product_id',
  'creative_project_cost_allocations.product_id',
  'accounting_overhead_product_allocations.product_id',
  'product_costs.product_id',
  'packaging_projects.product_id',
  'product_bundle_components.component_product_id',
  'marketplace_margin_override_history.product_id',
  'approved_before_after_gallery_items.product_id',
  'customer_story_approval_batches.product_id',
  'customer_story_output_drafts.product_id',
  'public_proof_candidates.product_id',
  'recall_customer_match_previews.product_id',
  'trust_block_items.related_product_id'
]);

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


async function discoverManagedProductProjectShells(db, productId) {
  const safeReferences = [];
  const blockingReferences = [];
  const contentProjectIds = [];
  const creativeProjectIds = [];

  // Product approval can automatically create Content Studio + CAIP rows. Those generated
  // shells should not make an otherwise-unused product undeletable. We only auto-clean
  // shells that have never been reviewed, published, rendered, linked to a provider output,
  // or deliberately edited by an operator.
  try {
    const contentRows = (await db.prepare(`
      SELECT cp.*,
        (SELECT COUNT(*) FROM content_publications pub
          WHERE pub.content_project_id=cp.content_project_id
            AND (
              COALESCE(pub.content_status,'draft')<>'draft'
              OR pub.approved_at IS NOT NULL OR pub.published_at IS NOT NULL
              OR COALESCE(pub.copy_locked,0)<>0
              OR TRIM(COALESCE(pub.review_notes,''))<>''
            )) AS meaningful_publication_count,
        (SELECT COUNT(*) FROM content_project_deliverables d
          WHERE d.content_project_id=cp.content_project_id
            AND (
              COALESCE(d.approval_status,'needs_review')<>'needs_review'
              OR d.approved_at IS NOT NULL OR d.published_at IS NOT NULL
              OR d.social_post_queue_id IS NOT NULL
              OR COALESCE(d.copy_locked,0)<>0
              OR TRIM(COALESCE(d.review_notes,''))<>''
              OR TRIM(COALESCE(d.output_url,''))<>''
              OR TRIM(COALESCE(d.thumbnail_url,''))<>''
            )) AS meaningful_deliverable_count,
        (SELECT COUNT(*) FROM content_render_jobs j
          INNER JOIN content_project_deliverables d
            ON d.content_project_deliverable_id=j.content_project_deliverable_id
          WHERE d.content_project_id=cp.content_project_id
            AND (
              COALESCE(j.render_status,'planned')<>'planned'
              OR TRIM(COALESCE(j.output_url,''))<>''
              OR j.completed_at IS NOT NULL
            )) AS meaningful_render_count
      FROM content_projects cp
      WHERE cp.product_id=? AND LOWER(TRIM(COALESCE(cp.source_type,'')))='product'
    `).bind(productId).all())?.results || [];

    for (const row of contentRows) {
      const meaningful = (
        String(row.project_status || 'draft').toLowerCase() !== 'draft'
        || String(row.review_status || 'needs_review').toLowerCase() !== 'needs_review'
        || String(row.public_release_status || 'private').toLowerCase() !== 'private'
        || row.approved_at != null || row.approved_by_user_id != null
        || String(row.internal_notes || '').trim() !== ''
        || Number(row.meaningful_publication_count || 0) > 0
        || Number(row.meaningful_deliverable_count || 0) > 0
        || Number(row.meaningful_render_count || 0) > 0
      );
      const reference = {
        table_name: 'content_projects',
        column_name: 'product_id',
        count: 1,
        on_delete: meaningful ? 'PROTECTED' : 'AUTO_CLEAN_GENERATED_SHELL',
        cleanup_owned: meaningful ? 0 : 1,
        detach_preserved: 0,
        protected_history: meaningful ? 1 : 0,
        automatically_safe: meaningful ? 0 : 1,
        record_id: Number(row.content_project_id || 0),
        reason: meaningful
          ? 'Content Studio work has review/publication/render evidence.'
          : 'Auto-generated, unreviewed product Content Studio shell.'
      };
      if (meaningful) blockingReferences.push(reference);
      else {
        contentProjectIds.push(Number(row.content_project_id || 0));
        safeReferences.push(reference);
      }
    }
  } catch {
    // Optional legacy schemas may not have the Content Studio tables.
  }

  try {
    const creativeRows = (await db.prepare(`
      SELECT cp.*,
        (SELECT COUNT(*) FROM creative_asset_recommendations r
          WHERE r.creative_project_id=cp.creative_project_id
            AND (COALESCE(r.recommendation_status,'needs_review')<>'needs_review' OR r.reviewed_at IS NOT NULL OR r.reviewed_by_user_id IS NOT NULL)
        ) AS meaningful_recommendation_count,
        (SELECT COUNT(*) FROM creative_story_evidence e
          WHERE e.creative_project_id=cp.creative_project_id
            AND (COALESCE(e.review_status,'needs_review')<>'needs_review' OR COALESCE(e.copy_locked,0)<>0)
        ) AS meaningful_evidence_count,
        (SELECT COUNT(*) FROM creative_story_segments s
          WHERE s.creative_project_id=cp.creative_project_id
            AND (
              COALESCE(s.segment_status,'draft')<>'draft'
              OR COALESCE(s.copy_locked,0)<>0
              OR s.approved_at IS NOT NULL OR s.approved_by_user_id IS NOT NULL
              OR TRIM(COALESCE(s.reviewer_notes,''))<>''
            )
        ) AS meaningful_segment_count,
        (SELECT COUNT(*) FROM creative_policy_decisions d
          WHERE d.creative_project_id=cp.creative_project_id
            AND (
              COALESCE(d.decision_status,'needs_review')<>'needs_review'
              OR d.decided_at IS NOT NULL OR d.decided_by_user_id IS NOT NULL
            )
        ) AS meaningful_policy_count,
        (SELECT COUNT(*) FROM creative_asset_derivatives d
          WHERE d.creative_project_id=cp.creative_project_id
            AND (
              COALESCE(d.derivative_status,'planned')<>'planned'
              OR TRIM(COALESCE(d.output_url,''))<>''
              OR COALESCE(d.verification_status,'not_created')<>'not_created'
            )
        ) AS meaningful_derivative_count,
        (SELECT COUNT(*) FROM creative_asset_access_grants g
          WHERE g.creative_project_id=cp.creative_project_id
        ) AS access_grant_count
      FROM creative_projects cp
      WHERE cp.product_id=? AND LOWER(TRIM(COALESCE(cp.source_type,'')))='product'
    `).bind(productId).all())?.results || [];

    for (const row of creativeRows) {
      const meaningful = (
        String(row.project_status || 'intake').toLowerCase() !== 'intake'
        || String(row.governance_status || 'needs_review').toLowerCase() !== 'needs_review'
        || String(row.lifecycle_stage || 'intake').toLowerCase() !== 'intake'
        || row.approved_at != null || row.approved_by_user_id != null
        || Number(row.meaningful_recommendation_count || 0) > 0
        || Number(row.meaningful_evidence_count || 0) > 0
        || Number(row.meaningful_segment_count || 0) > 0
        || Number(row.meaningful_policy_count || 0) > 0
        || Number(row.meaningful_derivative_count || 0) > 0
        || Number(row.access_grant_count || 0) > 0
      );
      const reference = {
        table_name: 'creative_projects',
        column_name: 'product_id',
        count: 1,
        on_delete: meaningful ? 'PROTECTED' : 'AUTO_CLEAN_GENERATED_SHELL',
        cleanup_owned: meaningful ? 0 : 1,
        detach_preserved: 0,
        protected_history: meaningful ? 1 : 0,
        automatically_safe: meaningful ? 0 : 1,
        record_id: Number(row.creative_project_id || 0),
        reason: meaningful
          ? 'CAIP project has reviewed/approved/output/access evidence.'
          : 'Auto-generated, unreviewed product CAIP shell.'
      };
      if (meaningful) blockingReferences.push(reference);
      else {
        creativeProjectIds.push(Number(row.creative_project_id || 0));
        safeReferences.push(reference);
      }
    }
  } catch {
    // Optional legacy schemas may not have the CAIP tables.
  }

  return {
    safe_references: safeReferences,
    blocking_references: blockingReferences,
    content_project_ids: contentProjectIds.filter(Boolean),
    creative_project_ids: creativeProjectIds.filter(Boolean)
  };
}

async function discoverProductReferences(db, productId) {
  // Only retained business/history relations can block deletion. Product-owned editor
  // rows and detachable media are cleaned in the final atomic batch, so enumerating
  // every D1 table and foreign key here added hundreds of calls without improving safety.
  const references = await Promise.all([...PROTECTED_PRODUCT_REFERENCES].map(async (key) => {
    const separator = key.lastIndexOf('.');
    const tableName = key.slice(0, separator);
    const columnName = key.slice(separator + 1);
    try {
      const row = await db.prepare(`
        SELECT COUNT(*) AS count
        FROM ${quoteIdentifier(tableName)}
        WHERE ${quoteIdentifier(columnName)} = ?
      `).bind(productId).first();
      const count = Number(row?.count || 0);
      if (count < 1) return null;
      return {
        table_name: tableName,
        column_name: columnName,
        count,
        on_delete: 'PROTECTED',
        cleanup_owned: 0,
        detach_preserved: 0,
        protected_history: 1,
        automatically_safe: 0
      };
    } catch {
      // An older schema may not have this optional history table. The offline Build 232
      // registry test ensures every product FK in current aggregate schemas is classified.
      return null;
    }
  }));
  return references.filter(Boolean).sort((a, b) => `${a.table_name}.${a.column_name}`.localeCompare(`${b.table_name}.${b.column_name}`));
}

async function safeProductImages(db, productId) {
  try {
    const result = await db.prepare(`SELECT * FROM product_images WHERE product_id = ? LIMIT 20`).bind(productId).all();
    return (Array.isArray(result?.results) ? result.results : []).sort((a, b) => {
      const orderA = Number(a?.display_order ?? a?.sort_order ?? a?.product_image_id ?? 0);
      const orderB = Number(b?.display_order ?? b?.sort_order ?? b?.product_image_id ?? 0);
      return orderA - orderB;
    });
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

async function loadTableSqlMap(db, tableNames = []) {
  const names = [...new Set(tableNames.map((value) => String(value || '').trim()).filter(Boolean))];
  if (!names.length) return new Map();
  const placeholders = names.map(() => '?').join(',');
  const result = await db.prepare(`
    SELECT name, sql
    FROM sqlite_master
    WHERE type = 'table' AND name IN (${placeholders})
  `).bind(...names).all().catch(() => ({ results: [] }));
  return new Map((Array.isArray(result?.results) ? result.results : []).map((row) => [String(row?.name || ''), String(row?.sql || '')]));
}

function tableSqlHasColumn(createSql, columnName) {
  const escaped = String(columnName || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[,\\(]\\s*)[\"\`\\[]?${escaped}[\"\`\\]]?(?:\\s|,|\\))`, 'im').test(String(createSql || ''));
}

async function loadProductMaterialPreview(db, productId) {
  const result = await db.prepare(`
    SELECT
      prl.*,
      sii.*,
      prl.product_resource_link_id,
      prl.resource_kind,
      prl.source_key,
      COALESCE(prl.quantity_used, 0) AS quantity_used,
      sii.site_item_inventory_id,
      sii.item_name,
      COALESCE(sii.on_hand_quantity, 0) AS on_hand_quantity,
      COALESCE(sii.reserved_quantity, 0) AS reserved_quantity,
      COALESCE(sii.incoming_quantity, 0) AS incoming_quantity,
      COALESCE(sii.unit_cost_cents, 0) AS unit_cost_cents
    FROM product_resource_links prl
    LEFT JOIN site_item_inventory sii
      ON sii.source_type = prl.resource_kind
     AND sii.external_key = prl.source_key
    WHERE prl.product_id = ?
    ORDER BY prl.product_resource_link_id ASC
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

async function prepareReviewedMaterialActions(db, { productId, actions = [], deletionReason = '', actorUserId = null }) {
  if (!Array.isArray(actions) || !actions.length) {
    return { summary: { affected_items: 0, release_quantity: 0, returned_on_hand_quantity: 0, rows: [] }, statements: [] };
  }
  const previewRows = await loadProductMaterialPreview(db, productId);
  const rowByLink = new Map(previewRows.map((row) => [Number(row.product_resource_link_id || 0), row]));
  await ensureMaterialReturnAuditTable(db);
  const actionTables = await loadTableSqlMap(db, ['site_inventory_movements', 'product_material_return_audit']);
  const inventoryMovementExists = actionTables.has('site_inventory_movements');
  const auditExists = actionTables.has('product_material_return_audit');
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

  return {
    summary: { affected_items: outputRows.length, release_quantity: totalRelease, returned_on_hand_quantity: totalReturn, rows: outputRows },
    statements
  };
}

async function runCleanup(db, productId, prefixStatements = [], managedShells = null) {
  // Delete only product-owned working rows. Preserve independent uploads/media by
  // detaching them. Auto-generated, unreviewed product Content Studio/CAIP shells
  // are also product-owned automation rows and are removed before the product.
  const statements = [...prefixStatements];
  for (const creativeProjectId of (managedShells?.creative_project_ids || [])) {
    statements.push(db.prepare(`DELETE FROM creative_projects WHERE creative_project_id = ?`).bind(Number(creativeProjectId)));
  }
  for (const contentProjectId of (managedShells?.content_project_ids || [])) {
    statements.push(db.prepare(`DELETE FROM content_projects WHERE content_project_id = ?`).bind(Number(contentProjectId)));
  }
  const relationKeys = [...PRODUCT_OWNED_CLEANUP_RELATIONS, ...PRODUCT_DETACH_RELATIONS];
  const relationTables = relationKeys.map((key) => key.slice(0, key.lastIndexOf('.')));
  const tableSql = await loadTableSqlMap(db, relationTables);

  for (const key of PRODUCT_OWNED_CLEANUP_RELATIONS) {
    const separator = key.lastIndexOf('.');
    const tableName = key.slice(0, separator);
    const columnName = key.slice(separator + 1);
    if (!tableSqlHasColumn(tableSql.get(tableName), columnName)) continue;
    statements.push(db.prepare(
      `DELETE FROM ${quoteIdentifier(tableName)} WHERE ${quoteIdentifier(columnName)} = ?`
    ).bind(productId));
  }

  for (const key of PRODUCT_DETACH_RELATIONS) {
    const separator = key.lastIndexOf('.');
    const tableName = key.slice(0, separator);
    const columnName = key.slice(separator + 1);
    if (!tableSqlHasColumn(tableSql.get(tableName), columnName)) continue;
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
  const [references, materials, managedShells] = await Promise.all([
    discoverProductReferences(db, productId),
    loadProductMaterialPreview(db, productId),
    discoverManagedProductProjectShells(db, productId)
  ]);
  const blockingReferences = [...references, ...(managedShells.blocking_references || [])];
  const materialsRequiringReview = materialRowsRequiringReview(materials);
  return json({
    ok: true,
    product,
    materials,
    materials_requiring_review: materialsRequiringReview,
    material_review_required: materialsRequiringReview.length ? 1 : 0,
    deletion_allowed: blockingReferences.length ? 0 : 1,
    references: [...blockingReferences, ...(managedShells.safe_references || [])],
    blocking_references: blockingReferences,
    automatically_safe_references: managedShells.safe_references || [],
    generated_project_shells: {
      content_project_ids: managedShells.content_project_ids || [],
      creative_project_ids: managedShells.creative_project_ids || []
    },
    cleanup_profile: 'bounded_registry_v2_generated_shell_cleanup',
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

  const [references, managedShells] = await Promise.all([
    discoverProductReferences(db, productId),
    discoverManagedProductProjectShells(db, productId)
  ]);
  const blockingReferences = [...references, ...(managedShells.blocking_references || [])];
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
  const materialPlan = await prepareReviewedMaterialActions(db, {
    productId,
    actions: Array.isArray(body.material_actions) ? body.material_actions : [],
    deletionReason,
    actorUserId: Number(authCheck.sessionUser?.user_id || 0) || null
  });
  const materialSummary = materialPlan.summary;
  const snapshot = {
    product: existingProduct,
    images,
    material_return_summary: materialSummary,
    automatically_removed_generated_project_shells: managedShells.safe_references || [],
    deleted_from_storefront: true,
    r2_cleanup_note: images.length
      ? 'Image database rows were removed. Review any R2 objects separately before deleting files because media may be reused outside this product.'
      : 'No product image rows were attached.'
  };

  await runCleanup(db, productId, materialPlan.statements, managedShells);

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
    r2_cleanup_note: snapshot.r2_cleanup_note,
    automatically_removed_generated_project_shells: managedShells.safe_references || []
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