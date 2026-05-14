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
