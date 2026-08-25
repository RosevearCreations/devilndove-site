// Devil n Dove Build 326 — Accounting-owned non-mutating monthly journal read service.

export const BUILD = 326;
export const CONTRACT_ID = 'accounting-journal-read';
export const OWNER = 'accounting';
export const ENTRY_TABLE = 'accounting_journal_entries';
export const LINE_TABLE = 'accounting_journal_lines';

const REQUIRED_ENTRY_COLUMNS = Object.freeze([
  'journal_entry_id', 'period_month', 'entry_date', 'source_type', 'source_key',
  'reference_code', 'description', 'status', 'total_debit_cents', 'total_credit_cents',
  'imbalance_cents', 'notes', 'created_at', 'updated_at',
]);
const REQUIRED_LINE_COLUMNS = Object.freeze([
  'journal_line_id', 'journal_entry_id', 'line_number', 'ledger_code', 'ledger_name',
  'line_description', 'debit_cents', 'credit_cents', 'created_at', 'updated_at',
]);

function rows(result) { return Array.isArray(result?.results) ? result.results : []; }
function text(value) { return String(value ?? '').trim(); }

export function monthValue(value) {
  const raw = text(value);
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(raw) ? raw : null;
}

async function tableExists(db, tableName) {
  try {
    const row = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(tableName).first();
    return Boolean(row?.name);
  } catch { return false; }
}

async function tableColumns(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(rows(result).map((row) => text(row?.name)).filter(Boolean));
  } catch { return new Set(); }
}

function payload(extra = {}) {
  return {
    ok: true,
    build: BUILD,
    contract: CONTRACT_ID,
    owner: OWNER,
    mode: 'read-only-accounting-journal',
    authority_tables: [ENTRY_TABLE, LINE_TABLE],
    request_time_schema_mutation: false,
    ...extra,
  };
}

function emptySummary() {
  return {
    entry_count: 0,
    balanced_entry_count: 0,
    imbalance_entry_count: 0,
    imbalance_count: 0,
    total_debit_cents: 0,
    total_credit_cents: 0,
    journal_imbalance_cents: 0,
  };
}

export async function readAccountingJournal(db, options = {}) {
  if (!db) throw new TypeError('A D1 database binding is required.');
  const period = monthValue(options.month || new Date().toISOString().slice(0, 7));
  if (!period) {
    const error = new RangeError('Please provide month in YYYY-MM format.');
    error.code = 'invalid_accounting_month';
    throw error;
  }

  const entryExists = await tableExists(db, ENTRY_TABLE);
  const lineExists = await tableExists(db, LINE_TABLE);
  const missingTables = [];
  if (!entryExists) missingTables.push(ENTRY_TABLE);
  if (!lineExists) missingTables.push(LINE_TABLE);

  const entryColumns = entryExists ? await tableColumns(db, ENTRY_TABLE) : new Set();
  const lineColumns = lineExists ? await tableColumns(db, LINE_TABLE) : new Set();
  const missingColumns = [
    ...REQUIRED_ENTRY_COLUMNS.filter((column) => entryExists && !entryColumns.has(column)).map((column) => `${ENTRY_TABLE}.${column}`),
    ...REQUIRED_LINE_COLUMNS.filter((column) => lineExists && !lineColumns.has(column)).map((column) => `${LINE_TABLE}.${column}`),
  ];

  if (missingTables.length || missingColumns.length) {
    return payload({
      period,
      schema_ready: false,
      missing_tables: missingTables,
      missing_columns: missingColumns,
      entries: [],
      count: 0,
      summary: emptySummary(),
    });
  }

  const entries = rows(await db.prepare(`
    SELECT journal_entry_id, period_month, entry_date, source_type, source_key,
           reference_code, description, status, total_debit_cents, total_credit_cents,
           imbalance_cents, notes, created_at, updated_at
    FROM accounting_journal_entries
    WHERE period_month = ?
    ORDER BY entry_date DESC, journal_entry_id DESC
  `).bind(period).all());

  const lines = rows(await db.prepare(`
    SELECT journal_line_id, journal_entry_id, line_number, ledger_code, ledger_name,
           line_description, debit_cents, credit_cents, created_at, updated_at
    FROM accounting_journal_lines
    WHERE journal_entry_id IN (
      SELECT journal_entry_id FROM accounting_journal_entries WHERE period_month = ?
    )
    ORDER BY journal_entry_id DESC, line_number ASC
  `).bind(period).all());

  const lineMap = new Map();
  for (const line of lines) {
    const key = Number(line.journal_entry_id || 0);
    if (!lineMap.has(key)) lineMap.set(key, []);
    lineMap.get(key).push({
      journal_line_id: Number(line.journal_line_id || 0),
      line_number: Number(line.line_number || 0),
      ledger_code: line.ledger_code || '',
      ledger_name: line.ledger_name || '',
      line_description: line.line_description || '',
      debit_cents: Number(line.debit_cents || 0),
      credit_cents: Number(line.credit_cents || 0),
      created_at: line.created_at || '',
      updated_at: line.updated_at || '',
    });
  }

  let totalDebit = 0;
  let totalCredit = 0;
  let imbalanceCount = 0;
  const normalizedEntries = entries.map((entry) => {
    const debit = Number(entry.total_debit_cents || 0);
    const credit = Number(entry.total_credit_cents || 0);
    const imbalance = Number(entry.imbalance_cents || 0);
    totalDebit += debit;
    totalCredit += credit;
    if (imbalance !== 0) imbalanceCount += 1;
    return {
      journal_entry_id: Number(entry.journal_entry_id || 0),
      period_month: entry.period_month || period,
      entry_date: entry.entry_date || '',
      source_type: entry.source_type || '',
      source_key: entry.source_key || '',
      reference_code: entry.reference_code || '',
      description: entry.description || '',
      status: entry.status || 'draft',
      total_debit_cents: debit,
      total_credit_cents: credit,
      imbalance_cents: imbalance,
      notes: entry.notes || '',
      created_at: entry.created_at || '',
      updated_at: entry.updated_at || '',
      lines: lineMap.get(Number(entry.journal_entry_id || 0)) || [],
    };
  });

  return payload({
    period,
    schema_ready: true,
    missing_tables: [],
    missing_columns: [],
    entries: normalizedEntries,
    count: normalizedEntries.length,
    summary: {
      entry_count: normalizedEntries.length,
      balanced_entry_count: normalizedEntries.length - imbalanceCount,
      imbalance_entry_count: imbalanceCount,
      imbalance_count: imbalanceCount,
      total_debit_cents: totalDebit,
      total_credit_cents: totalCredit,
      journal_imbalance_cents: totalDebit - totalCredit,
    },
  });
}
