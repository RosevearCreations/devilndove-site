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
