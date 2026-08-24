// Devil n Dove Build 307 — Inventory-owned compensating reversal service.
// This service reuses the proven Creative inventory reversal ledger while moving
// reversal authority behind Inventory. It requires the original physical movement,
// creates only compensating movements, and does not enable Creative consumers yet.

export const BUILD = 307;
export const CONTRACT_ID = 'inventory-reverse';
export const CONFIRMATION_TEXT = 'REVERSE INVENTORY';
export const IMPLEMENTATION_STATE = 'implemented-not-consumer-enabled';

const EPSILON = 1e-9;
const REQUIRED_TABLES = Object.freeze([
  'site_item_inventory',
  'site_inventory_movements',
  'site_inventory_usage_movements',
  'creative_project_inventory_posts',
  'creative_project_inventory_usage_details',
  'creative_project_inventory_reversals',
  'creative_project_material_reviews',
]);

export class InventoryReversalError extends Error {
  constructor(message, { status = 400, code = 'inventory_reversal_error', details = null } = {}) {
    super(message);
    this.name = 'InventoryReversalError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function positiveId(value) {
  const n = Number(value || 0);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

function boundedText(value, max = 500) {
  return String(value || '').trim().slice(0, max);
}

function approximatelyEqual(a, b, epsilon = EPSILON) {
  return Math.abs(Number(a || 0) - Number(b || 0)) <= epsilon;
}

function requestId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
}

export function validateCreativeMovementMatch(post = {}, movement = {}) {
  const errors = [];
  const expectedProject = positiveId(post.creative_work_project_id);
  const expectedEvent = positiveId(post.creative_work_event_id);
  const expectedInventory = positiveId(post.site_item_inventory_id);
  const expectedStock = Math.max(0, Number(post.stock_quantity_consumed || 0));
  const note = String(movement.note || '');

  if (positiveId(movement.site_item_inventory_id) !== expectedInventory) {
    errors.push('movement inventory item does not match the posting');
  }
  if (String(movement.movement_type || '').trim().toLowerCase() !== 'consume') {
    errors.push('movement is not the original Creative consume movement');
  }
  if (!approximatelyEqual(Number(movement.quantity_delta || 0), -expectedStock)) {
    errors.push('movement stock delta does not match the posted consumption');
  }
  if (!approximatelyEqual(movement.previous_on_hand_quantity, post.previous_on_hand_quantity)) {
    errors.push('movement previous stock does not match the posting');
  }
  if (!approximatelyEqual(movement.new_on_hand_quantity, post.new_on_hand_quantity)) {
    errors.push('movement new stock does not match the posting');
  }
  if (!note.includes(`Creative Project ${expectedProject}`) || !note.includes(`event ${expectedEvent}`)) {
    errors.push('movement provenance does not identify the Creative project and event');
  }
  if (positiveId(post.posted_by) && positiveId(movement.actor_user_id) && positiveId(post.posted_by) !== positiveId(movement.actor_user_id)) {
    errors.push('movement actor does not match the posting actor');
  }

  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

export async function getInventoryReversalReadiness(db) {
  if (!db) {
    return Object.freeze({
      build: BUILD,
      contract: CONTRACT_ID,
      owner: 'inventory',
      implementationState: IMPLEMENTATION_STATE,
      schemaReady: false,
      missingTables: REQUIRED_TABLES,
    });
  }

  const placeholders = REQUIRED_TABLES.map(() => '?').join(',');
  const result = await db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type='table' AND name IN (${placeholders})
  `).bind(...REQUIRED_TABLES).all();
  const found = new Set((result?.results || []).map((row) => String(row?.name || '')));
  const missingTables = REQUIRED_TABLES.filter((name) => !found.has(name));

  return Object.freeze({
    build: BUILD,
    contract: CONTRACT_ID,
    owner: 'inventory',
    implementationState: IMPLEMENTATION_STATE,
    consumerWritesReady: false,
    requiresOriginalMovementId: true,
    requiresCreativePostingId: true,
    compensatingMovementOnly: true,
    directStockAddBackAllowed: false,
    confirmationRequired: CONFIRMATION_TEXT,
    schemaReady: missingTables.length === 0,
    missingTables: Object.freeze(missingTables),
  });
}

async function existingReversal(db, postId) {
  return db.prepare(`
    SELECT creative_project_inventory_reversal_id,creative_project_inventory_post_id,
           creative_work_project_id,site_item_inventory_id,stock_quantity_restored,
           previous_on_hand_quantity,new_on_hand_quantity,reason,authorized_by,authorized_at
    FROM creative_project_inventory_reversals
    WHERE creative_project_inventory_post_id=?
    LIMIT 1
  `).bind(postId).first().catch(() => null);
}

export async function reverseCreativeInventoryPost(db, input = {}) {
  if (!db) throw new InventoryReversalError('Database binding is not configured.', { status: 500, code: 'inventory_reversal_db_missing' });

  const projectId = positiveId(input.creative_work_project_id);
  const postId = positiveId(input.creative_project_inventory_post_id);
  const originalMovementId = positiveId(input.original_site_inventory_movement_id);
  const authorizedBy = positiveId(input.authorized_by);
  const confirmation = boundedText(input.confirmation, 80);
  const reason = boundedText(input.reason, 500);

  if (!projectId || !postId || !originalMovementId || !authorizedBy) {
    throw new InventoryReversalError('Project, posting, original Inventory movement, and authorizing administrator are required.', {
      code: 'inventory_reversal_identifiers_required',
    });
  }
  if (confirmation !== CONFIRMATION_TEXT) {
    throw new InventoryReversalError(`Typed confirmation must be ${CONFIRMATION_TEXT}.`, {
      code: 'inventory_reversal_confirmation_required',
    });
  }
  if (reason.length < 8) {
    throw new InventoryReversalError('A clear reversal reason of at least 8 characters is required.', {
      code: 'inventory_reversal_reason_required',
    });
  }

  const post = await db.prepare(`
    SELECT ip.creative_project_inventory_post_id,ip.creative_work_project_id,ip.creative_work_event_id,
           ip.creative_project_material_review_id,ip.site_item_inventory_id,ip.stock_quantity_consumed,
           ip.previous_on_hand_quantity,ip.new_on_hand_quantity,ip.posting_status,ip.posted_by,ip.notes,
           sii.source_type,sii.external_key,sii.item_name,sii.on_hand_quantity,sii.reserved_quantity,
           sii.incoming_quantity,sii.stock_unit_label,sii.usage_unit_label,
           COALESCE(iud.usage_quantity_consumed,ip.stock_quantity_consumed,0) AS usage_quantity_consumed,
           COALESCE(iud.usage_unit_label,sii.usage_unit_label,'unit') AS posted_usage_unit_label,
           COALESCE(iud.stock_unit_label,sii.stock_unit_label,'unit') AS posted_stock_unit_label,
           COALESCE(iud.tracking_mode,'exact') AS posted_tracking_mode,
           COALESCE(iud.is_estimated,0) AS posted_is_estimated
    FROM creative_project_inventory_posts ip
    JOIN site_item_inventory sii ON sii.site_item_inventory_id=ip.site_item_inventory_id
    LEFT JOIN creative_project_inventory_usage_details iud
      ON iud.creative_project_inventory_post_id=ip.creative_project_inventory_post_id
    WHERE ip.creative_project_inventory_post_id=? AND ip.creative_work_project_id=?
    LIMIT 1
  `).bind(postId, projectId).first();

  if (!post) {
    throw new InventoryReversalError('The Creative inventory posting was not found.', {
      status: 404,
      code: 'inventory_reversal_post_not_found',
    });
  }

  const prior = await existingReversal(db, postId);
  if (String(post.posting_status || '').toLowerCase() === 'reversed' || prior) {
    return Object.freeze({
      ok: true,
      contract: CONTRACT_ID,
      alreadyReversed: true,
      reversal: prior || null,
      restoredStockQuantity: Number(prior?.stock_quantity_restored || 0),
    });
  }

  const movement = await db.prepare(`
    SELECT site_inventory_movement_id,site_item_inventory_id,source_type,external_key,item_name,movement_type,
           quantity_delta,previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,
           new_reserved_quantity,previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at
    FROM site_inventory_movements
    WHERE site_inventory_movement_id=?
    LIMIT 1
  `).bind(originalMovementId).first();

  if (!movement) {
    throw new InventoryReversalError('The original Inventory movement was not found.', {
      status: 404,
      code: 'inventory_reversal_movement_not_found',
    });
  }

  const match = validateCreativeMovementMatch(post, movement);
  if (!match.ok) {
    throw new InventoryReversalError('The supplied Inventory movement does not match the Creative posting.', {
      status: 409,
      code: 'inventory_reversal_movement_mismatch',
      details: [...match.errors],
    });
  }

  const currentOnHand = Math.max(0, Number(post.on_hand_quantity || 0));
  const restoredStock = Math.max(0, Number(post.stock_quantity_consumed || 0));
  const nextOnHand = currentOnHand + restoredStock;
  const usageRestored = Math.max(0, Number(post.usage_quantity_consumed || 0));
  const reserved = Math.max(0, Number(post.reserved_quantity || 0));
  const incoming = Math.max(0, Number(post.incoming_quantity || 0));
  const marker = `inventory-reverse-request:${requestId()}`;
  const provenance = `original-movement:${originalMovementId}`;
  const ledgerReason = `${reason} [${provenance}] [${marker}]`;
  const movementNote = `Inventory contract reversal of Creative post ${postId}; ${provenance}; ${marker}. Reason: ${reason}`;

  const statements = [
    db.prepare(`
      INSERT INTO creative_project_inventory_reversals(
        creative_project_inventory_post_id,creative_work_project_id,site_item_inventory_id,
        stock_quantity_restored,previous_on_hand_quantity,new_on_hand_quantity,reason,authorized_by,authorized_at
      )
      SELECT ?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP
      WHERE EXISTS(
        SELECT 1 FROM site_item_inventory
        WHERE site_item_inventory_id=? AND ABS(COALESCE(on_hand_quantity,0)-?)<?
      )
    `).bind(postId, projectId, post.site_item_inventory_id, restoredStock, currentOnHand, nextOnHand, ledgerReason, authorizedBy,
      post.site_item_inventory_id, currentOnHand, EPSILON),

    db.prepare(`
      UPDATE site_item_inventory
      SET on_hand_quantity=on_hand_quantity+?,updated_at=CURRENT_TIMESTAMP
      WHERE site_item_inventory_id=?
        AND ABS(COALESCE(on_hand_quantity,0)-?)<?
        AND EXISTS(
          SELECT 1 FROM creative_project_inventory_reversals
          WHERE creative_project_inventory_post_id=? AND reason=?
        )
    `).bind(restoredStock, post.site_item_inventory_id, currentOnHand, EPSILON, postId, ledgerReason),

    db.prepare(`
      INSERT INTO site_inventory_movements(
        site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,
        previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,
        previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at
      )
      SELECT ?,?,?,?,'correction',?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP
      WHERE EXISTS(
        SELECT 1 FROM creative_project_inventory_reversals
        WHERE creative_project_inventory_post_id=? AND reason=?
      )
    `).bind(
      post.site_item_inventory_id, post.source_type || null, post.external_key || null, post.item_name || null,
      restoredStock, currentOnHand, nextOnHand, reserved, reserved, incoming, incoming,
      movementNote, authorizedBy, postId, ledgerReason
    ),

    db.prepare(`
      INSERT INTO site_inventory_usage_movements(
        site_inventory_movement_id,site_item_inventory_id,usage_quantity_delta,usage_unit_label,
        stock_quantity_delta,stock_unit_label,tracking_mode,is_estimated,note,actor_user_id,created_at
      )
      SELECT sim.site_inventory_movement_id,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP
      FROM site_inventory_movements sim
      WHERE sim.note=?
        AND ?>0
        AND EXISTS(
          SELECT 1 FROM creative_project_inventory_reversals
          WHERE creative_project_inventory_post_id=? AND reason=?
        )
      ORDER BY sim.site_inventory_movement_id DESC
      LIMIT 1
    `).bind(
      post.site_item_inventory_id, usageRestored, post.posted_usage_unit_label || 'unit', restoredStock,
      post.posted_stock_unit_label || 'unit', post.posted_tracking_mode || 'exact', Number(post.posted_is_estimated || 0) === 1 ? 1 : 0,
      `Reversed Creative inventory usage; ${provenance}; ${marker}. Reason: ${reason}`,
      authorizedBy, movementNote, usageRestored, postId, ledgerReason
    ),

    db.prepare(`
      UPDATE creative_project_inventory_posts
      SET posting_status='reversed',notes=TRIM(COALESCE(notes,'') || ?)
      WHERE creative_project_inventory_post_id=?
        AND creative_work_project_id=?
        AND posting_status<>'reversed'
        AND EXISTS(
          SELECT 1 FROM creative_project_inventory_reversals
          WHERE creative_project_inventory_post_id=? AND reason=?
        )
    `).bind(` | Reversed through Inventory contract. ${provenance}. ${reason}`, postId, projectId, postId, ledgerReason),

    db.prepare(`
      UPDATE creative_project_material_reviews
      SET inventory_consumed=0
      WHERE creative_project_material_review_id=?
        AND EXISTS(
          SELECT 1 FROM creative_project_inventory_reversals
          WHERE creative_project_inventory_post_id=? AND reason=?
        )
    `).bind(post.creative_project_material_review_id, postId, ledgerReason),
  ];

  let batchResult;
  try {
    batchResult = await db.batch(statements);
  } catch (error) {
    const raced = await existingReversal(db, postId);
    if (raced) {
      return Object.freeze({
        ok: true,
        contract: CONTRACT_ID,
        alreadyReversed: true,
        reversal: raced,
        restoredStockQuantity: Number(raced.stock_quantity_restored || 0),
      });
    }
    throw new InventoryReversalError('The compensating Inventory reversal transaction failed.', {
      status: 500,
      code: 'inventory_reversal_transaction_failed',
      details: String(error?.message || error),
    });
  }

  const ledgerChanges = Number(batchResult?.[0]?.meta?.changes || 0);
  if (ledgerChanges !== 1) {
    const raced = await existingReversal(db, postId);
    if (raced) {
      return Object.freeze({
        ok: true,
        contract: CONTRACT_ID,
        alreadyReversed: true,
        reversal: raced,
        restoredStockQuantity: Number(raced.stock_quantity_restored || 0),
      });
    }
    throw new InventoryReversalError('Inventory changed while the reversal was being prepared. Refresh and retry.', {
      status: 409,
      code: 'inventory_reversal_stale_stock',
    });
  }

  const reversal = await existingReversal(db, postId);
  const compensatingMovement = await db.prepare(`
    SELECT site_inventory_movement_id,site_item_inventory_id,movement_type,quantity_delta,
           previous_on_hand_quantity,new_on_hand_quantity,note,actor_user_id,created_at
    FROM site_inventory_movements
    WHERE note=?
    ORDER BY site_inventory_movement_id DESC
    LIMIT 1
  `).bind(movementNote).first().catch(() => null);

  return Object.freeze({
    ok: true,
    contract: CONTRACT_ID,
    alreadyReversed: false,
    originalMovementId,
    compensatingMovementId: positiveId(compensatingMovement?.site_inventory_movement_id) || null,
    restoredStockQuantity: restoredStock,
    restoredUsageQuantity: usageRestored,
    previousOnHandQuantity: currentOnHand,
    newOnHandQuantity: nextOnHand,
    reversal: reversal || null,
  });
}
