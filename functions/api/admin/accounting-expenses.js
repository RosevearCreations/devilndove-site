// File: /functions/api/admin/accounting-expenses.js
import { getAdminUserFromRequest, getDb, jsonResponse, auditAdminAction, normalizeText } from "../_lib/adminAudit.js";
import { assertAccountingPeriodOpen, monthFromDateish } from './_accountingPeriods.js';
import { ensureAccountingVendorsTable, getAccountingVendorById } from './_accountingVendors.js';
import { ensureAccountingAttachmentsTable } from './_accountingAttachments.js';

function nr(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

async function getTableColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(nr(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

function colExpr(cols, name) {
  return cols.has(name) ? name : `NULL AS ${name}`;
}

async function ensureTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS accounting_expenses (
      expense_id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_date TEXT,
      vendor_id INTEGER,
      vendor_name TEXT,
      amount REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      ledger_code TEXT,
      ledger_name TEXT,
      recurring_expense_rule_id INTEGER,
      source_mode TEXT,
      reference_number TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const cols = await getTableColumnSet(db, 'accounting_expenses');
  const additions = [
    ['expense_date', `ALTER TABLE accounting_expenses ADD COLUMN expense_date TEXT`],
    ['vendor_id', `ALTER TABLE accounting_expenses ADD COLUMN vendor_id INTEGER`],
    ['vendor_name', `ALTER TABLE accounting_expenses ADD COLUMN vendor_name TEXT`],
    ['amount', `ALTER TABLE accounting_expenses ADD COLUMN amount REAL NOT NULL DEFAULT 0`],
    ['tax_amount', `ALTER TABLE accounting_expenses ADD COLUMN tax_amount REAL NOT NULL DEFAULT 0`],
    ['ledger_code', `ALTER TABLE accounting_expenses ADD COLUMN ledger_code TEXT`],
    ['ledger_name', `ALTER TABLE accounting_expenses ADD COLUMN ledger_name TEXT`],
    ['recurring_expense_rule_id', `ALTER TABLE accounting_expenses ADD COLUMN recurring_expense_rule_id INTEGER`],
    ['source_mode', `ALTER TABLE accounting_expenses ADD COLUMN source_mode TEXT`],
    ['reference_number', `ALTER TABLE accounting_expenses ADD COLUMN reference_number TEXT`],
    ['notes', `ALTER TABLE accounting_expenses ADD COLUMN notes TEXT`],
    ['created_at', `ALTER TABLE accounting_expenses ADD COLUMN created_at TEXT`],
    ['updated_at', `ALTER TABLE accounting_expenses ADD COLUMN updated_at TEXT`]
  ];

  for (const [name, sql] of additions) {
    if (!cols.has(name)) {
      await db.prepare(sql).run().catch(() => null);
    }
  }

  try { await db.prepare(`CREATE INDEX IF NOT EXISTS idx_accounting_expenses_date ON accounting_expenses(expense_date, created_at DESC)`).run(); } catch {}
  try { await db.prepare(`CREATE INDEX IF NOT EXISTS idx_accounting_expenses_vendor ON accounting_expenses(vendor_id, vendor_name, expense_date DESC)`).run(); } catch {}
  try { await db.prepare(`CREATE INDEX IF NOT EXISTS idx_accounting_expenses_recurring ON accounting_expenses(recurring_expense_rule_id, expense_date DESC)`).run(); } catch {}

  return getTableColumnSet(db, 'accounting_expenses');
}

async function lookupLedgerName(db, code) {
  if (!code) return '';
  try {
    const row = await db.prepare(`SELECT name FROM general_ledger_accounts WHERE code = ? LIMIT 1`).bind(code).first();
    return row?.name || '';
  } catch {
    return '';
  }
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: "Admin access required." }, 401);

  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: "Database binding is not configured." }, 500);

  try {
    await ensureAccountingVendorsTable(db);
    await ensureAccountingAttachmentsTable(db);
    const cols = await ensureTable(db);
    const attachmentExists = await db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='accounting_attachments' LIMIT 1`).first().catch(() => null);
    const attachmentJoin = attachmentExists ? `LEFT JOIN (SELECT expense_id, COUNT(*) AS attachment_count FROM accounting_attachments GROUP BY expense_id) aa ON aa.expense_id = accounting_expenses.expense_id` : '';
    const attachmentSelect = attachmentExists ? `COALESCE(aa.attachment_count,0) AS attachment_count,` : `0 AS attachment_count,`;
    const result = await db.prepare(`
      SELECT
        ${colExpr(cols, 'expense_id')},
        ${colExpr(cols, 'expense_date')},
        ${colExpr(cols, 'vendor_id')},
        ${colExpr(cols, 'vendor_name')},
        ${colExpr(cols, 'amount')},
        ${colExpr(cols, 'tax_amount')},
        ${colExpr(cols, 'ledger_code')},
        ${colExpr(cols, 'ledger_name')},
        ${colExpr(cols, 'recurring_expense_rule_id')},
        ${colExpr(cols, 'source_mode')},
        ${colExpr(cols, 'reference_number')},
        ${colExpr(cols, 'notes')},
        ${attachmentSelect}
        ${colExpr(cols, 'created_at')},
        ${colExpr(cols, 'updated_at')}
      FROM accounting_expenses
      ${attachmentJoin}
      ORDER BY COALESCE(expense_date, created_at, '1970-01-01') DESC, COALESCE(expense_id, 0) DESC
    `).all();

    return jsonResponse({ ok: true, expenses: nr(result) });
  } catch (error) {
    return jsonResponse({ ok: false, error: error?.message || 'Failed to load expenses.' }, 500);
  }
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: "Admin access required." }, 401);

  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: "Database binding is not configured." }, 500);

  let body = {};
  try { body = await context.request.json(); } catch {}

  await ensureAccountingVendorsTable(db);
  const expense_date = normalizeText(body.expense_date);
  const vendor_id = Number(body.vendor_id || 0) || null;
  const vendor = vendor_id ? await getAccountingVendorById(db, vendor_id) : null;
  const vendor_name = normalizeText(body.vendor_name) || vendor?.vendor_name || '';
  const amount = Number(body.amount || 0);
  const tax_amount = Number(body.tax_amount == null || body.tax_amount === '' ? (vendor ? Number(amount || 0) * (Number(vendor.default_tax_percent || 0) / 100) : 0) : body.tax_amount || 0);
  const ledger_code = normalizeText(body.ledger_code || vendor?.default_ledger_code).toUpperCase();
  const ledger_name = normalizeText(body.ledger_name);
  const recurring_expense_rule_id = Number(body.recurring_expense_rule_id || 0) || null;
  const source_mode = normalizeText(body.source_mode) || (recurring_expense_rule_id ? 'recurring_rule' : 'manual');
  const reference_number = normalizeText(body.reference_number);
  const notes = normalizeText(body.notes);

  if (!vendor_name || !Number.isFinite(amount)) {
    return jsonResponse({ ok: false, error: "Vendor and amount are required." }, 400);
  }

  try {
    const cols = await ensureTable(db);
    await assertAccountingPeriodOpen(db, monthFromDateish(expense_date || new Date().toISOString().slice(0, 10)), 'Accounting expenses');
    const resolvedLedgerName = ledger_name || await lookupLedgerName(db, ledger_code);
    const insertCols = [];
    const insertVals = [];
    const binds = [];

    if (cols.has('expense_date')) { insertCols.push('expense_date'); insertVals.push('?'); binds.push(expense_date || null); }
    if (cols.has('vendor_id')) { insertCols.push('vendor_id'); insertVals.push('?'); binds.push(vendor_id); }
    if (cols.has('vendor_name')) { insertCols.push('vendor_name'); insertVals.push('?'); binds.push(vendor_name); }
    if (cols.has('amount')) { insertCols.push('amount'); insertVals.push('?'); binds.push(amount); }
    if (cols.has('tax_amount')) { insertCols.push('tax_amount'); insertVals.push('?'); binds.push(Number.isFinite(tax_amount) ? tax_amount : 0); }
    if (cols.has('ledger_code')) { insertCols.push('ledger_code'); insertVals.push('?'); binds.push(ledger_code || null); }
    if (cols.has('ledger_name')) { insertCols.push('ledger_name'); insertVals.push('?'); binds.push(resolvedLedgerName || null); }
    if (cols.has('recurring_expense_rule_id')) { insertCols.push('recurring_expense_rule_id'); insertVals.push('?'); binds.push(recurring_expense_rule_id); }
    if (cols.has('source_mode')) { insertCols.push('source_mode'); insertVals.push('?'); binds.push(source_mode || null); }
    if (cols.has('reference_number')) { insertCols.push('reference_number'); insertVals.push('?'); binds.push(reference_number || null); }
    if (cols.has('notes')) { insertCols.push('notes'); insertVals.push('?'); binds.push(notes || null); }
    if (cols.has('created_at')) { insertCols.push('created_at'); insertVals.push('CURRENT_TIMESTAMP'); }
    if (cols.has('updated_at')) { insertCols.push('updated_at'); insertVals.push('CURRENT_TIMESTAMP'); }

    await db.prepare(`INSERT INTO accounting_expenses (${insertCols.join(', ')}) VALUES (${insertVals.join(', ')})`).bind(...binds).run();

    await auditAdminAction(context.env, context.request, adminUser, {
      action_type: "create_expense",
      target_type: "accounting_expense",
      details: { expense_date, vendor_id, vendor_name, amount, tax_amount, ledger_code, recurring_expense_rule_id, source_mode, reference_number }
    });

    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ ok: false, error: error?.message || 'Failed to save expense.' }, 500);
  }
}
