# Database Schema Reference — Build 243

## Current migration boundary

Build 243 is the current additive production migration:

- numbered: `database_build243_inventory_resilience_case_normalization.sql`
- current pass: `database_upgrade_current_pass.sql`

These files are byte-identical. Build 243 assumes the Build 241 CAIP migration has already been applied. Back up production D1, apply **one** Build 243 file once, never both, then confirm ledger key `build243_inventory_resilience_case_normalization`.

Build 243 does not add another mutable inventory authority. It cleans and indexes the existing authorities so routine admin reads can stop probing/repairing schema at request time.

## Build 243 normalization policy

Database object identifiers (tables, indexes, views and triggers) are lower-case. Controlled classification values are also normalized to lower case where case has no business meaning:

- product category, colour and shipping code;
- catalog item kind/category/subcategory/type;
- inventory source type, category, stock/usage unit labels and reuse status;
- inventory movement source type;
- product-resource kind;
- persisted catalog option arrays.

Build 243 intentionally **does not** force human-facing product/item names, supplier names, URLs, ASIN/SKU/order identifiers, currencies, notes or other external/display values to lower case. Changing those values could damage identity, readability or third-party reconciliation.

## Case-duplicate inventory merge

Active `site_item_inventory` records with the same exact `external_key` and a `source_type` that differs only by case are consolidated. The oldest record remains the canonical active ID; stock/reserved/incoming quantities are aggregated. Later duplicate IDs are retained as inactive audit/history rows with `reuse_status='merged_case_duplicate'` rather than being deleted, protecting foreign-key/history references.

The partial unique expression index `idx_site_item_inventory_identity_lower_active` prevents a future active duplicate of that same case-insensitive source identity.

## Runtime schema rule

Routine Inventory Operations, Product Resources, Product Stock and Purchase Lot requests must not create, alter or index schema. Migrations own schema. If a required current column/table is missing, the API returns a structured migration-required/unavailable response rather than attempting live DDL under user traffic.

## Aggregate schemas

All three schema files are marked current for Build 243, while their historical scopes are preserved:

- `database_full_schema.sql` — supported complete aggregate and contains the executable Build 243 normalization/index block;
- `database_schema.sql` — legacy/core historical overlay; it does not define the full Site Inventory authority, so it carries a Build 243 scope note rather than replaying SQL against missing tables;
- `database_store_schema.sql` — scoped store aggregate; likewise carries the Build 243 scope note because it does not own the full Site Inventory authority.

`database_upgrade_current_pass.sql` is an exact copy of the numbered Build 243 migration.

## Historical migrations

Numbered SQL migrations remain at repository root because deployment/repair tooling addresses them by exact filename. Historical Build prose/validation belongs under `docs/archive/build-history/`. Use `AI_HANDOFF.md` for current deployment order rather than inferring the active boundary from an older release note.
