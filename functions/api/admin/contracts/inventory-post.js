// Devil n Dove Build 309 — Inventory-owned implementation of the inventory-post contract.
import {
  auditAdminAction,
  captureRuntimeIncident,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
} from '../../_lib/adminAudit.js';
import {
  BUILD,
  CONTRACT_ID,
  IMPLEMENTATION_STATE,
  InventoryPostError,
  getInventoryPostReadiness,
  postCreativeInventoryUsage,
} from '../../_lib/inventoryPostService.js';

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}

async function access(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { response: json({ ok: false, error: 'Admin access required.' }, 401) };
  const db = getDb(context.env);
  if (!db) return { response: json({ ok: false, error: 'Database binding is not configured.' }, 500) };
  return { adminUser, db };
}

export async function onRequestGet(context) {
  const granted = await access(context);
  if (granted.response) return granted.response;

  try {
    const readiness = await getInventoryPostReadiness(granted.db);
    return json({
      ok: true,
      build: BUILD,
      contract: CONTRACT_ID,
      owner: 'inventory',
      consumer: 'creative',
      implementation_state: IMPLEMENTATION_STATE,
      consumer_writes_ready: false,
      requires_approved_material_review: true,
      requires_positive_usage_quantity: true,
      supports_fractional_usage: true,
      supports_log_only: true,
      supports_reusable: true,
      atomic_review_posting: true,
      schema_ready: readiness.schemaReady,
      missing_tables: [...readiness.missingTables],
    });
  } catch (error) {
    return json({
      ok: false,
      build: BUILD,
      contract: CONTRACT_ID,
      error: 'Inventory posting readiness check failed.',
      error_code: 'inventory_post_readiness_failed',
      detail: String(error?.message || error),
    }, 500);
  }
}

export async function onRequestPost(context) {
  const granted = await access(context);
  if (granted.response) return granted.response;

  let body = {};
  try {
    body = await context.request.json();
  } catch {
    return json({ ok: false, error: 'A JSON request body is required.', error_code: 'invalid_json' }, 400);
  }

  try {
    const result = await postCreativeInventoryUsage(granted.db, {
      creative_work_project_id: body.creative_work_project_id,
      creative_work_event_id: body.creative_work_event_id,
      site_item_inventory_id: body.site_item_inventory_id,
      usage_quantity_consumed: body.usage_quantity_consumed,
      notes: body.notes,
      authorized_by: granted.adminUser.user_id,
    });

    await auditAdminAction(context.env, context.request, granted.adminUser, {
      action_type: result.alreadyPosted ? 'inventory_post_replayed' : 'inventory_post_posted',
      target_type: 'creative_project_inventory_post',
      target_id: result.postId || null,
      target_key: `creative-event:${Number(body.creative_work_event_id || 0) || 0}`,
      details: {
        contract: CONTRACT_ID,
        build: BUILD,
        creative_work_project_id: Number(body.creative_work_project_id || 0) || null,
        creative_work_event_id: Number(body.creative_work_event_id || 0) || null,
        site_item_inventory_id: Number(body.site_item_inventory_id || 0) || null,
        original_site_inventory_movement_id: result.originalMovementId || null,
        usage_quantity_consumed: Number(result.usageQuantityConsumed || 0),
        stock_quantity_consumed: Number(result.stockQuantityConsumed || 0),
        already_posted: Boolean(result.alreadyPosted),
      },
    });

    return json({
      ...result,
      build: BUILD,
      owner: 'inventory',
      implementation_state: IMPLEMENTATION_STATE,
      consumer_writes_ready: false,
    });
  } catch (error) {
    const status = error instanceof InventoryPostError ? error.status : 500;
    const code = error instanceof InventoryPostError ? error.code : 'inventory_post_failed';

    if (status >= 500) {
      await captureRuntimeIncident(context.env, context.request, {
        incident_scope: 'inventory-post',
        incident_code: code,
        severity: 'error',
        message: String(error?.message || error),
        related_user_id: granted.adminUser.user_id,
        details: {
          creative_work_project_id: Number(body.creative_work_project_id || 0) || null,
          creative_work_event_id: Number(body.creative_work_event_id || 0) || null,
          site_item_inventory_id: Number(body.site_item_inventory_id || 0) || null,
        },
      });
    }

    return json({
      ok: false,
      build: BUILD,
      contract: CONTRACT_ID,
      owner: 'inventory',
      error: String(error?.message || 'Inventory posting failed.'),
      error_code: code,
      details: error instanceof InventoryPostError ? error.details : null,
    }, status);
  }
}
