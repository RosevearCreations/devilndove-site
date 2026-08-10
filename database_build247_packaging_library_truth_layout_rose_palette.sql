-- Devil n Dove Build 247 — Packaging Studio label deletion, rose palette, Truth-layout repair, and reusable content libraries.
-- Run after Build 246. Back up D1 first. Additive except for explicit owner-requested project deletion through the admin API.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS packaging_formula_library (
  packaging_formula_library_id INTEGER PRIMARY KEY AUTOINCREMENT,
  formula_key TEXT NOT NULL UNIQUE,
  formula_name TEXT NOT NULL,
  product_family TEXT,
  product_identity_en TEXT,
  product_identity_fr TEXT,
  default_rose_asset_id TEXT,
  default_rose_colour TEXT,
  ingredients_json TEXT NOT NULL DEFAULT '[]',
  notes TEXT,
  is_system INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_packaging_formula_library_active
  ON packaging_formula_library(is_active, LOWER(formula_name));

CREATE TABLE IF NOT EXISTS packaging_content_library (
  packaging_content_library_id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK(content_type IN ('ingredient','fragrance_oil','colourant','claim')),
  item_name TEXT NOT NULL,
  text_en TEXT,
  text_fr TEXT,
  inci_name TEXT,
  icon_name TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  is_system INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_packaging_content_library_type
  ON packaging_content_library(content_type, is_active, LOWER(item_name));

INSERT INTO packaging_formula_library(
  formula_key,formula_name,product_family,product_identity_en,product_identity_fr,
  default_rose_asset_id,default_rose_colour,ingredients_json,notes,is_system,is_active
) VALUES (
  'health-oatmeal-goat-milk-v1',
  'Health Oatmeal & Goat Milk',
  'Health Oatmeal & Goat Milk',
  'Oatmeal & Goat Milk Soap',
  'Savon à l’avoine et au lait de chèvre',
  'rose-oatmeal-v1',
  '#C9B18A',
  '[{"sort_order":1,"inci_name":"Water","display_name_en":"Water","display_name_fr":"Water","organic_flag":0,"allergen_note":"","required_on_label":1},{"sort_order":2,"inci_name":"Glycerin","display_name_en":"Glycerin","display_name_fr":"Glycerin","organic_flag":0,"allergen_note":"","required_on_label":1},{"sort_order":3,"inci_name":"Sorbitol","display_name_en":"Sorbitol","display_name_fr":"Sorbitol","organic_flag":0,"allergen_note":"","required_on_label":1},{"sort_order":4,"inci_name":"Olive Oil","display_name_en":"Olive Oil","display_name_fr":"Olive Oil","organic_flag":0,"allergen_note":"","required_on_label":1},{"sort_order":5,"inci_name":"Coconut oil","display_name_en":"Coconut oil","display_name_fr":"Coconut oil","organic_flag":0,"allergen_note":"","required_on_label":1},{"sort_order":6,"inci_name":"Sodium Stearate","display_name_en":"Sodium Stearate","display_name_fr":"Sodium Stearate","organic_flag":0,"allergen_note":"","required_on_label":1},{"sort_order":7,"inci_name":"Sodium Cocoate","display_name_en":"Sodium Cocoate","display_name_fr":"Sodium Cocoate","organic_flag":0,"allergen_note":"","required_on_label":1},{"sort_order":8,"inci_name":"Propanediol","display_name_en":"Propanediol","display_name_fr":"Propanediol","organic_flag":0,"allergen_note":"","required_on_label":1},{"sort_order":9,"inci_name":"Styrene/Acrylates Copolymer","display_name_en":"Styrene/Acrylates Copolymer","display_name_fr":"Styrene/Acrylates Copolymer","organic_flag":0,"allergen_note":"","required_on_label":1},{"sort_order":10,"inci_name":"Avena Sativa Kernel Extract","display_name_en":"Avena Sativa Kernel Extract","display_name_fr":"Avena Sativa Kernel Extract","organic_flag":0,"allergen_note":"","required_on_label":1},{"sort_order":11,"inci_name":"Sodium Chloride","display_name_en":"Sodium Chloride","display_name_fr":"Sodium Chloride","organic_flag":0,"allergen_note":"","required_on_label":1},{"sort_order":12,"inci_name":"Butyrospermum Parkii Butter","display_name_en":"Butyrospermum Parkii Butter","display_name_fr":"Butyrospermum Parkii Butter","organic_flag":0,"allergen_note":"","required_on_label":1},{"sort_order":13,"inci_name":"Tetrasodium Glutamate Diacetate","display_name_en":"Tetrasodium Glutamate Diacetate","display_name_fr":"Tetrasodium Glutamate Diacetate","organic_flag":0,"allergen_note":"","required_on_label":1},{"sort_order":14,"inci_name":"Isoamyl Laurate","display_name_en":"Isoamyl Laurate","display_name_fr":"Isoamyl Laurate","organic_flag":0,"allergen_note":"","required_on_label":1},{"sort_order":15,"inci_name":"Trideceth-50","display_name_en":"Trideceth-50","display_name_fr":"Trideceth-50","organic_flag":0,"allergen_note":"","required_on_label":1},{"sort_order":16,"inci_name":"Sodium Lauryl Sulfate","display_name_en":"Sodium Lauryl Sulfate","display_name_fr":"Sodium Lauryl Sulfate","organic_flag":0,"allergen_note":"","required_on_label":1}]',
  'Owner-provided ingredient breakdown. The source note “*Organic” is preserved here but no individual ingredient is automatically marked organic; verify the supplier/source meaning before printing or approving an organic claim.',
  1,1
)
ON CONFLICT(formula_key) DO UPDATE SET
  formula_name=excluded.formula_name,
  product_family=excluded.product_family,
  product_identity_en=excluded.product_identity_en,
  product_identity_fr=excluded.product_identity_fr,
  default_rose_asset_id=excluded.default_rose_asset_id,
  default_rose_colour=excluded.default_rose_colour,
  ingredients_json=excluded.ingredients_json,
  notes=excluded.notes,
  is_system=1,is_active=1,updated_at=CURRENT_TIMESTAMP;

INSERT INTO packaging_content_library(
  content_key,content_type,item_name,text_en,text_fr,inci_name,icon_name,metadata_json,is_system,is_active
) VALUES
('claim-natural-ingredients','claim','Natural Ingredients','Natural Ingredients','Ingrédients naturels',NULL,'leaf','{}',1,1),
('claim-handmade-with-care','claim','Handmade with Care','Handmade with Care','Fait à la main avec soin',NULL,'hands','{}',1,1),
('claim-gentle-moisturizing','claim','Gentle & Moisturizing','Gentle & Moisturizing','Doux et hydratant',NULL,'leaf','{}',1,1),
('claim-please-recycle','claim','Please Recycle','Please Recycle','Veuillez recycler',NULL,'recycle','{}',1,1),
('ingredient-water','ingredient','Water','Water','Water','Water',NULL,'{"source":"Health Oatmeal & Goat Milk owner-provided formula"}',1,1),
('ingredient-glycerin','ingredient','Glycerin','Glycerin','Glycerin','Glycerin',NULL,'{"source":"Health Oatmeal & Goat Milk owner-provided formula"}',1,1),
('ingredient-sorbitol','ingredient','Sorbitol','Sorbitol','Sorbitol','Sorbitol',NULL,'{"source":"Health Oatmeal & Goat Milk owner-provided formula"}',1,1),
('ingredient-olive-oil','ingredient','Olive Oil','Olive Oil','Olive Oil','Olive Oil',NULL,'{"source":"Health Oatmeal & Goat Milk owner-provided formula"}',1,1),
('ingredient-coconut-oil','ingredient','Coconut oil','Coconut oil','Coconut oil','Coconut oil',NULL,'{"source":"Health Oatmeal & Goat Milk owner-provided formula"}',1,1),
('ingredient-sodium-stearate','ingredient','Sodium Stearate','Sodium Stearate','Sodium Stearate','Sodium Stearate',NULL,'{"source":"Health Oatmeal & Goat Milk owner-provided formula"}',1,1),
('ingredient-sodium-cocoate','ingredient','Sodium Cocoate','Sodium Cocoate','Sodium Cocoate','Sodium Cocoate',NULL,'{"source":"Health Oatmeal & Goat Milk owner-provided formula"}',1,1),
('ingredient-propanediol','ingredient','Propanediol','Propanediol','Propanediol','Propanediol',NULL,'{"source":"Health Oatmeal & Goat Milk owner-provided formula"}',1,1),
('ingredient-styrene-acrylates-copolymer','ingredient','Styrene/Acrylates Copolymer','Styrene/Acrylates Copolymer','Styrene/Acrylates Copolymer','Styrene/Acrylates Copolymer',NULL,'{"source":"Health Oatmeal & Goat Milk owner-provided formula"}',1,1),
('ingredient-avena-sativa-kernel-extract','ingredient','Avena Sativa Kernel Extract','Avena Sativa Kernel Extract','Avena Sativa Kernel Extract','Avena Sativa Kernel Extract',NULL,'{"source":"Health Oatmeal & Goat Milk owner-provided formula"}',1,1),
('ingredient-sodium-chloride','ingredient','Sodium Chloride','Sodium Chloride','Sodium Chloride','Sodium Chloride',NULL,'{"source":"Health Oatmeal & Goat Milk owner-provided formula"}',1,1),
('ingredient-butyrospermum-parkii-butter','ingredient','Butyrospermum Parkii Butter','Butyrospermum Parkii Butter','Butyrospermum Parkii Butter','Butyrospermum Parkii Butter',NULL,'{"source":"Health Oatmeal & Goat Milk owner-provided formula"}',1,1),
('ingredient-tetrasodium-glutamate-diacetate','ingredient','Tetrasodium Glutamate Diacetate','Tetrasodium Glutamate Diacetate','Tetrasodium Glutamate Diacetate','Tetrasodium Glutamate Diacetate',NULL,'{"source":"Health Oatmeal & Goat Milk owner-provided formula"}',1,1),
('ingredient-isoamyl-laurate','ingredient','Isoamyl Laurate','Isoamyl Laurate','Isoamyl Laurate','Isoamyl Laurate',NULL,'{"source":"Health Oatmeal & Goat Milk owner-provided formula"}',1,1),
('ingredient-trideceth-50','ingredient','Trideceth-50','Trideceth-50','Trideceth-50','Trideceth-50',NULL,'{"source":"Health Oatmeal & Goat Milk owner-provided formula"}',1,1),
('ingredient-sodium-lauryl-sulfate','ingredient','Sodium Lauryl Sulfate','Sodium Lauryl Sulfate','Sodium Lauryl Sulfate','Sodium Lauryl Sulfate',NULL,'{"source":"Health Oatmeal & Goat Milk owner-provided formula"}',1,1)
ON CONFLICT(content_key) DO UPDATE SET
  content_type=excluded.content_type,
  item_name=excluded.item_name,
  text_en=excluded.text_en,
  text_fr=excluded.text_fr,
  inci_name=excluded.inci_name,
  icon_name=excluded.icon_name,
  metadata_json=excluded.metadata_json,
  is_system=1,is_active=1,updated_at=CURRENT_TIMESTAMP;

-- The soap rose is selected independently from generic/custom artwork. This removes the old purple-only template fallback.
UPDATE packaging_templates
SET layout_json='{"sections":["ingredients_en","front_oval","ingredients_fr","rear_seal","claims_weight","overlap"],"band_height_mm":19.05,"artboard_height_mm":38.1,"front_style":"truth_reference_oval","design_profile":"soap_reference_v2","shape":"soap_wrap","rose_asset_mode":"palette","rear_circle_spec_mm":50,"rear_circle_render_mm":38.1,"dimension_profile":"photo_fit","bleed_in":0.125,"safe_margin_in":0.0625}',
    updated_at=CURRENT_TIMESTAMP
WHERE template_key='soap-ribbon-glacial-approved-v1';

UPDATE packaging_templates
SET layout_json='{"sections":["ingredients_en","front_oval","ingredients_fr","rear_seal","claims_weight","overlap"],"band_height_mm":19.05,"artboard_height_mm":50,"front_style":"truth_reference_oval","design_profile":"soap_reference_v2","shape":"soap_wrap","rose_asset_mode":"palette","rear_circle_spec_mm":50,"rear_circle_render_mm":50,"dimension_profile":"50mm_seal","bleed_in":0.125,"safe_margin_in":0.0625}',
    updated_at=CURRENT_TIMESTAMP
WHERE template_key='soap-ribbon-spec-50mm-seal-v1';

INSERT INTO app_settings(setting_key,setting_value,is_public)
VALUES ('site.packaging.rose_palette_policy','botanical_palette_plus_custom_colour_v247',0)
ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,is_public=0;

INSERT INTO app_settings(setting_key,setting_value,is_public)
VALUES ('site.packaging.library_policy','persistent_formula_ingredient_fragrance_colourant_claim_library_v247',0)
ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,is_public=0;

INSERT INTO app_settings(setting_key,setting_value,is_public)
VALUES ('site.packaging.project_delete_policy','typed_project_key_confirmation_v247',0)
ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,is_public=0;

INSERT INTO schema_migration_ledger(migration_key,file_name,checksum,status,destructive,applied_at,notes,created_at,updated_at)
VALUES (
  'build247_packaging_library_truth_layout_rose_palette',
  'database_build247_packaging_library_truth_layout_rose_palette.sql',
  NULL,'applied',0,CURRENT_TIMESTAMP,
  'Adds persistent packaging formula/content libraries, seeds the owner-provided Health Oatmeal & Goat Milk formula and four bilingual claim presets, removes the purple-only soap template artwork fallback, and records the typed-confirm Packaging Studio deletion policy. Actual project deletion occurs only from the explicit admin action.',
  CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
)
ON CONFLICT(migration_key) DO UPDATE SET
  file_name=excluded.file_name,status='applied',destructive=0,
  applied_at=COALESCE(schema_migration_ledger.applied_at,CURRENT_TIMESTAMP),
  notes=excluded.notes,updated_at=CURRENT_TIMESTAMP;
