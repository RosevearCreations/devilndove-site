import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { CONTRACT_ID, OWNER, RELEASE, readCorporateCommerceReadiness } from '../_lib/release449CorporateCommerceReadService.js';

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);

  const url = new URL(context.request.url);
  try {
    return jsonResponse(await readCorporateCommerceReadiness(db, {
      year: url.searchParams.get('year') || String(new Date().getFullYear()),
    }));
  } catch (error) {
    if (error instanceof RangeError || error?.code === 'invalid_accounting_year') {
      return jsonResponse({ ok: false, release: RELEASE, contract: CONTRACT_ID, owner: OWNER, error: error?.message || 'Invalid accounting year.' }, 400);
    }
    return jsonResponse({ ok: false, release: RELEASE, contract: CONTRACT_ID, owner: OWNER, error: error?.message || 'Failed to build corporate financial readiness.' }, 500);
  }
}
