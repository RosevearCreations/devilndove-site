-- Devil n Dove Build 440 — Tool condition, service and inspection lifecycle authority.
-- Development-first, additive/idempotent. Inventory remains authoritative for Tool identity,
-- stock, do-not-reuse flags and reusable usage evidence. This adds lifecycle state/history only.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS site_tool_lifecycle_profiles (
  site_item_inventory_id INTEGER PRIMARY KEY,
  condition_status TEXT NOT NULL DEFAULT 'good'
    CHECK(condition_status IN ('good','needs_attention','out_of_service','retired')),
  service_interval_days INTEGER
    CHECK(service_interval_days IS NULL OR service_interval_days BETWEEN 1 AND 3650),
  last_service_at TEXT,
  next_service_due_at TEXT,
  last_inspected_at TEXT,
  profile_notes TEXT,
  version INTEGER NOT NULL DEFAULT 1 CHECK(version >= 1),
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE,
  FOREIGN KEY(updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_site_tool_lifecycle_condition_due
  ON site_tool_lifecycle_profiles(condition_status,next_service_due_at,site_item_inventory_id);

CREATE TABLE IF NOT EXISTS site_tool_lifecycle_events (
  site_tool_lifecycle_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_item_inventory_id INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type IN (
    'inspection','service','repair','condition_change','service_schedule','retired','reactivated'
  )),
  event_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  condition_before TEXT CHECK(condition_before IS NULL OR condition_before IN ('good','needs_attention','out_of_service','retired')),
  condition_after TEXT CHECK(condition_after IS NULL OR condition_after IN ('good','needs_attention','out_of_service','retired')),
  service_interval_days INTEGER CHECK(service_interval_days IS NULL OR service_interval_days BETWEEN 1 AND 3650),
  do_not_reuse_before INTEGER NOT NULL DEFAULT 0 CHECK(do_not_reuse_before IN (0,1)),
  do_not_reuse_after INTEGER NOT NULL DEFAULT 0 CHECK(do_not_reuse_after IN (0,1)),
  notes TEXT,
  actor_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE RESTRICT,
  FOREIGN KEY(actor_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_site_tool_lifecycle_events_item
  ON site_tool_lifecycle_events(site_item_inventory_id,event_at DESC,site_tool_lifecycle_event_id DESC);
CREATE INDEX IF NOT EXISTS idx_site_tool_lifecycle_events_type
  ON site_tool_lifecycle_events(event_type,event_at DESC,site_tool_lifecycle_event_id DESC);

INSERT INTO schema_migration_ledger(migration_key,file_name,applied_at,notes)
VALUES(
  'build_440_tool_lifecycle_history',
  'database_build440_tool_lifecycle_history.sql',
  CURRENT_TIMESTAMP,
  'Adds Tool lifecycle current-state profiles and immutable service/inspection/condition history. Existing Inventory remains authoritative for Tool identity, reusable usage and do-not-reuse enforcement.'
)
ON CONFLICT(migration_key) DO UPDATE SET
  file_name=excluded.file_name,
  notes=excluded.notes;
