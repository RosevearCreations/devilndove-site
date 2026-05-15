# Sanity Health Check

Current sync: 2026-05-14 — Build 124.

## Automated checks run in this pass
- JavaScript syntax check: 238 `.js` files passed `node --check`.
- Public HTML check: exposed non-archive pages have exactly one `<h1>`, a `<title>`, and a meta description.
- Admin CSS was updated for release sanity panels, migration ledger controls, status pills, and mobile layout.

## New admin checks added
Use `/admin/operations/`:
1. **Migration Ledger** — record whether each SQL file was applied, skipped, failed, or needs review.
2. **Release Sanity** — check public pages, catalog counts, inventory counts, journal balance, reconciliation exceptions, runtime incidents, and migration status.

## Manual browser checks still recommended
- Home, Shop, Gallery, Creations, Tools, Supplies, Movies, Members, Cart, Login, Register.
- Admin dashboard, Accounting, Catalog, Orders, Members, Analytics, Operations, Movies, Mobile admin.
- Statement import, provider profiles, reconciliation exceptions, journal entry review, product creation, product image review, and member login.

## D1 checks after deployment
```sql
SELECT source_type, COUNT(*) AS total,
       SUM(CASE WHEN on_hand_quantity >= 1 THEN 1 ELSE 0 END) AS in_stock_rows,
       SUM(CASE WHEN unit_cost_cents > 0 THEN 1 ELSE 0 END) AS with_unit_cost,
       SUM(CASE WHEN usage_units_per_stock_unit > 1 THEN 1 ELSE 0 END) AS package_sized_rows
FROM site_item_inventory
WHERE source_type IN ('tool','supply')
GROUP BY source_type;
```

Expected row totals should be close to 399 tools and 498 supplies after sync.

## Spot-check DTF package math
```sql
SELECT item_name, on_hand_quantity, unit_cost_cents, stock_unit_label, usage_unit_label, usage_units_per_stock_unit
FROM site_item_inventory
WHERE LOWER(item_name) LIKE '%dtf%'
LIMIT 10;
```

Expected pattern: cost stored as cents, admin displayed as dollars; DTF should read approximately `1 package = 100 sheet`.

## Every-pass checklist
1. Run JS syntax checks.
2. Check one H1/title/meta per exposed page.
3. Check missing script/style references.
4. Check active JSON fallback paths.
5. Check schema drift and current-pass SQL.
6. Check CSS drift on public and admin pages.
7. Check local/product SEO wording.
8. Check API routes under `/functions/api/`.
9. Keep raw private import data out of deployable `/data/`.
10. ZIP and verify handoff file.
