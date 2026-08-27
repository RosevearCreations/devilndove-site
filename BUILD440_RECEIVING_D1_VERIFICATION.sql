-- Build 440 Inventory receiving/source provenance — read-only Development verification.
SELECT 'build440_receiving_tables' AS check_name,
       COUNT(*) AS actual,
       4 AS expected
FROM sqlite_master
WHERE type='table' AND name IN (
  'inventory_item_identifiers','inventory_item_sources','inventory_receiving_claims','inventory_receiving_reversals'
);

SELECT 'build440_receiving_named_indexes' AS check_name,
       COUNT(*) AS actual,
       9 AS expected
FROM sqlite_master
WHERE type='index' AND name IN (
  'idx_inventory_item_identifiers_lookup','idx_inventory_item_identifiers_item','idx_inventory_item_identifiers_global_barcode',
  'idx_inventory_item_sources_item','idx_inventory_item_sources_supplier',
  'idx_inventory_receiving_claims_item','idx_inventory_receiving_claims_po_item',
  'idx_inventory_receiving_reversals_item','idx_inventory_receiving_reversals_lot'
);

SELECT 'build440_receiving_migration_ledger' AS check_name,
       COUNT(*) AS actual,
       2 AS expected
FROM schema_migration_ledger
WHERE migration_key IN ('build440_inventory_receiving_source_provenance','build440_inventory_receiving_reversal');

SELECT 'build440_receiving_policy_settings' AS check_name,
       COUNT(*) AS actual,
       4 AS expected
FROM app_settings
WHERE setting_key IN (
  'site.inventory.receiving_authority',
  'site.inventory.barcode_resolver_policy',
  'site.inventory.source_provenance_policy',
  'site.inventory.receiving_reversal_policy'
);

SELECT 'identifier_rows' AS metric, COUNT(*) AS value FROM inventory_item_identifiers
UNION ALL SELECT 'source_rows', COUNT(*) FROM inventory_item_sources
UNION ALL SELECT 'receiving_claim_rows', COUNT(*) FROM inventory_receiving_claims
UNION ALL SELECT 'receiving_reversal_rows', COUNT(*) FROM inventory_receiving_reversals;

SELECT 'orphan_identifiers' AS check_name, COUNT(*) AS value
FROM inventory_item_identifiers ii
LEFT JOIN site_item_inventory sii ON sii.site_item_inventory_id=ii.site_item_inventory_id
WHERE sii.site_item_inventory_id IS NULL;

SELECT 'orphan_sources' AS check_name, COUNT(*) AS value
FROM inventory_item_sources s
LEFT JOIN site_item_inventory sii ON sii.site_item_inventory_id=s.site_item_inventory_id
WHERE sii.site_item_inventory_id IS NULL;

SELECT 'orphan_receiving_claims' AS check_name, COUNT(*) AS value
FROM inventory_receiving_claims rc
LEFT JOIN site_item_inventory sii ON sii.site_item_inventory_id=rc.site_item_inventory_id
LEFT JOIN inventory_purchase_lots ipl ON ipl.inventory_purchase_lot_id=rc.inventory_purchase_lot_id
WHERE sii.site_item_inventory_id IS NULL
   OR (rc.inventory_purchase_lot_id IS NOT NULL AND ipl.inventory_purchase_lot_id IS NULL);

SELECT 'duplicate_active_barcode_values' AS check_name, COUNT(*) AS value
FROM (
  SELECT normalized_value
  FROM inventory_item_identifiers
  WHERE identifier_type IN ('barcode','upc','ean','gtin') AND verification_status<>'rejected'
  GROUP BY normalized_value
  HAVING COUNT(*)>1
);

SELECT 'stale_applying_receiving_claims' AS check_name, COUNT(*) AS value
FROM inventory_receiving_claims
WHERE claim_status='applying';

SELECT 'duplicate_receipt_reversals' AS check_name, COUNT(*) AS value
FROM (
  SELECT inventory_receiving_claim_id
  FROM inventory_receiving_reversals
  GROUP BY inventory_receiving_claim_id
  HAVING COUNT(*)>1
);
