# Build 317 — Accounting Write-Offs Read Extraction

## Status — COMPLETE IN DEVELOPMENT

Baseline:

```text
343a67de711234f193614f38e83a46122e205197
Build 316 set completed Accounting handoff context
```

Build 317 source checkpoint:

```text
7ffceabb8a11d7e3f4e4b3dfc4ea923811e28a96
```

Consolidated Builds 317–319 proven head:

```text
7a5c41d4a426f30a0fe1ab7887ea071a51529cf8
```

## Purpose

Build 317 applies the Accounting read rule to write-offs:

```text
GET/read paths inspect and report schema readiness.
Migrations/readiness tooling owns schema creation/repair.
Write paths remain separate until independently extracted.
```

The historical `GET /api/admin/accounting-writeoffs` called `ensureTable()`, allowing CREATE/ALTER work during a read.

## Accounting-owned read authority

```text
functions/api/_lib/accountingWriteoffsReadService.js
build             317
contract          accounting-writeoffs-read
owner             accounting
authority table   accounting_writeoffs
```

The service performs only schema inspection and SELECT operations. It reports schema readiness and `request_time_schema_mutation=false`.

Dedicated contract:

```text
GET /api/admin/contracts/accounting-writeoffs-read
```

The legacy GET delegates to this Accounting-owned service while preserving the historical `writeoffs` response field.

`POST /api/admin/accounting-writeoffs` remains compatibility write authority with its period-open check, insert, audit logging and write-side schema ensure behavior unchanged.

## Runtime identity

```text
Core architecture              302
Core runtime implementation    305
Commerce/Operations runtime    315
Accounting order read          312
Accounting expenses read       316
Accounting write-offs read     317
```

Core composes the contract but does not own Accounting logic.

## Validation proof

Local regression:

```text
BUILD 317 ACCOUNTING WRITEOFFS READ EXTRACTION: PASS
No Cloudflare resource was contacted.
```

Development browser proof:

```text
writeoff_legacy_status             200
writeoff_legacy_build              317
writeoff_legacy_schema_ready       true
writeoff_legacy_schema_mutation    false
writeoff_contract_status           200
writeoff_contract_build            317
writeoff_contract_owner            accounting
writeoff_service_build             317
writeoff_service_schema_mutation   false
```

## Safety boundary

Build 317 did not change write-off POST semantics, SQL/schema migrations, Core runtime, Commerce runtime, Operations page coverage, Orders/payment mutations, Cloudflare config, R2, Production, or business-data migration.

**Build 317 is COMPLETE IN DEVELOPMENT.**
