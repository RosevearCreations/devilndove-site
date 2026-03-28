# Sanity / Health Check

## What the app now does well

- auth, sessions, member accounts, and admin access are in place
- storefront product browsing and detail rendering work with image and annotation data
- checkout creates orders and order items correctly
- PayPal can hand off, return, and reconcile through webhook flow
- Stripe can create hosted checkout sessions and reconcile through webhook flow
- webhook events now have a stored audit trail plus admin review and requeue tooling
- admin can manage products, SEO, annotations, inventory, and product image ordering
- admin can upload product images directly to R2 and browse or delete uploaded assets
- admin can log local refund and dispute actions against payments and orders
- inventory records now track reserved, incoming, supplier, and cost fields
- inventory movement history is now logged for creates, stock adjustments, and deletes
- public pages now have a stronger metadata baseline, canonicals, social tags, and explicit robots handling
- public search page
- movies now have a richer enrichment path instead of remaining permanently UPC-only
- tools and supplies inventory now supports reorder-list and do-not-reuse rules
- products can now store linked tools/supplies used during creation and search-event logging are in place
- analytics and notification foundations are present for future dashboards and workflows

## What remains the strongest next work

- webhook worker execution and scheduled retry logic
- provider-confirmed refund and dispute sync back into local state
- richer R2 media replace, variant, and thumbnail workflow
- deeper inventory movement history UX and reorder automation
- import validation polish and analytics dashboards
- keep improving search-engine visibility and crawl signals every pass

## Must-haves now in place from this pass

- public SEO and H1 policy documented for future updates
- public page head refresh with canonical, robots, Open Graph, and Twitter tags
- search page
- movies now have a richer enrichment path instead of remaining permanently UPC-only
- tools and supplies inventory now supports reorder-list and do-not-reuse rules
- products can now store linked tools/supplies used during creation added to the site and sitemap
- inventory movement history foundation in schema and admin flow
- updated full schema and upgrade SQL files

## Known caution areas

- existing databases need the upgrade SQL before the newest inventory movement code paths work cleanly
- provider-side refunds and disputes are not automatically executed yet
- R2 direct upload depends on the bucket binding and public base URL being configured
- webhook replay tooling still queues and relabels events rather than running a background worker
- search page
- movies now have a richer enrichment path instead of remaining permanently UPC-only
- tools and supplies inventory now supports reorder-list and do-not-reuse rules
- products can now store linked tools/supplies used during creation currently blends API products with static JSON content; it is useful now but still a first-pass discovery layer


## Latest pass checks

- shared footer is now injected sitewide
- account widget is now available sitewide when auth scripts are loaded
- logged-out state now exposes login, forgot-password, and forgot-email paths
- D1 duplicate-column warnings in upgrade SQL are now documented as harmless when the column already exists


## Latest pass notes

- Admin login visibility issue on the regular site was addressed by using a cookie fallback for the shared auth token in addition to localStorage.
- Shared footer injection was hardened and styling normalized across forms, tables, and dashboard cards.
- Admin dashboard now includes a recent live activity feed to improve at-a-glance monitoring.


## Latest pass notes

- Product import now supports CSV-first mass upload with a downloadable template and explicit required/optional field guidance.
- Tools, supplies, and featured creations now have a staged D1 migration path through `catalog_items`; public search and collection pages can prefer live catalog data after sync.
- Featured images remain optional during import and can be enforced later during store-readiness review.


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


## Current pass health check

- Movie cover URLs now point at the uploaded public R2 objects instead of the old placeholder local asset paths.
- The public movie page is aligned with `/api/movies` and is expected to show covers whenever `front_image_url` or `back_image_url` exists in the enrichment file or D1 record.
- Finished-product inventory visibility is stronger in admin through the new product stock report and the existing site inventory movement/reorder tooling.


## Current pass sanity update

- Movie covers now resolve from the uploaded R2-backed JSON file.
- The remaining movie-data gap is metadata enrichment, not image delivery.
- Admin dashboard widgets that previously failed with `Unexpected token '<'` were hardened so they return safe JSON even if a table has not been populated yet.
- Catalog sync now fails collection-by-collection instead of taking down the whole tool when one JSON source is incomplete.


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
