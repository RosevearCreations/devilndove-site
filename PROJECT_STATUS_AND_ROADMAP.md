# Devil n Dove Project Status and Roadmap — Build 189

This is now the primary human-readable project file. Start here before reading the longer historical Markdown files.

## Current application position

Devil n Dove is now a broad small-business platform for handmade, workshop-made, custom, gift-card, vintage/collectible, media, accounting, SEO, release-control, and visual-proof workflows. The strongest value is no longer adding isolated admin screens. The strongest value is making the existing system easier to operate, easier to trust, easier to publish from, and easier to measure.

## Primary admin entry points

- `/admin/command-center/` — daily operating dashboard.
- `/admin/markdown-sanity/` — documentation consolidation and value-backlog sanity.
- `/admin/application-sanity/` — broad application status and risk review.
- `/admin/visual-enrichment-studio/` — approved media, placeholders, screenshots, alt text, and visual polish planning.
- `/admin/deployment-preflight/`, `/admin/deploy-readiness/`, `/admin/promotion-control/`, `/admin/go-live-execution/` — release safety chain.

## SEO direction

Keep one clear H1 on each exposed page. Keep titles, meta descriptions, headings, internal links, body copy, image alt text, and structured data aligned with what customers actually search for. Local pages should keep Southern Ontario/Ontario wording natural and useful, with proof images, trust blocks, product examples, and real business information. Local ranking still depends on relevance, distance, and prominence; code improves relevance and clarity, but reviews, photos, GBP activity, links, and customer trust are also needed.

## Build 189 completed

1. Added `/admin/markdown-sanity/` and `/api/admin/markdown-sanity`.
2. Created two primary Markdown files: `PROJECT_STATUS_AND_ROADMAP.md` and `AI_HANDOFF.md`.
3. Reclassified the existing Markdown files as supporting references rather than deleting them.
4. Added `database_build186_markdown_consolidation_visual_placeholders.sql`.
5. Added visual placeholder SVG assets for workshop, product detail, before/after, jewelry, candle, soap, engraving, and vintage condition slots.
6. Added public visual placeholder injection on key storefront/local pages without changing H1 tags.
7. Added desktop/mobile placeholder CSS with reduced-motion and low-bandwidth compatibility.
8. Added value-enhancement execution rows for the top business priorities.
9. Added Markdown file sanity rows, CSS drift rows, desktop/mobile surface rows, and next-step sanity rows.
10. Updated schema, release, sanity, image, local SEO, roadmap, gaps, README, and AI handoff files.

## Next 20 recommended steps

1. Connect real live counts into Admin Command Center cards.
2. Add more safe Product QA apply buttons, limited to low-risk fields.
3. Replace Build 189 visual placeholders with approved compressed media.
4. Add a customer story wizard for trust blocks, product stories, and social snippets.
5. Add mobile product autosave with recovery after failed upload/network loss.
6. Connect conversion funnel events from page view to order.
7. Add Google Business Profile observation logging to Local SEO Review.
8. Add unified customer/member timeline cards.
9. Add product costing margin cards tied to supplies/tools and marketplace fees.
10. Import measured page performance budgets.
11. Add guarded image-slot publish controls for selected public pages.
12. Generate visual diff thumbnails from screenshot pairs.
13. Add Search Console landing-page trend deltas.
14. Add public proof placement testing and preview comparison.
15. Add review request workflow with local/service/product tags.
16. Add bundle/gift-set builder for seasonal handmade and vintage combinations.
17. Add marketplace listing health cards by channel.
18. Add low-stock warnings directly into product readiness.
19. Add abandoned-cart recovery notes and gift-card reminder opportunities.
20. Add seasonal campaign planner for local markets, holidays, and gift moments.

## Markdown consolidation rule

Use this file for the current roadmap and business direction. Use `AI_HANDOFF.md` for new chat handoff and exact migration order. Keep old Markdown files for details/history until a later cleanup can safely archive them.


## Build 187 operational note — Cloudflare variables and login route

The live login 405 indicates either route-method handling or deployment binding/routing drift. Build 187 hardens the route and documents the real Cloudflare binding/secret checklist. The top priority before adding more storefront features is confirming `DB` is bound to the D1 database in Cloudflare Pages and that product media R2 binding/public URL variables are present.

Next value-added step: add an Auth + Environment Health card to `/admin/command-center/` showing DB binding, auth route status, bootstrap status, session table status, media bucket status, and missing optional provider secrets.


## Build 189 — Value Ops live counts, funnel events, mobile recovery, and visual replacement plan

Completed in this pass:

1. Added the missing `/api/admin/command-center` endpoint so the Admin Command Center can load real live counts instead of being only a static page.
2. Connected live Product Readiness counts from products/product images/product gaps into the Command Center.
3. Added live conversion funnel rollups: landing page view → product view → add to cart → checkout start → order.
4. Added explicit public funnel events for product detail views, add-to-cart actions, checkout starts, and order creation.
5. Added mobile product browser autosave/recovery so phone-entered draft text survives refresh/session/upload failures.
6. Added visual placeholder bands to high-value public pages without adding extra H1 tags.
7. Added visual replacement candidate rows so placeholders can be replaced only after public-use/consent/compression review.
8. Added local SEO observation rows to pair Search Console data with Google Business Profile/manual ranking notes.
9. Added product cost/margin review rows for product pricing and marketplace-profit review.
10. Updated schema files, release notes, sanity notes, handoff docs, and static Build 189 report.

Next 20 recommended steps after Build 189:

1. Replace placeholder graphics with approved real compressed photos, starting with homepage, shop, custom gifts, jewelry, and gallery.
2. Import the first Search Console export and connect real clicks/impressions to Local SEO scorecards.
3. Add manual Google Business Profile observation notes monthly for important pages and products.
4. Add product material/labour/package cost defaults for major product families.
5. Add customer/member timeline cards that combine orders, custom requests, gift cards, recalls, proof approvals, and notes.
6. Add a phone-tested Mobile Quick Add recovery checklist with screenshots from a real device.
7. Connect approved customer stories directly into product cards and local landing trust blocks.
8. Add a product margin warning before marketplace export when estimated margin is too low.
9. Add a simple dashboard for real media waiting on consent/public-use review.
10. Add product-detail visual proof modules that show process, scale, material, and care notes.
11. Add admin command-center saved views for Owner, Product, SEO, Accounting, and Deploy mode.
12. Add a low-bandwidth preview toggle to more public pages.
13. Add image compression reports for all public placeholder replacement candidates.
14. Add “missing real photo” badges on Product Readiness rows.
15. Add conversion funnel date filters and source/UTM filters.
16. Add cart recovery/customer follow-up review rows before emailing anyone.
17. Add Search Console opportunity buttons that create title/meta/internal-link actions.
18. Add a customer story approval screen grouped by source product/order/custom request.
19. Add performance-budget badges directly beside visual placeholder candidates.
20. Retire or archive duplicate Markdown once `PROJECT_STATUS_AND_ROADMAP.md` and `AI_HANDOFF.md` stay complete for two more build passes.

