# Database Schema Reference — Current Active Notes

Current sync: 2026-05-14 — Build 124.

## Active schema files updated this pass
- `database_schema.sql`
- `database_store_schema.sql`
- `database_full_schema.sql`
- `database_upgrade_current_pass.sql`
- `database_growth_analytics_seo_extension.sql`
- `database_payments_extension.sql`
- `database_profiles_extension.sql`
- `database_access_tiers.sql`
- `database_admin_seed_template.sql`
- `database_inventory_stock_unit_quick_fix.sql`

## New/updated schema areas
- `schema_migration_ledger` records SQL file name, status, checksum, notes, admin user, and applied timestamp.
- `accounting_statement_provider_profiles` stores saved CSV mapping rules for bank, PayPal, Stripe, Square, Etsy, and manual imports.
- `site_inventory_movements` CHECK constraints now include both old and current movement names so historic and new movement rows stay compatible.
- `site_item_inventory` continues as the working Tools/Supplies inventory table.

## Inventory costing and unit rules
- D1 stores `unit_cost_cents` as integer cents.
- Admin screens should show dollars, such as `33.99`, and convert back to `3399` cents before saving.
- Current imported Tools/Supplies rows should default to at least `1` on hand.
- Package consumables need both stock and usage units. Example:

```text
on_hand_quantity = 1
stock_unit_label = package
usage_unit_label = sheet
usage_units_per_stock_unit = 100
```

## Source-of-truth direction
D1 should become the authority for operational records: products, inventory, customers, orders, payments, accounting, reconciliation, media metadata, site content blocks, and admin audit history.

JSON should remain only for emergency storefront fallback, import/export bridges, large static collections not yet migrated, and recovery snapshots.

## Deployment rule
Apply `database_upgrade_current_pass.sql` in Cloudflare D1 before relying on the new admin panels. After applying, record it in `/admin/operations/` using the Migration Ledger panel.
