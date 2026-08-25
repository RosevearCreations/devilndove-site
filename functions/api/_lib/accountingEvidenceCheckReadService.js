// Devil n Dove Build 339 contract / Build 399 current-authority alignment.
// Read-only evidence readiness using the same Accounting tables as the Build 342 close workflow.

export const BUILD = 339;
export const IMPLEMENTATION_BUILD = 399;
export const CONTRACT_ID = 'accounting-evidence-check-read';
export const OWNER = 'accounting';
export const MIGRATION_AUTHORITY = 'database_accounting_runtime_parity.sql';
export const AUTHORITY_TABLES = Object.freeze(['accounting_hst_gst_reviews','accountant_export_packages']);
const REQUIRED = Object.freeze({
  accounting_hst_gst_reviews: Object.freeze([
    'accounting_hst_gst_review_id','period_month','review_status','remittance_status',
    'remittance_evidence_url','filing_due_date',
  ]),
  accountant_export_packages: Object.freeze([
    'accountant_export_package_id','package_key','period_month','tax_year','package_status',
    'manifest_json','finalized_at','updated_at',
  ]),
});

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function text(value) { return String(value ?? '').trim(); }
async function tableExists(db, table) {
  try { return !!(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(table).first()); }
  catch { return false; }
}
async function columnSet(db, table) {
  try { return new Set(rows(await db.prepare(`PRAGMA table_info(${table})`).all()).map((row) => text(row?.name)).filter(Boolean)); }
  catch { return new Set(); }
}
function parseManifest(value) {
  if (!value) return {};
  try { const parsed = JSON.parse(String(value)); return parsed && typeof parsed === 'object' ? parsed : {}; }
  catch { return {}; }
}
function manifestEvidence(manifest = {}) {
  const candidates = [
    manifest.evidence_index_url,
    manifest.archive_url,
    manifest.download_url,
    manifest.package_url,
    manifest.manifest_url,
  ].map(text).filter(Boolean);
  return candidates[0] || '';
}

export async function readAccountingEvidenceCheck(db, { periodMonth = '' } = {}) {
  if (!db) throw new TypeError('A D1 database binding is required.');
  const period = text(periodMonth);
  const missingTables = [];
  const missingColumns = [];
  const ready = {};

  for (const table of AUTHORITY_TABLES) {
    const exists = await tableExists(db, table);
    if (!exists) {
      missingTables.push(table);
      ready[table] = false;
      continue;
    }
    const cols = await columnSet(db, table);
    const misses = REQUIRED[table].filter((name) => !cols.has(name));
    missingColumns.push(...misses.map((name) => `${table}.${name}`));
    ready[table] = misses.length === 0;
  }

  const checks = [];
  if (ready.accounting_hst_gst_reviews) {
    const hst = rows(await db.prepare(`
      SELECT accounting_hst_gst_review_id, period_month, review_status,
             remittance_status, remittance_evidence_url, filing_due_date
      FROM accounting_hst_gst_reviews
      WHERE (?='' OR period_month=?)
      ORDER BY period_month DESC
      LIMIT 24
    `).bind(period, period).all().catch(() => ({ results: [] })));
    hst.forEach((row) => checks.push({
      source: 'accounting_hst_gst_reviews',
      record_id: row.accounting_hst_gst_review_id,
      period_month: row.period_month,
      ok: !!row.remittance_evidence_url,
      evidence_url: row.remittance_evidence_url || '',
      due_date: row.filing_due_date || '',
      status: row.remittance_status || row.review_status || '',
      issue: row.remittance_evidence_url ? '' : 'Missing HST/GST remittance evidence URL.',
    }));
  }

  if (ready.accountant_export_packages) {
    const packages = rows(await db.prepare(`
      SELECT accountant_export_package_id, package_key, period_month, tax_year,
             package_status, manifest_json, finalized_at, updated_at
      FROM accountant_export_packages
      WHERE (?='' OR period_month=? OR tax_year=substr(?,1,4))
      ORDER BY datetime(updated_at) DESC, accountant_export_package_id DESC
      LIMIT 24
    `).bind(period, period, period).all().catch(() => ({ results: [] })));
    packages.forEach((row) => {
      const manifest = parseManifest(row.manifest_json);
      const url = manifestEvidence(manifest);
      const manifestPresent = text(row.manifest_json).length > 2;
      checks.push({
        source: 'accountant_export_packages',
        record_id: row.accountant_export_package_id,
        record_key: row.package_key || '',
        period_month: row.period_month || '',
        ok: !!(url || manifestPresent),
        evidence_url: url,
        status: row.package_status || '',
        issue: (url || manifestPresent) ? '' : 'Missing accountant export manifest/evidence reference.',
      });
    });
  }

  return {
    ok: true,
    build: BUILD,
    implementation_build: IMPLEMENTATION_BUILD,
    contract: CONTRACT_ID,
    owner: OWNER,
    mode: 'read-only-accounting-evidence-check-current-authorities',
    authority_tables: AUTHORITY_TABLES,
    migration_authority: MIGRATION_AUTHORITY,
    legacy_authorities_retired: Object.freeze(['hst_gst_review_records','accountant_export_manifests']),
    schema_ready: missingTables.length === 0 && missingColumns.length === 0,
    missing_tables: missingTables,
    missing_columns: missingColumns,
    request_time_schema_mutation: false,
    period_month: period,
    checks,
    count: checks.length,
    summary: {
      total: checks.length,
      missing: checks.filter((row) => !row.ok).length,
      ready: checks.filter((row) => row.ok).length,
    },
  };
}
