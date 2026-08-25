# Build 335 — Accounting Reconciliation Exceptions Read Extraction

`GET /api/admin/accounting-reconciliation-exceptions` now uses a schema-aware Accounting read service and no longer invokes the statement-import schema ensure. Explicit exception status/update POST retains existing write-side compatibility.
