-- Build 213 — Creative Process Engine foundation. Safe additive migration.
CREATE TABLE IF NOT EXISTS creative_work_projects (
 creative_work_project_id INTEGER PRIMARY KEY AUTOINCREMENT, project_key TEXT NOT NULL UNIQUE,
 project_title TEXT NOT NULL, project_type TEXT NOT NULL DEFAULT 'maker_project', project_status TEXT NOT NULL DEFAULT 'idea',
 summary TEXT, objective TEXT, story_angle TEXT, product_id INTEGER, started_at TEXT, completed_at TEXT,
 total_minutes INTEGER NOT NULL DEFAULT 0, estimated_cost_cents INTEGER NOT NULL DEFAULT 0, actual_cost_cents INTEGER NOT NULL DEFAULT 0,
 privacy_status TEXT NOT NULL DEFAULT 'internal', rights_status TEXT NOT NULL DEFAULT 'needs_review', created_by INTEGER, updated_by INTEGER,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS creative_work_events (
 creative_work_event_id INTEGER PRIMARY KEY AUTOINCREMENT, creative_work_project_id INTEGER NOT NULL,
 event_type TEXT NOT NULL DEFAULT 'note', event_title TEXT NOT NULL, event_notes TEXT, occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 duration_minutes INTEGER NOT NULL DEFAULT 0, material_name TEXT, material_quantity REAL, material_unit TEXT,
 material_cost_cents INTEGER NOT NULL DEFAULT 0, media_url TEXT, is_public_candidate INTEGER NOT NULL DEFAULT 0,
 created_by INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS creative_work_outputs (
 creative_work_output_id INTEGER PRIMARY KEY AUTOINCREMENT, creative_work_project_id INTEGER NOT NULL,
 output_key TEXT NOT NULL, output_label TEXT NOT NULL, output_group TEXT NOT NULL, output_status TEXT NOT NULL DEFAULT 'planned',
 approval_status TEXT NOT NULL DEFAULT 'needs_review', linked_record_type TEXT, linked_record_id INTEGER, output_url TEXT, notes TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(creative_work_project_id,output_key), FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_creative_work_projects_status ON creative_work_projects(project_status);
CREATE INDEX IF NOT EXISTS idx_creative_work_events_project ON creative_work_events(creative_work_project_id,occurred_at);
CREATE INDEX IF NOT EXISTS idx_creative_work_outputs_project ON creative_work_outputs(creative_work_project_id,output_status);
