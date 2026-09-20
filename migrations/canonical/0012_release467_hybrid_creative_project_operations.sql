-- Release 467 Build 212 — Hybrid Creative Project Operations
-- Ordered manufacturing-operation plans over the existing creative_work_projects authority.
-- inventory_processes remains canonical process identity. Inventory rows are referenced read-only for planning.
-- Actual material use, time/events, media, costing, QA and publication remain with their existing authorities.

CREATE TABLE IF NOT EXISTS creative_project_operations (
  creative_project_operation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_work_project_id INTEGER NOT NULL,
  inventory_process_id INTEGER NOT NULL,
  operation_order INTEGER NOT NULL CHECK(operation_order >= 1),
  operation_title TEXT,
  plan_status TEXT NOT NULL DEFAULT 'planned'
    CHECK(plan_status IN ('draft','planned','ready','blocked','retired')),
  responsible_workspace TEXT,
  planned_setup_notes TEXT,
  planned_duration_minutes INTEGER CHECK(planned_duration_minutes IS NULL OR planned_duration_minutes >= 0),
  output_evidence_requirement TEXT,
  notes TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_work_project_id) REFERENCES creative_work_projects(creative_work_project_id) ON DELETE CASCADE,
  FOREIGN KEY(inventory_process_id) REFERENCES inventory_processes(inventory_process_id) ON DELETE RESTRICT,
  UNIQUE(creative_work_project_id, operation_order)
);

CREATE TABLE IF NOT EXISTS creative_project_operation_dependencies (
  creative_project_operation_dependency_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_operation_id INTEGER NOT NULL,
  predecessor_operation_id INTEGER NOT NULL,
  dependency_type TEXT NOT NULL DEFAULT 'finish_to_start'
    CHECK(dependency_type IN ('finish_to_start','review_before_start','material_output','evidence_required')),
  dependency_notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(creative_project_operation_id <> predecessor_operation_id),
  FOREIGN KEY(creative_project_operation_id) REFERENCES creative_project_operations(creative_project_operation_id) ON DELETE CASCADE,
  FOREIGN KEY(predecessor_operation_id) REFERENCES creative_project_operations(creative_project_operation_id) ON DELETE RESTRICT,
  UNIQUE(creative_project_operation_id, predecessor_operation_id)
);

CREATE TABLE IF NOT EXISTS creative_project_operation_resources (
  creative_project_operation_resource_id INTEGER PRIMARY KEY AUTOINCREMENT,
  creative_project_operation_id INTEGER NOT NULL,
  site_item_inventory_id INTEGER NOT NULL,
  resource_role TEXT NOT NULL
    CHECK(resource_role IN ('material','tool','consumable','fixture','other')),
  planned_quantity REAL CHECK(planned_quantity IS NULL OR planned_quantity >= 0),
  planned_unit TEXT,
  requirement_notes TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(creative_project_operation_id) REFERENCES creative_project_operations(creative_project_operation_id) ON DELETE CASCADE,
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE RESTRICT,
  UNIQUE(creative_project_operation_id, site_item_inventory_id, resource_role)
);

CREATE INDEX IF NOT EXISTS idx_creative_project_operations_project_order
  ON creative_project_operations(creative_work_project_id, operation_order);
CREATE INDEX IF NOT EXISTS idx_creative_project_operations_process
  ON creative_project_operations(inventory_process_id, creative_work_project_id);
CREATE INDEX IF NOT EXISTS idx_creative_project_operation_dependencies_operation
  ON creative_project_operation_dependencies(creative_project_operation_id, predecessor_operation_id);
CREATE INDEX IF NOT EXISTS idx_creative_project_operation_resources_operation
  ON creative_project_operation_resources(creative_project_operation_id, resource_role);
CREATE INDEX IF NOT EXISTS idx_creative_project_operation_resources_inventory
  ON creative_project_operation_resources(site_item_inventory_id, creative_project_operation_id);

-- Evidence-only checks. This migration creates no project, operation, dependency or Inventory-use row.
SELECT COUNT(*) AS build212_operation_tables
FROM sqlite_master
WHERE type='table'
  AND name IN (
    'creative_project_operations',
    'creative_project_operation_dependencies',
    'creative_project_operation_resources'
  );
PRAGMA foreign_key_check;
