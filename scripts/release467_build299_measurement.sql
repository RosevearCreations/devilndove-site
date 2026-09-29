-- Release 467 Build 299 — read-only Development D1 query-efficiency evidence.
-- No DDL and no mutations. Statement order is part of the proof contract.

-- 1: products/detail schema columns in one statement.
SELECT 'products' table_name,name FROM pragma_table_info('products')
UNION ALL SELECT 'tax_classes',name FROM pragma_table_info('tax_classes')
UNION ALL SELECT 'product_seo',name FROM pragma_table_info('product_seo')
UNION ALL SELECT 'product_story_public_notes',name FROM pragma_table_info('product_story_public_notes')
UNION ALL SELECT 'product_images',name FROM pragma_table_info('product_images')
UNION ALL SELECT 'product_image_annotations',name FROM pragma_table_info('product_image_annotations')
UNION ALL SELECT 'media_consent_records',name FROM pragma_table_info('media_consent_records');

-- 2: universal-search schema columns in one statement.
SELECT 'products' table_name,name FROM pragma_table_info('products')
UNION ALL SELECT 'site_item_inventory',name FROM pragma_table_info('site_item_inventory')
UNION ALL SELECT 'creative_projects',name FROM pragma_table_info('creative_projects')
UNION ALL SELECT 'orders',name FROM pragma_table_info('orders')
UNION ALL SELECT 'custom_requests',name FROM pragma_table_info('custom_requests')
UNION ALL SELECT 'content_projects',name FROM pragma_table_info('content_projects')
UNION ALL SELECT 'media_assets',name FROM pragma_table_info('media_assets');

-- 3: bounded corpus sizes for FTS/keyset decision evidence.
SELECT
  (SELECT COUNT(*) FROM products) products,
  (SELECT COUNT(*) FROM site_item_inventory) inventory_items,
  (SELECT COUNT(*) FROM catalog_items WHERE item_kind='creation') creations,
  (SELECT COUNT(*) FROM content_publications WHERE destination='workshop_journal') workshop_stories;

-- 4: Product list query plan.
EXPLAIN QUERY PLAN
SELECT product_id,slug,name,price_cents,currency
FROM products
WHERE COALESCE(status,'active')='active'
  AND lower(COALESCE(review_status,'published')) IN ('approved','published','')
ORDER BY COALESCE(sort_order,999999),product_id DESC
LIMIT 50;

-- 5: Creations canonical query plan without an empty-search OR scan.
EXPLAIN QUERY PLAN
SELECT catalog_item_id,slug,name
FROM catalog_items
WHERE item_kind='creation' AND COALESCE(visible_public,1)=1 AND COALESCE(status,'active')='active'
ORDER BY COALESCE(sort_order,0),catalog_item_id
LIMIT 50;

-- 6: Universal-search reference-like prefix query plan.
EXPLAIN QUERY PLAN
SELECT product_id,name,sku,slug
FROM products
WHERE LOWER(COALESCE(name,'')) LIKE 'a%'
   OR LOWER(COALESCE(sku,'')) LIKE 'a%'
   OR LOWER(COALESCE(slug,'')) LIKE 'a%'
ORDER BY product_id DESC LIMIT 6;

-- 7: Universal-search free-form substring query plan (retained only for human text semantics).
EXPLAIN QUERY PLAN
SELECT product_id,name,sku,slug
FROM products
WHERE LOWER(COALESCE(name,'')) LIKE '%a%'
   OR LOWER(COALESCE(sku,'')) LIKE '%a%'
   OR LOWER(COALESCE(slug,'')) LIKE '%a%'
ORDER BY product_id DESC LIMIT 6;

-- 8: Actual bounded Product read.
SELECT product_id,slug,name FROM products
WHERE COALESCE(status,'active')='active'
ORDER BY product_id DESC LIMIT 50;

-- 9: Actual prefix quick-jump read.
SELECT product_id,name,sku,slug FROM products
WHERE LOWER(COALESCE(name,'')) LIKE 'a%'
   OR LOWER(COALESCE(sku,'')) LIKE 'a%'
   OR LOWER(COALESCE(slug,'')) LIKE 'a%'
ORDER BY product_id DESC LIMIT 6;

-- 10: Batched workstation membership read over one bounded Inventory page.
SELECT iwm.site_item_inventory_id,iwm.workstation_site_item_inventory_id,COALESCE(ws.item_name,'') workstation_item_name
FROM inventory_workstation_memberships iwm
JOIN site_item_inventory ws ON ws.site_item_inventory_id=iwm.workstation_site_item_inventory_id
WHERE iwm.site_item_inventory_id IN (SELECT site_item_inventory_id FROM site_item_inventory ORDER BY site_item_inventory_id DESC LIMIT 50)
ORDER BY iwm.site_item_inventory_id,LOWER(COALESCE(ws.item_name,'')),iwm.workstation_site_item_inventory_id;
