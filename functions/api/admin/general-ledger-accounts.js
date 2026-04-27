import { getAdminUserFromRequest, getDb, jsonResponse, auditAdminAction, normalizeText } from "../_lib/adminAudit.js";

function normResults(result){ return Array.isArray(result?.results) ? result.results : []; }
function cleanCategory(value){ const v=normalizeText(value).toLowerCase(); return ["income","expense","asset","liability","equity"].includes(v) ? v : "expense"; }
function cleanBalance(value, fallback = 'debit'){ const v = normalizeText(value).toLowerCase(); return ['debit','credit'].includes(v) ? v : fallback; }
function cleanSection(value){ const v = normalizeText(value).toLowerCase(); return ['income_statement','balance_sheet','retained_earnings','other'].includes(v) ? v : ''; }
function cleanReviewState(value){ const v = normalizeText(value).toLowerCase(); return ['draft','reviewed','needs_accountant','finalized'].includes(v) ? v : 'draft'; }

async function getTableColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    const rows = Array.isArray(result?.results) ? result.results : [];
    return new Set(rows.map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function ensureTable(db){
  await db.prepare(`CREATE TABLE IF NOT EXISTS general_ledger_accounts (
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
  )`).run();
  const cols = await getTableColumnSet(db, 'general_ledger_accounts');
  const missing = [
    ['parent_group', `ALTER TABLE general_ledger_accounts ADD COLUMN parent_group TEXT`],
    ['normal_balance', `ALTER TABLE general_ledger_accounts ADD COLUMN normal_balance TEXT NOT NULL DEFAULT 'debit'`],
    ['sort_order', `ALTER TABLE general_ledger_accounts ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0`],
    ['gifi_code', `ALTER TABLE general_ledger_accounts ADD COLUMN gifi_code TEXT`],
    ['gifi_label', `ALTER TABLE general_ledger_accounts ADD COLUMN gifi_label TEXT`],
    ['gifi_section', `ALTER TABLE general_ledger_accounts ADD COLUMN gifi_section TEXT`],
    ['gifi_review_state', `ALTER TABLE general_ledger_accounts ADD COLUMN gifi_review_state TEXT NOT NULL DEFAULT 'draft'`],
    ['gifi_review_note', `ALTER TABLE general_ledger_accounts ADD COLUMN gifi_review_note TEXT`],
    ['gifi_reviewed_by_user_id', `ALTER TABLE general_ledger_accounts ADD COLUMN gifi_reviewed_by_user_id INTEGER`],
    ['gifi_reviewed_at', `ALTER TABLE general_ledger_accounts ADD COLUMN gifi_reviewed_at TEXT`],
    ['tax_deductibility_percent', `ALTER TABLE general_ledger_accounts ADD COLUMN tax_deductibility_percent INTEGER NOT NULL DEFAULT 100`],
    ['is_active', `ALTER TABLE general_ledger_accounts ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1`],
    ['created_at', `ALTER TABLE general_ledger_accounts ADD COLUMN created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`],
    ['updated_at', `ALTER TABLE general_ledger_accounts ADD COLUMN updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`],
  ];
  for (const [col, sql] of missing) {
    if (!cols.has(col)) {
      try { await db.prepare(sql).run(); } catch {}
    }
  }
  try { await db.prepare(`CREATE INDEX IF NOT EXISTS idx_general_ledger_accounts_category_sort ON general_ledger_accounts(category, sort_order, code)`).run(); } catch {}
  try { await db.prepare(`CREATE INDEX IF NOT EXISTS idx_general_ledger_accounts_gifi ON general_ledger_accounts(gifi_section, gifi_code, code)`).run(); } catch {}
  try { await db.prepare(`CREATE INDEX IF NOT EXISTS idx_general_ledger_accounts_review_state ON general_ledger_accounts(gifi_review_state, is_active, code)`).run(); } catch {}
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
      SUM(CASE WHEN COALESCE(is_active,1)=1 AND COALESCE(gifi_review_state,'draft') = 'needs_accountant' THEN 1 ELSE 0 END) AS needs_accountant_count
    FROM general_ledger_accounts
  `).first().catch(() => null);
  return {
    total_count: Number(row?.total_count || 0),
    active_count: Number(row?.active_count || 0),
    mapped_count: Number(row?.mapped_count || 0),
    reviewed_count: Number(row?.reviewed_count || 0),
    finalized_count: Number(row?.finalized_count || 0),
    unmapped_count: Number(row?.unmapped_count || 0),
    needs_accountant_count: Number(row?.needs_accountant_count || 0),
  };
}

export async function onRequestGet(context){
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok:false, error:"Admin access required." }, 401);
  const db = getDb(context.env); if(!db) return jsonResponse({ok:false,error:"Database binding is not configured."},500);
  await ensureTable(db);
  const result = await db.prepare(`
    SELECT gl_account_id, code, name, category, parent_group, normal_balance, sort_order,
           gifi_code, gifi_label, gifi_section, tax_deductibility_percent, gifi_review_state, gifi_review_note,
           gifi_reviewed_by_user_id, gifi_reviewed_at,
           is_active, created_at, updated_at
    FROM general_ledger_accounts
    ORDER BY COALESCE(is_active,1) DESC, category ASC, sort_order ASC, code ASC
  `).all();
  return jsonResponse({ ok:true, accounts:normResults(result), summary: await loadSummary(db) });
}

export async function onRequestPost(context){
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok:false, error:"Admin access required." }, 401);
  const db = getDb(context.env); if(!db) return jsonResponse({ok:false,error:"Database binding is not configured."},500);
  await ensureTable(db);
  let body={}; try{ body=await context.request.json(); }catch{}

  const action = normalizeText(body.action).toLowerCase();
  if (action === 'bulk_finalize_mapped' || action === 'bulk_mark_reviewed') {
    const nextState = action === 'bulk_finalize_mapped' ? 'finalized' : 'reviewed';
    const notePrefix = normalizeText(body.gifi_review_note) || (nextState === 'finalized' ? 'Reviewed mapping finalized in admin bulk pass.' : 'Reviewed mapping updated in admin bulk pass.');
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
        AND COALESCE(gifi_review_state,'draft') != 'needs_accountant'
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
  const gifi_code = normalizeText(body.gifi_code);
  const gifi_label = normalizeText(body.gifi_label);
  const gifi_section = cleanSection(body.gifi_section) || (category === 'income' || category === 'expense' ? 'income_statement' : (category === 'asset' || category === 'liability' || category === 'equity' ? 'balance_sheet' : 'other'));
  const tax_deductibility_percent = Math.max(0, Math.min(100, Math.round(Number(body.tax_deductibility_percent == null || body.tax_deductibility_percent === '' ? 100 : body.tax_deductibility_percent))));
  const gifi_review_state = cleanReviewState(body.gifi_review_state);
  const gifi_review_note = normalizeText(body.gifi_review_note);
  const is_active = Number(body.is_active == null || body.is_active === '' ? 1 : body.is_active) === 0 ? 0 : 1;
  const reviewActorId = ['reviewed', 'finalized'].includes(gifi_review_state) ? Number(adminUser.user_id || 0) : null;
  const reviewedAt = reviewActorId ? new Date().toISOString() : null;
  if(!code || !name) return jsonResponse({ok:false,error:"Code and name are required."},400);
  await db.prepare(`
    INSERT INTO general_ledger_accounts (
      code,name,category,parent_group,normal_balance,sort_order,
      gifi_code,gifi_label,gifi_section,gifi_review_state,gifi_review_note,gifi_reviewed_by_user_id,gifi_reviewed_at,
      tax_deductibility_percent,is_active,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(code) DO UPDATE SET
      name=excluded.name,
      category=excluded.category,
      parent_group=excluded.parent_group,
      normal_balance=excluded.normal_balance,
      sort_order=excluded.sort_order,
      gifi_code=excluded.gifi_code,
      gifi_label=excluded.gifi_label,
      gifi_section=excluded.gifi_section,
      gifi_review_state=excluded.gifi_review_state,
      gifi_review_note=excluded.gifi_review_note,
      gifi_reviewed_by_user_id=excluded.gifi_reviewed_by_user_id,
      gifi_reviewed_at=excluded.gifi_reviewed_at,
      tax_deductibility_percent=excluded.tax_deductibility_percent,
      is_active=excluded.is_active,
      updated_at=CURRENT_TIMESTAMP
  `).bind(code,name,category,parent_group || null,normal_balance,sort_order,gifi_code || null,gifi_label || null,gifi_section || null,gifi_review_state,gifi_review_note || null,reviewActorId,reviewedAt,tax_deductibility_percent,is_active).run();
  await auditAdminAction(context.env, context.request, adminUser, {
    action_type:"save_gl_account", target_type:"general_ledger_account", target_key:code,
    details:{ name, category, parent_group, normal_balance, sort_order, gifi_code, gifi_label, gifi_section, tax_deductibility_percent, gifi_review_state, gifi_review_note, is_active }
  });
  return jsonResponse({ ok:true, summary: await loadSummary(db) });
}
