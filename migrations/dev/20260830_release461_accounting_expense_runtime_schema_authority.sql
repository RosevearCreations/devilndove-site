-- Release 461 — Accounting expense/vendor/recurring schema authority
-- Development-only forward/additive migration.
-- Runtime/admin traffic must not create, alter, repair, or index these tables.
-- Existing stale table shapes must be surfaced by read-only preflight and repaired
-- only by a deliberate future forward migration. No historical replay.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS accounting_vendors (
  accounting_vendor_id INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_name TEXT NOT NULL UNIQUE,
  default_ledger_code TEXT,
  default_tax_percent REAL NOT NULL DEFAULT 0,
  payment_terms TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website_url TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_accounting_vendors_active_name
  ON accounting_vendors(is_active, vendor_name);

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
);

CREATE INDEX IF NOT EXISTS idx_accounting_expenses_date
  ON accounting_expenses(expense_date, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_expenses_vendor
  ON accounting_expenses(vendor_id, vendor_name, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_expenses_recurring
  ON accounting_expenses(recurring_expense_rule_id, expense_date DESC);

CREATE TABLE IF NOT EXISTS accounting_writeoffs (
  writeoff_id INTEGER PRIMARY KEY AUTOINCREMENT,
  writeoff_date TEXT,
  item_name TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  reason_code TEXT NOT NULL DEFAULT 'other',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
);

CREATE INDEX IF NOT EXISTS idx_accounting_recurring_expense_rules_due
  ON accounting_recurring_expense_rules(is_active, next_due_date, frequency);

PRAGMA foreign_key_check;
