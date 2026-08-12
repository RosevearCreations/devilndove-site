-- Read-only Build 255 production verification.
SELECT migration_key,file_name,status,applied_at
FROM schema_migration_ledger
WHERE migration_key='build255_packaging_material_library_hub';

SELECT name,type
FROM sqlite_master
WHERE name IN ('packaging_source_material_templates','packaging_source_material_metadata','packaging_project_ingredients','packaging_project_claims')
ORDER BY name;

SELECT smt.packaging_source_material_template_id,smt.material_name,smt.material_type,
       smm.product_family,smm.material_subtype,smm.default_role,smm.colour_hex,
       json_array_length(COALESCE(smt.master_inci_json,'[]')) AS source_ingredient_rows
FROM packaging_source_material_templates smt
LEFT JOIN packaging_source_material_metadata smm
  ON smm.packaging_source_material_template_id=smt.packaging_source_material_template_id
WHERE smt.is_active=1
ORDER BY smm.product_family,smm.material_subtype,LOWER(smt.material_name);

SELECT setting_key,setting_value
FROM app_settings
WHERE setting_key='site.packaging.material_library_contract';
