# Database Schema Reference — Build 244

## Current migration boundary

Build 244 is the current additive production migration:

- numbered: `database_build244_inventory_authority_fractional_usage.sql`
- current pass: `database_upgrade_current_pass.sql`

They are byte-identical. Back up production D1, apply **one** Build 244 file, never both, then confirm ledger key `build244_inventory_authority_fractional_usage`.

Build 244 intentionally uses **no TEMP table and no DROP TABLE**, avoiding the D1 `SQLITE_AUTH` warning encountered by the Build 243 temporary helper cleanup.

## D1 catalog/inventory authority

`catalog_items` is the master descriptive authority for tools/supplies. `site_item_inventory` is the operational stock/cost/reservation authority. Both are D1 tables. Legacy `/data/toolshed/toolshed_items_master.json` and `/data/supplies/supplies_items_master.json` are retained only for static provenance/emergency fallback.

The Build 244 migration contains 897 legacy rows (399 tools + 498 supplies). Missing provenance rows are copied to `catalog_items`, then missing active catalog identities are copied database-side into `site_item_inventory`. Existing reviewed D1 rows win; the migration does not use runtime JSON re-import to overwrite them.

## Fractional usage tables

### `site_inventory_usage_profiles`

One row per inventory identity:

- `usage_tracking_mode`: `exact`, `estimated`, `log_only`, or `reusable`;
- `minimum_usage_increment REAL`;
- notes/audit user/timestamps.

Legacy tool rows without a profile default to `reusable`. Legacy supply rows without a reviewed profile default to `log_only` so an old one-unit assumption cannot empty an entire container.

### `site_inventory_usage_movements`

Preserves both sides of a use event:

- actual `usage_quantity_delta` + usage unit;
- resulting `stock_quantity_delta` + stock unit;
- tracking mode / estimated flag / audit note.

This allows, for example, 3 grams from a 500-gram jar to reduce aggregate stock by `3 / 500 = 0.006` jar rather than one whole jar.

### `creative_project_inventory_usage_details`

Sidecar evidence for Creative Project inventory postings. It records actual usage amount/unit separately from stock-unit consumption and tracking mode, preserving fractional/log-only/reusable project evidence without rewriting historical post IDs.

## Tool/supply classification

Database object identifiers and controlled classifications remain lower-case. Tool/supply classification is editable in Inventory Operations. Reclassification propagates to linked catalog/product-resource identities. If a target active inventory identity already exists, Build 244 can consolidate the mistaken row into the target and retain the old ID inactive for audit/history.

The merge uses the greater stock/reserved/incoming counter rather than blindly summing two legacy duplicates, because many historical rows used default quantity `1`; this avoids inflating physical stock. The canonical quantity should still be owner-reviewed after a duplicate merge.

## Runtime schema rule

Routine Inventory Operations/Product Resources/Product Stock/Purchase Lot requests do not install schema. Numbered migrations own schema. Missing prerequisites return structured migration-required/unavailable JSON when the Worker runtime receives control.

## Aggregate schema scope

- `database_full_schema.sql` — complete supported aggregate and contains the executable Build 244 migration block.
- `database_schema.sql` — historical/core aggregate; project fractional evidence is reflected where owned, while Site Inventory authority remains the current numbered migration/full schema.
- `database_store_schema.sql` — scoped store aggregate; product-resource fractional quantity affinity is current, while Site Inventory authority remains the current numbered migration/full schema.

Historical numbered migrations remain at repository root for deterministic deployment/repair reference. Historical prose/validation belongs under `docs/archive/build-history/`.
