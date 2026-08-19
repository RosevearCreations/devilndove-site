-- Devil n Dove Build 274
-- Creative Process lifecycle clarity, auditable timeline corrections, and inventory-use undo/correction support.
-- Apply once after Build 269 on production D1. This migration is additive and does not delete project history.

PRAGMA foreign_keys = ON;

ALTER TABLE creative_work_events
  ADD COLUMN entry_status TEXT NOT NULL DEFAULT 'active'
  CHECK (entry_status IN ('active','voided'));

ALTER TABLE creative_work_events
  ADD COLUMN void_reason TEXT;

ALTER TABLE creative_work_events
  ADD COLUMN voided_by INTEGER;

ALTER TABLE creative_work_events
  ADD COLUMN voided_at TEXT;

CREATE INDEX IF NOT EXISTS idx_creative_work_events_project_status
  ON creative_work_events(creative_work_project_id, entry_status, occurred_at DESC, creative_work_event_id DESC);

INSERT INTO schema_migration_ledger (migration_key, file_name, applied_at, notes)
VALUES (
  'build274_creative_process_lifecycle_corrections',
  'database_build274_creative_process_lifecycle_corrections.sql',
  CURRENT_TIMESTAMP,
  'Adds auditable active/voided timeline-entry state so mistaken or corrected Creative Process inventory entries can be removed from active project calculations without deleting inventory/reversal history.'
)
ON CONFLICT(migration_key) DO UPDATE SET
  file_name=excluded.file_name,
  notes=excluded.notes;
