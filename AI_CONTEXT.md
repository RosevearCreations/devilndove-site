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
- Movie catalog wiring now blends D1 `movie_catalog`, `/data/movies/movie_catalog_enriched.json`, and the R2-hosted cover images more safely.
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
