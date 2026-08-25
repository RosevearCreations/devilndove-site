// Devil n Dove Build 318 — Accounting-owned read service for General Ledger accounts.
// Read-only by design: reports schema readiness and never creates, alters, repairs,
// inserts, updates, or deletes database state during a read.

export const BUILD = 318;
export const CONTRACT_ID = 'accounting-general-ledger-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLE = 'general_ledger_accounts';

const REQUIRED_COLUMNS = Object.freeze([
  'gl_account_id', 'code', 'name', 'category', 'parent_group', 'normal_balance',
  'sort_order', 'gifi_code', 'gifi_label', 'gifi_section', 'gifi_review_state',
  'gifi_review_note', 'gifi_reviewed_by_user_id', 'gifi_reviewed_at',
  'tax_deductibility_percent', 'is_active', 'created_at', 'updated_at',
]);

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function text(value) {
  return String(value ?? '').trim();
}

async function tableExists(db, tableName) {
  try {
    const row = await db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`
    ).bind(tableName).first();
    return Boolean(row?.name);
  } catch {
    return false;
  }
}

async function tableColumns(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(rows(result).map((row) => text(row?.name)).filter(Boolean));
  } catch {
    return new Set();
  }
}

function emptySummary() {
  return Object.freeze({
    total_count: 0,
    active_count: 0,
    mapped_count: 0,
    reviewed_count: 0,
    finalized_count: 0,
    unmapped_count: 0,
    needs_accountant_count: 0,
    ready_to_finalize_count: 0,
    final_blockers: Object.freeze([]),
    final_blocker_count: 0,
  });
}

function shapeAccount(row = {}) {
  return Object.freeze({
    gl_account_id: Number(row.gl_account_id || 0),
    code: text(row.code),
    name: text(row.name),
    category: text(row.category),
    parent_group: text(row.parent_group),
    normal_balance: text(row.normal_balance),
    sort_order: Number(row.sort_order || 0),
    gifi_code: text(row.gifi_code),
    gifi_label: text(row.gifi_label),
    gifi_section: text(row.gifi_section),
    tax_deductibility_percent: Number(row.tax_deductibility_percent == null ? 100 : row.tax_deductibility_percent),
    gifi_review_state: text(row.gifi_review_state) || 'draft',
    gifi_review_note: text(row.gifi_review_note),
    gifi_reviewed_by_user_id: row.gifi_reviewed_by_user_id == null ? null : Number(row.gifi_reviewed_by_user_id || 0),
    gifi_reviewed_at: row.gifi_reviewed_at || null,
    is_active: Number(row.is_active == null ? 1 : row.is_active) === 0 ? 0 : 1,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  });
}

function shapeSummary(row = {}, blockers = []) {
  const finalBlockers = Object.freeze(rows(blockers));
  return Object.freeze({
    total_count: Number(row?.total_count || 0),
    active_count: Number(row?.active_count || 0),
    mapped_count: Number(row?.mapped_count || 0),
    reviewed_count: Number(row?.reviewed_count || 0),
    finalized_count: Number(row?.finalized_count || 0),
    unmapped_count: Number(row?.unmapped_count || 0),
    needs_accountant_count: Number(row?.needs_accountant_count || 0),
    ready_to_finalize_count: Number(row?.ready_to_finalize_count || 0),
    final_blockers: finalBlockers,
    final_blocker_count: finalBlockers.length,
  });
}

function basePayload(extra = {}) {
  return {
    ok: true,
    build: BUILD,
    contract: CONTRACT_ID,
    owner: OWNER,
    mode: 'read-only-accounting-general-ledger',
    authority_table: AUTHORITY_TABLE,
    request_time_schema_mutation: false,
    ...extra,
  };
}

export async function readAccountingGeneralLedger(db) {
  if (!db) throw new TypeError('A D1 database binding is required.');

  const exists = await tableExists(db, AUTHORITY_TABLE);
  if (!exists) {
    return basePayload({
      schema_ready: false,
      missing_tables: [AUTHORITY_TABLE],
      missing_columns: [],
      accounts: [],
      count: 0,
      summary: emptySummary(),
    });
  }

  const columns = await tableColumns(db, AUTHORITY_TABLE);
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !columns.has(column));
  if (missingColumns.length) {
    return basePayload({
      schema_ready: false,
      missing_tables: [],
      missing_columns: missingColumns,
      accounts: [],
      count: 0,
      summary: emptySummary(),
    });
  }

  const accountResult = await db.prepare(`
    SELECT gl_account_id, code, name, category, parent_group, normal_balance, sort_order,
           gifi_code, gifi_label, gifi_section, tax_deductibility_percent, gifi_review_state, gifi_review_note,
           gifi_reviewed_by_user_id, gifi_reviewed_at,
           is_active, created_at, updated_at
    FROM general_ledger_accounts
    ORDER BY COALESCE(is_active,1) DESC, category ASC, sort_order ASC, code ASC
  `).all();

  const summaryRow = await db.prepare(`
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
  `).first();

  const blockers = await db.prepare(`
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
  `).all();

  const accounts = rows(accountResult).map(shapeAccount);
  return basePayload({
    schema_ready: true,
    missing_tables: [],
    missing_columns: [],
    accounts,
    count: accounts.length,
    summary: shapeSummary(summaryRow, blockers),
  });
}
