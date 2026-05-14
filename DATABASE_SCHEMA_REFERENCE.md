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
