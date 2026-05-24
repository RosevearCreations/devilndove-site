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
