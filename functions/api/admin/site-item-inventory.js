// Release 461 wrapper: usable/base-unit stock is canonical while the mature
// inventory endpoint remains the compatibility implementation for package receiving/costing.
// Release 467 Build 71 intercepts lifecycle mutations here so receiving, reservation,
// release, use, return, write-off and reorder semantics share one fail-closed authority.
import * as legacy from './_siteItemInventoryLegacy.js';
import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import {
  applyInventoryLifecycleAction,
  applyProductResourceReservationLifecycle,
  INVENTORY_LIFECYCLE_BUILD,
  INVENTORY_LIFECYCLE_CONTRACT,
  ITEM_LIFECYCLE_ACTIONS,
} from '../_lib/inventoryLifecycle.js';
import {
  assertInventoryBaseAuthorityReady,
  loadInventoryBaseBalances,
  mergeInventoryBaseAuthority,
  syncInventoryBaseBalance,
  syncInventoryBaseBalances,
  syncInventoryBaseBalancesBySource
} from './_inventoryBaseAuthority.js';

const LIFECYCLE_ACTIONS = new Set(ITEM_LIFECYCLE_ACTIONS);

function json(data, status = 200) { return jsonResponse(data, status); }

async function readBodyClone(request) {
  try { return await request.clone().json(); } catch { return {}; }
}

function idsFromPayload(data = {}) {
  const ids = [];
  if (data?.item?.site_item_inventory_id) ids.push(Number(data.item.site_item_inventory_id));
  for (const row of (Array.isArray(data?.results) ? data.results : [])) {
    if (row?.site_item_inventory_id) ids.push(Number(row.site_item_inventory_id));
  }
  return [...new Set(ids.filter((id) => id > 0))];
}

async function parseResponse(response) {
  try { return await response.clone().json(); } catch { return null; }
}

function lifecycleError(error) {
  const status = Math.max(400, Math.min(599, Number(error?.status || 400) || 400));
  return json({
    ok: false,
    error: String(error?.message || 'Inventory lifecycle action failed.'),
    code: String(error?.code || 'inventory_lifecycle_failed'),
    details: error?.details ?? null,
    build: INVENTORY_LIFECYCLE_BUILD,
    inventory_lifecycle_authority: INVENTORY_LIFECYCLE_CONTRACT,
  }, status);
}

async function enrichData(db, data = {}) {
  const itemIds = [];
  if (data?.item?.site_item_inventory_id) itemIds.push(Number(data.item.site_item_inventory_id));
  for (const row of (Array.isArray(data?.items) ? data.items : [])) {
    if (row?.site_item_inventory_id) itemIds.push(Number(row.site_item_inventory_id));
  }
  for (const row of (Array.isArray(data?.results) ? data.results : [])) {
    if (row?.site_item_inventory_id) itemIds.push(Number(row.site_item_inventory_id));
  }
  const balances = await loadInventoryBaseBalances(db, itemIds);
  const merge = (row) => row?.site_item_inventory_id
    ? mergeInventoryBaseAuthority(row, balances.get(Number(row.site_item_inventory_id)) || null)
    : row;
  const out = {
    ...data,
    quantity_authority: 'base',
    inventory_lifecycle_build: INVENTORY_LIFECYCLE_BUILD,
    inventory_lifecycle_authority: INVENTORY_LIFECYCLE_CONTRACT,
  };
  if (data?.item) out.item = merge(data.item);
  if (Array.isArray(data?.items)) out.items = data.items.map(merge);
  if (Array.isArray(data?.results)) out.results = data.results.map(merge);
  if (out.summary && Array.isArray(out.items)) {
    out.summary = {
      ...out.summary,
      base_on_hand_total: out.items.reduce((sum, row) => sum + Number(row?.base_on_hand_quantity || 0), 0),
      base_reserved_total: out.items.reduce((sum, row) => sum + Number(row?.base_reserved_quantity || 0), 0),
      base_incoming_total: out.items.reduce((sum, row) => sum + Number(row?.base_incoming_quantity || 0), 0)
    };
  }
  return out;
}

async function authorizedContext(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return { error: json({ ok: false, error: 'Unauthorized.' }, 401) };
  const db = getDb(context.env);
  try {
    await assertInventoryBaseAuthorityReady(db);
  } catch (error) {
    return {
      error: json({
        ok: false,
        error: 'Inventory usable-unit authority needs the current Release 461 Development migration before this operation can continue.',
        code: error?.code || 'inventory_base_authority_migration_required',
        retryable: false
      }, 503)
    };
  }
  return { adminUser, db };
}

export async function onRequestGet(context) {
  const ready = await authorizedContext(context);
  if (ready.error) return ready.error;
  const response = await legacy.onRequestGet(context);
  if (!response.ok) return response;
  const data = await parseResponse(response);
  if (!data) return response;
  return json(await enrichData(ready.db, data), response.status);
}

export async function onRequestPost(context) {
  const ready = await authorizedContext(context);
  if (ready.error) return ready.error;
  const body = await readBodyClone(context.request);
  const action = String(body?.action || '').trim().toLowerCase().replace(/-/g, '_');

  if (LIFECYCLE_ACTIONS.has(action)) {
    try {
      const result = await applyInventoryLifecycleAction(ready.db, {
        site_item_inventory_id: body?.site_item_inventory_id,
        action,
        quantity: body?.quantity,
        note: body?.note,
        actor_user_id: ready.adminUser.user_id,
      });
      const id = Number(result?.item?.site_item_inventory_id || 0);
      if (id) await syncInventoryBaseBalance(ready.db, id, ready.adminUser.user_id);
      await auditAdminAction(context.env, context.request, ready.adminUser, {
        action_type: `inventory_lifecycle_${action}`,
        target_type: 'inventory_item',
        target_id: id || null,
        target_key: `${result?.item?.source_type || ''}:${result?.item?.external_key || ''}`,
        details: {
          lifecycle_stage: result?.plan?.lifecycle_stage || null,
          requested_quantity: result?.plan?.requested_quantity || 0,
          previous_on_hand_quantity: result?.plan?.previous_on_hand_quantity || 0,
          new_on_hand_quantity: result?.plan?.new_on_hand_quantity || 0,
          previous_reserved_quantity: result?.plan?.previous_reserved_quantity || 0,
          new_reserved_quantity: result?.plan?.new_reserved_quantity || 0,
          previous_incoming_quantity: result?.plan?.previous_incoming_quantity || 0,
          new_incoming_quantity: result?.plan?.new_incoming_quantity || 0,
          accounting_context: result?.accounting_context || null,
          movement_id: result?.movement_id || null,
        }
      });
      return json(await enrichData(ready.db, {
        ok: true,
        item: result.item,
        action,
        details: result.plan,
        accounting_context: result.accounting_context,
        movement_id: result.movement_id,
      }));
    } catch (error) {
      return lifecycleError(error);
    }
  }

  if (action === 'reserve_product_resources' || action === 'release_product_resources') {
    const productId = Number(body?.product_id || 0);
    try {
      const result = await applyProductResourceReservationLifecycle(ready.db, {
        product_id: productId,
        quantity_multiplier: body?.quantity_multiplier,
        release: action === 'release_product_resources',
        note: body?.note,
        actor_user_id: ready.adminUser.user_id,
      });
      const ids = idsFromPayload(result);
      if (ids.length) await syncInventoryBaseBalances(ready.db, ids, ready.adminUser.user_id);
      const summary = {
        affected_items: result.results.filter((row) => row && row.ok && !row.skipped_reservation).length,
        skipped_items: result.results.filter((row) => row && row.skipped_reservation).length,
        missing_inventory_count: 0,
        failed_items: 0,
      };
      const product = await ready.db.prepare('SELECT product_id,name FROM products WHERE product_id=? LIMIT 1').bind(productId).first().catch(() => null);
      await auditAdminAction(context.env, context.request, ready.adminUser, {
        action_type: action === 'release_product_resources' ? 'inventory_release_product_resources' : 'inventory_reserve_product_resources',
        target_type: 'product',
        target_id: productId,
        details: { build: INVENTORY_LIFECYCLE_BUILD, lifecycle_authority: INVENTORY_LIFECYCLE_CONTRACT, results: result.results }
      });
      return json(await enrichData(ready.db, { ok: true, results: result.results, summary, product }));
    } catch (error) {
      return lifecycleError(error);
    }
  }

  const response = await legacy.onRequestPost(context);
  if (!response.ok) return response;
  const data = await parseResponse(response);
  if (!data) return response;

  if (action === 'sync_catalog') {
    await syncInventoryBaseBalancesBySource(ready.db, body?.source_types, ready.adminUser.user_id);
  } else {
    const ids = idsFromPayload(data);
    if (ids.length) await syncInventoryBaseBalances(ready.db, ids, ready.adminUser.user_id);
  }
  return json(await enrichData(ready.db, data), response.status);
}

export async function onRequestPatch(context) {
  const ready = await authorizedContext(context);
  if (ready.error) return ready.error;
  const response = await legacy.onRequestPatch(context);
  if (!response.ok) return response;
  const data = await parseResponse(response);
  if (!data) return response;
  const id = Number(data?.item?.site_item_inventory_id || 0);
  if (id) await syncInventoryBaseBalance(ready.db, id, ready.adminUser.user_id);
  return json(await enrichData(ready.db, data), response.status);
}

export async function onRequestDelete(context) {
  const ready = await authorizedContext(context);
  if (ready.error) return ready.error;
  return legacy.onRequestDelete(context);
}
