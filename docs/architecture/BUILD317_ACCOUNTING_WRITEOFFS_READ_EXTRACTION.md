# Build 317 — Accounting Write-Offs Read Extraction

## Status — STAGED / VALIDATION REQUIRED

Baseline:

```text
343a67de711234f193614f38e83a46122e205197
Build 316 set completed Accounting handoff context
```

## Purpose

Build 317 applies the Build 316 Accounting read rule to write-offs:

```text
GET/read paths inspect and report schema readiness.
Migrations/readiness tooling owns schema creation/repair.
Write paths remain separate until independently extracted.
```

The historical `GET /api/admin/accounting-writeoffs` called `ensureTable()`, allowing CREATE/ALTER work during a read.

## New Accounting-owned read authority

```text
functions/api/_lib/accountingWriteoffsReadService.js
build             317
contract          accounting-writeoffs-read
owner             accounting
authority table   accounting_writeoffs
```

The service performs only schema inspection and SELECT operations. It reports:

- `schema_ready`
- `missing_tables`
- `missing_columns`
- `request_time_schema_mutation=false`
- `writeoffs`
- `count`

## Dedicated contract

```text
GET /api/admin/contracts/accounting-writeoffs-read
```

The contract is authenticated, GET-only, no-store, and delegates to Accounting authority.

## Legacy compatibility route

`GET /api/admin/accounting-writeoffs` now delegates to the Accounting-owned service and preserves the historical `writeoffs` field.

`POST /api/admin/accounting-writeoffs` remains the existing compatibility write path. Its period-open check, insert, audit logging, and write-side schema ensure behavior are intentionally unchanged.

## Core composition

The passive contract catalog and service adapter registry advance to Build 317 and register:

```text
accounting-writeoffs-read
owner     accounting
consumer  operations
mode      read-only-http
```

Core registers/composes the contract but does not own Accounting business logic.

## Runtime identity

```text
Core architecture              302
Core runtime implementation    305
Commerce/Operations runtime    315
Accounting order read          312
Accounting expenses read       316
Accounting write-offs read     317
Contract catalog               317
Passive service adapters       317
```

## Safety boundary

Build 317 does not change write-off POST semantics, Accounting expenses, General Ledger, Accounting Summary, Orders/payment behavior, Operations page coverage, SQL/schema, Cloudflare config, R2, Production, or business-data migration.

## Next

Build 318 should apply the same read extraction to `general-ledger-accounts.js`, preserving GIFI/starter-mapping write behavior while removing `ensureTable()` from GET.
