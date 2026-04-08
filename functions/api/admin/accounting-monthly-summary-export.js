import { getAdminUserFromRequest, getDb, jsonResponse } from "../_lib/adminAudit.js";

function csvCell(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",
]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [headers.map(csvCell).join(","), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join("
");
}

function monthRange(value) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  const start = `${match[1]}-${match[2]}-01`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const end = `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-01`;
  return { raw: match[0], start, end };
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function tableExists(db, tableName) {
  try {
    const row = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=? LIMIT 1`).bind(tableName).first();
    return !!row;
  } catch {
    return false;
  }
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: "Admin access required." }, 401);

  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: "Database binding is not configured." }, 500);

  const range = monthRange(new URL(context.request.url).searchParams.get("month"));
  if (!range) return jsonResponse({ ok: false, error: "Please provide month in YYYY-MM format." }, 400);

  const rows = [];

  if (await tableExists(db, "orders")) {
    const result = await db.prepare(`
      SELECT
        'order' AS row_type,
        substr(COALESCE(created_at, datetime('now')), 1, 7) AS period_month,
        COALESCE(order_number, CAST(order_id AS TEXT)) AS reference_code,
        COALESCE(customer_email, '') AS party,
        COALESCE(order_status, '') AS status,
        ROUND(COALESCE(total_cents, 0) / 100.0, 2) AS amount,
        ROUND(COALESCE(tax_cents, 0) / 100.0, 2) AS tax_amount,
        '' AS ledger_code,
        'Sales' AS ledger_name,
        COALESCE(notes, '') AS notes
      FROM orders
      WHERE substr(COALESCE(created_at, datetime('now')), 1, 10) >= ?
        AND substr(COALESCE(created_at, datetime('now')), 1, 10) < ?
      ORDER BY created_at DESC
    `).bind(range.start, range.end).all();
    rows.push(...normalizeResults(result));
  }

  if (await tableExists(db, "accounting_expenses")) {
    const result = await db.prepare(`
      SELECT
        'expense' AS row_type,
        substr(COALESCE(expense_date, created_at, datetime('now')), 1, 7) AS period_month,
        CAST(expense_id AS TEXT) AS reference_code,
        COALESCE(vendor_name, '') AS party,
        '' AS status,
        ROUND(COALESCE(amount, 0), 2) AS amount,
        ROUND(COALESCE(tax_amount, 0), 2) AS tax_amount,
        COALESCE(ledger_code, '') AS ledger_code,
        COALESCE(ledger_name, '') AS ledger_name,
        COALESCE(notes, '') AS notes
      FROM accounting_expenses
      WHERE substr(COALESCE(expense_date, created_at, datetime('now')), 1, 10) >= ?
        AND substr(COALESCE(expense_date, created_at, datetime('now')), 1, 10) < ?
      ORDER BY COALESCE(expense_date, created_at) DESC
    `).bind(range.start, range.end).all();
    rows.push(...normalizeResults(result));
  }

  if (await tableExists(db, "accounting_writeoffs")) {
    const result = await db.prepare(`
      SELECT
        'writeoff' AS row_type,
        substr(COALESCE(writeoff_date, created_at, datetime('now')), 1, 7) AS period_month,
        CAST(writeoff_id AS TEXT) AS reference_code,
        COALESCE(item_name, '') AS party,
        COALESCE(reason_code, '') AS status,
        ROUND(COALESCE(amount, 0), 2) AS amount,
        0 AS tax_amount,
        'WRITEOFF' AS ledger_code,
        'Write-Offs' AS ledger_name,
        COALESCE(notes, '') AS notes
      FROM accounting_writeoffs
      WHERE substr(COALESCE(writeoff_date, created_at, datetime('now')), 1, 10) >= ?
        AND substr(COALESCE(writeoff_date, created_at, datetime('now')), 1, 10) < ?
      ORDER BY COALESCE(writeoff_date, created_at) DESC
    `).bind(range.start, range.end).all();
    rows.push(...normalizeResults(result));
  }

  const csv = toCsv(rows.length ? rows : [{
    row_type: 'empty', period_month: range.raw, reference_code: '', party: '', status: '', amount: 0, tax_amount: 0, ledger_code: '', ledger_name: '', notes: ''
  }]);

  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="accounting-monthly-summary-${range.raw}.csv"`,
      'cache-control': 'no-store'
    }
  });
}
