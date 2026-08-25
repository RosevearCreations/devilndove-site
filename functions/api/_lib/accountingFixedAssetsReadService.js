export const BUILD = 338;
export const CONTRACT_ID = 'accounting-fixed-assets-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLE = 'accounting_fixed_assets';
const REQUIRED_COLUMNS = Object.freeze(['accounting_fixed_asset_id','asset_label','asset_category','cca_class','acquisition_date','cost_cents','salvage_cents','business_use_percent','location_note','vendor_name','notes','created_at','updated_at']);
function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
async function tableExists(db) { try { return !!(await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(AUTHORITY_TABLE).first()); } catch { return false; } }
async function columnSet(db) { try { return new Set(rows(await db.prepare(`PRAGMA table_info(${AUTHORITY_TABLE})`).all()).map((row) => String(row?.name || '').trim()).filter(Boolean)); } catch { return new Set(); } }
function payload(extra = {}) { return { ok: true, build: BUILD, contract: CONTRACT_ID, owner: OWNER, mode: 'read-only-accounting-fixed-assets', authority_table: AUTHORITY_TABLE, request_time_schema_mutation: false, ...extra }; }
export async function readAccountingFixedAssets(db) {
  if (!db) throw new TypeError('A D1 database binding is required.');
  if (!(await tableExists(db))) return payload({ schema_ready: false, missing_tables: [AUTHORITY_TABLE], missing_columns: [], assets: [], count: 0, summary: { asset_count: 0, total_cost_cents: 0 } });
  const cols = await columnSet(db); const missingColumns = REQUIRED_COLUMNS.filter((name) => !cols.has(name)).map((name) => `${AUTHORITY_TABLE}.${name}`);
  if (missingColumns.length) return payload({ schema_ready: false, missing_tables: [], missing_columns: missingColumns, assets: [], count: 0, summary: { asset_count: 0, total_cost_cents: 0 } });
  const assets = rows(await db.prepare(`SELECT accounting_fixed_asset_id, asset_label, asset_category, cca_class, acquisition_date, cost_cents, salvage_cents, business_use_percent, location_note, vendor_name, notes, created_at, updated_at FROM accounting_fixed_assets ORDER BY acquisition_date DESC, accounting_fixed_asset_id DESC LIMIT 200`).all().catch(() => ({ results: [] }))).map((row) => ({ ...row, accounting_fixed_asset_id: Number(row.accounting_fixed_asset_id || 0), cost_cents: Number(row.cost_cents || 0), salvage_cents: Number(row.salvage_cents || 0), business_use_percent: Number(row.business_use_percent || 0) }));
  return payload({ schema_ready: true, missing_tables: [], missing_columns: [], assets, count: assets.length, summary: { asset_count: assets.length, total_cost_cents: assets.reduce((sum, row) => sum + Number(row.cost_cents || 0), 0) } });
}
