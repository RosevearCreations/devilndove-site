# Build 318 — General Ledger Read Extraction

## Status — STAGED / VALIDATION REQUIRED

Baseline: `7ffceabb8a11d7e3f4e4b3dfc4ea923811e28a96`.

## Purpose

Move General Ledger GET/read authority into an Accounting-owned, schema-aware, non-mutating service while preserving all historical General Ledger write behavior.

## New read authority

```text
functions/api/_lib/accountingGeneralLedgerReadService.js
build             318
contract          accounting-general-ledger-read
owner             accounting
authority table   general_ledger_accounts
```

The service reads accounts, GIFI review summary, and finalization blockers. It performs no CREATE/ALTER/DROP/INSERT/UPDATE/DELETE.

## Dedicated contract

```text
GET /api/admin/contracts/accounting-general-ledger-read
```

Authenticated, GET-only, no-store.

## Legacy compatibility

`GET /api/admin/general-ledger-accounts` delegates to the new Accounting read service and preserves:

- `accounts`
- `summary`
- `starter_mapping_count`

The historical POST remains unchanged in responsibility and still owns:

- account create/update;
- starter GIFI mapping application;
- bulk review/finalization actions;
- write-side `ensureTable()` behavior;
- audit logging.

## Core composition identity

Contract catalog and passive service adapters advance to Build 318. Core composes the service but does not own General Ledger business logic.

## Runtime identities unchanged

```text
Core runtime implementation    305
Commerce/Operations runtime    315
Accounting expenses read       316
Accounting write-offs read     317
General Ledger read            318
Contract catalog               318
Passive service adapters       318
```

## Safety boundary

No SQL migration, schema repair, Production, Orders/payment mutation, Operations loader, Inventory authority, Creative consumer, or General Ledger POST semantic change occurs in Build 318.

## Next

Build 319 should remove `ensureAccountingSchema()` from `accounting-summary.js` GET by extracting a schema-aware Accounting summary read service while preserving the legacy response shape.
