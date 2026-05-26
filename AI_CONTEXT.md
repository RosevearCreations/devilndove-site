# Build 151 AI context update

The latest build pass adds Custom Request conversion and campaign attribution improvements. Important implementation notes:

- Operations now actually mounts the Custom Requests admin panel.
- `/api/admin/custom-requests` now creates internal planning records in `custom_request_quote_drafts`, `custom_request_job_drafts`, and `custom_request_product_drafts` instead of only updating request status.
- `/api/custom-request` now captures UTM fields plus visitor/session tokens from `DDAnalytics`.
- `/api/track/visit` now self-heals UTM columns on visitor sessions and page views and records campaign values.
- `/api/admin/social-post-queue` now joins UTM queue rows to traffic/session/custom-request conversion counts when those analytics tables exist.
- Accounting close workflow can emit a CSV through `/api/admin/accounting-close-workflow?period_month=YYYY-MM&format=csv`.

Continue keeping docs/schema files current in every pass and preserve one H1 per public page.

# Build 150 AI context

Build 150 starts from the Build 149 media/custom/social baseline and adds the next workflow layer:

- Operations now has an approved testimonial/local trust block workflow backed by D1 (`trust_block_items`).
- Public trust/testimonial blocks try `/api/trust-blocks` first and fall back to featured product reviews if no trust rows are approved yet.
- Search Console opportunity actions can now be applied into `seo_page_overrides` for reviewed title/meta/internal-link fallback use.
- Public pages load `/public/js/seo-page-overrides.js` so approved override records can enhance title/meta/internal-link notes without breaking pages when D1 is empty.
- Accounting now has a Close Workflow panel for payment application, HST/GST review, month-end close readiness, and accountant export manifest packaging.
- Release Sanity and Public API Health now check the new trust, SEO override, and accounting close tables/endpoints.

Next priorities: custom request -> quote/job/product draft conversion, visitor/session conversion joins for social UTM rollups, static-build baking of approved SEO overrides, and downloadable accountant export bundles.

# Build 149 AI context

The latest pass focused on the outstanding sanity-check list for Devil n Dove:

- Product readiness/review now checks missing image roles, hero/front role, and blocked/consent-needed public-use status.
- Product Story Notes now depend on story privacy status plus product media consent summaries before approved/published states are allowed.
- Product Media Workflow now includes simple browser-side crop/resize upload presets.
- Public product detail image output is role-aware and filters blocked/consent-needed media.
- Public `/custom-request/` plus Operations > Custom Requests now capture/review custom engraving, personalized gift, jewelry, sublimation, and workshop-made requests.
- Social Posting Queue caption templates are admin-editable and UTM campaign rollups are visible.

When continuing, prioritize testimonial/local trust workflow, custom request -> quote/job/product draft conversion, Search Console reviewed-action application, and the accounting close/export work.

# AI Context — Devil n Dove

## Build 140 working context

The current build adds safer social publishing controls: dry-run platform payload previews, scheduled post blocking, per-platform caption variants, duplicate/repost guardrails, media warnings, and social Release Sanity checks. Keep social API secrets in Cloudflare environment variables only. Never store tokens in D1, Markdown, JSON, or public assets.


## Build 139 working context

The current build adds approved social API publishing attempts to Operations > Social Posting Queue. Keep all credentials in Cloudflare environment variables only. Do not place platform tokens in D1, JSON files, Markdown, or public assets. Facebook/Instagram/X/Pinterest are API-attempt capable when configured; TikTok/YouTube remain manual/review-first until their upload workflows are explicitly built.

Build 137 extends the Search Console workflow. The current admin flow is: import Search Console CSV privately, filter page/query opportunities, optionally delete/revert a bad import batch, then generate private `seo_opportunity_actions` for human-reviewed title/meta/internal-link tasks. Nothing edits public SEO copy automatically. Keep one H1 per exposed page, maintain local Ontario wording where relevant, and keep private CSV/order/import files out of public `/data/`.

## Build 135 AI handoff

The latest pass focuses on product media workflow: R2/media diagnostics, product image health, draft checklist, reusable image library, edit-mode upload attachment, and update-product persistence for origin/channel/external listing fields. Continue to treat uploaded Amazon/order files as private and keep public `/data/` free of order details.


Current sync: 2026-05-18 — Build 137 Search Console filtering, safe batch revert, and private SEO opportunity action queue.

Devil n Dove is a Southern Ontario maker/storefront project with handmade jewelry, polymer clay, resin, laser engraving, sublimation, workshop tools/supplies, vintage/collectible finds, and admin/accounting workflows.

## Current technical direction
- Cloudflare Pages + Pages Functions.
- Cloudflare D1 as the long-term operational database.
- JSON is still used as seed/fallback/static bridge data, but DB-first workflows are preferred for inventory, catalog, accounting, and admin-managed content.
- Money is stored as cents in D1 and displayed as dollars in admin UI.
- Tools and supplies currently owned by the shop default to at least one stock unit.
- Consumables use package math: one stock package can contain many usage units.

## Build 125 focus
- Amazon purchase review/apply workflow for private staging rows.
- Inventory unit-cost history.
- Reconciliation exception queue actions.
- Journal validation/posting guardrails.
- Local-intent SEO pages and sitemap.

## Strong guardrails
- Do not deploy raw Amazon order reports publicly.
- Update Markdown and schema files each pass.
- Keep one H1 per exposed HTML page.
- Prefer D1 for authoritative operational data.
- Keep robust fallbacks and admin-visible error states.

## Build 126 AI context

The current hotfix focus is runtime incident visibility. The app now has a visible admin Runtime Incidents panel, grouped `/api/admin/runtime-incidents` output, review status fields, and Release Sanity excludes resolved/ignored error or critical incidents from the 7-day warning.


## Build 127 context

The latest hotfix addresses `/api/products` runtime incidents. Do not assume D1 optional columns exist in public endpoints. Build SQL from `PRAGMA table_info` results when referencing optional product/tax/SEO fields. In D1/SQLite, a missing column inside `COALESCE()` still breaks the query.

## Build 128 context

The latest hotfix target is the public product API schema drift. Build 127 still produced a live `/api/products` error for `p.merchandise_origin`. Build 128 fixes this by verifying optional columns with `SELECT column FROM table LIMIT 0` before building SQL. `/api/product-detail` was also hardened because it used similar optional product/tax/SEO fields.


## Build 129 context

When continuing this project, remember that Operations now includes D1 Schema Drift Report and Public API Health. Use those before assuming runtime errors are fixed. Amazon CSV data should be imported through the private admin staging flow, reviewed, then applied to inventory; never deploy raw order/cost spreadsheets in public `/data/` folders.

## Build 130 AI handoff note

When continuing this project, remember that `/api/products` must remain schema-drift tolerant. Do not add optional product columns directly to public product SQL unless they are proven by strict D1 metadata checks. If product richness fails, prefer public-safe fallback data over a storefront outage.

## Build 131 AI handoff

Current focus: stabilize the Devil n Dove storefront against D1 schema drift. Build 131 adds `/api/admin/storefront-schema-repair` plus an Operations UI to inspect/apply non-destructive product/tax/product SEO compatibility columns. It also expands Public API Health and adds local predeploy sanity checks. Future work should continue product value backfills, structured-data checks, sitemap generation from D1, Amazon review safeguards, and accounting close/export workflows.

## Build 132 AI handoff

The latest pass is Build 132. Main user request: the mobile main menu was too long. The fix is in `/js/main.js` and `/css/styles.css`: shared nav now renders desktop links separately and mobile grouped accordions with quick buttons. `scripts/predeploy_sanity_check.py` now checks mobile-nav assets. No D1 schema change is required except the ledger marker in `database_upgrade_current_pass.sql`.

## Build 133 AI handoff

The current build includes Operations panels and endpoints for Structured Data Health, Storefront Value Backfill, and Live Sitemap Preview. The compact mobile menu from Build 132 must be preserved. The next AI pass should continue with Search Console CSV import UI, Amazon duplicate/relink hardening, and accounting close workflow expansion.


## Build 134 note

This pass fixes the Product editor draft workflow: drafts require only name/type, image upload is available from the editor when R2 media storage is configured, create-product failures return JSON instead of HTML 500 pages, and the create endpoint adapts to live D1 product/media/SEO columns.

## Build 136 status — 2026-05-18

- Added Operations > Search Console CSV Import.
- Added `/api/admin/search-console-import` for private D1 staging of Search Console CSV exports.
- Added top-page and SEO-opportunity summaries for manual title/meta/internal-link review.
- Added Release Sanity coverage and current-pass SQL table/index self-healing for the Search Console staging tables.
- Keep Search Console CSV exports private; do not store them in public `/data/`.

Next deployment checks: apply/record `database_upgrade_current_pass.sql`, open `/admin/operations/`, import a tiny Search Console CSV sample, then run Release Sanity and Public API Health.


## Build 138 AI handoff note

The site now has a review-first Social Posting Queue. Keep future social work safe: manual/copy-ready first, OAuth/API diagnostics second, direct publishing last. Never store platform secrets in public files or D1; use Cloudflare environment variables for secrets.

## Build 141 AI handoff

The current social workflow is review-first. Do not recommend blind auto-posting. Social queue now supports caption templates, content pillars, calls to action, UTM-tagged links, calendar summary, dry run, scheduling, duplicate guards, and API attempts only when Cloudflare environment variables exist. Future work should add an admin template editor, social analytics rollups, and job/customer media privacy controls before more automation.


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

## Build 146 AI context

The next assistant should know:

- The user reported `/api/admin/mobile-create-product` failed with `normalizeColorNames is not defined`; Build 146 replaces the endpoint with a fixed version.
- Product editor draft autosave and seven-image upload are active expectations.
- Product Story Notes were added as an admin-managed workflow for `product_story_public_notes`.
- Story notes are public-facing only after review and should avoid private/customer/sensitive workshop details.
- Next priorities include story snippets on shop cards, image ordering/role checklist, social consent records, social analytics, and the accounting close workflow.



## Build 147 AI handoff

The current working direction is: product capture should flow from quick draft → multi-image/product-role review → approved public story → shop-card story snippet → social queue → privacy/consent review. The new media consent registry is private D1 data and must not be placed in public `/data/` files.


## Build 148 AI Context

Continue treating product media as role-aware and privacy-aware. Product images can now carry `image_role`, `public_use_status`, `consent_record_id`, and `role_review_notes`. Social Privacy Guard checks Media Consent Records for customer/private media before approval. Internal site search should keep using approved product story snippets.
