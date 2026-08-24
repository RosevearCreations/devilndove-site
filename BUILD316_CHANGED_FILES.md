# Build 316 Changed Files

Baseline:

```text
2edcc42865fe818baa5091f6db55c94dcb6c5363
Build 315 set completed modular handoff context
```

Build 316 is intentionally bounded to these 11 files:

1. `AI_CONTEXT.md`
2. `BUILD316_CHANGED_FILES.md`
3. `BUILD316_VALIDATION.md`
4. `docs/architecture/BUILD316_ACCOUNTING_EXPENSES_READ_CORRECTION.md`
5. `docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md`
6. `functions/api/_lib/accountingExpensesReadService.js`
7. `functions/api/admin/accounting-expenses.js`
8. `functions/api/admin/contracts/accounting-expenses-read.js`
9. `public/js/core/dd-module-contracts.mjs`
10. `public/js/core/dd-module-service-adapters.mjs`
11. `scripts/build316_accounting_expenses_read_correction_test.py`

Explicitly outside the Build 316 boundary:

- `public/js/core/dd-admin-module-runtime.mjs`
- `public/js/core/dd-application-module-groups.mjs`
- `public/js/core/dd-module-definitions.mjs`
- `public/js/modules/commerce-operations/runtime.mjs`
- all Operations page HTML and business JavaScript
- `public/js/admin-accounting-backend.js`
- Orders/payment/refund/gift-card APIs
- other Accounting GET/write handlers
- Inventory/Creative authorities and consumers
- SQL migrations / aggregate schema
- `wrangler.toml`
- R2/config/secrets
- Git branch deletion
- real Production
