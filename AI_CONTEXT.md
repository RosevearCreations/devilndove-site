# AI Context — Devil n Dove Build 137

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
