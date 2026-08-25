import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { BUILD, CONTRACT_ID, OWNER, readAccountingSalesTaxFiling } from '../_lib/accountingSalesTaxFilingReadService.js';

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env); if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  try { const url = new URL(context.request.url); return jsonResponse(await readAccountingSalesTaxFiling(db, { periodMonth: url.searchParams.get('period_month') || '' })); }
  catch (error) { return jsonResponse({ ok: false, build: BUILD, contract: CONTRACT_ID, owner: OWNER, error: error?.message || 'Failed to read sales-tax filing worksheet.' }, 500); }
}
