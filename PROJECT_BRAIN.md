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
- Movie catalog wiring now blends D1 `movie_catalog`, `/data/movies/movie_catalog_enriched.json`, and the R2-hosted cover images more safely.
- Movie search now supports title, UPC, year, actor, director, genre, studio, format, and optional trailer-link filtering.
- `trailer_url` is now part of the movie enrichment path so trailer support can be stored directly when available.
- Storefront product detail now includes linked tools and supplies from `product_resource_links` so each finished product can tell a clearer “made with these materials and tools” story.
- Admin product-resource linking now supports usage notes for story-building and social-post context.
- Admin inventory can now sync tool and supply records from `catalog_items` into `site_item_inventory`, reducing duplicate maintenance between JSON, catalog, and inventory records.
- Continue the one-H1-per-exposed-page rule and continue improving page titles, descriptions, canonical tags, crawl paths, structured data relevance, and visible on-page content alignment on every outward-facing pass.
