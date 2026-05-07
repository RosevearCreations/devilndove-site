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
  const status = ['open', 'resolved', 'ignored'].includes(normalizeText(body.exception_status).toLowerCase()) ? normalizeText(body.exception_status).toLowerCase() : 'open';
  const notes = normalizeText(body.notes || body.note);
  await db.prepare(`UPDATE accounting_reconciliation_exceptions SET exception_status=?, notes=COALESCE(?, notes), updated_at=CURRENT_TIMESTAMP WHERE accounting_reconciliation_exception_id=?`).bind(status, notes || null, exceptionId).run();
  await auditAdminAction(env, request, adminUser, { action_type: 'update_reconciliation_exception', target_type: 'accounting_reconciliation_exception', target_id: exceptionId, details: { exception_status: status, notes } });
  return jsonResponse({ ok: true, accounting_reconciliation_exception_id: exceptionId, exception_status: status });
}
