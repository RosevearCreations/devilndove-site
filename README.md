# Devil n Dove Site — Current Build

Current sync: 2026-05-14 — Build 125.

## Active purpose
This repository powers the Devil n Dove public storefront, admin app, member area, catalog tools, accounting workflow, and Cloudflare Pages Functions backend.

## Active structure
- `/functions/api/` — active Cloudflare Pages Functions API surface.
- `/public/js/` — browser-side admin/member/storefront scripts.
- `/admin/*/index.html` — admin department pages.
- `/data/` — approved JSON fallbacks/import sources that have not yet fully moved to D1.
- `/database_*.sql` — schema references and migration support.
- `/archive/` — retired historical files and snapshots.

## What changed in this build
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

## Deploy order
1. Deploy the ZIP.
2. Apply `database_upgrade_current_pass.sql` to D1.
3. Mark the migration in `/admin/operations/`.
4. Run Release Sanity in `/admin/operations/`.
5. Run Tools/Supplies inventory sync in `/admin/catalog/`.
6. Verify Accounting Provider Profiles in `/admin/accounting/`.

## Important active docs
- `DEVELOPMENT_ROADMAP.md` — completed 20 and next 20 logical steps.
- `KNOWN_GAPS_AND_RISKS.md` — current risks and guardrails.
- `SANITY_HEALTH_CHECK.md` — checks for each build.
- `DATABASE_SCHEMA_REFERENCE.md` — schema and migration notes.
- `REPO_BASE_GUIDE.md` — current repo map.
- `REPO_RULES.md` — rules for future passes.
- `LOCAL_SEO_PLAYBOOK.md` — search/local visibility guidance.
- `AI_CONTEXT.md` and `NEW_CHAT_STATUS.md` — handoff notes for a fresh chat.

## Private import safety
Amazon transaction CSVs, review spreadsheets, and private purchase reports must not be deployed in public `/data/` paths. Import approved rows through admin/D1 workflows only.
## Build 125 update

Build 125 adds the Amazon purchase review/apply workflow, inventory cost history, reconciliation exception queue controls, journal validation/posting guardrails, six local-intent SEO pages, sitemap generation, and updated schema/Markdown files. After deployment, apply `database_upgrade_current_pass.sql`, mark the migration in `/admin/operations/`, and run Tools/Supplies sync from `/admin/catalog/`.

