# Build 318 Changed Files — General Ledger Read Extraction

Baseline: `7ffceabb8a11d7e3f4e4b3dfc4ea923811e28a96` (Build 317 staged source head).

Intended Build 318 boundary:

1. `BUILD318_CHANGED_FILES.md`
2. `BUILD318_VALIDATION.md`
3. `docs/architecture/BUILD318_GENERAL_LEDGER_READ_EXTRACTION.md`
4. `functions/api/_lib/accountingGeneralLedgerReadService.js`
5. `functions/api/admin/general-ledger-accounts.js`
6. `functions/api/admin/contracts/accounting-general-ledger-read.js`
7. `public/js/core/dd-module-contracts.mjs`
8. `public/js/core/dd-module-service-adapters.mjs`
9. `scripts/build318_general_ledger_read_extraction_test.py`

No General Ledger POST behavior, SQL/schema migrations, Commerce/Core runtime implementation, Operations loader coverage, Orders/payment APIs, Inventory/Creative authority, Cloudflare config, R2, or Production belongs in this build.
