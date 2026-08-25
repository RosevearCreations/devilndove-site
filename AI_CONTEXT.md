# Devil n Dove AI Context — Builds 317–319 Accounting Read Extraction Staged

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Primary modular authorities now include:

- `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`
- `docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md`
- `docs/architecture/SOURCE_CONTROL_BRANCHING.md`
- `docs/architecture/BUILD316_ACCOUNTING_EXPENSES_READ_CORRECTION.md`
- `docs/architecture/BUILD317_ACCOUNTING_WRITEOFFS_READ_EXTRACTION.md`
- `docs/architecture/BUILD318_GENERAL_LEDGER_READ_EXTRACTION.md`
- `docs/architecture/BUILD319_ACCOUNTING_SUMMARY_READ_EXTRACTION.md`
- `BUILD319_VALIDATION.md`

## Production safety

Real Devil n Dove Production remains frozen unless deliberately promoted through the separate Production workflow. `main` is not to be advanced merely because Development is ahead.

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

Core owns shared infrastructure only: auth/session context, module registry/lifecycle, route resolution, passive contract/service registration, common runtime/error helpers and availability. Business rules remain domain-owned.

## Source-control status

Permanent branch model:

```text
main  = retained Production/legacy release line
dev   = active modular Development/integration line
```

Build 319 comparison proved `dev` contains `main`, is hundreds of commits ahead, and is zero commits behind. Therefore Development has surpassed the old `main` baseline while retaining all of its history.

The application modules are not Git branches.

Historical retirement candidates still exist:

```text
build291-candidate
build292-candidate
build293-candidate
build294-candidate
```

Each was previously proven fully contained in `dev`.

Build 317 used one temporary isolation ref:

```text
build317-accounting-writeoffs
```

Its source was fast-forward integrated into `dev`. Retire/delete temporary build refs when tooling/permissions permit; do not create permanent Commerce/Creative/Business module branches.

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
```

Build 306 remains historically browser-proven with standalone local signoff not captured. Do not silently relabel it complete.

Build 308 remains browser-proven with standalone local regression output not captured. Do not silently relabel it complete.

## Current staged three-step pass

Builds 317–319 are staged on `dev` and require the consolidated local/browser proof in `BUILD319_VALIDATION.md` before formal completion.

### Build 317 — Accounting Write-Offs Read Extraction

```text
GET /api/admin/accounting-writeoffs
  -> Accounting-owned read service

GET /api/admin/contracts/accounting-writeoffs-read
  build 317
  owner accounting
  request_time_schema_mutation false
```

Legacy write-off POST remains compatibility write authority with period checks, insert, audit logging and write-side schema ensure unchanged.

### Build 318 — General Ledger Read Extraction

```text
GET /api/admin/general-ledger-accounts
  -> Accounting-owned read service

GET /api/admin/contracts/accounting-general-ledger-read
  build 318
  owner accounting
  request_time_schema_mutation false
```

The legacy GET preserves accounts, GIFI review summary and `starter_mapping_count`.

General Ledger POST remains compatibility write authority, including account create/update, starter GIFI mappings, bulk review/finalization, audit logging and write-side `ensureTable()`.

### Build 319 — Accounting Summary Read Extraction

```text
GET /api/admin/accounting-summary
  -> Accounting-owned read service

GET /api/admin/contracts/accounting-summary-read
  build 319
  owner accounting
  authority accounting_order_records
  request_time_schema_mutation false
```

The old GET no longer imports or calls `ensureAccountingSchema()`.

It preserves safe incident/fallback behavior while missing schema is reported rather than repaired.

## Current runtime/contract identities

```text
Core architecture                 302
Core runtime implementation       305
Commerce/Operations runtime       315
Operations proven pages           /admin/operations/, /admin/customer-documents/, /admin/orders/
Operations mutation ownership     false
Accounting order read             312
Accounting expenses read          316
Accounting write-offs read        317 staged
Accounting General Ledger read    318 staged
Accounting summary read           319 staged
Contract catalog                  319
Passive service adapters          319
```

## Application-module open work

### Commerce & Operations

Remaining loader/runtime coverage:

```text
/admin/gift-cards/
/admin/members/
/admin/membership/
/admin/custom-request/
/admin/today-tasks/
```

Do not conflate loader coverage with mutation-authority extraction.

### Creative & Production

Still open:

- bounded top-level `creative-production` runtime activation;
- CAIP service/contract extraction;
- Content service/contract extraction;
- retirement of `creative-process-compat.js` only after every remaining action has an owned destination;
- keep Packaging business logic out of Core.

### Business & Administration

Accounting is now materially extracted from the old monolith at the read boundary. Marketing, Platform and Administration still need bounded services/runtime work before top-level Business & Administration activation.

## Next Accounting queue after Builds 317–319 validate

```text
Build 320 — accounting-overhead-allocations read extraction
Build 321 — accounting-overhead-product-allocations read extraction
Build 322 — product-cost read extraction
```

Then audit `/admin/accounting/` for the first bounded read-only Business & Administration runtime activation.

## Separate schema/data parity track — DO NOT MIX

Fresh-install schema parity remains separate and must be repaired before any Production business-data copy.

If any read contract reports missing tables/columns, record that evidence and repair it through the schema-parity workflow. Never restore request-time DDL to GET/read handlers.

## Validation interaction preference

Keep validation concise: one GIT BASH block plus one Firefox-safe BROWSER DEVTOOLS CONSOLE block unless a failure requires deeper isolation.
