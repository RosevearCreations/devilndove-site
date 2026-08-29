-- Devil n Dove Release 448 — Supply sourcing and replenishment planning authority.
-- Additive only. This layer never changes on-hand Inventory quantities and never places provider orders.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS inventory_supply_source_options (
  inventory_supply_source_option_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_item_inventory_id INTEGER NOT NULL,
  source_name TEXT NOT NULL,
  platform_code TEXT NOT NULL DEFAULT 'other' CHECK (platform_code IN ('local','amazon','vevor','ebay','etsy','manufacturer_direct','wholesale','other')),
  relationship_type TEXT NOT NULL DEFAULT 'alternate' CHECK (relationship_type IN ('primary','alternate','backup','trial')),
  supplier_sku TEXT,
  source_url TEXT,
  currency_code TEXT NOT NULL DEFAULT 'CAD' CHECK (length(currency_code)=3),
  pack_quantity REAL NOT NULL DEFAULT 1 CHECK (pack_quantity > 0),
  pack_price_cents INTEGER CHECK (pack_price_cents IS NULL OR pack_price_cents >= 0),
  shipping_cents INTEGER CHECK (shipping_cents IS NULL OR shipping_cents >= 0),
  minimum_order_packs INTEGER NOT NULL DEFAULT 1 CHECK (minimum_order_packs >= 1),
  lead_time_days INTEGER CHECK (lead_time_days IS NULL OR lead_time_days BETWEEN 0 AND 3650),
  availability_status TEXT NOT NULL DEFAULT 'unknown' CHECK (availability_status IN ('unknown','in_stock','low_stock','out_of_stock','discontinued')),
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('pending','unverified','verified')),
  last_checked_at TEXT,
  evidence_reference TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_by_user_id INTEGER,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS inventory_supply_replenishment_profiles (
  inventory_supply_replenishment_profile_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_item_inventory_id INTEGER NOT NULL UNIQUE,
  reorder_point_quantity REAL CHECK (reorder_point_quantity IS NULL OR reorder_point_quantity >= 0),
  target_stock_quantity REAL CHECK (target_stock_quantity IS NULL OR target_stock_quantity >= 0),
  safety_stock_quantity REAL CHECK (safety_stock_quantity IS NULL OR safety_stock_quantity >= 0),
  expected_usage_per_day REAL CHECK (expected_usage_per_day IS NULL OR expected_usage_per_day >= 0),
  planning_horizon_days INTEGER NOT NULL DEFAULT 30 CHECK (planning_horizon_days BETWEEN 1 AND 365),
  preferred_source_option_id INTEGER,
  review_cadence_days INTEGER NOT NULL DEFAULT 30 CHECK (review_cadence_days BETWEEN 1 AND 365),
  notes TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE,
  FOREIGN KEY (preferred_source_option_id) REFERENCES inventory_supply_source_options(inventory_supply_source_option_id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  CHECK (target_stock_quantity IS NULL OR reorder_point_quantity IS NULL OR target_stock_quantity >= reorder_point_quantity),
  CHECK (safety_stock_quantity IS NULL OR target_stock_quantity IS NULL OR safety_stock_quantity <= target_stock_quantity)
);

CREATE TABLE IF NOT EXISTS inventory_supply_substitution_reviews (
  inventory_supply_substitution_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_item_inventory_id INTEGER NOT NULL,
  substitute_site_item_inventory_id INTEGER NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','trial','approved','rejected')),
  equivalence_scope TEXT NOT NULL DEFAULT 'conditional' CHECK (equivalence_scope IN ('full','conditional','test_only')),
  evidence_reference TEXT,
  conditions_note TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE,
  FOREIGN KEY (substitute_site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  UNIQUE (site_item_inventory_id, substitute_site_item_inventory_id),
  CHECK (site_item_inventory_id <> substitute_site_item_inventory_id)
);

CREATE TRIGGER IF NOT EXISTS trg_supply_source_insert_guard
BEFORE INSERT ON inventory_supply_source_options
FOR EACH ROW WHEN NOT EXISTS (SELECT 1 FROM site_item_inventory WHERE site_item_inventory_id=NEW.site_item_inventory_id AND lower(trim(COALESCE(source_type,'')))='supply')
BEGIN SELECT RAISE(ABORT,'Supply sourcing requires source_type=supply'); END;

CREATE TRIGGER IF NOT EXISTS trg_supply_source_update_guard
BEFORE UPDATE OF site_item_inventory_id ON inventory_supply_source_options
FOR EACH ROW WHEN NOT EXISTS (SELECT 1 FROM site_item_inventory WHERE site_item_inventory_id=NEW.site_item_inventory_id AND lower(trim(COALESCE(source_type,'')))='supply')
BEGIN SELECT RAISE(ABORT,'Supply sourcing requires source_type=supply'); END;

CREATE TRIGGER IF NOT EXISTS trg_supply_profile_insert_guard
BEFORE INSERT ON inventory_supply_replenishment_profiles
FOR EACH ROW WHEN NOT EXISTS (SELECT 1 FROM site_item_inventory WHERE site_item_inventory_id=NEW.site_item_inventory_id AND lower(trim(COALESCE(source_type,'')))='supply')
BEGIN SELECT RAISE(ABORT,'Supply replenishment requires source_type=supply'); END;

CREATE TRIGGER IF NOT EXISTS trg_supply_profile_update_guard
BEFORE UPDATE OF site_item_inventory_id ON inventory_supply_replenishment_profiles
FOR EACH ROW WHEN NOT EXISTS (SELECT 1 FROM site_item_inventory WHERE site_item_inventory_id=NEW.site_item_inventory_id AND lower(trim(COALESCE(source_type,'')))='supply')
BEGIN SELECT RAISE(ABORT,'Supply replenishment requires source_type=supply'); END;

CREATE TRIGGER IF NOT EXISTS trg_supply_substitution_insert_guard
BEFORE INSERT ON inventory_supply_substitution_reviews
FOR EACH ROW WHEN NOT EXISTS (SELECT 1 FROM site_item_inventory WHERE site_item_inventory_id=NEW.site_item_inventory_id AND lower(trim(COALESCE(source_type,'')))='supply') OR NOT EXISTS (SELECT 1 FROM site_item_inventory WHERE site_item_inventory_id=NEW.substitute_site_item_inventory_id AND lower(trim(COALESCE(source_type,'')))='supply')
BEGIN SELECT RAISE(ABORT,'Supply substitution requires two supply items'); END;

CREATE TRIGGER IF NOT EXISTS trg_supply_substitution_update_guard
BEFORE UPDATE OF site_item_inventory_id,substitute_site_item_inventory_id ON inventory_supply_substitution_reviews
FOR EACH ROW WHEN NOT EXISTS (SELECT 1 FROM site_item_inventory WHERE site_item_inventory_id=NEW.site_item_inventory_id AND lower(trim(COALESCE(source_type,'')))='supply') OR NOT EXISTS (SELECT 1 FROM site_item_inventory WHERE site_item_inventory_id=NEW.substitute_site_item_inventory_id AND lower(trim(COALESCE(source_type,'')))='supply')
BEGIN SELECT RAISE(ABORT,'Supply substitution requires two supply items'); END;

CREATE TRIGGER IF NOT EXISTS trg_supply_profile_preferred_source_insert_guard
BEFORE INSERT ON inventory_supply_replenishment_profiles
FOR EACH ROW WHEN NEW.preferred_source_option_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM inventory_supply_source_options s WHERE s.inventory_supply_source_option_id=NEW.preferred_source_option_id AND s.site_item_inventory_id=NEW.site_item_inventory_id)
BEGIN SELECT RAISE(ABORT,'Preferred source must belong to the same Supply'); END;

CREATE TRIGGER IF NOT EXISTS trg_supply_profile_preferred_source_update_guard
BEFORE UPDATE OF preferred_source_option_id,site_item_inventory_id ON inventory_supply_replenishment_profiles
FOR EACH ROW WHEN NEW.preferred_source_option_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM inventory_supply_source_options s WHERE s.inventory_supply_source_option_id=NEW.preferred_source_option_id AND s.site_item_inventory_id=NEW.site_item_inventory_id)
BEGIN SELECT RAISE(ABORT,'Preferred source must belong to the same Supply'); END;

CREATE INDEX IF NOT EXISTS idx_supply_sources_item ON inventory_supply_source_options(site_item_inventory_id,is_active,relationship_type,verification_status);
CREATE INDEX IF NOT EXISTS idx_supply_sources_availability ON inventory_supply_source_options(availability_status,lead_time_days,source_name);
CREATE INDEX IF NOT EXISTS idx_supply_replenishment_review ON inventory_supply_replenishment_profiles(reviewed_at,review_cadence_days);
CREATE INDEX IF NOT EXISTS idx_supply_substitutions_item ON inventory_supply_substitution_reviews(site_item_inventory_id,review_status,equivalence_scope);

SELECT name FROM sqlite_master WHERE type='table' AND name IN ('inventory_supply_source_options','inventory_supply_replenishment_profiles','inventory_supply_substitution_reviews') ORDER BY name;
PRAGMA foreign_key_check;
