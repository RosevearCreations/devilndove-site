# Build 156 API note

New or expanded API surface:

- `/api/custom-request-payment` — public private-token payment page API. It now blocks links that did not pass admin share gates and can prepare Stripe/PayPal/Square/manual checkout records.
- `/api/custom-request-order` — public private-token order-status API for converted custom-request orders.
- `/api/custom-request-consent` — public private-token review/photo/consent response API.
- `/api/admin/custom-requests?format=marketplace_csv&channel=...` — authenticated CSV export for Etsy, Facebook Marketplace, Pinterest, or all/manual listing review.
- `/api/admin/custom-requests` — expanded with payment-share gate checks, checkout record visibility, order-status links, consent prompt tokens, and stricter approved payment link rules.

Do not expose private token URLs in sitemap or public navigation. Keep all external payment sharing behind admin approval gates.

# Functions API Notes

Current sync: 2026-05-14 — Build 125.

## Active API surface
Cloudflare Pages Functions are under `/functions/api/`. Admin endpoints require admin authentication through the existing admin audit/auth helpers.

## Added/updated admin endpoints this pass
- `/api/admin/migration-ledger` — record and list SQL migration status.
- `/api/admin/release-sanity` — run public page, D1, accounting, incident, and migration checks.
- `/api/admin/accounting-statement-provider-profiles` — seed/list/save statement CSV provider mappings.
- `/api/admin/accounting-statement-imports` — now returns provider profiles for the import UI.
- `/api/admin/db-sanity` — now includes critical checks and count summaries.
- `/api/admin/site-item-inventory` — normalizes movement types, returns dollar display values, and guards current stock defaults.

## Money rule
APIs should store cents in D1 and return display helpers where needed. Admin forms should accept dollars and convert to cents before saving.

## Private data rule
Do not expose raw CSV imports, Amazon order history, or accounting reports through public static files. Use authenticated admin endpoints and D1 staging tables.

## Build 125 note

Build 125 keeps Amazon order/cost data private, adds admin review/apply controls for Amazon staging rows, records inventory cost history, expands reconciliation and journal guardrails, and adds local-intent SEO pages plus `sitemap.xml`. Keep schema files and active Markdown updated on every pass.

## Build 129 admin endpoints

- `/api/admin/schema-drift-report` checks live D1 tables/columns against the current build expectations.
- `/api/admin/public-api-health` tests public JSON endpoints after deploys.
- `/api/admin/amazon-purchase-import` imports pasted Amazon CSV rows into private D1 staging.
- `/api/admin/runtime-incidents` now supports cleanup of old resolved/ignored incidents.

## Build 131 API note

New admin endpoint: `/api/admin/storefront-schema-repair`. It requires admin auth and can inspect/apply non-destructive storefront compatibility columns for `products`, `tax_classes`, and `product_seo`. Public API Health was expanded to treat `authority: "error"` as a failure and to check sitemap/robots/page HTML health.

- `/api/admin/social-post-queue` — admin review-first social post queue for job/process photos and summaries.

## Build 155 maintenance note

This Markdown file was reviewed during the Build 155 pass. The active roadmap/schema/gaps documents carry the detailed implementation notes for custom request payment links, order conversion, marketplace export packs, proof filters, and post-fulfillment prompts.

## Build 157 API note

Build 157 adds safer custom request operations across the admin and public APIs: mobile product save fallback handling, lifecycle controls for quote/payment/order/consent links, order-stage history, candle/soap product-spec fields, richer marketplace CSV preset data, payment provider readiness records, and consent-to-public-proof approval records.

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


## Build 164 — Roadmap/Gaps Pass Completed

Completed from the requested next-20 pass:

1. Added inline readiness badges beside each product row in `/admin/catalog/`.
2. Added one-click **Open blocker** shortcuts from product rows and readiness cards.
3. Added image-role quick-fix buttons from `/admin/readiness/` that apply recommended image roles through the Product Media Workflow endpoint.
4. Added recommended image-role preview before saving image rows.
5. Added click-to-set focal point editing directly on Product Media Workflow thumbnail cards.
6. Added visible “Product images and image order saved” confirmation after saving image rows.
7. Added Admin Dashboard drilldown links from readiness counters into `/admin/readiness/?filter=...`.
8. Added gift-card admin quick settings through Operations > Saved App Settings.
9. Replaced the placeholder gift-card artwork with `/assets/gift-card-art.svg`.
10. Verified gift-card checkout order-line creation is already supported by `checkout-create-order.js` through `gift_card_purchase` payloads.
11. Added marketplace image-readiness validation notes/fields before CSV export packs.
12. Added editable marketplace CSV presets for Etsy, Facebook Marketplace, Pinterest, and manual listings.
13. Added shop filters for “Ready for social” and “Missing proof image”.
14. Added `/api/admin/product-publish-qa` for post-publish QA checks covering product detail JSON, gallery, cart basics, and SEO.
15. Extended product/shop proof signals so product cards and filters can detect proof-image and social-readiness gaps.
16. Added public trust-block moderation filters by context, item kind, locality, and related product slug.
17. Added `custom_order_stage_photos` API/table for order-stage photo tracking.
18. Added candle/soap spec editing after product creation through `/api/admin/candle-soap-specs` and the Catalog Media workspace.
19. Added accountant export/evidence visibility notes for missing HST/GST evidence URLs.
20. Improved `/admin/mobile/` as a better mobile admin landing page by adding readiness, inventory operations, and missing accounting-state mount support.

### Build 164 schema/data notes

New tables or schema references added:

- `custom_order_stage_photos`
- `custom_candle_soap_product_specs`
- unique index `idx_custom_candle_soap_product_specs_product`
- marketplace export pack fields for image validation status/notes

No public page should have more than one H1; the sanity pass must keep checking this every build.

## Build 165 — Roadmap/Gaps Pass Completed

Completed this pass:

1. Restored `functions/api/admin/custom-requests.js` to the full admin custom-request workflow file and repaired the broken marketplace preset tag-splitting regex that blocked Cloudflare Pages Functions deployment.
2. Repaired dark-theme consistency for the previously light `/shop/` browse-by-collection panels, `/creations/` creation-browse panels, gift-card cards, and inventory image cards.
3. Added inline post-publish QA buttons and QA badges inside `/admin/catalog/` product rows.
4. Added `Run QA` action wiring to call `/api/admin/product-publish-qa` directly from product rows.
5. Added `Fix now` links beside each readiness blocker on `/admin/readiness/`.
6. Added visible crop rectangle guidance on product image thumbnails.
7. Added square crop/focal quick controls in Product Media Workflow.
8. Added bulk recommended image-role assignment controls in Product Media Workflow.
9. Confirmed the upload workflow keeps client-side resize/compression controls visible before upload.
10. Added admin gift-card balance lookup endpoint and UI support through the customer engagement workflow.
11. Added a direct Trust Block Moderation workspace at `/admin/trust-blocks/`.
12. Added public proof/trust-block placement guidance by page/context.
13. Added marketplace export preview workspace at `/admin/marketplace-exports/`.
14. Added `/api/admin/marketplace-export-preview` with image-readiness summaries before CSV export work.
15. Added customer-facing private order-stage photo gallery support on custom order status links.
16. Added admin prompt workflow for adding custom order-stage photo URLs.
17. Added candle/soap spec display support on public product detail pages.
18. Added safety/allergen note display for candle/soap products.
19. Added accountant evidence URL checker endpoint and Accounting page UI mount.
20. Added a compact mobile-admin “Today’s admin tasks” queue linking readiness, failed APIs, inventory, and accounting evidence work.

Validation for this pass:

- Predeploy sanity: PASS
- JavaScript syntax checks: PASS
- CSS brace check: PASS
- One-H1 sanity remains covered by the predeploy pass.
- SEO bake script: PASS, 0 pages changed because no override rows are populated.

Next 20 recommended steps:

1. Add true visual drag handles for crop rectangles, not just focal-click crop guidance.
2. Add actual browser-side image compression size reporting before upload.
3. Add R2 direct upload for order-stage photos instead of URL-only entry.
4. Add moderation approvals before order-stage photos can become public proof.
5. Add gift-card activation after confirmed paid order status.
6. Add gift-card refund/void/reissue controls.
7. Add gift-card public balance lookup with email/code verification.
8. Add marketplace CSV download from the new preview screen.
9. Add channel-specific marketplace validation rules for Etsy/Facebook/Pinterest.
10. Add trust-block placement toggles per page instead of manual context typing.
11. Add public page modules that can request trust blocks by page/context.
12. Add product-card trust/proof badges based on approved trust blocks.
13. Add customer-facing candle/soap safety accordion on product pages.
14. Add admin candle/soap batch search and batch recall notes.
15. Add accountant evidence attachment upload, not only URL checks.
16. Add failed API cards to the mobile admin queue using runtime incident data.
17. Add a Today task API that merges orders, inventory, products, requests, and accounting work.
18. Add product publish QA results persistence so badges survive reloads.
19. Add one-click “fix first image” guided workflow from the QA/readiness cards.
20. Add local SEO landing-page review queue for each major product/service category.
## Build 166 — Roadmap/Gaps Pass Completed

Completed this pass:

1. Added visual drag handles on product image crop rectangles in Product Media Workflow.
2. Added browser-side upload size reporting so image edit preview shows original size, estimated output size, and savings.
3. Added R2 direct upload support for custom order-stage photos, with URL-entry fallback preserved.
4. Added moderation fields for order-stage photos before they can become public proof.
5. Added gift-card activation handling when a connected order is confirmed paid.
6. Added admin gift-card lifecycle actions: activate paid, void, refund/reduce balance, and reissue.
7. Added public gift-card balance lookup with gift-card code plus email verification.
8. Added marketplace CSV download from the preview endpoint.
9. Added channel-specific marketplace validation rules for Etsy, Facebook Marketplace, Pinterest, and manual listings.
10. Added trust-block placement toggle storage by page/context.
11. Added public trust-block context loader module for shop, creations, gift cards, product, gallery, and about pages.
12. Added shop product-card trust/proof badges when approved trust blocks or social-ready proof signals exist.
13. Added customer-facing candle/soap safety accordion on product detail pages.
14. Added candle/soap batch/safety fields to the public detail renderer.
15. Added accounting evidence attachment upload from the evidence checker workflow.
16. Added failed API/runtime incident task cards into the mobile admin queue through the new Today Tasks API.
17. Added `/api/admin/today-tasks` to merge orders, inventory, products, custom requests, accounting, and failed API work.
18. Added persisted product publish QA results in `product_publish_qa_results` so QA badges can survive reloads.
19. Added groundwork for a one-click first-image fix workflow through crop handles, role tools, and existing readiness links.
20. Added `/admin/local-seo-review/` and `/api/admin/local-seo-review` for major category/service landing-page review.

Validation for this pass:

- Predeploy sanity: PASS
- JavaScript syntax checks: PASS
- CSS brace check: PASS
- One-H1 check: PASS
- SEO bake script: PASS, 0 pages changed because no override rows are populated.
- ZIP integrity: PASS

Schema/data notes:

- New tables: `product_publish_qa_results`, `gift_card_admin_events`, `trust_block_placements`, `local_seo_landing_page_reviews`.
- Expanded table: `custom_order_stage_photos` now supports R2 object metadata, moderation status, proof candidate status, and approval fields.
- Gift cards continue to use `gift_cards` and `gift_card_redemptions`; admin lifecycle events now write to `gift_card_admin_events`.
- Public token/private pages remain `noindex,nofollow` where applicable.

Next 20 recommended steps:

1. Add draggable crop-box preview persistence to generated R2 derivative images.
2. Add automatic image compression before upload instead of preview-only reporting.
3. Add customer-facing proof-photo consent prompts tied to uploaded order-stage photos.
4. Add admin moderation queue dedicated only to stage photos and proof candidates.
5. Add automated gift-card email delivery after paid-order activation.
6. Add gift-card redemption entry in admin checkout/order screens.
7. Add public gift-card balance lookup rate limiting and abuse logging.
8. Add marketplace CSV mapping editor for channel-specific field names.
9. Add marketplace CSV image selector so only approved image roles export.
10. Add trust-block placement UI with max item counts and filters visible on each toggle.
11. Add public trust-block sections to remaining local landing pages.
12. Add category-specific proof requirements for jewelry, candles, soap, vintage, and custom work.
13. Add candle/soap label export fields for weight, ingredients, allergens, and batch.
14. Add candle/soap batch recall workflow and customer notification queue.
15. Add accountant evidence ZIP inclusion for uploaded accounting attachments.
16. Add failed-API drilldown cards directly on the mobile dashboard.
17. Add Today task completion/ignore controls so the queue can be cleared.
18. Add product QA history panel beside Catalog product rows.
19. Add guided “fix first image” wizard that opens image role, crop, and public-use fields in order.
20. Add local SEO review scoring for title, meta, H1, internal links, and local proof wording.

## Build 167 update - dark theme, media derivatives, proof moderation, gift cards, marketplace mapping, and SEO scoring

- Repaired the `/creations/` browse panels and main-page Local maker trust block so they stay consistent with the dark Devil n Dove theme instead of using white cards with black text.
- Added product image derivative/crop preview records so focal/crop work can be queued toward real R2 derivative images.
- Added stage-photo proof moderation queue before custom order photos can become public proof.
- Added gift-card redemption endpoint for admin checkout/order workflows, plus public balance lookup attempt logging and rate limiting.
- Added marketplace CSV mapping editor and endpoint for Etsy, Facebook Marketplace, Pinterest, and manual exports.
- Added accountant evidence attachment upload/list endpoint for future accountant ZIP packaging.
- Added Today task complete/ignore persistence and mobile dashboard controls.
- Added local SEO scoring endpoint for landing-page review rows.
- Added product QA history endpoint for future catalog-side QA panels.

### Next direction
Keep moving repeated image proof, marketplace mapping, gift card, evidence, and local SEO review data into D1-backed review queues with safe JSON fallbacks, and keep public pages on one clear H1 with local wording in titles/headings.

## Build 168 — Roadmap/Gaps Pass Completed

Build 168 continues the Devil n Dove roadmap/gaps pass with real R2-backed derivative image records, marketplace image selection persistence, consent-aware stage-photo proof moderation, gift-card delivery/redemption/abuse tooling, accountant evidence attachment packaging, local SEO scoring/quick actions, catalog QA history, candle/soap labels and recall review, trust-placement counts/previews, Today task snoozing, failed API drilldowns, stronger dark-theme regression checks, and a post-deploy smoke-test checklist.

Completed Build 168 items:

1. Product image derivative records can now create an R2 derivative object/key when an R2 bucket is available; otherwise they fall back to safe query-string previews.
2. Marketplace export image selections now persist per product/channel before CSV export.
3. Stage-photo public proof approval now checks for matching public-use media consent.
4. Approved public-use stage photos now generate public-proof candidates for admin review.
5. Order admin screens now include a gift-card redemption panel for order-linked redemptions.
6. Gift-card activation/reissue actions queue email delivery records in the notification outbox.
7. Gift-card lookup abuse dashboard endpoint added for repeated failed public lookups.
8. Accountant export ZIP now includes evidence attachment URL files and attachment rows in the evidence index.
9. Local SEO review rows now show score badges.
10. Local SEO review has quick actions for title/meta review and completion.
11. Product QA history panel was added to catalog product rows.
12. Product Media Workflow now shows image derivative history beside media rows.
13. Candle/soap label CSV export endpoint and admin download action were added.
14. Candle/soap batch recall/watch dashboard endpoint and admin panel were added.
15. Trust-block placement counts were added to placement data.
16. Trust-block preview by page context was added.
17. Today tasks now support snooze, in addition to done/ignore.
18. Mobile admin Today tasks now show failed API/runtime incident drilldown details.
19. Stronger dark-theme regression checks were added for public sections.
20. `POST_DEPLOY_SMOKE_TEST.md` was added for live URL checks after deployment.

Apply `database_upgrade_current_pass.sql` after deployment so the Build 168 D1 tables/columns are available.

Next 20 recommended steps:

1. Add true pixel crop/resizing worker output for derivative images instead of metadata copy fallbacks.
2. Add visual derivative comparison before/after panels.
3. Add direct marketplace export history per channel.
4. Add marketplace image-selection bulk apply from product role order.
5. Add a dedicated public-proof candidate moderation page.
6. Add customer-visible proof consent status inside private order links.
7. Add gift-card delivery template editor.
8. Add gift-card resend delivery action.
9. Add gift-card fraud/abuse severity scoring.
10. Add binary R2 evidence file bundling when Cloudflare zip generation supports it safely.
11. Add local SEO deploy/bake actions for approved title/meta changes.
12. Add local SEO competitor phrase checklist per landing page.
13. Persist product QA panel expanded/collapsed state.
14. Add product QA issue-specific Fix buttons.
15. Add candle/soap label print layout preview.
16. Add candle/soap recall customer notification queue.
17. Add trust-block A/B placement notes and performance tracking.
18. Add Today task snooze duration selector.
19. Add live post-deploy smoke-test result storage in D1.
20. Add public-page dark-theme screenshot review checklist to `IMAGES.md`.
