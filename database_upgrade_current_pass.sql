-- Build 222 — Soap Label Automation normalization, print proof evidence, exact template profiles, and startup-readiness documentation support.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS soap_label_templates (
  template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_template_id INTEGER NOT NULL UNIQUE,
  template_name TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  artboard_width_in REAL NOT NULL DEFAULT 11.0,
  artboard_height_in REAL NOT NULL DEFAULT 1.5,
  band_height_in REAL NOT NULL DEFAULT 0.75,
  front_oval_width_in REAL NOT NULL DEFAULT 2.0,
  front_oval_height_in REAL NOT NULL DEFAULT 1.5,
  rear_circle_mm REAL NOT NULL DEFAULT 38.1,
  bleed_in REAL NOT NULL DEFAULT 0.125,
  safe_margin_in REAL NOT NULL DEFAULT 0.0625,
  dimension_profile TEXT NOT NULL DEFAULT 'photo_fit',
  background_style TEXT NOT NULL DEFAULT 'cream_damask',
  default_font_set TEXT NOT NULL DEFAULT 'devil_dove_vintage',
  default_gold_colour TEXT NOT NULL DEFAULT '#B88A2F',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(packaging_template_id) REFERENCES packaging_templates(packaging_template_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS soap_products (
  soap_product_id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_project_id INTEGER NOT NULL UNIQUE,
  product_id INTEGER,
  product_name TEXT NOT NULL,
  product_family TEXT,
  soap_type TEXT,
  description_en TEXT,
  description_fr TEXT,
  net_weight_oz REAL,
  net_weight_g REAL,
  accent_colour TEXT,
  secondary_colour TEXT,
  rose_colour TEXT,
  rose_asset_id TEXT NOT NULL DEFAULT 'rose-purple-v1',
  website TEXT NOT NULL DEFAULT 'devilndove.com',
  made_in_text_en TEXT NOT NULL DEFAULT 'Made in Canada',
  made_in_text_fr TEXT NOT NULL DEFAULT 'Fabriqué au Canada',
  print_status TEXT NOT NULL DEFAULT 'draft',
  compliance_status TEXT NOT NULL DEFAULT 'needs_review',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(packaging_project_id) REFERENCES packaging_projects(packaging_project_id) ON DELETE CASCADE,
  FOREIGN KEY(product_id) REFERENCES products(product_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_soap_products_product ON soap_products(product_id, active);

CREATE TABLE IF NOT EXISTS soap_ingredients (
  ingredient_id INTEGER PRIMARY KEY AUTOINCREMENT,
  soap_product_id INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  inci_name TEXT,
  display_name_en TEXT,
  display_name_fr TEXT,
  organic_flag INTEGER NOT NULL DEFAULT 0,
  allergen_note TEXT,
  required_on_label INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(soap_product_id) REFERENCES soap_products(soap_product_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_soap_ingredients_product ON soap_ingredients(soap_product_id, sort_order, ingredient_id);

CREATE TABLE IF NOT EXISTS soap_label_claims (
  claim_id INTEGER PRIMARY KEY AUTOINCREMENT,
  soap_product_id INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  claim_en TEXT NOT NULL,
  claim_fr TEXT NOT NULL,
  icon_name TEXT,
  is_approved INTEGER NOT NULL DEFAULT 0,
  compliance_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(soap_product_id) REFERENCES soap_products(soap_product_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_soap_label_claims_product ON soap_label_claims(soap_product_id, sort_order, claim_id);

CREATE TABLE IF NOT EXISTS soap_label_exports (
  export_id INTEGER PRIMARY KEY AUTOINCREMENT,
  soap_product_id INTEGER NOT NULL,
  template_id INTEGER NOT NULL,
  packaging_project_version_id INTEGER,
  version TEXT,
  export_format TEXT NOT NULL,
  file_name TEXT NOT NULL,
  svg_url TEXT,
  pdf_url TEXT,
  png_url TEXT,
  webp_url TEXT,
  checksum TEXT,
  generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  generated_by INTEGER,
  approval_status TEXT NOT NULL DEFAULT 'prepared',
  print_test_status TEXT NOT NULL DEFAULT 'not_tested',
  notes TEXT,
  FOREIGN KEY(soap_product_id) REFERENCES soap_products(soap_product_id) ON DELETE CASCADE,
  FOREIGN KEY(template_id) REFERENCES soap_label_templates(template_id) ON DELETE RESTRICT,
  FOREIGN KEY(packaging_project_version_id) REFERENCES packaging_project_versions(packaging_project_version_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_soap_label_exports_product ON soap_label_exports(soap_product_id, generated_at DESC);

CREATE TABLE IF NOT EXISTS soap_label_print_tests (
  print_test_id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_project_id INTEGER NOT NULL,
  packaging_project_version_id INTEGER,
  test_status TEXT NOT NULL DEFAULT 'needs_test',
  printed_at TEXT,
  printer_name TEXT,
  paper_stock TEXT,
  scale_percent REAL NOT NULL DEFAULT 100,
  measured_strip_width_in REAL,
  measured_band_height_in REAL,
  measured_front_width_in REAL,
  measured_front_height_in REAL,
  measured_rear_circle_mm REAL,
  wrap_fit_status TEXT NOT NULL DEFAULT 'not_checked',
  legibility_status TEXT NOT NULL DEFAULT 'not_checked',
  overlap_status TEXT NOT NULL DEFAULT 'not_checked',
  proof_image_url TEXT,
  notes TEXT,
  reviewed_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(packaging_project_id) REFERENCES packaging_projects(packaging_project_id) ON DELETE CASCADE,
  FOREIGN KEY(packaging_project_version_id) REFERENCES packaging_project_versions(packaging_project_version_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_soap_label_print_tests_project ON soap_label_print_tests(packaging_project_id, created_at DESC);

-- Exact photo-match profile: the overall artboard and front oval follow the approved image/spec.
-- The rear seal is 38.1 mm so it fits the 38.1 mm artboard. A separate 50 mm profile is seeded below because the supplied specification contains a physical conflict between a 38.1 mm artboard and a 50 mm rear circle.
INSERT OR IGNORE INTO packaging_templates (
  template_key,template_name,package_type,description,page_width_mm,page_height_mm,front_width_mm,front_height_mm,rear_width_mm,rear_height_mm,layout_json,theme_json,is_system,is_active
) VALUES (
  'soap-ribbon-glacial-approved-v1',
  'Soap ribbon — Glacial Purple approved photo layout',
  'soap_ribbon',
  'Photo-matched continuous ribbon: English ingredients, 2 × 1.5 inch front oval with rose, French ingredients, rear seal, bilingual claims and net weight. The 0.75 inch band is centred in the 1.5 inch artboard.',
  279.4,38.1,50.8,38.1,38.1,38.1,
  '{"sections":["ingredients_en","front_oval","ingredients_fr","rear_seal","claims_weight","overlap"],"band_height_mm":19.05,"artboard_height_mm":38.1,"front_style":"glacial_photo_oval","rear_circle_spec_mm":50,"rear_circle_render_mm":38.1,"dimension_profile":"photo_fit","bleed_in":0.125,"safe_margin_in":0.0625}',
  '{"rose_colour":"#7B4DA6","theme_colour":"#FBF5E8","border_colour":"#32105E","accent_gold":"#B88A2F","secondary_colour":"#5A2A86"}',
  1,1
);

INSERT OR IGNORE INTO packaging_templates (
  template_key,template_name,package_type,description,page_width_mm,page_height_mm,front_width_mm,front_height_mm,rear_width_mm,rear_height_mm,layout_json,theme_json,is_system,is_active
) VALUES (
  'soap-ribbon-spec-50mm-seal-v1',
  'Soap ribbon — 50 mm rear-seal specification profile',
  'soap_ribbon',
  'Uses a 50 mm-high artboard so the specified 50 mm rear circle is not clipped. Requires physical review because the supplied specification also states a 1.5 inch overall artboard.',
  279.4,50,50.8,38.1,50,50,
  '{"sections":["ingredients_en","front_oval","ingredients_fr","rear_seal","claims_weight","overlap"],"band_height_mm":19.05,"artboard_height_mm":50,"front_style":"glacial_photo_oval","rear_circle_spec_mm":50,"rear_circle_render_mm":50,"dimension_profile":"50mm_seal","bleed_in":0.125,"safe_margin_in":0.0625}',
  '{"rose_colour":"#7B4DA6","theme_colour":"#FBF5E8","border_colour":"#32105E","accent_gold":"#B88A2F","secondary_colour":"#5A2A86"}',
  1,1
);

INSERT OR IGNORE INTO soap_label_templates (
  packaging_template_id,template_name,version,artboard_width_in,artboard_height_in,band_height_in,front_oval_width_in,front_oval_height_in,rear_circle_mm,bleed_in,safe_margin_in,dimension_profile,background_style,default_font_set,default_gold_colour,is_active
)
SELECT packaging_template_id,template_name,'1.1',11.0,1.5,0.75,2.0,1.5,38.1,0.125,0.0625,'photo_fit','cream_damask','devil_dove_vintage','#B88A2F',1
FROM packaging_templates WHERE template_key='soap-ribbon-glacial-approved-v1';

INSERT OR IGNORE INTO soap_label_templates (
  packaging_template_id,template_name,version,artboard_width_in,artboard_height_in,band_height_in,front_oval_width_in,front_oval_height_in,rear_circle_mm,bleed_in,safe_margin_in,dimension_profile,background_style,default_font_set,default_gold_colour,is_active
)
SELECT packaging_template_id,template_name,'1.1',11.0,1.96850394,0.75,2.0,1.5,50.0,0.125,0.0625,'50mm_seal','cream_damask','devil_dove_vintage','#B88A2F',1
FROM packaging_templates WHERE template_key='soap-ribbon-spec-50mm-seal-v1';

UPDATE packaging_templates
SET page_width_mm=279.4,
    page_height_mm=38.1,
    front_width_mm=50.8,
    front_height_mm=38.1,
    rear_width_mm=38.1,
    rear_height_mm=38.1,
    layout_json='{"sections":["ingredients_en","front_oval","ingredients_fr","rear_seal","claims_weight","overlap"],"band_height_mm":19.05,"artboard_height_mm":38.1,"front_style":"glacial_photo_oval","rear_circle_spec_mm":50,"rear_circle_render_mm":38.1,"dimension_profile":"photo_fit","bleed_in":0.125,"safe_margin_in":0.0625}',
    description='Build 222 exact photo-layout profile. The 0.75 inch band and 2 × 1.5 inch front oval are centred in the 11 × 1.5 inch artboard. Rear seal is rendered at 38.1 mm to fit; use the separate 50 mm profile when the larger seal is required.',
    updated_at=CURRENT_TIMESTAMP
WHERE template_key='soap-ribbon-scalloped-reference-v1';
