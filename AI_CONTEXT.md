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


- Current migration strategy: Tools, Supplies, and Featured Creations now have their seeded D1 catalog authority in place, while public pages keep graceful fallback behavior. Movies are seeded into D1 as well, but public movie reads remain hybrid until D1 parity is explicitly signed off.
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


## Current pass addendum
- Marked the previous admin preview, products fallback, movie save, and accordion issues as completed/fixed in the documentation.
- Departmentalized Admin into standalone interfaces: Members, Catalog, Orders, Accounting, Analytics, Operations, and Movies, reducing the size and risk of the main dashboard file.
- Added real starter routes/UI for tier policy, general ledger accounts, expenses, write-offs, product unit costs, and monthly accounting CSV export.
- Added accounting templates (CSV + XLSX) so GL and month-end bookkeeping can be seeded faster.
- Continued mobile direction by making the lighter departmental pages easier to use on smaller screens than the former all-in-one Admin page.
- Continued JSON-to-DB convergence by moving tier policy and accounting records into D1-backed tables instead of temporary page-only assumptions.


## Current pass addendum
- Fixed the Members department so Access Tiers render as a visible standalone interface instead of only a hidden modal dependency.
- Rewired Tier Policy admin/member JSON contracts so the admin editor and member account views use the same DB-backed field names.
- Strengthened the Accounting department with visible starter forms plus month-end, quarter-end, and year-end CSV export presets.
- Added a new phone-first Admin Dashboard at `/admin/mobile/` with Today, Quick Add, receiving, and export-oriented shortcuts.
- Continued moving the admin shell toward dashboard-style department buttons instead of long scroll-heavy interfaces.


## Current pass note
- The repo currently favors a lighter Admin launcher plus department pages.
- Mobile-first quick actions are being moved upward so the phone dashboard can handle more real daily use without loading long desktop-oriented screens.


## Current pass addendum
- Replaced the long phone Admin link list with a grouped tree-style mobile menu so the phone workflow uses collapsible sections instead of one uninterrupted list.
- Continued mobile-first workflow tuning by surfacing Today, quick expense, quick write-off, product cost, and export actions closer to the top of the phone dashboard.
- Continued docs/current-build synchronization for the present mobile-navigation and admin-usability pass.


## Current pass addendum
- Customer-facing home/shop flow was made friendlier and clearer on phone and desktop with stronger exploration sections and clearer action cards.
- Accounting moved forward with monthly overhead allocations and a rough net-after-overhead view in the accounting report so operating costs can start flowing toward fuller P&L reporting.
- Mobile admin moved forward again with a direct overhead-allocation shortcut from the phone dashboard.
- Schema and template files were updated for the new overhead allocation layer.


## Current pass note
- Treat `/admin/mobile-product/` as the primary phone-first draft intake and draft-continuation workflow.
- Treat `/api/admin/accounting-item-costing` as the current rough full-unit-cost reporting source.

## Current pass addendum
- Fixed a live accounting schema/code drift: monthly rough P&L now reads the real `amount` / `tax_amount` fields from `accounting_expenses` and the real `amount` field from `accounting_writeoffs` instead of non-existent cents columns.
- Fixed the estimated item-costing source so it now matches the real `product_costs` table shape (`product_number` + `cost_per_unit`) before blending in linked-resource cost and allocated overhead.
- Mobile product draft continuation is stronger because saved SEO fields now reload with the draft and updated drafts stay open in the same phone screen after save.
- The phone dashboard now includes a live month snapshot for revenue, overhead, costing warnings, and draft-product visibility without forcing a jump to the full accounting page.

## 2026-04-10 deploy hotfix

- Fixed a Cloudflare Pages build blocker in the accounting CSV export helpers by replacing the regex-based CSV quoting check with a simpler string-contains check.
- This hotfix does not change the database shape. Schema files remain current for this pass because no SQL migration was required.

## Current pass context note
- Public tools and gallery/creations pages moved further toward centralized API reads (`/api/tools`, `/api/creations`) instead of page-level direct JSON fetches.
- Phone admin now includes open accounting snapshot cards for paid, outstanding, and tax-liability visibility.
- `accounting-summary` now shares the common accounting schema helper to reduce drift.

## Current pass completion update
- Added `/api/social-feed` as the public authority path for social profile/video feed reads.
- Added browser snapshot fallback on shop, movies, socials, and phone dashboard so public/admin continuity is safer during live endpoint drift.
- Added `/api/admin/runtime-incidents` for reviewing records stored in the existing `runtime_incidents` table.

## Current pass note

When continuing from this build, treat the admin orders area as partially hardened: list/detail/payment reads now prefer safe partial responses and browser snapshots, but write-path recovery still remains open work.

## Latest pass context

- Failed admin order/payment writes are no longer only browser-local. The repo now includes a D1-backed `admin_pending_actions` queue plus API endpoints for listing and updating queued actions.
- `public/js/admin-order-detail.js` should be treated as the current frontend authority for queue save/retry/dismiss behavior.

## Current pass update
- `/api/admin/accounting-item-costing` now uses the shared `_costing.js` engine so item costing reflects basis-aware overhead pools, sold-unit recognition, and rough recognized COGS instead of the older flat revenue-share-only view.
- The public social hub now returns derived YouTube thumbnail URLs and fallback candidates through `/api/social-feed`, and the browser renders thumbnail cards instead of relying on fragile iframe-only embeds.
- Shared `admin_pending_actions` queue coverage now includes product review actions from the catalog/products screen, with browser-local storage kept only as the last safety net.

## Current pass completion update
- Added `accounting_overhead_product_allocations` so monthly overhead can now be assigned directly to specific products by ledger code instead of relying only on pool-wide share logic.
- Added a rough journal foundation with `accounting_journal_entries` and `accounting_journal_lines`, plus `/api/admin/accounting-journal` to sync and review month-level double-entry style bookkeeping.
- Expanded shared replay coverage from order/payment and product review into product edit/update failures through the same `admin_pending_actions` queue, with browser-local storage kept only as the last safety net.
- Strengthened the public movies API merge logic so D1 overlay rows can match JSON rows by UPC, slug, or title/year instead of only one identifier path.
- Updated the phone dashboard and accounting overview to show journal health, explicit overhead overrides, and queued product-edit actions more honestly.

## Current pass note
- Catalog migration sync now accepts both `collections` and legacy `item_kinds` payloads for maintenance/reseed use after the completed full migration.
- Tool, supply, and featured creation syncs continue to upsert into `catalog_items`.
- Movie sync now upserts into `movie_catalog` so hybrid JSON + D1 movie authority can move forward without crashing `catalog_items`.
- The admin catalog sync tooling now remains maintenance-only. The main Catalog department page no longer shows the migration panel after the successful full sync run, but the backend route is still available for maintenance or reseed recovery.

## Current Pass Note — 2026-04-12

- Movie catalog sync was changed from one-row-at-a-time D1 writes to chunked `db.batch(...)` upserts so large movie imports stay under the Worker invocation API-request ceiling.
- `/api/admin/products` was hardened to detect optional table availability and fall back to a simpler products query instead of failing the full admin page with a 500 during staged migration.
- `_headers` now explicitly allows `https://static.cloudflareinsights.com` in `script-src` so the Cloudflare Insights beacon is no longer blocked by the current CSP.
- The initial catalog migration has now been run successfully for Tools, Supplies, Movies, and Featured Creations. The everyday admin catalog sync panel was retired from the main Catalog page, while `/api/admin/catalog-sync` remains available for maintenance or reseed work. Movies still remain hybrid on the public read path while D1 overlay parity continues.


- Current pass: the main Catalog admin page no longer shows the day-to-day migration panel after the full D1 catalog sync completed successfully. The sync route remains available only for maintenance or reseed recovery, and the docs now treat catalog migration as completed rather than an active daily admin step.
