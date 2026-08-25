# Build 328 — Accounting GIFI Summary Read Extraction

Build 328 retires request-time General Ledger schema mutation from `GET /api/admin/accounting-gifi-summary`.

The legacy GET now delegates to `functions/api/_lib/accountingGifiSummaryReadService.js`, also exposed through `GET /api/admin/contracts/accounting-gifi-summary-read`.

The service reports `schema_ready`, `missing_tables`, `missing_columns` and `request_time_schema_mutation=false`. It never runs `CREATE TABLE` or `ALTER TABLE`. Existing CSV download behavior remains on the legacy route, generated from the service result.

General Ledger mapping data remains Accounting-owned. Missing schema belongs to the separate schema-parity workflow.
