# Repo Base Guide

## Purpose

This repo runs the Devil n Dove website as:

- brand and public site
- storefront
- member area
- admin dashboard
- payment and webhook layer
- analytics and operations layer
- SEO and crawl-awareness layer

## Important folders

- `functions/api/` — Cloudflare API endpoints
- `functions/` — Cloudflare Pages Functions such as the sitemap
- `public/js/` — browser-side logic for auth, admin, checkout, analytics, and search
- `admin/` — admin dashboard page
- `checkout/` — checkout and confirmation pages
- `shop/` — storefront pages
- `search/` — public site search page
- `data/` — catalog and site JSON content
- `assets/` and `css/` — static design assets and styling

## Key current API groups

### Auth
Session-based user login and account controls.

### Storefront and checkout
Order creation, payment preparation, PayPal return, and provider webhooks.

### Admin
Products, users, orders, SEO, inventory, notifications, analytics, media upload, media library browsing, webhook review, and refund and dispute logging.

### Tracking
Visitor, cart, and search behavior logging.

## Database files to keep aligned

- `database_schema.sql`
- `database_store_schema.sql`
- `database_access_tiers.sql`
- `database_profiles_extension.sql`
- `database_payments_extension.sql`
- `database_growth_analytics_seo_extension.sql`
- `database_full_schema.sql`
- `database_upgrade_current_pass.sql`

## Cloudflare bindings and secrets expected now

### D1
- `DB`

### R2
- `PRODUCT_MEDIA_BUCKET`

### Variables and secrets
- `PUBLIC_SITE_URL`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_SECRET`
- `PAYPAL_ENV`
- `PAYPAL_WEBHOOK_ID`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PRODUCT_MEDIA_PUBLIC_BASE_URL`
- optional `PRODUCT_MEDIA_BUCKET_NAME`

## Public SEO rule of thumb

When a public page is touched, review:

- exactly one H1
- title and meta description
- canonical URL
- Open Graph and Twitter tags
- robots intent
- sitemap impact
- whether the page should contribute to public search awareness


## Shared layout expectations

- `/js/main.js` owns shared nav and footer injection
- `/public/js/site-auth-ui.js` owns the floating account widget
- `/account-help/` provides logged-out recovery request entry points


## Shared layout and auth notes

- `/js/main.js` owns the shared nav and footer injection and now also ensures the standard auth/site scripts are present on normal pages.
- `/public/js/auth.js` is the shared client auth layer and now persists the session token with both localStorage and a sitewide cookie fallback.
- `/public/js/site-auth-ui.js` remains the shared account widget/nav visibility layer used by both the public site and protected areas.
- `/functions/api/admin/live-activity.js` provides the admin dashboard live feed using recent analytics, cart, order, and webhook data.


## New admin/data routes

- `/api/admin/catalog-sync` seeds tools, supplies, and featured creations from existing JSON into `catalog_items`.
- `/api/catalog-items` serves public unified catalog reads for tools, supplies, and featured creations.
- `/public/products-import-template.csv` is the mass-upload starter template for products.


## Current pass additions
- Session/auth now uses a stronger same-site continuity path: auth endpoints set a first-party `dd_auth_token` cookie in addition to returning the bearer token. Public pages can resolve the signed-in member/admin state more reliably.
- Added `movie_catalog` for staged migration of the legacy UPC-only movie JSON into D1. The public movies page now reads from `/api/movies`, which prefers D1 and falls back to `/data/
  - `/data/movies/movie_catalog_enriched.v2.json` is now the supported repo file for richer movie metadata, front/back cover URLs, summary, cast, director, and yearcatalog.json`.
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


## Current pass operational note

- The movie cover source of truth for public image URLs is now the uploaded `data/movies/movie_catalog_enriched.v2.json`, backed by public R2 URLs under the `movies/` prefix.
- Admin operators now have two inventory lenses: `site_item_inventory` for tools/supplies and the product stock report for finished-product readiness.


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


- `/functions/api/admin/audit-log.js` — read endpoint for recent privileged admin actions.
- `/functions/api/_lib/adminAudit.js` — shared helper for admin cookie/bearer auth resolution and audit logging.


New current-pass backend additions:
- `functions/api/admin/webhook-dispatch.js` — batch requeues due/failed webhook events with audit logging.
- `functions/api/admin/product-readiness.js` — returns storefront-readiness checks for a product.
- `notification_outbox` — durable local queue for receipt and operational message intents.



## Current pass endpoint additions

- `functions/api/stripe-return.js` — finalizes a Stripe Checkout session on customer return.
- `functions/api/creations.js` — centralized public finished-creations read path.
- `functions/api/admin/notification-outbox.js` — review and process queued notification delivery.
- `functions/api/_lib/notificationOutbox.js` — shared queue/dispatch helper for receipts and recovery notices.
- `functions/api/_lib/adminStepUp.js` — shared password-confirmation step-up helper for destructive admin actions.
- `functions/api/_lib/passwordHash.js` — shared password-hash verification helper.

## Current pass additions
- `/api/admin/product-review-actions` for governed review/publish flow
- `/api/admin/product-cost-rollups` for build-cost and rough margin visibility
- `/api/admin/purchase-orders` for supplier reorder draft workflow



## Current pass update
- Added public read endpoints: `/functions/api/tools.js` and `/functions/api/supplies.js`.
- Updated purchase-order handling so status changes can move inventory into incoming and on-hand states.

- `functions/api/admin/site-item-inventory.js` now supports product-level reservation/release actions across linked resources.
- `functions/api/admin/product-mobile-bootstrap.js` is part of the phone-first product entry path and now relies on shared admin auth helpers.


## Current pass update
- `functions/api/admin/payment-actions.js` now queues and attempts immediate customer receipt delivery for refund/dispute admin actions.
- `functions/api/stripe-webhook.js` now also queues provider-confirmed Stripe refund/dispute customer notices when a local order email is present.
- `functions/api/products.js` now returns product filter summaries for category/colour/type.
- `tools/index.html` and `supplies/index.html` now consume `/api/tools` and `/api/supplies` directly instead of the generic catalog-items endpoint.

## Current pass update
- `functions/api/admin/import-products-preview.js` now performs broader draft-import validation, including duplicate slug/SKU/product-number checks and validation for newer finished-product/SEO/image fields.
- `functions/api/admin/import-products.js` now seeds richer finished-product records, tags, SEO rows, and extra gallery rows instead of only minimal core product fields.
- `functions/api/admin/media-upload.js` now supports one-step attachment from R2 upload into `product_images` and `product_image_annotations`, including optional featured-image updates.



## Current pass update
- `functions/api/admin/product-stock-report.js` and `public/js/admin-product-stock-report.js` now form a fuller reservation-governance path from report view to inventory reservation action.
- `functions/api/product-detail.js` now shapes grouped storefront image data using product images, annotations, and media variant-role hints.
- `functions/api/admin/visitor-analytics.js` now adds merchandising diagnostics for top product-detail paths and top ordered products.
- `supplies/index.html` and `tools/health/index.html` now rely more directly on centralized public API reads.


## Current pass note
- `public/js/admin-products.js` now covers another reservation-governance path by calling `/api/admin/site-item-inventory` for product-level reserve/release actions.
- `toolshed/index.html` now relies on `/api/tools` as the primary discovery authority instead of direct JSON fallback chaining.
- `functions/api/product-detail.js` now returns `build_summary` and lightweight image `variant_urls` hints alongside grouped image/annotation data.


## Current pass additions
- `data/finished_products_import_template.csv` is the detailed CSV template for bulk finished-product imports.
- `functions/api/admin/movies.js` powers admin-side movie detail editing against `movie_catalog`.
- `public/js/admin-movie-catalog.js` mounts the movie catalog editor inside `/admin/`.


## Current repo guide update
- `data/movies/movie_catalog_enriched.v2.json` remains the current movie source-of-truth file for public reads.
- `functions/api/movies.js` should stay JSON-first with optional D1 overlay merge logic, not D1-first, until movie migration is explicitly signed off.
- `functions/api/admin/movies.js` is the manual movie overlay editor route and must remain backward-compatible with older `movie_catalog` table shapes.
- `public/js/admin-movie-catalog.js` should expose the richer movie-card editing view, including cover previews and existing JSON metadata, not just a minimal subset of fields.
- `data/finished_products_import_template.csv` is now part of the expected bulk finished-product workflow.

## Current pass update
- Catalog sync now uses `movie_catalog_enriched.v2.json` for movie imports so repo-side sync matches the JSON-first movie source already used elsewhere.
- Schema references and upgrade SQL were aligned with the current movie overlay/editor fields and the governed review/reorder tables already present in the codebase.
- Exposed HTML pages were checked again and continue to keep a single H1 per page.

- New finished-product numbering now starts at DD1000 for newly created products. Internally the database still stores the numeric portion as `1000`, `1001`, and so on, while the UI can present the public/admin-friendly `DD1000` style code.
- Added a first-pass installable phone experience with `manifest.webmanifest`, `sw.js`, and generated app icons so visitors can save Devil n Dove to a home screen more cleanly than a plain browser shortcut.
- Added a new `/socials/` page backed by `/data/site/social-feed.json` and seeded it with your current profile links plus a first saved list of five public YouTube videos.
- The admin tools-and-supplies inventory editor now includes a barcode-photo helper that can fill the external key from a phone photo when the browser supports `BarcodeDetector`. It prepares an Amazon search link, but full product-detail import from Amazon is still blocked until Amazon Product Advertising API credentials or another approved catalog source is added.

## Current pass addendum
- Normalized public route links away from explicit `/index.html` navigation and added a `_redirects` file so direct `.../index.html` requests resolve more cleanly alongside directory routes.
- Expanded the installable phone shell with a stronger manifest, install prompt handling, Apple home-screen metadata, and an offline fallback page.
- Added another CSS hardening pass for mobile/admin layout overflow and dark-mode calendar/date picker visibility.
- This pass did not require a new D1 schema table change; schema reference files were refreshed to reflect that the changes were routing/PWA/CSS/app-shell focused rather than DB-structure focused.


## Current pass additions
- `/admin/mobile-inventory/` is now the phone-first tool/supply intake screen.
- `/_headers` is now active repo configuration for browser security and cache policy.
- `RM_` file prefixes mark reviewed duplicate/unlinked files that look safe for later removal.
