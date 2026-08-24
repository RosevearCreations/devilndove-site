// Devil n Dove Build 310 — Creative Process posting-consumer cutover.
// The retained Build 308 Creative implementation remains the compatibility authority for
// non-posting actions. All three current reviewed-material posting workflows are intercepted
// here and delegated to the Inventory-owned Build 309 posting service.

import {
  auditAdminAction,
  captureRuntimeIncident,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText,
} from '../_lib/adminAudit.js';
import {
  BUILD as INVENTORY_POST_CONSUMER_BUILD,
  postCreativeInventoryThroughContract,
} from '../_lib/creativeInventoryPostConsumer.js';
import {
  BUILD as INVENTORY_REVERSAL_CONSUMER_BUILD,
  reverseCreativeInventoryThroughContract,
} from '../_lib/creativeInventoryReversalConsumer.js';
import {
  onRequestGet as compatibilityGet,
  onRequestPost as compatibilityPost,
} from './creative-process-compat.js';

const BUILD = '274';
const POST_CONSUMER_BUILD = INVENTORY_POST_CONSUMER_BUILD;
const REVERSAL_CONSUMER_BUILD = INVENTORY_REVERSAL_CONSUMER_BUILD;
const INTERCEPTED_POST_ACTIONS = new Set([
  'post_material_inventory',
  'record_inventory_use',
  'correct_inventory_use',
]);

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}
function num(value) {
  const n = Number(value || 0);
  return Number.isInteger(n) && n > 0 ? n : 0;
}
function text(value, max = 4000) {
  return normalizeText(value).slice(0, max);
}

async function access(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { response: json({ ok: false, error: 'Admin access required.' }, 401) };
  const db = getDb(context.env);
  if (!db) return { response: json({ ok: false, error: 'Database binding is not configured.' }, 500) };
  return { adminUser, db };
}

async function parseResponse(response) {
  try {
    return await response.json();
  } catch {
    return { ok: false, error: 'Creative Process returned a non-JSON response.' };
  }
}

function withConsumerMetadata(data = {}) {
  return {
    ...data,
    build: data?.build || BUILD,
    inventory_reversal_consumer_build: REVERSAL_CONSUMER_BUILD,
    inventory_reversal_authority: 'inventory-reverse',
    inventory_post_consumer_build: POST_CONSUMER_BUILD,
    inventory_post_authority: 'inventory-post',
  };
}

async function snapshot(context, projectId) {
  const url = new URL(context.request.url);
  url.searchParams.set('project_id', String(projectId));
  const request = new Request(url.toString(), {
    method: 'GET',
    headers: context.request.headers,
  });
  const response = await compatibilityGet({ ...context, request });
  return parseResponse(response);
}

async function postReviewedMaterial(db, { projectId, eventId, inventoryId, usageQuantity, userId, notes = '' }) {
  return postCreativeInventoryThroughContract(db, {
    projectId,
    eventId,
    inventoryId,
    usageQuantity,
    userId,
    notes,
  });
}

async function handlePostMaterialInventory(context, granted, body, projectId) {
  const eventId = num(body.creative_work_event_id);
  const inventoryId = num(body.site_item_inventory_id);
  const usageQuantity = Math.max(0, Number(body.usage_quantity_consumed ?? body.stock_quantity_consumed ?? 0) || 0);
  if (!projectId || !eventId || !inventoryId || usageQuantity <= 0) {
    throw new Error('Project, approved material, inventory item and a usage amount greater than zero are required.');
  }
  const posted = await postReviewedMaterial(granted.db, {
    projectId,
    eventId,
    inventoryId,
    usageQuantity,
    userId: granted.adminUser.user_id,
    notes: body.notes,
  });
  const message = ['log_only', 'reusable'].includes(posted.trackingMode)
    ? `Usage logged in ${posted.item.usage_unit_label || 'usage units'} without reducing stock (${posted.trackingMode}).`
    : `Inventory consumed using ${posted.perStock} ${posted.item.usage_unit_label || 'usage units'} per ${posted.item.stock_unit_label || 'stock unit'}.`;
  return { message };
}

async function handleRecordInventoryUse(context, granted, body, projectId) {
  const inventoryId = num(body.site_item_inventory_id);
  const usageQuantity = Math.max(0, Number(body.usage_quantity_consumed || 0) || 0);
  if (!projectId || !inventoryId || usageQuantity <= 0) {
    throw new Error('Choose an inventory item and enter the amount actually used.');
  }

  const item = await granted.db.prepare(`
    SELECT sii.*,COALESCE(
      siup.usage_tracking_mode,
      CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END
    ) usage_tracking_mode
    FROM site_item_inventory sii
    LEFT JOIN site_inventory_usage_profiles siup
      ON siup.site_item_inventory_id=sii.site_item_inventory_id
    WHERE sii.site_item_inventory_id=? AND sii.is_active=1
  `).bind(inventoryId).first();
  if (!item) throw new Error('Inventory item was not found.');

  const perStock = Math.max(0.001, Number(item.usage_units_per_stock_unit || 1) || 1);
  const allocatedCost = Math.max(0, Math.round(Number(item.unit_cost_cents || 0) * (usageQuantity / perStock)));
  const eventResult = await granted.db.prepare(`
    INSERT INTO creative_work_events(
      creative_work_project_id,event_type,event_title,event_notes,occurred_at,
      material_name,material_quantity,material_unit,material_cost_cents,is_public_candidate,created_by
    ) VALUES(?1,'material',?2,?3,CURRENT_TIMESTAMP,?4,?5,?6,?7,0,?8)
  `).bind(
    projectId,
    `Used ${item.item_name}`,
    text(body.notes, 1000) || 'Direct inventory usage recorded for this project.',
    item.item_name,
    usageQuantity,
    item.usage_unit_label || 'unit',
    allocatedCost,
    granted.adminUser.user_id,
  ).run();
  const eventId = num(eventResult.meta?.last_row_id);

  await granted.db.prepare(`
    INSERT INTO creative_project_material_reviews(
      creative_work_project_id,creative_work_event_id,review_status,actual_quantity,waste_quantity,
      reusable_quantity,approved_cost_cents,review_notes,inventory_consumed,reviewed_by,reviewed_at
    ) VALUES(?1,?2,'approved',?3,0,0,?4,?5,0,?6,CURRENT_TIMESTAMP)
  `).bind(
    projectId,
    eventId,
    usageQuantity,
    allocatedCost,
    text(body.notes, 500) || 'Direct project inventory usage.',
    granted.adminUser.user_id,
  ).run();

  const posted = await postReviewedMaterial(granted.db, {
    projectId,
    eventId,
    inventoryId,
    usageQuantity,
    userId: granted.adminUser.user_id,
    notes: body.notes,
  });

  return {
    message: `Recorded ${usageQuantity} ${posted.item.usage_unit_label || 'unit'} of ${posted.item.item_name} for this project; allocated cost ${Math.max(0, posted.allocatedCostCents) / 100} CAD.`,
  };
}

async function handleCorrectInventoryUse(context, granted, body, projectId) {
  const eventId = num(body.creative_work_event_id);
  const corrected = Math.max(0, Number(body.usage_quantity_consumed || 0) || 0);
  const reason = text(body.reason, 500);
  if (!projectId || !eventId || corrected <= 0 || reason.length < 8) {
    throw new Error('Choose a posted usage entry, enter the corrected actual amount, and provide a clear reason of at least 8 characters.');
  }

  const event = await granted.db.prepare(`
    SELECT * FROM creative_work_events
    WHERE creative_work_project_id=?1 AND creative_work_event_id=?2
      AND COALESCE(entry_status,'active')='active'
  `).bind(projectId, eventId).first();
  if (!event) throw new Error('The active inventory-use timeline entry was not found.');

  const oldPost = await granted.db.prepare(`
    SELECT * FROM creative_project_inventory_posts
    WHERE creative_work_project_id=?1 AND creative_work_event_id=?2 AND posting_status<>'reversed'
    ORDER BY creative_project_inventory_post_id DESC LIMIT 1
  `).bind(projectId, eventId).first();
  if (!oldPost) {
    throw new Error('No active inventory posting exists for this entry. You can edit the planned timeline entry directly instead.');
  }

  const item = await granted.db.prepare(`
    SELECT sii.*,COALESCE(
      siup.usage_tracking_mode,
      CASE WHEN LOWER(TRIM(COALESCE(sii.source_type,'')))='tool' THEN 'reusable' ELSE 'exact' END
    ) usage_tracking_mode
    FROM site_item_inventory sii
    LEFT JOIN site_inventory_usage_profiles siup
      ON siup.site_item_inventory_id=sii.site_item_inventory_id
    WHERE sii.site_item_inventory_id=?1 AND sii.is_active=1
  `).bind(oldPost.site_item_inventory_id).first();
  if (!item) {
    throw new Error('The linked inventory item is no longer active. Reactivate or replace it before correcting this posting.');
  }

  const perStock = Math.max(0.001, Number(item.usage_units_per_stock_unit || 1) || 1);
  const trackingMode = ['exact', 'estimated', 'log_only', 'reusable'].includes(String(item.usage_tracking_mode || '').toLowerCase())
    ? String(item.usage_tracking_mode).toLowerCase()
    : 'exact';
  const correctedStock = ['log_only', 'reusable'].includes(trackingMode) ? 0 : corrected / perStock;
  const stockAfterReversal = Math.max(0, Number(item.on_hand_quantity || 0)) + Math.max(0, Number(oldPost.stock_quantity_consumed || 0));
  if (correctedStock > stockAfterReversal + 1e-9) {
    throw new Error(`The corrected amount would require ${correctedStock} ${item.stock_unit_label || 'stock units'}, but only ${stockAfterReversal} would be available after reversing the original posting.`);
  }

  await reverseCreativeInventoryThroughContract(granted.db, {
    projectId,
    postId: Number(oldPost.creative_project_inventory_post_id),
    reason: `Corrected usage: ${reason}`,
    userId: granted.adminUser.user_id,
  });

  await granted.db.prepare(`
    UPDATE creative_work_events
    SET entry_status='voided',void_reason=?3,voided_by=?4,voided_at=CURRENT_TIMESTAMP
    WHERE creative_work_project_id=?1 AND creative_work_event_id=?2
  `).bind(
    projectId,
    eventId,
    `Superseded by corrected inventory usage. ${reason}`,
    granted.adminUser.user_id,
  ).run();

  const allocatedCost = Math.max(0, Math.round(Number(item.unit_cost_cents || 0) * (corrected / perStock)));
  const created = await granted.db.prepare(`
    INSERT INTO creative_work_events(
      creative_work_project_id,event_type,event_title,event_notes,occurred_at,duration_minutes,
      material_name,material_quantity,material_unit,material_cost_cents,media_url,is_public_candidate,created_by
    ) VALUES(?1,'material',?2,?3,CURRENT_TIMESTAMP,?4,?5,?6,?7,?8,?9,0,?10)
  `).bind(
    projectId,
    `Corrected: Used ${item.item_name}`,
    `Corrected inventory usage. Reason: ${reason}`,
    Math.max(0, Number(event.duration_minutes || 0)),
    item.item_name,
    corrected,
    item.usage_unit_label || 'unit',
    allocatedCost,
    event.media_url || null,
    granted.adminUser.user_id,
  ).run();
  const newEventId = num(created.meta?.last_row_id);

  await granted.db.prepare(`
    INSERT INTO creative_project_material_reviews(
      creative_work_project_id,creative_work_event_id,review_status,actual_quantity,waste_quantity,
      reusable_quantity,approved_cost_cents,review_notes,inventory_consumed,reviewed_by,reviewed_at
    ) VALUES(?1,?2,'approved',?3,0,0,?4,?5,0,?6,CURRENT_TIMESTAMP)
  `).bind(
    projectId,
    newEventId,
    corrected,
    allocatedCost,
    `Corrected from event ${eventId}. ${reason}`,
    granted.adminUser.user_id,
  ).run();

  const posted = await postReviewedMaterial(granted.db, {
    projectId,
    eventId: newEventId,
    inventoryId: Number(oldPost.site_item_inventory_id),
    usageQuantity: corrected,
    userId: granted.adminUser.user_id,
    notes: `Correction of event ${eventId}. ${reason}`,
  });

  return {
    message: `Inventory usage corrected to ${corrected} ${posted.item.usage_unit_label || 'unit'}. The original entry was reversed and preserved in audit history.`,
  };
}

async function finishInterceptedAction(context, granted, action, projectId, message) {
  const current = await snapshot(context, projectId);
  await auditAdminAction(context.env, context.request, granted.adminUser, {
    action_type: `creative_process_${action}`,
    target_type: 'creative_work_project',
    target_id: projectId,
    target_key: current?.detail?.project?.project_key || null,
    details: {
      review_first: true,
      automatic_publish: false,
      inventory_reversal_consumer_build: REVERSAL_CONSUMER_BUILD,
      inventory_post_consumer_build: POST_CONSUMER_BUILD,
      inventory_post_authority: 'inventory-post',
    },
  });
  return json(withConsumerMetadata({
    ok: true,
    message,
    projects: current?.projects || [],
    detail: current?.detail || null,
    mode: 'project_first_review_first',
  }));
}

export async function onRequestGet(context) {
  const response = await compatibilityGet(context);
  const data = await parseResponse(response);
  return json(withConsumerMetadata(data), response.status);
}

export async function onRequestPost(context) {
  const compatibilityContext = { ...context, request: context.request.clone() };
  let body = {};
  try {
    body = await context.request.json();
  } catch {
    return compatibilityPost(compatibilityContext);
  }

  const action = text(body.action, 80).toLowerCase();
  if (!INTERCEPTED_POST_ACTIONS.has(action)) {
    const response = await compatibilityPost(compatibilityContext);
    const data = await parseResponse(response);
    return json(withConsumerMetadata(data), response.status);
  }

  const granted = await access(context);
  if (granted.response) return granted.response;
  const projectId = num(body.creative_work_project_id || body.project_id);

  try {
    let result;
    if (action === 'post_material_inventory') {
      result = await handlePostMaterialInventory(context, granted, body, projectId);
    } else if (action === 'record_inventory_use') {
      result = await handleRecordInventoryUse(context, granted, body, projectId);
    } else {
      result = await handleCorrectInventoryUse(context, granted, body, projectId);
    }
    return finishInterceptedAction(context, granted, action, projectId, result.message);
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'creative_process_engine',
      incident_code: 'creative_process_post_failed',
      severity: 'warning',
      message: error?.message || 'Creative Process save failed.',
      related_user_id: granted.adminUser.user_id,
      details: {
        action,
        inventory_post_consumer_build: POST_CONSUMER_BUILD,
        inventory_post_authority: 'inventory-post',
        error: String(error?.stack || error),
      },
    });
    return json(withConsumerMetadata({ ok: false, error: error?.message || 'Creative Process save failed.' }), 400);
  }
}
