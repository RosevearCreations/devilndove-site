# Devil n Dove AI Context — Build 324 Accounting Profit/Loss Read Extraction Browser Proven

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Primary modular authorities:

- `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`
- `docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md`
- `docs/architecture/SOURCE_CONTROL_BRANCHING.md`
- `docs/architecture/BUILD316_ACCOUNTING_EXPENSES_READ_CORRECTION.md`
- `docs/architecture/BUILD317_ACCOUNTING_WRITEOFFS_READ_EXTRACTION.md`
- `docs/architecture/BUILD318_GENERAL_LEDGER_READ_EXTRACTION.md`
- `docs/architecture/BUILD319_ACCOUNTING_SUMMARY_READ_EXTRACTION.md`
- `docs/architecture/BUILD320_ACCOUNTING_OVERHEAD_ALLOCATIONS_READ_EXTRACTION.md`
- `docs/architecture/BUILD321_ACCOUNTING_OVERHEAD_PRODUCT_ALLOCATIONS_READ_EXTRACTION.md`
- `docs/architecture/BUILD322_ACCOUNTING_PRODUCT_COSTS_READ_EXTRACTION.md`
- `docs/architecture/BUILD323_ACCOUNTING_PAGE_RUNTIME_AUDIT.md`
- `docs/architecture/BUILD324_ACCOUNTING_PROFIT_LOSS_READ_EXTRACTION.md`
- `BUILD324_VALIDATION.md`

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

Domains remain internal ownership/service boundaries beneath exactly three top-level modules.

Core owns shared infrastructure only: auth/session context, module registry/lifecycle, route resolution, passive contract/service registration, common runtime/error helpers, availability and diagnostics. Business rules remain domain-owned.

## Source-control rule

```text
main  = retained Production/legacy release line
dev   = active modularization and Development integration line
```

Development has already been proven to contain the old `main` baseline with zero missing `main` commits. Application modules are not permanent Git branches.

Cleanup-only refs still include historical `build291-candidate` through `build294-candidate` plus temporary `build317-accounting-writeoffs`. They are not active development lines.

## Modular baselines

```text
Build 301 Packaging compatibility          COMPLETE IN DEVELOPMENT
Build 302 Core + exactly 3 modules         COMPLETE IN DEVELOPMENT
Build 303 umbrella classification         COMPLETE IN DEVELOPMENT
Build 304 Catalog runtime                 COMPLETE IN DEVELOPMENT
Build 305 Inventory runtime               COMPLETE IN DEVELOPMENT
Build 307 Inventory reversal service      COMPLETE IN DEVELOPMENT
Build 309 Inventory post authority        COMPLETE IN DEVELOPMENT
Build 310 Creative post consumer cutover  COMPLETE IN DEVELOPMENT
Build 311 Inventory cost read contract    COMPLETE IN DEVELOPMENT
Build 312 Accounting order read contract  COMPLETE IN DEVELOPMENT
Build 313 Operations read-only runtime    COMPLETE IN DEVELOPMENT
Build 314 Customer Documents runtime      COMPLETE IN DEVELOPMENT
Build 315 Orders runtime coverage         COMPLETE IN DEVELOPMENT
Build 316 Accounting expenses read        COMPLETE IN DEVELOPMENT
Build 317 Accounting write-offs read      COMPLETE IN DEVELOPMENT
Build 318 General Ledger read             COMPLETE IN DEVELOPMENT
Build 319 Accounting summary read         COMPLETE IN DEVELOPMENT
Build 320 Accounting overhead read        VALIDATED 2026-08-24
Build 321 Overhead-product read           VALIDATED 2026-08-24
Build 322 Product-cost read               VALIDATED 2026-08-24
Build 323 Accounting page runtime audit   VALIDATED 2026-08-24
Build 324 Accounting profit/loss read     BROWSER PROVEN; LOCAL + SCHEMA DETAIL REQUIRED
```

Build 306 remains historically browser-proven with standalone local signoff not captured. Do not silently relabel it complete.

Build 308 remains browser-proven with standalone local regression output not captured. Do not silently relabel it complete.

For Builds 320–323, functional local/browser gates passed. The captured local transcripts did not include the requested final `git status --short` line, so source-control cleanliness remains a housekeeping note rather than hidden.

## Current runtime/contract identities

```text
Core architecture                         302
Core runtime implementation               305
Commerce/Operations runtime               315
Operations proven pages                   /admin/operations/, /admin/customer-documents/, /admin/orders/
Operations mutation ownership             false
Accounting order read                     312
Accounting expenses read                  316
Accounting write-offs read                317
Accounting General Ledger read            318
Accounting summary read                   319
Accounting overhead allocations read      320 validated
Accounting overhead-product read          321 validated
Accounting product-costs read             322 validated
Accounting page bridge                    323 validated shadow/domain-bridge
Accounting profit/loss read               324 browser proven
Contract catalog                          324
Passive service adapters                  324
Business & Administration runtime         inactive
```

## Build 323 result

`/admin/accounting/` loads the verified Core module bridge and browser proof confirmed:

```text
domain                      accounting
domain_mode                 shadow
application_module          business-administration
application_mode            domain-bridge
active_application_module   null
core_runtime_build          305
contracts_ok                true
services_ok                 true
```

Build 323 intentionally did not activate a `business-administration` runtime.

Its dependency audit found automatic legacy reads including profit/loss, item costing, journal, GIFI, vendors/recurring rules, attachments, reconciliation, statement imports, tax worksheet, fixed assets, vendor statements, close workflow and evidence checks.

Most importantly, `accounting-journal` GET currently reaches `ensureJournalSchema()`, which creates journal tables/indexes and may ALTER columns. Therefore Business & Administration activation remains blocked.

## Build 324 — Accounting profit/loss read extraction

The automatic Accounting overview request:

```text
GET /api/admin/accounting-profit-loss?month=YYYY-MM
```

now delegates to an Accounting-owned non-mutating service and has a dedicated contract:

```text
GET /api/admin/contracts/accounting-profit-loss-read?month=YYYY-MM
build       324
owner       accounting
mutation    false
```

The service reads existing Orders, expenses, write-offs, overhead and General Ledger state without CREATE/ALTER/INSERT/UPDATE/DELETE. It reports missing schema rather than repairing it.

Development browser proof on 2026-08-24 returned:

```text
legacy_status               200
legacy_build                324
legacy_owner                accounting
legacy_schema_ready         false
legacy_schema_mutation      false
contract_status             200
contract_build              324
contract_owner              accounting
contract_schema_mutation    false
service_build               324
service_schema_mutation     false
application_module          business-administration
application_mode            domain-bridge
active_application_module   null
contracts_ok                true
services_ok                 true
```

This is an architecture PASS. `schema_ready=false` is a separate schema-parity finding. Capture exact `missing_tables` / `missing_columns` and route them to the fresh-install schema-parity track; never restore request-time DDL.

Build 324 remains not fully VALIDATED until its local regression output and exact missing-schema evidence are captured.

The current Accounting UI keeps the legacy URL for compatibility. No Accounting write authority moves.

## Next default bounded sequence

```text
Build 325  Accounting item-costing read extraction
Build 326  Accounting journal GET schema-mutation retirement + read extraction
then       remaining automatic Accounting-page read blockers only
finally    first read-only business-administration runtime activation
```

Do not extract unrelated Accounting GETs merely for build count. Prioritize automatic `/admin/accounting/` dependencies that block safe activation.

Mutation ownership remains false/unmoved until dedicated Accounting write contracts are separately extracted.

## Application-module open work

### Commerce & Operations

Remaining loader/runtime coverage includes `/admin/gift-cards/`, `/admin/members/`, `/admin/membership/`, `/admin/custom-request/`, and `/admin/today-tasks/`. Loader coverage must remain separate from mutation-authority extraction.

### Creative & Production

Still open: bounded top-level `creative-production` runtime activation, CAIP/Content contract extraction, and eventual retirement of `creative-process-compat.js` only after every action has an owned destination. Packaging remains domain-owned and outside Core.

### Business & Administration

Accounting page classification is proven, but top-level runtime activation remains blocked by automatic legacy reads and confirmed journal GET request-time DDL.

Marketing, Platform and Administration remain future bounded service/runtime work.

## Separate schema/data parity track — DO NOT MIX

Fresh-install schema parity remains separate and must be repaired before any Production business-data copy.

If any read contract reports missing tables/columns, capture that evidence and repair it through the schema-parity workflow. Never restore request-time DDL to GET/read handlers.

## Validation interaction preference

Keep validation concise: one GIT BASH block plus one Firefox-safe BROWSER DEVTOOLS CONSOLE block unless a failure requires deeper isolation.
