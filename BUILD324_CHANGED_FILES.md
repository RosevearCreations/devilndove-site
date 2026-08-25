# Build 324 Changed Files — Accounting Profit/Loss Read Extraction

## Runtime/source

- `functions/api/_lib/accountingProfitLossReadService.js` — new Accounting-owned non-mutating monthly P&L read service.
- `functions/api/admin/contracts/accounting-profit-loss-read.js` — new GET-only contract route.
- `functions/api/admin/accounting-profit-loss.js` — legacy compatibility GET now delegates to the owned read service.
- `public/js/core/dd-module-contracts.mjs` — registers the Build 324 Accounting P&L read contract.
- `public/js/core/dd-module-service-adapters.mjs` — registers the passive browser adapter.

## Regression/docs

- `scripts/build324_accounting_profit_loss_read_extraction_test.py`
- `BUILD324_VALIDATION.md`
- `BUILD324_CHANGED_FILES.md`
- `docs/architecture/BUILD324_ACCOUNTING_PROFIT_LOSS_READ_EXTRACTION.md`
- `AI_CONTEXT.md`
- `docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md`
- `BUILD323_VALIDATION.md` — records the completed Build 323 browser proof.

## Explicitly unchanged

No Business & Administration runtime is activated. No mutation authority, SQL migration, Cloudflare binding/configuration, Production data, R2 object, Orders/payment write path, journal write path, or item-costing implementation is changed by Build 324.
