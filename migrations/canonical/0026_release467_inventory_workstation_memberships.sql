-- Release 467 Build 289 maintenance — many-to-many Inventory ↔ workstation-tool membership.
-- inventory_process_assignments remains the one-primary-workstation/category authority.
-- inventory_workstation_roles continues to identify which Tool rows are workstation tools.
-- This table allows one associated Tool/Supply to be usable at zero, one, or many workstation tools.

CREATE TABLE IF NOT EXISTS inventory_workstation_memberships (
  site_item_inventory_id INTEGER NOT NULL,
  workstation_site_item_inventory_id INTEGER NOT NULL,
  notes TEXT,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(site_item_inventory_id, workstation_site_item_inventory_id),
  FOREIGN KEY(site_item_inventory_id)
    REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE,
  FOREIGN KEY(workstation_site_item_inventory_id)
    REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE,
  FOREIGN KEY(updated_by_user_id)
    REFERENCES users(user_id) ON DELETE SET NULL,
  CHECK(site_item_inventory_id <> workstation_site_item_inventory_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_workstation_memberships_station
  ON inventory_workstation_memberships(workstation_site_item_inventory_id, site_item_inventory_id);

CREATE INDEX IF NOT EXISTS idx_inventory_workstation_memberships_item
  ON inventory_workstation_memberships(site_item_inventory_id, workstation_site_item_inventory_id);

-- Preserve any single-station relationships created under migration 0025.
INSERT OR IGNORE INTO inventory_workstation_memberships(
  site_item_inventory_id,
  workstation_site_item_inventory_id,
  notes,
  updated_by_user_id,
  created_at,
  updated_at
)
SELECT
  site_item_inventory_id,
  workstation_site_item_inventory_id,
  'Backfilled from migration 0025 single-station relationship.',
  updated_by_user_id,
  COALESCE(created_at,CURRENT_TIMESTAMP),
  COALESCE(updated_at,CURRENT_TIMESTAMP)
FROM inventory_workstation_roles
WHERE workstation_role='associated'
  AND workstation_site_item_inventory_id IS NOT NULL
  AND workstation_site_item_inventory_id <> site_item_inventory_id;
