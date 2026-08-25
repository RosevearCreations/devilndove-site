# Build 317 Changed Files — Accounting Write-Offs Read Extraction

Baseline: `343a67de711234f193614f38e83a46122e205197` (Build 316 completed handoff).

Intended Build 317 boundary:

1. `BUILD317_CHANGED_FILES.md`
2. `BUILD317_VALIDATION.md`
3. `docs/architecture/BUILD317_ACCOUNTING_WRITEOFFS_READ_EXTRACTION.md`
4. `functions/api/_lib/accountingWriteoffsReadService.js`
5. `functions/api/admin/accounting-writeoffs.js`
6. `functions/api/admin/contracts/accounting-writeoffs-read.js`
7. `public/js/core/dd-module-contracts.mjs`
8. `public/js/core/dd-module-service-adapters.mjs`
9. `scripts/build317_accounting_writeoffs_read_extraction_test.py`

No SQL/schema, Cloudflare config, R2, Production, Commerce runtime, Core runtime implementation, Operations loader, Inventory authority, Creative consumer, order/payment API, or Accounting write-side semantics belong in this build.
