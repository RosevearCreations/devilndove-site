import { getAdminUserFromRequest, getDb, jsonResponse } from '../_lib/adminAudit.js';

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function csvEscape(value) {
  const text = String(value == null ? '' : value);
  if (/["\n,]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function yearRange(yearValue) {
  const raw = String(yearValue || '').trim();
  if (!/^\d{4}$/.test(raw)) return null;
  return { year: raw, start: `${raw}-01-01`, end: `${Number(raw) + 1}-01-01` };
}

async function tableExists(db, tableName) {
  try {
    const row = await db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`)
      .bind(tableName)
      .first();
    return !!row;
  } catch {
    return false;
  }
}

async function getTableColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    const rows = Array.isArray(result?.results) ? result.results : [];
    return new Set(rows.map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function ensureGlSchema(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS general_ledger_accounts (
      gl_account_id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'expense',
      parent_group TEXT,
      normal_balance TEXT NOT NULL DEFAULT 'debit',
      sort_order INTEGER NOT NULL DEFAULT 0,
      gifi_code TEXT,
      gifi_label TEXT,
      gifi_section TEXT,
      tax_deductibility_percent INTEGER NOT NULL DEFAULT 100,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const cols = await getTableColumnSet(db, 'general_ledger_accounts');
  const missing = [
    ['parent_group', `ALTER TABLE general_ledger_accounts ADD COLUMN parent_group TEXT`],
    ['normal_balance', `ALTER TABLE general_ledger_accounts ADD COLUMN normal_balance TEXT NOT NULL DEFAULT 'debit'`],
    ['sort_order', `ALTER TABLE general_ledger_accounts ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0`],
    ['gifi_code', `ALTER TABLE general_ledger_accounts ADD COLUMN gifi_code TEXT`],
    ['gifi_label', `ALTER TABLE general_ledger_accounts ADD COLUMN gifi_label TEXT`],
    ['gifi_section', `ALTER TABLE general_ledger_accounts ADD COLUMN gifi_section TEXT`],
    ['tax_deductibility_percent', `ALTER TABLE general_ledger_accounts ADD COLUMN tax_deductibility_percent INTEGER NOT NULL DEFAULT 100`],
  ];

  for (const [col, sql] of missing) {
    if (!cols.has(col)) {
      try {
        await db.prepare(sql).run();
      } catch {}
    }
  }
}

function asInt(value) {
  return Math.round(Number(value || 0));
}

async function buildFallbackSummary(db, range) {
  const hasExpenses = await tableExists(db, 'accounting_expenses');
  const hasWriteoffs = await tableExists(db, 'accounting_writeoffs');
  const hasOrders = await tableExists(db, 'orders');
  const rows = [];

  if (hasExpenses) {
    const expenseRows = normalizeResults(
      await db.prepare(`
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
      `).bind(range.start, range.end).all()
    );
    rows.push(...expenseRows.map((row) => ({ ...row, source_type: 'expenses' })));
  }

  if (hasWriteoffs) {
    const writeoffRows = normalizeResults(
      await db.prepare(`
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
      `).bind(range.start, range.end).all()
    );
    rows.push(
      ...writeoffRows
        .map((row) => ({ ...row, source_type: 'writeoffs' }))
        .filter((row) => asInt(row.net_cents) !== 0)
    );
  }

  if (hasOrders) {
    const orderRows = normalizeResults(
      await db.prepare(`
        SELECT
          '4000' AS ledger_code,
          COALESCE(NULLIF(g.name,''), 'Sales Revenue') AS ledger_name,
          COALESCE(NULLIF(g.gifi_code,''), '') AS gifi_code,
          COALESCE(NULLIF(g.gifi_label,''), '') AS gifi_label,
          COALESCE(NULLIF(g.gifi_section,''), 'income_statement') AS gifi_section,
          COALESCE(g.tax_deductibility_percent, 100) AS tax_deductibility_percent,
          COALESCE(SUM(CAST(ROUND(COALESCE(o.total_amount, o.total, 0) * 100.0) AS INTEGER)),0) AS net_cents,
          COUNT(*) AS source_count
        FROM orders o
        LEFT JOIN general_ledger_accounts g ON g.code = '4000'
        WHERE substr(COALESCE(o.created_at, datetime('now')), 1, 10) >= ?
          AND substr(COALESCE(o.created_at, datetime('now')), 1, 10) < ?
          AND LOWER(COALESCE(o.status,'')) IN ('paid','fulfilled')
      `).bind(range.start, range.end).all()
    );
    rows.push(
      ...orderRows
        .map((row) => ({ ...row, source_type: 'orders' }))
        .filter((row) => asInt(row.net_cents) !== 0)
    );
  }

  const grouped = new Map();

  for (const row of rows) {
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
    current.deductible_cents += Math.round(
      net * (Math.max(0, Math.min(100, Number(row.tax_deductibility_percent == null ? 100 : row.tax_deductibility_percent))) / 100)
    );
    current.source_count += Number(row.source_count || 0);
    current.source_types.add(String(row.source_type || 'fallback'));
    grouped.set(key, current);
  }

  return [...grouped.values()]
    .map((row) => ({
      gifi_section: row.gifi_section,
      gifi_code: row.gifi_code,
      gifi_label: row.gifi_label,
      ledger_codes: [...row.ledger_codes].filter(Boolean).join(', '),
      net_cents: row.net_cents,
      deductible_cents: row.deductible_cents,
      source_count: row.source_count,
      source_types: [...row.source_types].join(', '),
    }))
    .sort(
      (a, b) =>
        String(a.gifi_code || 'ZZZZ').localeCompare(String(b.gifi_code || 'ZZZZ')) ||
        String(a.ledger_codes || '').localeCompare(String(b.ledger_codes || ''))
    );
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);

  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);

  await ensureGlSchema(db);

  const url = new URL(context.request.url);
  const range = yearRange(url.searchParams.get('year') || String(new Date().getFullYear()));
  if (!range) return jsonResponse({ ok: false, error: 'Please provide year in YYYY format.' }, 400);

  const entryTableExists = await tableExists(db, 'accounting_journal_entries');
  const lineTableExists = await tableExists(db, 'accounting_journal_lines');
  const entryCols = entryTableExists ? await getTableColumnSet(db, 'accounting_journal_entries') : new Set();
  const lineCols = lineTableExists ? await getTableColumnSet(db, 'accounting_journal_lines') : new Set();

  const entryId = entryCols.has('journal_entry_id')
    ? 'journal_entry_id'
    : (entryCols.has('accounting_journal_entry_id') ? 'accounting_journal_entry_id' : '');

  const lineId = lineCols.has('journal_line_id')
    ? 'journal_line_id'
    : (lineCols.has('accounting_journal_line_id') ? 'accounting_journal_line_id' : '');

  const lineEntryId = lineCols.has('journal_entry_id')
    ? 'journal_entry_id'
    : (lineCols.has('accounting_journal_entry_id') ? 'accounting_journal_entry_id' : '');

  const entryDateCol = entryCols.has('entry_date') ? 'entry_date' : 'created_at';

  let sourceUsed = 'fallback';
  let rows = [];
  let unmapped = [];

  if (entryTableExists && lineTableExists && entryId && lineId && lineEntryId) {
    rows = normalizeResults(
      await db.prepare(`
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
        WHERE substr(COALESCE(e.${entryDateCol}, e.created_at, datetime('now')), 1, 10) >= ?
          AND substr(COALESCE(e.${entryDateCol}, e.created_at, datetime('now')), 1, 10) < ?
        GROUP BY gifi_section, gifi_code, gifi_label, ledger_code, ledger_name, tax_deductibility_percent
        ORDER BY gifi_section ASC, gifi_code ASC, ledger_code ASC
      `).bind(range.start, range.end).all()
    );

    unmapped = rows
      .filter((row) => !String(row.gifi_code || '').trim())
      .map((row) => ({
        ledger_code: row.ledger_code || '',
        ledger_name: row.ledger_name || '',
        net_cents: asInt(row.net_cents),
        source_count: Number(row.source_count || 0),
      }))
      .sort((a, b) => Math.abs(b.net_cents) - Math.abs(a.net_cents));

    sourceUsed = 'journal';
  } else {
    rows = await buildFallbackSummary(db, range);
    unmapped = rows
      .filter((row) => !String(row.gifi_code || '').trim())
      .map((row) => ({
        ledger_code: row.ledger_codes || '',
        ledger_name: row.gifi_label || 'Unmapped ledger activity',
        net_cents: asInt(row.net_cents),
        source_count: Number(row.source_count || 0),
      }));
  }

  const grouped = new Map();

  for (const row of rows) {
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
    current.deductible_cents += Math.round(
      net * (Math.max(0, Math.min(100, Number(row.tax_deductibility_percent == null ? 100 : row.tax_deductibility_percent))) / 100)
    );
    current.source_count += Number(row.source_count || 0);

    String(row.ledger_code || row.ledger_codes || '')
      .split(',')
      .map((part) => String(part).trim())
      .filter(Boolean)
      .forEach((code) => current.ledger_codes.add(code));

    grouped.set(key, current);
  }

  const summaryRows = [...grouped.values()]
    .map((row) => ({
      gifi_section: row.gifi_section,
      gifi_code: row.gifi_code,
      gifi_label: row.gifi_label,
      ledger_codes: [...row.ledger_codes].join(', '),
      debit_cents: row.debit_cents,
      credit_cents: row.credit_cents,
      net_cents: row.net_cents,
      deductible_cents: row.deductible_cents,
      source_count: row.source_count,
    }))
    .sort(
      (a, b) =>
        String(a.gifi_section || '').localeCompare(String(b.gifi_section || '')) ||
        String(a.gifi_code || 'ZZZZ').localeCompare(String(b.gifi_code || 'ZZZZ')) ||
        String(a.ledger_codes || '').localeCompare(String(b.ledger_codes || ''))
    );

  const mappedCount = summaryRows.filter((row) => String(row.gifi_code || '').trim()).length;
  const totalCount = summaryRows.length;
  const unmappedCount = unmapped.length;
  const readinessPercent = totalCount ? Math.round((mappedCount / totalCount) * 100) : 0;

  if ((url.searchParams.get('format') || '').toLowerCase() === 'csv') {
    const lines = [
      'gifi_section,gifi_code,gifi_label,ledger_codes,debit_cents,credit_cents,net_cents,deductible_cents,source_count',
    ];

    for (const row of summaryRows) {
      lines.push(
        [
          row.gifi_section,
          row.gifi_code,
          row.gifi_label,
          row.ledger_codes,
          row.debit_cents,
          row.credit_cents,
          row.net_cents,
          row.deductible_cents,
          row.source_count,
        ].map(csvEscape).join(',')
      );
    }

    return new Response(lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="devilndove-gifi-staging-${range.year}.csv"`,
      },
    });
  }

  return jsonResponse({
    ok: true,
    year: range.year,
    source_used: sourceUsed,
    summary: {
      mapped_line_count: mappedCount,
      total_line_count: totalCount,
      unmapped_line_count: unmappedCount,
      readiness_percent: readinessPercent,
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
