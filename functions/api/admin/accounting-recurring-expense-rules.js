import { auditAdminAction, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';
import { assertAccountingPeriodOpen, monthFromDateish } from './_accountingPeriods.js';
import { ensureAccountingVendorsTable, getAccountingVendorById } from './_accountingVendors.js';

function rows(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function cleanFrequency(value) {
  const raw = normalizeText(value).toLowerCase();
  return ['monthly', 'quarterly', 'yearly', 'manual'].includes(raw) ? raw : 'monthly';
}

function cleanAutoCreateMode(value) {
  const raw = normalizeText(value).toLowerCase();
  return ['manual', 'draft_expense'].includes(raw) ? raw : 'manual';
}

function isoDate(value, fallback = '') {
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }
  if (fallback && /^\d{4}-\d{2}-\d{2}$/.test(String(fallback))) return String(fallback);
  return new Date().toISOString().slice(0, 10);
}

function addMonths(dateText, count) {
  const [y, m, d] = isoDate(dateText).split('-').map((part) => Number(part || 0));
  const next = new Date(Date.UTC(y, Math.max(0, m - 1) + count, d || 1));
  return next.toISOString().slice(0, 10);
}

function nextDueDate(dateText, frequency) {
  const base = isoDate(dateText);
  if (frequency === 'quarterly') return addMonths(base, 3);
  if (frequency === 'yearly') return addMonths(base, 12);
  if (frequency === 'manual') return base;
  return addMonths(base, 1);
}

async function getTableColumnSet(db, tableName) {
  try {
    const result = await db.prepare(`PRAGMA table_info(${tableName})`).all();
    return new Set(rows(result).map((row) => String(row?.name || '').trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

async function ensureExpenseTableExtensions(db) {
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
    ['vendor_id', `ALTER TABLE accounting_expenses ADD COLUMN vendor_id INTEGER`],
    ['recurring_expense_rule_id', `ALTER TABLE accounting_expenses ADD COLUMN recurring_expense_rule_id INTEGER`],
    ['source_mode', `ALTER TABLE accounting_expenses ADD COLUMN source_mode TEXT`],
    ['reference_number', `ALTER TABLE accounting_expenses ADD COLUMN reference_number TEXT`],
  ];
  for (const [name, sql] of additions) {
    if (!cols.has(name)) {
      try { await db.prepare(sql).run(); } catch {}
    }
  }
}

async function ensureRecurringRulesTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS accounting_recurring_expense_rules (
      recurring_expense_rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id INTEGER,
      vendor_name TEXT,
      rule_name TEXT NOT NULL,
      ledger_code TEXT,
      ledger_name TEXT,
      amount REAL NOT NULL DEFAULT 0,
      tax_amount REAL NOT NULL DEFAULT 0,
      frequency TEXT NOT NULL DEFAULT 'monthly',
      due_day INTEGER,
      next_due_date TEXT,
      auto_create_mode TEXT NOT NULL DEFAULT 'manual',
      notes TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      last_generated_at TEXT,
      last_generated_expense_id INTEGER,
      created_by_user_id INTEGER,
      updated_by_user_id INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  try { await db.prepare(`CREATE INDEX IF NOT EXISTS idx_accounting_recurring_expense_rules_due ON accounting_recurring_expense_rules(is_active, next_due_date, frequency)`).run(); } catch {}
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

async function generateExpenseFromRule(db, adminUser, rule, explicitDate) {
  await ensureExpenseTableExtensions(db);
  const expenseDate = isoDate(explicitDate || rule.next_due_date || new Date().toISOString().slice(0, 10));
  await assertAccountingPeriodOpen(db, monthFromDateish(expenseDate), `Recurring expense ${rule.rule_name}`);
  const ledgerName = rule.ledger_name || await lookupLedgerName(db, rule.ledger_code || '');
  const insert = await db.prepare(`
    INSERT INTO accounting_expenses (
      expense_date, vendor_id, vendor_name, amount, tax_amount,
      ledger_code, ledger_name, recurring_expense_rule_id, source_mode,
      reference_number, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    expenseDate,
    rule.vendor_id || null,
    rule.vendor_name || null,
    Number(rule.amount || 0),
    Number(rule.tax_amount || 0),
    rule.ledger_code || null,
    ledgerName || null,
    Number(rule.recurring_expense_rule_id || 0),
    'recurring_rule',
    `${expenseDate}:${rule.recurring_expense_rule_id}`,
    rule.notes || null,
  ).run();

  const expenseId = Number(insert?.meta?.last_row_id || 0);
  const nextDate = nextDueDate(expenseDate, cleanFrequency(rule.frequency));

  await db.prepare(`
    UPDATE accounting_recurring_expense_rules
    SET ledger_name = ?, last_generated_at = CURRENT_TIMESTAMP,
        last_generated_expense_id = ?, next_due_date = ?, updated_by_user_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE recurring_expense_rule_id = ?
  `).bind(ledgerName || null, expenseId || null, nextDate, Number(adminUser.user_id || 0), Number(rule.recurring_expense_rule_id || 0)).run();

  return { expense_id: expenseId, expense_date: expenseDate, next_due_date: nextDate, ledger_name: ledgerName || '' };
}

function mapRule(row) {
  return {
    recurring_expense_rule_id: Number(row.recurring_expense_rule_id || 0),
    vendor_id: row.vendor_id == null ? null : Number(row.vendor_id || 0),
    vendor_name: row.vendor_name || '',
    rule_name: row.rule_name || '',
    ledger_code: row.ledger_code || '',
    ledger_name: row.ledger_name || '',
    amount: Number(row.amount || 0),
    tax_amount: Number(row.tax_amount || 0),
    frequency: cleanFrequency(row.frequency),
    due_day: row.due_day == null ? null : Number(row.due_day || 0),
    next_due_date: row.next_due_date || null,
    auto_create_mode: cleanAutoCreateMode(row.auto_create_mode),
    notes: row.notes || '',
    is_active: Number(row.is_active || 0) === 1 ? 1 : 0,
    last_generated_at: row.last_generated_at || null,
    last_generated_expense_id: row.last_generated_expense_id == null ? null : Number(row.last_generated_expense_id || 0),
    created_by_user_id: row.created_by_user_id == null ? null : Number(row.created_by_user_id || 0),
    updated_by_user_id: row.updated_by_user_id == null ? null : Number(row.updated_by_user_id || 0),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

export async function onRequestGet(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureAccountingVendorsTable(db);
  await ensureRecurringRulesTable(db);

  const url = new URL(context.request.url);
  const includeInactive = url.searchParams.get('include_inactive') === '1';
  const today = new Date().toISOString().slice(0, 10);
  const result = await db.prepare(`
    SELECT recurring_expense_rule_id, vendor_id, vendor_name, rule_name, ledger_code, ledger_name,
           amount, tax_amount, frequency, due_day, next_due_date, auto_create_mode,
           notes, is_active, last_generated_at, last_generated_expense_id,
           created_by_user_id, updated_by_user_id, created_at, updated_at
    FROM accounting_recurring_expense_rules
    ORDER BY is_active DESC, COALESCE(next_due_date, '9999-12-31') ASC, rule_name ASC
  `).all().catch(() => ({ results: [] }));

  const rules = rows(result).map(mapRule).filter((row) => includeInactive || row.is_active === 1);
  const dueRules = rules.filter((row) => row.is_active === 1 && row.next_due_date && row.next_due_date <= today);
  return jsonResponse({
    ok: true,
    rules,
    summary: {
      rule_count: rules.length,
      active_rule_count: rules.filter((row) => row.is_active === 1).length,
      due_rule_count: dueRules.length,
      monthly_rule_count: rules.filter((row) => row.frequency === 'monthly').length,
    },
    due_rules: dueRules,
  });
}

export async function onRequestPost(context) {
  const adminUser = await getAdminUserFromRequest(context.request, context.env);
  if (!adminUser) return jsonResponse({ ok: false, error: 'Admin access required.' }, 401);
  const db = getDb(context.env);
  if (!db) return jsonResponse({ ok: false, error: 'Database binding is not configured.' }, 500);
  await ensureAccountingVendorsTable(db);
  await ensureRecurringRulesTable(db);
  await ensureExpenseTableExtensions(db);

  let body = {};
  try { body = await context.request.json(); } catch { return jsonResponse({ ok: false, error: 'Invalid JSON body.' }, 400); }

  const action = normalizeText(body.action).toLowerCase();
  if (action === 'generate_due') {
    const ruleId = Number(body.recurring_expense_rule_id || 0);
    if (!ruleId) return jsonResponse({ ok: false, error: 'recurring_expense_rule_id is required.' }, 400);
    const row = await db.prepare(`
      SELECT recurring_expense_rule_id, vendor_id, vendor_name, rule_name, ledger_code, ledger_name,
             amount, tax_amount, frequency, next_due_date, auto_create_mode, notes, is_active
      FROM accounting_recurring_expense_rules
      WHERE recurring_expense_rule_id = ?
      LIMIT 1
    `).bind(ruleId).first().catch(() => null);
    if (!row) return jsonResponse({ ok: false, error: 'Recurring expense rule not found.' }, 404);
    if (Number(row.is_active || 0) !== 1) return jsonResponse({ ok: false, error: 'Recurring expense rule is inactive.' }, 400);
    const generated = await generateExpenseFromRule(db, adminUser, row, body.expense_date);
    await auditAdminAction(context.env, context.request, adminUser, {
      action_type: 'generate_recurring_expense',
      target_type: 'accounting_recurring_expense_rule',
      target_id: ruleId,
      details: { recurring_expense_rule_id: ruleId, generated },
    });
    return jsonResponse({ ok: true, generated });
  }

  const recurring_expense_rule_id = Number(body.recurring_expense_rule_id || 0);
  const vendor_id = Number(body.vendor_id || 0) || null;
  const vendor = vendor_id ? await getAccountingVendorById(db, vendor_id) : null;
  const vendor_name = normalizeText(body.vendor_name) || vendor?.vendor_name || '';
  const rule_name = normalizeText(body.rule_name);
  const ledger_code = normalizeText(body.ledger_code || vendor?.default_ledger_code).toUpperCase();
  const ledger_name = normalizeText(body.ledger_name) || await lookupLedgerName(db, ledger_code);
  const amount = Number(body.amount || 0);
  const tax_amount = Number(body.tax_amount == null || body.tax_amount === '' ? vendor?.default_tax_percent ? Number(amount || 0) * (Number(vendor.default_tax_percent || 0) / 100) : 0 : body.tax_amount || 0);
  const frequency = cleanFrequency(body.frequency);
  const due_day = body.due_day == null || body.due_day === '' ? null : Math.max(1, Math.min(31, Number(body.due_day || 1)));
  const next_due_date = isoDate(body.next_due_date || new Date().toISOString().slice(0, 10));
  const auto_create_mode = cleanAutoCreateMode(body.auto_create_mode);
  const notes = normalizeText(body.notes);
  const is_active = Number(body.is_active == null || body.is_active === '' ? 1 : body.is_active) === 0 ? 0 : 1;

  if (!rule_name) return jsonResponse({ ok: false, error: 'rule_name is required.' }, 400);
  if (!vendor_name) return jsonResponse({ ok: false, error: 'vendor_name or vendor_id is required.' }, 400);
  if (!Number.isFinite(amount)) return jsonResponse({ ok: false, error: 'amount must be a number.' }, 400);

  if (recurring_expense_rule_id) {
    await db.prepare(`
      UPDATE accounting_recurring_expense_rules
      SET vendor_id = ?, vendor_name = ?, rule_name = ?, ledger_code = ?, ledger_name = ?,
          amount = ?, tax_amount = ?, frequency = ?, due_day = ?, next_due_date = ?, auto_create_mode = ?,
          notes = ?, is_active = ?, updated_by_user_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE recurring_expense_rule_id = ?
    `).bind(
      vendor_id, vendor_name, rule_name, ledger_code || null, ledger_name || null,
      amount, Number.isFinite(tax_amount) ? tax_amount : 0, frequency, due_day, next_due_date,
      auto_create_mode, notes || null, is_active, Number(adminUser.user_id || 0), recurring_expense_rule_id
    ).run();
  } else {
    await db.prepare(`
      INSERT INTO accounting_recurring_expense_rules (
        vendor_id, vendor_name, rule_name, ledger_code, ledger_name,
        amount, tax_amount, frequency, due_day, next_due_date, auto_create_mode,
        notes, is_active, created_by_user_id, updated_by_user_id, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      vendor_id, vendor_name, rule_name, ledger_code || null, ledger_name || null,
      amount, Number.isFinite(tax_amount) ? tax_amount : 0, frequency, due_day, next_due_date,
      auto_create_mode, notes || null, is_active, Number(adminUser.user_id || 0), Number(adminUser.user_id || 0)
    ).run();
  }

  await auditAdminAction(context.env, context.request, adminUser, {
    action_type: 'save_recurring_expense_rule',
    target_type: 'accounting_recurring_expense_rule',
    target_id: recurring_expense_rule_id || null,
    target_key: rule_name,
    details: { vendor_id, vendor_name, rule_name, ledger_code, amount, tax_amount, frequency, next_due_date, auto_create_mode, is_active },
  });

  return jsonResponse({ ok: true, recurring_expense_rule_id: recurring_expense_rule_id || null, rule_name, next_due_date });
}
