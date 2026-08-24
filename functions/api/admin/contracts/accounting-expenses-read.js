// Devil n Dove Build 316 — Accounting-owned expenses read contract.
// GET-only, schema-aware, and deliberately free of request-time DDL or writes.

import {
  getAdminUserFromRequest,
  getDb,
  jsonResponse,
} from '../../_lib/adminAudit.js';
import {
  BUILD,
  CONTRACT_ID,
  OWNER,
  AUTHORITY_TABLE,
  ATTACHMENT_TABLE,
  readAccountingExpenses,
} from '../../_lib/accountingExpensesReadService.js';

function json(data, status = 200) {
  return jsonResponse(data, status, { 'Cache-Control': 'no-store' });
}

export { BUILD, CONTRACT_ID, OWNER, AUTHORITY_TABLE, ATTACHMENT_TABLE };

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);

  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);

  const url = new URL(context.request.url);

  try {
    const payload = await readAccountingExpenses(db, {
      limit: url.searchParams.get('limit'),
    });
    return json({ ...payload, requested_by: adminUser });
  } catch (error) {
    return json({
      ok: false,
      build: BUILD,
      contract: CONTRACT_ID,
      owner: OWNER,
      request_time_schema_mutation: false,
      error: 'Accounting expenses read contract failed.',
      error_code: 'accounting_expenses_read_failed',
      detail: String(error?.message || error),
    }, 500);
  }
}
