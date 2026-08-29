-- Release 448 read-only verification for Storefront Collections / Collages.
SELECT COUNT(*) AS required_table_count
FROM sqlite_master
WHERE type='table' AND name IN ('storefront_collections','storefront_collection_products','storefront_collage_presets');
SELECT COUNT(*) AS published_collection_count FROM storefront_collections WHERE status='published';
SELECT COUNT(*) AS invalid_collection_rules FROM storefront_collections WHERE rule_key IS NOT NULL AND rule_key NOT IN ('merchandise_origin','product_category','product_type','sale_channel');
SELECT COUNT(*) AS invalid_memberships FROM storefront_collection_products WHERE membership_status NOT IN ('included','excluded');
SELECT COUNT(*) AS invalid_collages FROM storefront_collage_presets WHERE layout_kind NOT IN ('mosaic','feature_grid','story_strip') OR max_items<3 OR max_items>12;
SELECT COUNT(*) AS orphan_memberships FROM storefront_collection_products scp LEFT JOIN storefront_collections sc ON sc.storefront_collection_id=scp.storefront_collection_id LEFT JOIN products p ON p.product_id=scp.product_id WHERE sc.storefront_collection_id IS NULL OR p.product_id IS NULL;
PRAGMA foreign_key_check;
