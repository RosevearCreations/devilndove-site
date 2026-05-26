# Build 152 sanity additions

After deployment:

1. Open `/admin/operations/` and verify Custom Requests loads.
2. From a harmless test request, create a quote draft, reply template, deposit candidate, invoice candidate, job draft, and product plan.
3. Confirm reply template text appears and the copy button works.
4. Confirm Recent conversion events show the new actions.
5. Open `/admin/accounting/` and verify HST/GST review still saves.
6. Add a reminder date and use Queue reminder; confirm a readable success/suppression message appears.
7. Run Release Sanity and Public API Health.
8. Run `python3 scripts/predeploy_sanity_check.py .` and confirm H1/title/meta checks still pass.

# Build 151 sanity notes

Validation targets for this pass:

- `/admin/operations/` should include `customRequestsAdminMount` and `/public/js/admin-custom-requests.js`.
- Custom request rows should support Save Review, Create Quote Draft, Create Job Draft, and Create Product Plan actions.
- Public `/custom-request/` should include analytics tracking and should pass one-H1/title/meta checks.
- Social Posting Queue UTM rollups should still work if analytics tables are missing, and should show conversion metrics when they exist.
- Accounting Close Workflow should still load normally and should expose a downloadable CSV link for the selected period.
- CSS brace balance and JavaScript syntax checks should pass before packaging.

# Build 150 sanity additions

After deploying Build 150:

1. Apply or record `database_upgrade_current_pass.sql`.
2. Open `/admin/operations/` and confirm Testimonials / Trust Blocks loads.
3. Create a draft trust block, then approve/public only harmless test copy.
4. Open `/api/trust-blocks?context=homepage&limit=4` and confirm it returns JSON without breaking when no approved rows exist.
5. Open Search Console CSV Import, generate or pick a test action, and use Apply to create a `seo_page_overrides` row.
6. Open `/api/seo-page-overrides?path=/` and confirm it returns JSON.
7. Open a public page and confirm the new SEO override script does not create console errors.
8. Open `/admin/accounting/` and confirm Close Workflow loads.
9. Save a harmless close checklist note and create a draft accountant export manifest.
10. Open Operations > Public API Health and Release Sanity and confirm the new checks appear.
11. Run `python3 scripts/predeploy_sanity_check.py` and confirm one-H1/title/meta checks still pass.

# Build 149 sanity additions

After deploying Build 149:

1. Run `database_upgrade_current_pass.sql` or record the migration ledger state for this build.
2. Open `/admin/catalog/`, load a product in Product Media Workflow, select an image, try the square 1200 crop preset, upload, and save.
3. Confirm the product image row stores width/height/orientation and crop fields.
4. Run Product Readiness and confirm missing image roles or missing hero/front role produce warnings/failures.
5. Open Product Story Notes, select a product, and confirm media consent summary appears in the product summary and table.
6. Try approving a story with blocked/consent-needed media and confirm the API blocks it with a readable JSON message.
7. Open a public product detail page and confirm images are still visible but role-aware groups are present in `/api/product-detail?slug=...`.
8. Submit a harmless `/custom-request/` test and confirm it appears in `/admin/operations/` > Custom Requests.
9. Edit a Social Posting Queue caption template, refresh, and confirm the custom text persists.
10. Confirm Social Posting Queue shows UTM campaign rollups after at least one UTM-linked queued post exists.
11. Run `python scripts/predeploy_sanity_check.py .` before packaging and confirm one-H1/title/meta checks still pass.

# Sanity Health Check — Devil n Dove

## Build 140 checks added

Release Sanity now reports social queue scheduled/due/dry-run counts and warns when open posts are flagged as possible duplicates. This warning should be reviewed before API publishing because the queue now blocks duplicate-warning posts until an admin clears the warning.


## Build 139 checks added

Release Sanity now includes Social API publisher readiness. The check reports whether Facebook, Instagram, X, or Pinterest credentials are detected in Cloudflare environment variables. Missing credentials are a warning, not a failure, because manual/copy-posting remains available. Social publish attempts are recorded per platform so failed credentials or app-review issues do not break the public storefront.

# Sanity Health Check — Build 137

## Build 137 sanity additions

1. Search Console CSV Import now supports filters for page, query, country, device, date range, impressions, position range, and result limit.
2. Search Console import batches can be safely reverted/deleted from the Operations panel after typing the confirmation word.
3. Private SEO opportunity actions are checked by Release Sanity through the `seo_opportunity_actions` table.
4. The predeploy sanity script now verifies Search Console filter, batch delete, recommendation, and action-status assets.
5. Continue using Release Sanity, Public API Health, Runtime Incidents, Media/R2 Diagnostics, Product Image Health, and D1 Schema Drift after deployment.

## Build 135 sanity additions

- Run `/admin/operations/` > Media / R2 Diagnostics before testing product uploads.
- Run Product Image Health after creating or editing products.
- Run Release Sanity and confirm the new media/image checks respond.
- On `/admin/products/`, verify the draft checklist, reusable image picker, image upload, and edit-mode attachment.


Date: 2026-05-16

## Automated checks run during this pass
- JavaScript syntax check: all non-archive `.js` files passed `node --check`.
- Public/admin HTML check: every non-archive `.html` file has exactly one `<h1>`, a `<title>`, and a meta description.
- Local script/style reference check: no missing local `.js` or `.css` references were found.
- CSS brace drift check: `/css/styles.css` braces were balanced.
- `/api/products` adaptive-schema smoke test passed with an older tax schema that has `tax_rate` but no `rate_percent`.
- Current-pass SQL includes a Build 127 migration ledger marker and no destructive changes.

## Runtime incident sanity flow after deploying Build 127
1. Open `/api/products` in the browser.
2. Confirm the JSON response shows `ok: true`.
3. Confirm `summary.authority` is not `error`.
4. Open `/admin/operations/`.
5. Use **Security / Runtime Incidents** and filter the last 7 days.
6. Confirm no new `/api/products` incidents are created after the Build 127 deploy time.
7. Mark the old `/api/products` rows resolved once the new endpoint is confirmed.
8. Re-run Release Sanity.

## Guardrails to keep
- One H1 per exposed page.
- Money stored in cents, displayed in dollars.
- Current owned tools/supplies default to at least one stock unit.
- Package math uses stock package plus usage unit count.
- Keep private Amazon cost/order reports out of public static files.
- Public APIs should inspect D1 schema before referencing optional columns so older databases degrade safely.

## Build 128 sanity note

- Rechecked the live `/api/products` failure reported after Build 127: `D1_ERROR: no such column: p.merchandise_origin`.
- Build 128 adds direct column verification to `/api/products` and `/api/product-detail` before optional D1 columns are referenced.
- Local mock D1 tests covered an older schema where `PRAGMA table_info` appeared to include optional fields but direct column selection failed.
- Expected post-deploy result: `/api/products` returns `ok: true` and does not report `authority: "error"`.
- After deploy, refresh `/admin/operations/` > Runtime Incidents and confirm the `/api/products` incident count does not increase.


## Build 129 sanity checklist

- Run Operations > D1 Schema Drift Report after deployment and before assuming D1 is current.
- Run Operations > Public API Health and confirm `/api/products` is not returning `authority: error`.
- Run Operations > Release Sanity and review any product schema/API warnings.
- Use Runtime Incidents cleanup only for resolved/ignored rows older than the selected retention period.
- Test Amazon CSV staging import with a tiny CSV sample before importing a large order file.
- Confirm the Amazon review queue shows confidence explanations and keeps imported rows pending until approved.

## Build 130 sanity checklist

- Open `/api/products` immediately after deploy.
- Confirm `ok: true`.
- Confirm `summary.authority` is not `error`.
- Acceptable authorities are `d1_adaptive_query`, `d1_product_only_fallback_query`, or `d1_select_star_fallback`.
- Refresh Operations > Runtime Incidents after several public page loads and confirm `products_primary_query_failed` / `products_fallback_query_failed` counts do not increase.
- If the response uses `d1_select_star_fallback`, run D1 Schema Drift Report and plan product-column cleanup later; do not treat it as a public outage.

## Build 131 sanity additions

- Operations now includes **Storefront Schema Repair** for product/tax/product SEO compatibility columns.
- Public API Health now checks `/api/products`, product detail when a sample slug exists, shop/gallery HTML, catalog items, tools, supplies, creations, community content, sitemap XML, and robots.txt.
- Release Sanity now warns when safe storefront repair columns are still missing.
- Local predeploy command added:

```bash
python scripts/predeploy_sanity_check.py .
```

This local script checks one H1, title/meta descriptions, missing local references, CSS brace drift, and obvious private Amazon/order data in public `/data/` files.

## Build 132 sanity additions

- Shared mobile navigation now uses a compact expandable drawer instead of a long flat list.
- Mobile menu groups checked locally: Essentials, Shop & Browse, Workshop, Community, Account, and Local pages.
- Local predeploy sanity now checks that the mobile navigation JavaScript and CSS assets are present.
- Manual post-deploy phone checks to run:
  1. Open the home page on a phone-width screen.
  2. Tap **Menu**.
  3. Confirm grouped expandable sections appear.
  4. Confirm Shop/Search/Cart quick buttons are visible.
  5. Confirm the drawer scrolls inside the screen and closes cleanly.
  6. Check `/admin/catalog/` or `/admin/operations/` and confirm department buttons no longer create a long stacked wall on phone screens.

## Build 133 sanity checklist

1. Deploy Build 133.
2. Apply or record `database_upgrade_current_pass.sql`.
3. Open `/admin/operations/`.
4. Run Storefront Schema Repair.
5. Run Storefront Value Backfill inspect, then apply only if the pending defaults look safe.
6. Run Structured Data Health.
7. Run Live Sitemap Preview.
8. Run Public API Health and Release Sanity.
9. Confirm exposed pages still have one H1, title, and meta description.
10. Confirm the mobile main menu still opens as grouped expandable sections.

Local predeploy command remains:

```bash
python scripts/predeploy_sanity_check.py .
```

## Build 134 sanity additions

- Product editor draft-save smoke test: create a draft with only product name and product type.
- Product editor error-handling smoke test: failed `/api/admin/create-product` responses should show readable JSON-backed messages, not `Unexpected token '<'`.
- Product media smoke test: use the inline image uploader if R2 media storage is configured; otherwise paste a URL and confirm the draft still saves.
- Runtime follow-up: check Operations > Runtime Incidents for `admin_products/create_product_failed` after the first live draft test.

## Build 136 status — 2026-05-18

- Added Operations > Search Console CSV Import.
- Added `/api/admin/search-console-import` for private D1 staging of Search Console CSV exports.
- Added top-page and SEO-opportunity summaries for manual title/meta/internal-link review.
- Added Release Sanity coverage and current-pass SQL table/index self-healing for the Search Console staging tables.
- Keep Search Console CSV exports private; do not store them in public `/data/`.

Next deployment checks: apply/record `database_upgrade_current_pass.sql`, open `/admin/operations/`, import a tiny Search Console CSV sample, then run Release Sanity and Public API Health.


## Build 138 social posting sanity checks

After deploy, open `/admin/operations/` and run Social Posting Queue plus Release Sanity. Queue one draft from recent media, copy the caption manually, and record the public URL after posting. Confirm no `admin_social/social_queue_*` runtime incidents appear.


## Build 141 sanity additions

After deploying Build 141:

1. Open `/admin/operations/`.
2. Run **Social Posting Queue** and confirm these appear:
   - Upcoming content calendar
   - Caption templates
   - Template selector
   - Preview template caption button
3. Queue one test post using a template, then run Dry run.
4. Confirm UTM-tagged links are used when a related link is supplied.
5. Run **Release Sanity** and check the new social caption-template/calendar readiness line.
6. Run **Runtime Incidents** and confirm no new `admin_social` errors are being recorded.


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

## Build 144 sanity additions

- Confirm `/public/js/local-trust-block.js` exists and loads on homepage/product detail pages.
- Confirm `data/site/local-trust.json` contains only public-safe copy.
- Confirm `/shop/product/` has one H1 and the new story/trust cards do not add extra H1s.
- Confirm `/api/product-detail?slug=...` returns `story_notes` without failing when the `product_story_public_notes` table is absent.
- Confirm `/admin/products/` product rows include **Post this product** and queue social drafts without publishing.
- Confirm Social Media Privacy Guard still blocks API publishing unless posts are privacy-approved or product-only/no-private-media.

## Build 146 sanity additions

Check these after deployment:

1. `/admin/mobile-product/` can save a draft without `normalizeColorNames is not defined`.
2. `/api/admin/mobile-create-product` returns JSON on both success and failure.
3. `/admin/products/` shows product autosave status once name/type are filled.
4. Desktop Product editor can upload more than one image, up to seven total product images.
5. `/admin/products/` shows Product story notes.
6. `/api/admin/product-story-notes` returns products, notes, and summary for admin users.
7. Product story note can be seeded from an existing product.
8. Approved/published story notes should be privacy-safe before public product pages consume them.
9. Runtime Incidents should not show fresh `mobile_create_product_failed` errors after normal draft saves.
10. Predeploy sanity script now checks the story note editor assets.



## Build 147 sanity additions

After deploying, check:

1. `/api/products` returns `ok: true` and includes public story fields when approved story notes exist.
2. `/shop/` product cards still fit on mobile and show story snippets only when available.
3. `/admin/products/` shows the Product image role checklist.
4. `/admin/products/` warns about duplicate image URLs.
5. `/admin/products/` can queue a product social draft from the editor.
6. `/admin/operations/` loads Media Consent Records.
7. `database_upgrade_current_pass.sql` has been applied or recorded in the migration ledger.


## Build 148 Sanity Notes

Checks to perform after deploy:

1. Open `/admin/products/`, load a product in Product Media Workflow, drag images into a new order, save, reload, and confirm the order persisted.
2. Set image roles and public-use statuses, save, reload, and confirm they persisted.
3. Create or update a Media Consent Record in `/admin/operations/`.
4. Open Social Media Privacy Guard and confirm consent status appears for matching social posts.
5. Search the public site for wording from an approved product story snippet and confirm product results surface properly.
