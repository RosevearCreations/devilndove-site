# Database Schema Reference

## Build 140 schema update

Build 140 expands `social_post_queue` with dry-run and scheduling support: `platform_caption_overrides_json`, `media_quality_warnings_json`, `duplicate_signature`, `do_not_repost`, `schedule_timezone`, `dry_run_payload_json`, and `last_dry_run_at`. The queue also has an index for duplicate/repost review. The endpoint self-heals older D1 installs before use, and `database_upgrade_current_pass.sql` includes the Build 140 ledger marker.


## Build 139 schema update

Build 139 extends the social posting schema reference. `social_post_queue` now includes `last_publish_attempt_at` and `api_publish_mode`. `social_post_attempts` now includes `platform_response_id`, `published_url`, `request_mode`, and `http_status`. Existing D1 installations are self-healed by `/api/admin/social-post-queue` before use because SQLite/D1 does not safely repeat unguarded `ALTER TABLE ADD COLUMN` statements. `database_upgrade_current_pass.sql` includes a Build 139 ledger marker.

# Database Schema Reference

## Build 137 schema update

Build 137 adds `seo_opportunity_actions`, a private admin table for Search Console-derived SEO tasks. It stores page URL, query text, priority score, suggested title, suggested meta description, suggested internal-link note, action status, source batch key, user, timestamps, and notes. Supporting indexes were added for action status/priority and page URL. Search Console CSV rows remain in `search_console_page_queries`; import batches remain in `search_console_import_batches`.

## Build 135 schema reference note

No new structural tables are required for Build 135. The media diagnostics and image-health checks use existing `media_assets`, `product_images`, `product_image_annotations`, `products`, `runtime_incidents`, and `schema_migration_ledger` tables. `database_upgrade_current_pass.sql` includes the Build 135 ledger marker.


Current sync: 2026-05-18 — Build 137 Search Console filtering, safe batch revert, and private SEO opportunity action queue.

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

## Build 136 status — 2026-05-18

- Added Operations > Search Console CSV Import.
- Added `/api/admin/search-console-import` for private D1 staging of Search Console CSV exports.
- Added top-page and SEO-opportunity summaries for manual title/meta/internal-link review.
- Added Release Sanity coverage and current-pass SQL table/index self-healing for the Search Console staging tables.
- Keep Search Console CSV exports private; do not store them in public `/data/`.

Next deployment checks: apply/record `database_upgrade_current_pass.sql`, open `/admin/operations/`, import a tiny Search Console CSV sample, then run Release Sanity and Public API Health.


## Build 138 schema additions

- `social_platform_connections` tracks platform readiness, profile URLs, required scopes, and manual/API readiness.
- `social_post_queue` stores reviewed social captions, target platforms, source/job reference, media URLs, status, and schedule notes.
- `social_post_attempts` records manual posted URLs now and future API attempts later.


## Build 141 schema note — social caption templates and UTM links

Build 141 adds/updates these social queue schema pieces:

- `social_caption_templates`
- `social_post_queue.caption_template_key`
- `social_post_queue.content_pillar`
- `social_post_queue.call_to_action`
- `social_post_queue.utm_source`
- `social_post_queue.utm_medium`
- `social_post_queue.utm_campaign`
- `social_post_queue.utm_url`

The `/api/admin/social-post-queue` endpoint self-heals the optional columns before use so older D1 databases do not fail immediately after deployment. The current migration includes the Build 141 ledger marker.


## Build 142 update — Competitive roadmap completed and tracked

- Completed `COMPETITIVE.md` as the active competitive strategy for Devil n Dove, covering positioning, homepage/product-page improvements, mobile UX, local SEO, social workflow, marketplace readiness, product media, trust, and accounting/margin direction.
- Added Operations > Competitive Roadmap so the highest-value items from the document can be seeded into D1, assigned a status, and reviewed during Release Sanity.
- Added `competitive_opportunities` and `competitive_opportunity_events` schema support.
- Added `/data/site/competitive-opportunities.json` as a public-safe roadmap seed file; it contains strategy/action metadata only and no private costs, orders, or customer data.
- Next direction: connect competitive opportunities to product readiness, SEO action completion, social analytics, testimonials, custom requests, and marketplace export checks.
