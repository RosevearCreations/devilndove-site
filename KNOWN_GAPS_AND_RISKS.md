# Known Gaps and Risks

## Current pass focus and what was actually improved

This pass focused on closing smaller but still meaningful readiness gaps before stress testing: another mobile CSS fit pass, another reduction of public JSON duplication, and cleaner consistency between centralized API reads and the storefront pages that render them.

### What improved in this pass
- Mobile/admin layout was tightened again with stronger small-screen wrapping, safer sticky action spacing, and better installed-app dock behavior.
- Public creations and gallery pages now rely on the centralized `/api/creations` authority path instead of carrying their own page-level JSON source assumptions.
- Creation records now normalize title/name, materials, summaries, and image origin data more consistently whether the current source is D1-backed catalog data or the temporary migration fallback.
- Docs/schema references were synchronized again so the handoff reflects a CSS/mobile/API-authority pass rather than a schema-expansion pass.

## Still honestly open after this pass
- Final mixed JSON/D1 authority cleanup still remains in some movie and legacy admin/read paths.
- Real generated media thumbnails/variants still need image-processing infrastructure rather than URL hints and metadata alone.
- Full provider-confirmed reconciliation beyond the current supported flows still needs more payment-provider coverage.
- Trusted movie enrichment still depends on the external enrichment workflow rather than a finished in-repo provider integration.
- Real-device stress testing is still needed to prove the newer mobile/admin shell under longer sessions.


# Known Gaps and Risks

## Current pass focus and what was actually improved

This pass concentrated on working down the open risk list in order instead of skipping ahead. The goal was to reduce operational risk with real code and schema changes, while staying honest about what still requires provider access, production credentials, or later UI polish.

### What improved in this pass
- Movie sync drift was reduced by moving catalog-sync movie imports to `movie_catalog_enriched.v2.json`, matching the JSON-first source already used by the public and admin movie flows.
- Schema-reference drift was reduced by updating the core/store schema files and the incremental upgrade SQL to include the richer movie overlay fields and current review/purchase-order governance tables.
- Public page SEO guardrails were checked again; exposed pages still keep a single H1 each.
- Payment/refund handling moved forward with provider-aware refund sync attempts for Stripe and PayPal when credentials and provider payment ids are available, plus queued receipt records for refund and dispute messages.
- Webhook operations moved forward with a new admin dispatch endpoint that can requeue due or failed webhook events in a controlled batch with audit logging.
- Inventory authority moved forward with a rewritten admin inventory endpoint that now supports create, update, reserve, release, receive, reorder-request, and catalog-sync actions while logging movements consistently.
- Media lifecycle moved forward with better admin media asset controls for restore, replace metadata, duplicate visibility, delete audit logging, and same-site admin auth.
- Analytics moved forward with stronger funnel metrics in both dashboard summary and visitor analytics.
- Draft-to-publish workflow moved forward with product readiness checks and readiness flags that are now exposed in admin product responses.
- Recovery and admin safety improvements from the prior pass remain in place, including IP/user-agent logging and admin action auditing.

## Gap-by-gap status

### 1. Payment and refund safety
#### Addressed in this pass
- Admin refund actions now attempt provider-side refund sync for Stripe and PayPal when enough provider information is present.
- Refund and dispute records now carry provider sync status, sync notes, and sync timestamps.
- Refund and dispute actions now queue local notification records in `notification_outbox` so receipt delivery can be processed more reliably later.
- Webhook bookkeeping already present from prior passes remains active.

#### Still open
- Stripe checkout is still not fully complete end to end.
- Provider-confirmed dispute sync is still not complete.
- Actual outbound receipt delivery by email or SMS is still queued/foundation-level, not a full sending system.

#### Remaining risk
- Payment state can still drift when providers send events after manual adjustments or when provider ids are missing on older payments.

### 2. Admin and operational security
#### Addressed in this pass
- More admin routes now rely on shared admin auth and audit helpers.
- Webhook batch requeue actions are now auditable.
- Inventory, media, and payment actions continue to feed the audit trail.
- Recovery request hardening from the prior pass remains in place.

#### Still open
- Verified delivery for account recovery is not complete.
- Step-up confirmation for sensitive destructive actions is still not complete.
- Permission granularity still needs deeper review.

#### Remaining risk
- Session misuse, weak recovery delivery, or overly broad admin powers can still create operator and trust problems.

### 3. Inventory authority
#### Addressed in this pass
- Inventory now has explicit reserve, release, receive, and reorder-request action paths.
- Supplier contact, reservation notes, last reorder requested at, and last counted at are now tracked.
- Inventory movement logging is used more consistently across actions.
- Catalog sync remains available as a migration bridge.

#### Still open
- Supplier purchase order workflows are still not complete.
- Build-cost rollups and full reservation governance are still incomplete.
- The final single authoritative movement-ledger design still needs more UI coverage.

#### Remaining risk
- Counts are safer than before, but drift can still happen where legacy workflows bypass the stronger action path.

### 4. Product/media workflow
#### Addressed in this pass
- Media assets now expose duplicate visibility information.
- Media asset restore and replace metadata actions now exist in the admin API.
- Media asset delete/replace operations now write clearer audit records.
- Same-site admin upload continuity remains better than before.

#### Still open
- Thumbnail and variant generation are still not complete.
- Bulk reorder/replace UI polish is still incomplete.
- Storefront use of annotations still needs more polish.

#### Remaining risk
- Media handling is stronger, but the full lifecycle is still not fully operator-proof.

### 5. Analytics and funnel reporting
#### Addressed in this pass
- Dashboard summary now exposes more funnel-oriented counts.
- Visitor analytics now includes order and paid-order funnel metrics and per-day funnel breakdown data.
- The app has a better basis for checking where visitor traffic turns into checkout and paid orders.

#### Still open
- Attribution, campaign analysis, and decision-grade merchandising diagnostics still need more work.
- Build/readiness-to-sales analytics are still not complete.

#### Remaining risk
- The analytics story is improving, but it is still not a full decision-grade BI layer.

### 6. Movie catalog enrichment
#### Addressed in this pass
- No new metadata source was added in this pass.
- The gap remains documented so it is not mistaken for a solved area.

#### Still open
- Trusted title, cast, director, runtime, rarity, and valuation enrichment still depends on IMDb/AWS or another accepted metadata source.

#### Remaining risk
- The movie shelf is usable, but collection credibility and valuation depth are still limited.

## Data-model risks

### JSON and D1 overlap
#### Addressed in this pass
- Inventory operations are more D1-native now.
- Notification/outbox and readiness state are now DB-backed instead of implied only in UI logic.

#### Still open
- Products, movies, tools, supplies, and featured creations still use mixed JSON and D1 paths in places.

#### Remaining risk
- Duplicate points of truth still exist and should continue to be reduced pass by pass.

### Catalog sync bridge
#### Addressed in this pass
- The bridge remains usable and inventory sync is more operationally useful.

#### Still open
- It is still a bridge and not the final authority model.

#### Remaining risk
- Sync drift and operator confusion remain possible until the final authority model is simplified.

## Customer-experience risks

### Search and product discovery
#### Addressed in this pass
- Product readiness signals now help the app know when items are closer to being storefront-ready.
- SEO/search guidance remains active across the docs.

#### Still open
- Broader category/filter depth and stronger discovery landing pages still need more work.

### Mobile and small-screen layout
#### Addressed in this pass
- Another CSS pass improved grid shrink behavior, table wrapping, and small-screen admin controls.

#### Still open
- Real-device testing still needs to continue for admin-heavy screens.

### Draft-to-publish workflow
#### Addressed in this pass
- Products now expose readiness checks and ready/not-ready flags.
- This gives the app a clearer basis for pending review vs storefront-ready behavior.

#### Still open
- Full governed approval/publish workflow is still incomplete.

## Security-forward next steps
1. Finish Stripe checkout completion and provider-confirmed reconciliation.
2. Turn notification outbox into actual receipt delivery.
3. Add stronger privileged-action confirmation for destructive operations.
4. Continue moving inventory and catalog operations toward a single D1 authority model.
5. Expand analytics into deeper attribution and conversion diagnostics.
6. Resume trusted movie metadata enrichment once IMDb/AWS access is available.


## Current pass completion update

### 1. Payment and refund safety
#### Addressed in this pass
- Added `/api/stripe-return` so Stripe Checkout can reconcile the local order and payment record when the customer lands on the confirmation page.
- Updated the confirmation page client so Stripe sessions are finalized on return instead of waiting only for webhook timing.
- Stripe webhook handling now upserts local `payment_disputes` rows for `charge.dispute.*` events, which closes the provider-confirmed dispute-sync gap on the Stripe side.
- `notification_outbox` can now be actively processed through a dispatch helper and admin endpoint instead of acting only as a passive queue.

#### Still open
- Full provider-confirmed dispute sync for non-Stripe providers still depends on provider-specific API coverage and credentials.
- Receipt delivery still depends on configured mail credentials such as Resend before it can operate in production.

#### Remaining risk
- Old historical payments that are missing provider ids can still require manual cleanup.

### 2. Admin and operational security
#### Addressed in this pass
- Sensitive destructive actions now require password confirmation via a shared admin step-up check.
- Product deletion, user deactivate/delete, media deletion, and notification cancellation/dispatch now use stronger privileged confirmation.
- Account-help requests now queue both admin-review and request-received notifications.

#### Still open
- Permission granularity still needs a broader role-by-role review beyond the current admin/member split.

#### Remaining risk
- The step-up layer is stronger than before, but broader role segmentation is still a future hardening step.

### 4. Product/media workflow
#### Addressed in this pass
- Media delete now requires step-up confirmation.
- Public creations now have a centralized `/api/creations` read path, reducing another JSON-only duplicate read path.

### 7. Reality check on "complete everything"
All code-side items that were realistically actionable inside this repo pass were moved forward in code. The one area that still cannot be honestly marked fully complete is trusted movie enrichment, because that depends on an accepted external metadata source and credentials rather than a missing local code path.

## Current pass completion update

### 3. Inventory authority
#### Addressed in this pass
- Added grouped supplier reorder suggestions directly to the inventory response so reorder work can be turned into actual supplier draft orders.
- Added `supplier_purchase_orders` and `supplier_purchase_order_items` plus `/api/admin/purchase-orders` for draft purchase-order workflow.
- Reorder drafts now stamp `last_reorder_requested_at` and keep inventory items on the reorder list.

#### Still open
- Full receiving automation that writes back ordered quantities into incoming stock is still not complete.
- Final end-to-end reservation governance across every legacy workflow still needs more UI coverage.

### 5. Analytics and funnel reporting
#### Addressed in this pass
- Visitor analytics now expose top referrers, top entry paths, and zero-result site searches.
- Dashboard summary now exposes publish-ready products, pending-review products, and active purchase-order draft counts.
- Product cost rollups now give admin a stronger basis for build-readiness-to-margin checks.

#### Still open
- Campaign attribution is stronger than before, but still not a full ad-platform attribution layer.

### Draft-to-publish workflow
#### Addressed in this pass
- Added `/api/admin/product-review-actions` for approve, needs-changes, publish, and unpublish operations.
- Added `product_review_actions` so review history is durable and auditable.
- Product list now exposes linked resource cost, rough margin, and missing-cost warnings to support better publish decisions.

#### Still open
- Role-by-role review authority is still limited by the current broad admin/member split.



## Current pass completion update

### 3. Inventory authority
#### Addressed in this pass
- Supplier purchase-order workflow now moves ordered quantities into `incoming_quantity` when a draft is marked ordered.
- Supplier purchase-order receiving now moves received quantities from incoming stock into on-hand stock and records received quantity per line item.
- Purchase-order rows now expose ordered-vs-received totals for safer receiving review.

#### Still open
- Reservation governance still needs broader UI coverage across every legacy path that can consume inventory.

### Data-model risks
#### Addressed in this pass
- Public tools and supplies now have centralized read endpoints (`/api/tools` and `/api/supplies`) that prefer D1-backed catalog rows before falling back to legacy JSON.
- Public gallery/creations reads now prefer centralized API paths before using the legacy items-for-sale JSON.

#### Remaining risk
- Mixed authority still exists in some areas, but another outward-facing JSON duplication point has been reduced.


## Current pass completion update

### 3. Inventory authority
#### Addressed in this pass
- Added product-level reservation actions so admin can reserve or release all linked tool/supply inventory for a product in one request instead of adjusting every item manually.
- Product cost rollups and product-list responses now expose `buildable_units_from_resources` and `resource_shortage_links` to make resource pressure and reservation risk more visible before publish/build decisions.
- The quick mobile-product bootstrap endpoint now uses the shared admin auth path and the correct inventory reorder field, which reduces false 500s during phone-first product entry.

#### Still open
- Reservation controls still need broader frontend coverage so every legacy UI path uses the stronger product-level reservation workflow.

### 4. Product/media workflow
#### Addressed in this pass
- Fixed the admin media asset patch route so it no longer references an undefined step-up variable.
- Added bulk media metadata/sort updates through the media-assets patch route so reorder and variant-role cleanup can be applied in batches instead of one image at a time.

### Customer-experience risks
#### Addressed in this pass
- Public tools, supplies, and creations APIs now return filter-group summaries for categories/types, which gives the storefront a stronger base for broader discovery filters and landing-page navigation.


## Current pass completion update

### 1. Payment and refund safety
#### Addressed in this pass
- Admin refund and dispute actions now try to dispatch queued receipt emails immediately after recording the local event instead of leaving all delivery to a later manual outbox sweep.
- Stripe webhook reconciliation now queues and attempts provider-confirmed dispute and refund/customer-notice emails when a matching customer email is available.

#### Still open
- Non-Stripe provider-confirmed dispute syncing still depends on provider-specific API coverage and credentials.
- Production delivery still depends on working mail credentials such as `RESEND_API_KEY` and `NOTIFICATION_FROM_EMAIL`.

### Data-model risks
#### Addressed in this pass
- Public storefront product reads now expose live filter-group summaries for category, colour, and product type directly from `/api/products`, reducing more page-level discovery guesswork.
- Public tools and supplies pages now consume their dedicated centralized APIs (`/api/tools` and `/api/supplies`) instead of the broader generic catalog endpoint, which reduces another outward-facing duplication path.

#### Remaining risk
- Products themselves are still D1-backed, but some storefront and admin workflows still need more shared API-first authority to fully retire legacy mixed paths.

### Customer-experience risks
#### Addressed in this pass
- Shop results now expose clearer discovery context from live category/colour counts.
- Outward-facing tool and supply discovery now leans on the dedicated centralized public APIs that already expose filter summaries.

## Current pass completion update

### Product/media workflow
#### Addressed in this pass
- Direct media upload can now attach an uploaded file directly into `product_images` and `product_image_annotations`, optionally set the featured image, and carry simple variant-role notes in the media record.
- Bulk product import now seeds richer finished-product records, including SEO rows, tags, category/colour/shipping fields, and extra product-image rows.
- Import preview now catches duplicate slugs, SKUs, and product numbers before insert, which reduces failed batches and cleanup work.

#### Still open
- True thumbnail/variant file generation is still not complete; this pass improved metadata/attachment lifecycle rather than image processing.



## Current pass completion update

### 3. Inventory authority
#### Addressed in this pass
- Product stock reporting now exposes `buildable_units_from_resources` and `resource_shortage_links` directly in the stock-report endpoint so build pressure is visible without switching reports.
- The admin product stock report UI now lets admin reserve or release all linked tool/supply inventory for a product in one workflow, which extends reservation governance into another real frontend path instead of leaving it API-only.

#### Still open
- Reservation controls still need to appear in every older admin workflow that can consume inventory.

### 4. Product/media workflow
#### Addressed in this pass
- Admin media asset reads now expose derived variant URL suggestions (`thumb`, `medium`, `large`, `webp`) so the storefront/media workflow has a clearer path for later variant-file rollout.
- Storefront product detail now returns grouped image data with variant-role awareness plus annotated-image grouping, which improves annotation-to-storefront usage.

#### Still open
- True generated thumbnails/variants still need actual image-processing infrastructure rather than metadata alone.

### 5. Analytics and funnel reporting
#### Addressed in this pass
- Visitor analytics now include top product-detail paths and top ordered products, giving admin stronger merchandising diagnostics around what is being viewed versus what is actually selling.
- Dashboard summary now exposes `product_build_risk_count` and duplicate-media counts for faster operational triage.

#### Still open
- Campaign attribution still is not a full ad-platform attribution layer.

### Data-model risks
#### Addressed in this pass
- Public supplies discovery now uses the centralized `/api/supplies` path end to end on the outward-facing page instead of falling back to page-level JSON reads.
- The internal tools health page now reads from `/api/tools`, which reduces another direct JSON dependency during the migration period.

#### Remaining risk
- Some mixed JSON/D1 authority still remains, especially around movies and a few legacy admin/read paths.


## Current pass completion update

### 3. Inventory authority
#### Addressed in this pass
- The admin product list now lets staff reserve or release all linked tool/supply inventory for a product directly from the main products screen, not only from the stock-report view.
- Storefront product detail now returns `build_summary` so buildable-unit pressure and shortage counts can be surfaced without a separate admin-only lookup.

#### Still open
- Some older admin and import-oriented workflows still do not expose the stronger reservation actions inline.

### 4. Product/media workflow
#### Addressed in this pass
- Storefront product detail now returns lightweight `variant_urls` hints with each storefront image so later real thumbnail/variant rollout has a cleaner contract.
- Annotated/grouped image responses now ship with build-summary context in the same payload, which reduces extra product-detail lookups in later UI work.

#### Still open
- Real generated thumbnail/variant files still require image-processing infrastructure rather than URL/metadata hints alone.

### Data-model risks
#### Addressed in this pass
- The toolshed page now reads from the centralized `/api/tools` endpoint only, instead of falling back through multiple direct JSON paths.
- Supplies discovery now uses API-provided filter groups more consistently, reducing another page-level derivation path.

#### Remaining risk
- Mixed JSON/D1 authority still remains in movies and a few legacy admin/read flows.


## Current pass completion update

### Product/mobile workflow
#### Addressed in this pass
- Mobile finished-product capture now supports partial draft entry so staff can save only a photo, a temporary name, or another identifier and move on without filling every storefront field first.
- Products now support `capture_reference`, which gives intake and follow-up work a safer temporary identifier during phone-first capture.
- Added a detailed finished-products CSV template at `/data/finished_products_import_template.csv` so large batches can be prepared with the same field names the bulk import endpoints expect.

### Movie catalog enrichment
#### Addressed in this pass
- Added an admin movie-details editor backed by `movie_catalog`, so title, year, actors, UPC, IMDb id, and alternate identifiers can now be reviewed and updated in-app instead of only through source JSON edits.
- Movie catalog rows now support `imdb_id`, `alternate_identifier`, `metadata_status`, and `collection_notes`, which creates a better path for staff-curated or visitor-contributed metadata before external enrichment is complete.

#### Still open
- Trusted bulk movie enrichment still depends on an accepted external metadata source or on locally processed enrichment files.


## Current pass completion update

### 6. Movie catalog enrichment
#### Addressed in this pass
- Reconfirmed that `movie_catalog_enriched.v2.json` remains the current movie base truth for the live shelf while local/manual movie edits are layered through D1 as an overlay rather than a full migration.
- The admin movie editing workflow now targets richer manual curation fields, including title, year, actor names, director names, metadata source/status, collection notes, rarity notes, value fields, UPC, IMDb id, alternate identifier, trailer URL, and front/back cover URLs.
- The movie handoff direction is now clearer: do not force full D1 authority for movies until the enrichment pipeline is stable and verified against the live collection file.

#### Still open
- The movie edit screen still needs to visually show every important JSON-backed field consistently, especially cover previews, summary, source/value fields, and existing metadata already present in `movie_catalog_enriched.v2.json`.
- Old D1 `movie_catalog` tables can still fail writes until compatibility upgrades finish adding every later movie column automatically.
- Trusted external movie enrichment remains dependent on the local/offline processing workflow rather than a finished in-repo provider integration.

#### Remaining risk
- If movie reads drift away from the JSON-first source too early, the live shelf can lose already-curated metadata or show incomplete cards.

### Draft-to-publish workflow
#### Addressed in this pass
- The intended phone-first product-entry direction is now explicit: new finished products must be savable as partial drafts with only a photo, only a name, only a capture reference, or any small subset of fields while the operator moves on to the next item.
- The finished-product CSV requirement is now clearer: the repo needs a detailed import template for bulk entry of completed products while still allowing draft-like partial intake where appropriate.

#### Still open
- The mobile product screen still needs to enforce the “save partial draft now, complete later” flow consistently before publish-time validation rules are applied.
- Bulk import still needs continued tuning so draft and ready-for-review rows are both handled cleanly.

- New finished-product numbering now starts at DD1000 for newly created products. Internally the database still stores the numeric portion as `1000`, `1001`, and so on, while the UI can present the public/admin-friendly `DD1000` style code.
- Added a first-pass installable phone experience with `manifest.webmanifest`, `sw.js`, and generated app icons so visitors can save Devil n Dove to a home screen more cleanly than a plain browser shortcut.
- Added a new `/socials/` page backed by `/data/site/social-feed.json` and seeded it with your current profile links plus a first saved list of five public YouTube videos.
- The admin tools-and-supplies inventory editor now includes a barcode-photo helper that can fill the external key from a phone photo when the browser supports `BarcodeDetector`. It prepares an Amazon search link, but full product-detail import from Amazon is still blocked until Amazon Product Advertising API credentials or another approved catalog source is added.

## Current pass completion update

### Product numbering and phone install shell
#### Addressed in this pass
- New finished-product numbering now starts at DD1000 for new records while keeping the stored database field numeric for compatibility.
- Added a manifest, service worker, and generated icons so the public site can be installed to a phone home screen as a cleaner app-like entry point.

#### Still open
- A richer offline-first install experience still needs more testing across Android and iPhone browsers.

### Social hub
#### Addressed in this pass
- Added `/socials/` as a first shared social landing page and seeded it with profile links plus five public YouTube videos.

#### Still open
- Automated Instagram, TikTok, and X post ingestion still needs an approved API/source or a manual content sync file.

### Inventory intake and barcode workflow
#### Addressed in this pass
- The admin inventory editor already supported manual tool/supply creation; this pass added a phone-photo barcode helper that can detect a barcode in-browser and prepare an Amazon search URL from it.

#### Still open
- Automatic detail import from Amazon is still not complete because it requires Amazon Product Advertising API access or another approved product metadata source.

## Current pass addendum
- Normalized public route links away from explicit `/index.html` navigation and added a `_redirects` file so direct `.../index.html` requests resolve more cleanly alongside directory routes.
- Expanded the installable phone shell with a stronger manifest, install prompt handling, Apple home-screen metadata, and an offline fallback page.
- Added another CSS hardening pass for mobile/admin layout overflow and dark-mode calendar/date picker visibility.
- This pass did not require a new D1 schema table change; schema reference files were refreshed to reflect that the changes were routing/PWA/CSS/app-shell focused rather than DB-structure focused.


## Current pass addendum
- Added `_headers` with stricter browser security defaults, no-store caching for admin/member/auth paths, frame blocking, and a tighter site-wide CSP baseline.
- Service worker caching now bypasses admin, member, login, register, account-help, and API routes so sensitive pages are not stored offline.
- Added `/admin/mobile-inventory/` as a dedicated phone-friendly intake page for tools and supplies, built on the same protected inventory operations already used in admin.
- Tightened the installable phone shell again with a stronger manifest, app shortcuts for quick capture and inventory intake, and better standalone-mode layout behavior.
- Added another CSS pass to reduce input/button overlap, improve resource-card wrapping, improve mobile action layouts, and keep dark-mode date/calendar controls readable.
- Performed a dead-file sweep on clearly unlinked duplicate repo files and prefixed them with `RM_` so they are easier to review and remove later without touching active paths.

### Still honestly open after this pass
- Full automated Instagram, TikTok, and X ingestion still needs approved API or feed access.
- Full Amazon product-detail import from barcode still needs Amazon Product Advertising API access or another approved source.
- Full role-by-role permission granularity is still broader than desired even after tighter headers, step-up, and cache controls.
- Mixed JSON/D1 authority still remains in some movie and legacy admin/read paths.
- Trusted movie enrichment still depends on the external enrichment workflow rather than a finished in-repo provider integration.

### Dead-file review result in this pass
The following files were not found on active repo paths and were renamed with an `RM_` prefix instead of being deleted:
- `data/data/RM_catalog.json`
- `data/data/RM_products.json`
- `data/data/RM_tools.json`
- `data/data/site/RM_featured-items.json`
- `data/data/itemsforsale/RM_itemsforsale_items_master.json`
- `data/data/toolshed/RM_exact_duplicate_report.json`
- `data/data/toolshed/RM_toolshed_items_master.json`
- `data/data/supplies/RM_README.txt`
- `data/data/supplies/RM_exact_duplicate_report.json`
- `data/data/supplies/RM_supplies_images_inventory.csv`
- `data/data/supplies/RM_supplies_images_inventory.json`
- `data/data/supplies/RM_supplies_items_master.csv`
- `data/data/supplies/RM_supplies_items_master.json`
- `data/data/supplies/RM_supplies_metadata.zip`
- `RM_repair.sql`
- `assets/movies/RM_movie_catalog_review_queue_v2.csv`


## Current pass addendum
- Added basic accounting shadow records so every newly created order now seeds an `accounting_order_records` row for later bookkeeping, tax, and revenue work.
- Added a first admin accounting interface inside the orders area so booked, paid, outstanding, and tax-liability totals are visible before the deeper accounting backend exists.
- Tightened admin password control so an admin can reset any user password, including another admin account, with step-up password confirmation and audit logging.
- Continued another CSS pass around admin form density, mobile wrapping, and accounting/password tools.

### Still honestly open after this pass
- Full double-entry accounting, COGS, inventory valuation, and tax remittance workflows still need the later accounting backend.
- Broader multi-role permission granularity still remains beyond the current admin/member split even though admin password resets are now tighter and auditable.
- Mixed JSON/D1 authority still remains in some movie and legacy admin/read paths.


## Current pass addendum
- The starter accounting shadow layer now resyncs from Stripe return, Stripe webhook, PayPal return, PayPal webhook, and admin refund actions, which reduces drift between order/payment state and accounting summary records.
- Phone-first admin pages now have a more complete installed-app feel with a bottom dock, sticky primary actions, and safer standalone safe-area spacing.

### Still honestly open after this pass
- Fully automated worker-driven webhook retry/replay is still not complete even though admin dispatch and provider-triggered accounting sync are stronger.
- Real generated media thumbnails/variants still need image-processing infrastructure.
- Full role-by-role permission granularity still remains beyond the current admin/member split.
- Mixed JSON/D1 authority still remains in some movie and legacy admin/read paths.
- Trusted movie enrichment still depends on the external enrichment workflow.

## Current pass addendum
- Fixed the admin-to-members preview/logout problem by keeping auth clearing limited to real auth/session routes and allowing a safer cached-admin preview fallback on `/members/?admin_preview=1`.
- Fixed the unnamed admin accordion section by using explicit panel titles/direct child headings and moving the Products heading ahead of injected module mounts.
- Continued mobile/admin/store polish with quicker Artist and Store links from the phone-first admin surfaces.

## Current pass addendum
- Admin preview/logout risk was reduced again by keeping `/members/?admin_preview=1` in cached-admin layout-review mode instead of letting it fall through into member-only redirect logic.
- Admin dashboard load risk was reduced again by adding a fallback products query when richer inventory/resource joins are not yet available in the target database.
- Movie editor regression risk was reduced again by restoring save/load calls through the shared authenticated admin fetch helper.
- Admin UI cohesion improved again because accordion section state now persists between visits instead of reopening every section on return.
- Service-worker noise risk was reduced again by bypassing `/api/` requests and catching rejected bypass fetches more defensively.
