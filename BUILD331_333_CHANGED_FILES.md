# Builds 331–333 Changed Files

## Runtime/source

```text
functions/api/_lib/accountingVendorsReadService.js
functions/api/_lib/accountingRecurringExpenseRulesReadService.js
functions/api/_lib/accountingStatementProviderProfilesReadService.js
functions/api/admin/accounting-vendors.js
functions/api/admin/accounting-recurring-expense-rules.js
functions/api/admin/accounting-statement-provider-profiles.js
functions/api/admin/contracts/accounting-vendors-read.js
functions/api/admin/contracts/accounting-recurring-expense-rules-read.js
functions/api/admin/contracts/accounting-statement-provider-profiles-read.js
public/js/core/dd-module-contracts.mjs
public/js/core/dd-module-service-adapters.mjs
```

## Regression/docs

```text
scripts/build331_333_accounting_read_batch_test.py
BUILD331_333_VALIDATION.md
BUILD331_333_CHANGED_FILES.md
docs/architecture/BUILD331_ACCOUNTING_VENDORS_READ_EXTRACTION.md
docs/architecture/BUILD332_ACCOUNTING_RECURRING_RULES_READ_EXTRACTION.md
docs/architecture/BUILD333_ACCOUNTING_STATEMENT_PROVIDER_PROFILES_READ_EXTRACTION.md
AI_CONTEXT.md
docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md
```

## Safety boundary

No Business & Administration runtime activation, Accounting mutation-authority transfer, schema migration, Production data copy, or Production deployment is part of this batch.
