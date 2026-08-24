// Devil n Dove Build 310 — Creative consumer adapter for Inventory-owned posting authority.
// This file performs no Inventory mutation itself; it delegates reviewed-material posting
// to the Build 309 Inventory service and preserves the Creative helper result shape.

import {
  InventoryPostError,
  postCreativeInventoryUsage,
} from './inventoryPostService.js';

export const BUILD = 310;
export const CONTRACT_ID = 'inventory-post';
export const AUTHORITY = 'inventory';
export const CONSUMER = 'creative';

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

function normalizedTrackingMode(value, sourceType = '') {
  const requested = String(value || '').trim().toLowerCase();
  if (['exact', 'estimated', 'log_only', 'reusable'].includes(requested)) return requested;
  return String(sourceType || '').trim().toLowerCase() === 'tool' ? 'reusable' : 'exact';
}

async function loadInventoryItem(db, inventoryId) {
  return db.prepare(`
    SELECT sii.*,COALESCE(
      siup.usage_tracking_mode,
      CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END
    ) AS usage_tracking_mode,
    COALESCE(siup.minimum_usage_increment,0.001) AS minimum_usage_increment
    FROM site_item_inventory sii
    LEFT JOIN site_inventory_usage_profiles siup
      ON siup.site_item_inventory_id=sii.site_item_inventory_id
    WHERE sii.site_item_inventory_id=? AND sii.is_active=1
    LIMIT 1
  `).bind(inventoryId).first();
}

export async function postCreativeInventoryThroughContract(db, input = {}) {
  if (!db) {
    throw new InventoryPostError('Database binding is not configured.', {
      status: 500,
      code: 'creative_inventory_post_db_missing',
    });
  }

  const projectId = positiveId(input.projectId);
  const eventId = positiveId(input.eventId);
  const inventoryId = positiveId(input.inventoryId);
  const usageQuantity = positiveQuantity(input.usageQuantity);
  const userId = positiveId(input.userId);
  const notes = boundedText(input.notes, 400);

  if (!projectId || !eventId || !inventoryId || !usageQuantity || !userId) {
    throw new InventoryPostError('Project, reviewed material event, Inventory item, positive usage quantity, and administrator are required.', {
      code: 'creative_inventory_post_request_invalid',
    });
  }

  const item = await loadInventoryItem(db, inventoryId);
  if (!item) {
    throw new InventoryPostError('The selected Inventory item was not found or is inactive.', {
      status: 404,
      code: 'creative_inventory_post_item_not_found',
    });
  }

  const result = await postCreativeInventoryUsage(db, {
    creative_work_project_id: projectId,
    creative_work_event_id: eventId,
    site_item_inventory_id: inventoryId,
    usage_quantity_consumed: usageQuantity,
    notes,
    authorized_by: userId,
  });

  const trackingMode = String(
    result?.trackingMode || result?.post?.posted_tracking_mode || normalizedTrackingMode(item.usage_tracking_mode, item.source_type)
  ).trim().toLowerCase() || 'exact';
  const perStock = Math.max(0.001, Number(result?.usageUnitsPerStockUnit || item.usage_units_per_stock_unit || 1) || 1);
  const stockQuantity = Math.max(0, Number(result?.stockQuantityConsumed ?? result?.post?.stock_quantity_consumed ?? 0));
  const previous = Math.max(0, Number(result?.previousOnHandQuantity ?? result?.post?.previous_on_hand_quantity ?? item.on_hand_quantity ?? 0));
  const next = Math.max(0, Number(result?.newOnHandQuantity ?? result?.post?.new_on_hand_quantity ?? item.on_hand_quantity ?? 0));

  return Object.freeze({
    item: Object.freeze({ ...item }),
    trackingMode,
    perStock,
    stockQuantity,
    previous,
    next,
    allocatedCostCents: Math.max(0, Number(result?.allocatedCostCents || 0)),
    alreadyPosted: Boolean(result?.alreadyPosted),
    postId: positiveId(result?.postId) || null,
    originalMovementId: positiveId(result?.originalMovementId) || null,
    contract: CONTRACT_ID,
    authority: AUTHORITY,
    consumerBuild: BUILD,
  });
}
