-- Build 216: explicit reviewed inventory posting, CAIP evidence mirroring, and reusable project cost templates.
CREATE TABLE IF NOT EXISTS creative_project_inventory_posts (
  creative_project_inventory_post_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_work_project_id INTEGER NOT NULL,
  creative_work_event_id INTEGER NOT NULL,
  creative_project_material_review_id INTEGER NOT NULL,
  site_item_inventory_id INTEGER NOT NULL,
  stock_quantity_consumed INTEGER NOT NULL,
  previous_on_hand_quantity INTEGER NOT NULL,
  new_on_hand_quantity INTEGER NOT NULL,
  posting_status TEXT NOT NULL DEFAULT 'posted',
  reversal_post_id INTEGER,
  posted_by INTEGER,
  posted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(creative_project_material_review_id),
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE,
  FOREIGN KEY(creative_work_event_id) REFERENCES creative_work_events(creative_work_event_id) ON DELETE CASCADE,
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_creative_project_inventory_posts_project ON creative_project_inventory_posts(creative_work_project_id, posted_at DESC);
CREATE TABLE IF NOT EXISTS creative_project_caip_mirrors (
  creative_project_caip_mirror_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_work_project_id INTEGER NOT NULL,
  creative_project_id INTEGER NOT NULL,
  source_handoff_id INTEGER,
  evidence_count INTEGER NOT NULL DEFAULT 0,
  mirror_status TEXT NOT NULL DEFAULT 'needs_review',
  mirrored_by INTEGER,
  mirrored_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  UNIQUE(creative_work_project_id, creative_project_id),
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS creative_project_cost_templates (
  creative_project_cost_template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_name TEXT NOT NULL UNIQUE,
  labour_rate_cents INTEGER NOT NULL DEFAULT 0,
  packaging_cost_cents INTEGER NOT NULL DEFAULT 0,
  overhead_cost_cents INTEGER NOT NULL DEFAULT 0,
  channel_fee_percent REAL NOT NULL DEFAULT 0,
  shipping_cost_cents INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
