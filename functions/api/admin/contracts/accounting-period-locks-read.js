// Devil n Dove Build 329 — Accounting-owned GET-only period locks read contract.

import { getAdminUserFromRequest, getDb, jsonResponse } from '../../_lib/adminAudit.js';
import { BUILD, CONTRACT_ID, OWNER, readAccountingPeriodLocks } from '../../_lib/accountingPeriodLocksReadService.js';

function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
export { BUILD, CONTRACT_ID, OWNER };

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const url = new URL(context.request.url);
  try {
    const result = await readAccountingPeriodLocks(db, { periodMonth: url.searchParams.get('period_month') || '', limit: Number(url.searchParams.get('limit') || 18) || 18 });
    return json({ ...result, requested_by: { user_id: adminUser.user_id, email: adminUser.email, display_name: adminUser.display_name } });
  } catch (error) {
    return json({ ok: false, build: BUILD, contract: CONTRACT_ID, owner: OWNER, error: 'Accounting period locks read contract failed.', detail: String(error?.message || error) }, 500);
  }
}
