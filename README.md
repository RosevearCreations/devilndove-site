# Devil n Dove Website

Devil n Dove is a public website, storefront, member area, and admin management system for the workshop.

## Current state

The current build includes:

- public storefront and product detail pages
- member login, registration, account tools, orders, and downloads
- admin dashboard for users, products, orders, analytics, inventory, SEO, notifications, and media
- checkout and order creation
- PayPal handoff, PayPal return capture, and PayPal webhook reconciliation
- Stripe hosted checkout preparation and Stripe webhook reconciliation
- webhook event logging for provider idempotency and audit trail
- admin webhook review and safe replay queue controls
- live visitor/session analytics and historical website data by path and country
- product SEO fields, product image annotations, and product media workflow tools
- direct image upload endpoint for R2-backed product media
- uploaded asset browsing and delete actions in admin
- public site search page with structured data support and search-event logging
- shared footer-driven site search and crawl-discovery links on every page
- floating logged-in account widget available sitewide
- shared auth token persistence now uses localStorage plus a sitewide cookie fallback so public pages can detect active sign-in more reliably
- shared footer injection hardened so the footer remains visible across standard site pages
- admin dashboard layout pass with cleaner summary cards, more uniform inputs/tables, and a live activity feed
- account-help page for forgot-password and forgot-email request logging
- site inventory and reorder tracking for tools, supplies, and sellable products
- inventory movement history logging for stock changes
- local refund and dispute workflow logging for orders and payments
- live admin activity feed for recent searches, visitor sessions, cart events, orders, and webhook activity

## Main payment status

Implemented now:

- order creation
- payment preparation
- PayPal redirect handoff
- PayPal return capture
- PayPal webhook reconciliation endpoint
- Stripe Checkout session creation
- Stripe webhook reconciliation endpoint
- webhook event storage for duplicate-event safety
- admin manual payment recording
- admin webhook review and requeue controls
- refund and dispute local tracking tables and admin actions

Still to deepen later:

- actual provider-side refund execution and sync-back confirmation
- provider dispute evidence upload and response workflow
- webhook worker retry scheduling beyond manual replay queueing
- optional Stripe customer portal and saved customer records later

## Main product and media status

Implemented now:

- create, edit, archive, and delete products
- bulk update products
- import preview and import tools with duplicate slug checks
- product SEO editor
- product image annotation editor
- product image workflow editor for ordered images, alt text, captions, focal points, and featured image sync
- direct admin upload endpoint for product images to R2
- uploaded asset library browsing and delete actions in admin
- storefront search page spanning products, tools, supplies, creations, and key pages
- inventory tracking on products and site inventory records
- inventory movement history foundation

## Public SEO and search policy now in force

For every future public-facing update:

- every outward-facing page must have exactly one H1
- no outward-facing page may ship without a title, meta description, canonical URL, and index/follow or noindex/follow decision
- social tags should exist for outward-facing pages: Open Graph and Twitter card tags
- public pages should use structured data where practical
- private utility pages such as login, register, cart, checkout, members, bootstrap, and health pages should stay `noindex`
- sitemap and robots.txt must be reviewed whenever public pages are added or removed
- search visibility and crawl awareness should be improved a little every pass, not treated as a one-time task
- every shared-layout pass should preserve the shared footer, shared account widget, and search-discovery links sitewide
- shared auth/session UI must remain consistent between admin and outward-facing pages so an active admin session is visible across the regular site too
- formatting passes should keep forms, tables, widgets, and dashboard cards visually consistent rather than page-specific

## Database files

- `database_schema.sql`
- `database_store_schema.sql`
- `database_access_tiers.sql`
- `database_payments_extension.sql`
- `database_profiles_extension.sql`
- `database_growth_analytics_seo_extension.sql`
- `database_full_schema.sql`
- `database_upgrade_current_pass.sql`
- `database_admin_seed_template.sql`

## Important endpoints

Auth:
- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/logout-all`
- `/api/auth/me`
- `/api/auth/change-password`
- `/api/auth/session-info`
- `/api/auth/bootstrap-admin`
- `/api/auth/bootstrap-status`

Storefront and checkout:
- `/api/products`
- `/api/product-detail`
- `/api/checkout-create-order`
- `/api/checkout-prepare-payment`
- `/api/paypal-return`
- `/api/paypal-webhook`
- `/api/stripe-webhook`
- `/api/site-search-event`

Admin operations added or deepened in the recent passes:
- `/api/admin/live-activity`
- `/api/admin/webhook-events`
- `/api/admin/payment-actions`
- `/api/admin/media-assets`
- `/api/admin/site-item-inventory`
- `/api/admin/product-resources`
- `/api/movies`
- `/api/admin/import-products-preview`


## Current caution

JSON-backed collections still exist for some public sections such as tools, supplies, and creations. The site search works across them today, but a staged move of those collections into D1 would make future search, inventory, analytics, and admin tooling much stronger.


## Latest pass additions

- CSV-first mass upload workflow for products with a downloadable template. Required fields are `name`, `product_type`, and `price_cents`; `slug` is optional and auto-generated when omitted.
- Featured images remain optional during import and can be added later during product review before store-ready status is applied.
- Began staged D1 migration for tools, supplies, and featured creations through the new `catalog_items` table and admin sync tooling.
- Public search, tools, and supplies pages now prefer database-backed catalog items when available and fall back to JSON when a sync has not been run yet.


## SEO operating note

Public SEO passes should stay aligned with current Google Search guidance: strong title links, useful meta descriptions, one clear H1 per outward-facing page, crawlable canonicals/robots intent, and structured data that matches visible content.


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


## Current pass highlights

- Replaced the sample movie enrichment file with the real R2-backed `movie_catalog_enriched.v2.json` so the movie page can resolve live front/back cover URLs instead of placeholder `/assets/movies` paths.
- Hardened `/api/movies` to blend D1, enriched JSON, and legacy rows more safely, including derived R2 cover fallbacks and trailer-search links when a stored trailer URL is not available yet.
- Added a new admin product stock report for finished products so the dashboard can show what is on hand, what is running low, and which linked tools/supplies are causing build-risk or reorder pressure.
- Tightened admin site inventory controls with filter views (`low`, `reorder`, `do_not_reuse`) and one-click sync buttons for tools and supplies from the D1-backed catalog sync layer.
- Continued the D1 relationship model for “how this was made” storytelling by keeping finished products linked to tools and supplies with usage notes for future social/story output.


## Current pass update

- Replaced the placeholder movie enrichment file with the uploaded R2-backed `movie_catalog_enriched.v2.json` so the public movie page reads real cover URLs.
- Hardened `/api/products`, `/api/admin/dashboard-summary`, `/api/admin/site-item-inventory`, `/api/admin/product-stock-report`, `/api/admin/visitor-analytics`, `/api/admin/live-activity`, `/api/admin/webhook-events`, and `/api/admin/catalog-sync` so incomplete seed data or partially-migrated tables return safe JSON instead of HTML error pages.
- Updated the movie page to render cover images from `/api/movies` and show richer metadata when it exists, while showing a clear enrichment-pending message when titles and credits are still blank in the source JSON.
- Product image annotations now default to a clean empty array UI instead of example JSON pasted into the textarea itself.
- SEO/search guidance remains aligned with Google Search Central guidance around clear title links, useful meta descriptions, JSON-LD structured data, and visible-content alignment. 


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


## Current pass update

- Rebuilt the public movie shelf layout with a dedicated card and pager structure so movie entries no longer collapse into unusable one-character columns.
- The movies page now uses the API paging metadata to show the real total catalog size, page number, page range, and next/previous navigation more honestly.
- Added a more defensive movie-specific CSS layer so future generic card/grid changes are less likely to break the movie shelf again.
- KNOWN_GAPS_AND_RISKS.md was rewritten to document the remaining payment, inventory, media, analytics, and metadata risks more clearly.


## Current pass highlights

- Admin action audit logging added for product, inventory, media, and webhook operations.
- Account-recovery requests now capture IP/user-agent and apply light abuse throttling.
- Webhook processing records now advance retry metadata more consistently.

## Current pass update

- Added provider-aware refund sync attempts for Stripe and PayPal in the admin payment workflow.
- Added `notification_outbox` as a durable local queue for refund/dispute receipt messages.
- Rewrote the admin inventory API to support create, reserve, release, receive, reorder-request, and catalog-sync operations with stronger movement logging.
- Expanded admin media controls with restore/replace metadata support and duplicate visibility.
- Expanded dashboard and visitor analytics with funnel-style metrics.
- Added product readiness checks so draft/publish workflow has clearer storefront-readiness signals.



## Current pass update

- Added `/api/stripe-return` for Stripe Checkout return reconciliation.
- Added `/api/creations` for centralized finished-creations reads.
- Added `/api/admin/notification-outbox` for queued-notification review, retry, cancel, and dispatch.
- Added shared admin password-confirmation step-up protection on destructive actions.
- Added Stripe dispute upserts from webhook events.

### Mail-related environment variables now expected for live delivery
- `RESEND_API_KEY`
- `NOTIFICATION_FROM_EMAIL`
- `NOTIFICATION_ADMIN_TO` or `ACCOUNT_HELP_REVIEW_EMAIL`

## Current pass additions
- Governed product review and publish actions
- Product build-cost rollups from linked tools and supplies
- Supplier purchase-order draft workflow
- Expanded analytics for referrers, entry paths, and zero-result searches



## Current pass update
- Public tools and supplies pages now have centralized API read paths (`/api/tools`, `/api/supplies`) with JSON fallback during migration.
- Purchase-order receiving can now apply ordered quantities into incoming stock and received quantities into on-hand stock.

- Added shared product-level inventory reservation/release actions for linked resource governance.
- Public `/api/tools`, `/api/supplies`, and `/api/creations` now include filter-group summaries for discovery/filter UX.
- Hardened `/api/admin/product-mobile-bootstrap` by switching it to shared admin auth and corrected inventory reorder fields.


## Current pass update
- Refund/dispute actions now attempt immediate queued receipt delivery when mail credentials are configured.
- Stripe webhook reconciliation now also queues and attempts provider-confirmed refund/dispute customer notices.
- `/api/products` now returns discovery-friendly filter summaries for category, colour, and product type.
- Public tools and supplies pages now consume their dedicated centralized APIs instead of the broader generic catalog endpoint.

## Current pass update
- Bulk product import is now more production-friendly: preview checks duplicate slugs, SKUs, and product numbers, and import can seed richer finished-product fields, SEO rows, tags, and extra product images.
- Admin media upload can now attach uploads directly to product galleries and optionally set the featured image, making the R2 upload flow more reusable during product-entry work.



## Current pass update
- Added frontend product-resource reservation controls in the admin stock report.
- Expanded storefront product detail media payloads with grouped image data and variant-role hints.
- Expanded analytics with top product page paths and top ordered products.
- Continued reducing public JSON duplication by moving more reads onto `/api/supplies` and `/api/tools`.


## Current pass highlights
- Added reserve/release linked-resource controls to the main admin products list.
- Moved toolshed discovery more firmly behind the centralized `/api/tools` authority path.
- Expanded storefront product detail to return build-summary context and lightweight image variant-url hints.


## Current pass additions
- `data/finished_products_import_template.csv` provides a detailed starter format for bulk finished-product uploads.
- `/admin/mobile-product/` now supports partial draft saves using `capture_reference` plus optional photos.
- Admin now includes a movie catalog editor backed by `/api/admin/movies`.


## Current movie workflow note
- The live movie collection currently remains JSON-first, with `data/movies/movie_catalog_enriched.v2.json` acting as the base truth.
- D1 `movie_catalog` is presently used as a manual overlay for edits and added metadata rather than a complete authoritative replacement.
- The admin movie editor should therefore load the JSON-backed movie card details first, then save manual updates into the overlay path.

## Current finished-product intake note
- Phone-first product capture must continue supporting partial drafts so workshop intake can happen quickly even when only a photo, temporary reference, or partial description is available.
- Bulk finished-product entry should use the detailed CSV template as the preferred mass-upload path for more complete product records.

## Current pass update
- Catalog sync now uses `movie_catalog_enriched.v2.json` for movie imports so repo-side sync matches the JSON-first movie source already used elsewhere.
- Schema references and upgrade SQL were aligned with the current movie overlay/editor fields and the governed review/reorder tables already present in the codebase.
- Exposed HTML pages were checked again and continue to keep a single H1 per page.
