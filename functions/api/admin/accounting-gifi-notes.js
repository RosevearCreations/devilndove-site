import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { cleanGifiCode, ensureAccountingGifiNotesTable, listAccountingGifiNotes } from './_accountingGifi.js';
import { BUILD, CONTRACT_ID, OWNER, readAccountingGifiNotes } from '../_lib/accountingGifiNotesReadService.js';

function normalizeReviewStatus(value) {
  const raw = normalizeText(value).toLowerCase();
  return ['draft', 'reviewed', 'needs_accountant', 'finalized'].includes(raw) ? raw : 'draft';
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  const year = String(new URL(context.request.url).searchParams.get('year') || new Date().getFullYear()).trim();
  try {
    return jsonResponse(await readAccountingGifiNotes(db, { year }));
  } catch (error) {
    if (error instanceof RangeError || error?.code === 'invalid_accounting_year') return jsonResponse({ ok: false, build: BUILD, contract: CONTRACT_ID, owner: OWNER, error: error?.message }, 400);
    return jsonResponse({ ok: false, build: BUILD, contract: CONTRACT_ID, owner: OWNER, error: error?.message || 'Failed to load GIFI review notes.' }, 500);
  }
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureAccountingGifiNotesTable(db);
  let body = {};
  try { body = await context.request.json(); } catch { return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400); }

  const taxYear = String(body.tax_year || new Date().getFullYear()).trim();
  const gifiCode = cleanGifiCode(body.gifi_code);
  const gifiLabel = normalizeText(body.gifi_label);
  const gifiSection = normalizeText(body.gifi_section);
  const accountantNote = normalizeText(body.accountant_note);
  const schedule141Note = normalizeText(body.schedule_141_note);
  const supportingDetails = normalizeText(body.supporting_details);
  const reviewStatus = normalizeReviewStatus(body.review_status);

  if (!taxYear || !/^\d{4}$/.test(taxYear)) return jsonResponse({ ok: false, error: 'tax_year must be YYYY.' }, 400);
  if (!gifiCode) return jsonResponse({ ok: false, error: 'gifi_code is required.' }, 400);

  await db.prepare(`
    INSERT INTO accounting_gifi_review_notes (
      tax_year, gifi_code, gifi_label, gifi_section,
      accountant_note, schedule_141_note, supporting_details, review_status,
      created_by_user_id, updated_by_user_id, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(tax_year, gifi_code) DO UPDATE SET
      gifi_label = excluded.gifi_label,
      gifi_section = excluded.gifi_section,
      accountant_note = excluded.accountant_note,
      schedule_141_note = excluded.schedule_141_note,
      supporting_details = excluded.supporting_details,
      review_status = excluded.review_status,
      updated_by_user_id = excluded.updated_by_user_id,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    taxYear, gifiCode, gifiLabel || null, gifiSection || null,
    accountantNote || null, schedule141Note || null, supportingDetails || null, reviewStatus,
    Number(adminUser.user_id || 0), Number(adminUser.user_id || 0)
  ).run();

  await auditAdminAction(context.env, context.request, adminUser, {
    action_type: 'save_accounting_gifi_note',
    target_type: 'accounting_gifi_review_note',
    target_key: `${taxYear}:${gifiCode}`,
    details: { tax_year: taxYear, gifi_code: gifiCode, review_status: reviewStatus }
  });

  const notes = await listAccountingGifiNotes(db, taxYear);
  const note = notes.find((row) => row.gifi_code === gifiCode) || null;
  return jsonResponse({ ok: true, note, year: taxYear });
}
