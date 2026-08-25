// Devil n Dove Build 319 — Accounting-owned GET-only summary read contract.

import {
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
} from '../../_lib/adminAudit.js';
import {
  BUILD,
  CONTRACT_ID,
  OWNER,
  readAccountingSummary,
} from '../../_lib/accountingSummaryReadService.js';

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}

function boundedInt(value, fallback = 25, min = 1, max = 100) {
  const parsed = Number(value);
  const n = Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
  return Math.max(min, Math.min(max, n));
}

export { BUILD, CONTRACT_ID, OWNER };

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);

  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  const url = new URL(context.request.url);
  const limit = boundedInt(url.searchParams.get('limit'));

  try {
    const result = await readAccountingSummary(db, { limit });
    return json({
      ...result,
      requested_by: {
        user_id: adminUser.user_id,
        email: adminUser.email,
        display_name: adminUser.display_name,
      },
    });
  } catch (error) {
    return json({
      ok: false,
      build: BUILD,
      contract: CONTRACT_ID,
      owner: OWNER,
      error: 'Accounting summary read contract failed.',
      error_code: 'accounting_summary_read_failed',
      detail: String(error?.message || error),
    }, 500);
  }
}
