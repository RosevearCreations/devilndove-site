# Build 156 summary

Build 156 adds the next custom-work commerce layer. Custom candle making and custom soap making now have public Southern Ontario landing pages that route into the Custom Request flow. Approved payment review links are protected by stricter admin share gates, can prepare Stripe/PayPal/Square/manual checkout records from the private payment page, and stay connected to converted order records. Converted custom-request orders now have private customer order-status pages. Marketplace export packs now include downloadable CSV output for Etsy, Facebook Marketplace, Pinterest, and manual listings. Post-fulfillment review/photo/consent prompts now have a private public response page. Product detail pages now show related proof-matched products by material, process, locality, and product type.

Deploy checks: apply `database_upgrade_current_pass.sql`, test `/custom-candle-making-ontario/`, `/custom-soap-making-ontario/`, `/custom-request/pay/?token=...`, `/custom-request/order/?token=...`, `/custom-request/consent/?token=...`, Operations > Custom Requests, marketplace CSV download, and a product detail page with related proof matches.

# Build 154 summary

Build 154 adds the next custom-work business layer: accepted quote previews create review-needed payment-request and order-draft records; quotes have editable line items and revision history; uploaded reference images create media consent review records; accounting close can download a ZIP; SEO overrides can be baked into static HTML; and the gallery has proof filters by material, process, locality, and product type.

# Build 153 update

Build 153 adds private custom quote preview links, customer accept/decline tracking, and post-submit reference-image uploads for custom requests. Apply `database_upgrade_current_pass.sql`, then test `/custom-request/`, `/admin/operations/` > Custom Requests, and `/custom-request/quote/?token=...` with a test quote link.

# Build 152 update

Build 152 expands the custom request workflow and accounting close reminders. Operations > Custom Requests can now create manual reply templates, deposit candidates, and invoice candidates from request/quote drafts. Accounting > Close Workflow can queue an HST/GST reminder into the notification outbox. Apply or record `database_upgrade_current_pass.sql` before testing these features against live D1.

# Build 151 update

This build adds a stronger business workflow layer for Devil n Dove:

- Custom Requests are visible in Operations.
- Intake rows can become quote drafts, job drafts, or product draft plans.
- Custom request conversions are tracked with event history.
- UTM campaign attribution now connects social campaigns, visitor analytics, and custom request submissions.
- Accounting Close Workflow can export a close-summary CSV and track HST/GST remittance evidence/reminder fields.

Before deploying, run the D1 schema/current pass review and open Operations, Social Posting Queue, and Accounting Close Workflow after deployment.

# Build 150 operator note

Build 150 adds D1-backed testimonial/trust blocks, Search Console reviewed SEO override application, public SEO override fallback, and an Accounting Close Workflow for payment application, HST/GST review, month-end readiness, and accountant export manifest records.

Recommended first checks after deploy: Operations > Testimonials / Trust Blocks, Operations > Search Console CSV Import > Apply, Operations > Public API Health, Operations > Release Sanity, and Accounting > Close Workflow.

# Build 149 operator note

Build 149 adds stronger product media gates, Product Story consent checks, simple crop/resize tools during upload, public custom request intake, Operations custom-request review, editable social caption templates, and social UTM rollups.

Recommended first checks after deploy: Product Media Workflow upload preset, Product Story approval blocker, `/custom-request/` form submission, Operations > Custom Requests, and Social Posting Queue template editing.

# Devil n Dove Site

## Build 140 note

This build strengthens the Social Posting Queue for crafting/job process updates. It adds dry-run payload previews, scheduling, per-platform captions, duplicate/repost warnings, media-quality warnings, and Release Sanity coverage before API publishing. Use dry run first; credentials still belong only in Cloudflare environment variables.


## Build 139 note

This build adds a review-first social publisher workflow. Admins can queue crafting/job photos and summaries, approve them, and then attempt API publishing to configured platforms. The site still works in manual/copy mode when no platform credentials are present.

## Build 137 update

This build adds safer Search Console SEO workflow tools in Operations: filtered Search Console summaries, import batch delete/revert, and private SEO opportunity actions. These tools help review page/query opportunities before editing public titles, meta descriptions, headings, or internal links. Apply/record `database_upgrade_current_pass.sql` after deploying.

## Build 135 update

Admin product media workflow now includes Media/R2 Diagnostics, Product Image Health, a Product editor readiness checklist, reusable image picker, and edit-mode upload attachment. Run the Operations diagnostics after deployment before bulk product work.


Current sync: 2026-05-18 — Build 137 Search Console filtering, safe batch revert, and private SEO opportunity action queue.

## Active purpose
This repository powers the Devil n Dove public storefront, admin app, member area, catalog tools, accounting workflow, and Cloudflare Pages Functions backend.

## Active structure
- `/functions/api/` — active Cloudflare Pages Functions API surface.
- `/public/js/` — browser-side admin/member/storefront scripts.
- `/admin/*/index.html` — admin department pages.
- `/data/` — approved JSON fallbacks/import sources that have not yet fully moved to D1.
- `/database_*.sql` — schema references and migration support.
- `/archive/` — retired historical files and snapshots.

## What changed in this build
- Added an admin D1 migration ledger API so applied SQL files can be recorded instead of guessed.
- Added the Operations-page Migration Ledger panel for marking SQL files applied, skipped, failed, or pending review.
- Added an admin release-sanity API that checks public pages, H1/title/meta status, catalog/inventory counts, journal balance, reconciliation exceptions, runtime incidents, and migration status.
- Added the Operations-page Release Sanity panel so pre-deploy checks can be run from the browser.
- Expanded the database sanity API with critical checks, index checks, catalog-vs-inventory counts, journal-balance checks, and migration ledger summary.
- Improved the Accounting Backend sanity UI so failures and supporting details are visible instead of hidden in raw JSON.
- Added schema support for the schema_migration_ledger table across the active SQL reference files and the current-pass migration.
- Added statement provider profile storage for bank, PayPal, Stripe, Square, Etsy, and manual CSV mappings.
- Added an Accounting-page Provider Profiles UI to seed, view, and edit statement import mappings.
- Updated statement import APIs so provider profiles are available to the import screen and seeded when missing.
- Allowed the manual CSV provider as a first-class statement-import provider.
- Added reconciliation match confidence buckets for imported statement totals: exact, likely, partial, and manual_review.
- Improved statement-import auto-match detail JSON so confidence, bucket, imported row count, and difference are recorded for later review.
- Mapped inventory movement aliases into schema-safe movement names while preserving the original name in the movement note.
- Kept Tools/Supplies manual inventory creation from saving blank or zero on-hand quantities; current owned items default to at least 1.
- Added unit_cost_dollars to inventory API responses so admin screens can show 33.99 while D1 stores 3399 cents.
- Added a quick D1 inventory stock/unit fix SQL file for existing rows, including package math such as 1 DTF package = 100 sheets.
- Updated movement CHECK constraints in active schema files so older and newer movement names are represented consistently.
- Refined admin CSS for status pills, sanity panels, and mobile-friendly migration forms.
- Ran syntax and public-page sanity checks: 238 JavaScript files passed node --check, and exposed HTML pages had one H1 plus title/meta description.

## Deploy order
1. Deploy the ZIP.
2. Apply `database_upgrade_current_pass.sql` to D1.
3. Mark the migration in `/admin/operations/`.
4. Run Release Sanity in `/admin/operations/`.
5. Run Tools/Supplies inventory sync in `/admin/catalog/`.
6. Verify Accounting Provider Profiles in `/admin/accounting/`.

## Important active docs
- `DEVELOPMENT_ROADMAP.md` — completed 20 and next 20 logical steps.
- `KNOWN_GAPS_AND_RISKS.md` — current risks and guardrails.
- `SANITY_HEALTH_CHECK.md` — checks for each build.
- `DATABASE_SCHEMA_REFERENCE.md` — schema and migration notes.
- `REPO_BASE_GUIDE.md` — current repo map.
- `REPO_RULES.md` — rules for future passes.
- `LOCAL_SEO_PLAYBOOK.md` — search/local visibility guidance.
- `AI_CONTEXT.md` and `NEW_CHAT_STATUS.md` — handoff notes for a fresh chat.

## Private import safety
Amazon transaction CSVs, review spreadsheets, and private purchase reports must not be deployed in public `/data/` paths. Import approved rows through admin/D1 workflows only.
## Build 125 update

Build 125 adds the Amazon purchase review/apply workflow, inventory cost history, reconciliation exception queue controls, journal validation/posting guardrails, six local-intent SEO pages, sitemap generation, and updated schema/Markdown files. After deployment, apply `database_upgrade_current_pass.sql`, mark the migration in `/admin/operations/`, and run Tools/Supplies sync from `/admin/catalog/`.

## Build 126 hotfix

Build 126 adds an Operations-page runtime incident review panel. Release Sanity warnings for recent runtime errors can now be investigated from the admin UI, grouped by severity/scope/code/endpoint, and reviewed with statuses so fixed or ignored rows stop keeping the warning active.


## Build 127 hotfix

Build 127 hardens the public products API against D1 schema drift. Deploy it when Release Sanity shows repeated `/api/products` incidents such as `products_primary_query_failed` and `products_fallback_query_failed`.

## Build 128 deploy note

Build 128 is a code-only compatibility hotfix for older or partially migrated D1 product schemas. Deploy it if `/api/products` returns a safe empty response with an error such as `no such column: p.merchandise_origin`. After deployment, open `/api/products` and confirm the response is no longer `authority: "error"`.


## Build 129 operator notes

After deploying this build, use `/admin/operations/` to run Schema Drift, Public API Health, Runtime Incidents, Migration Ledger, and Release Sanity. Use `/admin/catalog/` for Tools/Supplies sync, Amazon CSV staging import, and Amazon purchase review/apply.

## Build 130 note

Build 130 is a public catalog resilience hotfix. It keeps the storefront usable when optional product columns are missing from D1 by falling back from adaptive SQL to product-only SQL and finally to a `SELECT *` product read with JavaScript filtering.

## Build 131 deploy note

Build 131 adds Operations > Storefront Schema Repair, expanded Public API Health, and a local predeploy sanity script. After deploying, run `/admin/operations/` checks in this order: Storefront Schema Repair, Public API Health, Runtime Incidents, Migration Ledger, then Release Sanity.

## Build 132 release note

Build 132 improves the public mobile header/menu. The hamburger drawer now uses grouped expandable sections, quick Shop/Search/Cart buttons, better phone sizing, safer focus/close behavior, and mobile admin shortcut polish. Run `python scripts/predeploy_sanity_check.py .` before deploying.

## Build 133 release note

Build 133 adds Operations panels for Structured Data Health, Storefront Value Backfill, and Live Sitemap Preview while preserving the compact grouped mobile menu from Build 132. After deploying, apply/record `database_upgrade_current_pass.sql`, then run the Operations checks and apply safe storefront value backfill only after reviewing the inspect report.


## Build 134 note

This pass fixes the Product editor draft workflow: drafts require only name/type, image upload is available from the editor when R2 media storage is configured, create-product failures return JSON instead of HTML 500 pages, and the create endpoint adapts to live D1 product/media/SEO columns.

## Build 136 status — 2026-05-18

- Added Operations > Search Console CSV Import.
- Added `/api/admin/search-console-import` for private D1 staging of Search Console CSV exports.
- Added top-page and SEO-opportunity summaries for manual title/meta/internal-link review.
- Added Release Sanity coverage and current-pass SQL table/index self-healing for the Search Console staging tables.
- Keep Search Console CSV exports private; do not store them in public `/data/`.

Next deployment checks: apply/record `database_upgrade_current_pass.sql`, open `/admin/operations/`, import a tiny Search Console CSV sample, then run Release Sanity and Public API Health.


## Build 138 highlight

Operations now includes a Social Posting Queue for review-first job/process photo captions and manual publishing records across Facebook, Instagram, TikTok, X, YouTube, and Pinterest.

## Build 141 note

Operations now includes a stronger Social Posting Queue for crafting/process photos and summaries. It supports reusable caption templates, template previews, UTM-tagged related links, a small content calendar, dry runs, scheduling, duplicate warnings, and manual/API publishing records. API publishing still requires platform credentials in Cloudflare environment variables and should be tested one platform at a time.


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

## Build 146 operator note

Build 146 focuses on product capture reliability and product storytelling:

- Mobile product capture now includes the missing `normalizeColorNames` helper.
- Product editor autosave and seven-image capture remain part of the expected admin workflow.
- Product Story Notes are now editable from the Product admin screen.
- Story notes must be privacy-reviewed before public use.

After deployment, apply/record `database_upgrade_current_pass.sql`, then test mobile draft save, desktop autosave, multi-image upload, and Product Story Notes.



## Build 147 update

This build adds public shop-card story snippets, Product editor image duplicate warnings, a seven-role image checklist, a Product editor social-post shortcut, and an Operations media-consent registry. Apply `database_upgrade_current_pass.sql` after deploying.


## Build 148 Update

Product media management now supports drag/drop ordering, role labels, public-use status, consent-record references, and story snippets in internal search. See `COMPETITIVE.md`, `DEVELOPMENT_ROADMAP.md`, and `KNOWN_GAPS_AND_RISKS.md` for the updated direction.

## Build 155 summary

Build 155 extends Devil n Dove custom request commerce: reviewed payment-request drafts can become private approved payment review links, reviewed order drafts can become real draft orders, quote revisions can create replacement links, marketplace copy packs can be generated, shop/product APIs expose proof filters, and post-fulfillment review/photo/consent prompts are tracked as internal draft records.

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

