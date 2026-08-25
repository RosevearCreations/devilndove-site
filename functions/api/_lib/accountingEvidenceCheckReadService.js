export const BUILD = 339;
export const CONTRACT_ID = 'accounting-evidence-check-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLES = Object.freeze(['hst_gst_review_records','accountant_export_manifests']);
const REQUIRED = Object.freeze({
  hst_gst_review_records: Object.freeze(['hst_gst_review_id','period_month','remittance_status','evidence_url','due_date']),
  accountant_export_manifests: Object.freeze(['accountant_export_manifest_id','period_month','export_status','evidence_index_url','archive_url']),
});
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
async function tableExists(db, table) { try { return !!(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(table).first()); } catch { return false; } }
async function columnSet(db, table) { try { return new Set(rows(await db.prepare(`PRAGMA table_info(${table})`).all()).map((row) => String(row?.name || '').trim()).filter(Boolean)); } catch { return new Set(); } }
export async function readAccountingEvidenceCheck(db, { periodMonth = '' } = {}) {
  if (!db) throw new TypeError('A D1 database binding is required.');
  const period = String(periodMonth || '').trim(); const missingTables = []; const missingColumns = []; const ready = {};
  for (const table of AUTHORITY_TABLES) {
    const exists = await tableExists(db, table); if (!exists) { missingTables.push(table); ready[table] = false; continue; }
    const cols = await columnSet(db, table); const misses = REQUIRED[table].filter((name) => !cols.has(name));
    missingColumns.push(...misses.map((name) => `${table}.${name}`)); ready[table] = misses.length === 0;
  }
  const checks = [];
  if (ready.hst_gst_review_records) {
    const hst = rows(await db.prepare(`SELECT hst_gst_review_id, period_month, remittance_status, evidence_url, due_date FROM hst_gst_review_records WHERE (?='' OR period_month=?) ORDER BY period_month DESC LIMIT 24`).bind(period, period).all().catch(() => ({ results: [] })));
    hst.forEach((row) => checks.push({ source: 'hst_gst_review_records', record_id: row.hst_gst_review_id, period_month: row.period_month, ok: !!row.evidence_url, evidence_url: row.evidence_url || '', issue: row.evidence_url ? '' : 'Missing HST/GST evidence URL.' }));
  }
  if (ready.accountant_export_manifests) {
    const manifests = rows(await db.prepare(`SELECT accountant_export_manifest_id, period_month, export_status, evidence_index_url, archive_url FROM accountant_export_manifests WHERE (?='' OR period_month=?) ORDER BY period_month DESC LIMIT 24`).bind(period, period).all().catch(() => ({ results: [] })));
    manifests.forEach((row) => checks.push({ source: 'accountant_export_manifests', record_id: row.accountant_export_manifest_id, period_month: row.period_month, ok: !!(row.evidence_index_url || row.archive_url), evidence_url: row.evidence_index_url || row.archive_url || '', issue: (row.evidence_index_url || row.archive_url) ? '' : 'Missing export/evidence index URL.' }));
  }
  return { ok: true, build: BUILD, contract: CONTRACT_ID, owner: OWNER, mode: 'read-only-accounting-evidence-check', authority_tables: AUTHORITY_TABLES, schema_ready: missingTables.length === 0 && missingColumns.length === 0, missing_tables: missingTables, missing_columns: missingColumns, request_time_schema_mutation: false, period_month: period, checks, count: checks.length, summary: { total: checks.length, missing: checks.filter((row) => !row.ok).length, ready: checks.filter((row) => row.ok).length } };
}
