-- Devil n Dove Build 214
-- Additive optional relationship between Creative Projects and products.
-- Products are NOT required to have a project; existing direct and phone-capture workflows remain valid.
CREATE TABLE IF NOT EXISTS creative_project_product_links (
  creative_project_product_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_work_project_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'project_output',
  is_primary INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(creative_work_project_id, product_id),
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE,
  FOREIGN KEY(product_id) REFERENCES products(product_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_creative_project_product_links_project ON creative_project_product_links(creative_work_project_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_creative_project_product_links_product ON creative_project_product_links(product_id);
