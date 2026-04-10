import { getAdminUserFromRequest, getDb, jsonResponse } from "../_lib/adminAudit.js";

function csvCell(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",

]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(rows) {
  if (!Array.isArray(rows) || !rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(csvCell).join(","),
    ...rows.map((row) => headers.map((key) => csvCell(row[key])).join(",")),
  ];
  return lines.join("
");
}

function monthRange(monthValue) {
  const raw = String(monthValue || "").trim();
  const match = /^(\d{4})-(\d{2})$/.exec(raw);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!year || month < 1 || month > 12) return null;

  const start = `${match[1]}-${match[2]}-01`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const end = `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-01`;

  return { raw, start, end };
}

function normalizeResults(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function tableExists(db, tableName) {
  try {
    const row = await db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1`)
      .bind(tableName)
      .first();
    return !!row;
  } catch {
    return false;
  }
}

async function safeQuery(db, sql, bindings = []) {
  try {
    const result = await db.prepare(sql).bind(...bindings).all();
    return normalizeResults(result);
  } catch {
    return [];
  }
}

async function loadOrders(db, range) {
  if (await tableExists(db, "accounting_order_records")) {
    return safeQuery(
      db,
      `
        SELECT
          'accounting_order' AS row_type,
          substr(COALESCE(last_synced_at, updated_at, created_at, datetime('now')), 1, 7) AS period_month,
          accounting_order_record_id AS reference_id,
          COALESCE(order_number, CAST(order_id AS TEXT)) AS reference_code,
          COALESCE(customer_email, '') AS party,
          COALESCE(entry_status, '') AS status,
          ROUND(COALESCE(revenue_cents, 0) / 100.0, 2) AS amount,
          ROUND(COALESCE(tax_liability_cents, 0) / 100.0, 2) AS tax_amount,
          '' AS ledger_code,
          '' AS ledger_name,
          COALESCE(notes, '') AS notes
        FROM accounting_order_records
        WHERE substr(COALESCE(last_synced_at, updated_at, created_at, datetime('now')), 1, 10) >= ?
          AND substr(COALESCE(last_synced_at, updated_at, created_at, datetime('now')), 1, 10) < ?
        ORDER BY COALESCE(last_synced_at, updated_at, created_at, datetime('now')) DESC
      `,
      [range.start, range.end]
    );
  }

  const hasOrders = await tableExists(db, "orders");
  if (!hasOrders) return [];

  return safeQuery(
    db,
    `
      SELECT
        'order' AS row_type,
        substr(COALESCE(created_at, datetime('now')), 1, 7) AS period_month,
        order_id AS reference_id,
        COALESCE(order_number, CAST(order_id AS TEXT)) AS reference_code,
        COALESCE(customer_email, '') AS party,
        TRIM(COALESCE(order_status, '') || CASE WHEN COALESCE(payment_status, '') <> '' THEN ' / ' || payment_status ELSE '' END) AS status,
        ROUND(COALESCE(total_cents, 0) / 100.0, 2) AS amount,
        ROUND(COALESCE(tax_cents, 0) / 100.0, 2) AS tax_amount,
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

async function loadExpenses(db, range) {
  const hasExpenses = await tableExists(db, "accounting_expenses");
  if (!hasExpenses) return [];

  return safeQuery(
    db,
    `
      SELECT
        'expense' AS row_type,
        substr(COALESCE(expense_date, created_at, datetime('now')), 1, 7) AS period_month,
        expense_id AS reference_id,
        COALESCE(CAST(expense_id AS TEXT), '') AS reference_code,
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
      ORDER BY COALESCE(expense_date, created_at, datetime('now')) DESC
    `,
    [range.start, range.end]
  );
}

async function loadWriteoffs(db, range) {
  const hasWriteoffs = await tableExists(db, "accounting_writeoffs");
  if (!hasWriteoffs) return [];

  return safeQuery(
    db,
    `
      SELECT
        'writeoff' AS row_type,
        substr(COALESCE(writeoff_date, created_at, datetime('now')), 1, 7) AS period_month,
        writeoff_id AS reference_id,
        COALESCE(CAST(writeoff_id AS TEXT), '') AS reference_code,
        COALESCE(item_name, reason_code, '') AS party,
        COALESCE(reason_code, '') AS status,
        ROUND(COALESCE(amount, 0), 2) AS amount,
        0 AS tax_amount,
        'WRITEOFF' AS ledger_code,
        'Write-Offs' AS ledger_name,
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
  const db = getDb(context.env);
  if (!db) {
    return jsonResponse({ ok: false, error: "Database binding is not configured." }, 500);
  }

  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) {
    return jsonResponse({ ok: false, error: "Admin access required." }, 401);
  }

  const url = new URL(context.request.url);
  const range = monthRange(url.searchParams.get("month"));
  if (!range) {
    return jsonResponse({ ok: false, error: "Please provide month in YYYY-MM format." }, 400);
  }

  const [orders, expenses, writeoffs] = await Promise.all([
    loadOrders(db, range),
    loadExpenses(db, range),
    loadWriteoffs(db, range),
  ]);

  const rows = [...orders, ...expenses, ...writeoffs];

  const csv = toCsv(
    rows.length
      ? rows
      : [
          {
            row_type: "empty",
            period_month: range.raw,
            reference_id: "",
            reference_code: "",
            party: "",
            status: "",
            amount: 0,
            tax_amount: 0,
            ledger_code: "",
            ledger_name: "",
            notes: "",
          },
        ]
  );

  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="accounting-monthly-summary-${range.raw}.csv"`,
      "cache-control": "no-store",
    },
  });
}
