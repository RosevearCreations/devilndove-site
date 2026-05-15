# Repo Rules — Devil n Dove

Current sync: 2026-05-14 — Build 125.

## Required rules for future passes
1. Update Markdown when code/schema changes.
2. Update schema references when D1 tables, columns, indexes, or constraints change.
3. Keep one H1 per exposed public/admin HTML page.
4. Run JavaScript syntax checks before ZIP handoff.
5. Keep private import/accounting data out of public `/data/` paths.
6. Prefer D1 for operational truth; keep JSON as fallback/seed/export until migrated.
7. Store money as integer cents in D1 and show dollars in the UI.
8. Do not overwrite inventory costs blindly; use review and cost history where possible.
9. Do not claim tax/accountant readiness until reconciliation, close, HST review, and export validation are complete.
10. Keep retired files in `/archive/` and active files in predictable paths.

## Deployment rules
- Apply `database_upgrade_current_pass.sql` before relying on new D1-backed admin panels.
- Record applied SQL in the Migration Ledger.
- Run Release Sanity before declaring a build ready.
- Re-run Tools/Supplies inventory sync after catalog JSON/D1 changes.

## Build 125 note

Build 125 keeps Amazon order/cost data private, adds admin review/apply controls for Amazon staging rows, records inventory cost history, expands reconciliation and journal guardrails, and adds local-intent SEO pages plus `sitemap.xml`. Keep schema files and active Markdown updated on every pass.
