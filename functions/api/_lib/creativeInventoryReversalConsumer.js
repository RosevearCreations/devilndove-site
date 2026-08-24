// Devil n Dove Build 308 — Creative consumer adapter for Inventory-owned reversal authority.
// Creative resolves the original movement provenance, then delegates all reversal mutation
// to inventoryReversalService. This file never performs stock, movement, or reversal writes.

import {
  CONFIRMATION_TEXT,
  InventoryReversalError,
  reverseCreativeInventoryPost,
} from './inventoryReversalService.js';

export const BUILD = 308;
export const CONTRACT_ID = 'inventory-reverse';
export const AUTHORITY = 'inventory';
export const CONSUMER = 'creative';

const EPSILON = 1e-9;

function positiveId(value) {
  const n = Number(value || 0);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

function boundedText(value, max = 500) {
  return String(value || '').trim().slice(0, max);
}

async function loadCreativeInventoryPost(db, projectId, postId) {
  return db.prepare(`
    SELECT ip.creative_project_inventory_post_id,ip.creative_work_project_id,ip.creative_work_event_id,
           ip.creative_project_material_review_id,ip.site_item_inventory_id,ip.stock_quantity_consumed,
           ip.previous_on_hand_quantity,ip.new_on_hand_quantity,ip.posting_status,ip.posted_by,
           sii.item_name,sii.stock_unit_label,sii.on_hand_quantity,
           COALESCE(iud.usage_quantity_consumed,ip.stock_quantity_consumed,0) AS usage_quantity_consumed
    FROM creative_project_inventory_posts ip
    JOIN site_item_inventory sii ON sii.site_item_inventory_id=ip.site_item_inventory_id
    LEFT JOIN creative_project_inventory_usage_details iud
      ON iud.creative_project_inventory_post_id=ip.creative_project_inventory_post_id
    WHERE ip.creative_project_inventory_post_id=? AND ip.creative_work_project_id=?
    LIMIT 1
  `).bind(postId, projectId).first();
}

async function existingReversal(db, postId) {
  return db.prepare(`
    SELECT creative_project_inventory_reversal_id,creative_project_inventory_post_id,
           stock_quantity_restored,new_on_hand_quantity
    FROM creative_project_inventory_reversals
    WHERE creative_project_inventory_post_id=?
    LIMIT 1
  `).bind(postId).first().catch(() => null);
}

export async function resolveOriginalCreativeInventoryMovement(db, post = {}) {
  const projectId = positiveId(post.creative_work_project_id);
  const eventId = positiveId(post.creative_work_event_id);
  const inventoryId = positiveId(post.site_item_inventory_id);
  const postedBy = positiveId(post.posted_by);
  const stockQuantity = Math.max(0, Number(post.stock_quantity_consumed || 0));

  if (!projectId || !eventId || !inventoryId) {
    throw new InventoryReversalError('Creative inventory posting provenance is incomplete.', {
      status: 409,
      code: 'creative_inventory_reversal_provenance_incomplete',
    });
  }

  const notePrefix = `Creative Project ${projectId}, event ${eventId}.%`;
  const rows = await db.prepare(`
    SELECT site_inventory_movement_id,site_item_inventory_id,movement_type,quantity_delta,
           previous_on_hand_quantity,new_on_hand_quantity,note,actor_user_id,created_at
    FROM site_inventory_movements
    WHERE site_item_inventory_id=?
      AND LOWER(TRIM(COALESCE(movement_type,'')))='consume'
      AND ABS(COALESCE(quantity_delta,0)+?)<?
      AND ABS(COALESCE(previous_on_hand_quantity,0)-?)<?
      AND ABS(COALESCE(new_on_hand_quantity,0)-?)<?
      AND COALESCE(note,'') LIKE ?
      AND (?=0 OR COALESCE(actor_user_id,0)=?)
    ORDER BY site_inventory_movement_id DESC
    LIMIT 3
  `).bind(
    inventoryId,
    stockQuantity, EPSILON,
    Number(post.previous_on_hand_quantity || 0), EPSILON,
    Number(post.new_on_hand_quantity || 0), EPSILON,
    notePrefix,
    postedBy, postedBy,
  ).all();

  const candidates = rows?.results || [];
  if (candidates.length === 0) {
    throw new InventoryReversalError('The original Inventory consume movement for this Creative posting could not be resolved.', {
      status: 409,
      code: 'creative_inventory_reversal_original_movement_missing',
    });
  }
  if (candidates.length !== 1) {
    throw new InventoryReversalError('More than one Inventory movement matches this Creative posting. Reversal was blocked for review.', {
      status: 409,
      code: 'creative_inventory_reversal_original_movement_ambiguous',
      details: candidates.map((row) => positiveId(row.site_inventory_movement_id)).filter(Boolean),
    });
  }

  return Object.freeze({
    movementId: positiveId(candidates[0].site_inventory_movement_id),
    movement: Object.freeze({ ...candidates[0] }),
  });
}

export async function reverseCreativeInventoryThroughContract(db, input = {}) {
  if (!db) {
    throw new InventoryReversalError('Database binding is not configured.', {
      status: 500,
      code: 'creative_inventory_reversal_db_missing',
    });
  }

  const projectId = positiveId(input.projectId);
  const postId = positiveId(input.postId);
  const userId = positiveId(input.userId);
  const reason = boundedText(input.reason, 500);

  if (!projectId || !postId || !userId || reason.length < 8) {
    throw new InventoryReversalError('A Creative project, posted inventory record, administrator, and clear reversal reason are required.', {
      code: 'creative_inventory_reversal_request_invalid',
    });
  }

  const post = await loadCreativeInventoryPost(db, projectId, postId);
  if (!post) {
    throw new InventoryReversalError('The inventory posting was not found.', {
      status: 404,
      code: 'creative_inventory_reversal_post_not_found',
    });
  }

  const prior = await existingReversal(db, postId);
  if (String(post.posting_status || '').toLowerCase() === 'reversed' || prior) {
    return Object.freeze({
      post: Object.freeze({ ...post }),
      alreadyReversed: true,
      restored: Number(prior?.stock_quantity_restored || 0),
      next: prior?.new_on_hand_quantity == null ? Number(post.on_hand_quantity || 0) : Number(prior.new_on_hand_quantity || 0),
      contract: CONTRACT_ID,
      authority: AUTHORITY,
      consumerBuild: BUILD,
      originalMovementId: null,
    });
  }

  const original = await resolveOriginalCreativeInventoryMovement(db, post);
  const result = await reverseCreativeInventoryPost(db, {
    creative_work_project_id: projectId,
    creative_project_inventory_post_id: postId,
    original_site_inventory_movement_id: original.movementId,
    reason,
    confirmation: CONFIRMATION_TEXT,
    authorized_by: userId,
  });

  return Object.freeze({
    post: Object.freeze({ ...post }),
    alreadyReversed: Boolean(result?.alreadyReversed),
    restored: Number(result?.restoredStockQuantity || 0),
    next: result?.newOnHandQuantity == null ? Number(post.on_hand_quantity || 0) : Number(result.newOnHandQuantity || 0),
    contract: CONTRACT_ID,
    authority: AUTHORITY,
    consumerBuild: BUILD,
    originalMovementId: original.movementId,
    compensatingMovementId: positiveId(result?.compensatingMovementId) || null,
  });
}
