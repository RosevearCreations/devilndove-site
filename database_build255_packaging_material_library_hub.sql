-- Devil n Dove Build 255 — Packaging Material Library hub, source categories and independent Master INCI editing.
-- Run after Build 254. Back up D1 first. Additive and idempotent.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS packaging_source_material_metadata (
  packaging_source_material_template_id INTEGER PRIMARY KEY,
  product_family TEXT NOT NULL DEFAULT 'general',
  material_subtype TEXT NOT NULL DEFAULT 'other',
  default_role TEXT NOT NULL DEFAULT 'additive' CHECK(default_role IN ('base','fragrance','colourant','additive')),
  colour_hex TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(packaging_source_material_template_id) REFERENCES packaging_source_material_templates(packaging_source_material_template_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_packaging_source_material_metadata_family
  ON packaging_source_material_metadata(product_family,material_subtype,default_role);

-- Give every existing source template useful metadata without changing its original authority row.
INSERT INTO packaging_source_material_metadata(
  packaging_source_material_template_id,product_family,material_subtype,default_role,colour_hex,created_at,updated_at
)
SELECT
  packaging_source_material_template_id,
  CASE material_type WHEN 'soap_base' THEN 'soap' ELSE 'general' END,
  CASE material_type WHEN 'soap_base' THEN 'soap_base' WHEN 'fragrance_oil' THEN 'fragrance_oil' WHEN 'colourant' THEN 'colourant' ELSE 'additive' END,
  CASE material_type WHEN 'soap_base' THEN 'base' WHEN 'fragrance_oil' THEN 'fragrance' WHEN 'colourant' THEN 'colourant' ELSE 'additive' END,
  NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
FROM packaging_source_material_templates
WHERE 1=1
ON CONFLICT(packaging_source_material_template_id) DO NOTHING;

-- Seed the known Goat's Milk source as a Soap / Soap Base template.
UPDATE packaging_source_material_metadata
SET product_family='soap', material_subtype='soap_base', default_role='base', updated_at=CURRENT_TIMESTAMP
WHERE packaging_source_material_template_id=(
  SELECT packaging_source_material_template_id FROM packaging_source_material_templates
  WHERE material_key='goats-milk-melt-pour-base-owner-source-v1'
);

INSERT INTO app_settings(setting_key,setting_value,is_public)
VALUES ('site.packaging.material_library_contract','material_library_v1_build255',0)
ON CONFLICT(setting_key) DO UPDATE SET setting_value=excluded.setting_value,is_public=0;

UPDATE startup_readiness_items
SET external_location='Cloudflare Dashboard → Workers & Pages → D1 and Pages deployments',
    instructions_markdown='1. Open Cloudflare D1 and record the current Time Travel bookmark or approved recovery point before changing the schema.\n2. Record the date, database name and safe recovery reference in the evidence notes.\n3. Confirm Build 254 is already applied after the Build 250 boundary, then apply database_build255_packaging_material_library_hub.sql or the identical database_upgrade_current_pass.sql, but not both.\n4. Confirm the migration ledger records Build 255 and packaging_source_material_metadata exists.\n5. Deploy the complete ZIP rather than selected files and record the Pages deployment URL/identifier.\n6. Hard-refresh Packaging Studio and confirm styles.css?v=255 and admin-packaging-studio.js?v=255 load.\n7. Confirm the Material Library is visible even with no packaging project selected, create/edit one source template, and verify its source ingredient rows survive reload.\n8. Continue to the standalone Post-Deploy Smoke Tests; do not treat successful upload as a passed live deployment.\n9. Stop and restore the previous deployment or D1 recovery point if any critical migration, Function, route or data-integrity error appears.',
    pass_condition='A recoverable D1 point exists, Build 255 is applied after Build 254, the complete deployment is live, the Packaging Material Library loads with v255 assets, source metadata and Master INCI rows persist, and no migration, Function, route or data-integrity error remains.',
    updated_at=CURRENT_TIMESTAMP
WHERE item_key='backup_migrate_deploy';

INSERT INTO schema_migration_ledger(migration_key,file_name,checksum,status,destructive,applied_at,notes,created_at,updated_at)
VALUES (
  'build255_packaging_material_library_hub',
  'database_build255_packaging_material_library_hub.sql',
  NULL,'applied',0,CURRENT_TIMESTAMP,
  'Adds flexible product-family/source-subtype metadata for purchased packaging materials, including soap bases, candle waxes, fragrance/essential-oil blends, colourants and additives, while preserving the Build 248 source authority table.',
  CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
)
ON CONFLICT(migration_key) DO UPDATE SET
  file_name=excluded.file_name,status='applied',destructive=0,
  applied_at=COALESCE(schema_migration_ledger.applied_at,CURRENT_TIMESTAMP),
  notes=excluded.notes,updated_at=CURRENT_TIMESTAMP;

-- General structured ingredients/claims for every packaging type (soap, candle, bath/body, general labels).
CREATE TABLE IF NOT EXISTS packaging_project_ingredients (
  packaging_project_ingredient_id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_project_id INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 1,
  inci_name TEXT,
  display_name_en TEXT,
  display_name_fr TEXT,
  organic_flag INTEGER NOT NULL DEFAULT 0,
  allergen_note TEXT,
  required_on_label INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(packaging_project_id) REFERENCES packaging_projects(packaging_project_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_packaging_project_ingredients_project
  ON packaging_project_ingredients(packaging_project_id,sort_order,packaging_project_ingredient_id);

CREATE TABLE IF NOT EXISTS packaging_project_claims (
  packaging_project_claim_id INTEGER PRIMARY KEY AUTOINCREMENT,
  packaging_project_id INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 1,
  claim_en TEXT,
  claim_fr TEXT,
  icon_name TEXT,
  is_approved INTEGER NOT NULL DEFAULT 0,
  compliance_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(packaging_project_id) REFERENCES packaging_projects(packaging_project_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_packaging_project_claims_project
  ON packaging_project_claims(packaging_project_id,sort_order,packaging_project_claim_id);

-- Backfill existing soap structured rows into the general packaging authority once.
INSERT INTO packaging_project_ingredients(
  packaging_project_id,sort_order,inci_name,display_name_en,display_name_fr,organic_flag,allergen_note,required_on_label,created_at,updated_at
)
SELECT sp.packaging_project_id,si.sort_order,si.inci_name,si.display_name_en,si.display_name_fr,si.organic_flag,si.allergen_note,si.required_on_label,si.created_at,si.updated_at
FROM soap_ingredients si
JOIN soap_products sp ON sp.soap_product_id=si.soap_product_id
WHERE NOT EXISTS (
  SELECT 1 FROM packaging_project_ingredients ppi
  WHERE ppi.packaging_project_id=sp.packaging_project_id AND ppi.sort_order=si.sort_order
    AND COALESCE(ppi.inci_name,'')=COALESCE(si.inci_name,'')
);

INSERT INTO packaging_project_claims(
  packaging_project_id,sort_order,claim_en,claim_fr,icon_name,is_approved,compliance_note,created_at,updated_at
)
SELECT sp.packaging_project_id,slc.sort_order,slc.claim_en,slc.claim_fr,slc.icon_name,slc.is_approved,slc.compliance_note,slc.created_at,slc.updated_at
FROM soap_label_claims slc
JOIN soap_products sp ON sp.soap_product_id=slc.soap_product_id
WHERE NOT EXISTS (
  SELECT 1 FROM packaging_project_claims ppc
  WHERE ppc.packaging_project_id=sp.packaging_project_id AND ppc.sort_order=slc.sort_order
    AND COALESCE(ppc.claim_en,'')=COALESCE(slc.claim_en,'')
);
