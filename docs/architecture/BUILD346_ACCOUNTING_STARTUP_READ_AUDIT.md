# Build 346 — Accounting Startup Read Audit Closure

## Purpose

Close the prerequisite identified by Build 323 before activating the Business & Administration umbrella runtime for Accounting: every automatic GET started by `/admin/accounting/` must resolve to an owned, non-mutating read boundary.

## Loaded Accounting scripts audited

`admin/accounting/index.html` loads exactly these Accounting feature scripts:

1. `admin-accounting-report.js`
2. `admin-accounting-backend.js`
3. `admin-accounting-t2-presets.js`
4. `admin-accounting-advanced.js`
5. `admin-accounting-imports.js`
6. `admin-accounting-statement-profiles.js`
7. `admin-accounting-close-workflow.js`
8. `admin-accounting-evidence-check.js`

The T2 preset script performs no network reads.

## Automatic read ownership result

All automatic startup GETs are now backed by owned passive services and no request-time schema mutation:

- report: profit/loss 324, item costing 325, journal 326, overhead-product allocations 321
- backend: GL 318, expenses 316, overhead 320, write-offs 317, product costs 322, GIFI notes 327, GIFI summary 328, period locks 329, Platform DB sanity 341
- advanced: vendors 331, recurring rules 332, attachments 330, reconciliation 340, year-end close 343
- imports: statement imports 334, reconciliation exceptions 335, sales tax filing 337, fixed assets 338, vendor statements 336
- provider profiles: 333
- close workflow: 342
- evidence check: 339

Interactive export reads are also owned through Builds 344–345.

## Result

`/admin/accounting/` has no remaining automatic startup GET that requires a legacy mutating read helper. Existing POST/upload/import/lock/journal/reconciliation actions remain compatibility writes and are not moved by this audit.

Schema parity remains independent. A service can report `schema_ready=false` without blocking runtime ownership activation, provided the read remains non-mutating and its contract is registered.
