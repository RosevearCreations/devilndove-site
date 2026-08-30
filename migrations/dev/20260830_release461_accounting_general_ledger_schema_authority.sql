-- Release 461 — Accounting General Ledger schema authority
-- Development-only forward/additive migration.
-- Runtime/admin traffic must not create, alter, repair, index, or implicitly seed this table.
-- Existing stale table shapes must be surfaced by read-only preflight and repaired
-- only by a deliberate future forward migration. No historical replay.
-- Starter GIFI mappings remain an explicit audited admin business action and are not seeded here.

PRAGMA foreign_keys = ON;

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
  gifi_review_state TEXT NOT NULL DEFAULT 'draft',
  gifi_review_note TEXT,
  gifi_reviewed_by_user_id INTEGER,
  gifi_reviewed_at TEXT,
  tax_deductibility_percent INTEGER NOT NULL DEFAULT 100,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_general_ledger_accounts_category_sort
  ON general_ledger_accounts(category, sort_order, code);
CREATE INDEX IF NOT EXISTS idx_general_ledger_accounts_gifi
  ON general_ledger_accounts(gifi_section, gifi_code, code);
CREATE INDEX IF NOT EXISTS idx_general_ledger_accounts_review_state
  ON general_ledger_accounts(gifi_review_state, is_active, code);

PRAGMA foreign_key_check;
