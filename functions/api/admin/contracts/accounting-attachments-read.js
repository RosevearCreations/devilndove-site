// Devil n Dove Build 330 — Accounting-owned GET-only attachment metadata read contract.

import { getAdminUserFromRequest, getDb, jsonResponse } from '../../_lib/adminAudit.js';
import { BUILD, CONTRACT_ID, OWNER, readAccountingAttachments } from '../../_lib/accountingAttachmentsReadService.js';

function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
export { BUILD, CONTRACT_ID, OWNER };

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return json({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return json({ ok: false, error: 'Database binding is not configured.' }, 500);
  const url = new URL(context.request.url);
  try {
    const result = await readAccountingAttachments(db, {
      expenseId: Number(url.searchParams.get('expense_id') || 0), vendorId: Number(url.searchParams.get('vendor_id') || 0),
      reconciliationType: url.searchParams.get('reconciliation_type') || '', periodMonth: url.searchParams.get('period_month') || '',
      taxYear: url.searchParams.get('tax_year') || '', scopeKey: url.searchParams.get('scope_key') || '', attachmentKind: url.searchParams.get('attachment_kind') || '',
      attachmentScope: url.searchParams.get('attachment_scope') || '', providerScope: url.searchParams.get('provider_scope') || '', limit: Number(url.searchParams.get('limit') || 50),
    });
    return json({ ...result, requested_by: { user_id: adminUser.user_id, email: adminUser.email, display_name: adminUser.display_name } });
  } catch (error) {
    return json({ ok: false, build: BUILD, contract: CONTRACT_ID, owner: OWNER, error: 'Accounting attachments read contract failed.', detail: String(error?.message || error) }, 500);
  }
}
