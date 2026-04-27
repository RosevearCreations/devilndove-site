import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { ensureAccountingReconciliationReviewsTable, listAccountingReconciliationReviews } from './_accountingReconciliation.js';
import { ensureAccountingGifiNotesTable, listAccountingGifiNotes } from './_accountingGifi.js';
import { ensureAccountingPeriodClosuresTable, listAccountingPeriodClosures } from './_accountingPeriods.js';
import { ensureAccountingAttachmentsTable, listAccountingAttachments } from './_accountingAttachments.js';

function yearRange(yearValue) {
  const raw = String(yearValue || '').trim();
  if (!/^\d{4}$/.test(raw)) return null;
  return { year: raw, start: `${raw}-01`, end: `${raw}-12` };
}

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function ensureGlSchema(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS general_ledger_accounts (
      gl_account_id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'expense',
      parent_group TEXT,
      normal_balance TEXT NOT NULL DEFAULT 'debit',
      sort_order INTEGER NOT NULL DEFAULT 0,
      gifi_code TEXT,
      gifi_label TEXT,
      gifi_section TEXT,
      gifi_review_state TEXT NOT NULL DEFAULT 'draft',
      gifi_review_note TEXT,
      gifi_reviewed_by_user_id INTEGER,
      gifi_reviewed_at TEXT,
      tax_deductibility_percent INTEGER NOT NULL DEFAULT 100,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureAccountingPeriodClosuresTable(db);
  await ensureAccountingGifiNotesTable(db);
  await ensureAccountingReconciliationReviewsTable(db);
  await ensureAccountingAttachmentsTable(db);
  await ensureGlSchema(db);

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
  const attachments = await listAccountingAttachments(db, { taxYear: range.year, limit: 500 });

  const glReviewRow = await db.prepare(`
    SELECT
      SUM(CASE WHEN COALESCE(is_active,1)=1 THEN 1 ELSE 0 END) AS active_account_count,
      SUM(CASE WHEN COALESCE(is_active,1)=1 AND COALESCE(gifi_code,'') <> '' AND COALESCE(gifi_label,'') <> '' AND COALESCE(gifi_section,'') <> '' THEN 1 ELSE 0 END) AS mapped_account_count,
      SUM(CASE WHEN COALESCE(is_active,1)=1 AND COALESCE(gifi_review_state,'draft') IN ('reviewed','finalized') THEN 1 ELSE 0 END) AS reviewed_account_count,
      SUM(CASE WHEN COALESCE(is_active,1)=1 AND COALESCE(gifi_review_state,'draft')='finalized' THEN 1 ELSE 0 END) AS finalized_account_count,
      SUM(CASE WHEN COALESCE(is_active,1)=1 AND COALESCE(gifi_code,'')='' THEN 1 ELSE 0 END) AS unmapped_account_count
    FROM general_ledger_accounts
  `).first().catch(() => null);

  const attachmentKinds = attachments.reduce((acc, row) => {
    const key = row.attachment_kind || 'other';
    acc[key] = Number(acc[key] || 0) + 1;
    return acc;
  }, {});
  const reconciliationByType = reconciliationReviews.reduce((acc, row) => {
    const key = row.reconciliation_type || 'other';
    acc[key] = Number(acc[key] || 0) + 1;
    return acc;
  }, {});
  const monthsLocked = closures.filter((row) => row.lock_state === 'locked').map((row) => row.period_month);
  const closeChecklistOpenMonths = closures.filter((row) => row.lock_state !== 'locked').map((row) => row.period_month);

  const bundle = {
    ok: true,
    tax_year: range.year,
    checklist: {
      locked_month_count: monthsLocked.length,
      reopened_month_count: closures.filter((row) => row.reopened_at).length,
      gifi_finalized_count: gifiNotes.filter((row) => row.review_status === 'finalized').length,
      gifi_needs_accountant_count: gifiNotes.filter((row) => row.review_status === 'needs_accountant').length,
      reconciliation_finalized_count: reconciliationReviews.filter((row) => row.review_status === 'finalized').length,
      reconciliation_needs_accountant_count: reconciliationReviews.filter((row) => row.review_status === 'needs_accountant').length,
      attachment_count: attachments.length,
    },
    accountant_handoff: {
      gl_review_summary: {
        active_account_count: Number(glReviewRow?.active_account_count || 0),
        mapped_account_count: Number(glReviewRow?.mapped_account_count || 0),
        reviewed_account_count: Number(glReviewRow?.reviewed_account_count || 0),
        finalized_account_count: Number(glReviewRow?.finalized_account_count || 0),
        unmapped_account_count: Number(glReviewRow?.unmapped_account_count || 0),
      },
      attachment_summary: {
        total_attachment_count: attachments.length,
        by_kind: attachmentKinds,
      },
      reconciliation_summary: {
        total_review_count: reconciliationReviews.length,
        by_type: reconciliationByType,
      },
      recommended_missing_items: [
        Number(glReviewRow?.unmapped_account_count || 0) > 0 ? 'Finish unmapped active GL accounts before final accountant export.' : null,
        attachments.length === 0 ? 'Attach bills, receipts, statements, and workpapers before year-end handoff.' : null,
        closeChecklistOpenMonths.length ? `Finish lock review for open months: ${closeChecklistOpenMonths.join(', ')}` : null,
      ].filter(Boolean),
    },
    months: closures,
    gifi_notes: gifiNotes,
    reconciliation_reviews: reconciliationReviews,
    attachments,
    notes: [
      'This is a slow year-end close bundle for internal review and accountant handoff, not a final T2 filing package.',
      'Use this alongside the GIFI staging summary, monthly exports, receipts, statements, bank downloads, and your accountant review.',
      'Attach receipts, statements, and workpapers by expense, period, or reconciliation type so the year-end package is easier to defend and review.',
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
