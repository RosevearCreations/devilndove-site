# Build 159 note

Catalog Product Editor image UX was repaired: existing saved images now appear as draggable thumbnail cards in Product pictures, the first card syncs to the featured image, gallery URL slots are de-duplicated from the featured image, and advanced media metadata remains in Product Media Workflow. No schema migration required for this front-end pass.

# Build 156 repo guide update

Build 156 adds public service pages under `/custom-candle-making-ontario/` and `/custom-soap-making-ontario/`, private token pages under `/custom-request/pay/`, `/custom-request/order/`, and `/custom-request/consent/`, and new public/admin API functions for custom payment/order/consent workflows. Keep private token pages out of `sitemap.xml`; only public service pages should be indexed.

# Build 154 repo note

New important files/paths:

- `scripts/bake_approved_seo_overrides.py`
- `data/site/seo-page-overrides.json`
- `functions/api/admin/custom-requests.js` expanded quote/payment/order draft workflow
- `functions/api/custom-request-quote.js` accepted quote follow-through
- `functions/api/custom-request-reference-upload.js` media consent mirroring
- `functions/api/admin/accounting-close-workflow.js` ZIP export support
- `/gallery/` filter UI

# Build 153 repo guide update

Key Build 153 files: `functions/api/admin/custom-requests.js`, `public/js/admin-custom-requests.js`, `functions/api/custom-request.js`, `functions/api/custom-request-reference-upload.js`, `functions/api/custom-request-quote.js`, `public/js/custom-request-intake.js`, `public/js/custom-request-quote-preview.js`, `custom-request/index.html`, `custom-request/quote/index.html`, `css/styles.css`, and active Markdown/schema files.

# Build 152 repo base note

Custom request follow-up now lives in `/functions/api/admin/custom-requests.js` and `/public/js/admin-custom-requests.js`. Keep generated reply templates manual/review-first; do not auto-send customer email or auto-create a payable invoice until the future payment-request bridge is complete. HST/GST reminders are queued through `/functions/api/admin/accounting-close-workflow.js` and depend on notification outbox dispatch setup.

# Build 151 repo guide note

This build continues the clean handoff pattern: code, schema SQL, and active Markdown files were updated together. After deployment, verify Operations > Custom Requests, Social Posting Queue UTM rollups, and Accounting > Close Workflow CSV export.

# Build 150 repo note

New Build 150 files and touchpoints:

- `functions/api/admin/testimonial-trust-blocks.js` and `public/js/admin-testimonial-trust-blocks.js`
- `functions/api/trust-blocks.js`
- `functions/api/seo-page-overrides.js` and `public/js/seo-page-overrides.js`
- `functions/api/admin/accounting-close-workflow.js` and `public/js/admin-accounting-close-workflow.js`
- `functions/api/admin/search-console-import.js` now applies reviewed SEO actions.
- `admin/operations/index.html`, `admin/accounting/index.html`, public page scripts, Release Sanity, Public API Health, schema SQL, and Markdown docs were updated.

# Repo Base Guide — Devil n Dove

## Build 140 repo note

Social posting now includes dry-run previews, scheduling, caption variants, duplicate guardrails, and media warnings in `functions/api/admin/social-post-queue.js` and `public/js/admin-social-post-queue.js`. Release Sanity and the predeploy sanity script both check the social queue layer.


## Build 139 repo note

Social posting files now include API publishing attempts inside `functions/api/admin/social-post-queue.js` and UI controls in `public/js/admin-social-post-queue.js`. The Operations page mount remains `socialPostQueueAdminMount`. The workflow is review-first and credential-safe.

# Repo Base Guide

## Build 137 note

After deploying this build, apply or record `database_upgrade_current_pass.sql`. The new Search Console action queue is private D1 data and should not be exported into public static folders. Use `/admin/operations/` to test Search Console filters, batch delete/revert, and generated SEO action items.

## Build 135 repository note

New admin assets: `functions/api/admin/media-diagnostics.js`, `functions/api/admin/product-image-health.js`, `public/js/admin-media-diagnostics.js`, `public/js/admin-product-image-health.js`, and `public/js/admin-product-draft-checklist.js`. Keep these wired into Operations/Product pages during future refactors.


Current sync: 2026-05-18 — Build 137 Search Console filtering, safe batch revert, and private SEO opportunity action queue.

## Main paths
- `/functions/api/` — Cloudflare Pages Functions.
- `/public/js/` — active client/admin JavaScript.
- `/admin/` — admin department pages.
- `/data/` — approved fallback/seed/export data.
- `/css/styles.css` — shared styling.
- `/database_*.sql` — schema and migration references.
- `/archive/` — historical/retired files.

## Admin pages touched this pass
- `/admin/operations/` — Migration Ledger and Release Sanity panels.
- `/admin/accounting/` — Statement Provider Profiles panel and imports provider dropdown.

## API files added or updated this pass
- `functions/api/admin/migration-ledger.js`
- `functions/api/admin/release-sanity.js`
- `functions/api/admin/accounting-statement-provider-profiles.js`
- `functions/api/admin/accounting-statement-imports.js`
- `functions/api/admin/_accountingStatementImports.js`
- `functions/api/admin/db-sanity.js`
- `functions/api/admin/site-item-inventory.js`

## Browser scripts added or updated this pass
- `public/js/admin-migration-ledger.js`
- `public/js/admin-release-sanity.js`
- `public/js/admin-accounting-statement-profiles.js`
- `public/js/admin-accounting-imports.js`
- `public/js/admin-accounting-backend.js`

## Keep private
Do not commit or deploy raw Amazon order CSVs, account exports, private reports, or accountant-only documents to public static paths.

## Build 125 note

Build 125 keeps Amazon order/cost data private, adds admin review/apply controls for Amazon staging rows, records inventory cost history, expands reconciliation and journal guardrails, and adds local-intent SEO pages plus `sitemap.xml`. Keep schema files and active Markdown updated on every pass.

## Operations runtime review - Build 126

`/admin/operations/` now includes the Security / Runtime Incidents panel. The panel reads `/api/admin/runtime-incidents?group=1`, shows grouped repeated errors, and lets an admin mark selected incident rows as reviewing, resolved, ignored, or reopened.

## Build 128 endpoint guardrail

When adding new product columns to public APIs, do not reference them directly in static SQL until D1 migrations are verified live. Use adaptive column checks or direct no-row column verification so public pages keep rendering during staged schema upgrades.

## Build 129 operations guide

For each deploy, visit `/admin/operations/` and run D1 Schema Drift Report, Public API Health, Runtime Incidents, Migration Ledger, and Release Sanity. This is now the preferred flow for catching D1 schema drift and public API regressions before testing the storefront manually.

## Build 130 development rule

Public storefront APIs must not assume optional D1 columns exist. Use actual schema checks first, and keep a safe fallback that does not break public pages while migrations catch up.

## Build 131 repo guide update

Use `scripts/predeploy_sanity_check.py` before packaging when possible. For live D1 schema drift, use `/admin/operations/` > Storefront Schema Repair instead of manually guessing `ALTER TABLE` statements. Keep private import/cost/order files outside public static folders.

## Build 132 repository note

Mobile navigation changes live in `/js/main.js` and `/css/styles.css`. Do not duplicate per-page nav markup unless necessary; the shared nav injector should remain the source of truth for public pages. Use the predeploy sanity script before zipping.

## Build 133 note

Build 133 adds admin Operations assets for structured data health, live sitemap preview, and safe storefront value backfill. Keep these panels together on `/admin/operations/` when refactoring admin departments.


## Build 134 note

This pass fixes the Product editor draft workflow: drafts require only name/type, image upload is available from the editor when R2 media storage is configured, create-product failures return JSON instead of HTML 500 pages, and the create endpoint adapts to live D1 product/media/SEO columns.

## Build 138 repo note

Social posting queue files added: `functions/api/admin/social-post-queue.js` and `public/js/admin-social-post-queue.js`. The Operations page mounts the panel and Release Sanity checks the endpoint.


## Build 141 repo note

Current-pass social changes touch `/functions/api/admin/social-post-queue.js`, `/public/js/admin-social-post-queue.js`, `database_upgrade_current_pass.sql`, and schema/reference Markdown. Keep future social platform secrets out of repo files; use Cloudflare environment variables only.


## Build 142 update — Competitive roadmap completed and tracked

- Completed `COMPETITIVE.md` as the active competitive strategy for Devil n Dove, covering positioning, homepage/product-page improvements, mobile UX, local SEO, social workflow, marketplace readiness, product media, trust, and accounting/margin direction.
- Added Operations > Competitive Roadmap so the highest-value items from the document can be seeded into D1, assigned a status, and reviewed during Release Sanity.
- Added `competitive_opportunities` and `competitive_opportunity_events` schema support.
- Added `/data/site/competitive-opportunities.json` as a public-safe roadmap seed file; it contains strategy/action metadata only and no private costs, orders, or customer data.
- Next direction: connect competitive opportunities to product readiness, SEO action completion, social analytics, testimonials, custom requests, and marketplace export checks.

## Build 155 maintenance note

- Updated alongside the latest custom request payment/order/marketplace/proof-filter pass.
- Schema, roadmap, gaps, SEO, and sanity notes now reflect the new Build 155 workflow direction.

## Build 157 update — payment readiness, link controls, stages, candle/soap specs, marketplace presets, and consent proof review

Completed in this pass:

- Hardened `/api/admin/mobile-create-product` so Save Partial retries duplicate SKU/product-number/slug conflicts and returns a recoverable JSON response instead of a raw D1 500 when identity generation collides.
- Added admin link lifecycle controls for custom quote, payment, order-status, and consent links: resend marker, expire, and void.
- Added customer custom-order stage tracking for planning, making, curing/finishing, ready, shipped/pickup, and complete.
- Added candle/soap intake fields for scent profile, wax/base, colour notes, batch, ingredient notes, and allergen/safety notes.
- Added `custom_candle_soap_product_specs` so candle/soap details can be tracked outside the general message text and later linked to product drafts or finished products.
- Added marketplace channel presets and richer CSV rows for Etsy, Facebook Marketplace, Pinterest, and manual listings, including category and shipping-profile review fields.
- Added payment provider readiness records for Stripe, PayPal, and Square configuration checks. This records configuration readiness only; real production checkout still requires a live low-value test order with credentials in Cloudflare.
- Added consent-to-public-proof candidates and an admin approval action that can turn an approved response into a public trust block.
- Updated private order-status pages to show custom work stage history.
- Updated schema files and handoff Markdown for the new workflow.

Next strongest steps:

1. Add editable UI fields for candle/soap scent, wax/base, colour, batch, ingredients, allergen/safety notes, and cure-ready date inside product drafts and mobile product capture.
2. Add explicit Stripe/PayPal/Square live-test result buttons after production credentials are configured in Cloudflare.
3. Add per-link customer copy templates for resend actions so quote/payment/order/consent links can be manually resent with consistent wording.
4. Add public-safe trust block moderation filters so approved consent proof can be scheduled by page/context.
5. Add stage-specific customer messages for custom work: planning, making, curing/finishing, ready, and shipped/pickup.
6. Add marketplace preset editing UI instead of relying on seeded defaults.

## Build 158 — Catalog action and image workflow repair

- Added `IMAGES.md` with the complete image/video placement checklist, required sizes, allowed video use, target paths/data fields, and product image role workflow.
- Repaired `/admin/catalog/` so it now includes the full product editor form required by Edit, product picker, image fields, SEO fields, marketplace fields, and the media/resource modules.
- Changed Product table Approve/Publish buttons so they are clickable even when blocked; the backend now returns the exact missing fields instead of silently doing nothing through a disabled button.
- Improved Needs Changes so admins are prompted for what needs changing and that note can be saved into the product review history/readiness notes.
- Hardened product review actions by ensuring support tables exist before review/publish checks run and by returning human-readable readiness labels.
- Repaired Reserve Resources and Release Resources UI feedback so it handles the actual inventory API response shape and reports affected, skipped/story-only, and missing inventory links.
- Improved Product Media Workflow so loading a product for editing auto-loads its image rows, each row shows a thumbnail, Delete image row is clearer, and saving an empty image set clears `featured_image_url`.
- Continued SEO/H1 discipline: one H1 per scanned public page, private/admin pages kept separate from public SEO goals, and local/product image guidance documented.

### Build 158 next steps

1. Add admin dashboard counters for products missing hero image, missing image roles, missing alt text, blocked public-use status, and missing OG image.
2. Add static example images for custom candle making, custom soap making, custom requests, and About/workshop story.
3. Add a backend endpoint that returns product readiness blockers separately from review actions so the UI can show a checklist before clicking Approve/Publish.
4. Add CSV/export image validation for Etsy/Facebook/Pinterest before marketplace export.
5. Add video poster image fields to product story notes and custom candle/soap pages.

## Build 160 — Catalog editor URL validation and publish image sync repair

- Fixed the Product Editor canonical URL field so relative site paths such as `/shop/product/?slug=desert-succulents-100` are accepted. The input is now text with helper guidance instead of browser `type=url` validation.
- Clarified External Listing URL: leave it blank for normal Devil n Dove shop products; only add a full `https://` Etsy/Facebook/marketplace URL when Sale Channel is Hybrid or External-only.
- Hardened update/create product image syncing so the featured image is also stored in `product_images` at sort order 0, gallery rows follow after it, duplicates are removed, and existing image rows/annotations are preserved when the URL already exists.
- Fixed Clear editor so the visual image cards and Product Media Workflow panel clear along with the form fields.
- Improved publish/approve readiness consistency by making the editor’s image fields and backend `product_images` rows agree before review actions run.
- No new D1 table is required in this pass; this is a code/data-sync behavior repair against the existing products, product_images, product_seo, and product_image_annotations tables.

Next recommended checks:
1. Edit a product with a relative canonical path and click Update Product.
2. Confirm External Listing URL is blank for normal onsite listings.
3. Save, reload, and confirm the first visual image is the featured image and appears in Product Media Workflow.
4. Run Approve/Publish; any blocker should now be a real readiness issue such as missing image role, missing SEO, missing price, or blocked public-use status.

## Build 161 — shop image/gallery, product detail JSON fallback, and catalog workspace split

- Repaired the public product detail page so an HTML fallback response from `/api/product-detail` no longer throws a raw `Unexpected token '<'` JSON error in the browser. The page now reads the response as text, detects HTML, and falls back to `/api/products` by slug when possible.
- Hardened `functions/api/product-detail.js` with a final JSON error wrapper so late D1/query failures return JSON instead of a static HTML error page.
- Extended `/api/products` to attach product image arrays from `product_images`, allowing shop cards to show a main image plus selectable thumbnail images.
- Updated the Shop product card UI so cards are more compact, show richer product details, and allow thumbnail clicks to change the main product image.
- CSS-polished the Shop “Browse by collection direction” area and the `/creations/` collection/trust grid so the layouts are less cramped and more mobile-safe.
- Split the oversized `/admin/catalog/` workflow into focused workspaces: Products & Publishing, Media & Product Images, and Tools & Supplies Inventory Operations.
- Added `/admin/catalog-media/` for media, image roles, image annotations, SEO, and product story work.
- Added `/admin/inventory-operations/` for tools, supplies, stock, product resource reservations, catalog sync, option sets, notifications, and app settings.
- Capped the Product Editor file picker to six selected uploads at a time while preserving existing product-image slots.
- Made the Product Media Workflow more compact by moving advanced crop/quality/scoring fields into a collapsible advanced section.

Next recommended steps: add a dedicated readiness-preview endpoint for product publishing blockers, add image health counters to the admin dashboard, and add live test notes after deploying Build 161.

## Build 162 — Shop/Creations CSS, Gift Page, and Inventory Image References

- Added `/gift-cards/` as a dedicated public gift-card page so the main shop no longer has the full gift-card form awkwardly placed between filters and products.
- Changed `/shop/` to show a compact gift-card callout that links to `/gift-cards/`.
- Repaired the contrast for the `/shop/` Browse by collection direction panel and the `/creations/` browse/filter/cards areas so light panels use dark readable text.
- Updated Tools & Supplies Inventory Operations to show a live visual image preview beside the Image URL field while keeping the URL editable.
- Updated the inventory list rows to show a larger thumbnail, the image URL link, and the source/Amazon URL link for easier visual reference.
- Added `/gift-cards/` to the sitemap. No D1 schema migration is required for this pass.


## Build 163 — 20-step roadmap/gaps pass: readiness, image health, gifts, and admin clarity

Completed in this pass:

1. Added `/admin/readiness/` as a focused Product Readiness workspace.
2. Added `/api/admin/product-readiness` so Approve/Publish blockers can be previewed before clicking action buttons.
3. Added readiness summary counters for total, ready, blocked, missing featured image, missing image roles, missing alt text, blocked public-use images, missing SEO, missing price, and products needing 3 images.
4. Added per-product blocker cards with direct links back to the product editor and media workspace.
5. Added dashboard counters for product image/SEO readiness gaps.
6. Added a Product Readiness department card to the Admin Dashboard.
7. Added Readiness Preview links to Catalog, Catalog Media, and Inventory Operations workspace navigation.
8. Added a static gift-card artwork placeholder at `/assets/gift-card-placeholder.svg`.
9. Added gift-card artwork guidance directly to the `/gift-cards/` hero.
10. Added Gift Cards to the home navigation so the new gift page is easier to find.
11. Hardened predeploy sanity checks so the new readiness page, endpoint, dashboard counters, gift artwork, and CSS assets are checked every pass.
12. Added CSS for readiness cards, readiness score badges, blocker rows, and the split gift-card hero.
13. Kept the one-H1 rule intact across all scanned exposed pages.
14. Kept private/admin pages as `noindex,nofollow` where appropriate.
15. Continued the local SEO habit of clear titles, readable headings, and visible local/product wording.
16. Kept the new readiness endpoint D1-backed without adding a required migration.
17. Preserved the split admin structure from the previous pass: Products, Media, Inventory Operations, and now Readiness.
18. Improved operator visibility before publishing by making missing image roles, missing hero/detail/scale roles, public-use blockers, SEO gaps, and price gaps visible from one place.
19. Updated active Markdown handoff docs with Build 163 notes.
20. Updated schema/reference SQL notes with Build 163 status and no-migration guidance.

Next 20 recommended steps:

1. Add inline readiness badges beside each row in the `/admin/catalog/` product table.
2. Add a one-click “Open first blocker” shortcut from each readiness card.
3. Add image-role quick-fix buttons from the readiness page.
4. Add automatic “apply recommended roles” preview before saving image rows.
5. Add true crop/focal-point visual editing directly on thumbnail cards.
6. Add visible “image order saved” confirmation that shows featured/gallery order after save.
7. Add dashboard drilldown links from each image/SEO counter.
8. Add gift-card admin settings for default amounts, expiry wording, and active/inactive status.
9. Add a real gift-card image upload field and replace the placeholder artwork.
10. Add gift-card checkout order-line creation instead of only local draft storage.
11. Add marketplace image validation before CSV export.
12. Add channel-specific marketplace CSV presets editing in admin.
13. Add shop/product API filters for “missing proof image” and “ready for social.”
14. Add post-publish QA for product detail JSON, image gallery, cart button, and SEO preview.
15. Add public product page mini-gallery thumbnails below the main image if any product detail page still only shows one image.
16. Add public proof/trust moderation filters before new trust blocks appear customer-facing.
17. Add order-stage photo uploads for custom work: planning, making, curing/finishing, ready, pickup/shipping.
18. Add candle/soap spec editing after product creation: scent, wax/base, colour, ingredients, allergens, and batch number.
19. Add accountant export checks for missing evidence URLs and missing close notes.
20. Add a mobile admin landing page that links to phone capture, inventory intake, readiness blockers, and today’s admin actions.
