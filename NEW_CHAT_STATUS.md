# New chat status — Build 159

Latest packaged state: Build 159.

Completed in this pass:

- Catalog Product Editor now shows existing saved images as thumbnail cards in the Product pictures upload area.
- Thumbnail cards support click-to-edit URL focus, remove-from-draft, Make first, and drag-to-reorder.
- The first visual card syncs to `featured_image_url`; remaining cards sync to `image_url_1` through `image_url_6`.
- Existing product load now de-duplicates the featured image from gallery URL slots.
- Product Media Workflow still manages the deeper image rows, metadata, roles, public-use status, crop history, delete row, and Save Images behavior.
- Markdown/schema handoff notes updated for the visual image manager pass.

Next recommended work:

1. Live-test `/admin/catalog/` image cards on a product with 3+ saved images.
2. Add visual crop/focal-point editing directly from the thumbnail cards.
3. Add a one-click “sync Product Editor URLs to Product Media Workflow rows” control.
4. Add dashboard counters for missing hero/front, public-use approval, alt text, and image role coverage.

# New chat status — Build 156

Latest packaged state: Build 156.

Main completed items:

- Custom candle making and custom soap making public landing pages.
- Payment-share gates before externally shareable approved custom payment links.
- Stripe/PayPal/Square/manual checkout preparation records from private payment links.
- Private customer order-status pages for converted custom-request orders.
- Marketplace CSV exports for Etsy, Facebook Marketplace, Pinterest, and manual listing review.
- Public private-token consent/review/photo response page.
- Related-product proof matching on product detail pages.
- Markdown and schema files updated for Build 156.

Next recommended work:

1. Live-check Stripe/PayPal/Square redirects in production mode.
2. Add link void/resend/expiry controls.
3. Add order-stage updates and fulfillment-photo notes.
4. Add channel-specific marketplace CSV presets.
5. Turn consent responses into reviewed public trust/product-story candidates.

# Build 154 new chat status

Current build: Build 154. Work completed: accepted quote previews -> review-needed payment-request/order drafts; editable quote line items; quote revision history; media consent records for reference uploads; accountant ZIP export; static SEO bake script/fallback; proof/gallery filters by material, process, locality, and product type.

Recommended next prompt: continue from Build 154 and convert reviewed payment-request/order drafts into real approved payment/order workflows, then add quote revision resend links and marketplace export packs.

# New Chat Status — Devil n Dove Build 153

## Current status — Build 153

Build 153 starts from the latest uploaded Build 149/152-era baseline and adds a practical customer-facing custom quote layer. Operations > Custom Requests can now create private quote preview links from request quote drafts. Customers can open `/custom-request/quote/?token=...`, review the planning quote, and accept or decline it. Acceptance/decline updates the quote share link, custom request status, quote draft status, and conversion event history. The public Custom Request form also supports optional reference image uploads after the written request is saved. Uploads are token-bound to the submitted request, image-only, limited to 8 MB each and 5 files per request, and remain private-review-only until later media consent/public-use review.

Deploy checks: apply or record `database_upgrade_current_pass.sql`, open `/custom-request/` and submit a harmless test request with and without reference images, then open `/admin/operations/` > Custom Requests, create a quote draft/deposit candidate/invoice candidate/quote preview link, copy the preview link, open the private quote preview, and test accept/decline using a test row. If R2 is not configured, confirm the written request still saves and the upload fallback message appears. Run `python3 scripts/predeploy_sanity_check.py` before packaging/deploy.

# Build 152 new chat status

Latest completed build: Build 152.

Primary changes:

- Custom Requests can now generate quote drafts, manual customer reply templates, deposit candidates, invoice candidates, job drafts, and product draft plans.
- New D1 tables: `custom_request_reply_templates` and `custom_request_payment_candidates`.
- Accounting Close Workflow can queue an HST/GST reminder into `notification_outbox`.
- Markdown and schema files were updated in the same pass.

Deploy checks after applying the build:

1. Apply or record `database_upgrade_current_pass.sql`.
2. Open `/admin/operations/` > Custom Requests.
3. Create a harmless quote draft, reply template, deposit candidate, and invoice candidate from a test request.
4. Confirm reply template copy button works.
5. Open `/admin/accounting/`, save an HST/GST reminder date, then queue a reminder.
6. Check Operations > Notifications/Notification Outbox if available.
7. Run Release Sanity and Public API Health.
8. Run `python3 scripts/predeploy_sanity_check.py .` before deploy when possible.

Next best pass: payment-request/invoice bridge, private quote preview/acceptance, R2 custom request image upload, static SEO bake, and accountant ZIP packaging.

# Current handoff — Build 151

Build 151 was based on the latest uploaded Devil n Dove build and continues the roadmap/gaps direction.

Completed this pass:

- Operations now mounts the Custom Requests panel.
- Custom Requests can now create quote drafts, job drafts, and product draft plans.
- Custom request conversion events and repeat-request/customer-history indicators were added.
- Public custom request submissions now capture UTM and visitor/session attribution.
- Visit tracking now self-heals UTM columns for sessions and page views.
- Social UTM rollups now include traffic, session, checkout-start, abandoned-cart, and custom-request conversion counts when analytics tables exist.
- HST/GST review gained remittance evidence URL and reminder date fields.
- Accounting Close Workflow can export a close-summary CSV.
- Schema files, roadmap, gaps, competitive notes, and sanity notes were updated.

Recommended next pass:

1. Build full quote/email reply templates from quote drafts.
2. Add quote acceptance/deposit/invoice candidate workflow.
3. Add R2 reference-image upload for custom requests.
4. Add static SEO override bake tooling.
5. Add accountant ZIP export packaging.

# New Chat Status — Devil n Dove Build 150

## Current status — Build 150

Build 150 starts from the latest uploaded Build 149 baseline and adds approved trust blocks, Search Console reviewed-action application, and the first consolidated accounting close workflow. Operations now includes a Testimonials / Trust Blocks panel backed by `trust_block_items`. Public trust sections try `/api/trust-blocks` first and fall back to featured reviews. Search Console action rows can be applied into `seo_page_overrides`, and public pages include a safe SEO override fallback script. Accounting now includes a Close Workflow panel for payment application, HST/GST review, month-end close readiness, and accountant export manifests.

Deploy checks: apply or record `database_upgrade_current_pass.sql`, open `/admin/operations/` and test Testimonials / Trust Blocks, Search Console Import Apply, Public API Health, and Release Sanity. Then open `/admin/accounting/`, select the current month, save a harmless close checklist note, and create a draft export manifest. Run `python3 scripts/predeploy_sanity_check.py` before packaging/deploy.

# New Chat Status — Devil n Dove Build 149

## Current status — Build 149

Build 149 starts from the latest uploaded build and closes several product/media/social/custom-request gaps. Product publish readiness and review actions now fail/warn on missing image roles, missing hero/front role, and public-use/consent blockers. Product Story Notes now show media-consent status and block approved/published status when privacy or consent is not cleared. Product Media Workflow now has simple browser-side crop/resize presets during upload. Public product detail images are filtered/grouped by image role and public-use status. Operations now includes a Custom Requests admin queue, while the public site has `/custom-request/` for engraving, personalized gifts, and workshop-made commissions. Social Posting Queue now has admin-editable caption templates and UTM campaign rollups.

Deploy checks: apply or record `database_upgrade_current_pass.sql`, open `/admin/catalog/` and test Product Media Workflow upload presets, open Product Story Notes and confirm media consent blockers appear, open `/custom-request/` and submit a harmless test request, then open `/admin/operations/` to review Custom Requests and Social Posting Queue template/UTM panels.

# New Chat Status — Devil n Dove Build 142

## Current status — Build 142

Build 142 starts from the latest uploaded build and focuses on completing the competitive direction. `COMPETITIVE.md` is now a full strategy/playbook, Operations > Competitive Roadmap tracks the highest-value opportunities in D1, Release Sanity checks the tracker, and schema/Markdown files are current. Deploy the build, apply or record `database_upgrade_current_pass.sql`, then open `/admin/operations/` and run Competitive Roadmap plus Release Sanity.

# New Chat Status — Devil n Dove Build 140

## Current status — Build 140

Build 140 starts from the latest uploaded build and adds a safer social-publishing workflow for crafting-process photos and summaries. Operations > Social Posting Queue now supports dry-run previews, schedules, per-platform captions, duplicate warnings, media warnings, and guarded API publishing. Deploy the build, apply or record `database_upgrade_current_pass.sql`, then test a harmless queued post with **Dry run** before adding or using live platform credentials.

# New Chat Status — Devil n Dove Build 139

## Current status — Build 139

Build 139 starts from the latest uploaded build and adds an approved-post social API publishing layer on top of the existing Operations > Social Posting Queue. Crafting/job photos and summaries remain review-first. Approved posts can attempt API publishing to Facebook, Instagram, X, and Pinterest when Cloudflare environment variables are configured. TikTok and YouTube remain manual/review-first until their stricter upload workflows and app approvals are configured. Deploy the build, apply or record `database_upgrade_current_pass.sql`, then test a queued post before adding any live credentials.

# New Chat Status — Devil n Dove Build 137

## Current status — Build 137

Build 137 starts from the latest uploaded build and focuses on Search Console SEO workflow safety. Operations > Search Console CSV Import now has filters, safe batch delete/revert, and private SEO opportunity actions. Generated title/meta/internal-link ideas are stored as reviewable admin tasks and do not edit public pages automatically. Deploy it, apply or record `database_upgrade_current_pass.sql`, then test with a small Search Console CSV batch.

## Current status — Build 135

Build 135 adds Media/R2 Diagnostics, Product Image Health, a product draft checklist, reusable media picker, edit-mode image upload attachment, and saved handmade/vintage/external listing fields during product updates. Deploy it, run `database_upgrade_current_pass.sql` or record the Build 135 ledger marker, then test `/admin/products/` and `/admin/operations/`.


Current output build: Build 137 Search Console filters, safe import batch revert, private SEO opportunity actions, and all prior compact mobile/product/media safeguards carried forward.

## Current status — Build 134

Build 134 fixes the admin Product editor workflow. Draft mode now only requires product name and product type. SEO title/description, price, category, images, and external links are treated as publish-readiness items instead of draft blockers. The Product editor now includes an inline image uploader that uses `/api/admin/media-upload` when R2 media storage is connected, while still allowing pasted image URLs.

`/api/admin/create-product` was rebuilt to adapt to live D1 columns, insert SEO/images only when their tables/columns are present, and always return JSON on failure. Create-product failures are logged as runtime incidents under `admin_products/create_product_failed`.

Post-deploy priority: open `/admin/products/`, create a draft with only name/type, test one pasted image URL, then test one upload if R2 media bindings are configured. If upload fails, inspect Operations > Runtime Incidents and confirm R2 public base settings.


## Current status — Build 133

Build 133 starts from the latest uploaded build and keeps the compact grouped mobile menu in place. This pass adds Operations panels for Structured Data Health, Storefront Value Backfill, and Live Sitemap Preview. It also adds admin endpoints for those checks, Search Console CSV staging tables for future SEO performance imports, Release Sanity coverage for the new checks, and predeploy sanity coverage for the new Operations assets.

After deploy, run Operations checks in this order: Storefront Schema Repair, Storefront Value Backfill, Structured Data Health, Live Sitemap Preview, Public API Health, Runtime Incidents, Migration Ledger, and Release Sanity.

## Build 130 handoff — 2026-05-15

Build 130 follows Build 129 because the live runtime incident count still increased for `/api/products`:

```text
products_primary_query_failed
products_fallback_query_failed
```

The new fix is more defensive: `/api/products` now uses only actual D1 columns from metadata/sample rows, and if both richer SQL paths fail it falls back to `SELECT * FROM products LIMIT 500` with JavaScript-side filtering. It does not log a runtime incident when a lower fallback succeeds.

Post-deploy validation:

1. Open `/api/products`.
2. Confirm `ok: true`.
3. Confirm `summary.authority` is not `error`.
4. Check Runtime Incidents and ensure the `/api/products` grouped count stops increasing.
5. Mark old `/api/products` incidents resolved after fresh requests stay clean.

## Current status — Build 131

Build 131 adds an admin Storefront Schema Repair panel and endpoint, expands Public API Health, adds Release Sanity coverage for storefront schema repair readiness, and adds a local `scripts/predeploy_sanity_check.py` privacy/SEO/CSS/link check. This pass is focused on fixing the root cause behind repeated `/api/products` fallback incidents by making the live D1 product/tax/SEO schema repairable from admin, not just making the public endpoint survive schema drift.

After deploy: open `/admin/operations/`, run Storefront Schema Repair inspect/apply if needed, then run Public API Health and Release Sanity. Only mark old `/api/products` runtime incidents resolved after the count stops increasing.

## Current status — Build 132

Build 132 focuses on mobile usability. The shared main menu now opens as a compact grouped drawer instead of a long flat list. The pass also hardens mobile drawer sizing, close/focus behavior, admin department shortcut layout on phones, and the local predeploy sanity script. No D1 structural migration is required; `database_upgrade_current_pass.sql` includes a Build 132 ledger marker.

Post-deploy priority: test the main menu on a real phone, then run Operations > Public API Health and Release Sanity.

## Build 136 status — 2026-05-18

- Added Operations > Search Console CSV Import.
- Added `/api/admin/search-console-import` for private D1 staging of Search Console CSV exports.
- Added top-page and SEO-opportunity summaries for manual title/meta/internal-link review.
- Added Release Sanity coverage and current-pass SQL table/index self-healing for the Search Console staging tables.
- Keep Search Console CSV exports private; do not store them in public `/data/`.

Next deployment checks: apply/record `database_upgrade_current_pass.sql`, open `/admin/operations/`, import a tiny Search Console CSV sample, then run Release Sanity and Public API Health.


## Build 138 status

Build 138 adds the Social Posting Queue in Operations. It can queue job/process photos, create captions, target Facebook/Instagram/TikTok/X/YouTube/Pinterest, copy captions for manual publishing, and record public post URLs after publishing. It intentionally does not auto-post yet because platform OAuth/app approvals and secret storage need to be configured safely first.


## Latest status — Build 141

Latest packaged pass: Build 141, focused on social content planning and safer review-first publishing.

Carry-forward notes for the next chat:
- Use the latest ZIP as the base.
- Social Posting Queue now supports reusable caption templates, template preview, content pillars, calls to action, UTM links, dry run, scheduling, duplicate warnings, and API attempts only when credentials exist.
- Recommended deploy checks: run `database_upgrade_current_pass.sql`, open `/admin/operations/`, then test Social Posting Queue, Release Sanity, Runtime Incidents, and Public API Health.
- Next high-value work: admin-editable caption templates, product-story draft helpers, social analytics rollups, job/customer media privacy guards, payment application, HST review, period close, and accountant export.


## Build 143 — Social Media Privacy Guard + Competitive Execution

Completed in this pass:

1. Added Operations > Social Media Privacy Guard.
2. Added `/api/admin/social-media-privacy-guard`.
3. Added `social_media_privacy_rules` and `social_post_privacy_reviews` schema support.
4. Added default rules for customer/private identifiers, workshop background leaks, product-only media, personal wording review, and visible children/visitors.
5. Added privacy columns to `social_post_queue` through runtime-safe self-healing.
6. Blocked API publishing from Social Posting Queue until the queued post is privacy-approved or marked no-private-media.
7. Added Release Sanity checks for the Social Media Privacy Guard endpoint and open posts needing privacy review.
8. Expanded `COMPETITIVE.md` with competitive execution details, product-page direction, social calendar, trust/privacy posture, marketplace direction, accounting/margin priorities, and immediate/next/later implementation waves.
9. Expanded `data/site/competitive-opportunities.json` with social privacy, product story, and local trust block opportunities.
10. Updated schema files and active Markdown handoff docs.

Next strongest directions:

1. Render product-story blocks publicly on product detail pages.
2. Add a reusable local trust block to Home, About, Shop, Contact, product, and local pages.
3. Add “post this product” from Product editor into Social Posting Queue.
4. Add admin-editable caption templates.
5. Add social analytics rollups from UTM links and manual/API post URLs.
6. Add product media role checklist: main/detail/scale/process/packaging/video.
7. Add customer media consent records for job/customer-specific posts.
8. Add testimonials/review approval workflow.
9. Add marketplace export readiness checks.
10. Continue payment application, HST review, period close, and accountant export packaging.

## Build 144 status handoff

Latest build direction: product storytelling and competitive execution.

New in this pass:
- Public product detail pages now include **The story behind this piece**.
- Added `product_story_public_notes` schema support for future approved story copy.
- Added reusable Southern Ontario trust content through `data/site/local-trust.json` and `/public/js/local-trust-block.js`.
- Homepage and product pages now render the local trust block.
- Admin product rows now have **Post this product**, which queues a draft social post through the existing Social Posting Queue.
- Social posting remains review-first and privacy-gated.

Immediate deployment checks:
1. Apply/record `database_upgrade_current_pass.sql`.
2. Open `/shop/product/?slug=...` and confirm the story/trust blocks render.
3. Open `/admin/products/`, click **Post this product** on a harmless draft/test product, then review it in `/admin/operations/` → Social Posting Queue.
4. Run Release Sanity, Public API Health, Runtime Incidents, and Social Media Privacy Guard.

## Build 146 handoff status

Current build direction: product capture and product storytelling.

Recently completed:

- Mobile product draft save fix for missing `normalizeColorNames`.
- Desktop product autosave and seven-image capture carried forward.
- Admin Product Story Notes editor added.
- Product-story API added at `/api/admin/product-story-notes`.
- Story notes now support public display status and privacy status.
- `COMPETITIVE.md`, `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`, schema files, and sanity notes updated.

After deployment, check:

1. `/admin/mobile-product/` draft save.
2. `/admin/products/` autosave with name/type only.
3. Upload/select multiple product images, up to seven total product images.
4. Product Story Notes panel loads in `/admin/products/`.
5. Seed one draft story from an existing product.
6. Approve/publish only a public-safe story note.
7. Runtime incidents for `admin_mobile_product` and `admin_products` stay quiet.



## Build 147 status note

Current build direction: shop story snippets, product-image review helpers, Product editor social shortcut, and media-consent registry are now implemented.

Important files added/changed:

- `functions/api/products.js`
- `public/js/shop.js`
- `public/js/admin-create-product.js`
- `functions/api/admin/media-consent-records.js`
- `public/js/admin-media-consent-records.js`
- `admin/operations/index.html`
- `admin/products/index.html`
- `css/styles.css`
- `data/site/competitive-opportunities.json`
- `database_upgrade_current_pass.sql`
- `database_full_schema.sql`
- `database_store_schema.sql`
- `database_growth_analytics_seo_extension.sql`

Deployment checks should focus on `/api/products`, `/shop/`, `/admin/products/`, and `/admin/operations/`.


## Build 148 Status

Build 148 adds role-aware product media management and consent-linked social privacy. Use `/admin/products/` → Product Media Workflow to drag/drop order images, apply recommended roles, set public-use status, and reference a Media Consent Record ID where needed. Use `/admin/operations/` → Social Media Privacy Guard to verify consent matches before approving social posts with private/customer media.

## Build 155 handoff status

Completed in this pass:

- Approved private payment review links from reviewed custom payment-request drafts.
- Real draft/pending orders from reviewed custom order drafts.
- Quote revision/version links.
- Marketplace export copy packs.
- Shop/product API proof filters for material, process, and locality.
- Post-fulfillment review/photo/consent prompt drafts.

Next pass should focus on real payment provider checkout, order status/customer view pages, marketplace CSV exports, and consent-response capture.

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

