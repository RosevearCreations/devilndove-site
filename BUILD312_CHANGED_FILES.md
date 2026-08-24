# Build 312 Changed Files — Accounting Read Contract

Baseline:

```text
78546a6b9304ce38d0a42b130445a7504a15823f
Build 311 set completed inventory-cost handoff
```

Expected Build 312 boundary:

```text
AI_CONTEXT.md
BUILD312_CHANGED_FILES.md
BUILD312_VALIDATION.md
admin/inventory-operations/index.html
docs/architecture/BUILD312_ACCOUNTING_READ_CONTRACT.md
functions/api/admin/contracts/accounting-read.js
public/js/admin.js
public/js/core/dd-application-module-groups.mjs
public/js/core/dd-module-contracts.mjs
public/js/core/dd-module-service-adapters.mjs
public/js/modules/commerce-operations/runtime.mjs
scripts/build312_accounting_read_contract_test.py
```

Build 312 must not modify:

- `functions/api/admin/accounting-summary.js`;
- `functions/api/_lib/accounting.js`;
- Accounting journals, expenses, bank imports, close controls, or posting routes;
- `admin/operations/index.html` or Operations business implementation;
- Inventory post/reverse authorities;
- Creative post/reverse consumers;
- SQL/schema files;
- Cloudflare bindings/config;
- R2;
- real Devil n Dove Production;
- schema/data parity work.

The only Accounting implementation added by Build 312 is a bounded, authenticated, GET-only contract over existing `accounting_order_records`. It does not call `ensureAccountingSchema()` and does not perform request-time DDL.
