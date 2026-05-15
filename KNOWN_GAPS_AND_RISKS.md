# Known Gaps and Risks — Current Active List

Current sync: 2026-05-14 — Build 124.

## Highest-priority gaps still open
1. The accounting backend is stronger, but it is still not a finished tax-filing system.
2. SQL files still need to be applied in Cloudflare D1 and recorded in the new migration ledger.
3. Statement import provider profiles now exist, but real bank/PayPal/Stripe/Square/Etsy sample files still need testing.
4. Reconciliation has confidence buckets, but still needs the full exception queue workflow.
5. Payment application screens need the next pass to connect orders, deposits, payouts, fees, refunds, gift cards, and journals.
6. Journal generation exists in pieces, but full auto-posting and balanced-entry enforcement still need more work.
7. Period close still needs lock/reopen controls and audit history.
8. HST/sales-tax review screens need final worksheet/export behaviour before accountant handoff.
9. Accountant export still needs one packaged export with ledgers, statements, taxes, attachments, and unresolved notes.
10. Some catalog/product areas still use JSON as a bridge while D1 becomes the long-term source of truth.
11. Product variants/options are not complete enough for a full ecommerce app.
12. Media management still needs retire/replace/broken-link lifecycle controls.
13. Public SEO needs more product-intent and local-intent landing pages.
14. Amazon purchase data must remain private and review-first; do not deploy raw order reports under `/data/`.
15. Fuzzy Amazon matching can still be wrong when product titles are generic.

## Current guardrails
- Keep one H1 per exposed HTML page.
- Update Markdown and schema files on every code pass.
- Prefer D1 for authoritative operational data.
- Keep JSON only as fallback, seed, export, or static catalog bridge until migrated.
- Store money in cents in D1, but display dollars in admin forms.
- Treat current owned tools/supplies as at least 1 stock unit unless manually retired.
- Use package math for consumables: for example, 1 package can equal 100 sheets.
- Do not promise accountant/tax filing readiness until reconciliation, close, tax review, and export validation are complete.

## Recently reduced risks
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
