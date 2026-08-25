# Build 331 — Accounting Vendors Read Extraction

`/api/admin/accounting-vendors` GET now delegates to `accountingVendorsReadService.js` and no longer calls `ensureAccountingVendorsTable()`.

The read reports `schema_ready`, missing tables/columns and `request_time_schema_mutation=false`. Explicit vendor POST/save behavior still owns its existing schema ensure and write compatibility.

Dedicated contract: `/api/admin/contracts/accounting-vendors-read`.
