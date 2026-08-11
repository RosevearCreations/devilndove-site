-- Devil n Dove Build 249 — inventory kits/bundles, component provenance, cost allocation and inventory classification.
-- Run after Build 248. Back up D1 first. Additive and idempotent.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS inventory_item_profiles (
  site_item_inventory_id INTEGER PRIMARY KEY,
  inventory_class TEXT NOT NULL DEFAULT 'other' CHECK(inventory_class IN ('raw_material','consumable','packaging','reusable_equipment','kit','component','finished_good','sample','waste','other')),
  lifecycle_mode TEXT NOT NULL DEFAULT 'stocked' CHECK(lifecycle_mode IN ('stocked','consumable','reusable','kit','nonstock','retired')),
  lot_tracking_recommended INTEGER NOT NULL DEFAULT 0,
  expiry_tracking_recommended INTEGER NOT NULL DEFAULT 0,
  source_material_recommended INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE,
  FOREIGN KEY(updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_inventory_item_profiles_class ON inventory_item_profiles(inventory_class,lifecycle_mode);

CREATE TABLE IF NOT EXISTS inventory_kit_templates (
  inventory_kit_template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  kit_inventory_item_id INTEGER NOT NULL UNIQUE,
  template_name TEXT NOT NULL,
  allocation_method TEXT NOT NULL DEFAULT 'equal' CHECK(allocation_method IN ('equal','percentage')),
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(kit_inventory_item_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE,
  FOREIGN KEY(created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY(updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_inventory_kit_templates_active ON inventory_kit_templates(is_active,kit_inventory_item_id);

CREATE TABLE IF NOT EXISTS inventory_kit_template_components (
  inventory_kit_template_component_id INTEGER PRIMARY KEY AUTOINCREMENT,
  inventory_kit_template_id INTEGER NOT NULL,
  component_inventory_item_id INTEGER,
  component_name TEXT NOT NULL,
  component_source_type TEXT NOT NULL DEFAULT 'supply' CHECK(component_source_type IN ('tool','supply','product','other')),
  component_category TEXT,
  quantity_per_kit REAL NOT NULL DEFAULT 1,
  stock_unit_label TEXT NOT NULL DEFAULT 'unit',
  usage_unit_label TEXT NOT NULL DEFAULT 'unit',
  usage_units_per_stock_unit REAL NOT NULL DEFAULT 1,
  usage_tracking_mode TEXT NOT NULL DEFAULT 'exact' CHECK(usage_tracking_mode IN ('exact','estimated','log_only','reusable')),
  inventory_class TEXT NOT NULL DEFAULT 'component' CHECK(inventory_class IN ('raw_material','consumable','packaging','reusable_equipment','kit','component','finished_good','sample','waste','other')),
  cost_share_percent REAL NOT NULL DEFAULT 0,
  supplier_sku TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(inventory_kit_template_id) REFERENCES inventory_kit_templates(inventory_kit_template_id) ON DELETE CASCADE,
  FOREIGN KEY(component_inventory_item_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_inventory_kit_components_template ON inventory_kit_template_components(inventory_kit_template_id,sort_order);
CREATE INDEX IF NOT EXISTS idx_inventory_kit_components_item ON inventory_kit_template_components(component_inventory_item_id);

CREATE TABLE IF NOT EXISTS inventory_kit_open_events (
  inventory_kit_open_event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  open_key TEXT NOT NULL UNIQUE,
  inventory_kit_template_id INTEGER NOT NULL,
  kit_inventory_item_id INTEGER NOT NULL,
  kit_quantity_opened REAL NOT NULL DEFAULT 1,
  kit_unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  kit_total_cost_cents INTEGER NOT NULL DEFAULT 0,
  source_lot_code TEXT,
  note TEXT,
  opened_by_user_id INTEGER,
  opened_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(inventory_kit_template_id) REFERENCES inventory_kit_templates(inventory_kit_template_id) ON DELETE RESTRICT,
  FOREIGN KEY(kit_inventory_item_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE RESTRICT,
  FOREIGN KEY(opened_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_inventory_kit_open_events_kit ON inventory_kit_open_events(kit_inventory_item_id,opened_at DESC);

CREATE TABLE IF NOT EXISTS inventory_kit_open_components (
  inventory_kit_open_component_id INTEGER PRIMARY KEY AUTOINCREMENT,
  inventory_kit_open_event_id INTEGER NOT NULL,
  inventory_kit_template_component_id INTEGER NOT NULL,
  component_inventory_item_id INTEGER NOT NULL,
  quantity_added REAL NOT NULL DEFAULT 0,
  allocated_cost_cents INTEGER NOT NULL DEFAULT 0,
  component_unit_cost_cents INTEGER NOT NULL DEFAULT 0,
  previous_on_hand_quantity REAL NOT NULL DEFAULT 0,
  new_on_hand_quantity REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(inventory_kit_open_event_id) REFERENCES inventory_kit_open_events(inventory_kit_open_event_id) ON DELETE CASCADE,
  FOREIGN KEY(inventory_kit_template_component_id) REFERENCES inventory_kit_template_components(inventory_kit_template_component_id) ON DELETE RESTRICT,
  FOREIGN KEY(component_inventory_item_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_inventory_kit_open_components_event ON inventory_kit_open_components(inventory_kit_open_event_id);

CREATE TABLE IF NOT EXISTS inventory_source_material_links (
  inventory_source_material_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_item_inventory_id INTEGER NOT NULL,
  packaging_source_material_template_id INTEGER NOT NULL,
  link_role TEXT NOT NULL DEFAULT 'source_material' CHECK(link_role IN ('source_material','fragrance','colourant','additive','soap_base')),
  notes TEXT,
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(site_item_inventory_id,packaging_source_material_template_id,link_role),
  FOREIGN KEY(site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE,
  FOREIGN KEY(packaging_source_material_template_id) REFERENCES packaging_source_material_templates(packaging_source_material_template_id) ON DELETE RESTRICT,
  FOREIGN KEY(created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_inventory_source_material_links_item ON inventory_source_material_links(site_item_inventory_id,link_role);

INSERT INTO inventory_item_profiles(site_item_inventory_id,inventory_class,lifecycle_mode,lot_tracking_recommended,source_material_recommended,notes)
SELECT site_item_inventory_id,
       CASE WHEN LOWER(TRIM(source_type))='tool' THEN 'reusable_equipment' ELSE 'consumable' END,
       CASE WHEN LOWER(TRIM(source_type))='tool' THEN 'reusable' ELSE 'consumable' END,
       CASE WHEN LOWER(TRIM(source_type))='supply' THEN 1 ELSE 0 END,
       CASE WHEN LOWER(TRIM(source_type))='supply' THEN 1 ELSE 0 END,
       'Build 249 baseline classification; review when the item is next edited.'
FROM site_item_inventory
WHERE NOT EXISTS (SELECT 1 FROM inventory_item_profiles p WHERE p.site_item_inventory_id=site_item_inventory.site_item_inventory_id);
