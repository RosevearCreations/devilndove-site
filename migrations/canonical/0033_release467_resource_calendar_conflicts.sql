-- Release 467 Build 381: operator-confirmed UTC resource calendar and deadline ledger.
-- Overlap guards are inside SQLite triggers, so concurrent users cannot double-book without an auditable override.
CREATE TABLE IF NOT EXISTS creative_resource_calendar_entries (
  creative_resource_calendar_entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_site_item_inventory_id INTEGER REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE RESTRICT,
  creative_work_project_id INTEGER REFERENCES creative_work_projects(creative_work_project_id) ON DELETE RESTRICT,
  creative_project_operation_id INTEGER REFERENCES creative_project_operations(creative_project_operation_id) ON DELETE RESTRICT,
  entry_kind TEXT NOT NULL CHECK(entry_kind IN ('project_booking','maintenance','resource_hold','project_deadline')),
  title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 3 AND 160),
  starts_at_utc TEXT NOT NULL,
  ends_at_utc TEXT NOT NULL,
  entry_status TEXT NOT NULL DEFAULT 'active' CHECK(entry_status IN ('active','cancelled')),
  override_conflict INTEGER NOT NULL DEFAULT 0 CHECK(override_conflict IN (0,1)),
  override_maintenance_ack INTEGER NOT NULL DEFAULT 0 CHECK(override_maintenance_ack IN (0,1)),
  override_reason TEXT,
  operator_note TEXT NOT NULL CHECK(length(trim(operator_note))>=12),
  cancelled_by_user_id INTEGER REFERENCES users(user_id) ON DELETE RESTRICT,
  cancelled_at TEXT,
  cancellation_reason TEXT,
  created_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
  request_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(starts_at_utc<ends_at_utc),
  CHECK(length(starts_at_utc)=20 AND length(ends_at_utc)=20),
  CHECK(strftime('%Y-%m-%dT%H:%M:%SZ',starts_at_utc)=starts_at_utc AND strftime('%Y-%m-%dT%H:%M:%SZ',ends_at_utc)=ends_at_utc),
  CHECK((entry_kind='project_booking' AND resource_site_item_inventory_id IS NOT NULL AND creative_work_project_id IS NOT NULL)
    OR (entry_kind IN ('maintenance','resource_hold') AND resource_site_item_inventory_id IS NOT NULL AND creative_work_project_id IS NULL AND creative_project_operation_id IS NULL)
    OR (entry_kind='project_deadline' AND resource_site_item_inventory_id IS NULL AND creative_work_project_id IS NOT NULL)),
  CHECK(creative_project_operation_id IS NULL OR creative_work_project_id IS NOT NULL),
  CHECK((entry_status='active' AND cancelled_by_user_id IS NULL AND cancelled_at IS NULL AND cancellation_reason IS NULL)
    OR (entry_status='cancelled' AND cancelled_by_user_id IS NOT NULL AND cancelled_at IS NOT NULL AND length(trim(cancellation_reason))>=12)),
  CHECK(override_conflict=0 OR length(trim(COALESCE(override_reason,'')))>=20),
  CHECK(override_maintenance_ack=0 OR override_conflict=1)
);
CREATE INDEX IF NOT EXISTS idx_calendar_resource_window ON creative_resource_calendar_entries(resource_site_item_inventory_id,entry_status,starts_at_utc,ends_at_utc);
CREATE INDEX IF NOT EXISTS idx_calendar_project_window ON creative_resource_calendar_entries(creative_work_project_id,starts_at_utc,ends_at_utc);
CREATE TRIGGER IF NOT EXISTS trg_calendar_valid_insert BEFORE INSERT ON creative_resource_calendar_entries BEGIN
 SELECT RAISE(ABORT,'calendar_resource_not_active_tool')
 WHERE NEW.resource_site_item_inventory_id IS NOT NULL AND NOT EXISTS
 (SELECT 1 FROM site_item_inventory i WHERE i.site_item_inventory_id=NEW.resource_site_item_inventory_id AND COALESCE(i.is_active,1)=1 AND LOWER(TRIM(COALESCE(i.source_type,'')))='tool');
 SELECT RAISE(ABORT,'calendar_project_not_active')
 WHERE NEW.creative_work_project_id IS NOT NULL AND NOT EXISTS
 (SELECT 1 FROM creative_work_projects p WHERE p.creative_work_project_id=NEW.creative_work_project_id AND COALESCE(p.project_status,'active')<>'archived');
 SELECT RAISE(ABORT,'calendar_operation_project_mismatch')
 WHERE NEW.creative_project_operation_id IS NOT NULL AND NOT EXISTS
 (SELECT 1 FROM creative_project_operations o WHERE o.creative_project_operation_id=NEW.creative_project_operation_id AND o.creative_work_project_id=NEW.creative_work_project_id AND o.plan_status<>'retired');
 SELECT RAISE(ABORT,'calendar_conflict_requires_override')
 WHERE NEW.resource_site_item_inventory_id IS NOT NULL AND NEW.override_conflict=0 AND EXISTS
 (SELECT 1 FROM creative_resource_calendar_entries e
 WHERE e.resource_site_item_inventory_id=NEW.resource_site_item_inventory_id AND e.entry_status='active'
 AND NEW.starts_at_utc<e.ends_at_utc AND e.starts_at_utc<NEW.ends_at_utc);
 SELECT RAISE(ABORT,'calendar_maintenance_override_requires_ack')
 WHERE NEW.resource_site_item_inventory_id IS NOT NULL AND NEW.override_maintenance_ack=0 AND EXISTS
 (SELECT 1 FROM creative_resource_calendar_entries e
 WHERE e.resource_site_item_inventory_id=NEW.resource_site_item_inventory_id AND e.entry_status='active'
 AND e.entry_kind='maintenance' AND NEW.starts_at_utc<e.ends_at_utc AND e.starts_at_utc<NEW.ends_at_utc);
END;
CREATE TRIGGER IF NOT EXISTS trg_calendar_immutable_update BEFORE UPDATE ON creative_resource_calendar_entries BEGIN
 SELECT RAISE(ABORT,'calendar_entry_immutable')
 WHERE OLD.entry_status<>'active' OR NEW.entry_status<>'cancelled'
 OR NEW.resource_site_item_inventory_id IS NOT OLD.resource_site_item_inventory_id
 OR NEW.creative_work_project_id IS NOT OLD.creative_work_project_id
 OR NEW.creative_project_operation_id IS NOT OLD.creative_project_operation_id
 OR NEW.entry_kind IS NOT OLD.entry_kind OR NEW.title IS NOT OLD.title
 OR NEW.starts_at_utc IS NOT OLD.starts_at_utc OR NEW.ends_at_utc IS NOT OLD.ends_at_utc
 OR NEW.override_conflict IS NOT OLD.override_conflict
 OR NEW.override_maintenance_ack IS NOT OLD.override_maintenance_ack
 OR NEW.override_reason IS NOT OLD.override_reason OR NEW.operator_note IS NOT OLD.operator_note
 OR NEW.created_by_user_id IS NOT OLD.created_by_user_id OR NEW.request_key IS NOT OLD.request_key
 OR NEW.created_at IS NOT OLD.created_at;
END;
CREATE TRIGGER IF NOT EXISTS trg_calendar_no_delete BEFORE DELETE ON creative_resource_calendar_entries BEGIN
 SELECT RAISE(ABORT,'calendar_history_cannot_be_deleted');
END;
SELECT COUNT(*) AS build381_calendar_schema FROM sqlite_master WHERE type='table' AND name='creative_resource_calendar_entries';
PRAGMA foreign_key_check;
