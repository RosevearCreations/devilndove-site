# Build 323 Changed Files — Accounting Page Runtime Audit / Shadow Bridge

Build 323 is intentionally bounded. It does not activate the `business-administration` runtime and does not change Accounting mutation ownership.

Changed or added files:

```text
admin/accounting/index.html
BUILD320_VALIDATION.md
BUILD321_VALIDATION.md
BUILD322_VALIDATION.md
BUILD323_CHANGED_FILES.md
BUILD323_VALIDATION.md
AI_CONTEXT.md
docs/architecture/BUILD323_ACCOUNTING_PAGE_RUNTIME_AUDIT.md
docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md
scripts/build323_accounting_page_runtime_audit_test.py
```

Purpose:

- load the existing verified admin module bridge on `/admin/accounting/`;
- keep Accounting in `business-administration` domain-bridge/shadow mode;
- document the real page dependency inventory;
- record that journal GET still performs request-time schema mutation;
- keep Builds 320–322 validation status current;
- define the next bounded extraction sequence before top-level Business & Administration activation.
