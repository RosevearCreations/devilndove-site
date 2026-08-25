# Devil n Dove AI Context — Builds 325–330 Accounting Read Validation In Progress

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
- `BUILD325_327_VALIDATION.md`
- `BUILD328_330_VALIDATION.md`

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
Build 325 Accounting item-costing read     BROWSER PROVEN; CORRECTED LOCAL REQUIRED
Build 326 Accounting journal read          BROWSER PROVEN; CORRECTED LOCAL REQUIRED
Build 327 Accounting GIFI notes read       BROWSER PROVEN; CORRECTED LOCAL REQUIRED
Build 328 Accounting GIFI summary read     LOCAL PASSED; BROWSER REQUIRED
Build 329 Accounting period-locks read     LOCAL PASSED; BROWSER REQUIRED
Build 330 Accounting attachments read      LOCAL PASSED; BROWSER REQUIRED
```

Build 306 and Build 308 retain their historical standalone local-signoff caveats; do not silently relabel them.

## Current runtime / contract identities

```text
Core architecture                         302
Core runtime implementation               305
Commerce/Operations runtime               315
Accounting page bridge                    323 validated shadow/domain-bridge
Accounting profit/loss read               324 validated
Accounting item-costing read              325 browser proven
Accounting journal read                   326 browser proven
Accounting GIFI notes read                327 browser proven
Accounting GIFI summary read              328 local passed
Accounting period locks read              329 local passed
Accounting attachments read               330 local passed
Contract catalog                          330
Passive service adapters                  330
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

## Builds 325–327 validation state

Development browser proof passed all six legacy/contract requests. Item costing, journal and GIFI notes each returned HTTP 200, the correct build/owner, `schema_ready=true`, and `request_time_schema_mutation=false`. All three passive services reported their expected builds and no schema mutation. Accounting remained `business-administration` / `domain-bridge` with no active top-level Business & Administration runtime.

The first later local rerun failed because the historical test asserted that Build 327's *next blocker* (`await ensureGlSchema(db)` in GIFI summary) must still exist. Build 328 intentionally removed that blocker. The test was corrected on 2026-08-24 to verify only durable Build 325–327 feature boundaries and not freeze unrelated future files or next-blocker state. A corrected local rerun remains required before 325–327 are marked fully validated.

## Builds 328–330 validation state

The local regression passed on 2026-08-24:

```text
BUILDS 328-330 ACCOUNTING READ BATCH: PASS
No Cloudflare resource was contacted.
```

A clean `git status --short` line was not included in the captured transcript, and the Development browser proof is still required.

### Build 328
`/api/admin/accounting-gifi-summary` no longer runs `ensureGlSchema()` or request-time CREATE/ALTER. It delegates to an Accounting-owned schema-aware read service. Legacy CSV export is preserved from the service result.

### Build 329
`/api/admin/accounting-period-locks` GET no longer ensures period-closure, attachment or statement-import schema. It reads only existing `accounting_period_closures`. Explicit POST lock/reopen behavior retains its existing write-side prerequisites and ensures.

### Build 330
`/api/admin/accounting-attachments` GET no longer ensures/repairs the attachments table. It delegates to an Accounting-owned metadata read service. Multipart upload POST and R2/database write behavior remain unchanged in authority.

## Next direction

First close the corrected 325–327 local gate and the 328–330 browser gate. Then continue batching a few automatic Accounting reads at a time. Likely next candidates after source audit include vendors/recurring rules, reconciliation/statement imports, year-end close or evidence checks. Do not activate the top-level `business-administration` runtime until automatic page reads are owned/non-mutating.

## Separate schema/data parity track — DO NOT MIX

Fresh-install schema parity remains separate and must be repaired before any Production business-data copy. Read contracts report missing schema; migrations/readiness tooling owns creation/repair.

## Validation preference

Batch small related builds and provide one Git Bash block plus one Firefox-safe browser block whenever practical.
