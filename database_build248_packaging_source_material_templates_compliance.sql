-- Devil n Dove Build 248 — Purchased source-material templates, soap-base inheritance, supplier evidence, and 2026 Canadian fragrance-allergen review gates.
-- Run after Build 247. Back up D1 first. Additive and idempotent.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS packaging_source_material_templates (
  packaging_source_material_template_id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_key TEXT NOT NULL UNIQUE,
  material_name TEXT NOT NULL,
  material_type TEXT NOT NULL DEFAULT 'soap_base' CHECK(material_type IN ('soap_base','fragrance_oil','colourant','additive')),
  supplier_name TEXT,
  supplier_sku TEXT,
  supplier_product_name TEXT,
  source_url TEXT,
  source_image_url TEXT,
  supplier_document_url TEXT,
  source_reference TEXT,
  intended_use TEXT NOT NULL DEFAULT 'rinse_off' CHECK(intended_use IN ('rinse_off','leave_on','both','not_applicable')),
  ingredient_declaration_raw TEXT,
  master_inci_json TEXT NOT NULL DEFAULT '[]',
  allergen_statement TEXT,
  fragrance_allergens_json TEXT NOT NULL DEFAULT '[]',
  fragrance_allergen_review_status TEXT NOT NULL DEFAULT 'not_applicable' CHECK(fragrance_allergen_review_status IN ('not_applicable','needs_supplier_data','needs_review','reviewed')),
  benefits_json TEXT NOT NULL DEFAULT '[]',
  supplier_claims_json TEXT NOT NULL DEFAULT '[]',
  usage_notes TEXT,
  compliance_notes TEXT,
  verification_status TEXT NOT NULL DEFAULT 'needs_review' CHECK(verification_status IN ('needs_review','supplier_verified','owner_verified','blocked')),
  verified_by_user_id INTEGER,
  verified_at TEXT,
  is_system INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_packaging_source_material_templates_type
  ON packaging_source_material_templates(material_type,is_active,LOWER(material_name));
CREATE INDEX IF NOT EXISTS idx_packaging_source_material_templates_supplier
  ON packaging_source_material_templates(LOWER(COALESCE(supplier_name,'')),LOWER(material_name));

CREATE TABLE IF NOT EXISTS packaging_project_source_materials (
  packaging_project_source_material_id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_project_id INTEGER NOT NULL,
  packaging_source_material_template_id INTEGER NOT NULL,
  material_role TEXT NOT NULL DEFAULT 'base' CHECK(material_role IN ('base','fragrance','colourant','additive')),
  sort_order INTEGER NOT NULL DEFAULT 1,
  source_snapshot_json TEXT NOT NULL DEFAULT '{}',
  review_status TEXT NOT NULL DEFAULT 'needs_review' CHECK(review_status IN ('needs_review','reviewed','blocked')),
  notes TEXT,
  created_by_user_id INTEGER,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(packaging_project_id,packaging_source_material_template_id,material_role),
  FOREIGN KEY(packaging_project_id) REFERENCES packaging_projects(packaging_project_id) ON DELETE CASCADE,
  FOREIGN KEY(packaging_source_material_template_id) REFERENCES packaging_source_material_templates(packaging_source_material_template_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_packaging_project_source_materials_project
  ON packaging_project_source_materials(packaging_project_id,material_role,sort_order);

CREATE TABLE IF NOT EXISTS packaging_formula_source_material_links (
  packaging_formula_source_material_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_formula_library_id INTEGER NOT NULL,
  packaging_source_material_template_id INTEGER NOT NULL,
  material_role TEXT NOT NULL DEFAULT 'base' CHECK(material_role IN ('base','fragrance','colourant','additive')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(packaging_formula_library_id,packaging_source_material_template_id,material_role),
  FOREIGN KEY(packaging_formula_library_id) REFERENCES packaging_formula_library(packaging_formula_library_id) ON DELETE CASCADE,
  FOREIGN KEY(packaging_source_material_template_id) REFERENCES packaging_source_material_templates(packaging_source_material_template_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_packaging_formula_source_material_links_formula
  ON packaging_formula_source_material_links(packaging_formula_library_id,material_role);

INSERT INTO packaging_source_material_templates(
  material_key,material_name,material_type,supplier_name,supplier_product_name,source_reference,intended_use,
  ingredient_declaration_raw,master_inci_json,allergen_statement,fragrance_allergens_json,fragrance_allergen_review_status,
  benefits_json,supplier_claims_json,usage_notes,compliance_notes,verification_status,is_system,is_active
) VALUES (
  'goats-milk-melt-pour-base-owner-source-v1',
  'Goat’s Milk Melt & Pour Soap Base — supplier template',
  'soap_base',
  NULL,
  'Glycerine Soap Base - Goat''s milk',
  'Owner-provided supplier/product information, 2026-08-11',
  'rinse_off',
  'Coconut Oil, Sorbitol, Vegetable Propylene Glycol, Stearic Acid, Water, Sodium Hydroxide, Vegetable Glycerin, Goat Milk, Titanium Dioxide.',
  '[{"sort_order":1,"inci_name":"Coconut Oil","display_name_en":"Coconut Oil","display_name_fr":"Coconut Oil","required_on_label":1,"verification_status":"needs_review"},{"sort_order":2,"inci_name":"Sorbitol","display_name_en":"Sorbitol","display_name_fr":"Sorbitol","required_on_label":1,"verification_status":"needs_review"},{"sort_order":3,"inci_name":"Vegetable Propylene Glycol","display_name_en":"Vegetable Propylene Glycol","display_name_fr":"Vegetable Propylene Glycol","required_on_label":1,"verification_status":"needs_review"},{"sort_order":4,"inci_name":"Stearic Acid","display_name_en":"Stearic Acid","display_name_fr":"Stearic Acid","required_on_label":1,"verification_status":"needs_review"},{"sort_order":5,"inci_name":"Water","display_name_en":"Water","display_name_fr":"Water","required_on_label":1,"verification_status":"needs_review"},{"sort_order":6,"inci_name":"Sodium Hydroxide","display_name_en":"Sodium Hydroxide","display_name_fr":"Sodium Hydroxide","required_on_label":1,"verification_status":"needs_review"},{"sort_order":7,"inci_name":"Vegetable Glycerin","display_name_en":"Vegetable Glycerin","display_name_fr":"Vegetable Glycerin","required_on_label":1,"verification_status":"needs_review"},{"sort_order":8,"inci_name":"Goat Milk","display_name_en":"Goat Milk","display_name_fr":"Goat Milk","required_on_label":1,"verification_status":"needs_review"},{"sort_order":9,"inci_name":"Titanium Dioxide","display_name_en":"Titanium Dioxide","display_name_fr":"Titanium Dioxide","required_on_label":1,"verification_status":"needs_review"}]',
  'Supplier statement provided by owner: Glycerine Soap Base - Goat''s milk does not contain any of the eight major allergens listed by the supplier: soy, eggs, peanut, wheat, tree nuts, fish, and crustacean fish.',
  '[]',
  'not_applicable',
  '[{"title":"Make the unique gift","body":"Melt and pour layer soaps can be customized with colour and scent and used for handmade gifts; supplier describes layered soaps as suitable for gifts and craft projects.","label_candidate":0},{"title":"Easy to work with","body":"Supplier describes melt and pour soap as beginner-friendly: melt the premade base, customize with colours and scents, and pour into a mold; layers and swirls can be explored later.","label_candidate":0},{"title":"Great family time spending","body":"Supplier presents melt and pour soap making as a family craft activity.","label_candidate":0},{"title":"Beneficial to your skin","body":"Supplier compares glycerin levels and skin feel of melt-and-pour and cold-process soaps. Treat this as supplier marketing evidence only; review before making any consumer-facing claim.","label_candidate":0},{"title":"Safe to work with","body":"Supplier notes that the base has already incorporated the lye during manufacture, so the melt-and-pour user does not handle raw lye as part of remelting/customizing the base.","label_candidate":0},{"title":"Ready to use instantly","body":"Supplier states that melt-and-pour soap does not require the curing period associated with cold-process soap and can be used after unmolding; longer standing may make the bar harder and milder.","label_candidate":0}]',
  '[{"claim_en":"Melt & Pour Soap Base","claim_fr":"Base de savon à faire fondre et couler","icon_name":"hands","label_candidate":0,"compliance_note":"Supplier/source characteristic only. Review before using on finished-product packaging."}]',
  'Owner indicated this is commonly purchased as a 10 lb soap base. Supplier-specific SKU, URL, lot and documentation should be added when available. Finished soap may also contain fragrance, colourants or other additives that must be added separately.',
  'The supplier ingredient wording is preserved as provided and is not automatically treated as verified INCI. The supplied allergen statement also needs source review: it calls itself an eight-major-allergen statement but the supplied list names seven categories and omits milk even though this base contains goat milk, so do not use it as a consumer-facing allergen-free claim without verification. Health Canada cosmetic labels require an INCI ingredient list. New cosmetics sold in Canada from 2026-08-01 are also subject to the expanded fragrance-allergen disclosure list when thresholds are exceeded; this soap-base template itself contains no fragrance-allergen declaration.',
  'needs_review',1,1
)
ON CONFLICT(material_key) DO UPDATE SET
  material_name=excluded.material_name,material_type=excluded.material_type,supplier_name=excluded.supplier_name,
  supplier_product_name=excluded.supplier_product_name,source_reference=excluded.source_reference,intended_use=excluded.intended_use,
  ingredient_declaration_raw=excluded.ingredient_declaration_raw,master_inci_json=excluded.master_inci_json,
  allergen_statement=excluded.allergen_statement,fragrance_allergens_json=excluded.fragrance_allergens_json,
  fragrance_allergen_review_status=excluded.fragrance_allergen_review_status,benefits_json=excluded.benefits_json,
  supplier_claims_json=excluded.supplier_claims_json,usage_notes=excluded.usage_notes,compliance_notes=excluded.compliance_notes,
  verification_status=excluded.verification_status,is_system=1,is_active=1,updated_at=CURRENT_TIMESTAMP;

INSERT INTO app_settings(setting_key,setting_value,is_public)
VALUES ('site.packaging.source_material_policy','supplier_source_template_plus_finished_formula_inheritance_v248',0)
ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,is_public=0;

INSERT INTO app_settings(setting_key,setting_value,is_public)
VALUES ('site.packaging.canada_fragrance_allergen_policy','2026_new_cosmetics_list2_rinse_off_0.01pct_leave_on_0.001pct_review_gate_v248',0)
ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,is_public=0;

INSERT INTO schema_migration_ledger(migration_key,file_name,checksum,status,destructive,applied_at,notes,created_at,updated_at)
VALUES (
  'build248_packaging_source_material_templates_compliance',
  'database_build248_packaging_source_material_templates_compliance.sql',
  NULL,'applied',0,CURRENT_TIMESTAMP,
  'Adds reusable purchased source-material templates for soap bases, fragrance oils, colourants and additives; preserves supplier ingredients/allergens/benefits separately from finished formulas; links sources to projects/formulas; seeds the owner-provided goat-milk melt-and-pour base; and adds the current Canadian fragrance-allergen review policy without auto-approving supplier marketing claims.',
  CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
)
ON CONFLICT(migration_key) DO UPDATE SET
  file_name=excluded.file_name,status='applied',destructive=0,
  applied_at=COALESCE(schema_migration_ledger.applied_at,CURRENT_TIMESTAMP),
  notes=excluded.notes,updated_at=CURRENT_TIMESTAMP;
