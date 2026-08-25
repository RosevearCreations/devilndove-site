// Devil n Dove Build 325 — legacy-compatible Accounting item-costing GET backed by the Accounting-owned read service.

import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import {
  BUILD,
  CONTRACT_ID,
  OWNER,
  readAccountingItemCosting,
} from '../_lib/accountingItemCostingReadService.js';

export async function onRequestGet(context) {
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);

  const url = new URL(context.request.url);
  try {
    const result = await readAccountingItemCosting(db, {
      month: url.searchParams.get('month') || new Date().toISOString().slice(0, 7),
    });
    return jsonResponse(result);
  } catch (error) {
    if (error instanceof RangeError || error?.code === 'invalid_accounting_month') {
      return jsonResponse({ ok: false, build: BUILD, contract: CONTRACT_ID, owner: OWNER, error: error?.message }, 400);
    }
    return jsonResponse({
      ok: false,
      build: BUILD,
      contract: CONTRACT_ID,
      owner: OWNER,
      error: error?.message || 'Failed to build monthly item costing.',
    }, 500);
  }
}
