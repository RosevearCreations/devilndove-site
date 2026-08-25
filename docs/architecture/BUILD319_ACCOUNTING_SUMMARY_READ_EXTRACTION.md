# Build 319 — Accounting Summary Read Extraction

## Status — STAGED / VALIDATION REQUIRED

Baseline: `246bee5c9069c15e17b21ac13c3490f0e80fee08`.

## Purpose

Remove request-time schema creation/repair from the legacy Accounting Summary GET and place summary reads behind an Accounting-owned authority.

The historical handler called `ensureAccountingSchema(db)` during GET. Build 319 removes that dependency entirely.

## New read authority

```text
functions/api/_lib/accountingSummaryReadService.js
build             319
contract          accounting-summary-read
owner             accounting
authority table   accounting_order_records
```

The service reads:

- current accounting totals;
- open-record count;
- recent order-linked accounting records;
- customer name/email retained for compatibility with the existing admin summary UI.

It performs only schema inspection and SELECTs and reports `request_time_schema_mutation=false`.

## Dedicated contract

```text
GET /api/admin/contracts/accounting-summary-read
```

Authenticated, GET-only, no-store.

## Legacy compatibility

`GET /api/admin/accounting-summary` now delegates to the Accounting-owned service.

The legacy handler retains safe incident/fallback behavior if an unexpected read failure occurs. Missing schema is not repaired during the request; the service reports `schema_ready=false`, `missing_tables`, and `missing_columns` instead.

## Core composition

The passive contract catalog and service adapters advance to Build 319. Core remains a composition/registration layer; Accounting owns the summary logic.

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

## Three-step Accounting progress

Builds 317–319 remove read-time schema mutation from:

```text
/api/admin/accounting-writeoffs
/api/admin/general-ledger-accounts
/api/admin/accounting-summary
```

Their corresponding dedicated contracts are:

```text
/api/admin/contracts/accounting-writeoffs-read
/api/admin/contracts/accounting-general-ledger-read
/api/admin/contracts/accounting-summary-read
```

Write authority remains separate wherever a legacy POST exists.

## Safety boundary

Build 319 does not change SQL/schema migrations, Core runtime implementation, Commerce runtime, Operations page coverage, Orders/payment mutation APIs, Inventory authority, Creative consumers, Cloudflare config, R2, Production, or Git branch refs.

## Next direction

Continue the Accounting read-time DDL retirement queue with overhead allocations/product-cost read paths, then decide whether there is enough owned Accounting surface to activate the first bounded Business & Administration runtime page.
