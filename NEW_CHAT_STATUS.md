# New Chat Status

Current build status as of 2026-05-10: cleanup/refoundation pass completed.

## Ready for next chat
Ask to continue from the next 20 steps in `DEVELOPMENT_ROADMAP.md`.

## Safest next implementation target
Start with the D1 migration ledger/admin runner and DB sanity dashboard, then move into reconciliation confidence scoring and payment application.

## Important files
- `README.md`
- `DEVELOPMENT_ROADMAP.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `DATABASE_SCHEMA_REFERENCE.md`
- `SANITY_HEALTH_CHECK.md`
- `database_upgrade_current_pass.sql`
- `functions/api/admin/*accounting*`
- `public/js/admin-accounting*.js`
- `admin/accounting/index.html`

## Cleanup reminder
Archived docs are history only. Active docs are now intentionally shorter and clearer.


## Latest Amazon Import Status — 2026-05-11

A review-first Amazon purchase import package has been generated from the uploaded Amazon Business CSV.

Important files:
- `README_AMAZON_INVENTORY_IMPORT.md` inside the private import package
- `amazon_inventory_purchase_matches_all.csv` inside the private import package
- `amazon_inventory_high_confidence_stage_candidates.csv` inside the private import package
- `amazon_inventory_purchase_summary_by_item.csv` inside the private import package
- `database_amazon_purchase_import_staging.sql`

Current rule:
- Stage and review first.
- Approve rows before applying them to live inventory or accounting.


## Private Import Data Safety Note — 2026-05-11

Amazon transaction CSVs and review spreadsheets are **not** stored inside the deployable website tree because `/data/` assets may become publicly reachable after Cloudflare Pages deployment. Keep the generated Amazon import package private and load approved rows into the database through an admin/import workflow instead.

## Amazon inventory purchase matching pass — 2026-05-14

- Rechecked Amazon Business order CSV against Toolshed and Supplies by cleaned product title instead of exact filename/ID matching.
- Patched 572 conservative safe matches into inventory JSON Amazon fields.
- Generated private Amazon match reports for review and database import planning. The public-safe build does not keep those reports under `/data/imports`.
- Rows marked `needs_review` or `weak_candidate` were not written into live JSON fields because the best candidate was ambiguous or too weak.


## Tools/Supplies inventory sync repair — 2026-05-14

Fixed the split between `catalog_items` and `site_item_inventory`:
- `catalog_items` had 399 tools and 498 supplies, but the Inventory Operations screen was reading `site_item_inventory`, which could show only previously copied rows.
- Added a working `sync_catalog` action to `/api/admin/site-item-inventory` so Tools/Supplies can be copied from `catalog_items` into `site_item_inventory`.
- Raised the product resource picker limit from 500 to 1200 so 498 supplies no longer crowd out the 399 tools.
- Added searchable tool/supply seed filtering in the Inventory Operations form.
- Added private admin-side Amazon CSV match data module at `functions/api/admin/_amazonInventoryMatches.js` so admin sync can fill Amazon URL, ASIN, supplier, latest purchase notes, unit cost, stock unit, usage unit, and usage-units-per-stock without putting the full Amazon CSV/report under public `/data/`.

Next action after deploy:
1. Open `/admin/catalog/`.
2. In Tools & Supplies Inventory Operations, click **Sync all tools + supplies**.
3. Verify D1 `site_item_inventory` has about 897 rows and that unit-cost counts increased.
