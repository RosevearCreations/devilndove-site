// Devil n Dove Build 440 — barcode-first Tool/Supply receiving API.
// GET is read-only resolution/search/context. POST delegates all stock/lot mutation to the shared receiving service.

import {
  auditAdminAction,
  captureRuntimeIncident,
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
  normalizeText,
} from '../_lib/adminAudit.js';
import {
  inventoryReceivingSchemaReadiness,
  loadRecentReceivingClaims,
  loadReceivingItemContext,
  receiveInventoryItem,
  resolveInventoryByIdentifier,
  searchReceivingInventory,
} from '../_lib/inventoryReceiving.js';

const BUILD = 440;
function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function positiveId(value) { const n = Number(value || 0); return Number.isInteger(n) && n > 0 ? n : 0; }
function bounded(value, max = 180) { return normalizeText(value).slice(0, max); }

async function access(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { error: json({ ok: false, build: BUILD, error: 'Unauthorized.' }, 401) };
  const db = getDb(context.env);
  if (!db) return { error: json({ ok: false, build: BUILD, error: 'Database binding is not configured.' }, 500) };
  const schema = await inventoryReceivingSchemaReadiness(db);
  return { adminUser, db, schema };
}

export async function onRequestGet(context) {
  const a = await access(context);
  if (a.error) return a.error;
  if (!a.schema.ok) {
    return json({ ok: false, build: BUILD, schema_ready: false, missing_tables: a.schema.missing_tables, mutation_capability: 'none', error: 'Build 440 Inventory receiving schema is not ready.' }, 503);
  }

  const url = new URL(context.request.url);
  const code = bounded(url.searchParams.get('code'), 180);
  const type = bounded(url.searchParams.get('type'), 40);
  const query = bounded(url.searchParams.get('q'), 180);
  const inventoryId = positiveId(url.searchParams.get('site_item_inventory_id'));
  try {
    if (code) {
      const resolution = await resolveInventoryByIdentifier(a.db, code, type);
      const detail = resolution.resolved ? await loadReceivingItemContext(a.db, resolution.resolved.site_item_inventory_id) : null;
      return json({ ok: true, build: BUILD, schema_ready: true, mode: 'identifier', code, resolution, detail, mutation_capability: 'post_receive_only' });
    }
    if (inventoryId) {
      const detail = await loadReceivingItemContext(a.db, inventoryId);
      if (!detail) return json({ ok: false, build: BUILD, error: 'Inventory item not found.' }, 404);
      return json({ ok: true, build: BUILD, schema_ready: true, mode: 'item', detail, mutation_capability: 'post_receive_only' });
    }
    if (query) {
      const candidates = await searchReceivingInventory(a.db, query, 30);
      return json({ ok: true, build: BUILD, schema_ready: true, mode: 'search', query, candidates, mutation_capability: 'none' });
    }
    const recent = await loadRecentReceivingClaims(a.db, 30);
    return json({ ok: true, build: BUILD, schema_ready: true, mode: 'recent', recent, mutation_capability: 'none' });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'inventory_receiving',
      incident_code: 'inventory_receiving_get_failed',
      severity: 'warning',
      message: error?.message || 'Inventory receiving data could not load.',
      related_user_id: a.adminUser.user_id,
      details: { code: code || null, query: query || null, site_item_inventory_id: inventoryId || null },
    }).catch(() => null);
    return json({ ok: false, build: BUILD, error: error?.message || 'Inventory receiving data could not load.' }, Number(error?.status || 500));
  }
}

export async function onRequestPost(context) {
  const a = await access(context);
  if (a.error) return a.error;
  if (!a.schema.ok) return json({ ok: false, build: BUILD, schema_ready: false, missing_tables: a.schema.missing_tables, error: 'Apply the Build 440 receiving migration before receiving stock.' }, 503);

  let body = {};
  try { body = await context.request.json(); }
  catch { return json({ ok: false, build: BUILD, error: 'Invalid JSON body.' }, 400); }
  const action = bounded(body.action || 'receive', 40).toLowerCase();
  if (action !== 'receive') return json({ ok: false, build: BUILD, error: 'Unsupported receiving action.' }, 400);

  try {
    const result = await receiveInventoryItem(a.db, body, Number(a.adminUser.user_id || 0));
    const claim = result.claim || {};
    await auditAdminAction(context.env, context.request, a.adminUser, {
      action_type: result.idempotent_replay ? 'inventory_receive_idempotent_replay' : 'inventory_receive',
      target_type: 'site_item_inventory',
      target_id: Number(claim.site_item_inventory_id || result.item?.site_item_inventory_id || 0),
      target_key: result.item?.item_name || claim.lot_code || bounded(body.receive_key, 120),
      details: {
        receive_key: claim.receive_key || bounded(body.receive_key, 120),
        lot_code: claim.lot_code || bounded(body.lot_code, 120),
        quantity_received: Number(claim.quantity_received || body.quantity_received || 0),
        quantity_incoming_cleared: Number(claim.quantity_incoming_cleared || 0),
        inventory_purchase_lot_id: Number(claim.inventory_purchase_lot_id || 0) || null,
        supplier_purchase_order_item_id: Number(claim.supplier_purchase_order_item_id || 0) || null,
        idempotent_replay: Boolean(result.idempotent_replay),
        warnings: result.warnings || [],
      },
    });
    return json({
      ok: true,
      build: BUILD,
      message: result.idempotent_replay ? 'This receipt was already posted; stock was not added twice.' : 'Inventory received and purchase-lot provenance recorded.',
      ...result,
      request_time_schema_mutation: false,
      r2_mutation: false,
      provider_execution: false,
    });
  } catch (error) {
    await captureRuntimeIncident(context.env, context.request, {
      incident_scope: 'inventory_receiving',
      incident_code: error?.code || 'inventory_receiving_post_failed',
      severity: Number(error?.status || 500) >= 500 ? 'error' : 'warning',
      message: error?.message || 'Inventory receiving failed safely.',
      related_user_id: a.adminUser.user_id,
      details: { receive_key: bounded(body.receive_key, 120) || null, site_item_inventory_id: positiveId(body.site_item_inventory_id) || null, error: String(error?.stack || error) },
    }).catch(() => null);
    return json({ ok: false, build: BUILD, error: error?.message || 'Inventory receiving failed safely.', error_code: error?.code || 'inventory_receiving_post_failed', details: error?.details || null }, Number(error?.status || 500));
  }
}
