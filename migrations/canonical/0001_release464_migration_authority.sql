-- Release 464 / Update 1 — canonical D1 migration authority bootstrap.
-- This is the first migration in the forward-only canonical migration stream.
-- Historical migrations under migrations/dev are provenance only and MUST NOT be replayed.
--
-- Recovery: forward-only. If this metadata table or index is damaged, restore the
-- D1 backup created by the migration apply process or recreate the identical objects
-- with a new numbered migration. Never edit this migration after it has been applied.

CREATE TABLE IF NOT EXISTS app_schema_migration_proofs (
  schema_migration_proof_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_name TEXT NOT NULL UNIQUE,
  migration_sha256 TEXT NOT NULL,
  manifest_sha256 TEXT NOT NULL,
  source_sha TEXT NOT NULL,
  environment TEXT NOT NULL CHECK(environment IN ('development','production')),
  recovery_note_sha256 TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verified_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_app_schema_migration_proofs_environment
  ON app_schema_migration_proofs(environment, applied_at DESC);

PRAGMA foreign_key_check;
