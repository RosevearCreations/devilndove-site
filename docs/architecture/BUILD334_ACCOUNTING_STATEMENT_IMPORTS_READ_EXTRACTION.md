# Build 334 — Accounting Statement Imports Read Extraction

`GET /api/admin/accounting-statement-imports` now delegates to the Accounting-owned `accounting-statement-imports-read` service. GET no longer creates statement-import/reconciliation tables or seeds provider profiles. CSV import POST retains its existing explicit write-side ensures and default-profile materialization.
