# Build 343 — Accounting Year-End Close Read Extraction

`/api/admin/accounting-year-end-close` now delegates GET/JSON/CSV/CSV-pack reads to `accountingYearEndCloseReadService.js`.

The service composes existing non-mutating Accounting authorities for period locks, GIFI notes, reconciliation, attachments, statement imports and General Ledger state. It reports combined `schema_ready`, `missing_tables`, and `missing_columns` and performs no request-time DDL.

No mutation authority moves. Business & Administration remains inactive/domain-bridge.
