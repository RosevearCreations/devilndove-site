-- Devil n Dove Build 248 — read-only D1 verification.
-- Run AFTER database_build248_packaging_source_material_templates_compliance.sql.
PRAGMA foreign_key_check;

SELECT migration_key,file_name,status,destructive,applied_at,notes
FROM schema_migration_ledger
WHERE migration_key='build248_packaging_source_material_templates_compliance';

SELECT material_type,verification_status,fragrance_allergen_review_status,COUNT(*) AS template_count
FROM packaging_source_material_templates
WHERE is_active=1
GROUP BY material_type,verification_status,fragrance_allergen_review_status
ORDER BY material_type,verification_status;

SELECT material_key,material_name,material_type,supplier_name,supplier_product_name,supplier_sku,
       source_url,source_image_url,supplier_document_url,intended_use,verification_status,
       json_array_length(master_inci_json) AS master_inci_rows,
       json_array_length(benefits_json) AS benefit_rows,
       json_array_length(supplier_claims_json) AS supplier_claim_rows,
       json_array_length(fragrance_allergens_json) AS fragrance_allergen_rows,
       fragrance_allergen_review_status,is_system,is_active
FROM packaging_source_material_templates
WHERE material_key='goats-milk-melt-pour-base-owner-source-v1';

SELECT json_extract(value,'$.sort_order') AS sort_order,
       json_extract(value,'$.inci_name') AS source_or_inci_name,
       json_extract(value,'$.verification_status') AS verification_status
FROM packaging_source_material_templates, json_each(master_inci_json)
WHERE material_key='goats-milk-melt-pour-base-owner-source-v1'
ORDER BY sort_order;

SELECT json_extract(value,'$.title') AS supplier_benefit,
       json_extract(value,'$.label_candidate') AS auto_label_candidate
FROM packaging_source_material_templates, json_each(benefits_json)
WHERE material_key='goats-milk-melt-pour-base-owner-source-v1';

SELECT psm.packaging_project_id,pp.project_key,pp.project_name,psm.material_role,
       smt.material_name,smt.material_type,smt.verification_status,
       smt.fragrance_allergen_review_status,psm.review_status,
       length(psm.source_snapshot_json) AS snapshot_bytes
FROM packaging_project_source_materials psm
JOIN packaging_projects pp ON pp.packaging_project_id=psm.packaging_project_id
JOIN packaging_source_material_templates smt
  ON smt.packaging_source_material_template_id=psm.packaging_source_material_template_id
ORDER BY psm.packaging_project_id,psm.sort_order,psm.packaging_project_source_material_id;

SELECT pfl.formula_name,smt.material_name,smt.material_type,link.material_role
FROM packaging_formula_source_material_links link
JOIN packaging_formula_library pfl ON pfl.packaging_formula_library_id=link.packaging_formula_library_id
JOIN packaging_source_material_templates smt
  ON smt.packaging_source_material_template_id=link.packaging_source_material_template_id
ORDER BY LOWER(pfl.formula_name),link.material_role;

SELECT material_name,supplier_name,source_reference,fragrance_allergen_review_status,
       json_array_length(fragrance_allergens_json) AS allergen_rows,verification_status
FROM packaging_source_material_templates
WHERE is_active=1 AND material_type='fragrance_oil'
ORDER BY LOWER(material_name);

SELECT setting_key,setting_value
FROM app_settings
WHERE setting_key IN (
  'site.packaging.source_material_policy',
  'site.packaging.canada_fragrance_allergen_policy'
)
ORDER BY setting_key;
