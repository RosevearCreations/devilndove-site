import { getAdminUserFromRequest, getDb, jsonResponse, auditAdminAction, normalizeText } from "../_lib/adminAudit.js";
import { readAccountingGeneralLedger } from '../_lib/accountingGeneralLedgerReadService.js';

function normResults(result) { return Array.isArray(result?.results) ? result.results : []; }
function cleanCategory(value) { const v = normalizeText(value).toLowerCase(); return ["income", "expense", "asset", "liability", "equity"].includes(v) ? v : "expense"; }
function cleanBalance(value, fallback = 'debit') { const v = normalizeText(value).toLowerCase(); return ['debit', 'credit'].includes(v) ? v : fallback; }
function cleanSection(value) { const v = normalizeText(value).toLowerCase(); return ['income_statement', 'balance_sheet', 'retained_earnings', 'other'].includes(v) ? v : ''; }
function cleanReviewState(value) { const v = normalizeText(value).toLowerCase(); return ['draft', 'reviewed', 'needs_accountant', 'finalized'].includes(v) ? v : 'draft'; }

const STARTER_GIFI_MAPPINGS = {
  '1000': { gifi_code: '1001', gifi_label: 'Cash', gifi_section: 'balance_sheet', parent_group: 'current_assets', normal_balance: 'debit', sort_order: 10, tax_deductibility_percent: 100, gifi_review_state: 'finalized', gifi_review_note: 'Starter mapping aligned to cash.' },
  '2100': { gifi_code: '2621', gifi_label: 'Trade payables', gifi_section: 'balance_sheet', parent_group: 'current_liabilities', normal_balance: 'credit', sort_order: 20, tax_deductibility_percent: 100, gifi_review_state: 'finalized', gifi_review_note: 'Starter mapping aligned to trade payables.' },
  '2190': { gifi_code: '2620', gifi_label: 'Amounts payable and accrued liabilities', gifi_section: 'balance_sheet', parent_group: 'current_liabilities', normal_balance: 'credit', sort_order: 30, tax_deductibility_percent: 100, gifi_review_state: 'finalized', gifi_review_note: 'Finalized as accrued-liability clearing account.' },
  '2300': { gifi_code: '2680', gifi_label: 'Taxes payable', gifi_section: 'balance_sheet', parent_group: 'current_liabilities', normal_balance: 'credit', sort_order: 40, tax_deductibility_percent: 100, gifi_review_state: 'finalized', gifi_review_note: 'Finalized for GST/HST and sales tax payable.' },
  '4000': { gifi_code: '8000', gifi_label: 'Sales of goods and services', gifi_section: 'income_statement', parent_group: 'revenue', normal_balance: 'credit', sort_order: 100, tax_deductibility_percent: 100, gifi_review_state: 'finalized', gifi_review_note: 'Finalized for primary product sales revenue.' },
  '6100': { gifi_code: '9221', gifi_label: 'Electricity', gifi_section: 'income_statement', parent_group: 'utilities', normal_balance: 'debit', sort_order: 200, tax_deductibility_percent: 100, gifi_review_state: 'finalized', gifi_review_note: 'Finalized utility mapping for electricity.' },
  '6120': { gifi_code: '9224', gifi_label: 'Fuel costs', gifi_section: 'income_statement', parent_group: 'utilities', normal_balance: 'debit', sort_order: 210, tax_deductibility_percent: 100, gifi_review_state: 'finalized', gifi_review_note: 'Finalized utility mapping for gas/fuel.' },
  '6200': { gifi_code: '8911', gifi_label: 'Real estate rental', gifi_section: 'income_statement', parent_group: 'occupancy', normal_balance: 'debit', sort_order: 220, tax_deductibility_percent: 100, gifi_review_state: 'finalized', gifi_review_note: 'Finalized occupancy mapping for rent.' },
  '6300': { gifi_code: '9152', gifi_label: 'Internet', gifi_section: 'income_statement', parent_group: 'communications', normal_balance: 'debit', sort_order: 230, tax_deductibility_percent: 100, gifi_review_state: 'finalized', gifi_review_note: 'Finalized communications mapping for internet.' },
  '6310': { gifi_code: '9225', gifi_label: 'Telephone and telecommunications', gifi_section: 'income_statement', parent_group: 'communications', normal_balance: 'debit', sort_order: 240, tax_deductibility_percent: 100, gifi_review_state: 'finalized', gifi_review_note: 'Finalized communications mapping for phone.' },
  '6400': { gifi_code: '8520', gifi_label: 'Advertising and promotion', gifi_section: 'income_statement', parent_group: 'marketing', normal_balance: 'debit', sort_order: 250, tax_deductibility_percent: 100, gifi_review_state: 'finalized', gifi_review_note: 'Finalized marketing mapping for advertising and promotion.' },
  '6500': { gifi_code: '9270', gifi_label: 'Other expenses', gifi_section: 'income_statement', parent_group: 'software', normal_balance: 'debit', sort_order: 260, tax_deductibility_percent: 100, gifi_review_state: 'finalized', gifi_review_note: 'Finalized software subscriptions under other expenses until a more specific accountant preference is adopted.' },
  '6600': { gifi_code: '8690', gifi_label: 'Insurance', gifi_section: 'income_statement', parent_group: 'occupancy', normal_balance: 'debit', sort_order: 270, tax_deductibility_percent: 100, gifi_review_state: 'finalized', gifi_review_note: 'Finalized insurance mapping.' },
  '6700': { gifi_code: '8811', gifi_label: 'Office stationery and supplies', gifi_section: 'income_statement', parent_group: 'office', normal_balance: 'debit', sort_order: 280, tax_deductibility_percent: 100, gifi_review_state: 'finalized', gifi_review_note: 'Finalized office supply mapping.' },
  '6715': { gifi_code: '8715', gifi_label: 'Bank charges', gifi_section: 'income_statement', parent_group: 'finance', normal_balance: 'debit', sort_order: 285, tax_deductibility_percent: 100, gifi_review_state: 'finalized', gifi_review_note: 'Finalized bank and processor fee mapping.' },
  '6800': { gifi_code: '9131', gifi_label: 'Small tools', gifi_section: 'income_statement', parent_group: 'workshop', normal_balance: 'debit', sort_order: 290, tax_deductibility_percent: 100, gifi_review_state: 'finalized', gifi_review_note: 'Finalized small-tools mapping for non-capitalized workshop tools.' },
  '6810': { gifi_code: '9132', gifi_label: 'Shop expense', gifi_section: 'income_statement', parent_group: 'workshop', normal_balance: 'debit', sort_order: 300, tax_deductibility_percent: 100, gifi_review_state: 'finalized', gifi_review_note: 'Finalized workshop consumables mapping.' },
  '6862': { gifi_code: '8862', gifi_label: 'Accounting fees', gifi_section: 'income_statement', parent_group: 'professional_fees', normal_balance: 'debit', sort_order: 310, tax_deductibility_percent: 100, gifi_review_state: 'finalized', gifi_review_note: 'Finalized accounting fee mapping.' },
  '6900': { gifi_code: '9270', gifi_label: 'Other expenses', gifi_section: 'income_statement', parent_group: 'losses', normal_balance: 'debit', sort_order: 320, tax_deductibility_percent: 100, gifi_review_state: 'finalized', gifi_review_note: 'Finalized current write-off staging under other expenses until a narrower loss split is required.' },
};

async function getTableColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    const rows = Array.isArray(result?.results) ? result.results : [];
    return new Set(rows.map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function getTableIndexSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA index_list(${tableName})`).all();
    const rows = Array.isArray(result?.results) ? result.results : [];
    return new Set(rows.map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function ensureTable(db) {
  const requiredColumns = [
    'gl_account_id', 'code', 'name', 'category', 'parent_group', 'normal_balance',
    'sort_order', 'gifi_code', 'gifi_label', 'gifi_section', 'gifi_review_state',
    'gifi_review_note', 'gifi_reviewed_by_user_id', 'gifi_reviewed_at',
    'tax_deductibility_percent', 'is_active', 'created_at', 'updated_at'
  ];
  const columns = await getTableColumnSet(db, 'general_ledger_accounts');
  const missingColumns = requiredColumns.filter((name) => !columns.has(name));
  if (missingColumns.length) {
    throw new Error(`General Ledger schema is not ready: general_ledger_accounts is missing ${missingColumns.join(', ')}. Apply the current Development migration authority.`);
  }
  const requiredIndexes = [
    'idx_general_ledger_accounts_category_sort',
    'idx_general_ledger_accounts_gifi',
    'idx_general_ledger_accounts_review_state'
  ];
  const indexes = await getTableIndexSet(db, 'general_ledger_accounts');
  const missingIndexes = requiredIndexes.filter((name) => !indexes.has(name));
  if (missingIndexes.length) {
    throw new Error(`General Ledger schema is not ready: general_ledger_accounts is missing index ${missingIndexes.join(', ')}. Apply the current Development migration authority.`);
  }
  return true;
}

async function loadSummary(db) {
  const row = await db.prepare(`
    SELECT
      COUNT(*) AS total_count,
      SUM(CASE WHEN COALESCE(is_active,1)=1 THEN 1 ELSE 0 END) AS active_count,
      SUM(CASE WHEN COALESCE(is_active,1)=1 AND COALESCE(gifi_code,'') <> '' AND COALESCE(gifi_label,'') <> '' AND COALESCE(gifi_section,'') <> '' THEN 1 ELSE 0 END) AS mapped_count,
      SUM(CASE WHEN COALESCE(is_active,1)=1 AND COALESCE(gifi_review_state,'draft') IN ('reviewed','finalized') THEN 1 ELSE 0 END) AS reviewed_count,
      SUM(CASE WHEN COALESCE(is_active,1)=1 AND COALESCE(gifi_review_state,'draft') = 'finalized' THEN 1 ELSE 0 END) AS finalized_count,
      SUM(CASE WHEN COALESCE(is_active,1)=1 AND COALESCE(gifi_code,'') = '' THEN 1 ELSE 0 END) AS unmapped_count,
      SUM(CASE WHEN COALESCE(is_active,1)=1 AND COALESCE(gifi_review_state,'draft') = 'needs_accountant' THEN 1 ELSE 0 END) AS needs_accountant_count,
      SUM(CASE WHEN COALESCE(is_active,1)=1 AND COALESCE(gifi_code,'') <> '' AND COALESCE(gifi_label,'') <> '' AND COALESCE(gifi_section,'') <> '' AND COALESCE(gifi_review_state,'draft') = 'reviewed' THEN 1 ELSE 0 END) AS ready_to_finalize_count
    FROM general_ledger_accounts
  `).first().catch(() => null);

  const blockerResult = await db.prepare(`
    SELECT gl_account_id, code, name, category, parent_group, gifi_code, gifi_label, gifi_section, gifi_review_state, gifi_review_note,
           CASE
             WHEN COALESCE(is_active,1) != 1 THEN 'inactive'
             WHEN COALESCE(gifi_code,'') = '' OR COALESCE(gifi_label,'') = '' OR COALESCE(gifi_section,'') = '' THEN 'missing_mapping'
             WHEN COALESCE(gifi_review_state,'draft') = 'needs_accountant' THEN 'needs_accountant'
             WHEN COALESCE(gifi_review_state,'draft') != 'finalized' THEN 'not_finalized'
             ELSE 'ok'
           END AS blocker_type
    FROM general_ledger_accounts
    WHERE COALESCE(is_active,1) = 1
      AND (
        COALESCE(gifi_code,'') = '' OR COALESCE(gifi_label,'') = '' OR COALESCE(gifi_section,'') = ''
        OR COALESCE(gifi_review_state,'draft') != 'finalized'
      )
    ORDER BY
      CASE
        WHEN COALESCE(gifi_code,'') = '' OR COALESCE(gifi_label,'') = '' OR COALESCE(gifi_section,'') = '' THEN 0
        WHEN COALESCE(gifi_review_state,'draft') = 'needs_accountant' THEN 1
        ELSE 2
      END,
      code ASC
    LIMIT 50
  `).all().catch(() => ({ results: [] }));

  return {
    total_count: Number(row?.total_count || 0),
    active_count: Number(row?.active_count || 0),
    mapped_count: Number(row?.mapped_count || 0),
    reviewed_count: Number(row?.reviewed_count || 0),
    finalized_count: Number(row?.finalized_count || 0),
    unmapped_count: Number(row?.unmapped_count || 0),
    needs_accountant_count: Number(row?.needs_accountant_count || 0),
    ready_to_finalize_count: Number(row?.ready_to_finalize_count || 0),
    final_blockers: normResults(blockerResult),
    final_blocker_count: normResults(blockerResult).length,
  };
}

async function applyStarterMappings(db, adminUser) {
  let changedRows = 0;
  for (const [code, mapping] of Object.entries(STARTER_GIFI_MAPPINGS)) {
    const result = await db.prepare(`
      UPDATE general_ledger_accounts
      SET parent_group = COALESCE(NULLIF(parent_group,''), ?),
          normal_balance = COALESCE(NULLIF(normal_balance,''), ?),
          sort_order = CASE WHEN COALESCE(sort_order,0)=0 THEN ? ELSE sort_order END,
          gifi_code = COALESCE(NULLIF(gifi_code,''), ?),
          gifi_label = COALESCE(NULLIF(gifi_label,''), ?),
          gifi_section = COALESCE(NULLIF(gifi_section,''), ?),
          tax_deductibility_percent = CASE WHEN tax_deductibility_percent IS NULL OR tax_deductibility_percent = 0 THEN ? ELSE tax_deductibility_percent END,
          gifi_review_state = CASE
            WHEN COALESCE(gifi_review_state,'draft') = 'needs_accountant' THEN gifi_review_state
            WHEN COALESCE(gifi_code,'') = '' OR COALESCE(gifi_label,'') = '' OR COALESCE(gifi_section,'') = '' OR COALESCE(gifi_review_state,'draft') IN ('draft','reviewed') THEN ?
            ELSE gifi_review_state
          END,
          gifi_review_note = CASE
            WHEN COALESCE(gifi_review_note,'') = '' OR COALESCE(gifi_review_state,'draft') IN ('draft','reviewed') THEN ?
            ELSE gifi_review_note
          END,
          gifi_reviewed_by_user_id = CASE WHEN COALESCE(gifi_review_state,'draft') != 'needs_accountant' THEN ? ELSE gifi_reviewed_by_user_id END,
          gifi_reviewed_at = CASE WHEN COALESCE(gifi_review_state,'draft') != 'needs_accountant' THEN CURRENT_TIMESTAMP ELSE gifi_reviewed_at END,
          updated_at = CURRENT_TIMESTAMP
      WHERE code = ? AND COALESCE(is_active,1) = 1
    `).bind(
      mapping.parent_group || null,
      mapping.normal_balance || 'debit',
      Number(mapping.sort_order || 0),
      mapping.gifi_code || null,
      mapping.gifi_label || null,
      mapping.gifi_section || null,
      Number(mapping.tax_deductibility_percent == null ? 100 : mapping.tax_deductibility_percent),
      mapping.gifi_review_state || 'finalized',
      mapping.gifi_review_note || 'Starter mapping applied.',
      Number(adminUser.user_id || 0),
      code
    ).run().catch(() => null);
    changedRows += Number(result?.meta?.changes || 0);
  }
  return changedRows;
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: "Admin access required." }, 401);
  const db = getDb(context.env); if (!db) return jsonResponse({ ok: false, error: "Database binding is not configured." }, 500);

  try {
    const result = await readAccountingGeneralLedger(db);
    return jsonResponse({
      ...result,
      starter_mapping_count: Object.keys(STARTER_GIFI_MAPPINGS).length,
      requested_by: {
        user_id: adminUser.user_id,
        email: adminUser.email,
        display_name: adminUser.display_name,
      },
    }, 200, { 'Cache-Control': 'no-store' });
  } catch (error) {
    return jsonResponse({ ok: false, error: error?.message || 'Failed to load General Ledger accounts.' }, 500);
  }
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: "Admin access required." }, 401);
  const db = getDb(context.env); if (!db) return jsonResponse({ ok: false, error: "Database binding is not configured." }, 500);
  await ensureTable(db);
  let body = {}; try { body = await context.request.json(); } catch {}

  const action = normalizeText(body.action).toLowerCase();
  if (action === 'bulk_finalize_mapped' || action === 'bulk_mark_reviewed' || action === 'bulk_finalize_reviewed' || action === 'apply_starter_gifi_mappings') {
    if (action === 'apply_starter_gifi_mappings') {
      const changedRows = await applyStarterMappings(db, adminUser);
      await auditAdminAction(context.env, context.request, adminUser, {
        action_type: action,
        target_type: 'general_ledger_account',
        details: { changed_rows: changedRows }
      });
      return jsonResponse({ ok: true, action, changed_rows: changedRows, summary: await loadSummary(db) });
    }

    const nextState = action === 'bulk_mark_reviewed' ? 'reviewed' : 'finalized';
    const notePrefix = normalizeText(body.gifi_review_note) || (nextState === 'finalized' ? 'Reviewed mapping finalized in admin bulk pass.' : 'Reviewed mapping updated in admin bulk pass.');
    const whereClause = action === 'bulk_finalize_reviewed'
      ? `COALESCE(gifi_review_state,'draft') = 'reviewed'`
      : `COALESCE(gifi_review_state,'draft') != 'needs_accountant'`;
    const result = await db.prepare(`
      UPDATE general_ledger_accounts
      SET gifi_review_state = ?,
          gifi_review_note = COALESCE(NULLIF(gifi_review_note,''), ?),
          gifi_reviewed_by_user_id = ?,
          gifi_reviewed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE COALESCE(is_active,1) = 1
        AND COALESCE(gifi_code,'') <> ''
        AND COALESCE(gifi_label,'') <> ''
        AND COALESCE(gifi_section,'') <> ''
        AND ${whereClause}
    `).bind(nextState, notePrefix, Number(adminUser.user_id || 0)).run();
    await auditAdminAction(context.env, context.request, adminUser, {
      action_type: action,
      target_type: 'general_ledger_account',
      details: { review_state: nextState, changed_rows: Number(result?.meta?.changes || 0) }
    });
    return jsonResponse({ ok: true, action, changed_rows: Number(result?.meta?.changes || 0), summary: await loadSummary(db) });
  }

  const code = normalizeText(body.code).toUpperCase();
  const name = normalizeText(body.name);
  const category = cleanCategory(body.category);
  const parent_group = normalizeText(body.parent_group);
  const normal_balance = cleanBalance(body.normal_balance, category === 'income' || category === 'liability' || category === 'equity' ? 'credit' : 'debit');
  const sort_order = Number.isFinite(Number(body.sort_order)) ? Math.round(Number(body.sort_order)) : 0;
  const starter = STARTER_GIFI_MAPPINGS[code] || null;
  const gifi_code = normalizeText(body.gifi_code || starter?.gifi_code);
  const gifi_label = normalizeText(body.gifi_label || starter?.gifi_label);
  const gifi_section = cleanSection(body.gifi_section) || starter?.gifi_section || (category === 'income' || category === 'expense' ? 'income_statement' : (category === 'asset' || category === 'liability' || category === 'equity' ? 'balance_sheet' : 'other'));
  const tax_deductibility_percent = Math.max(0, Math.min(100, Math.round(Number(body.tax_deductibility_percent == null || body.tax_deductibility_percent === '' ? (starter?.tax_deductibility_percent ?? 100) : body.tax_deductibility_percent))));
  const gifi_review_state = cleanReviewState(body.gifi_review_state || starter?.gifi_review_state || (gifi_code && gifi_label && gifi_section ? 'reviewed' : 'draft'));
  const gifi_review_note = normalizeText(body.gifi_review_note || starter?.gifi_review_note);
  const is_active = Number(body.is_active == null || body.is_active === '' ? 1 : body.is_active) === 0 ? 0 : 1;
  const reviewActorId = ['reviewed', 'finalized'].includes(gifi_review_state) ? Number(adminUser.user_id || 0) : null;
  const reviewedAt = reviewActorId ? new Date().toISOString() : null;
  if (!code || !name) return jsonResponse({ ok: false, error: "Code and name are required." }, 400);

  await db.prepare(`
    INSERT INTO general_ledger_accounts (
      code, name, category, parent_group, normal_balance, sort_order,
      gifi_code, gifi_label, gifi_section, gifi_review_state, gifi_review_note,
      gifi_reviewed_by_user_id, gifi_reviewed_at,
      tax_deductibility_percent, is_active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(code) DO UPDATE SET
      name = excluded.name,
      category = excluded.category,
      parent_group = excluded.parent_group,
      normal_balance = excluded.normal_balance,
      sort_order = excluded.sort_order,
      gifi_code = excluded.gifi_code,
      gifi_label = excluded.gifi_label,
      gifi_section = excluded.gifi_section,
      gifi_review_state = excluded.gifi_review_state,
      gifi_review_note = excluded.gifi_review_note,
      gifi_reviewed_by_user_id = excluded.gifi_reviewed_by_user_id,
      gifi_reviewed_at = excluded.gifi_reviewed_at,
      tax_deductibility_percent = excluded.tax_deductibility_percent,
      is_active = excluded.is_active,
      updated_at = CURRENT_TIMESTAMP
  `).bind(
    code, name, category, parent_group || null, normal_balance, sort_order,
    gifi_code || null, gifi_label || null, gifi_section || null, gifi_review_state, gifi_review_note || null,
    reviewActorId, reviewedAt,
    tax_deductibility_percent, is_active
  ).run();

  await auditAdminAction(context.env, context.request, adminUser, {
    action_type: 'save_general_ledger_account',
    target_type: 'general_ledger_account',
    target_key: code,
    details: { code, name, category, parent_group, gifi_code, gifi_label, gifi_section, gifi_review_state, tax_deductibility_percent, is_active },
  });

  return jsonResponse({ ok: true, summary: await loadSummary(db) });
}