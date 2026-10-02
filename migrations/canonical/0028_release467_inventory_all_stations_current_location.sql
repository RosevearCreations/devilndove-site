-- Build 347 final exact-head migration proof: Development D1 must record canonical version 28 before Production promotion.
-- Release 467 Build 347 operator-requested Inventory Operations quality-of-life extension.
-- Forward-only additive schema: one general-purpose canonical process and one independent physical-location pointer.

INSERT OR IGNORE INTO inventory_processes(process_key,process_name,description,sort_order)
VALUES(
  'all-stations',
  'All Stations',
  'General-purpose tools and supplies that can be used across workshop stations.',
  5
);

UPDATE inventory_processes
SET process_name='All Stations',
    description='General-purpose tools and supplies that can be used across workshop stations.',
    is_active=1,
    sort_order=5,
    updated_at=CURRENT_TIMESTAMP
WHERE process_key='all-stations';

CREATE TABLE IF NOT EXISTS inventory_current_locations (
  site_item_inventory_id INTEGER PRIMARY KEY,
  current_location_site_item_inventory_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(site_item_inventory_id)
    REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE,
  FOREIGN KEY(current_location_site_item_inventory_id)
    REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE SET NULL,
  FOREIGN KEY(updated_by_user_id)
    REFERENCES users(user_id) ON DELETE SET NULL,
  CHECK(
    current_location_site_item_inventory_id IS NULL
    OR current_location_site_item_inventory_id <> site_item_inventory_id
  )
);

CREATE INDEX IF NOT EXISTS idx_inventory_current_locations_station
  ON inventory_current_locations(current_location_site_item_inventory_id, site_item_inventory_id);
