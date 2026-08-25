import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { cleanPeriodMonth, cleanReconciliationStatus, cleanReconciliationType, ensureAccountingReconciliationReviewsTable } from './_accountingReconciliation.js';
import { ensureAccountingAttachmentsTable, listAccountingAttachments } from './_accountingAttachments.js';
import { BUILD, CONTRACT_ID, OWNER, readAccountingReconciliation } from '../_lib/accountingReconciliationReadService.js';

function toJson(value) {
  try { return JSON.stringify(value || {}); } catch { return '{}'; }
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  const url = new URL(context.request.url);
  try {
    const result = await readAccountingReconciliation(db, {
      reconciliationType: url.searchParams.get('type') || '',
      periodMonth: url.searchParams.get('period_month') || '',
      includeAllPeriods: url.searchParams.get('all_periods') === '1',
    });
    return jsonResponse(result);
  } catch (error) {
    return jsonResponse({ ok: false, build: BUILD, contract: CONTRACT_ID, owner: OWNER, request_time_schema_mutation: false, error: error?.message || 'Failed to read Accounting reconciliation.' }, 500);
  }
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureAccountingReconciliationReviewsTable(db);
  await ensureAccountingAttachmentsTable(db);
  let body = {};
  try { body = await context.request.json(); } catch { return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400); }

  const reconciliationType = cleanReconciliationType(body.reconciliation_type || body.type);
  const periodMonth = cleanPeriodMonth(body.period_month);
  const scopeKey = normalizeText(body.scope_key) || 'all';
  const reviewStatus = cleanReconciliationStatus(body.review_status);
  const note = normalizeText(body.note);
  const statementReference = normalizeText(body.statement_reference);
  const differenceReason = normalizeText(body.difference_reason);
  const referenceAmountCents = Math.round(Number(body.reference_amount_cents || 0));
  const comparedAmountCents = Math.round(Number(body.compared_amount_cents || 0));
  const differenceCents = Math.round(Number(body.difference_cents || 0));
  const statementAmountCents = Math.round(Number(body.statement_amount_cents || referenceAmountCents || 0));
  const bookAmountCents = Math.round(Number(body.book_amount_cents || comparedAmountCents || 0));
  const toleranceCents = Math.max(0, Math.round(Number(body.tolerance_cents || 0)));
  const expectedRateBasisPoints = Math.max(0, Math.round(Number(body.expected_rate_basis_points || 0)));
  const observedRateBasisPoints = Math.max(0, Math.round(Number(body.observed_rate_basis_points || 0)));
  const unresolvedItemCount = Math.max(0, Math.round(Number(body.unresolved_item_count || 0)));
  const detailJson = typeof body.detail_json === 'string' ? body.detail_json : toJson(body.detail_json || {});
  const attachmentCount = Number((await listAccountingAttachments(db, { reconciliationType, periodMonth, scopeKey, limit: 500 })).length || 0);

  await db.prepare(`
    INSERT INTO accounting_reconciliation_reviews (
      reconciliation_type, period_month, scope_key, review_status, note,
      statement_reference, difference_reason, detail_json, attachment_count,
      statement_amount_cents, book_amount_cents, tolerance_cents,
      expected_rate_basis_points, observed_rate_basis_points, unresolved_item_count,
      reference_amount_cents, compared_amount_cents, difference_cents,
      created_by_user_id, updated_by_user_id, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(reconciliation_type, period_month, scope_key) DO UPDATE SET
      review_status = excluded.review_status,
      note = excluded.note,
      statement_reference = excluded.statement_reference,
      difference_reason = excluded.difference_reason,
      detail_json = excluded.detail_json,
      attachment_count = excluded.attachment_count,
      statement_amount_cents = excluded.statement_amount_cents,
      book_amount_cents = excluded.book_amount_cents,
      tolerance_cents = excluded.tolerance_cents,
      expected_rate_basis_points = excluded.expected_rate_basis_points,
      observed_rate_basis_points = excluded.observed_rate_basis_points,
      unresolved_item_count = excluded.unresolved_item_count,
      reference_amount_cents = excluded.reference_amount_cents,
      compared_amount_cents = excluded.compared_amount_cents,
      difference_cents = excluded.difference_cents,
      updated_by_user_id = excluded.updated_by_user_id,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    reconciliationType, periodMonth, scopeKey, reviewStatus, note || null,
    statementReference || null, differenceReason || null, detailJson || null, attachmentCount,
    statementAmountCents, bookAmountCents, toleranceCents,
    expectedRateBasisPoints, observedRateBasisPoints, unresolvedItemCount,
    referenceAmountCents, comparedAmountCents, differenceCents,
    Number(adminUser.user_id || 0), Number(adminUser.user_id || 0)
  ).run();

  await auditAdminAction(context.env, context.request, adminUser, {
    action_type: 'save_accounting_reconciliation_review',
    target_type: 'accounting_reconciliation_review',
    target_key: `${reconciliationType}:${periodMonth}:${scopeKey}`,
    details: {
      reconciliation_type: reconciliationType,
      period_month: periodMonth,
      scope_key: scopeKey,
      review_status: reviewStatus,
      statement_reference: statementReference || null,
      difference_reason: differenceReason || null,
      attachment_count: attachmentCount,
      statement_amount_cents: statementAmountCents,
      book_amount_cents: bookAmountCents,
      tolerance_cents: toleranceCents,
      expected_rate_basis_points: expectedRateBasisPoints,
      observed_rate_basis_points: observedRateBasisPoints,
      unresolved_item_count: unresolvedItemCount,
    },
  });

  return jsonResponse({ ok: true, reconciliation_type: reconciliationType, period_month: periodMonth, scope_key: scopeKey, attachment_count: attachmentCount });
}
