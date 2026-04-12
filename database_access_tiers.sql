-- File: /database_access_tiers.sql

CREATE TABLE IF NOT EXISTS access_tiers (
  access_tier_id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_access_tiers (
  user_access_tier_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  access_tier_id INTEGER NOT NULL,
  granted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT,
  granted_by_user_id INTEGER,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (access_tier_id) REFERENCES access_tiers(access_tier_id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by_user_id) REFERENCES users(user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_access_tiers_unique
ON user_access_tiers(user_id, access_tier_id);

CREATE INDEX IF NOT EXISTS idx_user_access_tiers_user_id
ON user_access_tiers(user_id);

CREATE INDEX IF NOT EXISTS idx_user_access_tiers_access_tier_id
ON user_access_tiers(access_tier_id);

INSERT OR IGNORE INTO access_tiers (code, name, description, is_active)
VALUES
  ('artist', 'Artist', 'Internal artist/creator access', 1),
  ('customer', 'Customer', 'Standard customer account access', 1),
  ('donor', 'Donor', 'Supporter/donor access tier', 1),
  ('vip_donor', 'VIP Donor', 'Higher donor/supporter tier', 1),
  ('subscriber', 'Subscriber', 'Subscriber/member content access', 1);


INSERT OR IGNORE INTO access_tiers (code, name, description, is_active)
VALUES
  ('customer_bronze', 'Customer Bronze', 'Entry customer tier for future discount and loyalty features', 1),
  ('customer_silver', 'Customer Silver', 'Mid customer tier for future discount and loyalty features', 1),
  ('customer_gold', 'Customer Gold', 'Higher customer tier for future discount and loyalty features', 1),
  ('customer_platinum', 'Customer Platinum', 'Top customer tier for future discount and loyalty features', 1),
  ('employee', 'Employee', 'Standard employee/internal access tier', 1),
  ('employee_senior', 'Senior Employee', 'Senior employee/internal access tier', 1),
  ('employee_manager', 'Employee Manager', 'Manager/internal leadership tier', 1);

-- Current pass note: the initial D1 catalog migration completed successfully for Tools, Supplies, Movies, and Featured Creations.
-- The main Catalog admin page no longer exposes the day-to-day migration panel, while `/api/admin/catalog-sync` remains available for maintenance or reseed recovery only.
