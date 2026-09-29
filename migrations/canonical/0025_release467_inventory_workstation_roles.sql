-- Release 467 Build 289 — Inventory workstation roles over the canonical process taxonomy.
-- Additive role/parent metadata only. inventory_processes remains the category/workstation taxonomy
-- and inventory_process_assignments remains the one-primary-process-per-item authority.

CREATE TABLE IF NOT EXISTS inventory_workstation_roles (
  site_item_inventory_id INTEGER PRIMARY KEY,
  workstation_role TEXT NOT NULL DEFAULT 'associated'
    CHECK(workstation_role IN ('station','associated')),
  workstation_site_item_inventory_id INTEGER,
  notes TEXT,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(site_item_inventory_id)
    REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE,
  FOREIGN KEY(workstation_site_item_inventory_id)
    REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE SET NULL,
  FOREIGN KEY(updated_by_user_id)
    REFERENCES users(user_id) ON DELETE SET NULL,
  CHECK(
    (workstation_role='station' AND workstation_site_item_inventory_id IS NULL)
    OR workstation_role='associated'
  )
);

CREATE INDEX IF NOT EXISTS idx_inventory_workstation_roles_parent
  ON inventory_workstation_roles(workstation_site_item_inventory_id, site_item_inventory_id);

CREATE INDEX IF NOT EXISTS idx_inventory_workstation_roles_role
  ON inventory_workstation_roles(workstation_role, site_item_inventory_id);
