# AI Context

## Current phase

This repo is in the payment, media, inventory, and public SEO hardening phase after the main storefront, auth, and admin foundations were already built.

## Important truths right now

- orders are created before payment handoff
- PayPal is a redirect, return, and webhook flow
- Stripe is now a hosted checkout and webhook flow
- webhook events are stored in `webhook_events` for idempotency and manual replay queueing
- product media is managed through ordered `product_images` plus `product_image_annotations`
- direct uploads now go into R2 and can be browsed from `media_assets` in admin
- local refund and dispute records now live in `payment_refunds` and `payment_disputes`
- inventory records now track reserved, incoming, supplier, and cost fields
- inventory changes now also write to `site_inventory_movements`
- public-facing pages are expected to maintain a one-H1 rule and a complete metadata baseline
- public search awareness now includes sitemap, robots intent, structured data, and the `/search/` page

## Best next priorities after this pass

1. webhook worker and scheduler hardening
2. provider-confirmed refund and dispute sync
3. richer media library management with variants, thumbnails, and replace flow
4. deeper inventory movement history UX and automation
5. dashboard and reporting polish
6. keep improving crawl, metadata, and search-awareness coverage each pass

## Files that matter most for the new pass

- `functions/api/checkout-prepare-payment.js`
- `functions/api/paypal-webhook.js`
- `functions/api/stripe-webhook.js`
- `functions/api/admin/webhook-events.js`
- `functions/api/admin/payment-actions.js`
- `functions/api/admin/media-upload.js`
- `functions/api/admin/media-assets.js`
- `functions/api/admin/site-item-inventory.js`
- `functions/api/site-search-event.js`
- `functions/sitemap.xml.js`
- `public/js/admin-product-images.js`
- `public/js/admin-webhook-events.js`
- `public/js/admin-site-item-inventory.js`
- `public/js/site-search.js`
- `database_payments_extension.sql`
- `database_growth_analytics_seo_extension.sql`
- `database_full_schema.sql`
- `database_upgrade_current_pass.sql`


- Shared layout currently depends on `main.js` for nav/footer and `site-auth-ui.js` for the floating account widget.
- Logged-out recovery links point to `/account-help/`, which records requests in `auth_recovery_requests`.


- Shared auth/session fixes should preserve sign-in visibility across admin and outward-facing pages.
- Keep the one-H1 rule intact on outward-facing pages while continuing incremental SEO/crawl improvements each pass.
- Shared footer and account widget are baseline layout requirements now.


- Current migration strategy: keep public pages operational with JSON fallback, but prefer D1 `catalog_items` for tools, supplies, and featured creations once admin sync has been run.
- Current product import strategy: CSV-first mass upload with image fields optional during import.


## Current pass additions
- Session/auth now uses a stronger same-site continuity path: auth endpoints set a first-party `dd_auth_token` cookie in addition to returning the bearer token. Public pages can resolve the signed-in member/admin state more reliably.
- Added `movie_catalog` for staged migration of the legacy UPC-only movie JSON into D1. The public movies page now reads from `/api/movies`, which prefers D1 and falls back to `/data/catalog.json`.
- Catalog sync now supports movies in addition to tools, supplies, and featured creations.
- Public movie search UI now supports title, UPC, year, actor, and director fields when that data exists, while still working with legacy UPC-only data.
- Product CSV preview now renders as a structured validation table instead of loose JSON/text lines.


## Current pass update
- Movie catalog wiring now blends D1 `movie_catalog`, `/data/movies/movie_catalog_enriched.v2.json`, and the R2-hosted cover images more safely.
- Movie search now supports title, UPC, year, actor, director, genre, studio, format, and optional trailer-link filtering.
- `trailer_url` is now part of the movie enrichment path so trailer support can be stored directly when available.
- Storefront product detail now includes linked tools and supplies from `product_resource_links` so each finished product can tell a clearer “made with these materials and tools” story.
- Admin product-resource linking now supports usage notes for story-building and social-post context.
- Admin inventory can now sync tool and supply records from `catalog_items` into `site_item_inventory`, reducing duplicate maintenance between JSON, catalog, and inventory records.
- Continue the one-H1-per-exposed-page rule and continue improving page titles, descriptions, canonical tags, crawl paths, structured data relevance, and visible on-page content alignment on every outward-facing pass.


## Current pass reminders

- Do not restore the movie catalog to the old placeholder `/assets/movies/...-front.jpg` sample paths; use the uploaded R2-backed enrichment JSON.
- Maintain the relationship between finished products and linked tools/supplies because it supports future storytelling, social content, and build-history features.


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


- Current pass added admin audit visibility and light recovery throttling; future security passes should build on those instead of duplicating them in parallel tables or logs.


Current-pass emphasis:
- Payment admin flow now attempts provider refund sync where possible.
- Inventory API now supports action-specific mutations and improved ledger notes.
- Product readiness is now a first-class admin concern.
- Notification outbox is now present for later email/SMS delivery work.



## Current pass update
- Stripe Checkout now has a dedicated return-finalize endpoint at `/api/stripe-return`, and the confirmation page calls it automatically when `session_id` is present.
- Stripe webhook handling now confirms and upserts local dispute records for `charge.dispute.*` events.
- `notification_outbox` is no longer queue-only; there is now a dispatch helper plus admin endpoint for queued/retry delivery.
- Shared admin step-up password confirmation now protects destructive actions.
- Public creations now load through `/api/creations` first so finished-creation reads can keep moving away from scattered JSON-only page logic.
- Production receipt and recovery delivery now expect mail credentials such as `RESEND_API_KEY` and `NOTIFICATION_FROM_EMAIL`.

## Current pass update
- Added governed product review actions at `/api/admin/product-review-actions` so approve, needs-changes, publish, and unpublish are now explicit audited operations instead of only status edits.
- Added `product_review_actions` as the durable review log for draft-to-publish governance.
- Added `/api/admin/product-cost-rollups` and expanded the product list so linked tools/supplies now surface estimated build cost, missing cost links, and rough margin visibility.
- Added supplier purchase-order draft support with `supplier_purchase_orders` and `supplier_purchase_order_items`, plus `/api/admin/purchase-orders` for grouped reorder workflow.
- Inventory responses now include supplier-grouped reorder suggestions so reorder work can move toward a more governed D1-first path.
- Visitor analytics now expose top referrers, top entry paths, and zero-result site searches to improve discovery and merchandising diagnostics.



## Current pass update
- Public tools and supplies now prefer centralized `/api/tools` and `/api/supplies` read paths with JSON fallback during migration.
- Gallery and creations now prefer centralized API reads instead of depending only on direct items-for-sale JSON reads.
- Supplier purchase orders now support ordered-to-incoming and received-to-on-hand inventory automation with per-line received quantity tracking.

- Product-level inventory reservation now has a shared admin action path so linked tools/supplies can be reserved or released together during build/publish prep.
- Public tools, supplies, and creations APIs now expose filter-group summaries for category/type discovery improvements.
- Mobile product bootstrap now uses the shared admin auth helper and corrected inventory reorder fields to avoid false bootstrap failures.


## Current pass update
- Admin refund/dispute actions now try to dispatch queued receipt emails immediately instead of relying only on later outbox processing.
- Stripe webhook reconciliation now queues and attempts provider-confirmed customer notices for refund/dispute events when customer email is present.
- `/api/products` now exposes `filter_groups` for category, colour, and product type discovery.
- Public tools and supplies pages now read through `/api/tools` and `/api/supplies` instead of the broader generic catalog endpoint, reducing another outward-facing duplication path.
- No new schema tables were required in this pass; the work used existing payments, notification, catalog, and storefront tables.

## Current pass update
- Bulk product import now validates and seeds newer finished-product fields more fully: product number, category, colour, shipping code, review status, SEO rows, tags, and extra product images can all be staged during import.
- Direct admin media upload can now attach an uploaded image directly into `product_images`/`product_image_annotations`, optionally set it as featured, and carry a simple variant-role note so the R2 upload path is more reusable across product-entry workflows.



## Current pass update
- Admin stock reporting now supports batch reserve/release actions for linked product resources from the frontend, not only the inventory API.
- Storefront product detail now includes grouped image data with variant-role awareness and annotated-image grouping.
- Admin media asset reads now expose derived variant URL suggestions to support later thumbnail/variant rollout.
- Visitor analytics now surface top product-detail paths and top ordered products for better merchandising diagnostics.
- Public supplies and tools-health reads now lean more consistently on centralized API authority instead of direct page-level JSON reads.


## Current pass update
- Admin product list now exposes reserve/release actions for linked product resources, extending reservation governance beyond the stock-report-only path.
- The public toolshed page now depends on `/api/tools` as its main authority path instead of chaining through multiple direct JSON fallbacks.
- Storefront product detail now returns `build_summary` and lightweight `variant_urls` hints for each image so later media-variant rollout has a cleaner contract.


- Current pass update: mobile finished-product capture now allows partial draft intake with a `capture_reference`, so one photo or temporary identifier is enough to save a draft and continue.
- Current pass update: admin now has a movie catalog detail editor backed by `movie_catalog` for title/year/actor/UPC/IMDb-id/manual-note editing.
- Current pass update: `/data/finished_products_import_template.csv` is now the detailed CSV template for bulk finished-product uploads.


## Current pass update
- Movie workflow is now explicitly JSON-first again: `data/movies/movie_catalog_enriched.v2.json` remains the movie base truth for the public shelf and admin listing.
- D1 `movie_catalog` is now treated as a manual edit overlay for movie details rather than the primary source of truth. This lets admin add missing title, year, actor, director, UPC, metadata-source, rarity, value, and notes fields without breaking the live movie shelf.
- The movie admin editor is expected to show front and back covers plus the richer metadata already present in the JSON rows, then allow manual edits on top of those fields.
- The movie save route now needs to harden old-table compatibility by ensuring late-added columns such as `imdb_id`, `metadata_source`, value fields, and notes fields exist before writes.
- Mobile finished-product capture now needs to preserve a true partial-draft workflow: photo-only, name-only, or reference-only records must be savable without the later mandatory publish fields.
- A detailed finished-product CSV template is now a repo requirement so most completed products can be imported in bulk while partial rows can still enter as draft records.

## Current pass update
- Catalog sync now uses `movie_catalog_enriched.v2.json` for movie imports so repo-side sync matches the JSON-first movie source already used elsewhere.
- Schema references and upgrade SQL were aligned with the current movie overlay/editor fields and the governed review/reorder tables already present in the codebase.
- Exposed HTML pages were checked again and continue to keep a single H1 per page.
