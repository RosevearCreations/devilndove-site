-- Release 467 Build 214 — Prototype → Sample → Production Run
-- Additive lifecycle evidence over existing Creative Process and Custom Work authorities.
-- No Creative Project, Custom Request, proof, Inventory, Product-run, CAIP or Finance rows are created automatically.

CREATE TABLE IF NOT EXISTS creative_project_manufacturing_lifecycles (
  creative_project_manufacturing_lifecycle_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_work_project_id INTEGER,
  custom_request_id INTEGER,
  current_stage TEXT NOT NULL DEFAULT 'concept'
    CHECK(current_stage IN ('concept','prototype','prototype_failed_rework','sample_candidate','approved_sample','production_authorized','production_run','qa_rework','completed')),
  approved_sample_evidence_kind TEXT
    CHECK(approved_sample_evidence_kind IS NULL OR approved_sample_evidence_kind IN ('proof_version','creative_work_event')),
  approved_sample_proof_version_id INTEGER,
  approved_sample_creative_work_event_id INTEGER,
  approved_sample_note TEXT,
  approved_sample_at TEXT,
  production_authorization_note TEXT,
  production_authorized_by_user_id INTEGER,
  production_authorized_at TEXT,
  completed_at TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(creative_work_project_id IS NOT NULL OR custom_request_id IS NOT NULL),
  CHECK(NOT (approved_sample_proof_version_id IS NOT NULL AND approved_sample_creative_work_event_id IS NOT NULL)),
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE,
  FOREIGN KEY(custom_request_id) REFERENCES custom_requests(custom_request_id) ON DELETE CASCADE,
  FOREIGN KEY(approved_sample_proof_version_id) REFERENCES custom_request_proof_versions(custom_request_proof_version_id) ON DELETE SET NULL,
  FOREIGN KEY(approved_sample_creative_work_event_id) REFERENCES creative_work_events(creative_work_event_id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_manufacturing_lifecycle_project_unique
  ON creative_project_manufacturing_lifecycles(creative_work_project_id)
  WHERE creative_work_project_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_manufacturing_lifecycle_request_unique
  ON creative_project_manufacturing_lifecycles(custom_request_id)
  WHERE custom_request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_manufacturing_lifecycle_stage
  ON creative_project_manufacturing_lifecycles(current_stage, updated_at);

CREATE TABLE IF NOT EXISTS creative_project_manufacturing_lifecycle_events (
  creative_project_manufacturing_lifecycle_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_manufacturing_lifecycle_id INTEGER NOT NULL,
  from_stage TEXT,
  to_stage TEXT NOT NULL
    CHECK(to_stage IN ('concept','prototype','prototype_failed_rework','sample_candidate','approved_sample','production_authorized','production_run','qa_rework','completed')),
  transition_kind TEXT NOT NULL DEFAULT 'advance'
    CHECK(transition_kind IN ('created','advance','failure_rework','sample_approval','sample_superseded','production_authorization','qa_rework','completion')),
  event_note TEXT,
  proof_version_id INTEGER,
  creative_work_event_id INTEGER,
  actor_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_project_manufacturing_lifecycle_id) REFERENCES creative_project_manufacturing_lifecycles(creative_project_manufacturing_lifecycle_id) ON DELETE CASCADE,
  FOREIGN KEY(proof_version_id) REFERENCES custom_request_proof_versions(custom_request_proof_version_id) ON DELETE SET NULL,
  FOREIGN KEY(creative_work_event_id) REFERENCES creative_work_events(creative_work_event_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_manufacturing_lifecycle_events_lifecycle
  ON creative_project_manufacturing_lifecycle_events(creative_project_manufacturing_lifecycle_id, creative_project_manufacturing_lifecycle_event_id);

-- Migration creates no manufacturing lifecycle or event business rows.
SELECT COUNT(*) AS build214_lifecycle_tables
FROM sqlite_master
WHERE type='table'
  AND name IN ('creative_project_manufacturing_lifecycles','creative_project_manufacturing_lifecycle_events');
PRAGMA foreign_key_check;
