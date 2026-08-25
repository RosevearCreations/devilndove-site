# Build 332 — Accounting Recurring Expense Rules Read Extraction

`/api/admin/accounting-recurring-expense-rules` GET now delegates to `accountingRecurringExpenseRulesReadService.js` and no longer ensures vendor/rule/expense schema during reads.

The read reports schema readiness and due-rule state without mutation. Explicit POST save/generate actions retain their existing write-side schema compatibility and accounting-period checks.

Dedicated contract: `/api/admin/contracts/accounting-recurring-expense-rules-read`.
