-- Release 467 Build 448: explicit shared Tool safety checks and owner-reviewed
-- cross-project booking conflicts. Inventory, lifecycle and calendar remain authoritative.
CREATE TABLE IF NOT EXISTS maker_tool_safety_checks (
 maker_tool_safety_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
 site_item_inventory_id INTEGER NOT NULL REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE RESTRICT,
 creative_work_project_id INTEGER REFERENCES creative_work_projects(creative_work_project_id) ON DELETE RESTRICT,
 maker_traveler_run_step_id INTEGER REFERENCES maker_traveler_run_steps(maker_traveler_run_step_id) ON DELETE RESTRICT,
 check_kind TEXT NOT NULL CHECK(check_kind IN ('guards_and_ppe','condition_inspection','calibration','maintenance_release','location_verification')),
 result TEXT NOT NULL CHECK(result IN ('passed','failed','held')),
 check_note TEXT NOT NULL CHECK(length(trim(check_note))>=12),
 evidence_reference TEXT,
 reviewed_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 request_key TEXT NOT NULL UNIQUE,
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_maker_tool_safety_tool ON maker_tool_safety_checks(site_item_inventory_id,maker_tool_safety_check_id DESC);
CREATE TABLE IF NOT EXISTS maker_tool_booking_decisions (
 maker_tool_booking_decision_id INTEGER PRIMARY KEY AUTOINCREMENT,
 site_item_inventory_id INTEGER NOT NULL REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE RESTRICT,
 creative_work_project_id INTEGER NOT NULL REFERENCES creative_work_projects(creative_work_project_id) ON DELETE RESTRICT,
 conflicting_calendar_entry_id INTEGER NOT NULL REFERENCES creative_resource_calendar_entries(creative_resource_calendar_entry_id) ON DELETE RESTRICT,
 calendar_request_key TEXT NOT NULL,
 starts_at_utc TEXT NOT NULL,
 ends_at_utc TEXT NOT NULL,
 decision TEXT NOT NULL CHECK(decision IN ('approved_overlap','declined')),
 decision_note TEXT NOT NULL CHECK(length(trim(decision_note))>=20),
 reviewed_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 request_key TEXT NOT NULL UNIQUE,
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(calendar_request_key,conflicting_calendar_entry_id),
 CHECK(length(calendar_request_key) BETWEEN 16 AND 80),
 CHECK(length(starts_at_utc)=20 AND length(ends_at_utc)=20 AND starts_at_utc<ends_at_utc),
 CHECK(strftime('%Y-%m-%dT%H:%M:%SZ',starts_at_utc)=starts_at_utc AND strftime('%Y-%m-%dT%H:%M:%SZ',ends_at_utc)=ends_at_utc)
);
CREATE INDEX IF NOT EXISTS idx_maker_tool_booking_decision_request ON maker_tool_booking_decisions(calendar_request_key,site_item_inventory_id,creative_work_project_id);

CREATE TRIGGER IF NOT EXISTS trg_maker_tool_safety_source BEFORE INSERT ON maker_tool_safety_checks BEGIN
 SELECT RAISE(ABORT,'tool_not_active_inventory') WHERE NOT EXISTS(
  SELECT 1 FROM site_item_inventory i WHERE i.site_item_inventory_id=NEW.site_item_inventory_id
  AND COALESCE(i.is_active,1)=1 AND lower(trim(COALESCE(i.source_type,'')))='tool');
 SELECT RAISE(ABORT,'safety_check_step_wrong_project_or_tool') WHERE NEW.maker_traveler_run_step_id IS NOT NULL AND NOT EXISTS(
  SELECT 1 FROM maker_traveler_run_steps s JOIN maker_traveler_runs r ON r.maker_traveler_run_id=s.maker_traveler_run_id,
   json_each(s.resource_snapshot_json) j
  WHERE s.maker_traveler_run_step_id=NEW.maker_traveler_run_step_id
   AND r.creative_work_project_id=NEW.creative_work_project_id
   AND CAST(json_extract(j.value,'$.site_item_inventory_id') AS INTEGER)=NEW.site_item_inventory_id
   AND lower(COALESCE(json_extract(j.value,'$.source_type'),''))='tool');
 SELECT RAISE(ABORT,'cannot_pass_blocked_equipment') WHERE NEW.result='passed' AND (
  EXISTS(SELECT 1 FROM site_item_inventory i WHERE i.site_item_inventory_id=NEW.site_item_inventory_id AND COALESCE(i.do_not_reuse,0)=1)
  OR EXISTS(SELECT 1 FROM inventory_tool_lifecycle_profiles p WHERE p.site_item_inventory_id=NEW.site_item_inventory_id
   AND (p.lifecycle_status NOT IN ('active') OR p.condition_status IN ('unsafe','damaged','service_due')
    OR (p.next_service_at IS NOT NULL AND date(p.next_service_at)<date('now')))));
END;
CREATE TRIGGER IF NOT EXISTS trg_maker_tool_decision_source BEFORE INSERT ON maker_tool_booking_decisions BEGIN
 SELECT RAISE(ABORT,'tool_not_active_inventory') WHERE NOT EXISTS(
  SELECT 1 FROM site_item_inventory i WHERE i.site_item_inventory_id=NEW.site_item_inventory_id
  AND COALESCE(i.is_active,1)=1 AND lower(trim(COALESCE(i.source_type,'')))='tool');
 SELECT RAISE(ABORT,'project_not_active') WHERE NOT EXISTS(
  SELECT 1 FROM creative_work_projects p WHERE p.creative_work_project_id=NEW.creative_work_project_id
  AND COALESCE(p.project_status,'active')<>'archived');
 SELECT RAISE(ABORT,'conflict_not_current_or_wrong_tool') WHERE NOT EXISTS(
  SELECT 1 FROM creative_resource_calendar_entries e
  WHERE e.creative_resource_calendar_entry_id=NEW.conflicting_calendar_entry_id
   AND e.entry_status='active' AND e.resource_site_item_inventory_id=NEW.site_item_inventory_id
   AND NEW.starts_at_utc<e.ends_at_utc AND e.starts_at_utc<NEW.ends_at_utc);
 SELECT RAISE(ABORT,'maintenance_or_hold_cannot_be_overridden') WHERE NEW.decision='approved_overlap' AND EXISTS(
  SELECT 1 FROM creative_resource_calendar_entries e WHERE e.creative_resource_calendar_entry_id=NEW.conflicting_calendar_entry_id
   AND e.entry_kind IN ('maintenance','resource_hold'));
END;

-- Keep the existing resource calendar as the sole schedule authority. These
-- AFTER-0033 guards apply to future writes and do not reinterpret old entries.
CREATE TRIGGER IF NOT EXISTS trg_maker_tool_booking_safety BEFORE INSERT ON creative_resource_calendar_entries
WHEN NEW.entry_kind='project_booking' BEGIN
 SELECT RAISE(ABORT,'tool_out_of_service_or_unsafe') WHERE
  EXISTS(SELECT 1 FROM site_item_inventory i WHERE i.site_item_inventory_id=NEW.resource_site_item_inventory_id
   AND COALESCE(i.do_not_reuse,0)=1)
  OR EXISTS(SELECT 1 FROM inventory_tool_lifecycle_profiles p WHERE p.site_item_inventory_id=NEW.resource_site_item_inventory_id
   AND (p.lifecycle_status NOT IN ('active') OR p.condition_status IN ('unsafe','damaged','service_due')
    OR (p.next_service_at IS NOT NULL AND date(p.next_service_at)<date('now'))));
 SELECT RAISE(ABORT,'maintenance_or_resource_hold_blocks_booking') WHERE EXISTS(
  SELECT 1 FROM creative_resource_calendar_entries e
   WHERE e.resource_site_item_inventory_id=NEW.resource_site_item_inventory_id AND e.entry_status='active'
    AND e.entry_kind IN ('maintenance','resource_hold')
    AND NEW.starts_at_utc<e.ends_at_utc AND e.starts_at_utc<NEW.ends_at_utc);
 SELECT RAISE(ABORT,'unreviewed_shared_tool_booking_conflict') WHERE EXISTS(
  SELECT 1 FROM creative_resource_calendar_entries e
   WHERE e.resource_site_item_inventory_id=NEW.resource_site_item_inventory_id AND e.entry_status='active'
    AND e.entry_kind='project_booking' AND NEW.starts_at_utc<e.ends_at_utc AND e.starts_at_utc<NEW.ends_at_utc
    AND NOT EXISTS(SELECT 1 FROM maker_tool_booking_decisions d
     WHERE d.conflicting_calendar_entry_id=e.creative_resource_calendar_entry_id
      AND d.site_item_inventory_id=NEW.resource_site_item_inventory_id
      AND d.creative_work_project_id=NEW.creative_work_project_id
      AND d.starts_at_utc=NEW.starts_at_utc AND d.ends_at_utc=NEW.ends_at_utc
      AND d.calendar_request_key=NEW.request_key AND d.decision='approved_overlap'));
END;

CREATE TRIGGER IF NOT EXISTS trg_maker_tool_safety_immutable_update BEFORE UPDATE ON maker_tool_safety_checks BEGIN SELECT RAISE(ABORT,'maker_tool_safety_history_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_tool_safety_immutable_delete BEFORE DELETE ON maker_tool_safety_checks BEGIN SELECT RAISE(ABORT,'maker_tool_safety_history_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_tool_decision_immutable_update BEFORE UPDATE ON maker_tool_booking_decisions BEGIN SELECT RAISE(ABORT,'maker_tool_conflict_history_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_tool_decision_immutable_delete BEFORE DELETE ON maker_tool_booking_decisions BEGIN SELECT RAISE(ABORT,'maker_tool_conflict_history_immutable'); END;
PRAGMA foreign_key_check;
