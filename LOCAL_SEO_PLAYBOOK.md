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

