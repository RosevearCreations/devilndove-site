-- Release 467 Build 220 — Production Run, QA, Rework & Scrap Evidence
-- Reviewed run evidence only. Inventory remains movement/usage authority; Finance/Accounting remains posting authority.
-- Corrections void a reviewed run and record a new run; source ledgers are never rewritten here.

CREATE TABLE IF NOT EXISTS creative_project_production_runs (
  creative_project_production_run_id INTEGER PRIMARY KEY AUTOINCREMENT,
  run_key TEXT NOT NULL UNIQUE,
  creative_project_manufacturing_lifecycle_id INTEGER NOT NULL,
  creative_work_project_id INTEGER NOT NULL,
  custom_request_id INTEGER,
  creative_project_job_traveler_id INTEGER NOT NULL,
  run_sequence INTEGER NOT NULL CHECK(run_sequence >= 1),
  run_identifier TEXT NOT NULL,
  run_status TEXT NOT NULL DEFAULT 'reviewed'
    CHECK(run_status IN ('reviewed','void')),
  planned_quantity REAL CHECK(planned_quantity IS NULL OR planned_quantity >= 0),
  actual_quantity REAL NOT NULL CHECK(actual_quantity >= 0),
  accepted_quantity REAL NOT NULL DEFAULT 0 CHECK(accepted_quantity >= 0),
  rework_quantity REAL NOT NULL DEFAULT 0 CHECK(rework_quantity >= 0),
  scrap_quantity REAL NOT NULL DEFAULT 0 CHECK(scrap_quantity >= 0),
  quantity_unit TEXT NOT NULL DEFAULT 'unit',
  started_at TEXT,
  completed_at TEXT,
  deviation_summary TEXT,
  material_reconciliation_note TEXT NOT NULL,
  review_note TEXT NOT NULL,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  void_reason TEXT,
  voided_by_user_id INTEGER,
  voided_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_project_manufacturing_lifecycle_id) REFERENCES creative_project_manufacturing_lifecycles(creative_project_manufacturing_lifecycle_id) ON DELETE CASCADE,
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE,
  FOREIGN KEY(custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE SET NULL,
  FOREIGN KEY(creative_project_job_traveler_id) REFERENCES creative_project_job_travelers(creative_project_job_traveler_id) ON DELETE RESTRICT,
  UNIQUE(creative_project_manufacturing_lifecycle_id,run_sequence),
  UNIQUE(creative_project_manufacturing_lifecycle_id,run_identifier),
  CHECK(accepted_quantity + rework_quantity + scrap_quantity <= actual_quantity)
);

CREATE TABLE IF NOT EXISTS creative_project_production_run_operations (
  creative_project_production_run_operation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_production_run_id INTEGER NOT NULL,
  creative_project_operation_id INTEGER NOT NULL,
  operation_outcome TEXT NOT NULL DEFAULT 'not_run'
    CHECK(operation_outcome IN ('not_run','pass','rework','fail')),
  started_at TEXT,
  completed_at TEXT,
  checkpoint_note TEXT,
  deviation_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_project_production_run_id) REFERENCES creative_project_production_runs(creative_project_production_run_id) ON DELETE CASCADE,
  FOREIGN KEY(creative_project_operation_id) REFERENCES creative_project_operations(creative_project_operation_id) ON DELETE RESTRICT,
  UNIQUE(creative_project_production_run_id,creative_project_operation_id)
);

CREATE TABLE IF NOT EXISTS creative_project_production_run_qa_checks (
  creative_project_production_run_qa_check_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_production_run_id INTEGER NOT NULL,
  creative_project_operation_id INTEGER,
  checkpoint_key TEXT NOT NULL,
  checkpoint_label TEXT NOT NULL,
  qa_status TEXT NOT NULL
    CHECK(qa_status IN ('pass','rework','fail','not_applicable')),
  observed_result TEXT,
  checked_by_user_id INTEGER,
  checked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_project_production_run_id) REFERENCES creative_project_production_runs(creative_project_production_run_id) ON DELETE CASCADE,
  FOREIGN KEY(creative_project_operation_id) REFERENCES creative_project_operations(creative_project_operation_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS creative_project_production_run_material_evidence (
  creative_project_production_run_material_evidence_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_production_run_id INTEGER NOT NULL,
  creative_project_inventory_post_id INTEGER NOT NULL,
  evidence_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_project_production_run_id) REFERENCES creative_project_production_runs(creative_project_production_run_id) ON DELETE CASCADE,
  FOREIGN KEY(creative_project_inventory_post_id) REFERENCES creative_project_inventory_posts(creative_project_inventory_post_id) ON DELETE RESTRICT,
  UNIQUE(creative_project_production_run_id,creative_project_inventory_post_id)
);

CREATE TABLE IF NOT EXISTS creative_project_production_run_handoffs (
  creative_project_production_run_handoff_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_production_run_id INTEGER NOT NULL,
  handoff_kind TEXT NOT NULL DEFAULT 'pending'
    CHECK(handoff_kind IN ('pending','inventory','custom_order_draft','order','other')),
  site_item_inventory_id INTEGER,
  custom_request_order_draft_id INTEGER,
  order_id INTEGER,
  evidence_note TEXT NOT NULL,
  recorded_by_user_id INTEGER,
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_project_production_run_id) REFERENCES creative_project_production_runs(creative_project_production_run_id) ON DELETE CASCADE,
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE SET NULL,
  FOREIGN KEY(custom_request_order_draft_id) REFERENCES custom_request_order_drafts(custom_request_order_draft_id) ON DELETE SET NULL,
  FOREIGN KEY(order_id) REFERENCES orders(order_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS creative_project_production_run_events (
  creative_project_production_run_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_production_run_id INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type IN ('reviewed','void')),
  event_note TEXT NOT NULL,
  actor_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_project_production_run_id) REFERENCES creative_project_production_runs(creative_project_production_run_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_production_runs_lifecycle
  ON creative_project_production_runs(creative_project_manufacturing_lifecycle_id,run_status,run_sequence DESC);
CREATE INDEX IF NOT EXISTS idx_production_runs_project
  ON creative_project_production_runs(creative_work_project_id,run_status,reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_run_operations_run
  ON creative_project_production_run_operations(creative_project_production_run_id,creative_project_operation_id);
CREATE INDEX IF NOT EXISTS idx_production_run_qa_run
  ON creative_project_production_run_qa_checks(creative_project_production_run_id,qa_status,checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_run_material_run
  ON creative_project_production_run_material_evidence(creative_project_production_run_id,creative_project_inventory_post_id);
CREATE INDEX IF NOT EXISTS idx_production_run_handoff_run
  ON creative_project_production_run_handoffs(creative_project_production_run_id,handoff_kind,recorded_at DESC);

SELECT COUNT(*) AS build220_production_run_tables
FROM sqlite_master
WHERE type='table' AND name IN (
  'creative_project_production_runs',
  'creative_project_production_run_operations',
  'creative_project_production_run_qa_checks',
  'creative_project_production_run_material_evidence',
  'creative_project_production_run_handoffs',
  'creative_project_production_run_events'
);
PRAGMA foreign_key_check;
