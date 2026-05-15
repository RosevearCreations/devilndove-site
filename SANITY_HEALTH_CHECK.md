# Sanity Health Check

Current sync: 2026-05-10 cleanup pass.

## Checks to run every pass
1. JavaScript syntax check for every `.js` file.
2. HTML check that every exposed page has exactly one `<h1>`.
3. Missing script/style reference check for all HTML pages.
4. Data-source check for active JSON fallbacks under `/data/`.
5. Schema sync check for main SQL files and the current-pass migration file.
6. CSS drift check on public pages and admin department pages.
7. SEO check for title, description, one clear H1, and locally useful wording.
8. API route check that calls point to `/api/...` backed by `/functions/api/...`.
9. Archive check so retired docs/code are not confused with active files.
10. ZIP integrity check before handoff.

## Current pass focus
- Active API source is `/functions/api/`.
- Active browser scripts are `/public/js/` and `/js/main.js`.
- Active data bridges are `/data/movies/`, `/data/supplies/`, `/data/toolshed/`, `/data/itemsforsale/`, and `/data/site/`.
- `database_upgrade_current_pass.sql` is intentionally clean and ready for the next migration batch.

## Manual browser checks still recommended
- Home, Shop, Gallery, Creations, Tools, Supplies, Movies, Members, Cart, Login, Register.
- Admin dashboard, Accounting, Catalog, Orders, Members, Analytics, Operations, Movies, Mobile admin.
- Statement import, reconciliation exceptions, journal entry review, product creation, product image review, and member login.


## Amazon Import Sanity Check — 2026-05-11

Checked source files:
- Amazon CSV rows: 1352
- Tools inventory rows: 399
- Supplies inventory rows: 498

Match results:
- High: 263
- Medium: 208
- Review: 194
- Unmatched: 687

Output package:
- `PRIVATE IMPORT PACKAGE: amazon_inventory_import_package.zip`
- `database_amazon_purchase_import_staging.sql`
- `database_upgrade_current_pass.sql`

No production inventory data was overwritten.


## Private Import Data Safety Note — 2026-05-11

Amazon transaction CSVs and review spreadsheets are **not** stored inside the deployable website tree because `/data/` assets may become publicly reachable after Cloudflare Pages deployment. Keep the generated Amazon import package private and load approved rows into the database through an admin/import workflow instead.


## Tools/Supplies inventory sync sanity — 2026-05-14

After deploying this build and running Sync all tools + supplies, check D1:

```sql
SELECT source_type, COUNT(*) AS total,
       SUM(CASE WHEN amazon_url IS NOT NULL AND TRIM(amazon_url) <> '' THEN 1 ELSE 0 END) AS with_amazon_url,
       SUM(CASE WHEN unit_cost_cents > 0 THEN 1 ELSE 0 END) AS with_unit_cost
FROM site_item_inventory
WHERE source_type IN ('tool','supply')
GROUP BY source_type;
```

Expected row totals should be close to 399 tools and 498 supplies. Unit-cost counts should increase after the admin sync because Amazon CSV match details are now available to the admin-side sync process.

## 2026-05-14 inventory sync sanity checks

After deploying the corrected inventory build and clicking **Sync all tools + supplies**, run:

```sql
SELECT
  source_type,
  COUNT(*) AS total,
  SUM(CASE WHEN on_hand_quantity >= 1 THEN 1 ELSE 0 END) AS in_stock_rows,
  SUM(CASE WHEN unit_cost_cents > 0 THEN 1 ELSE 0 END) AS with_unit_cost,
  SUM(CASE WHEN usage_units_per_stock_unit > 1 THEN 1 ELSE 0 END) AS package_sized_rows
FROM site_item_inventory
WHERE source_type IN ('tool','supply')
GROUP BY source_type;
```

Spot-check DTF sheets:

```sql
SELECT item_name, on_hand_quantity, unit_cost_cents, stock_unit_label, usage_unit_label, usage_units_per_stock_unit
FROM site_item_inventory
WHERE LOWER(item_name) LIKE '%dtf%'
LIMIT 10;
```

Expected pattern: cost stored as cents, admin displayed as dollars; DTF should read approximately `1 package = 100 sheet`.
