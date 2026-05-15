# AI Context — Devil n Dove

Current sync: 2026-05-14 — Build 124.

## Project context
Devil n Dove is a handmade/vintage/storefront and admin app running on Cloudflare Pages with Pages Functions and D1. The user wants code, Markdown, and schema updated together on every pass.

## Current source-of-truth rules
- D1 should become the authority for operational data.
- JSON remains for fallback, seed, export, or static bridge data until migrated.
- `/functions/api/` is the active API path.
- `/public/js/` holds active browser scripts.
- Keep raw Amazon order data private.

## Latest completed work
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

## Next priorities
- Run the new release sanity panel on production after deployment and record the result in the migration ledger.
- Apply database_upgrade_current_pass.sql in Cloudflare D1, then mark it applied in the Operations migration ledger.
- Click Sync all tools + supplies again, then verify site_item_inventory shows about 399 tools and 498 supplies.
- Add a one-click inventory sync result screen that shows inserted, updated, skipped, and failed rows without opening the console.
- Add an Amazon approved-import review screen for amazon_purchase_import_staging with approve, hold, reject, and link-to-inventory controls.
- Add cost-history rows instead of overwriting the latest inventory cost when approved Amazon purchases are applied.
- Build the reconciliation exception queue with assign, note, resolve, reopen, export, and accountant-review statuses.
- Finish payment application screens connecting orders, deposits, refunds, processor payouts, gift cards, fees, and journals.
- Expand automatic journal-line generation for sales, discounts, shipping, COGS, inventory adjustments, fees, refunds, write-offs, and HST.
- Add posting validation that blocks unbalanced journal entries and displays the exact debit/credit difference.

## Style and safety rules
- Keep one clear H1 per public page.
- Store money in cents in D1; display dollars in admin screens.
- Default current owned Tools/Supplies to at least 1 stock unit.
- Use package math for consumables.
- Do not claim accountant/tax-filing readiness until reconciliation, close, tax review, and export are complete.
