# Development Roadmap

## Current completed foundations

- auth and session model
- member orders/downloads
- admin users/security tools
- checkout and order creation
- PayPal handoff
- PayPal return capture
- PayPal webhook reconciliation foundation
- analytics and visitor monitoring foundation
- product SEO tools
- product media workflow foundation
- site inventory/reorder foundation
- movie cover pipeline with R2-backed imagery
- movie shelf pagination foundation
- mobile finished-product capture foundation

## Strongest next steps after this pass

1. Stripe payment completion pass
2. webhook retry / replay / dispatch hardening
3. direct media upload workflow to R2 lifecycle completion
4. deeper inventory operations for products, tools, and supplies
5. product import seeding refinement and validation UX
6. richer analytics dashboards and funnel reporting

## Media-specific roadmap

- direct upload endpoint hardening and broader reuse
- image delete/reorder UI polish
- thumbnail/variant handling
- tighter annotation-to-storefront usage
- stronger duplicate handling and media lifecycle audit coverage

## Payment-specific roadmap

- webhook replay safety
- idempotency improvements
- provider retry logging
- refund/dispute workflows
- provider-confirmed reconciliation flows
- invoice / refund / return receipt delivery

## Current pass completion update

- Repaired the movie shelf layout so cards no longer collapse into unusable one-character columns under grid pressure.
- Updated the movie API and page to use real paging metadata instead of treating the first batch as the whole catalog.
- Improved movie shelf usability with proper page counts, next/previous controls, and more honest result counts.
- Hardened key auth/payment/media JSON responses with safer baseline response headers.
- Improved admin media upload reliability by allowing same-site auth-cookie fallback in addition to bearer auth.
- Rewrote the Known Gaps and Risks document so it reflects the current state more honestly and can guide the next security/customer-experience passes.

## Still intentionally not marked complete

- Stripe completion
- worker-driven webhook retry/replay
- provider-confirmed refund/dispute sync
- full media lifecycle completion
- full authoritative inventory movement model
- richer funnel analytics
- trusted movie metadata/value enrichment


## Current pass update

- Rebuilt the public movie shelf layout with a dedicated card and pager structure so movie entries no longer collapse into unusable one-character columns.
- The movies page now uses the API paging metadata to show the real total catalog size, page number, page range, and next/previous navigation more honestly.
- Added a more defensive movie-specific CSS layer so future generic card/grid changes are less likely to break the movie shelf again.
- KNOWN_GAPS_AND_RISKS.md was rewritten to document the remaining payment, inventory, media, analytics, and metadata risks more clearly.


## Current pass completion update

- Added an `admin_action_audit` trail so privileged product, inventory, media, and webhook actions now have durable server-side records.
- Hardened account recovery requests with basic rate limiting and stored IP/user-agent context for safer review.
- Improved webhook processing bookkeeping by incrementing attempt counts and scheduling next retry timestamps for failed provider events.
- Added a read endpoint foundation for audit visibility at `/api/admin/audit-log`.

## Current pass completion update

- Addressed the payment/refund safety item with provider-aware refund sync attempts and queued receipt records.
- Addressed the webhook retry/replay item with a new admin webhook dispatch endpoint for due/failed event requeueing.
- Addressed the inventory-authority item with a rewritten inventory API that supports reserve/release/receive/reorder-request actions plus stronger movement logging.
- Addressed the media-lifecycle item with restore/replace metadata support and duplicate visibility in admin media assets.
- Addressed the analytics item with stronger funnel metrics in dashboard summary and visitor analytics.
- Addressed the draft-to-publish governance item with product readiness checks and storefront-readiness flags.
- The roadmap is not fully finished yet because Stripe checkout completion, real receipt delivery, deeper attribution, and trusted movie enrichment still remain open.



## Current pass completion update

- Restored and completed the Stripe return reconciliation path with `/api/stripe-return` plus confirmation-page finalize logic.
- Added provider-confirmed Stripe dispute sync through `charge.dispute.*` webhook handling.
- Added a real `notification_outbox` dispatch path with Resend-ready email delivery and admin processing controls.
- Added shared admin step-up confirmation for destructive actions.
- Added `/api/creations` so finished creations can move toward one public authority path instead of direct page-level JSON reads.

## Still intentionally not marked complete

- trusted movie metadata/value enrichment remains blocked on external metadata-source access
- full provider-confirmed dispute sync for every payment provider remains dependent on each provider's API coverage and credentials
- full attribution and decision-grade merchandising analytics still need another pass

## Current pass completion update
- Added governed product approval/publish actions with audited review history.
- Added product build-cost rollups so linked tool/supply costs can be checked before publishing.
- Added supplier purchase-order draft tables and API coverage to move reorder work beyond ad-hoc notes.
- Expanded analytics with top-referrer, entry-path, and zero-result search diagnostics.

## Still intentionally not marked complete
- fully automated worker-driven webhook retries beyond admin dispatch
- full multi-role permission granularity beyond current admin/member model
- fully trusted external movie enrichment and valuation data



## Current pass completion update
- Reduced another public JSON duplication point by adding centralized tools/supplies API reads for outward-facing pages and search.
- Moved purchase-order receiving closer to authority by applying ordered quantities to incoming stock and received quantities to on-hand stock.
- Remaining inventory work should now focus more on reservation governance and UI depth instead of basic supplier receiving math.

## Current pass completion update

- Added product-level reservation actions for linked tool/supply inventory.
- Product cost/reporting endpoints now expose buildable-unit and resource-shortage signals.
- Public catalog APIs now expose filter-group summaries for stronger category/discovery UX.
- Mobile quick-product bootstrap reliability improved by switching to shared admin auth and corrected inventory-field usage.


## Current pass completion update
- Receipt delivery is now more operational because admin refund/dispute actions and Stripe provider-confirmed webhook events both try to dispatch queued notifications immediately when delivery credentials exist.
- Storefront discovery moved forward with live `/api/products` filter summaries plus dedicated tool/supply public API usage on the outward-facing pages.
- Remaining strongest next steps are still deeper role segmentation, broader reservation UI coverage, fuller provider coverage beyond Stripe, and trusted movie enrichment from an accepted external source.

## Current pass completion update
- Product import preview now checks duplicate slugs, SKUs, and product numbers before insert, while also validating newer finished-product fields like category, colour, review status, SEO title/meta length, tags, and additional image URLs.
- Product bulk import now seeds richer finished-product records with product number, category, colour, shipping code, review status, SEO rows, tags, and optional additional product images instead of only creating minimal draft shells.
- Direct media upload can now attach uploaded files straight into product images/annotations, set featured images, and record variant-role notes in one step, which moves the R2 upload flow closer to a full operator-ready lifecycle.

## Still intentionally not marked complete
- thumbnail/variant file generation still needs an image-processing pass rather than only metadata/role handling
- worker-driven webhook replay remains a later hardening layer beyond current admin-triggered dispatch
- trusted external movie enrichment and valuation still depend on external data access



## Current pass completion update
- Extended product-level reservation governance into the admin stock-report UI so linked tools/supplies can be reserved or released from a real frontend path.
- Improved storefront/media readiness by exposing grouped product image data, variant-role awareness, and derived variant URL suggestions.
- Expanded analytics with top product-detail paths and top ordered products so merchandising diagnostics move closer to decision-grade reporting.
- Reduced another public JSON dependency by moving the public supplies page and the internal tools health screen onto centralized API reads.

## Still intentionally not marked complete
- actual generated thumbnail/variant files still need image-processing infrastructure
- broader multi-role permission granularity still remains for a future security pass
- trusted external movie enrichment still depends on the separate movie-data workflow and external source access


## Current pass completion update

- Extended product-resource reservation controls into the main admin products list so linked tools/supplies can be reserved or released from another real day-to-day workflow.
- Hardened the toolshed and supplies discovery pages around centralized API reads and shared filter-group metadata rather than page-local JSON assumptions.
- Storefront product detail now ships lightweight variant-url hints plus build-summary context to support later media-variant rollout and richer product storytelling.


## Current pass completion update

- Mobile product capture now supports partial draft intake using a new `capture_reference` field, so a phone-first session can save a photo, a name, or a temporary identifier before the product is ready for full storefront data.
- Added a detailed finished-products CSV template at `/data/finished_products_import_template.csv` for larger batch seeding.
- Added an admin movie catalog editor so staff can update title/year/actors/UPC/IMDb id and notes directly in D1 while the movie-enrichment pipeline is still being built out.


## Current pass movie and product-entry update
- Keep `movie_catalog_enriched.v2.json` as the active movie base truth until the movie enrichment pipeline is stable enough to prove a clean sync/import path.
- Treat `movie_catalog` in D1 as an edit overlay for manual corrections and contributed metadata, not as the primary movie source yet.
- Finish the admin movie editor so it visibly loads the front cover, back cover, title, year, summary, actor names, director names, studio, runtime, metadata source/status, rarity notes, value fields, and collection notes from the JSON-first movie payload.
- Harden the movie save path against legacy D1 schemas by auto-adding missing columns before writes.
- Keep improving the mobile finished-product workflow so partial drafts can be captured quickly in sequence before later review and publishing.
- Keep expanding the finished-product CSV import path so completed products can be loaded in bulk with SEO, media, tags, category, colour, shipping, readiness, and draft-review support.

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


## Newly completed or moved forward in this pass
- Added dedicated phone inventory intake at `/admin/mobile-inventory/`.
- Added stronger browser security defaults and no-store handling through `_headers`.
- Tightened standalone/mobile app feel and service-worker behavior for safer install use.
- Started explicit dead-file retirement workflow using the `RM_` filename prefix.


## Current pass addendum
- Added basic accounting shadow records plus an admin accounting summary interface to prepare for the later accounting backend.
- Tightened privileged password control so admin can reset any account, including another admin, with step-up confirmation and audit coverage.
- Continued CSS stabilization for dense admin tools before broader stress testing.

## Strongest next steps after this pass
1. Expand accounting shadow records into a fuller bookkeeping backend with costs, tax remittance, and profitability.
2. Extend payment/accounting sync so paid/refunded states update the accounting shadow rows automatically from provider events.
3. Continue role granularity and sensitive-action hardening before stress testing.


## Current pass addendum
- Payment returns, Stripe webhooks, PayPal webhooks, and admin refund actions now resync `accounting_order_records` so the starter accounting layer moves closer to live order/payment state instead of staying order-create only.
- Mobile admin capture and inventory pages now have a stronger installed-app feel with a bottom dock, safer sticky actions, and better safe-area behavior on phones.
- Remaining strongest next steps are now worker-style webhook automation, thumbnail generation, deeper role granularity, and the larger accounting backend rather than basic phone-shell or order-shadow setup.
