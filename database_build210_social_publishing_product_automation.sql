-- Build 210 — Social publishing product-draft automation
-- Safe, additive D1 migration. This creates a disabled-by-default admin setting.
-- It never creates social posts, alters products, or posts to any platform.

CREATE TABLE IF NOT EXISTS product_social_automation_settings (
  settings_id INTEGER PRIMARY KEY CHECK (settings_id = 1),
  auto_queue_enabled INTEGER NOT NULL DEFAULT 0,
  auto_queue_on_review_status TEXT NOT NULL DEFAULT 'approved',
  require_active_product INTEGER NOT NULL DEFAULT 1,
  require_featured_image INTEGER NOT NULL DEFAULT 1,
  default_platforms_json TEXT NOT NULL DEFAULT '["facebook","instagram","pinterest"]',
  caption_template_key TEXT NOT NULL DEFAULT 'new_product',
  default_hashtags TEXT NOT NULL DEFAULT 'DevilnDove,HandmadeOntario,WorkshopMade,SmallBusinessCanada',
  default_utm_campaign TEXT NOT NULL DEFAULT 'new_product',
  notes TEXT,
  updated_by_user_id INTEGER,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO product_social_automation_settings (
  settings_id, auto_queue_enabled, auto_queue_on_review_status,
  require_active_product, require_featured_image, default_platforms_json,
  caption_template_key, default_hashtags, default_utm_campaign, notes, updated_at
) VALUES (
  1, 0, 'approved', 1, 1,
  '["facebook","instagram","pinterest"]',
  'new_product',
  'DevilnDove,HandmadeOntario,WorkshopMade,SmallBusinessCanada',
  'new_product',
  'Disabled by default. When enabled, an eligible product creates one review-first social queue item. No product is published automatically.',
  CURRENT_TIMESTAMP
);

-- The social_post_queue index is created by the Social Queue runtime only after that table exists.
