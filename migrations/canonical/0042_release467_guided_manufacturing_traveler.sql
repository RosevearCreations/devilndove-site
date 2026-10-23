-- Release 467 Build 446: resumable human-owned execution of immutable reviewed traveler snapshots.
-- Source plans, Work Order actual time, Creative evidence, Inventory and publication remain authoritative.
CREATE TABLE IF NOT EXISTS maker_traveler_runs (
 maker_traveler_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
 creative_project_job_traveler_id INTEGER NOT NULL REFERENCES creative_project_job_travelers(creative_project_job_traveler_id) ON DELETE RESTRICT,
 creative_work_project_id INTEGER NOT NULL REFERENCES creative_work_projects(creative_work_project_id) ON DELETE RESTRICT,
 snapshot_sha256 TEXT NOT NULL CHECK(length(snapshot_sha256)=64),
 started_by_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 run_note TEXT NOT NULL CHECK(length(trim(run_note))>=12),
 request_key TEXT NOT NULL UNIQUE,
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(creative_project_job_traveler_id)
);
CREATE TABLE IF NOT EXISTS maker_traveler_run_steps (
 maker_traveler_run_step_id INTEGER PRIMARY KEY AUTOINCREMENT,
 maker_traveler_run_id INTEGER NOT NULL REFERENCES maker_traveler_runs(maker_traveler_run_id) ON DELETE RESTRICT,
 creative_project_operation_id INTEGER NOT NULL REFERENCES creative_project_operations(creative_project_operation_id) ON DELETE RESTRICT,
 operation_order INTEGER NOT NULL CHECK(operation_order>0),
 title_snapshot TEXT NOT NULL,
 workstation_snapshot TEXT,
 setup_snapshot TEXT,
 evidence_requirement_snapshot TEXT,
 planned_minutes_snapshot INTEGER CHECK(planned_minutes_snapshot IS NULL OR planned_minutes_snapshot>=0),
 resource_snapshot_json TEXT NOT NULL CHECK(json_valid(resource_snapshot_json)),
 UNIQUE(maker_traveler_run_id,creative_project_operation_id),
 UNIQUE(maker_traveler_run_id,operation_order)
);
CREATE TABLE IF NOT EXISTS maker_traveler_step_events (
 maker_traveler_step_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
 maker_traveler_run_step_id INTEGER NOT NULL REFERENCES maker_traveler_run_steps(maker_traveler_run_step_id) ON DELETE RESTRICT,
 event_kind TEXT NOT NULL CHECK(event_kind IN ('start','pause','resume','hold','complete','check','checkpoint','equipment','substitution','evidence_link','time_link')),
 event_note TEXT NOT NULL CHECK(length(trim(event_note))>=12),
 checkpoint_due_at TEXT,
 equipment_state TEXT CHECK(equipment_state IS NULL OR equipment_state IN ('available','unavailable','maintenance','substituted')),
 substitute_site_item_inventory_id INTEGER REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE RESTRICT,
 creative_work_event_id INTEGER REFERENCES creative_work_events(creative_work_event_id) ON DELETE RESTRICT,
 creative_work_order_event_id INTEGER UNIQUE REFERENCES creative_work_order_events(creative_work_order_event_id) ON DELETE RESTRICT,
 actor_user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
 request_key TEXT NOT NULL UNIQUE,
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK((event_kind='checkpoint')=(checkpoint_due_at IS NOT NULL)),
 CHECK((event_kind='equipment')=(equipment_state IS NOT NULL)),
 CHECK((event_kind='substitution')=(substitute_site_item_inventory_id IS NOT NULL)),
 CHECK((event_kind='evidence_link')=(creative_work_event_id IS NOT NULL)),
 CHECK((event_kind='time_link')=(creative_work_order_event_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_maker_traveler_steps_run ON maker_traveler_run_steps(maker_traveler_run_id,operation_order);
CREATE INDEX IF NOT EXISTS idx_maker_traveler_events_step ON maker_traveler_step_events(maker_traveler_run_step_id,maker_traveler_step_event_id DESC);
CREATE TRIGGER IF NOT EXISTS trg_maker_traveler_run_source BEFORE INSERT ON maker_traveler_runs BEGIN
 SELECT RAISE(ABORT,'traveler_not_reviewed_or_mismatch') WHERE NOT EXISTS(
  SELECT 1 FROM creative_project_job_travelers t WHERE t.creative_project_job_traveler_id=NEW.creative_project_job_traveler_id
  AND t.creative_work_project_id=NEW.creative_work_project_id AND t.traveler_status='reviewed' AND t.snapshot_sha256=NEW.snapshot_sha256);
END;
CREATE TRIGGER IF NOT EXISTS trg_maker_traveler_step_source BEFORE INSERT ON maker_traveler_run_steps BEGIN
 SELECT RAISE(ABORT,'step_not_in_reviewed_snapshot') WHERE NOT EXISTS (
  SELECT 1 FROM maker_traveler_runs r JOIN creative_project_job_travelers t ON t.creative_project_job_traveler_id=r.creative_project_job_traveler_id,
   json_each(t.snapshot_json,'$.operations') j
  WHERE r.maker_traveler_run_id=NEW.maker_traveler_run_id
   AND CAST(json_extract(j.value,'$.creative_project_operation_id') AS INTEGER)=NEW.creative_project_operation_id
   AND CAST(json_extract(j.value,'$.operation_order') AS INTEGER)=NEW.operation_order);
 SELECT RAISE(ABORT,'step_source_project_mismatch') WHERE NOT EXISTS (
  SELECT 1 FROM maker_traveler_runs r JOIN creative_project_operations o ON o.creative_work_project_id=r.creative_work_project_id
  WHERE r.maker_traveler_run_id=NEW.maker_traveler_run_id AND o.creative_project_operation_id=NEW.creative_project_operation_id);
END;
CREATE TRIGGER IF NOT EXISTS trg_maker_traveler_event_guard BEFORE INSERT ON maker_traveler_step_events BEGIN
 SELECT RAISE(ABORT,'linked_time_wrong_project_or_step') WHERE NEW.event_kind='time_link' AND NOT EXISTS(
  SELECT 1 FROM maker_traveler_run_steps s JOIN maker_traveler_runs r ON r.maker_traveler_run_id=s.maker_traveler_run_id
   JOIN creative_work_order_events e ON e.creative_work_order_event_id=NEW.creative_work_order_event_id
  WHERE s.maker_traveler_run_step_id=NEW.maker_traveler_run_step_id AND e.event_kind='time'
   AND e.creative_work_project_id=r.creative_work_project_id AND e.creative_project_operation_id=s.creative_project_operation_id);
 SELECT RAISE(ABORT,'linked_evidence_wrong_project') WHERE NEW.event_kind='evidence_link' AND NOT EXISTS(
  SELECT 1 FROM maker_traveler_run_steps s JOIN maker_traveler_runs r ON r.maker_traveler_run_id=s.maker_traveler_run_id
   JOIN creative_work_events e ON e.creative_work_event_id=NEW.creative_work_event_id
  WHERE s.maker_traveler_run_step_id=NEW.maker_traveler_run_step_id AND e.creative_work_project_id=r.creative_work_project_id
   AND e.entry_status='active');
 SELECT RAISE(ABORT,'invalid_equipment_substitution') WHERE NEW.event_kind='substitution' AND NOT EXISTS(
  SELECT 1 FROM site_item_inventory i WHERE i.site_item_inventory_id=NEW.substitute_site_item_inventory_id AND COALESCE(i.is_active,1)=1);
 SELECT RAISE(ABORT,'step_not_started') WHERE NEW.event_kind<>'start' AND NOT EXISTS(
  SELECT 1 FROM maker_traveler_step_events e WHERE e.maker_traveler_run_step_id=NEW.maker_traveler_run_step_id AND e.event_kind='start');
 SELECT RAISE(ABORT,'step_started_twice') WHERE NEW.event_kind='start' AND EXISTS(
  SELECT 1 FROM maker_traveler_step_events e WHERE e.maker_traveler_run_step_id=NEW.maker_traveler_run_step_id);
 SELECT RAISE(ABORT,'step_already_complete') WHERE NEW.event_kind<>'start' AND EXISTS(
  SELECT 1 FROM maker_traveler_step_events e WHERE e.maker_traveler_run_step_id=NEW.maker_traveler_run_step_id AND e.event_kind='complete');
 SELECT RAISE(ABORT,'step_not_active') WHERE NEW.event_kind IN ('pause','hold','complete','check','checkpoint','equipment','substitution','evidence_link','time_link')
 AND COALESCE((SELECT e.event_kind FROM maker_traveler_step_events e WHERE e.maker_traveler_run_step_id=NEW.maker_traveler_run_step_id
  AND e.event_kind IN ('start','pause','hold','resume','complete') ORDER BY e.maker_traveler_step_event_id DESC LIMIT 1),'missing') NOT IN ('start','resume');
 SELECT RAISE(ABORT,'step_not_paused_or_held') WHERE NEW.event_kind='resume'
 AND COALESCE((SELECT e.event_kind FROM maker_traveler_step_events e WHERE e.maker_traveler_run_step_id=NEW.maker_traveler_run_step_id
  AND e.event_kind IN ('start','pause','hold','resume','complete') ORDER BY e.maker_traveler_step_event_id DESC LIMIT 1),'missing') NOT IN ('pause','hold');
 SELECT RAISE(ABORT,'step_completion_requires_evidence') WHERE NEW.event_kind='complete' AND NOT EXISTS(
  SELECT 1 FROM maker_traveler_step_events e WHERE e.maker_traveler_run_step_id=NEW.maker_traveler_run_step_id AND e.event_kind IN ('check','evidence_link'));
 SELECT RAISE(ABORT,'unresolved_cure_checkpoint') WHERE NEW.event_kind='complete' AND EXISTS(
  SELECT 1 FROM maker_traveler_step_events cp WHERE cp.maker_traveler_run_step_id=NEW.maker_traveler_run_step_id
   AND cp.event_kind='checkpoint' AND (datetime(cp.checkpoint_due_at)>datetime('now') OR NOT EXISTS (
    SELECT 1 FROM maker_traveler_step_events ack WHERE ack.maker_traveler_run_step_id=cp.maker_traveler_run_step_id
     AND ack.event_kind='check' AND ack.maker_traveler_step_event_id>cp.maker_traveler_step_event_id AND datetime(ack.created_at)>=datetime(cp.checkpoint_due_at))));
END;
CREATE TRIGGER IF NOT EXISTS trg_maker_traveler_run_immutable BEFORE UPDATE ON maker_traveler_runs BEGIN SELECT RAISE(ABORT,'traveler_run_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_traveler_run_no_delete BEFORE DELETE ON maker_traveler_runs BEGIN SELECT RAISE(ABORT,'traveler_run_append_only'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_traveler_step_immutable BEFORE UPDATE ON maker_traveler_run_steps BEGIN SELECT RAISE(ABORT,'traveler_step_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_traveler_step_no_delete BEFORE DELETE ON maker_traveler_run_steps BEGIN SELECT RAISE(ABORT,'traveler_step_append_only'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_traveler_event_immutable BEFORE UPDATE ON maker_traveler_step_events BEGIN SELECT RAISE(ABORT,'traveler_event_immutable'); END;
CREATE TRIGGER IF NOT EXISTS trg_maker_traveler_event_no_delete BEFORE DELETE ON maker_traveler_step_events BEGIN SELECT RAISE(ABORT,'traveler_event_append_only'); END;
SELECT COUNT(*) AS build446_traveler_tables FROM sqlite_master WHERE type='table' AND name LIKE 'maker_traveler_%';
PRAGMA foreign_key_check;
