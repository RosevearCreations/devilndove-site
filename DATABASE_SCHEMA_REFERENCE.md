# Database Schema Reference — Active Notes

## Build 135 schema reference note

No new structural tables are required for Build 135. The media diagnostics and image-health checks use existing `media_assets`, `product_images`, `product_image_annotations`, `products`, `runtime_incidents`, and `schema_migration_ledger` tables. `database_upgrade_current_pass.sql` includes the Build 135 ledger marker.


Current sync: 2026-05-14 — Build 125.

## New or expanded tables in recent passes

### `schema_migration_ledger`
Tracks which SQL files/passes have been applied, skipped, failed, or left pending review. Use `/admin/operations/` to mark the current pass after D1 is updated.

### `accounting_statement_provider_profiles`
Stores import-column mappings for bank, PayPal, Stripe, Square, Etsy, and manual CSV statements.

### `amazon_purchase_import_staging`
Private staging table for Amazon order rows that may match tools or supplies. Build 125 adds review/apply columns:
- `applied_inventory_id`
- `applied_cost_history_id`
- `applied_at`
- `reviewed_by_user_id`

### `site_item_inventory_cost_history`
Tracks inventory unit-cost changes from catalog sync, manual inventory edits, bulk cost edits, and approved Amazon purchase staging rows. This prevents cost updates from being silent overwrites.

### `accounting_reconciliation_exceptions`
Build 125 queue fields include assigned user, accountant review flag, resolved/reopened metadata, and richer statuses.

### `accounting_journal_entries`
Build 125 adds posting/validation metadata:
- `posted_by_user_id`
- `posted_at`
- `validation_message`

## Current money convention
- Store money as integer cents in D1.
- Show dollars in admin forms.
- Convert dollars back to cents before saving.

## Inventory convention
- Current owned tools and supplies are in stock by default with at least `on_hand_quantity = 1`.
- Package consumables are modeled as stock unit plus usage unit count, for example `1 package = 100 sheets`.

## Apply order
1. Deploy the build.
2. Apply `database_upgrade_current_pass.sql`.
3. Use `/admin/operations/` to mark Build 125 applied.
4. Use `/admin/catalog/` to sync tools/supplies and review Amazon staging rows.

## Runtime incident review fields - Build 126

`runtime_incidents` now supports admin review fields in addition to the original incident log columns:

- `review_status` - `open`, `reviewing`, `resolved`, or `ignored`.
- `admin_note` - short internal explanation for the review action.
- `reviewed_by_user_id` - admin user that last changed the review state.
- `reviewed_at` - timestamp of the latest review action.

The runtime endpoint safely backfills these columns after checking `PRAGMA table_info`, then creates supporting indexes. This avoids unsafe duplicate-column failures on older D1 databases.


## Build 127 schema compatibility note

No destructive schema change was required in Build 127. The public `/api/products` endpoint now treats several product, tax, and SEO columns as optional compatibility fields and inspects D1 with `PRAGMA table_info` before referencing them. This specifically prevents older `tax_classes` schemas with `tax_rate` but without `rate_percent` from breaking the storefront query.

## Build 128 schema compatibility note

No destructive D1 schema change is required for Build 128. This is a code compatibility pass for older or partially migrated product schemas.

The public product endpoints now verify optional columns with direct no-row selects before referencing them:

```sql
SELECT merchandise_origin FROM products LIMIT 0;
```

If the select fails, the endpoint omits that column from SQL and returns a safe default such as `handmade` or `onsite` in the API payload. This protects public pages while the full product schema migration is checked/applied.


## Build 129 schema notes

### `amazon_purchase_import_batches`
Tracks private admin imports of Amazon CSV rows before review/apply.

Important columns:
- `import_batch_id`
- `source_file`
- `imported_row_count`
- `skipped_row_count`
- `created_by_user_id`
- `created_at`
- `notes`

### `amazon_purchase_import_staging` additions expected by Build 129
The runtime API safely backfills missing columns after checking the live table. Expected optional/current columns now include:
- `amazon_url`
- `applied_inventory_id`
- `applied_cost_history_id`
- `applied_at`
- `reviewed_by_user_id`
- `updated_at`

### Schema drift report
`/api/admin/schema-drift-report` does not change schema. It compares live D1 columns to the columns the current build expects and classifies gaps as required, recommended, or optional.

## Build 130 schema compatibility note

Build 130 does not require a destructive D1 schema change. It is a code-first compatibility patch for public product reads. The important implementation change is that candidate optional product columns are no longer treated as verified columns. The endpoint now trusts only actual table metadata/sample rows and has a final `SELECT * FROM products` fallback before logging an incident.

This protects older product schemas that do not yet have fields such as `merchandise_origin`, `sale_channel`, `condition_summary`, or similar storefront enrichment fields. Those columns can still be added later through reviewed migrations, but they are no longer required for the public product list to work.

## Build 131 schema reference update

- `tax_classes.rate_percent` is now included in fresh schema files so older and newer storefront/accounting code paths can agree on tax rate naming.
- Storefront repair expects these compatibility areas:
  - `products`: product number/SKU, category/color fields, status/review fields, product type, merchandise origin, sale channel, external listing fields, condition/era/sourcing notes, price/currency/tax/shipping/inventory fields, image/sort/timestamp fields.
  - `tax_classes`: `code`, `name`, `tax_rate`, `rate_percent`, `is_active`, timestamps.
  - `product_seo`: product link, meta title/description, keywords, H1 override, canonical URL, schema type, Open Graph fields, timestamps.
- `database_upgrade_current_pass.sql` records Build 131 as a pending-review ledger marker. The actual ADD COLUMN actions are intentionally handled by `/api/admin/storefront-schema-repair` after checking live D1 because unconditional `ALTER TABLE ADD COLUMN` is unsafe to rerun in D1/SQLite.

## Build 132 schema note

Build 132 does not add or remove D1 tables/columns. It is a code/CSS/mobile UX pass. The schema files were still touched with a no-structure-change note, and `database_upgrade_current_pass.sql` contains a Build 132 ledger marker so the release can be recorded in the migration ledger.

## Build 133 schema update

Build 133 adds Search Console CSV staging tables: `search_console_import_batches` and `search_console_page_queries`. These support future imports of page, query, clicks, impressions, CTR, average position, country, and device data.

The pass also adds `/api/admin/storefront-value-backfill`, which performs runtime-safe product default backfills only after checking live D1 columns. This avoids unconditional `ALTER TABLE` patterns that are unsafe in D1/SQLite.

## Build 134 schema note

No structural D1 schema change is required for Build 134. The product create endpoint now inspects live `products`, `product_images`, and `product_seo` columns before inserting, which protects older D1 databases while Storefront Schema Repair remains the preferred long-term schema alignment tool.
