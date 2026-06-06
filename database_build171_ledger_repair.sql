-- Devil n Dove build 172 hotfix
-- Purpose: repair the build 171 migration-ledger marker after the D1 console error:
-- NOT NULL constraint failed: schema_migration_ledger.file_name
--
-- Use this repair if the build 171 schema additions already executed but the final
-- schema_migration_ledger insert failed. Do not rerun the full upgrade file just to
-- fix the marker, because already-added ALTER TABLE columns can fail if repeated.

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  checksum TEXT,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','skipped','failed','pending_review')),
  destructive INTEGER NOT NULL DEFAULT 0,
  applied_by_user_id INTEGER,
  applied_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_schema_migration_ledger_status
  ON schema_migration_ledger(status, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_schema_migration_ledger_file
  ON schema_migration_ledger(file_name);

INSERT OR IGNORE INTO schema_migration_ledger (
  migration_key,
  file_name,
  status,
  destructive,
  applied_at,
  notes,
  created_at,
  updated_at
) VALUES (
  'build_171_admin_safety_release_readiness',
  'database_upgrade_current_pass.sql',
  'pending_review',
  0,
  CURRENT_TIMESTAMP,
  'Build 172 repair: recorded build 171 admin safety/release readiness migration after file_name was missing from the original marker insert.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
