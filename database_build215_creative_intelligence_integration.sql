-- Build 215 — additive Creative Intelligence Integration.
-- Review-first only. This migration does not consume inventory or publish content.
CREATE TABLE IF NOT EXISTS creative_project_evidence_selections (
  creative_project_evidence_selection_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_work_project_id INTEGER NOT NULL,
  creative_work_event_id INTEGER NOT NULL,
  evidence_role TEXT NOT NULL DEFAULT 'process_evidence',
  selected INTEGER NOT NULL DEFAULT 1,
  review_notes TEXT, reviewed_by INTEGER, reviewed_at TEXT,
  UNIQUE(creative_work_project_id, creative_work_event_id),
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE,
  FOREIGN KEY(creative_work_event_id) REFERENCES creative_work_events(creative_work_event_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS creative_project_material_reviews (
  creative_project_material_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_work_project_id INTEGER NOT NULL,
  creative_work_event_id INTEGER NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'pending',
  actual_quantity REAL, waste_quantity REAL, reusable_quantity REAL,
  approved_cost_cents INTEGER NOT NULL DEFAULT 0,
  review_notes TEXT, inventory_consumed INTEGER NOT NULL DEFAULT 0,
  reviewed_by INTEGER, reviewed_at TEXT,
  UNIQUE(creative_work_project_id, creative_work_event_id),
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE,
  FOREIGN KEY(creative_work_event_id) REFERENCES creative_work_events(creative_work_event_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS creative_project_profitability (
  creative_work_project_id INTEGER PRIMARY KEY,
  labour_rate_cents INTEGER NOT NULL DEFAULT 0,
  packaging_cost_cents INTEGER NOT NULL DEFAULT 0,
  overhead_cost_cents INTEGER NOT NULL DEFAULT 0,
  channel_fee_cents INTEGER NOT NULL DEFAULT 0,
  shipping_cost_cents INTEGER NOT NULL DEFAULT 0,
  revenue_cents INTEGER NOT NULL DEFAULT 0,
  estimated_content_value_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT, updated_by INTEGER, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS creative_project_content_handoffs (
  creative_project_content_handoff_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_work_project_id INTEGER NOT NULL,
  content_project_id INTEGER,
  handoff_status TEXT NOT NULL DEFAULT 'draft',
  evidence_count INTEGER NOT NULL DEFAULT 0,
  package_json TEXT NOT NULL,
  created_by INTEGER, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE
);
