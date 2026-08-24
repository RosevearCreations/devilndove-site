// Devil n Dove Build 309 — Inventory-owned reviewed Creative material posting authority.
// This service owns the mutation transaction but is not consumer-enabled until a later cutover.

export const BUILD = 309;
export const CONTRACT_ID = 'inventory-post';
export const IMPLEMENTATION_STATE = 'implemented-not-consumer-enabled';

const EPSILON = 1e-9;
const REQUIRED_TABLES = Object.freeze([
  'creative_project_material_reviews',
  'creative_project_inventory_posts',
  'creative_project_inventory_usage_details',
  'site_item_inventory',
  'site_inventory_usage_profiles',
  'site_inventory_movements',
  'site_inventory_usage_movements',
]);

export class InventoryPostError extends Error {
  constructor(message, { status = 400, code = 'inventory_post_invalid', details = null } = {}) {
    super(message);
    this.name = 'InventoryPostError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function positiveId(value) {
  const n = Number(value || 0);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

function positiveQuantity(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function boundedText(value, max = 500) {
  return String(value || '').trim().slice(0, max);
}

function trackingMode(value, sourceType = '') {
  const requested = String(value || '').trim().toLowerCase();
  if (['exact', 'estimated', 'log_only', 'reusable'].includes(requested)) return requested;
  return String(sourceType || '').trim().toLowerCase() === 'tool' ? 'reusable' : 'exact';
}

function requestMarker() {
  const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `[DD-B309-POST:${id}]`;
}

async function existingPost(db, reviewId) {
  return db.prepare(`
    SELECT ip.*,sii.item_name,sii.stock_unit_label,sii.usage_unit_label,sii.unit_cost_cents,
           COALESCE(iud.usage_quantity_consumed,ip.stock_quantity_consumed,0) AS usage_quantity_consumed,
           COALESCE(iud.usage_unit_label,sii.usage_unit_label,'unit') AS posted_usage_unit_label,
           COALESCE(iud.tracking_mode,'exact') AS posted_tracking_mode
    FROM creative_project_inventory_posts ip
    JOIN site_item_inventory sii ON sii.site_item_inventory_id=ip.site_item_inventory_id
    LEFT JOIN creative_project_inventory_usage_details iud
      ON iud.creative_project_inventory_post_id=ip.creative_project_inventory_post_id
    WHERE ip.creative_project_material_review_id=?
    LIMIT 1
  `).bind(reviewId).first().catch(() => null);
}

async function movementForNote(db, note) {
  return db.prepare(`
    SELECT site_inventory_movement_id,site_item_inventory_id,movement_type,quantity_delta,
           previous_on_hand_quantity,new_on_hand_quantity,note,actor_user_id,created_at
    FROM site_inventory_movements
    WHERE note=?
    ORDER BY site_inventory_movement_id DESC
    LIMIT 1
  `).bind(note).first().catch(() => null);
}

export async function getInventoryPostReadiness(db) {
  if (!db) {
    return Object.freeze({ schemaReady: false, missingTables: Object.freeze([...REQUIRED_TABLES]) });
  }
  const placeholders = REQUIRED_TABLES.map(() => '?').join(',');
  const rows = await db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name IN (${placeholders})
  `).bind(...REQUIRED_TABLES).all();
  const present = new Set((rows?.results || []).map((row) => String(row.name || '')));
  const missing = REQUIRED_TABLES.filter((name) => !present.has(name));
  return Object.freeze({ schemaReady: missing.length === 0, missingTables: Object.freeze(missing) });
}

export async function postCreativeInventoryUsage(db, input = {}) {
  if (!db) {
    throw new InventoryPostError('Database binding is not configured.', {
      status: 500,
      code: 'inventory_post_db_missing',
    });
  }

  const projectId = positiveId(input.creative_work_project_id);
  const eventId = positiveId(input.creative_work_event_id);
  const inventoryId = positiveId(input.site_item_inventory_id);
  const usageQuantity = positiveQuantity(input.usage_quantity_consumed);
  const authorizedBy = positiveId(input.authorized_by);
  const notes = boundedText(input.notes, 400);

  if (!projectId || !eventId || !inventoryId || !usageQuantity || !authorizedBy) {
    throw new InventoryPostError('Project, approved material event, inventory item, positive usage quantity, and administrator are required.', {
      code: 'inventory_post_request_invalid',
    });
  }

  const review = await db.prepare(`
    SELECT creative_project_material_review_id,creative_work_project_id,creative_work_event_id,
           review_status,COALESCE(inventory_consumed,0) AS inventory_consumed
    FROM creative_project_material_reviews
    WHERE creative_work_project_id=? AND creative_work_event_id=?
    LIMIT 1
  `).bind(projectId, eventId).first();

  if (!review) {
    throw new InventoryPostError('The Creative material review was not found.', {
      status: 404,
      code: 'inventory_post_review_not_found',
    });
  }
  if (String(review.review_status || '').toLowerCase() !== 'approved') {
    throw new InventoryPostError('Approve the material review before posting Inventory usage.', {
      status: 409,
      code: 'inventory_post_review_not_approved',
    });
  }

  const reviewId = positiveId(review.creative_project_material_review_id);
  const prior = await existingPost(db, reviewId);
  if (prior) {
    return Object.freeze({
      ok: true,
      contract: CONTRACT_ID,
      alreadyPosted: true,
      post: Object.freeze({ ...prior }),
      postId: positiveId(prior.creative_project_inventory_post_id) || null,
      originalMovementId: null,
      stockQuantityConsumed: Number(prior.stock_quantity_consumed || 0),
      usageQuantityConsumed: Number(prior.usage_quantity_consumed || 0),
      allocatedCostCents: Math.max(0, Math.round(Number(prior.unit_cost_cents || 0) * Number(prior.stock_quantity_consumed || 0))),
    });
  }

  if (Number(review.inventory_consumed || 0) === 1) {
    throw new InventoryPostError('The approved material review is already marked as consumed but has no posting record. Posting was blocked for review.', {
      status: 409,
      code: 'inventory_post_review_state_inconsistent',
    });
  }

  const item = await db.prepare(`
    SELECT sii.*,COALESCE(
      siup.usage_tracking_mode,
      CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END
    ) AS usage_tracking_mode
    FROM site_item_inventory sii
    LEFT JOIN site_inventory_usage_profiles siup ON siup.site_item_inventory_id=sii.site_item_inventory_id
    WHERE sii.site_item_inventory_id=? AND sii.is_active=1
    LIMIT 1
  `).bind(inventoryId).first();

  if (!item) {
    throw new InventoryPostError('The selected Inventory item was not found or is inactive.', {
      status: 404,
      code: 'inventory_post_item_not_found',
    });
  }

  const mode = trackingMode(item.usage_tracking_mode, item.source_type);
  const perStock = Math.max(0.001, Number(item.usage_units_per_stock_unit || 1) || 1);
  const stockQuantity = ['log_only', 'reusable'].includes(mode) ? 0 : usageQuantity / perStock;
  const previousOnHand = Math.max(0, Number(item.on_hand_quantity || 0));

  if (stockQuantity > previousOnHand + EPSILON) {
    throw new InventoryPostError(`Only ${previousOnHand} ${item.stock_unit_label || 'unit'} are on hand.`, {
      status: 409,
      code: 'inventory_post_insufficient_stock',
      details: { previousOnHand, requestedStockQuantity: stockQuantity },
    });
  }

  const nextOnHand = Math.max(0, previousOnHand - stockQuantity);
  const reserved = Math.max(0, Number(item.reserved_quantity || 0));
  const incoming = Math.max(0, Number(item.incoming_quantity || 0));
  const marker = requestMarker();
  const postNotes = `${marker}${notes ? ` ${notes}` : ''}`.slice(0, 500);
  const movementNote = `Creative Project ${projectId}, event ${eventId}. Reviewed usage ${usageQuantity} ${item.usage_unit_label || 'unit'}; tracking ${mode}. ${marker}`;
  const usageNote = `Creative Project ${projectId}, event ${eventId}. ${marker}`;

  const statements = [
    db.prepare(`
      INSERT INTO creative_project_inventory_posts(
        creative_work_project_id,creative_work_event_id,creative_project_material_review_id,
        site_item_inventory_id,stock_quantity_consumed,previous_on_hand_quantity,new_on_hand_quantity,
        posted_by,notes
      )
      SELECT ?,?,?,?,?,?,?,?,?
      WHERE EXISTS(
        SELECT 1 FROM creative_project_material_reviews r
        WHERE r.creative_project_material_review_id=?
          AND r.creative_work_project_id=?
          AND r.creative_work_event_id=?
          AND LOWER(TRIM(COALESCE(r.review_status,'')))='approved'
          AND COALESCE(r.inventory_consumed,0)=0
      )
        AND EXISTS(
          SELECT 1 FROM site_item_inventory i
          WHERE i.site_item_inventory_id=? AND i.is_active=1
            AND ABS(COALESCE(i.on_hand_quantity,0)-?)<?
        )
        AND NOT EXISTS(
          SELECT 1 FROM creative_project_inventory_posts p
          WHERE p.creative_project_material_review_id=?
        )
    `).bind(
      projectId,eventId,reviewId,inventoryId,stockQuantity,previousOnHand,nextOnHand,authorizedBy,postNotes,
      reviewId,projectId,eventId,inventoryId,previousOnHand,EPSILON,reviewId,
    ),

    db.prepare(`
      UPDATE site_item_inventory
      SET on_hand_quantity=?,updated_at=CURRENT_TIMESTAMP
      WHERE site_item_inventory_id=?
        AND ABS(COALESCE(on_hand_quantity,0)-?)<?
        AND EXISTS(
          SELECT 1 FROM creative_project_inventory_posts p
          WHERE p.creative_project_material_review_id=? AND p.notes=?
        )
    `).bind(nextOnHand,inventoryId,previousOnHand,EPSILON,reviewId,postNotes),

    db.prepare(`
      INSERT INTO site_inventory_movements(
        site_item_inventory_id,source_type,external_key,item_name,movement_type,quantity_delta,
        previous_on_hand_quantity,new_on_hand_quantity,previous_reserved_quantity,new_reserved_quantity,
        previous_incoming_quantity,new_incoming_quantity,note,actor_user_id,created_at
      )
      SELECT ?,?,?,?,'consume',?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP
      WHERE EXISTS(
        SELECT 1 FROM creative_project_inventory_posts p
        WHERE p.creative_project_material_review_id=? AND p.notes=?
      )
    `).bind(
      inventoryId,item.source_type || null,item.external_key || null,item.item_name || null,
      -stockQuantity,previousOnHand,nextOnHand,reserved,reserved,incoming,incoming,
      movementNote,authorizedBy,reviewId,postNotes,
    ),

    db.prepare(`
      INSERT INTO creative_project_inventory_usage_details(
        creative_project_inventory_post_id,usage_quantity_consumed,usage_unit_label,
        stock_quantity_consumed,stock_unit_label,tracking_mode,is_estimated,created_at,updated_at
      )
      SELECT p.creative_project_inventory_post_id,?,?,?,?,?,?,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
      FROM creative_project_inventory_posts p
      WHERE p.creative_project_material_review_id=? AND p.notes=?
    `).bind(
      usageQuantity,item.usage_unit_label || 'unit',stockQuantity,item.stock_unit_label || 'unit',
      mode,mode === 'estimated' ? 1 : 0,reviewId,postNotes,
    ),

    db.prepare(`
      INSERT INTO site_inventory_usage_movements(
        site_inventory_movement_id,site_item_inventory_id,usage_quantity_delta,usage_unit_label,
        stock_quantity_delta,stock_unit_label,tracking_mode,is_estimated,note,actor_user_id,created_at
      )
      SELECT sim.site_inventory_movement_id,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP
      FROM site_inventory_movements sim
      WHERE sim.note=?
        AND EXISTS(
          SELECT 1 FROM creative_project_inventory_posts p
          WHERE p.creative_project_material_review_id=? AND p.notes=?
        )
      ORDER BY sim.site_inventory_movement_id DESC
      LIMIT 1
    `).bind(
      inventoryId,-usageQuantity,item.usage_unit_label || 'unit',-stockQuantity,item.stock_unit_label || 'unit',
      mode,mode === 'estimated' ? 1 : 0,usageNote,authorizedBy,movementNote,reviewId,postNotes,
    ),

    db.prepare(`
      UPDATE creative_project_material_reviews
      SET inventory_consumed=1
      WHERE creative_project_material_review_id=?
        AND EXISTS(
          SELECT 1 FROM creative_project_inventory_posts p
          WHERE p.creative_project_material_review_id=? AND p.notes=?
        )
    `).bind(reviewId,reviewId,postNotes),
  ];

  let batchResult;
  try {
    batchResult = await db.batch(statements);
  } catch (error) {
    const raced = await existingPost(db, reviewId);
    if (raced) {
      return Object.freeze({
        ok: true,
        contract: CONTRACT_ID,
        alreadyPosted: true,
        post: Object.freeze({ ...raced }),
        postId: positiveId(raced.creative_project_inventory_post_id) || null,
        originalMovementId: null,
        stockQuantityConsumed: Number(raced.stock_quantity_consumed || 0),
        usageQuantityConsumed: Number(raced.usage_quantity_consumed || 0),
        allocatedCostCents: Math.max(0, Math.round(Number(raced.unit_cost_cents || 0) * Number(raced.stock_quantity_consumed || 0))),
      });
    }
    throw new InventoryPostError('The Inventory posting transaction failed.', {
      status: 500,
      code: 'inventory_post_transaction_failed',
      details: String(error?.message || error),
    });
  }

  const claimChanges = Number(batchResult?.[0]?.meta?.changes || 0);
  if (claimChanges !== 1) {
    const raced = await existingPost(db, reviewId);
    if (raced) {
      return Object.freeze({
        ok: true,
        contract: CONTRACT_ID,
        alreadyPosted: true,
        post: Object.freeze({ ...raced }),
        postId: positiveId(raced.creative_project_inventory_post_id) || null,
        originalMovementId: null,
        stockQuantityConsumed: Number(raced.stock_quantity_consumed || 0),
        usageQuantityConsumed: Number(raced.usage_quantity_consumed || 0),
        allocatedCostCents: Math.max(0, Math.round(Number(raced.unit_cost_cents || 0) * Number(raced.stock_quantity_consumed || 0))),
      });
    }
    throw new InventoryPostError('Inventory changed while the posting was being prepared. Refresh and retry.', {
      status: 409,
      code: 'inventory_post_stale_stock',
    });
  }

  const post = await existingPost(db, reviewId);
  const movement = await movementForNote(db, movementNote);

  if (!post) {
    throw new InventoryPostError('The Inventory posting transaction completed without a posting record.', {
      status: 500,
      code: 'inventory_post_missing_after_commit',
    });
  }

  return Object.freeze({
    ok: true,
    contract: CONTRACT_ID,
    alreadyPosted: false,
    post: Object.freeze({ ...post }),
    postId: positiveId(post.creative_project_inventory_post_id) || null,
    originalMovementId: positiveId(movement?.site_inventory_movement_id) || null,
    stockQuantityConsumed: stockQuantity,
    usageQuantityConsumed: usageQuantity,
    previousOnHandQuantity: previousOnHand,
    newOnHandQuantity: nextOnHand,
    trackingMode: mode,
    usageUnitsPerStockUnit: perStock,
    allocatedCostCents: Math.max(0, Math.round(Number(item.unit_cost_cents || 0) * (usageQuantity / perStock))),
  });
}
