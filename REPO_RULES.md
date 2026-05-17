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

## Runtime incident review rule - Build 126

Do not clear Release Sanity runtime warnings by marking everything resolved blindly. Group incidents first, fix the recurring endpoint or schema drift, then resolve only the rows tied to the fixed cause. Use `ignored` only for known harmless stale incidents.

## Build 128 rule addition

Public storefront endpoints must not hard-reference optional D1 columns. If a column may not exist on the deployed D1 database, verify it before building SQL and provide a safe default in the response payload.

## Build 129 repo rule additions

- Do not add private Amazon order/cost CSVs or match reports under public static folders such as `/data/`.
- New D1-sensitive endpoints should either verify optional columns before use or degrade safely with a clear runtime incident.
- Any new admin import workflow must be review-first and must update Markdown plus schema references in the same pass.

## Build 130 rule reminder

Before referencing a newer D1 column from a public endpoint, confirm it exists. Public pages should degrade safely instead of creating repeated runtime incidents.

## Build 131 repo rule update

Do not add private Amazon order exports, match reports, cost reports, or transaction CSV/XLSX files under public `/data/`. Use private D1 staging/admin import tools instead. Before deploy, run the local predeploy sanity script or equivalent checks for H1/meta, CSS drift, local references, and public-data privacy.

## Build 132 rule addition

For mobile navigation, keep the shared menu compact and grouped. Avoid adding more always-visible top-level mobile links; place secondary links inside grouped expandable sections so phone screens do not become a long menu wall.

## Build 133 note

Build 133 rule reminder: do not expose private Amazon/order CSV files under public `/data/`; Search Console imports should go to D1 staging tables, not public JSON.
