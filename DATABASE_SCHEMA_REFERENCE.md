# Database Schema Reference — Fresh Active Notes

Current sync: 2026-05-10 cleanup pass.

## Active schema files
- `database_schema.sql` — compact/main schema reference.
- `database_store_schema.sql` — storefront/store operations schema reference.
- `database_full_schema.sql` — broad combined schema reference.
- `database_upgrade_current_pass.sql` — fresh staging file for the next deployable migration batch.
- `archive/sql/database_upgrade_current_pass_2026-05-10_before_reset.sql` — archived previous current-pass SQL.

## Current database direction
D1 should become the authority for operational records: products, inventory, customers, orders, payments, accounting, reconciliation, media metadata, site content blocks, and admin audit history.

JSON should remain only for:
- emergency storefront fallback;
- import/export bridge files;
- large static collections that are not yet fully migrated;
- recovery snapshots.

## Migration rules
- Add only new deployable migration statements to `database_upgrade_current_pass.sql`.
- Keep statements idempotent where possible.
- Document any risky ALTER/rebuild operation in this file and in `KNOWN_GAPS_AND_RISKS.md`.
- After a migration is applied and accepted, roll it into the main schema files and reset the current-pass file in a later cleanup pass.

## Current cleanup note
No intentional table-shape change was added in this pass. The schema files were touched only to note that the previous current-pass SQL was archived and the active upgrade file was reset.


## Amazon Purchase Import Staging — 2026-05-11

Added a safe staging design for Amazon purchase history imports.

Files added:
- `database_amazon_purchase_import_staging.sql`
- Private CSV review/import files are supplied separately and must not be deployed publicly.

Main staging table:
- `amazon_purchase_import_staging`

Purpose:
- Stage Amazon purchase rows after review.
- Link candidate rows to existing `tool` or `supply` inventory records by `inventory_type` and `inventory_key`.
- Preserve accounting values in cents.
- Avoid storing account user email, receiver email, or seller address.

Import rule:
- Do not update production inventory/accounting tables until `review_decision = 'approved'`.


## Site inventory sync fields — 2026-05-14

`site_item_inventory` is the admin working table for Tools/Supplies stock, cost, reorder, and product-resource usage. The admin API now guards/creates these fields when missing: source type/key, item name/category, source/Amazon/image URLs, on-hand/reserved/incoming quantities, reorder level, unit cost cents, stock unit label, usage unit label, usage units per stock unit, supplier/seller fields, reorder notes, reuse flags, active flag, last-seen timestamp, created timestamp, and updated timestamp.

`catalog_items` remains the catalog/source snapshot. Use `/api/admin/catalog-sync` first, then `/api/admin/site-item-inventory` with `action: sync_catalog` to copy the catalog snapshot into working inventory.

## Inventory costing/unit conventions — 2026-05-14

`site_item_inventory.unit_cost_cents` stores money in integer cents for database safety. Admin screens must display and accept CAD dollar amounts, then convert to cents before saving.

`site_item_inventory.on_hand_quantity` is the count of purchased stock units on hand. For the current Tools/Supplies import, sync defaults blank/zero rows to `1` because each catalog row represents an item currently in stock.

`stock_unit_label`, `usage_unit_label`, and `usage_units_per_stock_unit` describe package math. Example: a 100-sheet DTF package should be:

```text
on_hand_quantity = 1
stock_unit_label = package
usage_unit_label = sheet
usage_units_per_stock_unit = 100
```

Finished-product resource links should consume `quantity_used` in the usage unit, not the stock package.
