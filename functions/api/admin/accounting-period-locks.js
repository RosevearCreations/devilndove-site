import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { ensureAccountingPeriodClosuresTable, getAccountingPeriodClosure, monthValue, normalizeChecklistPayload } from './_accountingPeriods.js';
import { ensureAccountingAttachmentsTable, listAccountingAttachments } from './_accountingAttachments.js';
import { ensureAccountingStatementImportsTables, listAccountingReconciliationExceptions, listAccountingStatementImports } from './_accountingStatementImports.js';
import { BUILD, CONTRACT_ID, OWNER, readAccountingPeriodLocks } from '../_lib/accountingPeriodLocksReadService.js';

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  const url = new URL(context.request.url);
  try {
    return jsonResponse(await readAccountingPeriodLocks(db, { periodMonth: normalizeText(url.searchParams.get('period_month')), limit: Number(url.searchParams.get('limit') || 18) || 18 }));
  } catch (error) {
    return jsonResponse({ ok: false, build: BUILD, contract: CONTRACT_ID, owner: OWNER, error: error?.message || 'Failed to load accounting period locks.' }, 500);
  }
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureAccountingPeriodClosuresTable(db);
  await ensureAccountingAttachmentsTable(db);
  await ensureAccountingStatementImportsTables(db);
  let body = {};
  try { body = await context.request.json(); } catch { return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400); }

  const periodMonth = monthValue(body.period_month);
  const action = normalizeText(body.action).toLowerCase() || (Number(body.is_locked || 0) === 1 ? 'lock' : 'reopen');
  const lockState = action === 'lock' ? 'locked' : 'open';
  const closeNotes = normalizeText(body.close_notes || body.notes);
  const checklist = normalizeChecklistPayload(body.close_checklist || body.checklist || {});

  if (lockState === 'locked') {
    const attachments = await listAccountingAttachments(db, { periodMonth, limit: 1000 });
    const statements = attachments.filter((row) => (row.attachment_kind || '') === 'statement');
    const receipts = attachments.filter((row) => ['receipt', 'bill'].includes(String(row.attachment_kind || '')));
    const workpapers = attachments.filter((row) => (row.attachment_kind || '') === 'workpaper');
    const imports = await listAccountingStatementImports(db, { periodMonth, limit: 100 });
    const exceptions = await listAccountingReconciliationExceptions(db, { periodMonth, status: 'open', limit: 500 });
    const requiredKinds = Array.isArray(body.required_attachment_kinds) ? body.required_attachment_kinds : ['statement', 'workpaper'];
    const missing = [];
    if (requiredKinds.includes('statement') && !statements.length) missing.push('statement attachment');
    if (requiredKinds.includes('workpaper') && !workpapers.length) missing.push('workpaper attachment');
    if (requiredKinds.includes('receipt') && !receipts.length) missing.push('bill or receipt support');
    if (!imports.length) missing.push('statement import');
    if (exceptions.length) missing.push(`${exceptions.length} unresolved reconciliation exception(s)`);
    if (missing.length) return jsonResponse({ ok: false, error: `Cannot lock ${periodMonth} yet. Still needed: ${missing.join(', ')}.`, missing_requirements: missing }, 400);
  }

  await db.prepare(`
    INSERT INTO accounting_period_closures (
      period_month, lock_state, close_checklist_json, close_notes,
      locked_by_user_id, locked_at, reopened_by_user_id, reopened_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, CASE WHEN ? = 'locked' THEN CURRENT_TIMESTAMP ELSE NULL END, ?, CASE WHEN ? = 'open' THEN CURRENT_TIMESTAMP ELSE NULL END, CURRENT_TIMESTAMP)
    ON CONFLICT(period_month) DO UPDATE SET
      lock_state = excluded.lock_state,
      close_checklist_json = excluded.close_checklist_json,
      close_notes = excluded.close_notes,
      locked_by_user_id = CASE WHEN excluded.lock_state = 'locked' THEN excluded.locked_by_user_id ELSE accounting_period_closures.locked_by_user_id END,
      locked_at = CASE WHEN excluded.lock_state = 'locked' THEN CURRENT_TIMESTAMP ELSE accounting_period_closures.locked_at END,
      reopened_by_user_id = CASE WHEN excluded.lock_state = 'open' THEN excluded.reopened_by_user_id ELSE accounting_period_closures.reopened_by_user_id END,
      reopened_at = CASE WHEN excluded.lock_state = 'open' THEN CURRENT_TIMESTAMP ELSE accounting_period_closures.reopened_at END,
      updated_at = CURRENT_TIMESTAMP
  `).bind(periodMonth, lockState, JSON.stringify(checklist), closeNotes || null, lockState === 'locked' ? Number(adminUser.user_id || 0) : null, lockState, lockState === 'open' ? Number(adminUser.user_id || 0) : null, lockState).run();

  await auditAdminAction(context.env, context.request, adminUser, {
    action_type: lockState === 'locked' ? 'lock_accounting_period' : 'reopen_accounting_period',
    target_type: 'accounting_period_closure', target_key: periodMonth,
    details: { period_month: periodMonth, lock_state: lockState, close_checklist: checklist, close_notes: closeNotes || '' }
  });

  const closure = await getAccountingPeriodClosure(db, periodMonth);
  return jsonResponse({ ok: true, closure, period_month: periodMonth });
}
