import { getAdminUserFromRequest, getDb, jsonResponse } from '../../_lib/adminAudit.js';
import { BUILD, CONTRACT_ID, OWNER, readPlatformDbSanity } from '../../_lib/platformDbSanityReadService.js';

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  try {
    const result = await readPlatformDbSanity(db);
    return jsonResponse({ ...result, requested_by: { user_id: Number(adminUser.user_id || 0), email: adminUser.email || null } });
  } catch (error) {
    return jsonResponse({ ok: false, build: BUILD, contract: CONTRACT_ID, owner: OWNER, request_time_schema_mutation: false, error: error?.message || 'Failed to read database sanity.' }, 500);
  }
}
