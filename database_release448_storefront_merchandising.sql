-- Devil n Dove Release 448 — Storefront Collections / Collages merchandising authority.
-- Additive Development migration. Products and Product images remain canonical in their existing authorities.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS storefront_collections (
  storefront_collection_id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT,
  public_heading TEXT,
  public_body TEXT,
  hero_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  collection_kind TEXT NOT NULL DEFAULT 'curated' CHECK (collection_kind IN ('curated','origin','category','seasonal','campaign')),
  rule_key TEXT,
  rule_value TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  seo_title TEXT,
  seo_description TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  CHECK (length(trim(slug)) BETWEEN 1 AND 120),
  CHECK (length(trim(name)) BETWEEN 1 AND 180),
  CHECK (rule_key IS NULL OR rule_key IN ('merchandise_origin','product_category','product_type','sale_channel'))
);

CREATE INDEX IF NOT EXISTS idx_storefront_collections_public
  ON storefront_collections(status, sort_order, name);

CREATE TABLE IF NOT EXISTS storefront_collection_products (
  storefront_collection_product_id INTEGER PRIMARY KEY AUTOINCREMENT,
  storefront_collection_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  membership_status TEXT NOT NULL DEFAULT 'included' CHECK (membership_status IN ('included','excluded')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (storefront_collection_id) REFERENCES storefront_collections(storefront_collection_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  UNIQUE(storefront_collection_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_storefront_collection_products_order
  ON storefront_collection_products(storefront_collection_id, membership_status, sort_order, product_id);
CREATE INDEX IF NOT EXISTS idx_storefront_collection_products_product
  ON storefront_collection_products(product_id, membership_status, storefront_collection_id);

CREATE TABLE IF NOT EXISTS storefront_collage_presets (
  storefront_collage_preset_id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  storefront_collection_id INTEGER,
  layout_kind TEXT NOT NULL DEFAULT 'mosaic' CHECK (layout_kind IN ('mosaic','feature_grid','story_strip')),
  max_items INTEGER NOT NULL DEFAULT 6 CHECK (max_items BETWEEN 3 AND 12),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  heading TEXT,
  body_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (storefront_collection_id) REFERENCES storefront_collections(storefront_collection_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_storefront_collage_presets_public
  ON storefront_collage_presets(status, sort_order, name);

-- Origin collections are metadata/rules only. Multi-value rule_value uses | as an OR separator.
INSERT OR IGNORE INTO storefront_collections
  (slug,name,short_description,status,collection_kind,rule_key,rule_value,sort_order)
VALUES
  ('handmade','Handmade creations','Workshop-made Devil n Dove pieces and finished creative work.','published','origin','merchandise_origin','handmade',10),
  ('vintage-antique','Vintage & antique finds','Older pieces and finds where condition, age and provenance should remain visible.','published','origin','merchandise_origin','vintage|antique',20),
  ('collectibles-oddities','Collectibles & oddities','Curious, collectible and unusual stock that is not represented as newly handmade work.','published','origin','merchandise_origin','collectible|oddity',30),
  ('prebuilt-found','Pre-built & found items','Finished outside goods and found stock carried by Devil n Dove without claiming in-house manufacture.','published','origin','merchandise_origin','prebuilt',40);

INSERT OR IGNORE INTO storefront_collage_presets
  (slug,name,storefront_collection_id,layout_kind,max_items,status,heading,body_text,sort_order)
SELECT 'shop-discovery','Shop discovery collage',NULL,'mosaic',6,'published','Explore the shop visually','A visual sampling of currently public Product images. It never replaces Product image authority.',10;

SELECT name FROM sqlite_master
WHERE type='table' AND name IN ('storefront_collections','storefront_collection_products','storefront_collage_presets')
ORDER BY name;
PRAGMA foreign_key_check;
