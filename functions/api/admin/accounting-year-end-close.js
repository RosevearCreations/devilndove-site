import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';
import { ensureAccountingReconciliationReviewsTable, listAccountingReconciliationReviews } from './_accountingReconciliation.js';
import { ensureAccountingGifiNotesTable, listAccountingGifiNotes } from './_accountingGifi.js';
import { ensureAccountingPeriodClosuresTable, listAccountingPeriodClosures } from './_accountingPeriods.js';
import { ensureAccountingAttachmentsTable, listAccountingAttachments } from './_accountingAttachments.js';

function yearRange(yearValue) {
  const raw = String(yearValue || '').trim();
  if (!/^\d{4}$/.test(raw)) return null;
  return { year: raw };
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

function summarizeBy(items, keyFn) {
  const out = {};
  for (const item of items) {
    const key = String(keyFn(item) || 'unknown');
    out[key] = Number(out[key] || 0) + 1;
  }
  return out;
}

function csvEscape(value) {
  const text = String(value == null ? '' : value);
  if (/["\n,]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function flattenYearEndCsvRows(bundle) {
  const rows = [];
  const push = (section, groupKey, itemKey, value, notes = '') => rows.push({ section, group_key: groupKey, item_key: itemKey, value, notes });
  const checklist = bundle?.checklist || {};
  Object.entries(checklist).forEach(([key, value]) => push('checklist', 'summary', key, value));

  const handoff = bundle?.accountant_handoff || {};
  const gl = handoff.gl_review_summary || {};
  Object.entries(gl).forEach(([key, value]) => push('gl_review_summary', 'gl', key, value));

  const attachmentSummary = handoff.attachment_summary || {};
  for (const [group, values] of Object.entries({
    by_kind: attachmentSummary.by_kind || {},
    by_status: attachmentSummary.by_status || {},
    by_month: attachmentSummary.by_month || {},
    by_scope: attachmentSummary.by_scope || {}
  })) {
    Object.entries(values).forEach(([key, value]) => push('attachment_summary', group, key, value));
  }
  (attachmentSummary.coverage_gaps || []).forEach((item, index) => push('attachment_gaps', 'gap', String(index + 1), item));

  const reconciliationSummary = handoff.reconciliation_summary || {};
  for (const [group, values] of Object.entries({
    by_type: reconciliationSummary.by_type || {},
    by_status: reconciliationSummary.by_status || {},
    by_scope: reconciliationSummary.by_scope || {}
  })) {
    Object.entries(values).forEach(([key, value]) => push('reconciliation_summary', group, key, value));
  }
  Object.entries(reconciliationSummary.matrix_by_month || {}).forEach(([month, monthRows]) => {
    Object.entries(monthRows || {}).forEach(([kind, detail]) => push('reconciliation_matrix', month, kind, detail?.difference_cents ?? '', JSON.stringify(detail || {})));
  });

  (handoff.gl_final_blockers || []).forEach((row) => push('gl_blockers', row.blocker_type || 'needs_review', row.code || '', row.gifi_review_state || '', row.name || ''));
  (handoff.recommended_missing_items || []).forEach((item, index) => push('recommended_missing_items', 'missing', String(index + 1), item));
  (handoff.handoff_export_checklist || []).forEach((item, index) => push('handoff_export_checklist', 'export', String(index + 1), item));
  (bundle.notes || []).forEach((item, index) => push('notes', 'bundle', String(index + 1), item));
  return rows;
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
  const attachments = await listAccountingAttachments(db, { taxYear: range.year, limit: 1000 });

  const glReviewRow = await db.prepare(`
    SELECT
      SUM(CASE WHEN COALESCE(is_active,1)=1 THEN 1 ELSE 0 END) AS active_account_count,
      SUM(CASE WHEN COALESCE(is_active,1)=1 AND COALESCE(gifi_code,'') <> '' AND COALESCE(gifi_label,'') <> '' AND COALESCE(gifi_section,'') <> '' THEN 1 ELSE 0 END) AS mapped_account_count,
      SUM(CASE WHEN COALESCE(is_active,1)=1 AND COALESCE(gifi_review_state,'draft') IN ('reviewed','finalized') THEN 1 ELSE 0 END) AS reviewed_account_count,
      SUM(CASE WHEN COALESCE(is_active,1)=1 AND COALESCE(gifi_review_state,'draft')='finalized' THEN 1 ELSE 0 END) AS finalized_account_count,
      SUM(CASE WHEN COALESCE(is_active,1)=1 AND COALESCE(gifi_code,'')='' THEN 1 ELSE 0 END) AS unmapped_account_count,
      SUM(CASE WHEN COALESCE(is_active,1)=1 AND COALESCE(gifi_review_state,'draft')='needs_accountant' THEN 1 ELSE 0 END) AS needs_accountant_count
    FROM general_ledger_accounts
  `).first().catch(() => null);

  const glFinalBlockers = (await db.prepare(`
    SELECT code, name, category, gifi_code, gifi_label, gifi_section, gifi_review_state, gifi_review_note,
           CASE
             WHEN COALESCE(gifi_code,'')='' OR COALESCE(gifi_label,'')='' OR COALESCE(gifi_section,'')='' THEN 'missing_mapping'
             WHEN COALESCE(gifi_review_state,'draft')='needs_accountant' THEN 'needs_accountant'
             WHEN COALESCE(gifi_review_state,'draft')!='finalized' THEN 'not_finalized'
             ELSE 'ok'
           END AS blocker_type
    FROM general_ledger_accounts
    WHERE COALESCE(is_active,1)=1
      AND (
        COALESCE(gifi_code,'')='' OR COALESCE(gifi_label,'')='' OR COALESCE(gifi_section,'')=''
        OR COALESCE(gifi_review_state,'draft')!='finalized'
      )
    ORDER BY blocker_type ASC, code ASC
    LIMIT 100
  `).all().catch(() => ({ results: [] })))?.results || [];

  const attachmentKinds = summarizeBy(attachments, (row) => row.attachment_kind || 'other');
  const attachmentStatus = summarizeBy(attachments, (row) => row.attachment_status || 'uploaded');
  const attachmentByMonth = summarizeBy(attachments, (row) => row.period_month || (row.document_date || '').slice(0, 7) || 'unassigned');
  const attachmentByScope = summarizeBy(attachments, (row) => row.scope_key || 'all');
  const attachmentGaps = [];
  for (let month = 1; month <= 12; month += 1) {
    const label = `${range.year}-${String(month).padStart(2, '0')}`;
    const monthItems = attachments.filter((row) => (row.period_month || '').startsWith(label) || (row.document_date || '').startsWith(label));
    const kindCounts = summarizeBy(monthItems, (row) => row.attachment_kind || 'other');
    if (!kindCounts.statement) attachmentGaps.push(`${label}: missing statement attachment`);
    if (!kindCounts.workpaper) attachmentGaps.push(`${label}: missing workpaper attachment`);
  }

  const reconciliationByType = summarizeBy(reconciliationReviews, (row) => row.reconciliation_type || 'other');
  const reconciliationByStatus = summarizeBy(reconciliationReviews, (row) => row.review_status || 'draft');
  const reconciliationByScope = summarizeBy(reconciliationReviews, (row) => row.scope_key || 'all');
  const reconciliationMatrix = {};
  for (const row of reconciliationReviews) {
    const month = row.period_month || 'unassigned';
    reconciliationMatrix[month] = reconciliationMatrix[month] || {};
    reconciliationMatrix[month][row.reconciliation_type || 'other'] = {
      review_status: row.review_status || 'draft',
      statement_reference: row.statement_reference || '',
      difference_cents: Number(row.difference_cents || 0),
      unresolved_item_count: Number(row.unresolved_item_count || 0),
      attachment_count: Number(row.attachment_count || 0),
      note: row.note || '',
    };
  }

  const monthsLocked = closures.filter((row) => row.lock_state === 'locked').map((row) => row.period_month);
  const openMonths = closures.filter((row) => row.lock_state !== 'locked').map((row) => row.period_month);
  const checklist = {
    locked_month_count: monthsLocked.length,
    reopened_month_count: closures.filter((row) => row.reopened_at).length,
    gifi_finalized_count: gifiNotes.filter((row) => row.review_status === 'finalized').length,
    gifi_needs_accountant_count: gifiNotes.filter((row) => row.review_status === 'needs_accountant').length,
    reconciliation_finalized_count: reconciliationReviews.filter((row) => row.review_status === 'finalized').length,
    reconciliation_needs_accountant_count: reconciliationReviews.filter((row) => row.review_status === 'needs_accountant').length,
    attachment_count: attachments.length,
    statement_attachment_count: Number(attachmentKinds.statement || 0),
    workpaper_attachment_count: Number(attachmentKinds.workpaper || 0),
  };

  const recommendedMissingItems = [
    Number(glReviewRow?.unmapped_account_count || 0) > 0 ? 'Finish unmapped active GL accounts before final accountant export.' : null,
    Number(glReviewRow?.needs_accountant_count || 0) > 0 ? 'Resolve active GL accounts still marked needs_accountant.' : null,
    openMonths.length ? `Finish lock review for open months: ${openMonths.join(', ')}` : null,
    Number(attachmentKinds.statement || 0) === 0 ? 'Attach statements for the year-end handoff package.' : null,
    Number(attachmentKinds.workpaper || 0) === 0 ? 'Attach workpapers or close-checklists for the year-end handoff package.' : null,
    attachmentGaps.length ? `Attachment coverage gaps remain: ${attachmentGaps.slice(0, 6).join('; ')}` : null,
    reconciliationReviews.some((row) => Number(row.unresolved_item_count || 0) > 0) ? 'Reconciliation reviews still show unresolved items that should be explained or cleared.' : null,
  ].filter(Boolean);

  const bundle = {
    ok: true,
    tax_year: range.year,
    checklist,
    accountant_handoff: {
      gl_review_summary: {
        active_account_count: Number(glReviewRow?.active_account_count || 0),
        mapped_account_count: Number(glReviewRow?.mapped_account_count || 0),
        reviewed_account_count: Number(glReviewRow?.reviewed_account_count || 0),
        finalized_account_count: Number(glReviewRow?.finalized_account_count || 0),
        unmapped_account_count: Number(glReviewRow?.unmapped_account_count || 0),
        needs_accountant_count: Number(glReviewRow?.needs_accountant_count || 0),
      },
      gl_final_blockers: glFinalBlockers,
      attachment_summary: {
        total_attachment_count: attachments.length,
        by_kind: attachmentKinds,
        by_status: attachmentStatus,
        by_month: attachmentByMonth,
        by_scope: attachmentByScope,
        coverage_gaps: attachmentGaps,
      },
      reconciliation_summary: {
        total_review_count: reconciliationReviews.length,
        by_type: reconciliationByType,
        by_status: reconciliationByStatus,
        by_scope: reconciliationByScope,
        matrix_by_month: reconciliationMatrix,
      },
      recommended_missing_items: recommendedMissingItems,
      handoff_export_checklist: [
        'GIFI staging CSV',
        'Year-end close JSON bundle',
        'Monthly / yearly accounting exports',
        'Statements, bills, receipts, and workpapers',
        'Notes for unresolved differences or accountant follow-up',
      ],
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

  const format = (url.searchParams.get('format') || '').toLowerCase();

  if (format === 'json') {
    return new Response(JSON.stringify(bundle, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="devilndove-year-end-close-${range.year}.json"`,
      },
    });
  }

  if (format === 'csv') {
    const rows = flattenYearEndCsvRows(bundle);
    const lines = ['section,group_key,item_key,value,notes'];
    for (const row of rows) {
      lines.push([row.section, row.group_key, row.item_key, row.value, row.notes].map(csvEscape).join(','));
    }
    return new Response(lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="devilndove-year-end-close-${range.year}.csv"`,
      },
    });
  }

  return jsonResponse(bundle);
}
