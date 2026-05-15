# New Chat Status — Devil n Dove

Current sync: 2026-05-14 — Build 124.

## Latest build focus
This pass added backend safety and admin visibility around migrations, release checks, accounting statement profiles, statement import matching confidence, inventory movement normalization, and Tools/Supplies stock/cost/unit handling.

## What was completed
1. Added an admin D1 migration ledger API so applied SQL files can be recorded instead of guessed.
2. Added the Operations-page Migration Ledger panel for marking SQL files applied, skipped, failed, or pending review.
3. Added an admin release-sanity API that checks public pages, H1/title/meta status, catalog/inventory counts, journal balance, reconciliation exceptions, runtime incidents, and migration status.
4. Added the Operations-page Release Sanity panel so pre-deploy checks can be run from the browser.
5. Expanded the database sanity API with critical checks, index checks, catalog-vs-inventory counts, journal-balance checks, and migration ledger summary.
6. Improved the Accounting Backend sanity UI so failures and supporting details are visible instead of hidden in raw JSON.
7. Added schema support for the schema_migration_ledger table across the active SQL reference files and the current-pass migration.
8. Added statement provider profile storage for bank, PayPal, Stripe, Square, Etsy, and manual CSV mappings.
9. Added an Accounting-page Provider Profiles UI to seed, view, and edit statement import mappings.
10. Updated statement import APIs so provider profiles are available to the import screen and seeded when missing.
11. Allowed the manual CSV provider as a first-class statement-import provider.
12. Added reconciliation match confidence buckets for imported statement totals: exact, likely, partial, and manual_review.
13. Improved statement-import auto-match detail JSON so confidence, bucket, imported row count, and difference are recorded for later review.
14. Mapped inventory movement aliases into schema-safe movement names while preserving the original name in the movement note.
15. Kept Tools/Supplies manual inventory creation from saving blank or zero on-hand quantities; current owned items default to at least 1.
16. Added unit_cost_dollars to inventory API responses so admin screens can show 33.99 while D1 stores 3399 cents.
17. Added a quick D1 inventory stock/unit fix SQL file for existing rows, including package math such as 1 DTF package = 100 sheets.
18. Updated movement CHECK constraints in active schema files so older and newer movement names are represented consistently.
19. Refined admin CSS for status pills, sanity panels, and mobile-friendly migration forms.
20. Ran syntax and public-page sanity checks: 238 JavaScript files passed node --check, and exposed HTML pages had one H1 plus title/meta description.

## Immediate deployment checklist
1. Deploy the new ZIP to Cloudflare Pages.
2. Apply `database_upgrade_current_pass.sql` to the D1 database.
3. Open `/admin/operations/` and use the Migration Ledger panel to mark the SQL file applied.
4. Use the Release Sanity panel to check public pages, D1 counts, migration status, journal balance, and open exceptions.
5. Open `/admin/catalog/` and run **Sync all tools + supplies**.
6. Verify `site_item_inventory` shows about 399 tools and 498 supplies.
7. Open `/admin/accounting/` and seed/check Statement Provider Profiles.

## Next 20 steps
1. Run the new release sanity panel on production after deployment and record the result in the migration ledger.
2. Apply database_upgrade_current_pass.sql in Cloudflare D1, then mark it applied in the Operations migration ledger.
3. Click Sync all tools + supplies again, then verify site_item_inventory shows about 399 tools and 498 supplies.
4. Add a one-click inventory sync result screen that shows inserted, updated, skipped, and failed rows without opening the console.
5. Add an Amazon approved-import review screen for amazon_purchase_import_staging with approve, hold, reject, and link-to-inventory controls.
6. Add cost-history rows instead of overwriting the latest inventory cost when approved Amazon purchases are applied.
7. Build the reconciliation exception queue with assign, note, resolve, reopen, export, and accountant-review statuses.
8. Finish payment application screens connecting orders, deposits, refunds, processor payouts, gift cards, fees, and journals.
9. Expand automatic journal-line generation for sales, discounts, shipping, COGS, inventory adjustments, fees, refunds, write-offs, and HST.
10. Add posting validation that blocks unbalanced journal entries and displays the exact debit/credit difference.
11. Finish period-close lock/reopen controls with audit trail and admin-only reopen reason.
12. Build the HST review worksheet comparing taxable sales, exempt sales, collected tax, refunded tax, and remittance-ready totals.
13. Create accountant export package v2 with GL, trial balance, P&L, balance sheet support, statement import summary, HST worksheet, attachments index, and unresolved issues.
14. Move active creations/products from JSON-first fallback into D1 as primary catalog authority, leaving JSON only as emergency fallback/export.
15. Add product variant/option tables for size, colour, material, custom request status, SKU, stock, price, and media per variant.
16. Add admin-managed homepage, gallery, shop, and featured-creation content blocks so public marketing content no longer depends on hand-edited JSON.
17. Add media lifecycle controls: upload, crop/alt review, public/private flag, replace, retire unused image, and broken-link scan.
18. Create local-intent landing pages for handmade jewelry, polymer clay earrings, custom gifts, laser engraving, vintage finds, and workshop-made gifts in Southern Ontario.
19. Add structured data review for Organization, WebSite, Product, BreadcrumbList, and local contact details where appropriate.
20. Add mobile admin quick actions: draft product, add photos, adjust stock, record expense, scan receipt, and add customer note.

## Important notes for the next assistant
- Active API files live under `/functions/api/`.
- Public/admin browser scripts live under `/public/js/`.
- Keep raw Amazon CSV/order review data private; public JSON should not expose order history or private purchase reports.
- `catalog_items` is the catalog/source snapshot; `site_item_inventory` is the working inventory table.
- Money is stored in cents in D1; admin screens should display dollars.
- Current Tools/Supplies rows represent owned items and should default to at least 1 on hand unless retired.
