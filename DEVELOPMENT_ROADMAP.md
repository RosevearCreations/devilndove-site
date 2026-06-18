# Development Roadmap — Current Build 190

> **Canonical direction:** Read `PROJECT_STATUS_AND_ROADMAP.md` first. The full historical roadmap through Build 189 is preserved at `docs/archive/DEVELOPMENT_ROADMAP_HISTORY_THROUGH_BUILD189.md`.

## Build 190 completed — 20 value-added steps

1. Added saved Admin Command Center views for Owner, Product, SEO, Customers, Visuals, Accounting, and Deploy work.
2. Added an Auth + Environment Health panel that reports whether required/recommended Cloudflare bindings and environment values are configured without exposing their values.
3. Added conversion funnel date filters for 7, 30, 90, and 365 days.
4. Added conversion funnel source/referrer/UTM filtering.
5. Added explicit “missing real photo” warnings to product readiness/value operations.
6. Added low-stock warnings beside product readiness and margin rows.
7. Added live product price/cost/estimated-fee/margin cards.
8. Added marketplace export review-required status when estimated cost/margin is missing or too low.
9. Added unified customer/member timeline cards combining orders, custom requests, gift cards, reviews, and guarded cart recovery.
10. Added a media-publication review queue for consent, public use, compression, alt text, and performance status.
11. Added customer-story approval batch schema and guarded approval workflow groundwork.
12. Added Search Console opportunity-action rows for title/meta, internal-link, and image-proof work.
13. Added Google Business Profile monthly observation rows and admin entry forms.
14. Added public product-detail visual proof placeholders for process, scale, materials, and care without adding another H1.
15. Added performance/status badges beside visual publication candidates.
16. Added a static image-compression report and optimized WebP display variants for large shared assets.
17. Added guarded cart-recovery review rows that never send automatically.
18. Added a seasonal campaign planner for gift moments, holidays, local markets, and pickup periods.
19. Retired duplicate Markdown sprawl into two canonical files plus archived history and a Markdown index.
20. Added mobile/desktop CSS overlap fixes, touch-friendly admin controls, responsive timeline cards, and responsive product-proof modules.

## Next 20 recommended steps after Build 190

1. Upload the first approved real workshop/product images and replace homepage/shop placeholders through the review queue.
2. Connect real per-channel marketplace fee rules instead of the temporary estimated fee percentage.
3. Add a cost-default editor by product family for materials, labour, packaging, overhead, and expected waste.
4. Block marketplace CSV downloads when a product has negative/unknown margin unless an approved override exists.
5. Add customer timeline search by email, order number, gift-card code suffix, and custom-request key.
6. Add a customer-story wizard that drafts a product story, trust block, gallery caption, and social snippet from one approved source.
7. Add public-use consent evidence links directly inside the story-approval cards.
8. Add a real Search Console CSV upload preview that maps query/page/date/click/impression/position columns before import.
9. Add Google Business Profile photo/post/review activity reminders with monthly completion checks.
10. Add review-request eligibility rules based on fulfilled/paid orders, cooldown, permission, and exclusions.
11. Add a public before/after maker gallery driven only by approved media and consent records.
12. Add product scale/material/care image-role prompts to phone quick-add and desktop product editor.
13. Add browser-to-D1 mobile autosave sync rather than browser-only draft recovery.
14. Add customer/member timeline notes with role-based visibility and audit history.
15. Add performance measurements from deployed pages using Lighthouse/PageSpeed imports or Cloudflare Web Analytics exports.
16. Add automatic responsive image derivatives and `srcset` generation for approved public media.
17. Replace oversized original legacy assets after confirming no external links rely on them.
18. Add campaign-specific landing-page checklists for inventory, pickup timing, SEO, photos, and social scheduling.
19. Add a single “Owner Daily” print/export summary from Command Center.
20. Perform a real-device mobile QA pass and attach screenshots for checkout, product add, command center, members, and local SEO.

## Roadmap rule

New work should improve one of these outcomes: customer trust, product publish readiness, conversion measurement, local discoverability, mobile usability, margin visibility, safer operations, or reduced admin complexity. Avoid adding a new admin page when an existing Command Center, Members, Local SEO, Product, Visual, or Operations surface can hold the workflow.
