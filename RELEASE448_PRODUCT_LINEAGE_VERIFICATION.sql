-- Release 448 Product lineage/manufacturer review read-only verification.
PRAGMA foreign_keys = ON;

SELECT COUNT(*) AS required_lineage_table_count
FROM sqlite_master
WHERE type='table'
  AND name IN ('product_lineage_profiles','product_resource_lineage_reviews','inventory_manufacturers','inventory_manufacturer_links','inventory_vendor_reviews');

SELECT COUNT(*) AS product_count FROM products;
SELECT COUNT(*) AS profile_count FROM product_lineage_profiles;

SELECT origin_kind,lineage_status,publication_policy,materials_required,COUNT(*) AS product_count
FROM product_lineage_profiles
GROUP BY origin_kind,lineage_status,publication_policy,materials_required
ORDER BY origin_kind,lineage_status,publication_policy;

SELECT COUNT(*) AS required_new_in_house_count
FROM product_lineage_profiles
WHERE origin_kind='made_in_house' AND publication_policy='required' AND materials_required=1;

SELECT COUNT(*) AS invalid_exempt_policy_count
FROM product_lineage_profiles
WHERE publication_policy='exempt' AND (lineage_status<>'exempt' OR materials_required<>0);

SELECT COUNT(*) AS resource_review_count FROM product_resource_lineage_reviews;
SELECT COUNT(*) AS unresolved_resource_review_count
FROM product_resource_lineage_reviews
WHERE site_item_inventory_id IS NULL AND verification_status<>'exempt';

SELECT COUNT(*) AS manufacturer_count FROM inventory_manufacturers;
SELECT COUNT(*) AS manufacturer_link_count FROM inventory_manufacturer_links;
SELECT COUNT(*) AS unverified_manufacturer_link_count FROM inventory_manufacturer_links WHERE verification_status<>'verified';
SELECT COUNT(*) AS vendor_review_count FROM inventory_vendor_reviews;

SELECT COUNT(*) AS product_lineage_trigger_count
FROM sqlite_master
WHERE type='trigger' AND name='trg_product_lineage_profile_after_insert';

PRAGMA foreign_key_check;
