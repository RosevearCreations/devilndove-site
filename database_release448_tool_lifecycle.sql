-- Devil n Dove Release 448 — durable Tool lifecycle / maintenance authority.
-- Additive only. Tool lifecycle never changes Inventory quantities and never treats durable Tools as consumables.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS inventory_tool_lifecycle_profiles (
  inventory_tool_lifecycle_profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_item_inventory_id INTEGER NOT NULL UNIQUE,
  lifecycle_status TEXT NOT NULL DEFAULT 'active' CHECK (lifecycle_status IN ('active','maintenance','out_of_service','retired','replaced')),
  condition_status TEXT NOT NULL DEFAULT 'unverified' CHECK (condition_status IN ('unverified','excellent','good','fair','service_due','damaged','unsafe','retired')),
  acquired_at TEXT,
  warranty_expires_at TEXT,
  last_service_at TEXT,
  next_service_at TEXT,
  service_interval_days INTEGER CHECK (service_interval_days IS NULL OR service_interval_days BETWEEN 1 AND 3650),
  replacement_priority TEXT NOT NULL DEFAULT 'normal' CHECK (replacement_priority IN ('normal','watch','plan','urgent')),
  replacement_cost_cents INTEGER CHECK (replacement_cost_cents IS NULL OR replacement_cost_cents >= 0),
  replacement_site_item_inventory_id INTEGER,
  evidence_reference TEXT,
  notes TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE,
  FOREIGN KEY (replacement_site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  CHECK (replacement_site_item_inventory_id IS NULL OR replacement_site_item_inventory_id <> site_item_inventory_id)
);

CREATE TABLE IF NOT EXISTS inventory_tool_lifecycle_events (
  inventory_tool_lifecycle_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_item_inventory_id INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('inspection','maintenance','repair','calibration','damage','out_of_service','returned_to_service','retirement','replacement')),
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  condition_before TEXT CHECK (condition_before IS NULL OR condition_before IN ('unverified','excellent','good','fair','service_due','damaged','unsafe','retired')),
  condition_after TEXT CHECK (condition_after IS NULL OR condition_after IN ('unverified','excellent','good','fair','service_due','damaged','unsafe','retired')),
  service_cost_cents INTEGER CHECK (service_cost_cents IS NULL OR service_cost_cents >= 0),
  evidence_reference TEXT,
  notes TEXT,
  recorded_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tool_lifecycle_profile_status ON inventory_tool_lifecycle_profiles(lifecycle_status,condition_status,next_service_at,replacement_priority);
CREATE INDEX IF NOT EXISTS idx_tool_lifecycle_events_item ON inventory_tool_lifecycle_events(site_item_inventory_id,occurred_at DESC,inventory_tool_lifecycle_event_id DESC);

SELECT name FROM sqlite_master WHERE type='table' AND name IN ('inventory_tool_lifecycle_profiles','inventory_tool_lifecycle_events') ORDER BY name;
PRAGMA foreign_key_check;
