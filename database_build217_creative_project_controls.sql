-- Build 217 — additive Creative Project controls.
-- Safe to run after Build 216. No existing records are deleted or published.

CREATE TABLE IF NOT EXISTS creative_project_inventory_reversals (
  creative_project_inventory_reversal_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_inventory_post_id INTEGER NOT NULL UNIQUE,
  creative_work_project_id INTEGER NOT NULL,
  site_item_inventory_id INTEGER NOT NULL,
  stock_quantity_restored INTEGER NOT NULL,
  previous_on_hand_quantity INTEGER NOT NULL,
  new_on_hand_quantity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  authorized_by INTEGER NOT NULL,
  authorized_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_project_inventory_post_id) REFERENCES creative_project_inventory_posts(creative_project_inventory_post_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS creative_project_profitability_extensions (
  creative_work_project_id INTEGER PRIMARY KEY,
  channel_fee_percent REAL NOT NULL DEFAULT 0,
  fixed_channel_fee_cents INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_project_cost_allocations (
  creative_project_cost_allocation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_work_project_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  allocation_percent REAL NOT NULL DEFAULT 0,
  allocated_cost_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  updated_by INTEGER,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_work_project_id, product_id),
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE,
  FOREIGN KEY(product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creative_project_knowledge_summaries (
  creative_project_knowledge_summary_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_work_project_id INTEGER NOT NULL,
  summary_type TEXT NOT NULL,
  summary_text TEXT NOT NULL,
  source_evidence_count INTEGER NOT NULL DEFAULT 0,
  review_status TEXT NOT NULL DEFAULT 'needs_review',
  reviewed_by INTEGER,
  reviewed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_work_project_id, summary_type),
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_creative_project_reversals_project
  ON creative_project_inventory_reversals(creative_work_project_id, authorized_at DESC);
CREATE INDEX IF NOT EXISTS idx_creative_project_allocations_project
  ON creative_project_cost_allocations(creative_work_project_id, product_id);
CREATE INDEX IF NOT EXISTS idx_creative_project_summaries_project
  ON creative_project_knowledge_summaries(creative_work_project_id, review_status);
