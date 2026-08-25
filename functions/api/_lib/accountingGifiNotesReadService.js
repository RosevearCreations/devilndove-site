// Devil n Dove Build 327 — Accounting-owned non-mutating GIFI review-notes read service.

export const BUILD = 327;
export const CONTRACT_ID = 'accounting-gifi-notes-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLE = 'accounting_gifi_review_notes';

const REQUIRED_COLUMNS = Object.freeze([
  'accounting_gifi_review_note_id', 'tax_year', 'gifi_code', 'gifi_label', 'gifi_section',
  'accountant_note', 'schedule_141_note', 'supporting_details', 'review_status',
  'created_by_user_id', 'updated_by_user_id', 'created_at', 'updated_at',
]);

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function text(value) { return String(value ?? '').trim(); }
function normalizeReviewStatus(value) {
  const raw = text(value).toLowerCase();
  return ['draft', 'reviewed', 'needs_accountant', 'finalized'].includes(raw) ? raw : 'draft';
}

async function tableExists(db) {
  try {
    const row = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(AUTHORITY_TABLE).first();
    return Boolean(row?.name);
  } catch { return false; }
}
async function tableColumns(db) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${AUTHORITY_TABLE})`).all();
    return new Set(rows(result).map((row) => text(row?.name)).filter(Boolean));
  } catch { return new Set(); }
}
function payload(extra = {}) {
  return { ok: true, build: BUILD, contract: CONTRACT_ID, owner: OWNER, mode: 'read-only-accounting-gifi-notes', authority_table: AUTHORITY_TABLE, request_time_schema_mutation: false, ...extra };
}

export async function readAccountingGifiNotes(db, options = {}) {
  if (!db) throw new TypeError('A D1 database binding is required.');
  const year = text(options.year || new Date().getFullYear());
  if (!/^\d{4}$/.test(year)) {
    const error = new RangeError('Please provide year in YYYY format.');
    error.code = 'invalid_accounting_year';
    throw error;
  }

  if (!(await tableExists(db))) return payload({ year, schema_ready: false, missing_tables: [AUTHORITY_TABLE], missing_columns: [], notes: [], count: 0, summary: { note_count: 0, finalized_count: 0 } });
  const columns = await tableColumns(db);
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !columns.has(column)).map((column) => `${AUTHORITY_TABLE}.${column}`);
  if (missingColumns.length) return payload({ year, schema_ready: false, missing_tables: [], missing_columns: missingColumns, notes: [], count: 0, summary: { note_count: 0, finalized_count: 0 } });

  const result = await db.prepare(`
    SELECT accounting_gifi_review_note_id, tax_year, gifi_code, gifi_label, gifi_section,
           accountant_note, schedule_141_note, supporting_details, review_status,
           created_by_user_id, updated_by_user_id, created_at, updated_at
    FROM accounting_gifi_review_notes
    WHERE tax_year = ?
    ORDER BY gifi_code ASC
  `).bind(year).all();
  const notes = rows(result).map((row) => ({
    accounting_gifi_review_note_id: Number(row.accounting_gifi_review_note_id || 0),
    tax_year: row.tax_year || year,
    gifi_code: row.gifi_code || 'UNMAPPED',
    gifi_label: row.gifi_label || '',
    gifi_section: row.gifi_section || '',
    accountant_note: row.accountant_note || '',
    schedule_141_note: row.schedule_141_note || '',
    supporting_details: row.supporting_details || '',
    review_status: normalizeReviewStatus(row.review_status),
    created_by_user_id: row.created_by_user_id == null ? null : Number(row.created_by_user_id || 0),
    updated_by_user_id: row.updated_by_user_id == null ? null : Number(row.updated_by_user_id || 0),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  }));
  return payload({ year, schema_ready: true, missing_tables: [], missing_columns: [], notes, count: notes.length, summary: { note_count: notes.length, finalized_count: notes.filter((row) => row.review_status === 'finalized').length } });
}
