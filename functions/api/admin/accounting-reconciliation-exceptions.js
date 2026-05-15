import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { ensureAccountingStatementImportsTables, listAccountingReconciliationExceptions } from './_accountingStatementImports.js';

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureAccountingStatementImportsTables(db);
  const url = new URL(context.request.url);
  const exceptions = await listAccountingReconciliationExceptions(db, {
    reconciliationType: url.searchParams.get('reconciliation_type') || '',
    periodMonth: url.searchParams.get('period_month') || '',
    status: url.searchParams.get('status') || '',
    limit: Number(url.searchParams.get('limit') || 200),
  });
  return jsonResponse({ ok: true, exceptions, summary: { open_count: exceptions.filter((row) => row.exception_status === 'open').length, total_count: exceptions.length } });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const adminUser = await getAdminUserFromRequest(request, env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureAccountingStatementImportsTables(db);
  let body = {};
  try { body = await request.json(); } catch { return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400); }
  const exceptionId = Number(body.accounting_reconciliation_exception_id || 0);
  if (!exceptionId) return jsonResponse({ ok: false, error: 'accounting_reconciliation_exception_id is required.' }, 400);
  const requestedStatus = normalizeText(body.exception_status || body.action).toLowerCase();
  const status = ['open', 'manual_review', 'assigned', 'accountant_review', 'resolved', 'ignored', 'reopened'].includes(requestedStatus) ? requestedStatus : 'open';
  const notes = normalizeText(body.notes || body.note);
  const assignToSelf = status === 'assigned' || Number(body.assign_to_self || 0) === 1;
  const accountantFlag = status === 'accountant_review' || Number(body.accountant_review_flag || 0) === 1 ? 1 : 0;
  await db.prepare(`
    UPDATE accounting_reconciliation_exceptions
    SET exception_status = ?,
        notes = COALESCE(?, notes),
        assigned_to_user_id = CASE WHEN ? = 1 THEN ? ELSE assigned_to_user_id END,
        accountant_review_flag = CASE WHEN ? = 1 THEN 1 ELSE accountant_review_flag END,
        resolved_by_user_id = CASE WHEN ? = 'resolved' THEN ? ELSE resolved_by_user_id END,
        resolved_at = CASE WHEN ? = 'resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END,
        reopened_by_user_id = CASE WHEN ? = 'reopened' THEN ? ELSE reopened_by_user_id END,
        reopened_at = CASE WHEN ? = 'reopened' THEN CURRENT_TIMESTAMP ELSE reopened_at END,
        updated_at = CURRENT_TIMESTAMP
    WHERE accounting_reconciliation_exception_id = ?
  `).bind(
    status,
    notes || null,
    assignToSelf ? 1 : 0,
    adminUser.user_id,
    accountantFlag,
    status,
    adminUser.user_id,
    status,
    status,
    adminUser.user_id,
    status,
    exceptionId
  ).run();
  await auditAdminAction(env, request, adminUser, { action_type: 'update_reconciliation_exception', target_type: 'accounting_reconciliation_exception', target_id: exceptionId, details: { exception_status: status, notes, assign_to_self: assignToSelf, accountant_review_flag: accountantFlag } });
  return jsonResponse({ ok: true, accounting_reconciliation_exception_id: exceptionId, exception_status: status });
}
