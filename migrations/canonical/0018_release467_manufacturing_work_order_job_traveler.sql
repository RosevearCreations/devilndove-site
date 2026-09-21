-- Release 467 Build 219 — Manufacturing Work Order & Job Traveler
-- Reviewed versioned traveler evidence over existing manufacturing authorities.
-- Source Product, Inventory, Packaging, CAIP, Custom Work and Finance authorities remain owners.

CREATE TABLE IF NOT EXISTS creative_project_job_travelers (
  creative_project_job_traveler_id INTEGER PRIMARY KEY AUTOINCREMENT,
  traveler_key TEXT NOT NULL UNIQUE,
  creative_project_manufacturing_lifecycle_id INTEGER NOT NULL,
  creative_work_project_id INTEGER NOT NULL,
  custom_request_id INTEGER,
  version_number INTEGER NOT NULL CHECK(version_number >= 1),
  traveler_status TEXT NOT NULL DEFAULT 'reviewed'
    CHECK(traveler_status IN ('reviewed','superseded','void')),
  snapshot_json TEXT NOT NULL,
  snapshot_sha256 TEXT NOT NULL CHECK(length(snapshot_sha256)=64),
  review_note TEXT NOT NULL,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  supersedes_job_traveler_id INTEGER,
  void_reason TEXT,
  voided_by_user_id INTEGER,
  voided_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_project_manufacturing_lifecycle_id)
    REFERENCES creative_project_manufacturing_lifecycles(creative_project_manufacturing_lifecycle_id) ON DELETE CASCADE,
  FOREIGN KEY(creative_work_project_id)
    REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE,
  FOREIGN KEY(custom_request_id)
    REFERENCES custom_requests(custom_request_id) ON DELETE SET NULL,
  FOREIGN KEY(supersedes_job_traveler_id)
    REFERENCES creative_project_job_travelers(creative_project_job_traveler_id) ON DELETE SET NULL,
  UNIQUE(creative_project_manufacturing_lifecycle_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_job_travelers_lifecycle_version
  ON creative_project_job_travelers(creative_project_manufacturing_lifecycle_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_job_travelers_project_status
  ON creative_project_job_travelers(creative_work_project_id, traveler_status, reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_travelers_request_status
  ON creative_project_job_travelers(custom_request_id, traveler_status, reviewed_at DESC);

CREATE TABLE IF NOT EXISTS creative_project_job_traveler_events (
  creative_project_job_traveler_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_job_traveler_id INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type IN ('reviewed','superseded','void')),
  event_note TEXT,
  actor_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_project_job_traveler_id)
    REFERENCES creative_project_job_travelers(creative_project_job_traveler_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_job_traveler_events_traveler
  ON creative_project_job_traveler_events(
    creative_project_job_traveler_id,
    creative_project_job_traveler_event_id DESC
  );

SELECT COUNT(*) AS build219_traveler_tables
FROM sqlite_master
WHERE type='table'
  AND name IN ('creative_project_job_travelers','creative_project_job_traveler_events');
PRAGMA foreign_key_check;
