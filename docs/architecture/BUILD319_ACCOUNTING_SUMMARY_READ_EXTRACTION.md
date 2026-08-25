# Build 319 — Accounting Summary Read Extraction

## Status — COMPLETE IN DEVELOPMENT

Baseline:

```text
246bee5c9069c15e17b21ac13c3490f0e80fee08
Build 318 source checkpoint
```

Proven source/runtime head:

```text
7a5c41d4a426f30a0fe1ab7887ea071a51529cf8
Build 319 relax brittle branching wording assertion
```

## Purpose

Remove request-time schema creation/repair from the legacy Accounting Summary GET and place summary reads behind an Accounting-owned authority.

The historical handler called `ensureAccountingSchema(db)` during GET. Build 319 removes that dependency entirely.

## Accounting-owned read authority

```text
functions/api/_lib/accountingSummaryReadService.js
build             319
contract          accounting-summary-read
owner             accounting
authority table   accounting_order_records
```

The service reads current accounting totals, open-record count and recent order-linked accounting records. It performs only schema inspection and SELECTs and reports `request_time_schema_mutation=false`.

Dedicated contract:

```text
GET /api/admin/contracts/accounting-summary-read
```

`GET /api/admin/accounting-summary` now delegates to this service while retaining safe incident/fallback behavior. Missing schema is reported rather than repaired.

## Runtime identities

```text
Core architecture                 302
Core runtime implementation       305
Commerce/Operations runtime       315
Accounting order read             312
Accounting expenses read          316
Accounting write-offs read        317
Accounting General Ledger read    318
Accounting summary read           319
Contract catalog                  319
Passive service adapters          319
```

## Consolidated Builds 317–319 proof

Local regressions:

```text
BUILD 317 ACCOUNTING WRITEOFFS READ EXTRACTION: PASS
No Cloudflare resource was contacted.
BUILD 318 GENERAL LEDGER READ EXTRACTION: PASS
No Cloudflare resource was contacted.
BUILD 319 ACCOUNTING SUMMARY READ EXTRACTION: PASS
No Cloudflare resource was contacted.
```

Development browser proof showed all three legacy GETs and all three dedicated contracts returning HTTP 200, schema ready `true`, and request-time schema mutation `false`.

Additional proven values:

```text
contract_catalog_build          319
service_adapter_build           319
core_runtime_build              305
commerce_runtime_build          315
owns_operations_mutations       false
contracts_ok                    true
services_ok                     true
```

General Ledger retained `starter_mapping_count=19`.

## Three-step Accounting progress

Builds 317–319 remove read-time schema mutation from:

```text
/api/admin/accounting-writeoffs
/api/admin/general-ledger-accounts
/api/admin/accounting-summary
```

Their dedicated contracts are:

```text
/api/admin/contracts/accounting-writeoffs-read
/api/admin/contracts/accounting-general-ledger-read
/api/admin/contracts/accounting-summary-read
```

Write authority remains separate wherever a legacy POST exists.

## Safety boundary

Build 319 did not change SQL/schema migrations, Core runtime implementation, Commerce runtime, Operations page coverage, Orders/payment mutation APIs, Inventory authority, Creative consumers, Cloudflare config, R2 or Production.

## Next direction

Continue with:

```text
Build 320 — accounting-overhead-allocations read extraction
Build 321 — accounting-overhead-product-allocations read extraction
Build 322 — product-cost read extraction
```

Then audit the Accounting administration page for the first bounded Business & Administration runtime activation.

**Builds 317, 318 and 319 are COMPLETE IN DEVELOPMENT.**
