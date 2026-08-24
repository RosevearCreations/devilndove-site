// Devil n Dove Build 307 — Inventory-owned implementation of the inventory-reverse contract.
import {
  auditAdminAction,
  captureRuntimeIncident,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
} from '../../_lib/adminAudit.js';
import {
  BUILD,
  CONFIRMATION_TEXT,
  CONTRACT_ID,
  IMPLEMENTATION_STATE,
  InventoryReversalError,
  getInventoryReversalReadiness,
  reverseCreativeInventoryPost,
} from '../../_lib/inventoryReversalService.js';

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
    const readiness = await getInventoryReversalReadiness(granted.db);
    return json({
      ok: true,
      build: BUILD,
      contract: CONTRACT_ID,
      owner: 'inventory',
      implementation_state: IMPLEMENTATION_STATE,
      consumer_writes_ready: false,
      requires_original_movement_id: true,
      requires_creative_posting_id: true,
      compensating_movement_only: true,
      direct_stock_add_back_allowed: false,
      confirmation_required: CONFIRMATION_TEXT,
      schema_ready: readiness.schemaReady,
      missing_tables: [...readiness.missingTables],
    });
  } catch (error) {
    return json({
      ok: false,
      build: BUILD,
      contract: CONTRACT_ID,
      error: 'Inventory reversal readiness check failed.',
      error_code: 'inventory_reversal_readiness_failed',
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
    const result = await reverseCreativeInventoryPost(granted.db, {
      creative_work_project_id: body.creative_work_project_id,
      creative_project_inventory_post_id: body.creative_project_inventory_post_id,
      original_site_inventory_movement_id: body.original_site_inventory_movement_id,
      reason: body.reason,
      confirmation: body.confirmation,
      authorized_by: granted.adminUser.user_id,
    });

    await auditAdminAction(context.env, context.request, granted.adminUser, {
      action_type: result.alreadyReversed ? 'inventory_reversal_replayed' : 'inventory_reversal_posted',
      target_type: 'creative_project_inventory_post',
      target_id: Number(body.creative_project_inventory_post_id || 0) || null,
      target_key: `original-movement:${Number(body.original_site_inventory_movement_id || 0) || 0}`,
      details: {
        contract: CONTRACT_ID,
        build: BUILD,
        creative_work_project_id: Number(body.creative_work_project_id || 0) || null,
        original_site_inventory_movement_id: Number(body.original_site_inventory_movement_id || 0) || null,
        compensating_site_inventory_movement_id: result.compensatingMovementId || null,
        restored_stock_quantity: Number(result.restoredStockQuantity || 0),
        restored_usage_quantity: Number(result.restoredUsageQuantity || 0),
        already_reversed: Boolean(result.alreadyReversed),
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
    const status = error instanceof InventoryReversalError ? error.status : 500;
    const code = error instanceof InventoryReversalError ? error.code : 'inventory_reversal_failed';

    if (status >= 500) {
      await captureRuntimeIncident(context.env, context.request, {
        incident_scope: 'inventory-reversal',
        incident_code: code,
        severity: 'error',
        message: String(error?.message || error),
        related_user_id: granted.adminUser.user_id,
        details: {
          creative_work_project_id: Number(body.creative_work_project_id || 0) || null,
          creative_project_inventory_post_id: Number(body.creative_project_inventory_post_id || 0) || null,
          original_site_inventory_movement_id: Number(body.original_site_inventory_movement_id || 0) || null,
        },
      });
    }

    return json({
      ok: false,
      build: BUILD,
      contract: CONTRACT_ID,
      owner: 'inventory',
      error: String(error?.message || 'Inventory reversal failed.'),
      error_code: code,
      details: error instanceof InventoryReversalError ? error.details : null,
    }, status);
  }
}
