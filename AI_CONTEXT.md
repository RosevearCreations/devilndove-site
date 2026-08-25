# Devil n Dove AI Context — Builds 331–333 Accounting Read Batch Staged

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Primary modular authorities now include:

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
- `BUILD325_327_VALIDATION.md`
- `BUILD328_330_VALIDATION.md`
- `BUILD331_333_VALIDATION.md`

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

## Modular baselines

```text
Build 301 Packaging compatibility          COMPLETE IN DEVELOPMENT
Build 302 Core + exactly 3 modules         COMPLETE IN DEVELOPMENT
Build 303 umbrella classification         COMPLETE IN DEVELOPMENT
Build 304 Catalog runtime                  COMPLETE IN DEVELOPMENT
Build 305 Inventory runtime                COMPLETE IN DEVELOPMENT
Build 307 Inventory reversal service       COMPLETE IN DEVELOPMENT
Build 309 Inventory post authority         COMPLETE IN DEVELOPMENT
Build 310 Creative post consumer cutover   COMPLETE IN DEVELOPMENT
Build 311 Inventory cost read contract     COMPLETE IN DEVELOPMENT
Build 312 Accounting order read contract   COMPLETE IN DEVELOPMENT
Build 313 Operations read-only runtime     COMPLETE IN DEVELOPMENT
Build 314 Customer Documents runtime       COMPLETE IN DEVELOPMENT
Build 315 Orders runtime coverage          COMPLETE IN DEVELOPMENT
Build 316 Accounting expenses read         COMPLETE IN DEVELOPMENT
Build 317 Accounting write-offs read       COMPLETE IN DEVELOPMENT
Build 318 General Ledger read              COMPLETE IN DEVELOPMENT
Build 319 Accounting summary read          COMPLETE IN DEVELOPMENT
Build 320 Accounting overhead read         VALIDATED 2026-08-24
Build 321 Overhead-product read            VALIDATED 2026-08-24
Build 322 Product-cost read                VALIDATED 2026-08-24
Build 323 Accounting page runtime audit    VALIDATED 2026-08-24
Build 324 Accounting profit/loss read      VALIDATED 2026-08-24
Build 325 Accounting item-costing read     VALIDATED 2026-08-24
Build 326 Accounting journal read          VALIDATED 2026-08-24
Build 327 Accounting GIFI notes read       VALIDATED 2026-08-24
Build 328 Accounting GIFI summary read     VALIDATED 2026-08-24
Build 329 Accounting period-locks read     VALIDATED 2026-08-24
Build 330 Accounting attachments read      VALIDATED 2026-08-24
Build 331 Accounting vendors read          STAGED
Build 332 Accounting recurring rules read  STAGED
Build 333 Statement provider profiles read STAGED
```

Build 306 and Build 308 retain their historical standalone local-signoff caveats; do not silently relabel them.

## Current runtime / contract identities

```text
Core architecture                         302
Core runtime implementation               305
Commerce/Operations runtime               315
Accounting page bridge                    323 validated shadow/domain-bridge
Accounting profit/loss read               324 validated
Accounting item-costing read              325 validated
Accounting journal read                   326 validated
Accounting GIFI notes read                327 validated
Accounting GIFI summary read              328 validated
Accounting period locks read              329 validated
Accounting attachments read               330 validated
Accounting vendors read                   331 staged
Accounting recurring rules read           332 staged
Statement provider profiles read          333 staged
Contract catalog                          333
Passive service adapters                  333
Business & Administration runtime         inactive
Accounting mutation ownership             unmoved
```

## Build 324 schema-parity finding

Development returned:

```text
missing_tables   []
missing_columns  ["orders.total_amount|total"]
mutation         false
```

Keep this on the separate schema-parity track. Do not add DDL to the GET.

## Builds 325–330 validation result

Builds 325–327 and 328–330 are fully validated. Their local regressions passed, all browser legacy/contract reads returned HTTP 200 with the correct builds/owner, Development reported `schema_ready=true`, every read/service reported no request-time schema mutation, and Accounting remained `business-administration` / `domain-bridge` with no active top-level Business & Administration runtime.

## Builds 331–333 staged batch

### Build 331
`/api/admin/accounting-vendors` GET no longer calls `ensureAccountingVendorsTable()`. It delegates to an Accounting-owned schema-aware read service. Vendor POST/save remains unchanged in authority.

### Build 332
`/api/admin/accounting-recurring-expense-rules` GET no longer ensures vendor/rule/expense schema. It reports recurring-rule readiness and due state without mutation. Explicit POST save/generate behavior retains its existing write-side prerequisites.

### Build 333
`/api/admin/accounting-statement-provider-profiles` GET no longer seeds defaults into D1. The read returns the six built-in defaults in memory, overlays stored profiles when available, and reports `defaults_materialized=false`. Explicit POST seeding/saving remains the only materialization path.

## Next direction

After validating 331–333, continue batching automatic Accounting reads. Reconciliation, statement imports, year-end close, sales-tax filing, fixed assets, vendor statements, close workflow, evidence checks and DB sanity remain candidates. Source-audit each batch and avoid hidden ensure/write helpers on GET. Do not activate top-level `business-administration` until automatic `/admin/accounting/` reads are owned/non-mutating.

## Separate schema/data parity track — DO NOT MIX

Fresh-install schema parity remains separate and must be repaired before any Production business-data copy. Read contracts report missing schema; migrations/readiness tooling owns creation/repair.

## Validation preference

Batch small related builds and provide one Git Bash block plus one Firefox-safe browser block whenever practical.
