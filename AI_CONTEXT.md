# Devil n Dove AI Context — Builds 340–342 Read Batch Staged

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
- `BUILD325_327_VALIDATION.md`
- `BUILD328_330_VALIDATION.md`
- `BUILD331_333_VALIDATION.md`
- `BUILD334_336_VALIDATION.md`
- `BUILD337_339_VALIDATION.md`
- `BUILD340_342_VALIDATION.md`

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
Build 331 Accounting vendors read          BROWSER PROVEN; LOCAL REQUIRED
Build 332 Accounting recurring rules read  BROWSER PROVEN; LOCAL REQUIRED
Build 333 Statement provider profiles read BROWSER PROVEN; LOCAL REQUIRED
Build 334 Accounting statement imports     BROWSER PROVEN; LOCAL REQUIRED
Build 335 Reconciliation exceptions read   BROWSER PROVEN; LOCAL REQUIRED
Build 336 Vendor statements read           BROWSER PROVEN; LOCAL REQUIRED
Build 337 Sales-tax filing read            BROWSER PROVEN; LOCAL REQUIRED
Build 338 Fixed-assets read                BROWSER PROVEN; LOCAL REQUIRED + SCHEMA PARITY
Build 339 Evidence-check read              BROWSER PROVEN; LOCAL REQUIRED + SCHEMA PARITY
Build 340 Accounting reconciliation read   STAGED
Build 341 Platform DB sanity read           STAGED
Build 342 Accounting close-workflow read   STAGED
```

Build 306 and Build 308 retain their historical standalone local-signoff caveats; do not silently relabel them.

## Current runtime / contract identities

```text
Core architecture                         302
Core runtime implementation               305
Commerce/Operations runtime               315
Accounting page bridge                    323 validated shadow/domain-bridge
Accounting reads through 330              validated
Accounting reads 331–339                  browser proven; local regression outstanding
Accounting reconciliation read            340 staged
Platform DB sanity read                   341 staged
Accounting close workflow read            342 staged
Contract catalog                          342
Passive service adapters                  342
Business & Administration runtime         inactive
Accounting mutation ownership             unmoved
```

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
```

Do not repair these inside GET handlers. Fresh-install schema parity must be repaired and validated independently before any Production business-data copy.

## Builds 325–330 validation result

Builds 325–330 are fully validated. Their local regressions and browser gates passed, all read/service mutation flags were false, and Accounting remained `business-administration` / `domain-bridge` with no active top-level Business & Administration runtime.

## Builds 331–336 validation state

Browser gates are exact passes: all legacy/contract routes returned HTTP 200 with the expected builds/owner, `schema_ready=true`, and mutation false. Passive services matched. Build 333 kept six provider defaults in memory with `defaults_materialized=false`. Local batch regressions remain required before these builds are fully validated.

## Builds 337–339 browser result

The browser architecture gate passes. Build 337 is schema-ready. Build 338 reports missing `accounting_fixed_assets.location_note`. Build 339 reports missing `hst_gst_review_records` and `accountant_export_manifests`. All legacy/contract/service mutation flags are false, contract/service registration is valid, and Accounting remains `business-administration` / `domain-bridge` / inactive. Local regression remains required.

## Builds 340–342 staged batch

### Build 340 — Accounting reconciliation

`/api/admin/accounting-reconciliation` GET delegates to an Accounting-owned service rather than ensuring reconciliation-review, period-closure, vendor or attachment schema. It reuses non-mutating attachment/vendor authorities and preserves sales-tax, processor-fee and shipping summary behavior. Explicit reconciliation-review POST remains the write-side compatibility path.

### Build 341 — Platform DB sanity

`/api/admin/db-sanity` was already non-mutating. Its application-wide inspection logic now belongs to `platform` via `platform-db-sanity-read`. Accounting/Admin are consumers. The service reports table/column/index sanity, catalog/inventory mismatches, journal balance and migration-ledger state without creating schema.

### Build 342 — Accounting close workflow

`/api/admin/accounting-close-workflow` JSON/CSV/ZIP GET paths now consume an Accounting-owned schema-aware service and no longer reach legacy `ensureSchema()`. Explicit POST actions still call `ensureSchema()` before writes. Mutation ownership is unchanged.

## Next direction

1. Validate Builds 331–342 with the combined local checkpoint and the 340–342 browser gate.
2. Capture any further `schema_ready=false` output on the separate schema-parity track.
3. Continue source-auditing remaining automatic Accounting reads, especially year-end close and any other page startup endpoints.
4. Do not activate top-level `business-administration` until automatic `/admin/accounting/` reads are owned/non-mutating.
5. Keep Production frozen and fresh-install schema repair separate from modular extraction.

## Validation preference

Batch small related builds and provide one Git Bash block plus one Firefox-safe browser block whenever practical.
