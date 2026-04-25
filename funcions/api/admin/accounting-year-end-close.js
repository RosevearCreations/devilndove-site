import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { ensureAccountingReconciliationReviewsTable, listAccountingReconciliationReviews } from './_accountingReconciliation.js';
import { ensureAccountingGifiNotesTable, listAccountingGifiNotes } from './_accountingGifi.js';
import { ensureAccountingPeriodClosuresTable, listAccountingPeriodClosures } from './_accountingPeriods.js';

function yearRange(yearValue) {
  const raw = String(yearValue || '').trim();
  if (!/^\d{4}$/.test(raw)) return null;
  return { year: raw, start: `${raw}-01`, end: `${raw}-12` };
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureAccountingPeriodClosuresTable(db);
  await ensureAccountingGifiNotesTable(db);
  await ensureAccountingReconciliationReviewsTable(db);

  const url = new URL(context.request.url);
  const range = yearRange(url.searchParams.get('year') || new Date().getFullYear());
  if (!range) return jsonResponse({ ok: false, error: 'Please provide year in YYYY format.' }, 400);

  const closures = (await listAccountingPeriodClosures(db, { limit: 24 })).filter((row) => String(row.period_month || '').startsWith(`${range.year}-`));
  const gifiNotes = await listAccountingGifiNotes(db, range.year);
  const reconciliationReviews = [
    ...(await listAccountingReconciliationReviews(db, { reconciliationType: 'sales_tax', includeAllPeriods: true })),
    ...(await listAccountingReconciliationReviews(db, { reconciliationType: 'processor_fees', includeAllPeriods: true })),
    ...(await listAccountingReconciliationReviews(db, { reconciliationType: 'shipping', includeAllPeriods: true })),
  ].filter((row) => String(row.period_month || '').startsWith(`${range.year}-`));

  const bundle = {
    ok: true,
    tax_year: range.year,
    checklist: {
      locked_month_count: closures.filter((row) => row.lock_state === 'locked').length,
      reopened_month_count: closures.filter((row) => row.reopened_at).length,
      gifi_finalized_count: gifiNotes.filter((row) => row.review_status === 'finalized').length,
      gifi_needs_accountant_count: gifiNotes.filter((row) => row.review_status === 'needs_accountant').length,
      reconciliation_finalized_count: reconciliationReviews.filter((row) => row.review_status === 'finalized').length,
      reconciliation_needs_accountant_count: reconciliationReviews.filter((row) => row.review_status === 'needs_accountant').length,
    },
    months: closures,
    gifi_notes: gifiNotes,
    reconciliation_reviews: reconciliationReviews,
    notes: [
      'This is a slow year-end close bundle for internal review and accountant handoff, not a final T2 filing package.',
      'Use this alongside the GIFI staging summary, monthly exports, receipts, bank statements, and your accountant review.',
    ],
  };

  if ((url.searchParams.get('format') || '').toLowerCase() === 'json') {
    return new Response(JSON.stringify(bundle, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="devilndove-year-end-close-${range.year}.json"`,
      },
    });
  }

  return jsonResponse(bundle);
}
