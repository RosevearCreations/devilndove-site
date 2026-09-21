-- Release 467 Build 221 — Workshop Knowledge Library Foundation
-- Forward-only, additive reviewed knowledge authority. Existing process, Inventory, Creative Project and media authorities remain owners.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS workshop_knowledge_entries (
  workshop_knowledge_entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  scope_text TEXT NOT NULL,
  observed_result TEXT NOT NULL,
  safety_constraint_notes TEXT,
  safety_evidence_note TEXT,
  confidence_status TEXT NOT NULL DEFAULT 'unrated'
    CHECK(confidence_status IN ('unrated','single_observation','repeated_observation','measured','owner_confirmed')),
  review_status TEXT NOT NULL DEFAULT 'draft'
    CHECK(review_status IN ('draft','reviewed','void')),
  source_creative_work_project_id INTEGER,
  source_creative_project_operation_id INTEGER,
  provenance_note TEXT NOT NULL,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  void_reason TEXT,
  created_by_user_id INTEGER NOT NULL,
  updated_by_user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(source_creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE SET NULL,
  FOREIGN KEY(source_creative_project_operation_id) REFERENCES creative_project_operations(creative_project_operation_id) ON DELETE SET NULL,
  FOREIGN KEY(reviewed_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY(created_by_user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  FOREIGN KEY(updated_by_user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  CHECK(safety_constraint_notes IS NULL OR length(trim(safety_constraint_notes))=0 OR length(trim(COALESCE(safety_evidence_note,'')))>0),
  CHECK(review_status<>'reviewed' OR (reviewed_by_user_id IS NOT NULL AND reviewed_at IS NOT NULL)),
  CHECK(review_status<>'void' OR length(trim(COALESCE(void_reason,'')))>0)
);

CREATE INDEX IF NOT EXISTS idx_workshop_knowledge_entries_status
  ON workshop_knowledge_entries(review_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_workshop_knowledge_entries_project
  ON workshop_knowledge_entries(source_creative_work_project_id, source_creative_project_operation_id);

CREATE TABLE IF NOT EXISTS workshop_knowledge_entry_processes (
  workshop_knowledge_entry_process_id INTEGER PRIMARY KEY AUTOINCREMENT,
  workshop_knowledge_entry_id INTEGER NOT NULL,
  inventory_process_id INTEGER NOT NULL,
  relationship_role TEXT NOT NULL DEFAULT 'primary'
    CHECK(relationship_role IN ('primary','supporting')),
  evidence_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(workshop_knowledge_entry_id) REFERENCES workshop_knowledge_entries(workshop_knowledge_entry_id) ON DELETE CASCADE,
  FOREIGN KEY(inventory_process_id) REFERENCES inventory_processes(inventory_process_id) ON DELETE RESTRICT,
  UNIQUE(workshop_knowledge_entry_id, inventory_process_id, relationship_role)
);

CREATE TABLE IF NOT EXISTS workshop_knowledge_entry_inventory_refs (
  workshop_knowledge_entry_inventory_ref_id INTEGER PRIMARY KEY AUTOINCREMENT,
  workshop_knowledge_entry_id INTEGER NOT NULL,
  site_item_inventory_id INTEGER NOT NULL,
  relationship_role TEXT NOT NULL
    CHECK(relationship_role IN ('material','machine_tool','fixture_workholding','consumable','finishing_supply','other')),
  evidence_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(workshop_knowledge_entry_id) REFERENCES workshop_knowledge_entries(workshop_knowledge_entry_id) ON DELETE CASCADE,
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE RESTRICT,
  UNIQUE(workshop_knowledge_entry_id, site_item_inventory_id, relationship_role)
);

CREATE TABLE IF NOT EXISTS workshop_knowledge_entry_settings (
  workshop_knowledge_entry_setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
  workshop_knowledge_entry_id INTEGER NOT NULL,
  setting_name TEXT NOT NULL,
  observed_value TEXT NOT NULL,
  observed_unit TEXT,
  setting_context TEXT,
  evidence_note TEXT NOT NULL,
  observation_status TEXT NOT NULL DEFAULT 'observed'
    CHECK(observation_status IN ('observed','measured','owner_confirmed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(workshop_knowledge_entry_id) REFERENCES workshop_knowledge_entries(workshop_knowledge_entry_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workshop_knowledge_entry_evidence_refs (
  workshop_knowledge_entry_evidence_ref_id INTEGER PRIMARY KEY AUTOINCREMENT,
  workshop_knowledge_entry_id INTEGER NOT NULL,
  reference_kind TEXT NOT NULL
    CHECK(reference_kind IN ('creative_project','creative_operation','production_run','creative_asset','media_asset','external_reference','note')),
  reference_id INTEGER,
  reference_label TEXT NOT NULL,
  approval_state TEXT NOT NULL DEFAULT 'internal_source'
    CHECK(approval_state IN ('internal_source','reviewed','approved')),
  copy_mode TEXT NOT NULL DEFAULT 'reference_only'
    CHECK(copy_mode='reference_only'),
  source_note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(workshop_knowledge_entry_id) REFERENCES workshop_knowledge_entries(workshop_knowledge_entry_id) ON DELETE CASCADE,
  CHECK(reference_kind NOT IN ('creative_asset','media_asset') OR approval_state='approved')
);

CREATE TABLE IF NOT EXISTS workshop_knowledge_entry_events (
  workshop_knowledge_entry_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  workshop_knowledge_entry_id INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type IN ('draft_saved','reviewed','voided')),
  event_note TEXT,
  actor_user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(workshop_knowledge_entry_id) REFERENCES workshop_knowledge_entries(workshop_knowledge_entry_id) ON DELETE CASCADE,
  FOREIGN KEY(actor_user_id) REFERENCES users(user_id) ON DELETE RESTRICT
);

PRAGMA foreign_key_check;
