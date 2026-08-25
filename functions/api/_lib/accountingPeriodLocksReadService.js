// Devil n Dove Build 329 — Accounting-owned non-mutating period-lock read service.

export const BUILD = 329;
export const CONTRACT_ID = 'accounting-period-locks-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLE = 'accounting_period_closures';

const REQUIRED_COLUMNS = Object.freeze([
  'accounting_period_closure_id', 'period_month', 'lock_state', 'close_checklist_json', 'close_notes',
  'locked_by_user_id', 'locked_at', 'reopened_by_user_id', 'reopened_at', 'created_at', 'updated_at',
]);

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function text(value) { return String(value ?? '').trim(); }
function boundedLimit(value) { const n = Number(value); return Math.max(1, Math.min(60, Number.isFinite(n) ? Math.trunc(n) : 18)); }
function monthValue(value, fallback = '') {
  const raw = text(value);
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;
  if (fallback && /^\d{4}-\d{2}$/.test(String(fallback))) return String(fallback);
  return new Date().toISOString().slice(0, 7);
}
function normalizeChecklistPayload(payload = {}) {
  const safe = payload && typeof payload === 'object' ? payload : {};
  return {
    bank_reconciled: Number(safe.bank_reconciled || 0) === 1 ? 1 : 0,
    sales_tax_reviewed: Number(safe.sales_tax_reviewed || 0) === 1 ? 1 : 0,
    receipts_attached: Number(safe.receipts_attached || 0) === 1 ? 1 : 0,
    gifi_reviewed: Number(safe.gifi_reviewed || 0) === 1 ? 1 : 0,
    schedule_141_notes_started: Number(safe.schedule_141_notes_started || 0) === 1 ? 1 : 0,
    accountant_followup_flagged: Number(safe.accountant_followup_flagged || 0) === 1 ? 1 : 0,
  };
}
async function tableExists(db) {
  try { const row = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(AUTHORITY_TABLE).first(); return Boolean(row?.name); }
  catch { return false; }
}
async function tableColumns(db) {
  try { const result = await db.prepare(`PRAGMA table_info(${AUTHORITY_TABLE})`).all(); return new Set(rows(result).map((row) => text(row?.name)).filter(Boolean)); }
  catch { return new Set(); }
}
function mapRow(row) {
  let checklist = null;
  try { checklist = row.close_checklist_json ? JSON.parse(row.close_checklist_json) : null; } catch { checklist = null; }
  return {
    accounting_period_closure_id: Number(row.accounting_period_closure_id || 0),
    period_month: row.period_month || '',
    lock_state: text(row.lock_state).toLowerCase() || 'open',
    close_checklist: normalizeChecklistPayload(checklist || {}),
    close_notes: row.close_notes || '',
    locked_by_user_id: row.locked_by_user_id == null ? null : Number(row.locked_by_user_id || 0),
    locked_at: row.locked_at || null,
    reopened_by_user_id: row.reopened_by_user_id == null ? null : Number(row.reopened_by_user_id || 0),
    reopened_at: row.reopened_at || null,
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}
function payload(extra = {}) {
  return { ok: true, build: BUILD, contract: CONTRACT_ID, owner: OWNER, mode: 'read-only-accounting-period-locks', authority_table: AUTHORITY_TABLE, request_time_schema_mutation: false, ...extra };
}

export async function readAccountingPeriodLocks(db, options = {}) {
  if (!db) throw new TypeError('A D1 database binding is required.');
  const exists = await tableExists(db);
  if (!exists) return payload({ schema_ready: false, missing_tables: [AUTHORITY_TABLE], missing_columns: [], period_month: text(options.periodMonth) ? monthValue(options.periodMonth) : null, closure: null, closures: [], count: 0 });
  const columns = await tableColumns(db);
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !columns.has(column)).map((column) => `${AUTHORITY_TABLE}.${column}`);
  if (missingColumns.length) return payload({ schema_ready: false, missing_tables: [], missing_columns: missingColumns, period_month: text(options.periodMonth) ? monthValue(options.periodMonth) : null, closure: null, closures: [], count: 0 });

  const period = text(options.periodMonth);
  if (period) {
    const normalized = monthValue(period);
    const row = await db.prepare(`
      SELECT accounting_period_closure_id, period_month, lock_state, close_checklist_json, close_notes,
             locked_by_user_id, locked_at, reopened_by_user_id, reopened_at, created_at, updated_at
      FROM accounting_period_closures WHERE period_month = ? LIMIT 1
    `).bind(normalized).first().catch(() => null);
    const closure = row ? mapRow(row) : null;
    return payload({ schema_ready: true, missing_tables: [], missing_columns: [], period_month: normalized, closure, closures: closure ? [closure] : [], count: closure ? 1 : 0 });
  }

  const result = await db.prepare(`
    SELECT accounting_period_closure_id, period_month, lock_state, close_checklist_json, close_notes,
           locked_by_user_id, locked_at, reopened_by_user_id, reopened_at, created_at, updated_at
    FROM accounting_period_closures
    ORDER BY period_month DESC, accounting_period_closure_id DESC
    LIMIT ?
  `).bind(boundedLimit(options.limit)).all();
  const closures = rows(result).map(mapRow);
  return payload({ schema_ready: true, missing_tables: [], missing_columns: [], period_month: null, closure: null, closures, count: closures.length });
}
