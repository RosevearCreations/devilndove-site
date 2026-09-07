// Release 467 Build 71 — canonical Inventory lifecycle mutation authority.
// Converges receiving, reservation, release, use, return, write-off and reorder-request semantics.
// Uses existing Inventory ledgers only; no runtime DDL, provider calls, R2 work or accounting journal posting.

import {
  INVENTORY_QUANTITY_EPSILON,
  baseToPurchase,
  normalizeInventoryTrackingMode,
  normalizeInventoryUnitLabel,
  planInventoryUsage,
  roundInventoryQuantity,
} from './inventoryUnitConversion.js';

export const INVENTORY_LIFECYCLE_BUILD = 71;
export const INVENTORY_LIFECYCLE_CONTRACT = 'inventory-lifecycle';
export const ITEM_LIFECYCLE_ACTIONS = Object.freeze([
  'receive',
  'reserve',
  'release',
  'consume',
  'consume_usage',
  'return_stock',
  'write_off',
  'reorder_request',
]);

const ITEM_ACTION_SET = new Set(ITEM_LIFECYCLE_ACTIONS);

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function positiveId(value) {
  const n = Number(value || 0);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

function clean(value, max = 800) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, max);
}

function actionName(value) {
  return clean(value, 60).toLowerCase().replace(/-/g, '_');
}

function quantity(value) {
  return roundInventoryQuantity(Math.max(0, finite(value, 0)));
}

function movementMarker(action) {
  const token = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `[DD-B71:${action}:${token}]`;
}

function errorWith(message, { status = 400, code = 'inventory_lifecycle_invalid', details = null } = {}) {
  const error = new Error(message);
  error.name = 'InventoryLifecycleError';
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
}

function guard(db, sql, bindings = []) {
  // SQLite integer overflow is used only as a fail-closed batch guard. If the
  // expected post-update state is absent the complete D1 batch rolls back.
  return db.prepare(`SELECT CASE WHEN (${sql}) THEN 1 ELSE abs(-9223372036854775808) END AS build71_guard`).bind(...bindings);
}

function rowState(row = {}) {
  const onHand = quantity(row.on_hand_quantity);
  const reserved = quantity(row.reserved_quantity);
  const incoming = quantity(row.incoming_quantity);
  const available = roundInventoryQuantity(Math.max(0, onHand - reserved));
  const sourceType = clean(row.source_type, 30).toLowerCase();
  const trackingMode = normalizeInventoryTrackingMode(row.usage_tracking_mode, sourceType);
  const unitCostCents = Math.max(0, Math.round(finite(row.unit_cost_cents, 0)));
  return Object.freeze({
    on_hand_quantity: onHand,
    reserved_quantity: reserved,
    incoming_quantity: incoming,
    available_quantity: available,
    source_type: sourceType,
    tracking_mode: trackingMode,
    stock_unit_label: normalizeInventoryUnitLabel(row.stock_unit_label, 'unit'),
    usage_unit_label: normalizeInventoryUnitLabel(row.usage_unit_label, 'unit'),
    usage_units_per_stock_unit: Math.max(INVENTORY_QUANTITY_EPSILON, finite(row.usage_units_per_stock_unit, 1) || 1),
    minimum_usage_increment: Math.max(INVENTORY_QUANTITY_EPSILON, finite(row.minimum_usage_increment, 0.001) || 0.001),
    unit_cost_cents: unitCostCents,
    do_not_reorder: Number(row.do_not_reorder || 0) === 1 ? 1 : 0,
    do_not_reuse: Number(row.do_not_reuse || 0) === 1 ? 1 : 0,
    is_active: Number(row.is_active ?? 1) === 0 ? 0 : 1,
  });
}

function accountingContext(action, unitCostCents, stockDelta, requestedQuantity = 0) {
  const inventoryValueDeltaCents = Math.round(unitCostCents * stockDelta);
  const direction = inventoryValueDeltaCents > 0
    ? 'inventory_asset_increase'
    : inventoryValueDeltaCents < 0
      ? 'inventory_asset_decrease'
      : 'no_inventory_value_change';
  return Object.freeze({
    inventory_value_delta_cents: inventoryValueDeltaCents,
    accounting_direction: direction,
    finance_review_required: ['receive', 'return_stock', 'write_off'].includes(action) ? 1 : 0,
    journal_posted: false,
    requested_reorder_quantity: action === 'reorder_request' ? quantity(requestedQuantity) : 0,
  });
}

export function planInventoryLifecycleAction(row = {}, requestedAction = '', requestedQuantity = 0, options = {}) {
  const action = actionName(requestedAction);
  if (!ITEM_ACTION_SET.has(action)) {
    throw errorWith('Unsupported Inventory lifecycle action.', { code: 'inventory_lifecycle_action_unsupported' });
  }

  const qty = quantity(requestedQuantity);
  if (!(qty > INVENTORY_QUANTITY_EPSILON)) {
    throw errorWith('A quantity greater than zero is required.', { code: 'inventory_lifecycle_quantity_required' });
  }

  const state = rowState(row);
  if (!state.is_active) {
    throw errorWith('This Inventory item is inactive. Reactivate it before changing lifecycle quantities.', {
      status: 409,
      code: 'inventory_lifecycle_item_inactive',
    });
  }

  if (state.source_type === 'product' && action !== 'reorder_request') {
    throw errorWith('Product stock is owned by Product/production workflows, not the Supply/Tool Inventory lifecycle.', {
      status: 409,
      code: 'inventory_lifecycle_wrong_owner',
    });
  }

  const reason = clean(options.note, 800);
  if (['return_stock', 'write_off'].includes(action) && reason.length < 8) {
    throw errorWith('Return and write-off actions require a clear note of at least 8 characters.', {
      code: 'inventory_lifecycle_reason_required',
    });
  }

  let newOnHand = state.on_hand_quantity;
  let newReserved = state.reserved_quantity;
  let newIncoming = state.incoming_quantity;
  let stockDelta = 0;
  let movementType = action;
  let lifecycleStage = 'storage';
  let usage = null;

  switch (action) {
    case 'receive': {
      newOnHand = roundInventoryQuantity(state.on_hand_quantity + qty);
      const appliedAgainstIncoming = Math.min(state.incoming_quantity, qty);
      newIncoming = roundInventoryQuantity(state.incoming_quantity - appliedAgainstIncoming);
      stockDelta = qty;
      movementType = 'receive';
      lifecycleStage = 'receiving_to_storage';
      break;
    }
    case 'reserve': {
      if (qty > state.available_quantity + INVENTORY_QUANTITY_EPSILON) {
        throw errorWith(`Only ${state.available_quantity} ${state.stock_unit_label} is available to reserve.`, {
          status: 409,
          code: 'inventory_lifecycle_insufficient_available_for_reservation',
          details: { available_quantity: state.available_quantity, requested_quantity: qty },
        });
      }
      newReserved = roundInventoryQuantity(state.reserved_quantity + qty);
      movementType = 'reserve';
      lifecycleStage = 'storage_to_reserved';
      break;
    }
    case 'release': {
      if (qty > state.reserved_quantity + INVENTORY_QUANTITY_EPSILON) {
        throw errorWith(`Only ${state.reserved_quantity} ${state.stock_unit_label} is currently reserved.`, {
          status: 409,
          code: 'inventory_lifecycle_release_exceeds_reserved',
          details: { reserved_quantity: state.reserved_quantity, requested_quantity: qty },
        });
      }
      newReserved = roundInventoryQuantity(state.reserved_quantity - qty);
      movementType = 'release';
      lifecycleStage = 'reserved_to_storage';
      break;
    }
    case 'consume': {
      if (['reusable', 'log_only'].includes(state.tracking_mode)) {
        throw errorWith('Reusable/log-only items must use Record use so usage is logged without incorrectly depleting stock.', {
          status: 409,
          code: 'inventory_lifecycle_use_usage_authority',
        });
      }
      if (qty > state.available_quantity + INVENTORY_QUANTITY_EPSILON) {
        throw errorWith(`Only ${state.available_quantity} ${state.stock_unit_label} is available after reservations.`, {
          status: 409,
          code: 'inventory_lifecycle_consume_exceeds_available',
        });
      }
      newOnHand = roundInventoryQuantity(state.on_hand_quantity - qty);
      stockDelta = -qty;
      movementType = 'consume';
      lifecycleStage = 'storage_to_usage';
      break;
    }
    case 'consume_usage': {
      usage = planInventoryUsage({ ...row, ...state }, qty);
      newOnHand = usage.new_on_hand_quantity;
      stockDelta = roundInventoryQuantity(newOnHand - state.on_hand_quantity);
      movementType = 'consume';
      lifecycleStage = ['reusable', 'log_only'].includes(usage.tracking_mode) ? 'usage_log_only' : 'storage_to_usage';
      break;
    }
    case 'return_stock': {
      if (['reusable', 'log_only'].includes(state.tracking_mode)) {
        throw errorWith('Reusable/log-only usage does not deplete stock, so there is no consumed stock quantity to return.', {
          status: 409,
          code: 'inventory_lifecycle_return_not_depleted',
        });
      }
      newOnHand = roundInventoryQuantity(state.on_hand_quantity + qty);
      stockDelta = qty;
      movementType = 'correction';
      lifecycleStage = 'usage_return_to_storage';
      break;
    }
    case 'write_off': {
      if (qty > state.available_quantity + INVENTORY_QUANTITY_EPSILON) {
        throw errorWith(`Only ${state.available_quantity} ${state.stock_unit_label} is unreserved and available to write off.`, {
          status: 409,
          code: 'inventory_lifecycle_writeoff_exceeds_available',
        });
      }
      newOnHand = roundInventoryQuantity(state.on_hand_quantity - qty);
      stockDelta = -qty;
      movementType = 'correction';
      lifecycleStage = 'storage_to_writeoff';
      break;
    }
    case 'reorder_request': {
      if (state.do_not_reorder) {
        throw errorWith('This Inventory item is marked do not reorder.', {
          status: 409,
          code: 'inventory_lifecycle_do_not_reorder',
        });
      }
      // A reorder request is a planning signal only. It must not claim stock is
      // incoming until a real purchase order or receiving workflow establishes that fact.
      movementType = 'reorder_request';
      lifecycleStage = 'reorder_requested';
      break;
    }
    default:
      break;
  }

  const accounting = accountingContext(action, state.unit_cost_cents, stockDelta, qty);
  return Object.freeze({
    action,
    requested_quantity: qty,
    lifecycle_stage: lifecycleStage,
    movement_type: movementType,
    stock_unit_label: state.stock_unit_label,
    usage_unit_label: state.usage_unit_label,
    tracking_mode: state.tracking_mode,
    previous_on_hand_quantity: state.on_hand_quantity,
    new_on_hand_quantity: newOnHand,
    previous_reserved_quantity: state.reserved_quantity,
    new_reserved_quantity: newReserved,
    previous_incoming_quantity: state.incoming_quantity,
    new_incoming_quantity: newIncoming,
    available_quantity_before: state.available_quantity,
    available_quantity_after: roundInventoryQuantity(Math.max(0, newOnHand - newReserved)),
    quantity_delta: stockDelta,
    usage,
    accounting,
  });
}

async function loadLifecycleItem(db, inventoryId) {
  const id = positiveId(inventoryId);
  if (!id) return null;
  return db.prepare(`
    SELECT sii.*,
           COALESCE(siup.usage_tracking_mode,
             CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END
           ) AS usage_tracking_mode,
           COALESCE(siup.minimum_usage_increment,0.001) AS minimum_usage_increment
    FROM site_item_inventory sii
    LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id=sii.site_item_inventory_id
    WHERE sii.site_item_inventory_id=?
    LIMIT 1
  `).bind(id).first();
}

export async function applyInventoryLifecycleAction(db, input = {}) {
  if (!db) throw errorWith('Database binding is not configured.', { status: 500, code: 'inventory_lifecycle_db_missing' });
  const inventoryId = positiveId(input.site_item_inventory_id);
  if (!inventoryId) throw errorWith('site_item_inventory_id is required.', { code: 'inventory_lifecycle_item_required' });

  const item = await loadLifecycleItem(db, inventoryId);
  if (!item) throw errorWith('Inventory item was not found.', { status: 404, code: 'inventory_lifecycle_item_not_found' });
  const plan = planInventoryLifecycleAction(item, input.action, input.quantity, { note: input.note });
  const actorUserId = positiveId(input.actor_user_id) || null;
  const marker = movementMarker(plan.action);
  const noteParts = [
    `Lifecycle ${plan.action}.`,
    clean(input.note, 800),
    plan.action === 'reorder_request' ? `Requested reorder quantity ${plan.requested_quantity} ${plan.stock_unit_label}.` : '',
    `Accounting context ${plan.accounting.accounting_direction}; value delta ${plan.accounting.inventory_value_delta_cents} cents; journal posted no.`,
    marker,
  ].filter(Boolean);
  const movementNote = noteParts.join(' ').slice(0, 1000);

  const statements = [
    db.prepare(`
      UPDATE site_item_inventory
      SET on_hand_quantity=?,reserved_quantity=?,incoming_quantity=?,
          is_on_reorder_list=CASE WHEN ?='reorder_request' THEN 1 ELSE is_on_reorder_list END,
          last_reorder_requested_at=CASE WHEN ?='reorder_request' THEN CURRENT_TIMESTAMP ELSE last_reorder_requested_at END,
          updated_at=CURRENT_TIMESTAMP
      WHERE site_item_inventory_id=? AND COALESCE(is_active,1)=1
        AND ABS(COALESCE(on_hand_quantity,0)-?)<?
        AND ABS(COALESCE(reserved_quantity,0)-?)<?
        AND ABS(COALESCE(incoming_quantity,0)-?)<?
    `).bind(
      plan.new_on_hand_quantity,
      plan.new_reserved_quantity,
      plan.new_incoming_quantity,
      plan.action,
      plan.action,
      inventoryId,
      plan.previous_on_hand_quantity,
      INVENTORY_QUANTITY_EPSILON,
      plan.previous_reserved_quantity,
      INVENTORY_QUANTITY_EPSILON,
      plan.previous_incoming_quantity,
      INVENTORY_QUANTITY_EPSILON,
    ),
    guard(db, `EXISTS(
      SELECT 1 FROM site_item_inventory
      WHERE site_item_inventory_id=? AND COALESCE(is_active,1)=1
        AND ABS(COALESCE(on_hand_quantity,0)-?)<?
        AND ABS(COALESCE(reserved_quantity,0)-?)<?
        AND ABS(COALESCE(incoming_quantity,0)-?)<?
    )`, [
      inventoryId,
      plan.new_on_hand_quantity,
      INVENTORY_QUANTITY_EPSILON,
      plan.new_reserved_quantity,
      INVENTORY_QUANTITY_EPSILON,
      plan.new_incoming_quantity,
      INVENTORY_QUANTITY_EPSILON,
    ]),
    db.prepare(`
      INSERT INTO site_inventory_movements(
        site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,
        previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,
        previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at
      )
      SELECT site_item_inventory_id,source_type,external_key,item_name,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP
      FROM site_item_inventory
      WHERE site_item_inventory_id=?
        AND ABS(COALESCE(on_hand_quantity,0)-?)<?
        AND ABS(COALESCE(reserved_quantity,0)-?)<?
        AND ABS(COALESCE(incoming_quantity,0)-?)<?
    `).bind(
      plan.movement_type,
      plan.quantity_delta,
      plan.previous_on_hand_quantity,
      plan.new_on_hand_quantity,
      plan.previous_reserved_quantity,
      plan.new_reserved_quantity,
      plan.previous_incoming_quantity,
      plan.new_incoming_quantity,
      movementNote,
      actorUserId,
      inventoryId,
      plan.new_on_hand_quantity,
      INVENTORY_QUANTITY_EPSILON,
      plan.new_reserved_quantity,
      INVENTORY_QUANTITY_EPSILON,
      plan.new_incoming_quantity,
      INVENTORY_QUANTITY_EPSILON,
    ),
  ];

  if (plan.action === 'consume_usage' && plan.usage) {
    statements.push(db.prepare(`
      INSERT INTO site_inventory_usage_movements(
        site_inventory_movement_id,site_item_inventory_id,usage_quantity_delta,usage_unit_label,
        stock_quantity_delta,stock_unit_label,tracking_mode,is_estimated,note,actor_user_id,created_at
      )
      SELECT sim.site_inventory_movement_id,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP
      FROM site_inventory_movements sim
      WHERE sim.site_item_inventory_id=? AND sim.note=?
      ORDER BY sim.site_inventory_movement_id DESC
      LIMIT 1
    `).bind(
      inventoryId,
      -plan.usage.quantity,
      plan.usage.usage_unit_label,
      plan.quantity_delta,
      plan.usage.stock_unit_label,
      plan.usage.tracking_mode,
      plan.usage.is_estimated,
      `Lifecycle usage ${plan.usage.quantity} ${plan.usage.usage_unit_label}. ${marker}`,
      actorUserId,
      inventoryId,
      movementNote,
    ));
  }

  try {
    await db.batch(statements);
  } catch (error) {
    throw errorWith('Inventory changed while the lifecycle action was being committed. Refresh and retry; no partial lifecycle change was accepted.', {
      status: 409,
      code: 'inventory_lifecycle_atomic_commit_failed',
      details: clean(error?.message || error, 300),
    });
  }

  const saved = await loadLifecycleItem(db, inventoryId);
  const movement = await db.prepare(`
    SELECT site_inventory_movement_id,movement_type,note,created_at
    FROM site_inventory_movements
    WHERE site_item_inventory_id=? AND note=?
    ORDER BY site_inventory_movement_id DESC LIMIT 1
  `).bind(inventoryId, movementNote).first().catch(() => null);

  return Object.freeze({
    ok: true,
    build: INVENTORY_LIFECYCLE_BUILD,
    contract: INVENTORY_LIFECYCLE_CONTRACT,
    action: plan.action,
    item: saved,
    plan,
    accounting_context: plan.accounting,
    movement_id: positiveId(movement?.site_inventory_movement_id) || null,
    movement_type: movement?.movement_type || plan.movement_type,
  });
}

export async function applyProductResourceReservationLifecycle(db, input = {}) {
  if (!db) throw errorWith('Database binding is not configured.', { status: 500, code: 'inventory_lifecycle_db_missing' });
  const productId = positiveId(input.product_id);
  if (!productId) throw errorWith('product_id is required.', { code: 'inventory_lifecycle_product_required' });
  const release = Boolean(input.release);
  const multiplier = Math.max(1, finite(input.quantity_multiplier, 1) || 1);
  const actorUserId = positiveId(input.actor_user_id) || null;
  const note = clean(input.note, 700);
  const marker = movementMarker(release ? 'product_release' : 'product_reserve');

  const result = await db.prepare(`
    SELECT prl.product_resource_link_id,prl.resource_kind,prl.source_key,
           COALESCE(prl.quantity_used,0) quantity_used,
           COALESCE(prl.consumption_mode,'per_unit') consumption_mode,
           COALESCE(prl.lot_size_units,1) lot_size_units,
           sii.site_item_inventory_id,sii.item_name,sii.source_type,sii.external_key,
           COALESCE(sii.on_hand_quantity,0) on_hand_quantity,
           COALESCE(sii.reserved_quantity,0) reserved_quantity,
           COALESCE(sii.incoming_quantity,0) incoming_quantity,
           COALESCE(NULLIF(sii.stock_unit_label,''),'unit') stock_unit_label,
           COALESCE(NULLIF(sii.usage_unit_label,''),'unit') usage_unit_label,
           COALESCE(NULLIF(sii.usage_units_per_stock_unit,0),1) usage_units_per_stock_unit,
           COALESCE(siup.usage_tracking_mode,CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END) usage_tracking_mode
    FROM product_resource_links prl
    LEFT JOIN site_item_inventory sii ON sii.source_type=prl.resource_kind AND sii.external_key=prl.source_key
    LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id=sii.site_item_inventory_id
    WHERE prl.product_id=?
    ORDER BY prl.sort_order,prl.product_resource_link_id
  `).bind(productId).all();
  const links = Array.isArray(result?.results) ? result.results : [];
  const plans = [];

  for (const link of links) {
    const usageQty = quantity(finite(link.quantity_used, 0) * multiplier);
    const mode = normalizeInventoryTrackingMode(link.usage_tracking_mode, link.resource_kind);
    const consumptionMode = clean(link.consumption_mode, 40).toLowerCase();
    const stockQty = baseToPurchase(usageQty, link.usage_units_per_stock_unit);
    if (!positiveId(link.site_item_inventory_id)) {
      throw errorWith(`Product resource ${clean(link.source_key, 120) || clean(link.resource_kind, 40)} is not linked to an active Inventory item.`, {
        status: 409,
        code: 'inventory_lifecycle_product_resource_missing_inventory',
      });
    }
    if (consumptionMode === 'story_only' || consumptionMode === 'end_of_lot' || ['log_only', 'reusable'].includes(mode)) {
      plans.push(Object.freeze({ ...link, skipped_reservation: true, required_usage_quantity: usageQty, stock_quantity_required: stockQty }));
      continue;
    }
    const onHand = quantity(link.on_hand_quantity);
    const reserved = quantity(link.reserved_quantity);
    const available = roundInventoryQuantity(Math.max(0, onHand - reserved));
    if (!release && stockQty > available + INVENTORY_QUANTITY_EPSILON) {
      throw errorWith(`Product reservation needs ${stockQty} ${normalizeInventoryUnitLabel(link.stock_unit_label, 'unit')} of ${clean(link.item_name, 180)}, but only ${available} is available.`, {
        status: 409,
        code: 'inventory_lifecycle_product_reservation_insufficient',
      });
    }
    if (release && stockQty > reserved + INVENTORY_QUANTITY_EPSILON) {
      throw errorWith(`Product release asks for ${stockQty} ${normalizeInventoryUnitLabel(link.stock_unit_label, 'unit')} of ${clean(link.item_name, 180)}, but only ${reserved} is reserved in aggregate.`, {
        status: 409,
        code: 'inventory_lifecycle_product_release_exceeds_reserved',
      });
    }
    plans.push(Object.freeze({
      ...link,
      skipped_reservation: false,
      required_usage_quantity: usageQty,
      stock_quantity_required: stockQty,
      previous_reserved_quantity: reserved,
      new_reserved_quantity: roundInventoryQuantity(reserved + (release ? -stockQty : stockQty)),
      on_hand_quantity: onHand,
      incoming_quantity: quantity(link.incoming_quantity),
    }));
  }

  const statements = [];
  for (const plan of plans.filter((row) => !row.skipped_reservation)) {
    const itemId = positiveId(plan.site_item_inventory_id);
    const rowNote = [
      release ? `Product ${productId} reservation release.` : `Product ${productId} reservation.`,
      note,
      `${plan.required_usage_quantity} ${normalizeInventoryUnitLabel(plan.usage_unit_label, 'unit')} = ${plan.stock_quantity_required} ${normalizeInventoryUnitLabel(plan.stock_unit_label, 'unit')}.`,
      marker,
    ].filter(Boolean).join(' ').slice(0, 1000);
    statements.push(
      db.prepare(`
        UPDATE site_item_inventory
        SET reserved_quantity=?,updated_at=CURRENT_TIMESTAMP
        WHERE site_item_inventory_id=? AND COALESCE(is_active,1)=1
          AND ABS(COALESCE(on_hand_quantity,0)-?)<?
          AND ABS(COALESCE(reserved_quantity,0)-?)<?
          AND ABS(COALESCE(incoming_quantity,0)-?)<?
      `).bind(
        plan.new_reserved_quantity,
        itemId,
        plan.on_hand_quantity,
        INVENTORY_QUANTITY_EPSILON,
        plan.previous_reserved_quantity,
        INVENTORY_QUANTITY_EPSILON,
        plan.incoming_quantity,
        INVENTORY_QUANTITY_EPSILON,
      ),
      guard(db, `EXISTS(SELECT 1 FROM site_item_inventory WHERE site_item_inventory_id=? AND ABS(COALESCE(reserved_quantity,0)-?)<?)`, [
        itemId,
        plan.new_reserved_quantity,
        INVENTORY_QUANTITY_EPSILON,
      ]),
      db.prepare(`
        INSERT INTO site_inventory_movements(
          site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,
          previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,
          previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at
        ) VALUES (?,?,?,?,?,0,?,?,?,?,?,?,?, ?,CURRENT_TIMESTAMP)
      `).bind(
        itemId,
        plan.source_type || plan.resource_kind || null,
        plan.external_key || plan.source_key || null,
        plan.item_name || null,
        release ? 'release' : 'reserve',
        plan.on_hand_quantity,
        plan.on_hand_quantity,
        plan.previous_reserved_quantity,
        plan.new_reserved_quantity,
        plan.incoming_quantity,
        plan.incoming_quantity,
        rowNote,
        actorUserId,
      ),
    );
  }

  if (statements.length) {
    try {
      await db.batch(statements);
    } catch (error) {
      throw errorWith('Product resource reservations changed while the lifecycle batch was committing. No partial reservation/release was accepted.', {
        status: 409,
        code: 'inventory_lifecycle_product_reservation_atomic_failed',
        details: clean(error?.message || error, 300),
      });
    }
  }

  return Object.freeze({
    ok: true,
    build: INVENTORY_LIFECYCLE_BUILD,
    contract: INVENTORY_LIFECYCLE_CONTRACT,
    product_id: productId,
    release,
    results: Object.freeze(plans.map((row) => Object.freeze({
      ok: true,
      skipped_reservation: Boolean(row.skipped_reservation),
      site_item_inventory_id: positiveId(row.site_item_inventory_id),
      source_type: row.source_type || row.resource_kind || '',
      external_key: row.external_key || row.source_key || '',
      item_name: row.item_name || '',
      required_quantity: row.required_usage_quantity,
      stock_quantity_required: row.stock_quantity_required,
      previous_reserved_quantity: row.previous_reserved_quantity ?? quantity(row.reserved_quantity),
      new_reserved_quantity: row.new_reserved_quantity ?? quantity(row.reserved_quantity),
      consumption_mode: row.consumption_mode || 'per_unit',
    }))),
  });
}
