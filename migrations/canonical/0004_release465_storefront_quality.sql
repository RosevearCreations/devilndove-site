-- Release 465 Build 1 — Storefront and SEO Quality.
-- Forward-only additive publication guards over the existing Product/SEO authorities.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS product_seo (
  product_id INTEGER PRIMARY KEY,
  meta_title TEXT,
  meta_description TEXT,
  keywords TEXT,
  h1_override TEXT,
  canonical_url TEXT,
  schema_type TEXT DEFAULT 'Product',
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_review_actions (
  product_review_action_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  previous_review_status TEXT,
  new_review_status TEXT,
  previous_status TEXT,
  new_status TEXT,
  actor_user_id INTEGER,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_publish_overrides (
  product_publish_override_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  actor_user_id INTEGER,
  override_note TEXT,
  publish_readiness_score INTEGER,
  image_quality_score INTEGER,
  ready_check_notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_review_actions_product_created
  ON product_review_actions(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_publish_overrides_product_created
  ON product_publish_overrides(product_id, created_at DESC);

-- Creation is draft-first. A Product cannot enter the database already public.
CREATE TRIGGER IF NOT EXISTS release465_products_block_unready_insert
BEFORE INSERT ON products
WHEN LOWER(COALESCE(NEW.status, 'draft')) = 'active'
BEGIN
  SELECT RAISE(ABORT, 'release465_product_must_be_created_before_publication');
END;

-- Active status is a publication boundary. Hard readiness is not overrideable.
CREATE TRIGGER IF NOT EXISTS release465_products_block_unready_activation
BEFORE UPDATE OF status, review_status, is_ready_for_storefront, name, slug, price_cents, featured_image_url, product_category ON products
WHEN LOWER(COALESCE(NEW.status, 'draft')) = 'active'
  AND (
    COALESCE(NEW.is_ready_for_storefront, 0) <> 1
    OR LOWER(COALESCE(NEW.review_status, '')) <> 'published'
    OR LENGTH(TRIM(COALESCE(NEW.name, ''))) = 0
    OR LENGTH(TRIM(COALESCE(NEW.slug, ''))) = 0
    OR COALESCE(NEW.price_cents, 0) <= 0
    OR LENGTH(TRIM(COALESCE(NEW.featured_image_url, ''))) = 0
    OR LENGTH(TRIM(COALESCE(NEW.product_category, ''))) = 0
    OR NOT EXISTS (
      SELECT 1 FROM product_seo ps
      WHERE ps.product_id = NEW.product_id
        AND LENGTH(TRIM(COALESCE(ps.meta_title, ''))) >= 10
        AND LENGTH(TRIM(COALESCE(ps.meta_description, ''))) >= 50
    )
  )
BEGIN
  SELECT RAISE(ABORT, 'release465_product_not_ready_for_storefront');
END;

-- An active Product cannot have its required SEO degraded underneath it.
CREATE TRIGGER IF NOT EXISTS release465_product_seo_block_active_degrade
BEFORE UPDATE OF meta_title, meta_description ON product_seo
WHEN EXISTS (
  SELECT 1 FROM products p
  WHERE p.product_id = OLD.product_id
    AND LOWER(COALESCE(p.status, 'draft')) = 'active'
)
AND (
  LENGTH(TRIM(COALESCE(NEW.meta_title, ''))) < 10
  OR LENGTH(TRIM(COALESCE(NEW.meta_description, ''))) < 50
)
BEGIN
  SELECT RAISE(ABORT, 'release465_active_product_requires_seo');
END;

CREATE TRIGGER IF NOT EXISTS release465_product_seo_block_active_delete
BEFORE DELETE ON product_seo
WHEN EXISTS (
  SELECT 1 FROM products p
  WHERE p.product_id = OLD.product_id
    AND LOWER(COALESCE(p.status, 'draft')) = 'active'
)
BEGIN
  SELECT RAISE(ABORT, 'release465_active_product_requires_seo');
END;
