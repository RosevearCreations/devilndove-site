-- Release 467 Build 286 — Creative Process Resource-Link Operator Workflow
-- Reference-only identity links from existing material events to existing non-Product Supply/Tool Inventory.
CREATE TABLE IF NOT EXISTS creative_process_resource_links (
  creative_process_resource_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_work_project_id INTEGER NOT NULL,
  creative_work_event_id INTEGER NOT NULL,
  creative_project_operation_id INTEGER,
  site_item_inventory_id INTEGER NOT NULL,
  resource_role TEXT NOT NULL DEFAULT 'material' CHECK(resource_role IN ('material','consumable','tool','fixture','other')),
  link_notes TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE,
  FOREIGN KEY(creative_work_event_id) REFERENCES creative_work_events(creative_work_event_id) ON DELETE CASCADE,
  FOREIGN KEY(creative_project_operation_id) REFERENCES creative_project_operations(creative_project_operation_id) ON DELETE SET NULL,
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE RESTRICT,
  UNIQUE(creative_work_event_id, site_item_inventory_id, resource_role)
);
CREATE INDEX IF NOT EXISTS idx_creative_process_resource_links_project_event ON creative_process_resource_links(creative_work_project_id, creative_work_event_id);
CREATE INDEX IF NOT EXISTS idx_creative_process_resource_links_inventory ON creative_process_resource_links(site_item_inventory_id, creative_work_project_id);
CREATE INDEX IF NOT EXISTS idx_creative_process_resource_links_operation ON creative_process_resource_links(creative_project_operation_id, creative_work_project_id);
-- No resource-link rows or Inventory movement are created by this migration.
SELECT COUNT(*) AS build286_resource_link_tables FROM sqlite_master WHERE type='table' AND name='creative_process_resource_links';
PRAGMA foreign_key_check;
