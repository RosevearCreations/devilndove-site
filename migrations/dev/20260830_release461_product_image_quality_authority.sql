-- Release 461: migration-owned product media role and primary-image quality acceptance.
-- Primary image acceptance: >=1200x1200, alt text >=12 characters, quality score >=70.
-- Browser measurement records dimensions/loadability; server recomputes the authoritative score.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS product_media_role_assignments (
  product_media_role_assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  role_key TEXT NOT NULL,
  product_image_id INTEGER,
  image_url TEXT,
  assignment_status TEXT NOT NULL DEFAULT 'assigned',
  notes TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, role_key),
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (product_image_id) REFERENCES product_images(product_image_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_product_media_role_assignments_product
  ON product_media_role_assignments(product_id, role_key);

CREATE TABLE IF NOT EXISTS product_image_quality_reviews (
  product_image_quality_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  product_image_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  image_role TEXT NOT NULL DEFAULT 'supporting',
  width_px INTEGER NOT NULL DEFAULT 0 CHECK (width_px >= 0),
  height_px INTEGER NOT NULL DEFAULT 0 CHECK (height_px >= 0),
  alt_text_length INTEGER NOT NULL DEFAULT 0 CHECK (alt_text_length >= 0),
  load_status TEXT NOT NULL DEFAULT 'unknown' CHECK (load_status IN ('unknown','loaded','error')),
  quality_score INTEGER NOT NULL DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
  acceptance_status TEXT NOT NULL DEFAULT 'needs_review' CHECK (acceptance_status IN ('accepted','needs_review','supporting')),
  review_source TEXT NOT NULL DEFAULT 'browser_measurement',
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, product_image_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (product_image_id) REFERENCES product_images(product_image_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_image_quality_reviews_product
  ON product_image_quality_reviews(product_id, acceptance_status, quality_score);

CREATE INDEX IF NOT EXISTS idx_product_image_quality_reviews_image
  ON product_image_quality_reviews(product_image_id, updated_at);
