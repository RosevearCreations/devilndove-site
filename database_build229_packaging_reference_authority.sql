-- Build 229 - adopted soap-label reference authority.
-- Devil n Dove packaging-source provenance and dimensional reconciliation.
-- Apply once after Build 228. Back up D1 first.
-- Cloudflare D1 imports statements directly; do not add BEGIN, COMMIT, or SAVEPOINT.

CREATE TABLE IF NOT EXISTS packaging_reference_sources (
  packaging_reference_source_id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_key TEXT NOT NULL UNIQUE,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  repository_path TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  authority_scope TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'adopted',
  dimensional_summary_json TEXT NOT NULL DEFAULT '{}',
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  adopted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_packaging_reference_sources_active
  ON packaging_reference_sources(is_active,source_type,source_key);

INSERT INTO packaging_reference_sources (
  source_key,source_name,source_type,repository_path,sha256,authority_scope,
  review_status,dimensional_summary_json,notes,is_active,adopted_at,updated_at
) VALUES
(
  'soap-label-automation-spec-v1',
  'DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md',
  'design_specification',
  '/docs/packaging/source-references/DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md',
  '26fe76cff4943547739bbe68b328509ba916ed6c608b57e86a048ceb4f1611b7',
  'Primary design and workflow direction. The full specification is reconciled into PACKAGING_STUDIO.md.',
  'adopted',
  '{"artboard_in":[11,1.5],"band_in":[11,0.75],"front_oval_in":[2,1.5],"rear_seal_mm":50,"bleed_in":0.125,"safe_margin_in":[0.0625,0.125],"preview_dpi_min":300}',
  'Rose-only primary flower; bilingual English/French and INCI; deterministic SVG/PDF; fold, overlap, physical print, approval and archive controls.',
  1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
),
(
  'soap-label-template-guide-v1',
  'Soap_Label_Template_Guide.pdf',
  'dimension_guide',
  '/docs/packaging/source-references/Soap_Label_Template_Guide.pdf',
  'cc4940bcb31a244ee7bd9248f4830be986c5cb669d21273a23b373aa3b5bfe0e',
  'Compact supplied dimension and print-output reference.',
  'adopted',
  '{"artboard_in":[11,1.5],"band_in":[11,0.75],"front_oval_in":[2,1.5],"rear_seal_mm":50,"bleed_in":0.125,"preview_dpi":300,"colour_mode":"CMYK where supported"}',
  'The source PDF is a direction sheet, not a printer proof or compliance approval.',
  1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
),
(
  'soap-label-master-template-v1',
  'Soap_Label_Master_Template.svg',
  'svg_template',
  '/assets/packaging/soap/reference/Soap_Label_Master_Template.svg',
  '6e0a1653cdb85861544f06f5d1aa1897e1878cfcb5e62ebe86c6cfe003aacb5e',
  'Supplied editable physical-size SVG baseline used for dimension comparison.',
  'adopted',
  '{"width_in":11,"height_in":1.5,"view_box_mm":[0,0,279.4,38.1],"band_height_mm":19.05,"front_oval_mm":[50.8,38.1],"rendered_rear_seal_mm":25}',
  'The supplied SVG renders a 25 mm rear circle while the specification calls for 50 mm. Build 229 preserves this discrepancy as a blocker requiring physical profile selection; it does not silently resize an approved source.',
  1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
)
ON CONFLICT(source_key) DO UPDATE SET
  source_name=excluded.source_name,
  source_type=excluded.source_type,
  repository_path=excluded.repository_path,
  sha256=excluded.sha256,
  authority_scope=excluded.authority_scope,
  review_status=excluded.review_status,
  dimensional_summary_json=excluded.dimensional_summary_json,
  notes=excluded.notes,
  is_active=excluded.is_active,
  updated_at=CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS schema_migration_ledger (
  schema_migration_id INTEGER PRIMARY KEY AUTOINCREMENT,
  migration_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

INSERT INTO schema_migration_ledger (migration_key,file_name,applied_at,notes)
VALUES (
  'build229_packaging_reference_authority',
  'database_build229_packaging_reference_authority.sql',
  CURRENT_TIMESTAMP,
  'Registers the three user-supplied soap-label source references and their checksums/dimensional scope without altering approved artwork. Startup Readiness retains every prior gate and adds a separate missing-launch-images blocker.'
)
ON CONFLICT(migration_key) DO UPDATE SET
  file_name=excluded.file_name,
  notes=excluded.notes;
