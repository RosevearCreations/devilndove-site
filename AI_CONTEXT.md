# Devil n Dove AI Context — Builds 325–327 Accounting Read Batch Staged

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
- `BUILD325_327_VALIDATION.md`

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
Build 325 Accounting item-costing read     STAGED
Build 326 Accounting journal read          STAGED
Build 327 Accounting GIFI notes read       STAGED
```

Build 306 and Build 308 retain their historical standalone local-signoff caveats; do not silently relabel them.

## Current runtime / contract identities

```text
Core architecture                         302
Core runtime implementation               305
Commerce/Operations runtime               315
Accounting page bridge                    323 validated shadow/domain-bridge
Accounting profit/loss read               324 validated
Accounting item-costing read              325 staged
Accounting journal read                   326 staged
Accounting GIFI notes read                327 staged
Contract catalog                          327
Passive service adapters                  327
Business & Administration runtime         inactive
Accounting mutation ownership             unmoved
```

## Build 324 result and schema-parity finding

Build 324 local and browser gates passed. Development returned:

```text
missing_tables   []
missing_columns  ["orders.total_amount|total"]
mutation         false
```

This means the P&L read boundary is correct, while the Development `orders` schema lacks both logical amount alternatives currently understood by that service. Keep this on the separate schema-parity track. Do not add DDL to the GET.

## Builds 325–327 staged batch

### Build 325

`/api/admin/accounting-item-costing` now delegates to an Accounting-owned non-mutating service, also exposed as `/api/admin/contracts/accounting-item-costing-read`.

### Build 326

`/api/admin/accounting-journal` GET no longer calls `ensureJournalSchema()`. It delegates to an Accounting-owned journal read service that reports missing journal tables/columns without creating them. Explicit POST sync/validate/post actions retain write-side schema compatibility for now.

### Build 327

`/api/admin/accounting-gifi-notes` GET no longer creates its notes table/index. It delegates to an Accounting-owned read service. The explicit POST save path retains write-side ensure behavior.

## Next automatic blocker

`/api/admin/accounting-gifi-summary` still calls `ensureGlSchema()` from GET and can CREATE/ALTER `general_ledger_accounts`. This is now the clearest next read-time DDL blocker.

After the 325–327 batch validates, continue in small batches rather than one build per user validation cycle. A sensible next batch begins with GIFI summary, then other automatic Accounting page reads such as period locks / reconciliation-related reads after source audit.

## Separate schema/data parity track — DO NOT MIX

Fresh-install schema parity remains separate and must be repaired before any Production business-data copy. Read contracts report missing schema; migrations/readiness tooling owns creation/repair.

## Validation preference

Batch small related builds and provide one Git Bash block plus one Firefox-safe browser block whenever practical.
