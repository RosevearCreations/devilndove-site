// Devil n Dove Build 322 — Accounting-owned GET-only product costs read contract.

import {
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
} from '../../_lib/adminAudit.js';
import {
  BUILD,
  CONTRACT_ID,
  OWNER,
  readAccountingProductCosts,
} from '../../_lib/accountingProductCostsReadService.js';

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}

function optionalLimit(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  const n = Number.isFinite(parsed) ? Math.trunc(parsed) : 500;
  return Math.max(1, Math.min(5000, n));
}

export { BUILD, CONTRACT_ID, OWNER };

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);

  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  const url = new URL(context.request.url);

  try {
    const result = await readAccountingProductCosts(db, {
      limit: optionalLimit(url.searchParams.get('limit')),
    });
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
      error: 'Accounting product costs read contract failed.',
      error_code: 'accounting_product_costs_read_failed',
      detail: String(error?.message || error),
    }, 500);
  }
}
