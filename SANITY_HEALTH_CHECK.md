# Build 177 sanity health check

Latest pass expectations:

- `database_build177_deploy_score_and_controls.sql` is present and listed in the D1 order.
- Release Control shows deploy-readiness score rows, exact manifest diff items, QA approval rows, marketplace rule rows, recall customer matches, R2 private evidence tests, LocalBusiness injection targets, and dashboard notification cards.
- Public/local pages have no more than one H1 each.
- Managed LocalBusiness JSON-LD blocks are present on the homepage and main local landing pages.
- CSS brace balance, JSON parse checks, JS syntax checks, Python compile checks, and SQL smoke tests pass before packaging.

<!-- BUILD_176_PREFLIGHT_SANITY_START -->
# Build 176 Deployment Preflight Sanity Notes

Static package preflight result for this zip: **ready**.

- Blockers: 0.
- Warnings: 0.
- Checks: 5.
- One-H1/title/meta/local wording, CSS brace balance, JSON parse, schema file presence, release-manifest, and Build 176 release-safety checks were regenerated from the static preflight data.

Post-deploy order:
1. Run `database_build171_ledger_repair.sql` only if Build 171 schema already exists but the marker is missing.
2. Run `database_build173_deployment_preflight.sql`.
3. Run `database_build174_deployment_preflight_detail.sql`.
4. Run `database_build175_release_control.sql`.
5. Run `database_build176_release_safety_controls.sql`.
6. Open `/admin/deployment-preflight/`, run Preflight, export Markdown if warnings remain, save snapshot, and confirm post-deploy checklist rows.
7. Open `/admin/release-control/` to download the Safe Deploy ZIP, run live manifest compare, seed QA previews, refresh recall locks, and create rollback checklist rows.
<!-- BUILD_176_PREFLIGHT_SANITY_END -->
<!-- BUILD_175_PREFLIGHT_SANITY_START -->
# Build 175 Deployment Preflight Sanity Notes

Static package preflight result for this zip: **ready**.

- Blockers: 0.
- Warnings: 0.
- Checks: 5.
- One-H1/title/meta/local wording, CSS brace balance, JSON parse, schema file presence, release-manifest, and Build 175 release-control checks were regenerated from the static preflight data.

Post-deploy order:
1. Run `database_build171_ledger_repair.sql` only if Build 171 schema already exists but the marker is missing.
2. Run `database_build173_deployment_preflight.sql`.
3. Run `database_build174_deployment_preflight_detail.sql`.
4. Run `database_build175_release_control.sql`.
5. Run `database_build176_release_safety_controls.sql`.
5. Open `/admin/deployment-preflight/`, run Preflight, export Markdown if warnings remain, save snapshot, and confirm post-deploy checklist rows.
6. Open `/admin/release-control/` to seed mobile views, queue screenshot jobs, and review LocalBusiness schema.
<!-- BUILD_175_PREFLIGHT_SANITY_END -->
<!-- BUILD_175_RELEASE_CONTROL_SANITY_START -->
# Build 175 Release Control Sanity Notes

Static package preflight result for this zip is regenerated during final validation.

Pre-deploy order:
1. Apply `database_build175_release_control.sql` after Build 174.
2. Open `/admin/deployment-preflight/` and run Preflight.
3. Open `/admin/release-control/` and seed phone views/queue screenshot jobs if needed.
4. Open `/admin/safe-deploy-package/` and verify the Build 175 schema order.
5. Run `/admin/post-deploy-smoke-tests/` after promotion.

Manual live checks still required:
- Cloudflare D1/R2 bindings.
- Gift-card provider webhook signatures.
- R2 signed/private download tests.
- Real screenshot evidence upload/capture.
<!-- BUILD_175_RELEASE_CONTROL_SANITY_END -->
<!-- BUILD_174_PREFLIGHT_SANITY_START -->
# Build 174 Deployment Preflight Sanity Notes

Static package preflight result for this zip: **ready**.

- Blockers: 0.
- Warnings: 0.
- Checks: 5.
- One-H1/title/meta/local wording, CSS brace balance, JSON parse, schema file presence, and release-manifest checks were regenerated from the static preflight data.

Post-deploy order:
1. Run `database_build171_ledger_repair.sql` only if Build 171 schema already exists but the marker is missing.
2. Run `database_build173_deployment_preflight.sql`.
3. Run `database_build174_deployment_preflight_detail.sql`.
4. Open `/admin/deployment-preflight/`, run Preflight, export Markdown if warnings remain, save snapshot, and confirm post-deploy checklist rows.
<!-- BUILD_174_PREFLIGHT_SANITY_END -->
# Build 173 Deployment Preflight Sanity Notes

Static package preflight result for this zip:
- Status: ready.
- Blockers: 0.
- Warnings: 0.
- Public local SEO pages checked: 12.
- One-H1/title/meta/local wording check: pass.
- CSS brace balance: pass.
- Static JSON parse check: pass.
- Required release/safe-deploy files: pass.

Post-deploy D1 order:
1. If Build 171 schema additions already ran but the ledger insert failed, run `database_build171_ledger_repair.sql` first.
2. Run `database_build173_deployment_preflight.sql` once.
3. Open `/admin/deployment-preflight/`.
4. Run Preflight.
5. Save Snapshot.
6. Review any `blocked` or `review` status before swapping or promoting a live branch.

# Build 171 Deployment Blocker Checklist

Deployment blockers to confirm before live release:

- [ ] D1 schema migration applied for Build 171 tables/columns.
- [ ] `ACCOUNTANT_EVIDENCE_R2_FETCH_ENABLED` is intentionally set before binary evidence ZIP downloads are used.
- [ ] Accountant evidence bucket binding is configured if binary evidence is enabled.
- [ ] Dark-theme evidence R2 bucket binding is configured before direct uploads are used.
- [ ] R2 derivative worker route health test passes create/get/delete tiny-object check.
- [ ] Gift-card email provider choice and required API key are configured or provider remains `manual`.
- [ ] Gift-card send logs are visible after test delivery attempt.
- [ ] Product QA fix links open `/admin/catalog/` and focus the correct field.
- [ ] Marketplace export history has new `snapshot_json` rows before diff/rollback is trusted.
- [ ] Recall notification drafts cannot queue until approval is recorded.
- [ ] Local SEO bake-action JSON export opens from `/api/admin/local-seo-bake-actions?format=json`.
- [ ] Post-deploy smoke-test quick-run has been executed from the admin dashboard.
- [ ] Safe Deploy Package page reviewed at `/admin/safe-deploy-package/`.
- [ ] Release Notes page reviewed at `/admin/release-notes/`.
- [ ] No exposed public page has more than one H1.
- [ ] CSS sanity check passes after dark-theme/focus additions.

# Build 159 sanity additions

After deploy:

1. Open `/admin/catalog/`.
2. Click **Edit** on a product that already has multiple images.
3. Confirm Product Editor → Product pictures shows thumbnail cards above the file chooser.
4. Confirm the featured image appears only once, not duplicated as Image URL 1.
5. Click a thumbnail or **Edit URL** and confirm the matching URL field receives focus.
6. Drag Image 2 before Image 1 and confirm the first card becomes Featured / first.
7. Use **Make first** and **Remove** on a gallery card, then save/update the product.
8. Reload the product and confirm image order persists.
9. Open Product Media Workflow for the same product and confirm advanced image rows still load for role/public-use/crop metadata.
10. Run predeploy sanity, JavaScript syntax checks, CSS brace check, and ZIP integrity check.

# Build 156 sanity additions

Before deploy or after staging deploy:

1. Open `/custom-candle-making-ontario/` and `/custom-soap-making-ontario/`; confirm each has one H1, useful title/meta, and Custom Request prefill links.
2. Create or use a test custom request, add quote lines, create accepted follow-through drafts, convert the order, run the payment gate, then approve the payment link.
3. Open `/custom-request/pay/?token=...` and test Stripe/PayPal/Square/manual provider preparation with safe/test configuration.
4. Open `/custom-request/order/?token=...` and confirm the customer sees order number, status, payment status, items, and totals.
5. Create a post-fulfillment prompt, copy `/custom-request/consent/?token=...`, submit a test response, and confirm it records as responded.
6. Download marketplace CSV files from Operations > Custom Requests.
7. Open a product detail page and confirm related proof matches do not break if no related products exist.
8. Run predeploy sanity, JavaScript syntax checks, CSS brace check, and ZIP integrity check before uploading.

# Build 154 sanity additions

Check these after deploy:

1. Submit a custom request, create a quote draft, add at least one quote line item, and confirm totals update.
2. Create a private quote preview, accept it, then confirm payment-request and order-draft records appear in Operations.
3. Decline a quote preview and confirm quote revision history records the decline note.
4. Upload a custom request reference image and confirm a media consent record appears as requested/internal-only.
5. Open Accounting Close Workflow and confirm CSV and ZIP downloads respond.
6. Run `python scripts/bake_approved_seo_overrides.py` with a test override JSON in a branch only.
7. Open `/gallery/` and test product type, material, process, and locality filters.

# Build 153 sanity health check update

Before deploy, run `python3 scripts/predeploy_sanity_check.py`. Then test: public custom request submit without files, public custom request submit with reference image upload, Operations > Custom Requests quote preview link creation, private quote preview GET, private quote accept, private quote decline on a separate test row, and fallback behavior when R2 upload bindings are missing.

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

## Build 155 sanity targets

Required checks for this pass:

- One H1 per exposed HTML page.
- JavaScript syntax check for Functions, `public/js`, and `js`.
- CSS brace drift check.
- ZIP integrity check.
- Confirm private payment page is `noindex,nofollow`.
- Confirm schema files include Build 155 custom request payment/order/marketplace/fulfillment additions.

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

## Build 162 — Shop/Creations CSS, Gift Page, and Inventory Image References

- Added `/gift-cards/` as a dedicated public gift-card page so the main shop no longer has the full gift-card form awkwardly placed between filters and products.
- Changed `/shop/` to show a compact gift-card callout that links to `/gift-cards/`.
- Repaired the contrast for the `/shop/` Browse by collection direction panel and the `/creations/` browse/filter/cards areas so light panels use dark readable text.
- Updated Tools & Supplies Inventory Operations to show a live visual image preview beside the Image URL field while keeping the URL editable.
- Updated the inventory list rows to show a larger thumbnail, the image URL link, and the source/Amazon URL link for easier visual reference.
- Added `/gift-cards/` to the sitemap. No D1 schema migration is required for this pass.


## Build 163 — 20-step roadmap/gaps pass: readiness, image health, gifts, and admin clarity

Completed in this pass:

1. Added `/admin/readiness/` as a focused Product Readiness workspace.
2. Added `/api/admin/product-readiness` so Approve/Publish blockers can be previewed before clicking action buttons.
3. Added readiness summary counters for total, ready, blocked, missing featured image, missing image roles, missing alt text, blocked public-use images, missing SEO, missing price, and products needing 3 images.
4. Added per-product blocker cards with direct links back to the product editor and media workspace.
5. Added dashboard counters for product image/SEO readiness gaps.
6. Added a Product Readiness department card to the Admin Dashboard.
7. Added Readiness Preview links to Catalog, Catalog Media, and Inventory Operations workspace navigation.
8. Added a static gift-card artwork placeholder at `/assets/gift-card-placeholder.svg`.
9. Added gift-card artwork guidance directly to the `/gift-cards/` hero.
10. Added Gift Cards to the home navigation so the new gift page is easier to find.
11. Hardened predeploy sanity checks so the new readiness page, endpoint, dashboard counters, gift artwork, and CSS assets are checked every pass.
12. Added CSS for readiness cards, readiness score badges, blocker rows, and the split gift-card hero.
13. Kept the one-H1 rule intact across all scanned exposed pages.
14. Kept private/admin pages as `noindex,nofollow` where appropriate.
15. Continued the local SEO habit of clear titles, readable headings, and visible local/product wording.
16. Kept the new readiness endpoint D1-backed without adding a required migration.
17. Preserved the split admin structure from the previous pass: Products, Media, Inventory Operations, and now Readiness.
18. Improved operator visibility before publishing by making missing image roles, missing hero/detail/scale roles, public-use blockers, SEO gaps, and price gaps visible from one place.
19. Updated active Markdown handoff docs with Build 163 notes.
20. Updated schema/reference SQL notes with Build 163 status and no-migration guidance.

Next 20 recommended steps:

1. Add inline readiness badges beside each row in the `/admin/catalog/` product table.
2. Add a one-click “Open first blocker” shortcut from each readiness card.
3. Add image-role quick-fix buttons from the readiness page.
4. Add automatic “apply recommended roles” preview before saving image rows.
5. Add true crop/focal-point visual editing directly on thumbnail cards.
6. Add visible “image order saved” confirmation that shows featured/gallery order after save.
7. Add dashboard drilldown links from each image/SEO counter.
8. Add gift-card admin settings for default amounts, expiry wording, and active/inactive status.
9. Add a real gift-card image upload field and replace the placeholder artwork.
10. Add gift-card checkout order-line creation instead of only local draft storage.
11. Add marketplace image validation before CSV export.
12. Add channel-specific marketplace CSV presets editing in admin.
13. Add shop/product API filters for “missing proof image” and “ready for social.”
14. Add post-publish QA for product detail JSON, image gallery, cart button, and SEO preview.
15. Add public product page mini-gallery thumbnails below the main image if any product detail page still only shows one image.
16. Add public proof/trust moderation filters before new trust blocks appear customer-facing.
17. Add order-stage photo uploads for custom work: planning, making, curing/finishing, ready, pickup/shipping.
18. Add candle/soap spec editing after product creation: scent, wax/base, colour, ingredients, allergens, and batch number.
19. Add accountant export checks for missing evidence URLs and missing close notes.
20. Add a mobile admin landing page that links to phone capture, inventory intake, readiness blockers, and today’s admin actions.


## Build 164 — Roadmap/Gaps Pass Completed

Completed from the requested next-20 pass:

1. Added inline readiness badges beside each product row in `/admin/catalog/`.
2. Added one-click **Open blocker** shortcuts from product rows and readiness cards.
3. Added image-role quick-fix buttons from `/admin/readiness/` that apply recommended image roles through the Product Media Workflow endpoint.
4. Added recommended image-role preview before saving image rows.
5. Added click-to-set focal point editing directly on Product Media Workflow thumbnail cards.
6. Added visible “Product images and image order saved” confirmation after saving image rows.
7. Added Admin Dashboard drilldown links from readiness counters into `/admin/readiness/?filter=...`.
8. Added gift-card admin quick settings through Operations > Saved App Settings.
9. Replaced the placeholder gift-card artwork with `/assets/gift-card-art.svg`.
10. Verified gift-card checkout order-line creation is already supported by `checkout-create-order.js` through `gift_card_purchase` payloads.
11. Added marketplace image-readiness validation notes/fields before CSV export packs.
12. Added editable marketplace CSV presets for Etsy, Facebook Marketplace, Pinterest, and manual listings.
13. Added shop filters for “Ready for social” and “Missing proof image”.
14. Added `/api/admin/product-publish-qa` for post-publish QA checks covering product detail JSON, gallery, cart basics, and SEO.
15. Extended product/shop proof signals so product cards and filters can detect proof-image and social-readiness gaps.
16. Added public trust-block moderation filters by context, item kind, locality, and related product slug.
17. Added `custom_order_stage_photos` API/table for order-stage photo tracking.
18. Added candle/soap spec editing after product creation through `/api/admin/candle-soap-specs` and the Catalog Media workspace.
19. Added accountant export/evidence visibility notes for missing HST/GST evidence URLs.
20. Improved `/admin/mobile/` as a better mobile admin landing page by adding readiness, inventory operations, and missing accounting-state mount support.

### Build 164 schema/data notes

New tables or schema references added:

- `custom_order_stage_photos`
- `custom_candle_soap_product_specs`
- unique index `idx_custom_candle_soap_product_specs_product`
- marketplace export pack fields for image validation status/notes

No public page should have more than one H1; the sanity pass must keep checking this every build.


## Next 20 Recommended Steps After Build 164

1. Add a dedicated admin page for product publish QA results with pass/fail history.
2. Add one-click fixes from the publish QA report, not only from readiness cards.
3. Add real crop boxes with draggable handles, not just focal-point clicks.
4. Save image focal/crop previews as generated derivative image URLs in R2.
5. Add product image version history so replaced images can be restored.
6. Add bulk readiness fixes for all products missing hero/detail/scale roles.
7. Add gift-card settings UI with proper form fields instead of quick preset buttons.
8. Add gift-card artwork upload to R2 and preview it on `/gift-cards/`.
9. Add admin gift-card order review, delivery queue, and resend delivery controls.
10. Add marketplace CSV field mapping per channel, including category ID, shipping profile, materials, tags, and photo columns.
11. Add marketplace image export selection so only approved images appear in CSV packs.
12. Add social-readiness badges directly on shop/admin product cards.
13. Add proof-image requirements by product category, because candles, soap, jewelry, and vintage pieces need different proof shots.
14. Add public product-detail related-proof sections that explain material/process/locality matches in plain language.
15. Add moderation queues for public trust blocks with archive, publish, and hide buttons.
16. Add order-stage photo upload directly in the custom request admin row, including R2 upload.
17. Add candle/soap label export fields for ingredients, allergens, batch, weight, and safety warnings.
18. Add accountant export ZIP checks that fail the export package when required evidence is missing.
19. Add mobile dashboard tiles for readiness blockers, today’s custom requests, and pending order-stage updates.
20. Add a full regression checklist page that tests shop, product detail, cart, checkout, admin catalog, media workflow, custom requests, and accounting exports before each deploy.

## Build 165 — Roadmap/Gaps Pass Completed

Completed this pass:

1. Restored `functions/api/admin/custom-requests.js` to the full admin custom-request workflow file and repaired the broken marketplace preset tag-splitting regex that blocked Cloudflare Pages Functions deployment.
2. Repaired dark-theme consistency for the previously light `/shop/` browse-by-collection panels, `/creations/` creation-browse panels, gift-card cards, and inventory image cards.
3. Added inline post-publish QA buttons and QA badges inside `/admin/catalog/` product rows.
4. Added `Run QA` action wiring to call `/api/admin/product-publish-qa` directly from product rows.
5. Added `Fix now` links beside each readiness blocker on `/admin/readiness/`.
6. Added visible crop rectangle guidance on product image thumbnails.
7. Added square crop/focal quick controls in Product Media Workflow.
8. Added bulk recommended image-role assignment controls in Product Media Workflow.
9. Confirmed the upload workflow keeps client-side resize/compression controls visible before upload.
10. Added admin gift-card balance lookup endpoint and UI support through the customer engagement workflow.
11. Added a direct Trust Block Moderation workspace at `/admin/trust-blocks/`.
12. Added public proof/trust-block placement guidance by page/context.
13. Added marketplace export preview workspace at `/admin/marketplace-exports/`.
14. Added `/api/admin/marketplace-export-preview` with image-readiness summaries before CSV export work.
15. Added customer-facing private order-stage photo gallery support on custom order status links.
16. Added admin prompt workflow for adding custom order-stage photo URLs.
17. Added candle/soap spec display support on public product detail pages.
18. Added safety/allergen note display for candle/soap products.
19. Added accountant evidence URL checker endpoint and Accounting page UI mount.
20. Added a compact mobile-admin “Today’s admin tasks” queue linking readiness, failed APIs, inventory, and accounting evidence work.

Validation for this pass:

- Predeploy sanity: PASS
- JavaScript syntax checks: PASS
- CSS brace check: PASS
- One-H1 sanity remains covered by the predeploy pass.
- SEO bake script: PASS, 0 pages changed because no override rows are populated.

Next 20 recommended steps:

1. Add true visual drag handles for crop rectangles, not just focal-click crop guidance.
2. Add actual browser-side image compression size reporting before upload.
3. Add R2 direct upload for order-stage photos instead of URL-only entry.
4. Add moderation approvals before order-stage photos can become public proof.
5. Add gift-card activation after confirmed paid order status.
6. Add gift-card refund/void/reissue controls.
7. Add gift-card public balance lookup with email/code verification.
8. Add marketplace CSV download from the new preview screen.
9. Add channel-specific marketplace validation rules for Etsy/Facebook/Pinterest.
10. Add trust-block placement toggles per page instead of manual context typing.
11. Add public page modules that can request trust blocks by page/context.
12. Add product-card trust/proof badges based on approved trust blocks.
13. Add customer-facing candle/soap safety accordion on product pages.
14. Add admin candle/soap batch search and batch recall notes.
15. Add accountant evidence attachment upload, not only URL checks.
16. Add failed API cards to the mobile admin queue using runtime incident data.
17. Add a Today task API that merges orders, inventory, products, requests, and accounting work.
18. Add product publish QA results persistence so badges survive reloads.
19. Add one-click “fix first image” guided workflow from the QA/readiness cards.
20. Add local SEO landing-page review queue for each major product/service category.
## Build 166 — Roadmap/Gaps Pass Completed

Completed this pass:

1. Added visual drag handles on product image crop rectangles in Product Media Workflow.
2. Added browser-side upload size reporting so image edit preview shows original size, estimated output size, and savings.
3. Added R2 direct upload support for custom order-stage photos, with URL-entry fallback preserved.
4. Added moderation fields for order-stage photos before they can become public proof.
5. Added gift-card activation handling when a connected order is confirmed paid.
6. Added admin gift-card lifecycle actions: activate paid, void, refund/reduce balance, and reissue.
7. Added public gift-card balance lookup with gift-card code plus email verification.
8. Added marketplace CSV download from the preview endpoint.
9. Added channel-specific marketplace validation rules for Etsy, Facebook Marketplace, Pinterest, and manual listings.
10. Added trust-block placement toggle storage by page/context.
11. Added public trust-block context loader module for shop, creations, gift cards, product, gallery, and about pages.
12. Added shop product-card trust/proof badges when approved trust blocks or social-ready proof signals exist.
13. Added customer-facing candle/soap safety accordion on product detail pages.
14. Added candle/soap batch/safety fields to the public detail renderer.
15. Added accounting evidence attachment upload from the evidence checker workflow.
16. Added failed API/runtime incident task cards into the mobile admin queue through the new Today Tasks API.
17. Added `/api/admin/today-tasks` to merge orders, inventory, products, custom requests, accounting, and failed API work.
18. Added persisted product publish QA results in `product_publish_qa_results` so QA badges can survive reloads.
19. Added groundwork for a one-click first-image fix workflow through crop handles, role tools, and existing readiness links.
20. Added `/admin/local-seo-review/` and `/api/admin/local-seo-review` for major category/service landing-page review.

Validation for this pass:

- Predeploy sanity: PASS
- JavaScript syntax checks: PASS
- CSS brace check: PASS
- One-H1 check: PASS
- SEO bake script: PASS, 0 pages changed because no override rows are populated.
- ZIP integrity: PASS

Schema/data notes:

- New tables: `product_publish_qa_results`, `gift_card_admin_events`, `trust_block_placements`, `local_seo_landing_page_reviews`.
- Expanded table: `custom_order_stage_photos` now supports R2 object metadata, moderation status, proof candidate status, and approval fields.
- Gift cards continue to use `gift_cards` and `gift_card_redemptions`; admin lifecycle events now write to `gift_card_admin_events`.
- Public token/private pages remain `noindex,nofollow` where applicable.

Next 20 recommended steps:

1. Add draggable crop-box preview persistence to generated R2 derivative images.
2. Add automatic image compression before upload instead of preview-only reporting.
3. Add customer-facing proof-photo consent prompts tied to uploaded order-stage photos.
4. Add admin moderation queue dedicated only to stage photos and proof candidates.
5. Add automated gift-card email delivery after paid-order activation.
6. Add gift-card redemption entry in admin checkout/order screens.
7. Add public gift-card balance lookup rate limiting and abuse logging.
8. Add marketplace CSV mapping editor for channel-specific field names.
9. Add marketplace CSV image selector so only approved image roles export.
10. Add trust-block placement UI with max item counts and filters visible on each toggle.
11. Add public trust-block sections to remaining local landing pages.
12. Add category-specific proof requirements for jewelry, candles, soap, vintage, and custom work.
13. Add candle/soap label export fields for weight, ingredients, allergens, and batch.
14. Add candle/soap batch recall workflow and customer notification queue.
15. Add accountant evidence ZIP inclusion for uploaded accounting attachments.
16. Add failed-API drilldown cards directly on the mobile dashboard.
17. Add Today task completion/ignore controls so the queue can be cleared.
18. Add product QA history panel beside Catalog product rows.
19. Add guided “fix first image” wizard that opens image role, crop, and public-use fields in order.
20. Add local SEO review scoring for title, meta, H1, internal links, and local proof wording.

## Build 167 update - dark theme, media derivatives, proof moderation, gift cards, marketplace mapping, and SEO scoring

- Repaired the `/creations/` browse panels and main-page Local maker trust block so they stay consistent with the dark Devil n Dove theme instead of using white cards with black text.
- Added product image derivative/crop preview records so focal/crop work can be queued toward real R2 derivative images.
- Added stage-photo proof moderation queue before custom order photos can become public proof.
- Added gift-card redemption endpoint for admin checkout/order workflows, plus public balance lookup attempt logging and rate limiting.
- Added marketplace CSV mapping editor and endpoint for Etsy, Facebook Marketplace, Pinterest, and manual exports.
- Added accountant evidence attachment upload/list endpoint for future accountant ZIP packaging.
- Added Today task complete/ignore persistence and mobile dashboard controls.
- Added local SEO scoring endpoint for landing-page review rows.
- Added product QA history endpoint for future catalog-side QA panels.

### Next direction
Keep moving repeated image proof, marketplace mapping, gift card, evidence, and local SEO review data into D1-backed review queues with safe JSON fallbacks, and keep public pages on one clear H1 with local wording in titles/headings.

## Build 168 — Roadmap/Gaps Pass Completed

Build 168 continues the Devil n Dove roadmap/gaps pass with real R2-backed derivative image records, marketplace image selection persistence, consent-aware stage-photo proof moderation, gift-card delivery/redemption/abuse tooling, accountant evidence attachment packaging, local SEO scoring/quick actions, catalog QA history, candle/soap labels and recall review, trust-placement counts/previews, Today task snoozing, failed API drilldowns, stronger dark-theme regression checks, and a post-deploy smoke-test checklist.

Completed Build 168 items:

1. Product image derivative records can now create an R2 derivative object/key when an R2 bucket is available; otherwise they fall back to safe query-string previews.
2. Marketplace export image selections now persist per product/channel before CSV export.
3. Stage-photo public proof approval now checks for matching public-use media consent.
4. Approved public-use stage photos now generate public-proof candidates for admin review.
5. Order admin screens now include a gift-card redemption panel for order-linked redemptions.
6. Gift-card activation/reissue actions queue email delivery records in the notification outbox.
7. Gift-card lookup abuse dashboard endpoint added for repeated failed public lookups.
8. Accountant export ZIP now includes evidence attachment URL files and attachment rows in the evidence index.
9. Local SEO review rows now show score badges.
10. Local SEO review has quick actions for title/meta review and completion.
11. Product QA history panel was added to catalog product rows.
12. Product Media Workflow now shows image derivative history beside media rows.
13. Candle/soap label CSV export endpoint and admin download action were added.
14. Candle/soap batch recall/watch dashboard endpoint and admin panel were added.
15. Trust-block placement counts were added to placement data.
16. Trust-block preview by page context was added.
17. Today tasks now support snooze, in addition to done/ignore.
18. Mobile admin Today tasks now show failed API/runtime incident drilldown details.
19. Stronger dark-theme regression checks were added for public sections.
20. `POST_DEPLOY_SMOKE_TEST.md` was added for live URL checks after deployment.

Apply `database_upgrade_current_pass.sql` after deployment so the Build 168 D1 tables/columns are available.

Next 20 recommended steps:

1. Add true pixel crop/resizing worker output for derivative images instead of metadata copy fallbacks.
2. Add visual derivative comparison before/after panels.
3. Add direct marketplace export history per channel.
4. Add marketplace image-selection bulk apply from product role order.
5. Add a dedicated public-proof candidate moderation page.
6. Add customer-visible proof consent status inside private order links.
7. Add gift-card delivery template editor.
8. Add gift-card resend delivery action.
9. Add gift-card fraud/abuse severity scoring.
10. Add binary R2 evidence file bundling when Cloudflare zip generation supports it safely.
11. Add local SEO deploy/bake actions for approved title/meta changes.
12. Add local SEO competitor phrase checklist per landing page.
13. Persist product QA panel expanded/collapsed state.
14. Add product QA issue-specific Fix buttons.
15. Add candle/soap label print layout preview.
16. Add candle/soap recall customer notification queue.
17. Add trust-block A/B placement notes and performance tracking.
18. Add Today task snooze duration selector.
19. Add live post-deploy smoke-test result storage in D1.
20. Add public-page dark-theme screenshot review checklist to `IMAGES.md`.


## Build 169 pass — derivative output, proof moderation, marketplace history, gift delivery, local SEO bake queue

Completed in this pass:

1. Enhanced product image derivatives with Cloudflare Image Resizing/R2 output support when enabled.
2. Added before/after derivative comparison panels in Product Media Workflow.
3. Added marketplace export history per channel.
4. Added marketplace bulk image selection from product image role order.
5. Added `/admin/public-proof-candidates/` moderation workspace.
6. Added public proof candidate API for stage photo/manual proof review.
7. Added proof-consent status to private custom order links.
8. Added gift-card delivery template editor and resend queue.
9. Added `/admin/gift-cards/` operations page.
10. Added gift-card lookup abuse severity scoring.
11. Added local SEO bake-action queue for approved title/meta changes.
12. Added local SEO competitor/local phrase checklist API and quick UI action.
13. Added persisted product QA panel state endpoint.
14. Added issue-specific Product QA Fix helper wiring.
15. Added candle/soap recall notification queue endpoint and recall integration.
16. Added Today task snooze duration support.
17. Added post-deploy smoke-test result storage endpoint.
18. Added public-page dark-theme screenshot checklist to `IMAGES.md`.
19. Extended dark-theme CSS for new proof/gift/marketplace panels.
20. Updated schema/reference notes for new D1 tables.

## Build 170 — deployment blocker hardening, image derivatives, marketplace replay, proof promotion, gift-card lockouts, SEO bake scoring, recall matching, smoke tests

### Completed in this pass
- Added `/api/image-derivative` worker route for derivative image serving when Cloudflare Image Resizing is available, with safe original-image fallback.
- Added “Use this derivative as featured image” support to `product-image-derivatives` and Product Media Workflow derivative cards.
- Added marketplace export history snapshot storage plus replay and rollback actions.
- Added marketplace CSV field preview per channel/product row in the export preview UI.
- Connected approved public-proof candidates into `trust_block_items` through a Promote to trust block action.
- Added source filters for public-proof candidates by status, source kind, consent status, product, and custom request.
- Added gift-card delivery sender bridge into `notification_outbox` plus sent/failed status controls.
- Added gift-card delivery history endpoint for order/customer admin views.
- Added gift-card abuse lockout controls and public lookup lockout enforcement.
- Extended the static SEO bake script to consume `data/site/local-seo-bake-actions.json` as deploy-bake input.
- Added competitor/local phrase scoring against live page copy from the local SEO phrase endpoint.
- Persisted product QA blocker events and blocker-resolution history.
- Kept Product QA fix targeting tied to exact admin editor destinations and blocker history records.
- Added candle/soap recall customer matching from orders/order items.
- Added candle/soap recall send-review and notification-draft queue steps before customer notification.
- Prepared accountant export evidence attachment bundling notes and kept safe URL/object-key evidence manifests in ZIP output.
- Added `/admin/post-deploy-smoke-tests/` page with storage for live URL smoke-test results.
- Added dark-theme screenshot/evidence rows via `/api/admin/dark-theme-evidence`.
- Added mobile Today task filters for urgent/product/accounting/request work queues.
- Added `scripts/final_deployment_blocker_check.py` and ran it before packaging.

### Next 20 recommended steps
1. Add real binary-safe accountant evidence bundling for small PDF/image receipts when R2 fetch is explicitly enabled.
2. Add an admin page for dark-theme screenshot evidence review and status changes.
3. Add direct product QA fix buttons that auto-open the exact editor section and focus the target field.
4. Add one-click promotion from public-proof trust block into selected public page placements.
5. Add gift-card delivery provider adapters for the chosen email service.
6. Add gift-card lockout release controls into the visible Gift Card Admin page.
7. Add marketplace export diff view between current selections and replayed history.
8. Add marketplace rollback per whole channel export, not only per product selection.
9. Add public proof candidate customer-consent source linking in the moderation card.
10. Add R2 derivative worker route settings panel with enabled/disabled health checks.
11. Add direct derivative-to-featured buttons inside the product editor image strip, not only the Product Media Workflow.
12. Add recall customer-match preview grouped by product/batch/order before queueing notifications.
13. Add recall “send approval required” gate before notification drafts can leave draft state.
14. Add local SEO bake-action export from D1 to `data/site/local-seo-bake-actions.json`.
15. Add competitor phrase status badges directly on each local SEO landing-page row.
16. Add today-task filters to the desktop admin dashboard too.
17. Add post-deploy smoke-test quick-run buttons for core live URLs.
18. Add deployment-blocker checklist output into `SANITY_HEALTH_CHECK.md` automatically.
19. Add stronger public-page dark-theme screenshot checklist examples into `IMAGES.md` as real sample rows.
20. Add a release notes generator so each zip includes exact changed-file and D1 migration summaries.


## Build 172 hotfix note — D1 migration ledger

The build 171 SQL marker for `schema_migration_ledger` was corrected to include the required `file_name` column. A small live repair file, `database_build171_ledger_repair.sql`, is included for databases where the schema additions already ran but the final ledger insert failed. Do not rerun the entire upgrade only to fix the marker if build 171 ALTER TABLE additions already succeeded; repeated ALTER TABLE ADD COLUMN statements can fail on existing columns in SQLite/D1.

## Build 178 sanity notes

- `/admin/deploy-readiness/` is the final promote-live review page.
- Run Build 178 D1 migration after Build 177 and confirm the ledger marker `build_178_promote_live_controls`.
- Keep one H1 per exposed HTML page; this pass validates the new admin page and existing public/admin pages.
- Marketplace CSV downloads should be preceded by the real export-row validation button.
- Recall notifications should not leave draft status until copy review and signature evidence rows are approved.

