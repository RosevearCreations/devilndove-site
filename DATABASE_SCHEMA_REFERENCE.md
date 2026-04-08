# Database Schema Reference

## Core auth

### users
- user_id
- email
- password_hash
- display_name
- role
- is_active
- created_at
- updated_at
- last_login_at

### sessions
- session_id
- user_id
- session_token
- token
- created_at
- expires_at
- ip_address
- user_agent

Client auth now uses the existing sessions table with a browser cookie fallback for the token so regular pages can resolve the same active session more reliably.

### admin_logs
Admin security and action logging.

## Profiles and tiers

### user_profiles
Customer and employee profile fields including phone, preferences, address, employee info, and emergency contact.

### access_tiers
### user_access_tiers
Business, customer, supporter, and employee tier assignments.

## Commerce

### tax_classes
### products
### product_images
### product_tags
### orders
Includes `payment_status` and `payment_method` in the current schema.

### order_items
### order_status_history
### payments
### payment_refunds
Local refund audit table for admin and provider reconciliation.

### payment_disputes
Local dispute audit table for chargeback and admin follow-up.

## Growth, analytics, SEO, media, and inventory

### site_visitors
Unique visitor identity and country and device summary.

### site_visitor_sessions
Visitor session timeline, entry path, last path, checkout, and abandonment flags.

### site_page_views
Historical page view and event trail.

### site_search_events
Search terms and result counts.

### cart_activity
Cart add, update, checkout, and abandonment events.

### app_settings
App-wide saved settings.

### notification_jobs
### notification_dispatch_logs
Queued notification and dispatch tracking.

### product_seo
Meta title, description, keywords, H1, canonical, and Open Graph fields.

### product_image_annotations
Alt text, title, caption, focal points, and notes.

### media_assets
Uploaded R2-backed assets with product linkage, object key, sort order, optional variant role, and soft delete support.

### webhook_events
Provider event log with idempotency, status, replay request metadata, retry attempt fields, and dispatch notes.

### site_item_inventory
- now includes image_url, preferred_reorder_quantity, is_on_reorder_list, do_not_reorder, do_not_reuse, reuse_status

product_resource_links
- links a finished product to tools and supplies used in making it

movie_catalog
- public movie shelf table. Enrichment can be seeded from `/data/movies/movie_catalog_enriched.v2.json`
Operational inventory table for tools, supplies, and sellable items with on-hand, reserved, incoming, supplier, and cost fields.

### site_inventory_movements
Movement log for inventory creates, adjustments, reserves, releases, incoming changes, corrections, and deletes.
Fields include previous and new on-hand, reserved, and incoming quantities plus note and actor.


## auth_recovery_requests

Stores logged-out forgot-password and forgot-email requests for later admin review without revealing whether a matching account exists.


## catalog_items

Purpose: staged unified catalog storage for tools, supplies, and featured creations that were previously JSON-only. This supports cleaner public search, future analytics, and inventory automation.

Key columns:
- `item_kind` (`tool`, `supply`, `creation`, `other`)
- `source_key` (stable unique source identifier per kind)
- `slug`, `name`, `brand`, `category`, `subcategory`, `item_type`
- `short_description`, `notes`, `image_url`, `r2_object_key`, `amazon_url`
- `quantity_on_hand`, `reorder_point`, `storage_location`
- `source_record_json`, `source_json_path`

## Product CSV mass upload fields

Required fields:
- `name`
- `product_type` (`physical` or `digital`)
- `price_cents`

Optional fields:
- `slug` (auto-generated if omitted)
- `status`, `currency`, `sku`, `short_description`, `description`
- `compare_at_price_cents`, `taxable`, `tax_class_id`, `requires_shipping`, `weight_grams`
- `inventory_tracking`, `inventory_quantity`, `digital_file_url`, `featured_image_url`, `sort_order`

Images are optional during import and can be added during later review before activation.


## Current pass additions
- Session/auth now uses a stronger same-site continuity path: auth endpoints set a first-party `dd_auth_token` cookie in addition to returning the bearer token. Public pages can resolve the signed-in member/admin state more reliably.
- Added `movie_catalog` for staged migration of the legacy UPC-only movie JSON into D1. The public movies page now reads from `/api/movies`, which prefers D1 and falls back to `/data/catalog.json`.
- Catalog sync now supports movies in addition to tools, supplies, and featured creations.
- Public movie search UI now supports title, UPC, year, actor, and director fields when that data exists, while still working with legacy UPC-only data.
- Product CSV preview now renders as a structured validation table instead of loose JSON/text lines.


## Current pass update
- `movie_catalog` schema references now include the richer admin-overlay movie fields: `original_title`, `imdb_id`, `alternate_identifier`, `metadata_status`, `metadata_source`, estimated value fields, `rarity_notes`, `collection_notes`, and `value_search_url`.
- `database_schema.sql`, `database_store_schema.sql`, and `database_upgrade_current_pass.sql` were synchronized forward so older environments have a clearer upgrade path for the current movie/editor/admin flows.
- Movie catalog wiring now blends D1 `movie_catalog`, `/data/movies/movie_catalog_enriched.v2.json`, and the R2-hosted cover images more safely.
- Movie search now supports title, UPC, year, actor, director, genre, studio, format, and optional trailer-link filtering.
- `trailer_url` is now part of the movie enrichment path so trailer support can be stored directly when available.
- Storefront product detail now includes linked tools and supplies from `product_resource_links` so each finished product can tell a clearer “made with these materials and tools” story.
- Admin product-resource linking now supports usage notes for story-building and social-post context.
- Admin inventory can now sync tool and supply records from `catalog_items` into `site_item_inventory`, reducing duplicate maintenance between JSON, catalog, and inventory records.
- Continue the one-H1-per-exposed-page rule and continue improving page titles, descriptions, canonical tags, crawl paths, structured data relevance, and visible on-page content alignment on every outward-facing pass.


## Current pass notes

- `movie_catalog` remains the long-term home for enriched movie metadata, while `data/movies/movie_catalog_enriched.v2.json` currently provides the live R2-backed image bridge for front/back covers.
- `site_item_inventory` continues to be the operational inventory table for tools and supplies, including reorder, do-not-reorder, and do-not-reuse controls.
- `product_resource_links` remains the relationship table connecting finished products to the tools and supplies used during the build process.


## Current pass schema note

No brand-new core tables were required for this pass. The largest work was defensive compatibility around existing `products`, `catalog_items`, `site_item_inventory`, `movie_catalog`, analytics, and webhook tables so partially migrated databases do not break the admin/dashboard JSON endpoints.


## Current pass update

- Mobile finished-product capture page added at `/admin/mobile-product/` for phone-first product entry.
- The phone workflow now assigns the next available product number, supports category, colour, shipping code, tax code, SEO title/meta description, direct image upload to R2, and optional tool/supply links.
- Products created from the phone workflow are saved as draft items with `review_status = pending_review` so they can be reviewed before publishing.
- Product records now support `product_number`, `product_category`, `color_name`, `shipping_code`, and `review_status`.
- Storefront/admin product search can now match category and colour more directly.
- SEO guidance remains aligned with Google Search Central: one clear H1 per outward-facing page, descriptive title links, page-specific meta descriptions, crawlable internal links, and structured data that matches visible content.

## Current pass update

- The creations page now uses explicit white-card contrast styling so the text, buttons, and filter controls match the rest of the site instead of showing pale text on pale cards.
- The movie system now prefers `movie_catalog_enriched.v2.json`, and the uploaded v2 file has been copied into `/data/movies/` so the public API reads the newer enrichment file first.
- The mobile finished-product capture workflow now includes a stock-aware lookup for tools and supplies, with filters for tools-only, supplies-only, and in-stock-only browsing while you build a product from a phone.
- The public tools page now mirrors the supplies-page reorder workflow with local reorder-list actions: add to reorder, show reorder-needed only, copy reorder text, and clear the list.
- Search-engine wording guidance for outward-facing pages continues to emphasize high-intent phrases around handmade jewelry, custom rings, necklaces, polymer clay earrings, laser engraved gifts, CNC components, 3D printed items, workshop tools, and workshop supplies for Ontario and Canada shoppers.


## Current pass

- Movie shelf layout and pagination were repaired.
- No new schema tables were introduced in this pass; the focus was stability, layout repair, safer headers, and clearer risk documentation.


## Current pass update

- Rebuilt the public movie shelf layout with a dedicated card and pager structure so movie entries no longer collapse into unusable one-character columns.
- The movies page now uses the API paging metadata to show the real total catalog size, page number, page range, and next/previous navigation more honestly.
- Added a more defensive movie-specific CSS layer so future generic card/grid changes are less likely to break the movie shelf again.
- KNOWN_GAPS_AND_RISKS.md was rewritten to document the remaining payment, inventory, media, analytics, and metadata risks more clearly.


### admin_action_audit
Server-side audit trail for privileged operator actions such as product create/update/delete, inventory edits, media uploads, and webhook review actions.

### auth_recovery_requests additions
Now stores `ip_address` and `user_agent` for safer manual review and light abuse throttling.


### notification_outbox
Durable local queue for outbound receipts and related customer/admin notifications.

### payment_refunds / payment_disputes sync fields
`provider_sync_status`, `provider_sync_note`, and `provider_sync_at` record whether the local action was also pushed to the provider or is still local/manual only.

### products readiness fields
`is_ready_for_storefront` and `ready_check_notes` help govern draft-to-publish workflow.

### site_item_inventory authority fields
`supplier_contact`, `reservation_notes`, `last_reorder_requested_at`, and `last_counted_at` support more trustworthy inventory operations.



## Current pass operational notes

- No new required tables were added in this pass.
- Existing `notification_outbox` is now actively used by a real dispatch helper and admin processing endpoint.
- Existing `payment_disputes` is now updated from Stripe dispute webhook events, not only manual admin entry.
- Existing schema now supports stronger admin step-up confirmation without another table because password confirmation is checked against the current admin session.

## Current pass schema additions

### `supplier_purchase_orders`
Draft reorder header records grouped by supplier so inventory reorder work can be staged, reviewed, and later submitted.

### `supplier_purchase_order_items`
Line items for supplier purchase-order drafts, linked back to `site_item_inventory` where possible.

### `product_review_actions`
Durable audit trail of governed product review actions such as approve, needs changes, publish, and unpublish.



## Current pass update
- `supplier_purchase_orders` now includes ordered/received lifecycle timestamps.
- `supplier_purchase_order_items` now track `quantity_received`, `incoming_applied_at`, and `received_at` to support inventory receiving automation.

- No new tables were required in this pass. Inventory governance improvements were implemented through action-path logic and existing `site_item_inventory`, `site_inventory_movements`, and `product_resource_links` tables.


## Current pass update
- No new schema objects were required in this pass.
- Existing `notification_outbox` is now used more actively because refund/dispute admin actions and provider-confirmed Stripe webhook events both attempt immediate delivery processing.
- Existing storefront/product tables now support richer outward-facing discovery through API-level filter summaries without additional schema changes.

## Current pass schema note
- No new tables were added in this pass.
- This pass instead increased use of existing schema paths: `products`, `product_images`, `product_tags`, `product_seo`, `product_image_annotations`, and `media_assets` are now used more fully by bulk import and direct media-upload flows.



## Current pass schema note
- No new mandatory tables were added in this pass.
- Current-pass code uses existing schema more fully, especially `site_item_inventory`, `site_inventory_movements`, `product_resource_links`, `product_images`, `product_image_annotations`, `media_assets`, `site_page_views`, and `order_items`.
- Dashboard/reporting now also leans on duplicate-media counts and product build-risk calculations derived from existing tables rather than new schema additions.


## Current pass schema note
- No new tables were required in this pass.
- This pass extended the use of existing product/resource/media tables by exposing richer reservation and product-detail payloads rather than adding new schema objects.


## Current pass additions
- `products.capture_reference` stores a temporary phone-first intake identifier for partial product drafts.
- `movie_catalog` now supports `imdb_id`, `alternate_identifier`, `metadata_status`, and `collection_notes` so admin can curate or review movie metadata directly in D1.


## Current pass schema note

### movie_catalog
Current practical role:
- manual/admin overlay table for movie metadata edits
- not yet the primary authoritative source for the live movie shelf

Important compatibility note:
Older databases may have an early `movie_catalog` shape that is missing later columns such as:
- `imdb_id`
- `alternate_identifier`
- `metadata_source`
- `estimated_value_low_cents`
- `estimated_value_high_cents`
- `estimated_value_currency`
- `rarity_notes`
- `collection_notes`
- `value_search_url`
- `original_title`

Admin movie write routes should therefore ensure column compatibility before insert/update operations.

### products partial-intake note
Products now need to support a real partial-draft intake path for phone-first capture and CSV-first bulk entry. Publish-time validation can remain stricter, but early draft-save validation must stay light.

- New finished-product numbering now starts at DD1000 for newly created products. Internally the database still stores the numeric portion as `1000`, `1001`, and so on, while the UI can present the public/admin-friendly `DD1000` style code.
- Added a first-pass installable phone experience with `manifest.webmanifest`, `sw.js`, and generated app icons so visitors can save Devil n Dove to a home screen more cleanly than a plain browser shortcut.
- Added a new `/socials/` page backed by `/data/site/social-feed.json` and seeded it with your current profile links plus a first saved list of five public YouTube videos.
- The admin tools-and-supplies inventory editor now includes a barcode-photo helper that can fill the external key from a phone photo when the browser supports `BarcodeDetector`. It prepares an Amazon search link, but full product-detail import from Amazon is still blocked until Amazon Product Advertising API credentials or another approved catalog source is added.

## Current pass addendum
- Normalized public route links away from explicit `/index.html` navigation and added a `_redirects` file so direct `.../index.html` requests resolve more cleanly alongside directory routes.
- Expanded the installable phone shell with a stronger manifest, install prompt handling, Apple home-screen metadata, and an offline fallback page.
- Added another CSS hardening pass for mobile/admin layout overflow and dark-mode calendar/date picker visibility.
- This pass did not require a new D1 schema table change; schema reference files were refreshed to reflect that the changes were routing/PWA/CSS/app-shell focused rather than DB-structure focused.


## Current pass note
This pass did not introduce new D1 tables or column additions. The main repo changes were:
- stronger browser/app security defaults through `_headers`
- tighter service-worker behavior around sensitive routes
- mobile/admin UI expansion with `/admin/mobile-inventory/`
- repo cleanup using `RM_` prefixes for duplicate/unlinked files


## Current pass addendum
- Added `accounting_order_records` as a lightweight order-linked accounting shadow table. It is not the final accounting backend, but it preserves booked totals, outstanding amounts, and tax liability from the moment an order is created.


## Current pass addendum
- Fixed the Admin-to-Members override preview so `admin_preview=1` no longer falls through into the member-login redirect path.
- Hardened the admin products read path with a degraded-query fallback so older or partially migrated D1 schemas do not throw a dashboard-breaking 500.
- Restored admin movie save/load through the shared authenticated admin fetch helper instead of a bare same-origin fetch path.
- Re-enabled collapsible admin panels with local-state persistence and safer service-worker handling for `/api/` and protected routes.


## Current pass addendum
Newer live-start tables expected by the current membership/accounting build now include `membership_tier_policies`, `accounting_expenses`, `product_costs`, `accounting_writeoffs`, and `general_ledger_accounts`.
