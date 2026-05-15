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
