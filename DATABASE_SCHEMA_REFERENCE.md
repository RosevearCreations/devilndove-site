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
- public movie shelf table. Enrichment can be seeded from `/data/movies/movie_catalog_enriched.json`
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
- Movie catalog wiring now blends D1 `movie_catalog`, `/data/movies/movie_catalog_enriched.json`, and the R2-hosted cover images more safely.
- Movie search now supports title, UPC, year, actor, director, genre, studio, format, and optional trailer-link filtering.
- `trailer_url` is now part of the movie enrichment path so trailer support can be stored directly when available.
- Storefront product detail now includes linked tools and supplies from `product_resource_links` so each finished product can tell a clearer “made with these materials and tools” story.
- Admin product-resource linking now supports usage notes for story-building and social-post context.
- Admin inventory can now sync tool and supply records from `catalog_items` into `site_item_inventory`, reducing duplicate maintenance between JSON, catalog, and inventory records.
- Continue the one-H1-per-exposed-page rule and continue improving page titles, descriptions, canonical tags, crawl paths, structured data relevance, and visible on-page content alignment on every outward-facing pass.


## Current pass notes

- `movie_catalog` remains the long-term home for enriched movie metadata, while `data/movies/movie_catalog_enriched.json` currently provides the live R2-backed image bridge for front/back covers.
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
