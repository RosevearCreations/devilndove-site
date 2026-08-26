// Devil n Dove Build 440 — audited finished-product production reversal.
// Extends the existing Build 246 product_production_runs authority without adding schema.
// Reversal preserves the original run/material snapshot, returns only snapshot-recorded
// consumable stock, decrements finished-product on-hand quantity, and fails closed on drift.

import {
  auditAdminAction,
  captureRuntimeIncident,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText,
} from '../_lib/adminAudit.js';

const BUILD = 440;
const EPSILON = 0.000001;

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}
function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}
function positiveId(value) {
  const n = Number(value || 0);
  return Number.isInteger(n) && n > 0 ? n : 0;
}
function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function boundedText(value, max = 1000) {
  return normalizeText(value).slice(0, max);
}
function fail(message, { status = 400, code = 'product_production_reversal_invalid', details = null } = {}) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
}

async function loadRun(db, runId) {
  return db.prepare(`
    SELECT
      r.*,
      p.name AS product_name,
      p.sku AS product_sku,
      COALESCE(p.inventory_quantity,0) AS product_inventory_quantity,
      COALESCE(p.inventory_tracking,0) AS product_inventory_tracking
    FROM product_production_runs r
    INNER JOIN products p ON p.product_id=r.product_id
    WHERE r.product_production_run_id=?
    LIMIT 1
  `).bind(runId).first();
}

async function loadRunMaterials(db, runId) {
  const result = await db.prepare(`
    SELECT
      product_production_run_material_id,
      product_production_run_id,
      product_resource_link_id,
      site_item_inventory_id,
      resource_kind,
      source_key,
      item_name,
      consumption_mode,
      tracking_mode,
      usage_quantity,
      usage_unit_label,
      stock_quantity_consumed,
      stock_unit_label,
      unit_cost_cents,
      is_label_ingredient,
      ingredient_name_en,
      ingredient_name_fr,
      inci_name,
      created_at
    FROM product_production_run_materials
    WHERE product_production_run_id=?
    ORDER BY product_production_run_material_id
  `).bind(runId).all();
  return rows(result);
}

async function loadInventoryRows(db, inventoryIds) {
  const ids = [...new Set(inventoryIds.map(positiveId).filter(Boolean))];
  if (!ids.length) return new Map();
  const placeholders = ids.map(() => '?').join(',');
  const result = await db.prepare(`
    SELECT
      site_item_inventory_id,
      source_type,
      external_key,
      item_name,
      COALESCE(on_hand_quantity,0) AS on_hand_quantity,
      COALESCE(reserved_quantity,0) AS reserved_quantity,
      COALESCE(incoming_quantity,0) AS incoming_quantity,
      COALESCE(stock_unit_label,'unit') AS stock_unit_label,
      COALESCE(usage_unit_label,'unit') AS usage_unit_label,
      COALESCE(is_active,1) AS is_active
    FROM site_item_inventory
    WHERE site_item_inventory_id IN (${placeholders})
  `).bind(...ids).all();
  return new Map(rows(result).map((row) => [positiveId(row.site_item_inventory_id), row]));
}

async function buildPreview(db, runId) {
  const run = await loadRun(db, runId);
  if (!run) {
    throw fail('Finished-production run was not found.', {
      status: 404,
      code: 'product_production_reversal_run_not_found',
    });
  }

  const materials = await loadRunMaterials(db, runId);
  const returnByInventory = new Map();
  const blockers = [];

  for (const material of materials) {
    const consumed = Math.max(0, number(material.stock_quantity_consumed, 0));
    if (!(consumed > EPSILON)) continue;
    const inventoryId = positiveId(material.site_item_inventory_id);
    if (!inventoryId) {
      blockers.push(`${material.item_name || material.source_key || 'A consumed material'} no longer has an Inventory identity. Review this run manually before reversal.`);
      continue;
    }
    const current = returnByInventory.get(inventoryId) || {
      site_item_inventory_id: inventoryId,
      return_stock_quantity: 0,
      source_material_rows: 0,
      snapshot_item_names: [],
      snapshot_stock_unit_label: material.stock_unit_label || 'unit',
    };
    current.return_stock_quantity = Number((current.return_stock_quantity + consumed).toFixed(6));
    current.source_material_rows += 1;
    if (material.item_name && !current.snapshot_item_names.includes(material.item_name)) {
      current.snapshot_item_names.push(material.item_name);
    }
    returnByInventory.set(inventoryId, current);
  }

  const inventoryRows = await loadInventoryRows(db, [...returnByInventory.keys()]);
  const returnPlan = [];
  for (const plan of returnByInventory.values()) {
    const item = inventoryRows.get(plan.site_item_inventory_id);
    if (!item) {
      blockers.push(`Inventory item #${plan.site_item_inventory_id} from the production snapshot no longer exists. Review this run manually before reversal.`);
      continue;
    }
    const previous = Math.max(0, number(item.on_hand_quantity, 0));
    const next = Number((previous + plan.return_stock_quantity).toFixed(6));
    returnPlan.push({
      ...plan,
      item_name: item.item_name || plan.snapshot_item_names[0] || `Inventory #${plan.site_item_inventory_id}`,
      source_type: item.source_type || '',
      external_key: item.external_key || '',
      stock_unit_label: item.stock_unit_label || plan.snapshot_stock_unit_label || 'unit',
      inventory_is_active: Number(item.is_active || 0) === 1 ? 1 : 0,
      previous_on_hand_quantity: previous,
      new_on_hand_quantity: next,
      previous_reserved_quantity: Math.max(0, number(item.reserved_quantity, 0)),
      previous_incoming_quantity: Math.max(0, number(item.incoming_quantity, 0)),
    });
  }

  const status = String(run.run_status || '').toLowerCase();
  if (status === 'reversed') {
    blockers.push('This production run is already reversed. A production run can only be reversed once.');
  } else if (status !== 'posted') {
    blockers.push(`Only posted production runs can be reversed; this run is ${status || 'unknown'}.`);
  }

  const outputQuantity = Math.max(0, Math.floor(number(run.output_quantity, 0)));
  const productInventoryBefore = Math.max(0, number(run.product_inventory_quantity, 0));
  if (!(outputQuantity > 0)) {
    blockers.push('The production run has no positive finished quantity to reverse.');
  } else if (productInventoryBefore + EPSILON < outputQuantity) {
    blockers.push(`Only ${productInventoryBefore} finished unit(s) are currently on hand, but this run produced ${outputQuantity}. Reversal is blocked because the application cannot prove those units remain available.`);
  }

  return {
    build: BUILD,
    run,
    materials,
    return_plan: returnPlan,
    blockers,
    eligible: blockers.length ? 0 : 1,
    product_inventory_before: productInventoryBefore,
    product_inventory_after: Math.max(0, productInventoryBefore - outputQuantity),
    output_quantity: outputQuantity,
    downstream_guard: {
      mode: 'finished_stock_quantity_fail_closed',
      lot_sale_provenance_available: false,
      explanation: 'Current Product inventory has no lot/serial allocation tying individual sold units to a production run. Reversal therefore requires at least the run output quantity to remain on hand and never claims which physical units were sold.',
    },
  };
}

async function loadHistory(db, productId) {
  if (!positiveId(productId)) return [];
  const result = await db.prepare(`
    SELECT
      product_production_run_id,
      run_key,
      product_id,
      output_quantity,
      output_unit_label,
      run_status,
      notes,
      posted_by_user_id,
      posted_at,
      reversed_by_user_id,
      reversed_at,
      reversal_reason
    FROM product_production_runs
    WHERE product_id=?
    ORDER BY product_production_run_id DESC
    LIMIT 30
  `).bind(productId).all();
  return rows(result);
}

async function compensateFailedReversal(db, { run, preview, batchResult, indices, userId, reversedAt }) {
  const compensation = [];
  const productChanged = Number(batchResult?.[indices.product]?.meta?.changes || 0) === 1;
  if (productChanged) {
    compensation.push(db.prepare(`
      UPDATE products
      SET inventory_quantity=?,updated_at=CURRENT_TIMESTAMP
      WHERE product_id=? AND ABS(COALESCE(inventory_quantity,0)-?)<?
    `).bind(preview.product_inventory_before, run.product_id, preview.product_inventory_after, EPSILON));
  }

  for (const item of indices.inventory) {
    const changed = Number(batchResult?.[item.statement_index]?.meta?.changes || 0) === 1;
    if (!changed) continue;
    compensation.push(db.prepare(`
      UPDATE site_item_inventory
      SET on_hand_quantity=?,updated_at=CURRENT_TIMESTAMP
      WHERE site_item_inventory_id=? AND ABS(COALESCE(on_hand_quantity,0)-?)<?
    `).bind(item.previous, item.inventoryId, item.next, EPSILON));
    compensation.push(db.prepare(`
      INSERT INTO site_inventory_movements(
        site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,
        previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,
        previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at
      )
      SELECT site_item_inventory_id,source_type,external_key,item_name,'correction',?,?,?,?,
             COALESCE(reserved_quantity,0),COALESCE(reserved_quantity,0),COALESCE(incoming_quantity,0),COALESCE(incoming_quantity,0),
             ?,?,CURRENT_TIMESTAMP
      FROM site_item_inventory
      WHERE site_item_inventory_id=? AND ABS(COALESCE(on_hand_quantity,0)-?)<?
    `).bind(
      -item.returnQuantity,
      item.next,
      item.previous,
      `Automatic compensation for failed production reversal ${run.run_key}`,
      userId || null,
      item.inventoryId,
      item.previous,
      EPSILON,
    ));
  }

  compensation.push(db.prepare(`
    UPDATE product_production_runs
    SET run_status='posted',reversed_by_user_id=NULL,reversed_at=NULL,reversal_reason=NULL,updated_at=CURRENT_TIMESTAMP
    WHERE product_production_run_id=? AND run_status='reversed' AND reversed_at=? AND reversed_by_user_id=?
  `).bind(run.product_production_run_id, reversedAt, userId));

  if (compensation.length) await db.batch(compensation);
}

async function reverseRun(db, preview, reason, userId) {
  const run = preview.run;
  const runId = positiveId(run.product_production_run_id);
  const reversedAt = new Date().toISOString();
  const statements = [];
  const indices = { claim: 0, product: 0, inventory: [] };

  indices.claim = statements.length;
  statements.push(db.prepare(`
    UPDATE product_production_runs
    SET run_status='reversed',reversed_by_user_id=?,reversed_at=?,reversal_reason=?,updated_at=CURRENT_TIMESTAMP
    WHERE product_production_run_id=? AND run_status='posted'
  `).bind(userId, reversedAt, reason, runId));

  indices.product = statements.length;
  statements.push(db.prepare(`
    UPDATE products
    SET inventory_quantity=?,updated_at=CURRENT_TIMESTAMP
    WHERE product_id=?
      AND ABS(COALESCE(inventory_quantity,0)-?)<?
      AND COALESCE(inventory_quantity,0)>=?
      AND EXISTS(
        SELECT 1 FROM product_production_runs r
        WHERE r.product_production_run_id=? AND r.run_status='reversed'
          AND r.reversed_at=? AND r.reversed_by_user_id=?
      )
  `).bind(
    preview.product_inventory_after,
    run.product_id,
    preview.product_inventory_before,
    EPSILON,
    preview.output_quantity,
    runId,
    reversedAt,
    userId,
  ));

  for (const plan of preview.return_plan) {
    const previous = number(plan.previous_on_hand_quantity, 0);
    const next = number(plan.new_on_hand_quantity, previous);
    const returnQuantity = Math.max(0, number(plan.return_stock_quantity, 0));
    const inventoryId = positiveId(plan.site_item_inventory_id);
    const statementIndex = statements.length;
    statements.push(db.prepare(`
      UPDATE site_item_inventory
      SET on_hand_quantity=?,last_seen_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
      WHERE site_item_inventory_id=?
        AND ABS(COALESCE(on_hand_quantity,0)-?)<?
        AND EXISTS(
          SELECT 1 FROM product_production_runs r
          WHERE r.product_production_run_id=? AND r.run_status='reversed'
            AND r.reversed_at=? AND r.reversed_by_user_id=?
        )
    `).bind(next, inventoryId, previous, EPSILON, runId, reversedAt, userId));
    indices.inventory.push({ statement_index: statementIndex, inventoryId, previous, next, returnQuantity });

    statements.push(db.prepare(`
      INSERT INTO site_inventory_movements(
        site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,
        previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,
        previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at
      )
      SELECT site_item_inventory_id,source_type,external_key,item_name,'correction',?,?,?,?,
             COALESCE(reserved_quantity,0),COALESCE(reserved_quantity,0),COALESCE(incoming_quantity,0),COALESCE(incoming_quantity,0),
             ?,?,CURRENT_TIMESTAMP
      FROM site_item_inventory
      WHERE site_item_inventory_id=?
        AND ABS(COALESCE(on_hand_quantity,0)-?)<?
        AND EXISTS(
          SELECT 1 FROM product_production_runs r
          WHERE r.product_production_run_id=? AND r.run_status='reversed'
            AND r.reversed_at=? AND r.reversed_by_user_id=?
        )
    `).bind(
      returnQuantity,
      previous,
      next,
      `Reversal of finished production run ${run.run_key}. Reason: ${reason}`.slice(0, 500),
      userId || null,
      inventoryId,
      next,
      EPSILON,
      runId,
      reversedAt,
      userId,
    ));
  }

  let batchResult;
  try {
    batchResult = await db.batch(statements);
  } catch (error) {
    throw fail('The finished-production reversal transaction failed before it could be verified.', {
      status: 500,
      code: 'product_production_reversal_transaction_failed',
      details: String(error?.message || error),
    });
  }

  const claimChanged = Number(batchResult?.[indices.claim]?.meta?.changes || 0) === 1;
  const productChanged = Number(batchResult?.[indices.product]?.meta?.changes || 0) === 1;
  const failedInventory = indices.inventory.filter((item) => Number(batchResult?.[item.statement_index]?.meta?.changes || 0) !== 1);

  if (!claimChanged || !productChanged || failedInventory.length) {
    await compensateFailedReversal(db, { run, preview, batchResult, indices, userId, reversedAt }).catch(() => null);
    throw fail(
      claimChanged
        ? 'Inventory changed while the production reversal was being posted. Any partial reversal was compensated; refresh and review the run again.'
        : 'This production run is no longer available to reverse. Refresh the production history.',
      {
        status: 409,
        code: claimChanged ? 'product_production_reversal_concurrent_inventory_change' : 'product_production_reversal_already_claimed',
      },
    );
  }

  const reversedRun = await loadRun(db, runId);
  return {
    run: reversedRun,
    returned_materials: preview.return_plan,
    product_inventory_before: preview.product_inventory_before,
    product_inventory_after: preview.product_inventory_after,
  };
}

export async function onRequestGet(context) {
  const user = await getAdminUserFromRequest(context.request, context.env);
  if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  try {
    const url = new URL(context.request.url);
    const runId = positiveId(url.searchParams.get('product_production_run_id'));
    const productId = positiveId(url.searchParams.get('product_id'));
    if (runId) {
      const preview = await buildPreview(db, runId);
      const history = await loadHistory(db, preview.run.product_id);
      return json({ ok: true, build: BUILD, preview, history });
    }
    if (!productId) {
      return json({ ok: false, error: 'product_id or product_production_run_id is required.', error_code: 'product_production_reversal_target_required' }, 400);
    }
    return json({ ok: true, build: BUILD, history: await loadHistory(db, productId) });
  } catch (error) {
    return json({
      ok: false,
      error: error?.message || 'Production reversal preview failed.',
      error_code: error?.code || 'product_production_reversal_preview_failed',
      details: error?.details || null,
    }, Number(error?.status || 500));
  }
}

export async function onRequestPost(context) {
  const user = await getAdminUserFromRequest(context.request, context.env);
  if (!user) return json({ ok: false, error: 'Unauthorized.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  let body = {};
  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON body.', error_code: 'product_production_reversal_json_required' }, 400);
  }

  const runId = positiveId(body.product_production_run_id);
  const reason = boundedText(body.reason, 500);
  try {
    if (!runId) {
      throw fail('Choose a posted production run to reverse.', { code: 'product_production_reversal_run_required' });
    }
    if (reason.length < 8) {
      throw fail('Provide a clear reversal reason of at least 8 characters.', { code: 'product_production_reversal_reason_required' });
    }

    const preview = await buildPreview(db, runId);
    if (!preview.eligible) {
      throw fail('This production run is not currently eligible for reversal.', {
        status: 409,
        code: 'product_production_reversal_not_eligible',
        details: { blockers: preview.blockers },
      });
    }

    const result = await reverseRun(db, preview, reason, positiveId(user.user_id));
    await auditAdminAction(context.env, context.request, user, {
      action_type: 'product_production_release_reverse',
      target_type: 'product_production_run',
      target_id: runId,
      target_key: result.run?.run_key || String(runId),
      details: {
        product_id: result.run?.product_id || preview.run.product_id,
        output_quantity_reversed: preview.output_quantity,
        product_inventory_before: result.product_inventory_before,
        product_inventory_after: result.product_inventory_after,
        returned_inventory_items: result.returned_materials.map((item) => ({
          site_item_inventory_id: item.site_item_inventory_id,
          item_name: item.item_name,
          return_stock_quantity: item.return_stock_quantity,
          previous_on_hand_quantity: item.previous_on_hand_quantity,
          new_on_hand_quantity: item.new_on_hand_quantity,
        })),
        reason,
        downstream_guard: preview.downstream_guard,
      },
    });

    return json({
      ok: true,
      build: BUILD,
      message: `Production run reversed. ${preview.output_quantity} finished unit(s) were removed from Product stock and ${result.returned_materials.length} raw Inventory item(s) were compensated from the immutable production snapshot.`,
      ...result,
    });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'product_production_reversal',
      incident_code: error?.code || 'product_production_reversal_failed',
      severity: Number(error?.status || 500) >= 500 ? 'error' : 'warning',
      message: error?.message || 'Production reversal failed.',
      related_user_id: positiveId(user.user_id) || null,
      details: {
        product_production_run_id: runId || null,
        error_code: error?.code || 'product_production_reversal_failed',
        error: String(error?.stack || error),
        details: error?.details || null,
      },
    }).catch(() => null);
    return json({
      ok: false,
      error: error?.message || 'Production reversal failed safely.',
      error_code: error?.code || 'product_production_reversal_failed',
      details: error?.details || null,
    }, Number(error?.status || 500));
  }
}
