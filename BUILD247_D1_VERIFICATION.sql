-- Build 247 read-only D1 verification.
SELECT migration_key,file_name,status,destructive,applied_at
FROM schema_migration_ledger
WHERE migration_key='build247_packaging_library_truth_layout_rose_palette';

SELECT formula_key,formula_name,default_rose_asset_id,default_rose_colour,is_system,is_active
FROM packaging_formula_library
ORDER BY packaging_formula_library_id;

SELECT content_type,COUNT(*) AS active_rows
FROM packaging_content_library
WHERE is_active=1
GROUP BY content_type
ORDER BY content_type;

SELECT content_key,item_name,text_en,text_fr,icon_name
FROM packaging_content_library
WHERE content_type='claim' AND is_active=1
ORDER BY packaging_content_library_id;

SELECT template_key,package_type,layout_json
FROM packaging_templates
WHERE template_key IN ('soap-ribbon-glacial-approved-v1','soap-ribbon-spec-50mm-seal-v1');

SELECT setting_key,setting_value
FROM app_settings
WHERE setting_key IN ('site.packaging.rose_palette_policy','site.packaging.library_policy','site.packaging.project_delete_policy')
ORDER BY setting_key;
