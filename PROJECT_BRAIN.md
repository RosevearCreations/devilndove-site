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


## Current pass direction
- Keep Admin split into department pages instead of rebuilding a giant all-in-one dashboard.
- Keep moving the phone dashboard toward daily real-use actions: Today, inventory, expense entry, write-offs, product intake, and exports.
- Keep accounting focused on growing from capture/export structure into fuller P&L and overhead allocation later.


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
- Phone capture now supports reopening draft products in the same workflow.
- Accounting now has an estimated fully loaded item-costing view based on direct costs, linked resources, and overhead allocation.

## Current pass addendum
- The current accounting truth is still rough, but the repo now correctly treats `accounting_expenses` / `accounting_writeoffs` as real-dollar tables and `product_costs` as a `product_number` + `cost_per_unit` table.
- Treat the phone dashboard as a fast operational shell for daily accounting visibility, not just a launcher.
- Treat the mobile product capture screen as the preferred place to reopen and continue unfinished finished-product drafts.

## 2026-04-10 deploy hotfix

- Fixed a Cloudflare Pages build blocker in the accounting CSV export helpers by replacing the regex-based CSV quoting check with a simpler string-contains check.
- This hotfix does not change the database shape. Schema files remain current for this pass because no SQL migration was required.

## Current pass note
- Public catalog cleanup continued by moving gallery/creations and tools farther onto shared API authority.
- Mobile admin/accounting usability moved forward again with a stronger phone snapshot for open records and outstanding values.

## Current pass completion update
- Social hub is now API-backed via `/api/social-feed`.
- Public shop and movies plus admin phone snapshot now keep last-good client fallback state.
- Runtime incidents now have a read endpoint for admin review and count-level visibility in dashboard summary.

## Current pass note

Operational priority moved to admin resiliency this pass: order list, order detail, and payment detail screens now degrade more gracefully, and the phone dashboard now surfaces order/payment incident pressure for quicker triage.

## Latest pass update

- Admin resilience now has two layers for failed writes: a shared D1-backed queue first and browser-local fallback second.
- The main day-to-day surface for this queue is the order-detail modal plus the phone dashboard health block.

## Current pass update
- Social hub YouTube cards now prefer derived thumbnail URLs/fallbacks through `/api/social-feed` instead of fragile iframe-only presentation.
- Shared admin replay queue coverage now reaches the product review workflow in addition to order/payment order-detail actions.
- Accounting item costing now relies on the shared costing helper for basis-aware overhead pool allocation.

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
