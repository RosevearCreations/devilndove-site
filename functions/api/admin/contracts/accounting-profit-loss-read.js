// Devil n Dove Build 324 — Accounting-owned GET-only profit/loss read contract.

import {
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
} from '../../_lib/adminAudit.js';
import {
  BUILD,
  CONTRACT_ID,
  OWNER,
  readAccountingProfitLoss,
} from '../../_lib/accountingProfitLossReadService.js';

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}

export { BUILD, CONTRACT_ID, OWNER };

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);

  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  const url = new URL(context.request.url);

  try {
    const result = await readAccountingProfitLoss(db, {
      month: url.searchParams.get('month') || new Date().toISOString().slice(0, 7),
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
    if (error instanceof RangeError || error?.code === 'invalid_accounting_month') {
      return json({
        ok: false,
        build: BUILD,
        contract: CONTRACT_ID,
        owner: OWNER,
        error: error?.message || 'Please provide month in YYYY-MM format.',
      }, 400);
    }
    return json({
      ok: false,
      build: BUILD,
      contract: CONTRACT_ID,
      owner: OWNER,
      error: 'Accounting profit/loss read contract failed.',
      error_code: 'accounting_profit_loss_read_failed',
      detail: String(error?.message || error),
    }, 500);
  }
}
