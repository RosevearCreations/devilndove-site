-- Devil n Dove Build 395 canonical table authority / Build 437 completion hardening
-- Membership tier-policy schema/default authority.
-- Read/write request handlers must not create or seed this table at request time.
-- IMPORTANT: legacy Production must be upgraded only through the guarded Membership
-- rebuild controller; do not run this authority directly against the legacy shape.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS membership_tier_policies (
  policy_id INTEGER PRIMARY KEY AUTOINCREMENT,
  tier_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  short_description TEXT NOT NULL DEFAULT '',
  benefits_json TEXT NOT NULL DEFAULT '[]',
  badge_color TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_membership_tier_policies_sort
  ON membership_tier_policies(sort_order ASC, tier_code ASC);

INSERT INTO membership_tier_policies (
  tier_code, title, short_description, benefits_json, badge_color, sort_order, is_visible
) VALUES
  ('bronze', 'Bronze', 'Entry membership tier for basic perks and updates.', '["Member badge","News and updates","Occasional coupon access"]', '#8c6239', 10, 1),
  ('silver', 'Silver', 'Mid-tier membership with stronger savings and earlier access.', '["Everything in Bronze","Better member discounts","Early access to select releases"]', '#a7adb5', 20, 1),
  ('gold', 'Gold', 'Top starter tier with best discounts and premium extras.', '["Everything in Silver","Best member discounts","Priority early access","Premium bonus perks"]', '#c9a227', 30, 1)
ON CONFLICT(tier_code) DO NOTHING;
