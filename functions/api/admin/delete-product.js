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
// publishing, inventory provenance or project history disposable. These relations always
// block permanent removal.
const PROTECTED_PRODUCT_REFERENCES = new Set([
  'order_items.product_id',
  'product_production_runs.product_id',
  'product_finished_inventory_lots.product_id',
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
            AND COALESCE(g.is_revoked,0)=0
        ) AS active_grant_count
      FROM creative_projects cp
      WHERE cp.product_id=?
    `).bind(productId).all())?.results || [];

    for (const row of creativeRows) {
      const meaningful = (
        String(row.project_status || 'draft').toLowerCase() !== 'draft'
        || String(row.review_status || 'needs_review').toLowerCase() !== 'needs_review'
        || row.reviewed_at != null || row.reviewed_by_user_id != null
        || String(row.notes || '').trim() !== ''
        || Number(row.meaningful_recommendation_count || 0) > 0
        || Number(row.meaningful_evidence_count || 0) > 0
        || Number(row.meaningful_segment_count || 0) > 0
        || Number(row.meaningful_policy_count || 0) > 0
        || Number(row.meaningful_derivative_count || 0) > 0
        || Number(row.active_grant_count || 0) > 0
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
          ? 'CAIP / Creative project contains reviewed work, evidence, derivatives, or grants.'
          : 'Auto-generated, unreviewed product CAIP / Creative project shell.'
      };
      if (meaningful) blockingReferences.push(reference);
      else {
        creativeProjectIds.push(Number(row.creative_project_id || 0));
        safeReferences.push(reference);
      }
    }
  } catch {
    // Optional legacy schemas may not have the Creative/CAIP tables.
  }

  return {
    safe_references: safeReferences,
    blocking_references: blockingReferences,
    content_project_ids: contentProjectIds,
    creative_project_ids: creativeProjectIds
  };
}

async function collectReferences(db, productId) {
  const references = [];
  const relationGroups = [
    [PRODUCT_OWNED_CLEANUP_RELATIONS, 'OWNED_CLEANUP'],
    [PRODUCT_DETACH_RELATIONS, 'DETACH_PRESERVED'],
    [PROTECTED_PRODUCT_REFERENCES, 'PROTECTED']
  ];
  for (const [relations, onDelete] of relationGroups) {
    for (const relation of relations) {
      const [tableName, columnName] = relation.split('.');
      try {
        const row = await db.prepare(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(tableName)} WHERE ${quoteIdentifier(columnName)} = ?`).bind(productId).first();
        const count = Number(row?.count || 0);
        if (!count) continue;
        references.push({
          table_name: tableName,
          column_name: columnName,
          count,
          on_delete: onDelete,
          cleanup_owned: onDelete === 'OWNED_CLEANUP' ? 1 : 0,
          detach_preserved: onDelete === 'DETACH_PRESERVED' ? 1 : 0,
          protected_history: onDelete === 'PROTECTED' ? 1 : 0,
          automatically_safe: onDelete === 'PROTECTED' ? 0 : 1,
          reason: onDelete === 'PROTECTED'
            ? 'Protected business/history reference. Archive the product instead of deleting this evidence.'
            : onDelete === 'DETACH_PRESERVED'
              ? 'Reusable/preserved record will be detached from the Product instead of deleted.'
              : 'Product-owned disposable record is included in bounded cleanup.'
        });
      } catch {
        // Optional schema families can be absent on older databases. Missing tables do not add references.
      }
    }
  }
  const managed = await discoverManagedProductProjectShells(db, productId);
  return {
    references,
    managed
  };
}

async function loadProduct(db, productId) {
  return db.prepare(`SELECT * FROM products WHERE product_id = ? LIMIT 1`).bind(productId).first();
}

async function loadMaterialReview(db, productId) {
  try {
    const result = await db.prepare(`
      SELECT prl.product_resource_link_id,prl.product_id,prl.resource_kind,prl.source_key,prl.quantity_used,
             COALESCE(prl.consumption_mode,'per_unit') AS consumption_mode,
             sii.site_item_inventory_id,sii.item_name,
             COALESCE(sii.on_hand_quantity,0) AS on_hand_quantity,
             COALESCE(sii.reserved_quantity,0) AS reserved_quantity,
             COALESCE(sii.incoming_quantity,0) AS incoming_quantity,
             COALESCE(sii.unit_cost_cents,0) AS unit_cost_cents,
             COALESCE(sii.usage_units_per_stock_unit,1) AS usage_units_per_stock_unit,
             COALESCE(sii.stock_unit_label,'unit') AS stock_unit_label,
             COALESCE(sii.usage_unit_label,'unit') AS usage_unit_label
      FROM product_resource_links prl
      LEFT JOIN site_item_inventory sii
        ON LOWER(COALESCE(sii.source_type,''))=LOWER(prl.resource_kind)
       AND sii.external_key=prl.source_key
      WHERE prl.product_id=?
      ORDER BY prl.product_resource_link_id ASC
    `).bind(productId).all();
    const rows = Array.isArray(result?.results) ? result.results : [];
    return rows.map((row) => {
      const linkId = Number(row.product_resource_link_id || 0);
      const inventoryId = Number(row.site_item_inventory_id || 0);
      const reserved = Math.max(0, Number(row.reserved_quantity || 0));
      const requested = Math.max(0, Number(row.quantity_used || 0));
      const usageUnits = Math.max(0.000001, Number(row.usage_units_per_stock_unit || 1) || 1);
      const stockEquivalent = requested / usageUnits;
      return {
        ...row,
        product_resource_link_id: linkId,
        site_item_inventory_id: inventoryId || null,
        reserved_quantity: reserved,
        requested_usage_quantity: requested,
        stock_equivalent_quantity: stockEquivalent,
        has_inventory_link: inventoryId ? 1 : 0,
        reservation_release_candidate: inventoryId && reserved > 0 ? Math.min(reserved, stockEquivalent || reserved) : 0
      };
    });
  } catch {
    return [];
  }
}

async function resolveMaterialPlan(db, productId, body) {
  const review = await loadMaterialReview(db, productId);
  const actions = Array.isArray(body?.material_actions) ? body.material_actions : [];
  const byLink = new Map(actions.map((action) => [Number(action?.product_resource_link_id || 0), action]));
  const statements = [];
  const summary = {
    reviewed_count: review.length,
    released_reservation_count: 0,
    returned_on_hand_count: 0,
    release_quantity: 0,
    return_quantity: 0
  };

  if (review.length && Number(body?.material_review_confirmed || 0) !== 1) {
    return {
      ok: false,
      error: 'Linked product materials must be reviewed before permanent product removal.',
      code: 'material_review_required',
      status: 409,
      review
    };
  }

  for (const material of review) {
    const action = byLink.get(Number(material.product_resource_link_id || 0));
    if (!action) {
      return {
        ok: false,
        error: `Choose a material action for ${material.item_name || material.source_key || 'linked material'}.`,
        code: 'material_action_required',
        status: 409,
        review
      };
    }
    const inventoryId = Number(material.site_item_inventory_id || 0);
    const releaseQuantity = Math.max(0, Number(action.release_quantity || 0));
    const returnQuantity = Math.max(0, Number(action.return_on_hand_quantity || 0));
    if ((releaseQuantity > 0 || returnQuantity > 0) && !inventoryId) {
      return {
        ok: false,
        error: `${material.item_name || material.source_key || 'Linked material'} has no Inventory row to adjust.`,
        code: 'material_inventory_missing',
        status: 409,
        review
      };
    }
    if (releaseQuantity > Number(material.reserved_quantity || 0) + 0.000001) {
      return {
        ok: false,
        error: `Reservation release for ${material.item_name || material.source_key || 'linked material'} exceeds the current reserved quantity.`,
        code: 'material_release_exceeds_reserved',
        status: 409,
        review
      };
    }
    if (releaseQuantity > 0) {
      statements.push(db.prepare(`
        UPDATE site_item_inventory
        SET reserved_quantity=MAX(0,COALESCE(reserved_quantity,0)-?),updated_at=CURRENT_TIMESTAMP
        WHERE site_item_inventory_id=? AND COALESCE(reserved_quantity,0)>=?
      `).bind(releaseQuantity, inventoryId, releaseQuantity));
      summary.released_reservation_count += 1;
      summary.release_quantity += releaseQuantity;
    }
    if (returnQuantity > 0) {
      statements.push(db.prepare(`
        UPDATE site_item_inventory
        SET on_hand_quantity=COALESCE(on_hand_quantity,0)+?,updated_at=CURRENT_TIMESTAMP
        WHERE site_item_inventory_id=?
      `).bind(returnQuantity, inventoryId));
      statements.push(db.prepare(`
        INSERT INTO site_inventory_movements(
          site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,
          previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,
          previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at
        )
        SELECT site_item_inventory_id,source_type,external_key,item_name,'correction',?,
               COALESCE(on_hand_quantity,0)-?,COALESCE(on_hand_quantity,0),
               COALESCE(reserved_quantity,0),COALESCE(reserved_quantity,0),
               COALESCE(incoming_quantity,0),COALESCE(incoming_quantity,0),?,NULL,CURRENT_TIMESTAMP
        FROM site_item_inventory WHERE site_item_inventory_id=?
      `).bind(returnQuantity, returnQuantity, `Returned during permanent cleanup of unused Product #${productId}.`, inventoryId));
      summary.returned_on_hand_count += 1;
      summary.return_quantity += returnQuantity;
    }
  }

  return { ok: true, review, statements, summary };
}

async function runCleanup(db, productId, materialStatements = [], managedShells = {}) {
  const statements = [...materialStatements];
  for (const relation of PRODUCT_OWNED_CLEANUP_RELATIONS) {
    const [tableName, columnName] = relation.split('.');
    statements.push(db.prepare(`DELETE FROM ${quoteIdentifier(tableName)} WHERE ${quoteIdentifier(columnName)} = ?`).bind(productId));
  }
  for (const relation of PRODUCT_DETACH_RELATIONS) {
    const [tableName, columnName] = relation.split('.');
    statements.push(db.prepare(`UPDATE ${quoteIdentifier(tableName)} SET ${quoteIdentifier(columnName)} = NULL WHERE ${quoteIdentifier(columnName)} = ?`).bind(productId));
  }
  for (const creativeProjectId of (managedShells?.creative_project_ids || [])) {
    statements.push(db.prepare(`DELETE FROM creative_projects WHERE creative_project_id = ?`).bind(creativeProjectId));
  }
  for (const contentProjectId of (managedShells?.content_project_ids || [])) {
    statements.push(db.prepare(`DELETE FROM content_projects WHERE content_project_id = ?`).bind(contentProjectId));
  }
  statements.push(db.prepare(`DELETE FROM products WHERE product_id = ?`).bind(productId));
  return db.batch(statements);
}

async function handleDelete(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  let body;
  try { body = await request.json(); }
  catch { return json({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const productId = Number(body?.product_id || 0);
  if (!Number.isInteger(productId) || productId <= 0) return json({ ok: false, error: 'A valid product_id is required.' }, 400);
  const product = await loadProduct(db, productId);
  if (!product) return json({ ok: false, error: 'Product not found.' }, 404);

  const preflight = await buildPreflight(db, productId, product);
  if (!preflight.deletion_allowed) {
    return json({
      ok: false,
      error: `${product.name || `Product #${productId}`} cannot be permanently deleted. Archive it instead.`,
      code: 'protected_product_references',
      requires_archive: true,
      product,
      ...preflight
    }, 409);
  }

  const stepUp = await requireAdminStepUp(request, env, auth.sessionUser, body, 'permanently delete product');
  if (!stepUp.ok) return stepUp.response;
  if (String(body?.confirmation_phrase || '').trim() !== 'DELETE PRODUCT') {
    return json({ ok: false, error: 'Type DELETE PRODUCT to confirm permanent deletion.' }, 400);
  }
  const reason = String(body?.deletion_reason || '').trim();
  if (reason.length < 8) return json({ ok: false, error: 'Provide a deletion reason of at least 8 characters.' }, 400);

  const materialPlan = await resolveMaterialPlan(db, productId, body);
  if (!materialPlan.ok) {
    return json({ ok: false, error: materialPlan.error, code: materialPlan.code, materials_requiring_review: materialPlan.review || [] }, materialPlan.status || 409);
  }

  try {
    await runCleanup(db, productId, materialPlan.statements, preflight.managed_shells);
  } catch (error) {
    await captureRuntimeIncident(env, request, {
      incident_scope: 'product_permanent_delete',
      incident_code: 'product_delete_transaction_failed',
      severity: 'error',
      message: error?.message || 'Permanent product delete batch failed.',
      related_user_id: auth.sessionUser.user_id,
      details: { product_id: productId }
    }).catch(() => null);
    return json({ ok: false, error: 'Permanent product deletion failed before completion. The product was not intentionally removed.' }, 500);
  }

  await auditAdminAction(env, request, auth.sessionUser, {
    action_type: 'product_permanent_delete',
    target_type: 'product',
    target_id: productId,
    target_key: product.sku || product.product_number || String(productId),
    details: {
      deletion_reason: reason,
      cleanup_profile: 'bounded_registry_v2_generated_shell_cleanup',
      material_summary: materialPlan.summary,
      generated_content_shells_deleted: Number(preflight.managed_shells?.content_project_ids?.length || 0),
      generated_creative_shells_deleted: Number(preflight.managed_shells?.creative_project_ids?.length || 0)
    }
  });

  return json({
    ok: true,
    message: 'Unused Product permanently deleted after protected-reference and material review.',
    product,
    material_summary: materialPlan.summary,
    generated_shell_cleanup: {
      content_project_count: Number(preflight.managed_shells?.content_project_ids?.length || 0),
      creative_project_count: Number(preflight.managed_shells?.creative_project_ids?.length || 0)
    },
    r2_cleanup_note: 'Reusable media assets are preserved and detached; no R2 objects are deleted by product removal.'
  });
}

async function buildPreflight(db, productId, product = null) {
  const loadedProduct = product || await loadProduct(db, productId);
  if (!loadedProduct) return { product: null, deletion_allowed: 0, blocking_references: [], automatically_safe_references: [], materials: [], materials_requiring_review: [], cleanup_profile: 'bounded_registry_v2_generated_shell_cleanup' };
  const [{ references, managed }, materials] = await Promise.all([
    collectReferences(db, productId),
    loadMaterialReview(db, productId)
  ]);
  const blocking = [
    ...references.filter((reference) => reference.protected_history),
    ...(managed.blocking_references || [])
  ];
  const safe = [
    ...references.filter((reference) => reference.automatically_safe),
    ...(managed.safe_references || [])
  ];
  const materialsRequiringReview = materials.filter((row) => Number(row.site_item_inventory_id || 0) > 0 && Number(row.reserved_quantity || 0) > 0);
  return {
    product: loadedProduct,
    deletion_allowed: blocking.length === 0 && materialsRequiringReview.length === 0 ? 1 : 0,
    blocking_references: blocking,
    automatically_safe_references: safe,
    materials,
    materials_requiring_review: materialsRequiringReview,
    managed_shells: managed,
    cleanup_profile: 'bounded_registry_v2_generated_shell_cleanup'
  };
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const db = getDb(env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const auth = await requireAdmin(request, env);
  if (auth.error) return auth.error;
  const url = new URL(request.url);
  const productId = Number(url.searchParams.get('product_id') || 0);
  if (!Number.isInteger(productId) || productId <= 0) return json({ ok: false, error: 'A valid product_id is required.' }, 400);
  const product = await loadProduct(db, productId);
  if (!product) return json({ ok: false, error: 'Product not found.' }, 404);
  return json({ ok: true, ...(await buildPreflight(db, productId, product)) });
}

export async function onRequestPost(context) {
  return handleDelete(context);
}
