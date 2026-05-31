# Build 159 note

Catalog Product Editor image UX was repaired: existing saved images now appear as draggable thumbnail cards in Product pictures, the first card syncs to the featured image, gallery URL slots are de-duplicated from the featured image, and advanced media metadata remains in Product Media Workflow. No schema migration required for this front-end pass.

# Build 156 local SEO update

Build 156 adds two locally relevant service pages: Custom Candle Making in Southern Ontario and Custom Soap Making in Southern Ontario. Both use one clear H1, direct custom-work wording, and links into the Custom Request intake. Keep expanding pages this way: one page per real service, honest local wording, proof photos, useful alt text, and clear next steps.

SEO habits for the next pass:

- Add candle/soap photos with descriptive filenames and alt text once real examples are ready.
- Keep private quote, payment, order-status, and consent pages `noindex,nofollow`.
- Use approved consent responses to build public proof blocks only after admin review.
- Keep product proof metadata clean so related-product matching improves internal linking.
- Bake reviewed SEO overrides into static HTML before deploy whenever Search Console rows have been approved.

# Build 154 local SEO update

Build 154 keeps the local SEO habit moving forward by adding static SEO override baking and better public proof filters. The gallery can now help visitors find examples by material, process, locality, and product type, which supports locally relevant browsing for custom gifts, handmade jewelry, engraving, vintage finds, and workshop-made items in Southern Ontario. Reviewed Search Console title/meta/internal-link actions can now be exported into `data/site/seo-page-overrides.json` and baked into static HTML before deploy.

# Build 153 local SEO note

The custom request flow now supports a stronger local-service path: Southern Ontario visitors can submit custom gift, engraving, jewelry, sublimation, and workshop requests, upload private reference images, and receive a private quote preview. Continue using customer-search wording in titles/headings while keeping one clear H1 per public page and avoiding indexing private quote-token pages.

# Build 152 local SEO update

Build 152 supports local search indirectly by making custom-gift follow-up faster and more measurable. Custom requests from Southern Ontario landing pages can now become quote drafts, manual reply templates, and deposit/invoice candidates without losing the original request or UTM campaign source.

Ongoing local SEO habits:

- Keep one clear H1 per exposed public page.
- Keep titles and main headings written in words real buyers would search for.
- Keep local wording natural: Southern Ontario, Tillsonburg, Oxford County, Norfolk County, custom handmade gifts, polymer clay earrings, laser engraving, personalized gifts, vintage finds.
- Keep trust/proof blocks tied to approved public-safe content only.
- Bake approved SEO overrides into static HTML in a future pass so title/meta improvements are not only client-side.

# Build 151 local SEO and measurement note

This pass keeps the local SEO direction intact while improving measurement. Public pages should continue using words real buyers search for in clear titles, main headings, alt text, and internal links. Custom request submissions now capture UTM source/medium/campaign values, so future social and local campaign tests can be reviewed by actual request and checkout-start behaviour instead of only post counts.

Next SEO move: add a deploy-time static baking step for reviewed `seo_page_overrides`, because client-side title/meta fallback is useful for users but static HTML remains the cleaner crawler-facing signal.

# Build 150 local SEO workflow note

Search Console actions are still review-first, but Build 150 adds an apply path: approved title/meta/internal-link suggestions can now be saved to `seo_page_overrides` and used by public fallback code. Keep using natural Southern Ontario wording only where it matches page intent. For the strongest SEO signal, later deploy passes should bake approved overrides into each static page title, meta description, and visible internal-link copy instead of relying only on JavaScript fallback.

# Local SEO Playbook — Devil n Dove

## Build 140 social-local SEO note

Use the Social Posting Queue dry-run preview to check captions before publishing. Keep local wording natural: Southern Ontario, handmade gifts, polymer clay earrings, laser engraving, vintage finds, and workshop-made process notes should be used only where they honestly fit the post and linked page.


## Build 139 social-local SEO note

Crafting-process social posts should use natural local wording where it fits: handmade in Southern Ontario, workshop-made gifts, polymer clay earrings, laser engraving, vintage finds, and Devil n Dove behind-the-scenes work. Do not stuff keywords. Use clear captions, useful photos, and links back to the most relevant page.

# Local SEO Playbook

## Build 137 Search Console workflow

Use Search Console CSV imports as evidence, not automatic copy. Filter by page, query, country, device, date range, impressions, and position. Generate private SEO actions for promising page/query pairs, then manually compare the page intent, title, meta description, H1, and internal links before publishing changes. Keep one clear H1 and locally useful Southern Ontario wording where it genuinely matches the page.

## Build 135 SEO workflow note

Product images now have stronger admin checks for featured image coverage and alt text. Keep product titles, H1/page titles, descriptions, and image alt text clear and locally useful where relevant, without adding multiple H1 headings.


Current sync: 2026-05-18 — Build 137 Search Console filtering, safe batch revert, and private SEO opportunity action queue.

## What Build 125 added
Six local-intent landing pages were added:
- `/handmade-jewelry-ontario/`
- `/polymer-clay-earrings-ontario/`
- `/custom-gifts-southern-ontario/`
- `/laser-engraving-ontario/`
- `/vintage-finds-ontario/`
- `/workshop-made-gifts-ontario/`

A `sitemap.xml` was added and the shared footer now links to these local pages.

## Current SEO rules for every pass
- Keep exactly one H1 per exposed page.
- Use plain words people search for in titles, main headings, body copy, and internal links.
- Keep titles and meta descriptions unique and useful.
- Avoid keyword stuffing.
- Keep local wording natural: Southern Ontario, Ontario, handmade jewelry, polymer clay earrings, custom gifts, laser engraving, vintage finds, workshop-made gifts.
- Support relevance and prominence with clear pages, internal links, real product/gallery examples, and review/social proof.

## Next SEO improvements
1. Add real product/gallery blocks to each local-intent page.
2. Add internal links from relevant product, gallery, and creation pages back to the local pages.
3. Add Search Console tracking fields/screens for page, query, clicks, impressions, CTR, and average position.
4. Add Product and BreadcrumbList structured data where specific sellable products are shown.
5. Add local pickup/shipping explanation blocks to local-intent pages.

## Build 126 SEO continuity note

No public SEO page structure was changed in this hotfix. Continue the one-H1-per-public-page rule, clear local-intent titles/meta, and local wording that supports relevance and prominence signals.

## Build 128 note

No new local SEO pages were added in Build 128. The pass focused on keeping public product/shop APIs available so local landing pages and internal shop links do not lead to empty/broken product results during D1 schema drift.


## Build 129 SEO pass note

Continue using one clear H1 per exposed page, local wording in titles/headings/body copy, and internal links from relevant public pages to local-intent landing pages. Do not keyword-stuff; keep wording useful for real customers in Ontario/Southern Ontario.

## Build 130 SEO note

The catalog API hotfix is also an SEO protection step: public product, gallery, and creation pages should return usable content rather than safe empty/error results when D1 schema drift exists. Continue one clear H1 per public page and clear local wording in titles/headings.

## Build 131 SEO/runtime alignment

The SEO habit remains: one clear H1, focused title/meta, and natural local wording. Build 131 connects that SEO goal to runtime health by checking public APIs, sitemap, robots.txt, and storefront schema drift from Operations. If product schema drift forces the shop into fallback mode, fix the schema first so filters, origins, channels, and product detail data are available for both users and search engines.

## Build 132 local SEO and mobile UX note

The mobile menu now groups the main site sections so local shoppers can reach Shop, Search, Cart, local landing pages, tools, supplies, and contact paths without scrolling through a long flat list. This supports local discovery by keeping important search words and local-intent pages reachable from the shared navigation while preserving one clear H1 per page.

## Build 133 local SEO operations

Build 133 adds an admin Structured Data Health check and Live Sitemap Preview. Use these after each deploy so local pages keep clear titles/headings, readable structured data, and live product URLs in the sitemap workflow. Search Console staging tables were added so future passes can import real query/page performance instead of guessing which Ontario/local phrases are working.


## Build 134 note

This pass fixes the Product editor draft workflow: drafts require only name/type, image upload is available from the editor when R2 media storage is configured, create-product failures return JSON instead of HTML 500 pages, and the create endpoint adapts to live D1 product/media/SEO columns.

## Build 136 status — 2026-05-18

- Added Operations > Search Console CSV Import.
- Added `/api/admin/search-console-import` for private D1 staging of Search Console CSV exports.
- Added top-page and SEO-opportunity summaries for manual title/meta/internal-link review.
- Added Release Sanity coverage and current-pass SQL table/index self-healing for the Search Console staging tables.
- Keep Search Console CSV exports private; do not store them in public `/data/`.

Next deployment checks: apply/record `database_upgrade_current_pass.sql`, open `/admin/operations/`, import a tiny Search Console CSV sample, then run Release Sanity and Public API Health.


## Build 138 social content SEO/local note

Job/process social posts should reuse local phrases naturally: Southern Ontario handmade gifts, Ontario workshop-made jewelry, polymer clay earrings, laser engraving, vintage finds, and behind-the-scenes Devil n Dove workshop stories. Queue posts first, review them, then publish manually until platform API credentials are fully configured.


## Build 141 local/social SEO note

Use Social Posting Queue templates to keep posts locally relevant without keyword stuffing. Local updates should naturally mention Devil n Dove, Southern Ontario, Tillsonburg/Oxford County when relevant, the handmade/custom/vintage nature of the item, and a clear next step. UTM-tagged links help separate Facebook/Instagram/TikTok/X/Pinterest traffic from direct search traffic later.


## Build 142 update — Competitive roadmap completed and tracked

- Completed `COMPETITIVE.md` as the active competitive strategy for Devil n Dove, covering positioning, homepage/product-page improvements, mobile UX, local SEO, social workflow, marketplace readiness, product media, trust, and accounting/margin direction.
- Added Operations > Competitive Roadmap so the highest-value items from the document can be seeded into D1, assigned a status, and reviewed during Release Sanity.
- Added `competitive_opportunities` and `competitive_opportunity_events` schema support.
- Added `/data/site/competitive-opportunities.json` as a public-safe roadmap seed file; it contains strategy/action metadata only and no private costs, orders, or customer data.
- Next direction: connect competitive opportunities to product readiness, SEO action completion, social analytics, testimonials, custom requests, and marketplace export checks.


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

## Build 144 note

Build 144 adds public product storytelling, a reusable Southern Ontario trust block, and a Product editor shortcut that queues product-based social posts for review. Keep social posting privacy-gated and keep public `/data/` files free of private costs, orders, customer records, and credentials.

## Build 146 local SEO note

Product story notes should reinforce local relevance naturally without keyword stuffing. Good story copy can mention Southern Ontario, local pickup/shipping context, workshop-made details, handmade materials, vintage/collectible condition, and custom gift use cases when true.

Rules:

- Keep one clear page H1.
- Keep titles and meta descriptions clear and product-specific.
- Do not publish private customer/job details.
- Use local wording only where it truthfully helps the customer understand the product or buying process.



## Build 147 local SEO note

Approved product story snippets now help shop cards include more human, local, and material/context language. Keep snippets natural: mention Southern Ontario, Tillsonburg, handmade, vintage, workshop-made, or custom work only where it genuinely fits the product.


## Build 148 Local SEO Direction

Approved product story snippets now support internal discovery. Continue writing product stories with real material/process/local terms people search for, while keeping one clear H1 per page and avoiding private customer or workshop-background details in public media.

## Build 155 SEO/local search notes

- Shop/product APIs now expose proof filters for material, process, and locality. These fields support natural phrases shoppers may use, such as handmade jewelry, polymer clay earrings, engraved gifts, local pickup, Southern Ontario workshop, vintage finds, and custom gifts.
- Marketplace export packs should reuse clear titles, concise descriptions, local context, material/process wording, and one main selling point per listing.
- Payment/revision/private quote pages remain `noindex` because they are customer-specific and should not compete with public product/category pages.

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
