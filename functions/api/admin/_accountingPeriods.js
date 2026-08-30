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

export function monthValue(value, fallback = '') {
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;
  if (fallback && /^\d{4}-\d{2}$/.test(String(fallback))) return String(fallback);
  return new Date().toISOString().slice(0, 7);
}

export function monthFromDateish(value, fallback = '') {
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw.slice(0, 7);
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 7);
  }
  return monthValue(fallback);
}

export async function ensureAccountingPeriodClosuresTable(db) {
  const columns = await tableColumns(db, 'accounting_period_closures');
  const requiredColumns = [
    'accounting_period_closure_id', 'period_month', 'lock_state', 'close_checklist_json', 'close_notes',
    'locked_by_user_id', 'locked_at', 'reopened_by_user_id', 'reopened_at', 'created_at', 'updated_at'
  ];
  const missingColumns = requiredColumns.filter((name) => !columns.has(name));
  if (missingColumns.length) {
    throw new Error(`Accounting period schema is not ready: accounting_period_closures is missing ${missingColumns.join(', ')}. Apply the current Development migration authority.`);
  }
  const indexes = await tableIndexes(db, 'accounting_period_closures');
  if (!indexes.has('idx_accounting_period_closures_period')) {
    throw new Error('Accounting period schema is not ready: accounting_period_closures is missing index idx_accounting_period_closures_period. Apply the current Development migration authority.');
  }
  return true;
}

export function normalizeChecklistPayload(payload = {}) {
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

export async function getAccountingPeriodClosure(db, periodMonth) {
  await ensureAccountingPeriodClosuresTable(db);
  const period = monthValue(periodMonth);
  const row = await db.prepare(`
    SELECT accounting_period_closure_id, period_month, lock_state, close_checklist_json, close_notes,
           locked_by_user_id, locked_at, reopened_by_user_id, reopened_at, created_at, updated_at
    FROM accounting_period_closures
    WHERE period_month = ?
    LIMIT 1
  `).bind(period).first().catch(() => null);
  if (!row) return null;
  let checklist = null;
  try { checklist = row.close_checklist_json ? JSON.parse(row.close_checklist_json) : null; } catch { checklist = null; }
  return {
    accounting_period_closure_id: Number(row.accounting_period_closure_id || 0),
    period_month: row.period_month || period,
    lock_state: normalizeText(row.lock_state).toLowerCase() || 'open',
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

export async function isAccountingPeriodLocked(db, periodMonth) {
  const row = await getAccountingPeriodClosure(db, periodMonth);
  return !!row && row.lock_state === 'locked';
}

export async function assertAccountingPeriodOpen(db, periodMonth, label = 'This accounting period') {
  const period = monthValue(periodMonth);
  const locked = await isAccountingPeriodLocked(db, period);
  if (locked) {
    throw new Error(`${label} (${period}) is locked. Reopen the month before changing these records.`);
  }
  return period;
}

export async function listAccountingPeriodClosures(db, { limit = 18 } = {}) {
  await ensureAccountingPeriodClosuresTable(db);
  const result = await db.prepare(`
    SELECT accounting_period_closure_id, period_month, lock_state, close_checklist_json, close_notes,
           locked_by_user_id, locked_at, reopened_by_user_id, reopened_at, created_at, updated_at
    FROM accounting_period_closures
    ORDER BY period_month DESC, accounting_period_closure_id DESC
    LIMIT ?
  `).bind(Math.max(1, Math.min(60, Number(limit || 18) || 18))).all().catch(() => ({ results: [] }));
  const mapped = [];
  for (const row of rows(result)) {
    let checklist = null;
    try { checklist = row.close_checklist_json ? JSON.parse(row.close_checklist_json) : null; } catch { checklist = null; }
    mapped.push({
      accounting_period_closure_id: Number(row.accounting_period_closure_id || 0),
      period_month: row.period_month || '',
      lock_state: normalizeText(row.lock_state).toLowerCase() || 'open',
      close_checklist: normalizeChecklistPayload(checklist || {}),
      close_notes: row.close_notes || '',
      locked_by_user_id: row.locked_by_user_id == null ? null : Number(row.locked_by_user_id || 0),
      locked_at: row.locked_at || null,
      reopened_by_user_id: row.reopened_by_user_id == null ? null : Number(row.reopened_by_user_id || 0),
      reopened_at: row.reopened_at || null,
      created_at: row.created_at || null,
      updated_at: row.updated_at || null,
    });
  }
  return mapped;
}
