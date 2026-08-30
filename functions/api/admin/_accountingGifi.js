import { normalizeText } from '../_lib/adminAudit.js';

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function tableColumns(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(rows(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function tableIndexes(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA index_list(${tableName})`).all();
    return new Set(rows(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

export async function ensureAccountingGifiNotesTable(db) {
  const columns = await tableColumns(db, 'accounting_gifi_review_notes');
  const requiredColumns = [
    'accounting_gifi_review_note_id', 'tax_year', 'gifi_code', 'gifi_label', 'gifi_section', 'accountant_note',
    'schedule_141_note', 'supporting_details', 'review_status', 'created_by_user_id', 'updated_by_user_id', 'created_at', 'updated_at'
  ];
  const missingColumns = requiredColumns.filter((name) => !columns.has(name));
  if (missingColumns.length) {
    throw new Error(`Accounting GIFI schema is not ready: accounting_gifi_review_notes is missing ${missingColumns.join(', ')}. Apply the current Development migration authority.`);
  }
  const indexes = await tableIndexes(db, 'accounting_gifi_review_notes');
  if (!indexes.has('idx_accounting_gifi_review_notes_year')) {
    throw new Error('Accounting GIFI schema is not ready: accounting_gifi_review_notes is missing index idx_accounting_gifi_review_notes_year. Apply the current Development migration authority.');
  }
  return true;
}

function normalizeReviewStatus(value) {
  const raw = normalizeText(value).toLowerCase();
  return ['draft', 'reviewed', 'needs_accountant', 'finalized'].includes(raw) ? raw : 'draft';
}

export function cleanGifiCode(value) {
  const raw = normalizeText(value).toUpperCase();
  return raw || 'UNMAPPED';
}

export async function listAccountingGifiNotes(db, taxYear) {
  await ensureAccountingGifiNotesTable(db);
  const year = String(taxYear || '').trim();
  const result = await db.prepare(`
    SELECT accounting_gifi_review_note_id, tax_year, gifi_code, gifi_label, gifi_section,
           accountant_note, schedule_141_note, supporting_details, review_status,
           created_by_user_id, updated_by_user_id, created_at, updated_at
    FROM accounting_gifi_review_notes
    WHERE tax_year = ?
    ORDER BY gifi_code ASC
  `).bind(year).all().catch(() => ({ results: [] }));
  return rows(result).map((row) => ({
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
}

export function mapAccountingGifiNotesByCode(rows = []) {
  const map = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    map.set(cleanGifiCode(row.gifi_code), row);
  }
  return map;
}
