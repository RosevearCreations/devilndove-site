# Build 344 — Accounting Monthly Summary Export Read Extraction

`/api/admin/accounting-monthly-summary-export` now renders its CSV from an Accounting-owned schema-aware read service.

The service dynamically resolves the current order identity/amount alternatives, reports missing tables/columns explicitly, and never mutates schema. The legacy CSV route preserves download behavior and adds `x-dd-build`, `x-dd-owner`, `x-dd-schema-ready`, and `x-dd-request-time-schema-mutation` diagnostic headers.

A JSON contract at `/api/admin/contracts/accounting-monthly-summary-export-read` exposes the same read facts for runtime validation.
