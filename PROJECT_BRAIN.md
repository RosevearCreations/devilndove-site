# Project Brain

## Core mental model

This repo is now a combined:

- public brand site
- ecommerce storefront
- member account system
- admin operations panel
- analytics and growth data layer
- payment and webhook processing layer
- product media upload and asset layer
- public SEO and search-awareness layer

## Important current architecture

### Auth
Uses `users` and `sessions` with bearer token auth.

### Commerce
Uses `products`, `product_images`, `product_tags`, `orders`, `order_items`, `order_status_history`, and `payments`.

### Profiles and tiers
Uses `user_profiles`, `access_tiers`, and `user_access_tiers`.

### Growth, SEO, monitoring, and search
Uses:

- `site_visitors`
- `site_visitor_sessions`
- `site_page_views`
- `site_search_events`
- `cart_activity`
- `app_settings`
- `notification_jobs`
- `notification_dispatch_logs`
- `product_seo`
- `product_image_annotations`
- `site_item_inventory`
- `site_inventory_movements`

### Payments, webhook, and media additions
Uses:

- `webhook_events`
- `payment_refunds`
- `payment_disputes`
- `media_assets`

## Key newer additions

- admin webhook review and requeue endpoint and dashboard tooling
- admin refund and dispute endpoint and order-detail UI foundation
- admin media asset browser and delete tooling
- public search page for products, tools, supplies, creations, and key pages
- sitewide public SEO refresh with one-H1-per-page enforcement target
- inventory model now includes reserved, incoming, supplier, and cost fields
- inventory movement history foundation for stock changes
- import preview now validates duplicate slugs and media URL format

## Where we are now

The platform is still in an integration and hardening phase.

Most important next layers after this pass are:

- webhook worker retry and replay execution
- provider-confirmed refund and dispute status sync
- richer media library management around uploaded R2 assets
- direct media replace, thumbnail, and featured-image suggestion flow
- deeper inventory operations and movement history UX
- funnel dashboards and analytics polish
- ongoing crawl, metadata, and public search-awareness improvements each pass


## Latest UX additions

- shared floating account widget across the site
- shared footer with search/discovery links on every page
- account-help page and request logging for forgot-password and forgot-email flows


## Latest pass focus

- Fixed shared session visibility between admin and the outward-facing site by adding cookie-backed client token fallback.
- Hardened shared nav/footer behavior so the footer stays visible on standard pages.
- Refreshed admin dashboard presentation and added a live activity feed driven by recent analytics/order/webhook data.


## Latest architectural note

- High-duplication workshop collections are beginning to move into D1 through `catalog_items`. This is the first stage toward unified search, analytics, inventory automation, and fewer JSON-only failure points.
- Product import now supports CSV-first mass upload with optional images at import time.


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


## Current pass update

- Movies now depend on the real R2-backed enrichment file rather than the starter placeholder record. The page/API are aligned around `front_image_url` and `back_image_url`, with trailer-ready search support.
- Admin now has a dedicated product stock and build-readiness report, bridging finished-product inventory with linked tool/supply inventory pressure.
- Site inventory operations continue moving away from scattered JSON maintenance by syncing from `catalog_items` into `site_item_inventory`, then surfacing reorder/do-not-reuse status directly in admin views.


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


### Current pass additions
- `admin_action_audit` for privileged operator visibility.
- `auth_recovery_requests` now capture `ip_address` and `user_agent` for safer triage.


Current pass emphasis: risk reduction through payment safety, inventory authority, media lifecycle controls, funnel analytics, and draft readiness rather than only visual polish.



## Current pass update
- Added `/api/stripe-return` for customer-return reconciliation on Stripe Checkout.
- Added `notification_outbox` dispatch processing so queued receipts and recovery notices can actually move toward delivery.
- Added shared admin step-up confirmation for destructive admin actions.
- Added `/api/creations` as the centralized public creations read path during the JSON-to-D1 migration.
- Stripe webhook flow now confirms local dispute records from provider events instead of leaving dispute sync fully manual.

## Current pass update
- Draft-to-publish governance is now more explicit: review actions are handled through `/api/admin/product-review-actions` and logged in `product_review_actions`.
- Supplier reorder work now has first-class draft documents through `supplier_purchase_orders` and `supplier_purchase_order_items`.
- Product operations now include build-cost visibility from linked tools and supplies, which helps pricing, readiness, and margin checks.
- Analytics now expose referrers, entry paths, and zero-result search terms for clearer discovery diagnostics.



## Current pass update
- Public tools and supplies now have centralized public API read paths that prefer D1-backed catalog records before JSON fallback.
- Gallery/creations reads are more centralized as migration continues away from scattered direct JSON fetches.
- Purchase-order lifecycle now feeds inventory state more directly by applying ordered quantities to incoming stock and received quantities to on-hand stock.

- Inventory authority now includes product-level reservation/release actions that operate across linked tool/supply records, not only one inventory row at a time.
- Public catalog APIs now expose category/type filter summaries to support richer discovery UX without returning to scattered JSON parsing.


## Current pass update
- Payment notification flow is no longer only a passive queue: admin refund/dispute actions and Stripe provider-confirmed webhook events now attempt immediate outbox delivery when mail credentials are configured.
- Storefront product reads now expose discovery summaries for category, colour, and product type.
- Public tools and supplies pages now rely on their dedicated centralized APIs instead of the generic catalog endpoint, which continues the migration away from scattered outward-facing data paths.

## Current pass update
- The import pipeline is less shell-only now: admin preview/import can validate and create richer finished-product records, including SEO rows, tags, and extra image rows during product seeding.
- The direct R2 media upload path is no longer only an asset drop. It can now attach uploaded images directly to a product gallery and featured-image flow, which reduces one more manual step between upload and storefront readiness.



## Current pass update
- Product stock readiness is no longer only a read-only report: admin can now reserve or release linked tool/supply inventory directly from the stock-report UI.
- Product-detail media responses now include grouped storefront image structures that blend product images, annotations, and media variant-role hints more cleanly.
- Analytics now include top product page paths and top ordered products so the dashboard can better compare discovery versus sales pressure.
- The public supplies page and the tools health screen both moved farther toward centralized API-first reads during the JSON-to-D1 transition.


## Current pass update
- Reservation governance now appears in another operational admin surface: the main products list can reserve or release linked tool/supply inventory per product.
- Toolshed discovery now leans on the centralized tools API path rather than multiple direct JSON fallbacks.
- Storefront product detail now carries grouped image, annotation, variant-role, and build-summary context in one payload.


## Current pass update
- The phone-first finished-product flow no longer assumes every draft is storefront-ready. Partial intake is now allowed through `capture_reference` plus draft-mode saving.
- Admin now includes a movie catalog editing workflow so the movie system can accept staff-curated and future visitor-contributed metadata directly into D1 without depending only on source JSON edits.


## Current pass update
- Movie operations are now split into two distinct layers: JSON-first read authority from `movie_catalog_enriched.v2.json`, and D1 overlay writes for manual/admin movie corrections and visitor-contributed metadata.
- This means the public movie shelf and admin movie list should always be able to recover from the JSON base truth even while the manual movie editor is still being hardened.
- The admin movie editor is expected to function more like a “movie card editor” than a minimal metadata form: cover previews, existing summary/details, source/value fields, and collection notes must all be visible for manual enrichment.
- The mobile finished-product workflow remains intentionally draft-heavy: partial product entries should be captured quickly and safely before later review/publish completion.

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


## Current pass note
- The artist/admin phone workflow now has two intended protected entry points: `/admin/mobile-product/` for finished-product capture and `/admin/mobile-inventory/` for tools/supplies intake.
- Browser security hardening now includes a repo `_headers` file plus a stricter service-worker bypass for sensitive routes.
- Duplicate dead files are now being marked with `RM_` before removal instead of being silently deleted.
