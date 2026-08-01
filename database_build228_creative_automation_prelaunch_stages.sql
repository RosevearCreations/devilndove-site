-- Devil n Dove Build 228 — master Creative Automation workflow and clear prelaunch stages.
-- Apply once after Build 227. Back up D1 first.
-- Cloudflare D1 imports statements directly; do not add BEGIN, COMMIT, or SAVEPOINT.

CREATE TABLE IF NOT EXISTS creative_automation_workflows (
  creative_automation_workflow_id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_key TEXT NOT NULL UNIQUE,
  creative_work_project_id INTEGER NOT NULL UNIQUE,
  workflow_status TEXT NOT NULL DEFAULT 'planning',
  current_stage_key TEXT NOT NULL DEFAULT 'process',
  owner_user_id INTEGER,
  due_date TEXT,
  blocked_reason TEXT,
  operator_notes TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_automation_stage_reviews (
  creative_automation_stage_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_automation_workflow_id INTEGER NOT NULL,
  stage_key TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'not_started',
  evidence_reference TEXT,
  review_notes TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_automation_workflow_id,stage_key),
  FOREIGN KEY(creative_automation_workflow_id) REFERENCES creative_automation_workflows(creative_automation_workflow_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_automation_events (
  creative_automation_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_automation_workflow_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  stage_key TEXT,
  previous_status TEXT,
  next_status TEXT,
  details_json TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_automation_workflow_id) REFERENCES creative_automation_workflows(creative_automation_workflow_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_creative_automation_workflows_status
  ON creative_automation_workflows(workflow_status,current_stage_key,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_creative_automation_stage_reviews_workflow
  ON creative_automation_stage_reviews(creative_automation_workflow_id,stage_key,review_status);
CREATE INDEX IF NOT EXISTS idx_creative_automation_events_workflow
  ON creative_automation_events(creative_automation_workflow_id,created_at DESC);

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

INSERT INTO schema_migration_ledger (migration_key,file_name,applied_at,notes)
VALUES (
  'build228_creative_automation_prelaunch_stages',
  'database_build228_creative_automation_prelaunch_stages.sql',
  CURRENT_TIMESTAMP,
  'Adds one orchestration layer over existing Creative Process, CAIP, Content Studio, Release Board, and social stages without duplicating their source facts. Startup gates remain authoritative and prelaunch routes remain separate.'
)
ON CONFLICT(migration_key) DO UPDATE SET
  file_name=excluded.file_name,
  notes=excluded.notes;
