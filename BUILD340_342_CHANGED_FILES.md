# Builds 340–342 Changed Files

## Build 340 — Accounting reconciliation read

- `functions/api/_lib/accountingReconciliationReadService.js` — new non-mutating Accounting read service.
- `functions/api/admin/accounting-reconciliation.js` — legacy GET delegates to owned read service; POST review write remains compatibility-owned.
- `functions/api/admin/contracts/accounting-reconciliation-read.js` — new GET-only contract.

## Build 341 — Platform DB sanity read

- `functions/api/_lib/platformDbSanityReadService.js` — new Platform-owned application-wide DB sanity service.
- `functions/api/admin/db-sanity.js` — thin legacy compatibility GET wrapper.
- `functions/api/admin/contracts/platform-db-sanity-read.js` — new GET-only contract.

## Build 342 — Accounting close-workflow read

- `functions/api/_lib/accountingCloseWorkflowReadService.js` — new schema-aware, non-mutating close-workflow read service.
- `functions/api/admin/accounting-close-workflow.js` — GET/CSV/ZIP read path delegates to service; POST retains explicit write-side `ensureSchema()` compatibility.
- `functions/api/admin/contracts/accounting-close-workflow-read.js` — new GET-only contract.

## Shared runtime / validation / documentation

- `public/js/core/dd-module-contracts.mjs`
- `public/js/core/dd-module-service-adapters.mjs`
- `scripts/build340_342_accounting_read_batch_test.py`
- `BUILD337_339_VALIDATION.md`
- `BUILD340_342_VALIDATION.md`
- `BUILD340_342_CHANGED_FILES.md`
- `AI_CONTEXT.md`
- `docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md`
- `docs/architecture/BUILD340_ACCOUNTING_RECONCILIATION_READ_EXTRACTION.md`
- `docs/architecture/BUILD341_PLATFORM_DB_SANITY_READ_EXTRACTION.md`
- `docs/architecture/BUILD342_ACCOUNTING_CLOSE_WORKFLOW_READ_EXTRACTION.md`

No top-level Business & Administration runtime activation, no Production promotion, and no Accounting mutation-authority move are included.
