# Build 318 — General Ledger Read Extraction

## Status — COMPLETE IN DEVELOPMENT

Baseline:

```text
7ffceabb8a11d7e3f4e4b3dfc4ea923811e28a96
Build 317 source checkpoint
```

Build 318 source checkpoint:

```text
246bee5c9069c15e17b21ac13c3490f0e80fee08
```

Consolidated Builds 317–319 proven head:

```text
7a5c41d4a426f30a0fe1ab7887ea071a51529cf8
```

## Purpose

Move General Ledger GET/read authority into an Accounting-owned, schema-aware, non-mutating service while preserving all historical General Ledger write behavior.

## Accounting-owned read authority

```text
functions/api/_lib/accountingGeneralLedgerReadService.js
build             318
contract          accounting-general-ledger-read
owner             accounting
authority table   general_ledger_accounts
```

The service reads accounts, GIFI review summary and finalization blockers. It performs no CREATE/ALTER/DROP/INSERT/UPDATE/DELETE.

Dedicated contract:

```text
GET /api/admin/contracts/accounting-general-ledger-read
```

`GET /api/admin/general-ledger-accounts` delegates to the new Accounting read service and preserves:

- `accounts`
- `summary`
- `starter_mapping_count`

The historical POST remains compatibility write authority for account create/update, starter GIFI mappings, bulk review/finalization, audit logging and write-side `ensureTable()` behavior.

## Runtime identity

```text
Core runtime implementation    305
Commerce/Operations runtime    315
Accounting expenses read       316
Accounting write-offs read     317
General Ledger read            318
```

Core composes the service but does not own General Ledger business rules.

## Validation proof

Local regression:

```text
BUILD 318 GENERAL LEDGER READ EXTRACTION: PASS
No Cloudflare resource was contacted.
```

Development browser proof:

```text
gl_legacy_status                  200
gl_legacy_build                   318
gl_legacy_schema_ready            true
gl_legacy_schema_mutation         false
gl_starter_mapping_count          19
gl_contract_status                200
gl_contract_build                 318
gl_contract_owner                 accounting
gl_service_build                  318
gl_service_schema_mutation        false
```

## Safety boundary

Build 318 did not change General Ledger POST semantics, SQL/schema migrations, Core runtime, Commerce runtime, Operations loader coverage, Orders/payment mutations, Inventory authority, Creative consumers, Cloudflare config, R2 or Production.

**Build 318 is COMPLETE IN DEVELOPMENT.**
