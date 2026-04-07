// File: /functions/api/admin/accounting-expenses.js
// Brief description: Starter accounting backend endpoint for expense capture.

import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from "../_lib/adminAudit.js";

function json(data, status = 200) {
  return jsonResponse(data, status);
}

async function ensureTables(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS accounting_expenses (
      expense_id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_date TEXT NOT NULL,
      vendor TEXT,
      category TEXT,
      description TEXT,
      amount_cents INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'CAD',
      tax_cents INTEGER NOT NULL DEFAULT 0,
      receipt_url TEXT,
      notes TEXT,
      created_by_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
    )
  `).run();
  await db.prepare(`CREATE INDEX IF NOT EXISTS idx_accounting_expenses_date ON accounting_expenses(expense_date DESC, expense_id DESC)`).run();
}

function toCents(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
}

export async function onRequest(context) {
  const { request, env } = context;
  const db = getDb(env);
  await ensureTables(db);

  const adminUser = await getAdminUserFromRequest(env, request);
  if (!adminUser?.ok) return json({ ok: false, error: "Admin authentication required." }, 401);

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 50), 1), 200);

  if (request.method === 'GET') {
    const rows = await db.prepare(`
      SELECT expense_id, expense_date, vendor, category, description, amount_cents, currency, tax_cents, receipt_url, notes,
             created_by_user_id, created_at, updated_at
      FROM accounting_expenses
      ORDER BY expense_date DESC, expense_id DESC
      LIMIT ?
    `).bind(limit).all();

    return json({ ok: true, expenses: rows.results || [] });
  }

  if (request.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed.' }, 405);
  }

  let body = {};
  try { body = await request.json(); } catch { body = {}; }

  const expense_date = normalizeText(body.expense_date) || new Date().toISOString().slice(0,10);
  const vendor = normalizeText(body.vendor) || null;
  const category = normalizeText(body.category) || null;
  const description = normalizeText(body.description) || null;
  const currency = (normalizeText(body.currency) || 'CAD').toUpperCase();
  const amount_cents = Number.isInteger(body.amount_cents) ? Number(body.amount_cents) : toCents(body.amount);
  const tax_cents = Number.isInteger(body.tax_cents) ? Number(body.tax_cents) : toCents(body.tax);
  const receipt_url = normalizeText(body.receipt_url) || null;
  const notes = normalizeText(body.notes) || null;

  if (!expense_date) return json({ ok: false, error: 'expense_date is required.' }, 400);

  const insert = await db.prepare(`
    INSERT INTO accounting_expenses (
      expense_date, vendor, category, description, amount_cents, currency, tax_cents, receipt_url, notes, created_by_user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    expense_date, vendor, category, description,
    Math.max(0, Number(amount_cents || 0)), currency,
    Math.max(0, Number(tax_cents || 0)), receipt_url, notes,
    Number(adminUser.user_id || 0) || null
  ).run();

  await auditAdminAction(env, request, adminUser, {
    action_type: 'accounting_expense_created',
    action_summary: `Created accounting expense on ${expense_date} (${currency} ${(amount_cents||0)/100}).`,
    action_details: { expense_date, vendor, category, amount_cents, currency }
  });

  const row = await db.prepare(`
    SELECT expense_id, expense_date, vendor, category, description, amount_cents, currency, tax_cents, receipt_url, notes,
           created_by_user_id, created_at, updated_at
    FROM accounting_expenses
    WHERE expense_id = ?
    LIMIT 1
  `).bind(insert.meta.last_row_id).first();

  return json({ ok: true, expense: row });
}
