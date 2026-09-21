-- Release 467 Build 222 — Project-to-Knowledge Promotion & Recipe History
-- Forward-only, additive recipe/version history over Build 221 Workshop Knowledge.
-- Creative Project, canonical process, Inventory, media and Finance authorities remain owners.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS workshop_knowledge_recipe_versions (
  workshop_knowledge_recipe_version_id INTEGER PRIMARY KEY AUTOINCREMENT,
  workshop_knowledge_entry_id INTEGER NOT NULL,
  version_number INTEGER NOT NULL CHECK(version_number >= 1),
  recipe_state TEXT NOT NULL DEFAULT 'approved'
    CHECK(recipe_state IN ('approved','superseded','void')),
  source_creative_work_project_id INTEGER NOT NULL,
  source_creative_project_operation_id INTEGER,
  source_knowledge_summary_type TEXT NOT NULL DEFAULT 'lessons_learned'
    CHECK(source_knowledge_summary_type='lessons_learned'),
  source_summary_text TEXT NOT NULL,
  source_summary_reviewed_at TEXT,
  source_summary_reviewed_by_user_id INTEGER,
  observed_result TEXT NOT NULL,
  failure_notes TEXT,
  confidence_status TEXT NOT NULL DEFAULT 'single_observation'
    CHECK(confidence_status IN ('unrated','single_observation','repeated_observation','measured','owner_confirmed')),
  generalization_status TEXT NOT NULL DEFAULT 'worked_once'
    CHECK(generalization_status IN ('worked_once','repeated_observation','measured','owner_confirmed')),
  provenance_note TEXT NOT NULL,
  supersedes_recipe_version_id INTEGER,
  approved_by_user_id INTEGER NOT NULL,
  approved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  superseded_at TEXT,
  void_reason TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(workshop_knowledge_entry_id) REFERENCES workshop_knowledge_entries(workshop_knowledge_entry_id) ON DELETE CASCADE,
  FOREIGN KEY(source_creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE RESTRICT,
  FOREIGN KEY(source_creative_project_operation_id) REFERENCES creative_project_operations(creative_project_operation_id) ON DELETE SET NULL,
  FOREIGN KEY(source_summary_reviewed_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY(supersedes_recipe_version_id) REFERENCES workshop_knowledge_recipe_versions(workshop_knowledge_recipe_version_id) ON DELETE SET NULL,
  FOREIGN KEY(approved_by_user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  UNIQUE(workshop_knowledge_entry_id, version_number),
  CHECK(recipe_state<>'void' OR length(trim(COALESCE(void_reason,'')))>0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workshop_recipe_one_approved
  ON workshop_knowledge_recipe_versions(workshop_knowledge_entry_id)
  WHERE recipe_state='approved';
CREATE INDEX IF NOT EXISTS idx_workshop_recipe_project
  ON workshop_knowledge_recipe_versions(source_creative_work_project_id, source_creative_project_operation_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_workshop_recipe_entry_history
  ON workshop_knowledge_recipe_versions(workshop_knowledge_entry_id, version_number DESC);

CREATE TABLE IF NOT EXISTS workshop_knowledge_recipe_processes (
  workshop_knowledge_recipe_process_id INTEGER PRIMARY KEY AUTOINCREMENT,
  workshop_knowledge_recipe_version_id INTEGER NOT NULL,
  inventory_process_id INTEGER NOT NULL,
  relationship_role TEXT NOT NULL DEFAULT 'primary'
    CHECK(relationship_role IN ('primary','supporting')),
  evidence_note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(workshop_knowledge_recipe_version_id) REFERENCES workshop_knowledge_recipe_versions(workshop_knowledge_recipe_version_id) ON DELETE CASCADE,
  FOREIGN KEY(inventory_process_id) REFERENCES inventory_processes(inventory_process_id) ON DELETE RESTRICT,
  UNIQUE(workshop_knowledge_recipe_version_id, inventory_process_id, relationship_role)
);

CREATE TABLE IF NOT EXISTS workshop_knowledge_recipe_inventory_refs (
  workshop_knowledge_recipe_inventory_ref_id INTEGER PRIMARY KEY AUTOINCREMENT,
  workshop_knowledge_recipe_version_id INTEGER NOT NULL,
  site_item_inventory_id INTEGER NOT NULL,
  relationship_role TEXT NOT NULL
    CHECK(relationship_role IN ('material','machine_tool','fixture_workholding','consumable','finishing_supply','other')),
  evidence_note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(workshop_knowledge_recipe_version_id) REFERENCES workshop_knowledge_recipe_versions(workshop_knowledge_recipe_version_id) ON DELETE CASCADE,
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE RESTRICT,
  UNIQUE(workshop_knowledge_recipe_version_id, site_item_inventory_id, relationship_role)
);

CREATE TABLE IF NOT EXISTS workshop_knowledge_recipe_settings (
  workshop_knowledge_recipe_setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
  workshop_knowledge_recipe_version_id INTEGER NOT NULL,
  setting_name TEXT NOT NULL,
  observed_value TEXT NOT NULL,
  observed_unit TEXT,
  setting_context TEXT,
  evidence_note TEXT NOT NULL,
  observation_status TEXT NOT NULL DEFAULT 'observed'
    CHECK(observation_status IN ('observed','measured','owner_confirmed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(workshop_knowledge_recipe_version_id) REFERENCES workshop_knowledge_recipe_versions(workshop_knowledge_recipe_version_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workshop_knowledge_recipe_events (
  workshop_knowledge_recipe_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  workshop_knowledge_entry_id INTEGER NOT NULL,
  workshop_knowledge_recipe_version_id INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type IN ('promoted','superseded','voided')),
  event_note TEXT NOT NULL,
  actor_user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(workshop_knowledge_entry_id) REFERENCES workshop_knowledge_entries(workshop_knowledge_entry_id) ON DELETE CASCADE,
  FOREIGN KEY(workshop_knowledge_recipe_version_id) REFERENCES workshop_knowledge_recipe_versions(workshop_knowledge_recipe_version_id) ON DELETE CASCADE,
  FOREIGN KEY(actor_user_id) REFERENCES users(user_id) ON DELETE RESTRICT
);

PRAGMA foreign_key_check;
