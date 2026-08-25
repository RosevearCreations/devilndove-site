# Devil n Dove AI Context — Builds 343–345 Accounting Year-End / Export Batch Staged

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Primary modular authorities include:

- `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`
- `docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md`
- `docs/architecture/SOURCE_CONTROL_BRANCHING.md`
- `docs/architecture/BUILD323_ACCOUNTING_PAGE_RUNTIME_AUDIT.md`
- `docs/architecture/BUILD324_ACCOUNTING_PROFIT_LOSS_READ_EXTRACTION.md`
- `docs/architecture/BUILD325_ACCOUNTING_ITEM_COSTING_READ_EXTRACTION.md`
- `docs/architecture/BUILD326_ACCOUNTING_JOURNAL_READ_EXTRACTION.md`
- `docs/architecture/BUILD327_ACCOUNTING_GIFI_NOTES_READ_EXTRACTION.md`
- `docs/architecture/BUILD328_ACCOUNTING_GIFI_SUMMARY_READ_EXTRACTION.md`
- `docs/architecture/BUILD329_ACCOUNTING_PERIOD_LOCKS_READ_EXTRACTION.md`
- `docs/architecture/BUILD330_ACCOUNTING_ATTACHMENTS_READ_EXTRACTION.md`
- `docs/architecture/BUILD331_ACCOUNTING_VENDORS_READ_EXTRACTION.md`
- `docs/architecture/BUILD332_ACCOUNTING_RECURRING_RULES_READ_EXTRACTION.md`
- `docs/architecture/BUILD333_ACCOUNTING_STATEMENT_PROVIDER_PROFILES_READ_EXTRACTION.md`
- `docs/architecture/BUILD334_ACCOUNTING_STATEMENT_IMPORTS_READ_EXTRACTION.md`
- `docs/architecture/BUILD335_ACCOUNTING_RECONCILIATION_EXCEPTIONS_READ_EXTRACTION.md`
- `docs/architecture/BUILD336_ACCOUNTING_VENDOR_STATEMENTS_READ_EXTRACTION.md`
- `docs/architecture/BUILD337_ACCOUNTING_SALES_TAX_FILING_READ_EXTRACTION.md`
- `docs/architecture/BUILD338_ACCOUNTING_FIXED_ASSETS_READ_EXTRACTION.md`
- `docs/architecture/BUILD339_ACCOUNTING_EVIDENCE_CHECK_READ_EXTRACTION.md`
- `docs/architecture/BUILD340_ACCOUNTING_RECONCILIATION_READ_EXTRACTION.md`
- `docs/architecture/BUILD341_PLATFORM_DB_SANITY_READ_EXTRACTION.md`
- `docs/architecture/BUILD342_ACCOUNTING_CLOSE_WORKFLOW_READ_EXTRACTION.md`
- `docs/architecture/BUILD343_ACCOUNTING_YEAR_END_CLOSE_READ_EXTRACTION.md`
- `docs/architecture/BUILD344_ACCOUNTING_MONTHLY_SUMMARY_EXPORT_READ_EXTRACTION.md`
- `docs/architecture/BUILD345_ACCOUNTING_PERIOD_SUMMARY_EXPORT_READ_EXTRACTION.md`
- `BUILD325_327_VALIDATION.md` through `BUILD343_345_VALIDATION.md`

## Production safety

Real Devil n Dove Production remains frozen unless deliberately promoted through the separate Production workflow. `main` must not advance merely because Development is ahead.

## Authoritative application structure

```text
                     DEVIL N DOVE APPLICATION CORE
                               |
              +----------------+----------------+
              |                |                |
       COMMERCE &         CREATIVE &       BUSINESS &
       OPERATIONS          PRODUCTION      ADMINISTRATION
```

Domains remain internal ownership/service boundaries beneath exactly three top-level modules. Core owns shared infrastructure only; business rules remain domain-owned.

## Source-control rule

```text
main  = retained Production/legacy release line
dev   = active modularization and Development integration line
```

Application modules are not permanent Git branches.

## Current modular state

```text
Core architecture                         302
Core runtime implementation               305
Commerce/Operations runtime               315
Accounting page bridge                    323 validated shadow/domain-bridge
Accounting reads through 330              validated
Accounting reads 331–342                  browser proven; local regressions outstanding
Accounting year-end close read            343 staged
Accounting monthly export read            344 staged
Accounting period export read             345 staged
Contract catalog                          345
Passive service adapters                  345
Business & Administration runtime         inactive
Accounting mutation ownership             unmoved
```

Build 306 and Build 308 retain their historical standalone local-signoff caveats; do not silently relabel them.

## Read-boundary rule

GET/read paths report schema readiness. Migrations/readiness tooling creates or repairs schema. Never restore request-time DDL to a read merely because Development reports `schema_ready=false`.

A loader/read-contract migration never implies mutation ownership. Existing compatibility POST/PUT/DELETE paths remain legacy until dedicated mutation contracts are separately extracted.

## Development schema-parity findings — separate track

These are evidence from non-mutating read contracts, not modularization failures:

```text
Build 324
missing_tables   []
missing_columns  ["orders.total_amount|total"]

Build 338
missing_tables   []
missing_columns  ["accounting_fixed_assets.location_note"]

Build 339
missing_tables   ["hst_gst_review_records","accountant_export_manifests"]
missing_columns  []

Build 341
missing_tables   []
missing_columns  ["user_profiles.profile_id","access_tiers.tier_id","payment_disputes.payment_dispute_id"]
```

Do not repair these inside GET handlers. Fresh-install schema parity must be repaired and validated independently before any Production business-data copy.

## Validation state

- Builds 325–330: fully validated.
- Builds 331–336: browser proven; local regressions still required.
- Builds 337–339: browser proven; local regression required. Builds 338/339 also exposed separate schema parity.
- Builds 340–342: browser proven; local regression required. Build 341 exposed three additional column-parity findings.
- Builds 343–345: staged / validation required.

## Builds 343–345 staged batch

### Build 343 — Accounting year-end close

`/api/admin/accounting-year-end-close` no longer creates period-close, GIFI-note, reconciliation, attachment, statement-import, or GL schema during GET. The Accounting-owned service aggregates existing non-mutating read authorities, preserves JSON/CSV/CSV-pack output, and reports combined schema readiness.

### Build 344 — Monthly summary export

`/api/admin/accounting-monthly-summary-export` now delegates to an Accounting-owned schema-aware row reader before rendering CSV. The legacy CSV response exposes build/owner/schema/mutation headers. The reader dynamically handles `order_id` vs `id` and dollar-vs-cent amount columns instead of silently swallowing incompatible SQL.

### Build 345 — Quarter/year summary export

`/api/admin/accounting-period-summary-export` uses the same non-mutating export-row authority for quarter/year ranges, with a dedicated contract/passive service and legacy CSV diagnostic headers.

## Next direction

1. Validate Builds 331–345 with one combined local checkpoint and the 343–345 Firefox gate.
2. Capture any additional schema-parity output from the two export contracts.
3. Source-audit all `/admin/accounting/` bootstrap scripts for any remaining automatic read without an owned non-mutating boundary.
4. Only after that audit passes, stage the first read-only `business-administration` runtime activation while mutation ownership remains false.
5. Keep Production frozen and fresh-install schema repair separate from modular extraction.

## Validation preference

Batch small related builds and provide one Git Bash block plus one Firefox-safe browser block whenever practical.
