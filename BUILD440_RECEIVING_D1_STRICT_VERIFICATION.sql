-- Build 440 Inventory receiving/source provenance — strict read-only verification.
SELECT CASE WHEN
  (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN (
    'inventory_item_identifiers','inventory_item_sources','inventory_receiving_claims','inventory_receiving_reversals'
  ))=4
  AND (SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name IN (
    'idx_inventory_item_identifiers_lookup','idx_inventory_item_identifiers_item','idx_inventory_item_identifiers_global_barcode',
    'idx_inventory_item_sources_item','idx_inventory_item_sources_supplier',
    'idx_inventory_receiving_claims_item','idx_inventory_receiving_claims_po_item',
    'idx_inventory_receiving_reversals_item','idx_inventory_receiving_reversals_lot'
  ))=9
  AND (SELECT COUNT(*) FROM schema_migration_ledger WHERE migration_key IN (
    'build440_inventory_receiving_source_provenance','build440_inventory_receiving_reversal'
  ))=2
  AND (SELECT COUNT(*) FROM app_settings WHERE setting_key IN (
    'site.inventory.receiving_authority','site.inventory.barcode_resolver_policy',
    'site.inventory.source_provenance_policy','site.inventory.receiving_reversal_policy'
  ))=4
  AND (SELECT COUNT(*) FROM pragma_table_info('inventory_item_identifiers') WHERE name IN (
    'site_item_inventory_id','identifier_type','identifier_value','normalized_value','source_name','is_primary','verification_status'
  ))=7
  AND (SELECT COUNT(*) FROM pragma_table_info('inventory_item_sources') WHERE name IN (
    'site_item_inventory_id','source_kind','source_name','supplier_sku','source_url','is_preferred','verification_status','receipt_count'
  ))=8
  AND (SELECT COUNT(*) FROM pragma_table_info('inventory_receiving_claims') WHERE name IN (
    'receive_key','site_item_inventory_id','inventory_purchase_lot_id','lot_code','quantity_received','quantity_incoming_cleared',
    'previous_on_hand_quantity','new_on_hand_quantity','previous_incoming_quantity','new_incoming_quantity','claim_status'
  ))=11
  AND (SELECT COUNT(*) FROM pragma_table_info('inventory_receiving_reversals') WHERE name IN (
    'inventory_receiving_claim_id','reversal_key','site_item_inventory_id','inventory_purchase_lot_id','quantity_reversed',
    'quantity_incoming_restored','reversal_reason','reversed_by_user_id','reversed_at'
  ))=9
  AND (SELECT COUNT(*) FROM inventory_item_identifiers ii LEFT JOIN site_item_inventory sii ON sii.site_item_inventory_id=ii.site_item_inventory_id WHERE sii.site_item_inventory_id IS NULL)=0
  AND (SELECT COUNT(*) FROM inventory_item_sources s LEFT JOIN site_item_inventory sii ON sii.site_item_inventory_id=s.site_item_inventory_id WHERE sii.site_item_inventory_id IS NULL)=0
  AND (SELECT COUNT(*) FROM inventory_receiving_claims WHERE claim_status='applying')=0
  AND (SELECT COUNT(*) FROM (
    SELECT normalized_value FROM inventory_item_identifiers
    WHERE identifier_type IN ('barcode','upc','ean','gtin') AND verification_status<>'rejected'
    GROUP BY normalized_value HAVING COUNT(*)>1
  ))=0
  AND (SELECT COUNT(*) FROM (
    SELECT inventory_receiving_claim_id FROM inventory_receiving_reversals
    GROUP BY inventory_receiving_claim_id HAVING COUNT(*)>1
  ))=0
THEN 1 ELSE abs(-9223372036854775808) END AS verification_pass;
