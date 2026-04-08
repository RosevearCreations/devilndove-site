import { json, requireAdmin } from '../../_lib/http.js';

function csvCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(rows) {
  if (!Array.isArray(rows) || !rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(csvCell).join(','),
    ...rows.map((row) => headers.map((key) => csvCell(row[key])).join(',')),
  ];
  return lines.join('\n');
}

async function tableExists(db, tableName) {
  try {
    const result = await db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1`
      )
      .bind(tableName)
      .first();
    return !!result;
  } catch {
    return false;
  }
}

async function safeAll(db, sql, bindings = []) {
  try {
    const stmt = db.prepare(sql).bind(...bindings);
    const result = await stmt.all();
    return Array.isArray(result?.results) ? result.results : [];
  } catch {
    return [];
  }
}

function monthRange(monthValue) {
  const raw = String(monthValue || '').trim();
  const match = /^(\d{4})-(\d{2})$/.exec(raw);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!year || month < 1 || month > 12) return null;

  const start = `${match[1]}-${match[2]}-01`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const end = `${String(nextYear).padStart(4, '0')}-${String(nextMonth).padStart(2, '0')}-01`;

  return { raw, start, end };
}

async function loadOrderSummary(env, range) {
  if (!env?.DB) return [];

  const hasOrders = await tableExists(env.DB, 'orders');
  if (!hasOrders) return [];

  return safeAll(
    env.DB,
    `
      SELECT
        'order' AS row_type,
        substr(COALESCE(created_at, datetime('now')), 1, 7) AS period_month,
        id AS reference_id,
        COALESCE(order_number, CAST(id AS TEXT)) AS reference_code,
        COALESCE(customer_email, '') AS party,
        COALESCE(status, '') AS status,
        ROUND(COALESCE(total_amount, total, 0), 2) AS amount,
        ROUND(COALESCE(tax_amount, tax_total, 0), 2) AS tax_amount,
        '' AS ledger_code,
        '' AS ledger_name,
        COALESCE(notes, '') AS notes
      FROM orders
      WHERE substr(COALESCE(created_at, datetime('now')), 1, 10) >= ?
        AND substr(COALESCE(created_at, datetime('now')), 1, 10) < ?
      ORDER BY COALESCE(created_at, datetime('now')) DESC
    `,
    [range.start, range.end]
  );
}

async function loadExpenseSummary(env, range) {
  if (!env?.DB) return [];

  const hasExpenses = await tableExists(env.DB, 'accounting_expenses');
  if (!hasExpenses) return [];

  return safeAll(
    env.DB,
    `
      SELECT
        'expense' AS row_type,
        substr(COALESCE(expense_date, created_at, datetime('now')), 1, 7) AS period_month,
        id AS reference_id,
        COALESCE(reference_number, CAST(id AS TEXT)) AS reference_code,
        COALESCE(vendor_name, payee_name, '') AS party,
        COALESCE(status, '') AS status,
        ROUND(COALESCE(amount, 0), 2) AS amount,
        ROUND(COALESCE(tax_amount, 0), 2) AS tax_amount,
        COALESCE(ledger_code, '') AS ledger_code,
        COALESCE(ledger_name, '') AS ledger_name,
        COALESCE(notes, '') AS notes
      FROM accounting_expenses
      WHERE substr(COALESCE(expense_date, created_at, datetime('now')), 1, 10) >= ?
        AND substr(COALESCE(expense_date, created_at, datetime('now')), 1, 10) < ?
      ORDER BY COALESCE(expense_date, created_at, datetime('now')) DESC
    `,
    [range.start, range.end]
  );
}

async function loadWriteoffSummary(env, range) {
  if (!env?.DB) return [];

  const hasWriteoffs = await tableExists(env.DB, 'accounting_writeoffs');
  if (!hasWriteoffs) return [];

  return safeAll(
    env.DB,
    `
      SELECT
        'writeoff' AS row_type,
        substr(COALESCE(writeoff_date, created_at, datetime('now')), 1, 7) AS period_month,
        id AS reference_id,
        COALESCE(reference_number, CAST(id AS TEXT)) AS reference_code,
        COALESCE(item_name, product_name, reason_code, '') AS party,
        COALESCE(status, '') AS status,
        ROUND(COALESCE(total_amount, amount, 0), 2) AS amount,
        ROUND(COALESCE(tax_amount, 0), 2) AS tax_amount,
        COALESCE(ledger_code, '') AS ledger_code,
        COALESCE(ledger_name, '') AS ledger_name,
        COALESCE(notes, '') AS notes
      FROM accounting_writeoffs
      WHERE substr(COALESCE(writeoff_date, created_at, datetime('now')), 1, 10) >= ?
        AND substr(COALESCE(writeoff_date, created_at, datetime('now')), 1, 10) < ?
      ORDER BY COALESCE(writeoff_date, created_at, datetime('now')) DESC
    `,
    [range.start, range.end]
  );
}

export async function onRequestGet(context) {
  const adminCheck = await requireAdmin(context);
  if (adminCheck) return adminCheck;

  const url = new URL(context.request.url);
  const range = monthRange(url.searchParams.get('month'));
  if (!range) {
    return json(
      { ok: false, error: 'Please provide month in YYYY-MM format.' },
      { status: 400 }
    );
  }

  const [orders, expenses, writeoffs] = await Promise.all([
    loadOrderSummary(context.env, range),
    loadExpenseSummary(context.env, range),
    loadWriteoffSummary(context.env, range),
  ]);

  const rows = [...orders, ...expenses, ...writeoffs];

  const csv = toCsv(
    rows.length
      ? rows
      : [
          {
            row_type: 'empty',
            period_month: range.raw,
            reference_id: '',
            reference_code: '',
            party: '',
            status: '',
            amount: 0,
            tax_amount: 0,
            ledger_code: '',
            ledger_name: '',
            notes: '',
          },
        ]
  );

  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="accounting-monthly-summary-${range.raw}.csv"`,
      'cache-control': 'no-store',
    },
  });
}
