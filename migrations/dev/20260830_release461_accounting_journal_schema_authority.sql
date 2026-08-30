-- Release 461 — Accounting journal schema authority
-- Development-only forward/additive migration.
-- Runtime/admin journal traffic must not create, alter, repair, or index schema.
-- Existing stale table shapes must be surfaced by read-only preflight and repaired
-- only by a deliberate future forward migration. No historical replay.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS accounting_journal_entries (
  journal_entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
  period_month TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_key TEXT NOT NULL,
  reference_code TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  total_debit_cents INTEGER NOT NULL DEFAULT 0,
  total_credit_cents INTEGER NOT NULL DEFAULT 0,
  imbalance_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  posted_by_user_id INTEGER,
  posted_at TEXT,
  validation_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (period_month, source_type, source_key)
);

CREATE TABLE IF NOT EXISTS accounting_journal_lines (
  journal_line_id INTEGER PRIMARY KEY AUTOINCREMENT,
  journal_entry_id INTEGER NOT NULL,
  line_number INTEGER NOT NULL,
  ledger_code TEXT,
  ledger_name TEXT,
  line_description TEXT,
  debit_cents INTEGER NOT NULL DEFAULT 0,
  credit_cents INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (journal_entry_id, line_number),
  FOREIGN KEY (journal_entry_id) REFERENCES accounting_journal_entries(journal_entry_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_accounting_journal_entries_period
  ON accounting_journal_entries(period_month, entry_date DESC, journal_entry_id DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_journal_entries_source
  ON accounting_journal_entries(source_type, source_key);
CREATE INDEX IF NOT EXISTS idx_accounting_journal_lines_entry
  ON accounting_journal_lines(journal_entry_id, line_number ASC);

PRAGMA foreign_key_check;
