# Database Schema Reference — Active Notes

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
