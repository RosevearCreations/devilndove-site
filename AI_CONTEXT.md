# Devil n Dove AI Context — Builds 320–322 Accounting Read Extraction Staged

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
- `BUILD322_VALIDATION.md`

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

## Completed modular baselines

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
```

Build 306 remains historically browser-proven with standalone local signoff not captured. Do not silently relabel it complete.

Build 308 remains browser-proven with standalone local regression output not captured. Do not silently relabel it complete.

## Current staged three-step pass

### Build 320 — Accounting Overhead Allocations Read Extraction

Source checkpoint:

```text
5e16845202a2f2b870f02420703f7bf0c3089a5b
```

```text
GET /api/admin/accounting-overhead-allocations
  -> Accounting-owned read service
GET /api/admin/contracts/accounting-overhead-allocations-read
  build 320
  owner accounting
  authority accounting_overhead_allocations
  request_time_schema_mutation false
```

Legacy POST remains compatibility write authority with period-open validation, upsert, audit logging and write-side schema ensure behavior.

### Build 321 — Accounting Overhead Product Allocations Read Extraction

Source checkpoint:

```text
612ff1b875d00d9a0aefd1b954c91c92d4c46d9d
```

```text
GET /api/admin/accounting-overhead-product-allocations
  -> Accounting-owned read service
GET /api/admin/contracts/accounting-overhead-product-allocations-read
  build 321
  owner accounting
  authority accounting_overhead_product_allocations
  request_time_schema_mutation false
```

The `products` join is optional presentation enrichment. Missing product presentation schema is reported through join-availability metadata, not repaired during GET. Legacy POST keeps product validation, upsert/delete, audit logging and write-side schema/index ensure behavior.

### Build 322 — Accounting Product Costs Read Extraction

Source checkpoint:

```text
3ef7e8bf545884a74268d522668a2493ee15a55f
```

```text
GET /api/admin/product-costs
  -> Accounting-owned read service
GET /api/admin/contracts/accounting-product-costs-read
  build 322
  owner accounting
  authority product_costs
  request_time_schema_mutation false
```

The legacy GET remains unbounded to preserve historical UI behavior. The dedicated contract may accept an explicit limit. Legacy POST retains period-open checks, dynamic column compatibility, insert/audit behavior and write-side schema ensure.

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
Accounting overhead allocations read      320 staged
Accounting overhead-product read          321 staged
Accounting product-costs read             322 staged
Contract catalog                          322
Passive service adapters                  322
```

## Source boundaries for Builds 320–322

Each source build is exactly five files:

```text
one Accounting-owned read service
one dedicated GET-only contract route
one legacy compatibility route
public/js/core/dd-module-contracts.mjs
public/js/core/dd-module-service-adapters.mjs
```

No Core runtime, Commerce runtime, Orders/payment, Inventory, Creative, SQL schema, Cloudflare config, R2, Production or business-data migration change is part of this pass.

## Application-module open work

### Commerce & Operations

Remaining loader/runtime coverage includes `/admin/gift-cards/`, `/admin/members/`, `/admin/membership/`, `/admin/custom-request/`, and `/admin/today-tasks/`. Loader coverage must remain separate from mutation-authority extraction.

### Creative & Production

Still open: bounded top-level `creative-production` runtime activation, CAIP/Content contract extraction, and eventual retirement of `creative-process-compat.js` only after every action has an owned destination. Packaging remains domain-owned and outside Core.

### Business & Administration

Accounting read extraction is now broad enough that, after Builds 320–322 validate, the next default architecture step is to audit `/admin/accounting/` and its loader/dependencies for the first bounded read-only `business-administration` runtime activation.

Do not automatically continue endless GET extraction if the Accounting page is ready for runtime activation.

## Separate schema/data parity track — DO NOT MIX

Fresh-install schema parity remains separate and must be repaired before any Production business-data copy.

If any read contract reports missing tables/columns, capture that evidence and repair it through the schema-parity workflow. Never restore request-time DDL to GET/read handlers.

## Validation interaction preference

Keep validation concise: one GIT BASH block plus one Firefox-safe BROWSER DEVTOOLS CONSOLE block unless a failure requires deeper isolation.
