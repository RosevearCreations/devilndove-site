// Release 461 wrapper: usable/base-unit stock is canonical while the mature
// inventory endpoint remains the compatibility implementation for package receiving/costing.
import * as legacy from './_siteItemInventoryLegacy.js';
import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import {
  assertInventoryBaseAuthorityReady,
  loadInventoryBaseBalances,
  mergeInventoryBaseAuthority,
  syncInventoryBaseBalance,
  syncInventoryBaseBalances,
  syncInventoryBaseBalancesBySource
} from './_inventoryBaseAuthority.js';

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
  const out = { ...data, quantity_authority: 'base' };
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
  const response = await legacy.onRequestPost(context);
  if (!response.ok) return response;
  const data = await parseResponse(response);
  if (!data) return response;

  const action = String(body?.action || '').trim().toLowerCase();
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
