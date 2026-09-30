# Release 467 Build 321 — Search Console Real Export Intake Continuity II

Build 321 starts from exact Build 320 Development/Production GREEN and rechecks the existing operator-controlled Search Console staging lane without creating discovery evidence.

The canonical intake remains `/api/admin/search-console-import`. A new import now requires an explicit operator confirmation that the CSV is a **real Google Search Console Performance export** and must contain recognizable Page, Clicks, Impressions, CTR and Position header groups. File uploads remain CSV-only. Query, country, device and date fields remain optional factual dimensions.

## Continuity states

- **REAL_OPERATOR_EVIDENCE_ACCEPTED** — current staged rows are operator-bound, CSV-sourced, batch/live-row counts reconcile, import audit evidence exists, metrics are non-negative and relational integrity is clean.
- **EVIDENCE_PENDING_NO_REAL_EXPORT** — no current real Search Console export is staged. This is a valid factual state. Build 321 does not create placeholder batches, queries, clicks or impressions.
- **TRACEABILITY_REVIEW_REQUIRED** — staged data exists but operator/source/audit/batch integrity cannot support a real-evidence claim.
- **SCHEMA_BLOCKED** — canonical Search Console tables are unavailable. Request-time schema repair remains forbidden.

Delete/revert remains an explicit operator action through `delete_batch` and preserves the `search_console_delete_batch` audit trail. Build 321 CI only reads Development D1 and never imports or deletes rows.

## Boundaries

- no synthetic Search Console rows, clicks, impressions, queries or batches;
- no automatic CSV/API import;
- no Production D1 contact;
- no request-time DDL;
- no automatic SEO wording, SEO application, IndexNow or provider execution;
- no R2, Inventory or Finance mutation.

Next: **Build 322 — Buyer Discovery Attribution & SEO Review Evidence Continuity**.
