# Local SEO Playbook — Devil n Dove

Current sync: 2026-05-14 — Build 125.

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
