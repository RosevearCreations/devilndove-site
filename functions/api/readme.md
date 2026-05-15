# Functions API Notes

Current sync: 2026-05-14 — Build 124.

## Active API surface
Cloudflare Pages Functions are under `/functions/api/`. Admin endpoints require admin authentication through the existing admin audit/auth helpers.

## Added/updated admin endpoints this pass
- `/api/admin/migration-ledger` — record and list SQL migration status.
- `/api/admin/release-sanity` — run public page, D1, accounting, incident, and migration checks.
- `/api/admin/accounting-statement-provider-profiles` — seed/list/save statement CSV provider mappings.
- `/api/admin/accounting-statement-imports` — now returns provider profiles for the import UI.
- `/api/admin/db-sanity` — now includes critical checks and count summaries.
- `/api/admin/site-item-inventory` — normalizes movement types, returns dollar display values, and guards current stock defaults.

## Money rule
APIs should store cents in D1 and return display helpers where needed. Admin forms should accept dollars and convert to cents before saving.

## Private data rule
Do not expose raw CSV imports, Amazon order history, or accounting reports through public static files. Use authenticated admin endpoints and D1 staging tables.
