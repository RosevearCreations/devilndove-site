# Build 323 — Accounting Page Runtime Audit / Shadow Bridge

## Decision

Do **not** activate the top-level `business-administration` runtime yet.

The `/admin/accounting/` page now loads the existing verified admin module bridge through `/public/js/admin.js?v=323`, so Core can classify the page as domain `accounting` under application module `business-administration`. The application module intentionally remains a domain bridge with no runtime entry and no mutation ownership.

This is a truthful intermediate state: classification is active; Business & Administration runtime activation is not.

## Why activation is blocked

The page loads eight Accounting UI scripts:

```text
admin-accounting-report.js
admin-accounting-backend.js
admin-accounting-t2-presets.js
admin-accounting-advanced.js
admin-accounting-imports.js
admin-accounting-statement-profiles.js
admin-accounting-close-workflow.js
admin-accounting-evidence-check.js
```

Builds 316–322 already provide Accounting-owned, non-mutating read boundaries for several reads used by this page:

```text
/api/admin/accounting-expenses
/api/admin/accounting-writeoffs
/api/admin/general-ledger-accounts
/api/admin/accounting-overhead-allocations
/api/admin/accounting-overhead-product-allocations
/api/admin/product-costs
```

However, automatic or normal page reads still include legacy endpoints that are not yet represented by owned read contracts:

```text
/api/admin/accounting-profit-loss
/api/admin/accounting-item-costing
/api/admin/accounting-journal
/api/admin/accounting-gifi-notes
/api/admin/accounting-gifi-summary
/api/admin/accounting-period-locks
/api/admin/db-sanity
/api/admin/accounting-vendors
/api/admin/accounting-recurring-expense-rules
/api/admin/accounting-attachments
/api/admin/accounting-reconciliation
/api/admin/accounting-year-end-close
/api/admin/accounting-statement-imports
/api/admin/accounting-reconciliation-exceptions
/api/admin/accounting-sales-tax-filing
/api/admin/accounting-fixed-assets
/api/admin/accounting-vendor-statements
/api/admin/accounting-statement-provider-profiles
/api/admin/accounting-close-workflow
/api/admin/accounting-evidence-check
```

The T2 preset helper performs no network reads; it only fills existing forms.

## Confirmed blocker: journal GET mutates schema

`functions/api/admin/accounting-journal.js` calls `fetchJournal()` for GET. `fetchJournal()` calls `ensureJournalSchema()` before reading.

`ensureJournalSchema()` currently performs request-time DDL:

```text
CREATE TABLE IF NOT EXISTS accounting_journal_entries
CREATE TABLE IF NOT EXISTS accounting_journal_lines
CREATE INDEX IF NOT EXISTS ...
ALTER TABLE accounting_journal_entries ADD COLUMN ...
```

Therefore simply loading the Accounting overview can still mutate schema through the journal GET. This violates the read-side rule:

> GET/read paths report schema readiness; migrations/readiness tooling creates or repairs schema.

Build 323 does not hide or normalize this away. It records the blocker and keeps Business & Administration runtime inactive.

## Good next extraction candidates

Two heavily used automatic reads were source-audited during Build 323 and are strong next candidates:

1. `accounting-profit-loss` — current GET uses table-existence/column inspection and SELECTs; no request-time DDL was found in the audited path.
2. `accounting-item-costing` — current GET delegates to `_costing.js`; the audited helper uses table-existence and PRAGMA inspection plus SELECT-based costing logic, with no request-time schema repair found in the inspected path.

The journal read should follow as a dedicated correction because its GET must stop calling `ensureJournalSchema()`.

## Suggested bounded sequence

```text
Build 324  Accounting profit/loss read extraction
Build 325  Accounting item-costing read extraction
Build 326  Accounting journal GET schema-mutation retirement + read extraction
then       continue only automatic Accounting-page blockers needed for runtime activation
finally    activate first read-only business-administration page
```

Do not extract endpoints solely to increase build count. Prioritize reads automatically invoked by `/admin/accounting/` and any report/export read that prevents safe activation.

## Mutation ownership

Unchanged.

Build 323 does not move POST/PUT/DELETE behavior. Expense, write-off, overhead, product-cost, journal, GIFI, reconciliation, import, attachment, close and other Accounting writes remain compatibility writes until separately extracted with explicit Accounting mutation authority.

## Production and schema/data safety

No Production promotion, D1/R2 mutation, schema migration or business-data copy is part of Build 323.

Fresh-install schema parity remains a separate workstream and must be completed before Production business data is copied into Development.
