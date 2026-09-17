-- Release 467 Build 173 — correct legacy Storefront publication trigger scope.
-- Existing applied Release 465 migration history remains immutable. This forward correction
-- keeps hard checks on the draft->active publication boundary while allowing already-active
-- legacy Products to repair non-empty fields such as featured_image_url.
PRAGMA foreign_keys = ON;

DROP TRIGGER IF EXISTS release465_products_block_unready_activation;

CREATE TRIGGER IF NOT EXISTS release465_products_block_unready_activation
BEFORE UPDATE OF status ON products
WHEN LOWER(COALESCE(NEW.status, 'draft')) = 'active'
  AND LOWER(COALESCE(OLD.status, 'draft')) <> 'active'
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

-- Do not let a currently valid required Storefront field be degraded to invalid while
-- the Product stays active. Legacy-invalid fields may still be repaired in place.
CREATE TRIGGER IF NOT EXISTS release467_products_block_active_required_field_degrade
BEFORE UPDATE OF name, slug, price_cents, featured_image_url, product_category ON products
WHEN LOWER(COALESCE(OLD.status, 'draft')) = 'active'
  AND LOWER(COALESCE(NEW.status, 'draft')) = 'active'
  AND (
    (LENGTH(TRIM(COALESCE(OLD.name, ''))) > 0 AND LENGTH(TRIM(COALESCE(NEW.name, ''))) = 0)
    OR (LENGTH(TRIM(COALESCE(OLD.slug, ''))) > 0 AND LENGTH(TRIM(COALESCE(NEW.slug, ''))) = 0)
    OR (COALESCE(OLD.price_cents, 0) > 0 AND COALESCE(NEW.price_cents, 0) <= 0)
    OR (LENGTH(TRIM(COALESCE(OLD.featured_image_url, ''))) > 0 AND LENGTH(TRIM(COALESCE(NEW.featured_image_url, ''))) = 0)
    OR (LENGTH(TRIM(COALESCE(OLD.product_category, ''))) > 0 AND LENGTH(TRIM(COALESCE(NEW.product_category, ''))) = 0)
  )
BEGIN
  SELECT RAISE(ABORT, 'release467_active_product_required_field_degrade');
END;

-- Likewise, once an active Product has reached the published/readiness states, ordinary
-- edits cannot silently downgrade either state. Legacy active Products that predate these
-- flags are not blocked from repairing unrelated fields.
CREATE TRIGGER IF NOT EXISTS release467_products_block_active_readiness_degrade
BEFORE UPDATE OF review_status, is_ready_for_storefront ON products
WHEN LOWER(COALESCE(OLD.status, 'draft')) = 'active'
  AND LOWER(COALESCE(NEW.status, 'draft')) = 'active'
  AND (
    (LOWER(COALESCE(OLD.review_status, '')) = 'published' AND LOWER(COALESCE(NEW.review_status, '')) <> 'published')
    OR (COALESCE(OLD.is_ready_for_storefront, 0) = 1 AND COALESCE(NEW.is_ready_for_storefront, 0) <> 1)
  )
BEGIN
  SELECT RAISE(ABORT, 'release467_active_product_readiness_degrade');
END;
