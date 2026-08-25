// Devil n Dove Build 328 — Accounting-owned non-mutating GIFI staging summary read service.

export const BUILD = 328;
export const CONTRACT_ID = 'accounting-gifi-summary-read';
export const OWNER = 'accounting';
export const AUTHORITY_TABLE = 'general_ledger_accounts';

const REQUIRED_GL_COLUMNS = Object.freeze([
  'code',
  'name',
  'category',
  'gifi_code',
  'gifi_label',
  'gifi_section',
  'gifi_review_state',
  'tax_deductibility_percent',
  'is_active',
]);

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function text(value) {
  return String(value ?? '').trim();
}

function asInt(value) {
  return Math.round(Number(value || 0));
}

function yearRange(value) {
  const raw = text(value);
  if (!/^\d{4}$/.test(raw)) return null;
  return { year: raw, start: `${raw}-01-01`, end: `${Number(raw) + 1}-01-01` };
}

async function tableExists(db, tableName) {
  try {
    const row = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(tableName).first();
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

function firstExisting(columns, names, fallback = '0') {
  for (const name of names) if (columns.has(name)) return name;
  return fallback;
}

function emptySummary() {
  return {
    mapped_line_count: 0,
    total_line_count: 0,
    unmapped_line_count: 0,
    readiness_percent: 0,
  };
}

function emptyGlReviewSummary() {
  return {
    active_account_count: 0,
    reviewed_account_count: 0,
    finalized_account_count: 0,
    active_unmapped_account_count: 0,
    review_states: [],
  };
}

function payload(extra = {}) {
  return {
    ok: true,
    build: BUILD,
    contract: CONTRACT_ID,
    owner: OWNER,
    mode: 'read-only-accounting-gifi-summary',
    authority_table: AUTHORITY_TABLE,
    request_time_schema_mutation: false,
    ...extra,
  };
}

async function buildFallbackSummary(db, range) {
  const hasExpenses = await tableExists(db, 'accounting_expenses');
  const hasWriteoffs = await tableExists(db, 'accounting_writeoffs');
  const hasOrders = await tableExists(db, 'orders');
  const orderCols = hasOrders ? await tableColumns(db, 'orders') : new Set();
  const sourceRows = [];

  if (hasExpenses) {
    const result = await db.prepare(`
      SELECT
        COALESCE(NULLIF(e.ledger_code,''), 'UNASSIGNED') AS ledger_code,
        COALESCE(NULLIF(g.name,''), e.ledger_name, 'Unassigned') AS ledger_name,
        COALESCE(NULLIF(g.gifi_code,''), '') AS gifi_code,
        COALESCE(NULLIF(g.gifi_label,''), '') AS gifi_label,
        COALESCE(NULLIF(g.gifi_section,''), 'income_statement') AS gifi_section,
        COALESCE(g.tax_deductibility_percent, 100) AS tax_deductibility_percent,
        COALESCE(SUM(CAST(ROUND((COALESCE(e.amount,0) + COALESCE(e.tax_amount,0)) * 100.0) AS INTEGER)),0) AS net_cents,
        COUNT(*) AS source_count
      FROM accounting_expenses e
      LEFT JOIN general_ledger_accounts g ON g.code = e.ledger_code
      WHERE substr(COALESCE(e.expense_date, e.created_at, datetime('now')), 1, 10) >= ?
        AND substr(COALESCE(e.expense_date, e.created_at, datetime('now')), 1, 10) < ?
      GROUP BY ledger_code, ledger_name, gifi_code, gifi_label, gifi_section, tax_deductibility_percent
    `).bind(range.start, range.end).all().catch(() => ({ results: [] }));
    sourceRows.push(...rows(result).map((row) => ({ ...row, source_type: 'expenses' })));
  }

  if (hasWriteoffs) {
    const result = await db.prepare(`
      SELECT
        '6900' AS ledger_code,
        COALESCE(NULLIF(g.name,''), 'Write-Offs') AS ledger_name,
        COALESCE(NULLIF(g.gifi_code,''), '') AS gifi_code,
        COALESCE(NULLIF(g.gifi_label,''), '') AS gifi_label,
        COALESCE(NULLIF(g.gifi_section,''), 'income_statement') AS gifi_section,
        COALESCE(g.tax_deductibility_percent, 100) AS tax_deductibility_percent,
        COALESCE(SUM(CAST(ROUND(COALESCE(w.amount,0) * 100.0) AS INTEGER)),0) AS net_cents,
        COUNT(*) AS source_count
      FROM accounting_writeoffs w
      LEFT JOIN general_ledger_accounts g ON g.code = '6900'
      WHERE substr(COALESCE(w.writeoff_date, w.created_at, datetime('now')), 1, 10) >= ?
        AND substr(COALESCE(w.writeoff_date, w.created_at, datetime('now')), 1, 10) < ?
    `).bind(range.start, range.end).all().catch(() => ({ results: [] }));
    sourceRows.push(...rows(result).map((row) => ({ ...row, source_type: 'writeoffs' })).filter((row) => asInt(row.net_cents) !== 0));
  }

  if (hasOrders) {
    const totalExpr = orderCols.has('total_cents')
      ? 'COALESCE(o.total_cents,0)'
      : orderCols.has('total_amount')
        ? 'CAST(ROUND(COALESCE(o.total_amount,0) * 100.0) AS INTEGER)'
        : orderCols.has('total')
          ? 'CAST(ROUND(COALESCE(o.total,0) * 100.0) AS INTEGER)'
          : '0';
    const statusCol = firstExisting(orderCols, ['order_status', 'status'], "''");
    const createdCol = firstExisting(orderCols, ['created_at'], "datetime('now')");
    const result = await db.prepare(`
      SELECT
        '4000' AS ledger_code,
        COALESCE(NULLIF(g.name,''), 'Sales Revenue') AS ledger_name,
        COALESCE(NULLIF(g.gifi_code,''), '') AS gifi_code,
        COALESCE(NULLIF(g.gifi_label,''), '') AS gifi_label,
        COALESCE(NULLIF(g.gifi_section,''), 'income_statement') AS gifi_section,
        COALESCE(g.tax_deductibility_percent, 100) AS tax_deductibility_percent,
        COALESCE(SUM(${totalExpr}),0) AS net_cents,
        COUNT(*) AS source_count
      FROM orders o
      LEFT JOIN general_ledger_accounts g ON g.code = '4000'
      WHERE substr(COALESCE(${createdCol}, datetime('now')), 1, 10) >= ?
        AND substr(COALESCE(${createdCol}, datetime('now')), 1, 10) < ?
        AND LOWER(COALESCE(${statusCol},'')) IN ('paid','fulfilled')
    `).bind(range.start, range.end).all().catch(() => ({ results: [] }));
    sourceRows.push(...rows(result).map((row) => ({ ...row, source_type: 'orders' })).filter((row) => asInt(row.net_cents) !== 0));
  }

  const grouped = new Map();
  for (const row of sourceRows) {
    const key = [row.gifi_section || '', row.gifi_code || '', row.gifi_label || '', row.ledger_code || ''].join('|');
    const current = grouped.get(key) || {
      gifi_section: row.gifi_section || '',
      gifi_code: row.gifi_code || '',
      gifi_label: row.gifi_label || '',
      ledger_codes: new Set(),
      net_cents: 0,
      deductible_cents: 0,
      source_count: 0,
      source_types: new Set(),
    };
    current.ledger_codes.add(String(row.ledger_code || ''));
    const net = asInt(row.net_cents);
    current.net_cents += net;
    current.deductible_cents += Math.round(net * (Math.max(0, Math.min(100, Number(row.tax_deductibility_percent == null ? 100 : row.tax_deductibility_percent))) / 100));
    current.source_count += Number(row.source_count || 0);
    current.source_types.add(String(row.source_type || 'fallback'));
    grouped.set(key, current);
  }

  return [...grouped.values()].map((row) => ({
    gifi_section: row.gifi_section,
    gifi_code: row.gifi_code,
    gifi_label: row.gifi_label,
    ledger_codes: [...row.ledger_codes].filter(Boolean).join(', '),
    net_cents: row.net_cents,
    deductible_cents: row.deductible_cents,
    source_count: row.source_count,
    source_types: [...row.source_types].join(', '),
  })).sort((a, b) => String(a.gifi_code || 'ZZZZ').localeCompare(String(b.gifi_code || 'ZZZZ')) || String(a.ledger_codes || '').localeCompare(String(b.ledger_codes || '')));
}

export async function readAccountingGifiSummary(db, options = {}) {
  if (!db) throw new TypeError('A D1 database binding is required.');

  const range = yearRange(options.year || String(new Date().getFullYear()));
  if (!range) {
    const error = new RangeError('Please provide year in YYYY format.');
    error.code = 'invalid_accounting_year';
    throw error;
  }

  const glExists = await tableExists(db, AUTHORITY_TABLE);
  const glColumns = glExists ? await tableColumns(db, AUTHORITY_TABLE) : new Set();
  const missingTables = glExists ? [] : [AUTHORITY_TABLE];
  const missingColumns = glExists ? REQUIRED_GL_COLUMNS.filter((column) => !glColumns.has(column)).map((column) => `${AUTHORITY_TABLE}.${column}`) : [];

  if (missingTables.length || missingColumns.length) {
    return payload({
      year: range.year,
      schema_ready: false,
      missing_tables: missingTables,
      missing_columns: missingColumns,
      source_used: 'schema-not-ready',
      summary: emptySummary(),
      gl_review_summary: emptyGlReviewSummary(),
      gifi_rows: [],
      unmapped_accounts: [],
      notes: ['GIFI summary schema is not ready; no request-time repair was attempted.'],
    });
  }

  const entryExists = await tableExists(db, 'accounting_journal_entries');
  const lineExists = await tableExists(db, 'accounting_journal_lines');
  const entryCols = entryExists ? await tableColumns(db, 'accounting_journal_entries') : new Set();
  const lineCols = lineExists ? await tableColumns(db, 'accounting_journal_lines') : new Set();

  const entryId = entryCols.has('journal_entry_id') ? 'journal_entry_id' : entryCols.has('accounting_journal_entry_id') ? 'accounting_journal_entry_id' : '';
  const lineId = lineCols.has('journal_line_id') ? 'journal_line_id' : lineCols.has('accounting_journal_line_id') ? 'accounting_journal_line_id' : '';
  const lineEntryId = lineCols.has('journal_entry_id') ? 'journal_entry_id' : lineCols.has('accounting_journal_entry_id') ? 'accounting_journal_entry_id' : '';
  const entryDateCol = entryCols.has('entry_date') ? 'entry_date' : entryCols.has('created_at') ? 'created_at' : '';
  const journalReady = Boolean(entryExists && lineExists && entryId && lineId && lineEntryId && entryDateCol && lineCols.has('ledger_code') && lineCols.has('debit_cents') && lineCols.has('credit_cents'));

  let sourceUsed = 'fallback';
  let sourceRows = [];
  let unmapped = [];

  if (journalReady) {
    const result = await db.prepare(`
      SELECT
        COALESCE(NULLIF(g.gifi_section,''), CASE WHEN LOWER(COALESCE(g.category,'')) IN ('income','expense') THEN 'income_statement' ELSE 'balance_sheet' END) AS gifi_section,
        COALESCE(NULLIF(g.gifi_code,''), '') AS gifi_code,
        COALESCE(NULLIF(g.gifi_label,''), '') AS gifi_label,
        COALESCE(l.ledger_code, '') AS ledger_code,
        COALESCE(l.ledger_name, g.name, '') AS ledger_name,
        COALESCE(SUM(COALESCE(l.debit_cents,0)),0) AS debit_cents,
        COALESCE(SUM(COALESCE(l.credit_cents,0)),0) AS credit_cents,
        COALESCE(SUM(COALESCE(l.debit_cents,0) - COALESCE(l.credit_cents,0)),0) AS net_cents,
        COUNT(DISTINCT e.${entryId}) AS source_count,
        COALESCE(g.tax_deductibility_percent, 100) AS tax_deductibility_percent
      FROM accounting_journal_entries e
      INNER JOIN accounting_journal_lines l ON l.${lineEntryId} = e.${entryId}
      LEFT JOIN general_ledger_accounts g ON g.code = l.ledger_code
      WHERE substr(COALESCE(e.${entryDateCol}, datetime('now')), 1, 10) >= ?
        AND substr(COALESCE(e.${entryDateCol}, datetime('now')), 1, 10) < ?
      GROUP BY gifi_section, gifi_code, gifi_label, ledger_code, ledger_name, tax_deductibility_percent
      ORDER BY gifi_section ASC, gifi_code ASC, ledger_code ASC
    `).bind(range.start, range.end).all().catch(() => ({ results: [] }));
    sourceRows = rows(result);
    unmapped = sourceRows.filter((row) => !text(row.gifi_code)).map((row) => ({
      ledger_code: row.ledger_code || '',
      ledger_name: row.ledger_name || '',
      net_cents: asInt(row.net_cents),
      source_count: Number(row.source_count || 0),
    })).sort((a, b) => Math.abs(b.net_cents) - Math.abs(a.net_cents));
    sourceUsed = 'journal';
  } else {
    sourceRows = await buildFallbackSummary(db, range);
    unmapped = sourceRows.filter((row) => !text(row.gifi_code)).map((row) => ({
      ledger_code: row.ledger_codes || '',
      ledger_name: row.gifi_label || 'Unmapped ledger activity',
      net_cents: asInt(row.net_cents),
      source_count: Number(row.source_count || 0),
    }));
  }

  const grouped = new Map();
  for (const row of sourceRows) {
    const key = [row.gifi_section || '', row.gifi_code || '', row.gifi_label || ''].join('|');
    const current = grouped.get(key) || {
      gifi_section: row.gifi_section || '',
      gifi_code: row.gifi_code || '',
      gifi_label: row.gifi_label || '',
      ledger_codes: new Set(),
      debit_cents: 0,
      credit_cents: 0,
      net_cents: 0,
      deductible_cents: 0,
      source_count: 0,
    };
    const net = asInt(row.net_cents);
    current.debit_cents += asInt(row.debit_cents);
    current.credit_cents += asInt(row.credit_cents);
    current.net_cents += net;
    current.deductible_cents += Math.round(net * (Math.max(0, Math.min(100, Number(row.tax_deductibility_percent == null ? 100 : row.tax_deductibility_percent))) / 100));
    current.source_count += Number(row.source_count || 0);
    String(row.ledger_code || row.ledger_codes || '').split(',').map((part) => text(part)).filter(Boolean).forEach((code) => current.ledger_codes.add(code));
    grouped.set(key, current);
  }

  const summaryRows = [...grouped.values()].map((row) => ({
    gifi_section: row.gifi_section,
    gifi_code: row.gifi_code,
    gifi_label: row.gifi_label,
    ledger_codes: [...row.ledger_codes].join(', '),
    debit_cents: row.debit_cents,
    credit_cents: row.credit_cents,
    net_cents: row.net_cents,
    deductible_cents: row.deductible_cents,
    source_count: row.source_count,
  })).sort((a, b) => String(a.gifi_section || '').localeCompare(String(b.gifi_section || '')) || String(a.gifi_code || 'ZZZZ').localeCompare(String(b.gifi_code || 'ZZZZ')) || String(a.ledger_codes || '').localeCompare(String(b.ledger_codes || '')));

  const mappedCount = summaryRows.filter((row) => text(row.gifi_code)).length;
  const totalCount = summaryRows.length;
  const unmappedCount = unmapped.length;
  const glReviewResult = await db.prepare(`
    SELECT gifi_review_state, COUNT(*) AS line_count,
           SUM(CASE WHEN COALESCE(gifi_code,'') = '' THEN 1 ELSE 0 END) AS unmapped_count
    FROM general_ledger_accounts
    WHERE COALESCE(is_active,1) = 1
    GROUP BY gifi_review_state
    ORDER BY gifi_review_state ASC
  `).all().catch(() => ({ results: [] }));
  const glReviewRows = rows(glReviewResult);

  return payload({
    year: range.year,
    schema_ready: true,
    missing_tables: [],
    missing_columns: [],
    source_used: sourceUsed,
    summary: {
      mapped_line_count: mappedCount,
      total_line_count: totalCount,
      unmapped_line_count: unmappedCount,
      readiness_percent: totalCount ? Math.round((mappedCount / totalCount) * 100) : 0,
    },
    gl_review_summary: {
      active_account_count: glReviewRows.reduce((sum, row) => sum + Number(row.line_count || 0), 0),
      reviewed_account_count: glReviewRows.filter((row) => ['reviewed', 'finalized'].includes(String(row.gifi_review_state || ''))).reduce((sum, row) => sum + Number(row.line_count || 0), 0),
      finalized_account_count: glReviewRows.filter((row) => String(row.gifi_review_state || '') === 'finalized').reduce((sum, row) => sum + Number(row.line_count || 0), 0),
      active_unmapped_account_count: glReviewRows.reduce((sum, row) => sum + Number(row.unmapped_count || 0), 0),
      review_states: glReviewRows.map((row) => ({ review_state: row.gifi_review_state || 'draft', line_count: Number(row.line_count || 0), unmapped_count: Number(row.unmapped_count || 0) })),
    },
    gifi_rows: summaryRows,
    unmapped_accounts: unmapped,
    notes: [
      'This is a staging summary for accountant review, not a filed T2 return.',
      sourceUsed === 'journal'
        ? 'Rows are grouped from accounting_journal_lines joined to general_ledger_accounts GIFI fields.'
        : 'Journal tables were incomplete or unavailable, so this summary fell back to orders, expenses, and write-offs.',
    ],
  });
}
