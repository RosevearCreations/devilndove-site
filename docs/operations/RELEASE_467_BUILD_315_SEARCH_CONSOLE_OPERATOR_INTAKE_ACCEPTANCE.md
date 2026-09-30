# Release 467 Build 315 — Search Console Operator Intake Acceptance

Build 315 starts from exact Build 314 Development/Production GREEN and exercises the existing **operator-controlled Search Console CSV intake contract** without manufacturing discovery evidence.

The existing intake route remains `/api/admin/search-console-import`. It accepts a real Search Console CSV only when an administrator explicitly supplies one. Build 315 adds current acceptance visibility for canonical schema readiness, current batch/live-row consistency, audit traceability, safe batch revert capability, and reviewed-story/Product attribution.

## Acceptance states

- **REAL_OPERATOR_EVIDENCE_ACCEPTED** — real staged rows exist, current batches reconcile to live rows, import audit evidence exists, attribution remains factual, and there are no orphan rows or foreign-key violations.
- **EVIDENCE_PENDING_NO_REAL_EXPORT** — no real operator Search Console export is currently staged. This is a valid factual state and does not create placeholder clicks, impressions, queries or batches.
- **TRACEABILITY_REVIEW_REQUIRED** — current staged data exists but batch/audit integrity requires operator review.
- **SCHEMA_BLOCKED** — canonical Search Console tables are unavailable; request-time schema repair remains forbidden.

Delete/revert remains explicitly operator-controlled through the existing `delete_batch` action and writes `search_console_delete_batch` audit evidence. Build 315 itself performs **read-only Development D1 acceptance measurement** and does not import or delete any Search Console data.

## Boundaries

- no synthetic Search Console rows;
- no automatic CSV/API import;
- no request-time DDL;
- no automatic SEO recommendation generation or SEO apply;
- no IndexNow/provider execution;
- no Production D1 contact;
- no R2, Inventory or Finance mutation.

Next: **Build 316 — Buyer Discovery Evidence Interpretation & SEO Review Queue**.
