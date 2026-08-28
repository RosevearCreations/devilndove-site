-- Devil n Dove Release 448 — Product material/tool lineage and purchased-item review authority.
-- Development-first additive migration. Existing inventory/resource authorities remain canonical.
-- No stock ledger is duplicated, no historical consumption is fabricated, and no Production target is encoded.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS product_lineage_profiles (
  product_id INTEGER PRIMARY KEY,
  origin_kind TEXT NOT NULL DEFAULT 'legacy_pending'
    CHECK (origin_kind IN ('made_in_house','antiquity','resale','external_finished_good','legacy_pending')),
  lineage_status TEXT NOT NULL DEFAULT 'legacy_pending'
    CHECK (lineage_status IN ('pending','legacy_pending','exempt','unverified','verified')),
  publication_policy TEXT NOT NULL DEFAULT 'legacy_nonblocking'
    CHECK (publication_policy IN ('required','legacy_nonblocking','exempt')),
  materials_required INTEGER NOT NULL DEFAULT 0 CHECK (materials_required IN (0,1)),
  evidence_reference TEXT,
  review_notes TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  CHECK (
    (publication_policy='exempt' AND materials_required=0 AND lineage_status='exempt')
    OR publication_policy<>'exempt'
  )
);

CREATE INDEX IF NOT EXISTS idx_product_lineage_profiles_state
  ON product_lineage_profiles(origin_kind,lineage_status,publication_policy,updated_at DESC);

CREATE TABLE IF NOT EXISTS product_resource_lineage_reviews (
  product_resource_lineage_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  product_resource_link_id INTEGER NOT NULL UNIQUE,
  site_item_inventory_id INTEGER,
  resource_role TEXT NOT NULL DEFAULT 'material'
    CHECK (resource_role IN ('material','tool','mold','fixture','equipment','other')),
  verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('pending','legacy_pending','exempt','unverified','verified')),
  evidence_reference TEXT,
  review_note TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (product_resource_link_id) REFERENCES product_resource_links(product_resource_link_id) ON DELETE CASCADE,
  FOREIGN KEY (site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE SET NULL,
  FOREIGN KEY (reviewed_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_product_resource_lineage_product
  ON product_resource_lineage_reviews(product_id,verification_status,resource_role);
CREATE INDEX IF NOT EXISTS idx_product_resource_lineage_inventory
  ON product_resource_lineage_reviews(site_item_inventory_id,verification_status);

-- Manufacturer identity is normalized separately from vendor/store identity. We never infer
-- manufacturer from supplier_name because a retailer/distributor is not necessarily the maker.
CREATE TABLE IF NOT EXISTS inventory_manufacturers (
  manufacturer_id INTEGER PRIMARY KEY AUTOINCREMENT,
  manufacturer_name TEXT NOT NULL,
  canonical_key TEXT NOT NULL UNIQUE,
  website_url TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  CHECK (length(trim(manufacturer_name)) BETWEEN 1 AND 180),
  CHECK (length(trim(canonical_key)) BETWEEN 1 AND 180)
);

CREATE INDEX IF NOT EXISTS idx_inventory_manufacturers_name
  ON inventory_manufacturers(status,manufacturer_name,manufacturer_id);

CREATE TABLE IF NOT EXISTS inventory_manufacturer_links (
  site_item_inventory_id INTEGER PRIMARY KEY,
  manufacturer_id INTEGER NOT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'manufacturer'
    CHECK (relationship_type IN ('manufacturer','brand_owner','oem','private_label','unknown')),
  verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('pending','unverified','verified')),
  external_item_id TEXT,
  evidence_reference TEXT,
  review_note TEXT,
  reviewed_by_user_id INTEGER,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE,
  FOREIGN KEY (manufacturer_id) REFERENCES inventory_manufacturers(manufacturer_id) ON DELETE RESTRICT,
  FOREIGN KEY (reviewed_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_manufacturer_links_manufacturer
  ON inventory_manufacturer_links(manufacturer_id,verification_status,site_item_inventory_id);

CREATE TABLE IF NOT EXISTS inventory_vendor_reviews (
  inventory_vendor_review_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_item_inventory_id INTEGER NOT NULL,
  manufacturer_id INTEGER,
  vendor_name TEXT,
  platform_code TEXT NOT NULL DEFAULT 'local',
  external_item_id TEXT,
  source_url TEXT,
  external_review_url TEXT,
  review_title TEXT,
  review_body TEXT NOT NULL,
  rating_value REAL CHECK (rating_value IS NULL OR (rating_value>=0 AND rating_value<=5)),
  review_date TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('pending','unverified','verified')),
  publication_status TEXT NOT NULL DEFAULT 'private'
    CHECK (publication_status IN ('private','internal','approved_public','archived')),
  created_by_user_id INTEGER,
  verified_by_user_id INTEGER,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_item_inventory_id) REFERENCES site_item_inventory(site_item_inventory_id) ON DELETE CASCADE,
  FOREIGN KEY (manufacturer_id) REFERENCES inventory_manufacturers(manufacturer_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (verified_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_vendor_reviews_item
  ON inventory_vendor_reviews(site_item_inventory_id,publication_status,review_date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_vendor_reviews_external
  ON inventory_vendor_reviews(platform_code,external_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_vendor_reviews_manufacturer
  ON inventory_vendor_reviews(manufacturer_id,publication_status,review_date DESC);

-- Existing products receive a truthful compatibility profile. Handmade history is not invented:
-- it remains legacy_pending/non-blocking until reconstructed. Outside finished goods are exempt.
INSERT OR IGNORE INTO product_lineage_profiles (
  product_id,origin_kind,lineage_status,publication_policy,materials_required,review_notes,created_at,updated_at
)
SELECT
  p.product_id,
  CASE
    WHEN LOWER(TRIM(COALESCE(p.merchandise_origin,'handmade')))='antique' THEN 'antiquity'
    WHEN LOWER(TRIM(COALESCE(p.merchandise_origin,'handmade'))) IN ('vintage','collectible','oddity') THEN 'resale'
    WHEN LOWER(TRIM(COALESCE(p.merchandise_origin,'handmade')))='prebuilt' THEN 'external_finished_good'
    ELSE 'legacy_pending'
  END,
  CASE
    WHEN LOWER(TRIM(COALESCE(p.merchandise_origin,'handmade'))) IN ('antique','vintage','collectible','oddity','prebuilt') THEN 'exempt'
    ELSE 'legacy_pending'
  END,
  CASE
    WHEN LOWER(TRIM(COALESCE(p.merchandise_origin,'handmade'))) IN ('antique','vintage','collectible','oddity','prebuilt') THEN 'exempt'
    ELSE 'legacy_nonblocking'
  END,
  CASE WHEN LOWER(TRIM(COALESCE(p.merchandise_origin,'handmade')))='handmade' THEN 1 ELSE 0 END,
  CASE
    WHEN LOWER(TRIM(COALESCE(p.merchandise_origin,'handmade')))='handmade' THEN 'Release 448 compatibility profile: historical handmade lineage remains pending until reconstructed; no consumption was fabricated.'
    ELSE 'Release 448 compatibility profile: externally sourced finished product is raw-material-lineage exempt.'
  END,
  CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM products p;

-- Every product created after this migration receives an origin policy automatically.
-- This is policy metadata only; it never changes inventory quantities.
CREATE TRIGGER IF NOT EXISTS trg_product_lineage_profile_after_insert
AFTER INSERT ON products
WHEN NOT EXISTS (SELECT 1 FROM product_lineage_profiles WHERE product_id=NEW.product_id)
BEGIN
  INSERT INTO product_lineage_profiles (
    product_id,origin_kind,lineage_status,publication_policy,materials_required,review_notes,created_at,updated_at
  ) VALUES (
    NEW.product_id,
    CASE
      WHEN LOWER(TRIM(COALESCE(NEW.merchandise_origin,'handmade')))='antique' THEN 'antiquity'
      WHEN LOWER(TRIM(COALESCE(NEW.merchandise_origin,'handmade'))) IN ('vintage','collectible','oddity') THEN 'resale'
      WHEN LOWER(TRIM(COALESCE(NEW.merchandise_origin,'handmade')))='prebuilt' THEN 'external_finished_good'
      ELSE 'made_in_house'
    END,
    CASE WHEN LOWER(TRIM(COALESCE(NEW.merchandise_origin,'handmade')))='handmade' THEN 'pending' ELSE 'exempt' END,
    CASE WHEN LOWER(TRIM(COALESCE(NEW.merchandise_origin,'handmade')))='handmade' THEN 'required' ELSE 'exempt' END,
    CASE WHEN LOWER(TRIM(COALESCE(NEW.merchandise_origin,'handmade')))='handmade' THEN 1 ELSE 0 END,
    CASE
      WHEN LOWER(TRIM(COALESCE(NEW.merchandise_origin,'handmade')))='handmade' THEN 'Release 448 new in-house product: raw Inventory lineage is required before publication.'
      ELSE 'Release 448 new externally sourced finished product: raw-material lineage is exempt.'
    END,
    CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
  );
END;

-- Resource review rows are optional evidence overlays. They reference the existing Product -> Tool/Supply links
-- and the existing operational Inventory authority; they never own quantities or consumption.
INSERT OR IGNORE INTO product_resource_lineage_reviews (
  product_id,product_resource_link_id,site_item_inventory_id,resource_role,verification_status,review_note,created_at,updated_at
)
SELECT
  prl.product_id,
  prl.product_resource_link_id,
  sii.site_item_inventory_id,
  CASE WHEN LOWER(TRIM(COALESCE(prl.resource_kind,'')))='tool' THEN 'tool' ELSE 'material' END,
  CASE WHEN sii.site_item_inventory_id IS NULL THEN 'unverified' ELSE 'legacy_pending' END,
  'Release 448 compatibility review row; existing Product resource link preserved without inventing historical use.',
  CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM product_resource_links prl
LEFT JOIN site_item_inventory sii
  ON sii.site_item_inventory_id=(
    SELECT sii2.site_item_inventory_id
    FROM site_item_inventory sii2
    WHERE COALESCE(sii2.is_active,1)=1
      AND LOWER(TRIM(COALESCE(sii2.source_type,'')))=LOWER(TRIM(COALESCE(prl.resource_kind,'')))
      AND LOWER(TRIM(COALESCE(sii2.external_key,'')))=LOWER(TRIM(COALESCE(prl.source_key,'')))
    ORDER BY sii2.site_item_inventory_id DESC
    LIMIT 1
  );

SELECT name FROM sqlite_master WHERE type='table' AND name IN ('product_lineage_profiles','product_resource_lineage_reviews','inventory_manufacturers','inventory_manufacturer_links','inventory_vendor_reviews') ORDER BY name;
SELECT origin_kind,lineage_status,publication_policy,COUNT(*) AS product_count FROM product_lineage_profiles GROUP BY origin_kind,lineage_status,publication_policy ORDER BY origin_kind,lineage_status;
PRAGMA foreign_key_check;
