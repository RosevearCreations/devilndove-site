# Build 316 — Accounting Expenses Read Correction and Core Contract Identity

## Status — STAGED / VALIDATION REQUIRED

Baseline:

```text
2edcc42865fe818baa5091f6db55c94dcb6c5363
Build 315 set completed modular handoff context
```

Real Devil n Dove Production remains frozen at Build 280.

## Purpose

Build 316 fixes the Development 500 observed on:

```text
GET /api/admin/accounting-expenses
```

while advancing the Core/domain split instead of applying only a local SQL patch.

The build establishes an Accounting-owned read boundary for expenses, preserves the old route as a compatibility wrapper, and keeps expense writes on their existing legacy POST path.

## Defect found

The historical GET implementation joined an attachment-count subquery containing `expense_id` while selecting and ordering by an unqualified `expense_id` from `accounting_expenses`.

That makes the query vulnerable to SQLite/D1 ambiguity once the attachment join is present.

The same GET also called schema-creation/repair helpers for:

```text
accounting_vendors
accounting_attachments
accounting_expenses
```

so a read request could perform `CREATE TABLE`, `ALTER TABLE`, and index creation.

Both behaviors are outside the desired modular boundary.

## New Accounting-owned read service

Implementation:

```text
functions/api/_lib/accountingExpensesReadService.js
```

Identity:

```text
build             316
contract          accounting-expenses-read
owner             accounting
mode              read-only-accounting-expenses
authority table   accounting_expenses
attachment table  accounting_attachments
```

The service:

- performs only schema inspection and SELECTs;
- never creates or repairs schema;
- aliases the authority table as `ae`;
- selects `ae.expense_id AS expense_id`;
- joins attachment counts using `aa.expense_id = ae.expense_id`;
- orders by fully qualified `ae.expense_id`;
- treats the attachment table as optional;
- returns `attachment_count=0` if attachment linkage is unavailable;
- reports `schema_ready`, `missing_tables`, and `missing_columns` instead of mutating schema.

## New GET-only contract route

```text
GET /api/admin/contracts/accounting-expenses-read
```

Implementation:

```text
functions/api/admin/contracts/accounting-expenses-read.js
```

The route is authenticated, GET-only, no-store, and delegates to the Accounting-owned service.

It contains no request-time DDL and no write operation.

## Legacy compatibility route

The existing route remains:

```text
/api/admin/accounting-expenses
```

Build 316 changes only its GET behavior.

### GET

The GET handler now delegates to `readAccountingExpenses()` and preserves the historical response field:

```text
expenses
```

so `public/js/admin-accounting-backend.js` does not require a business-layer rewrite in this build.

The compatibility GET now also returns Build 316 contract/readiness metadata.

### POST

POST is intentionally not migrated.

The existing compatibility write path still owns:

- vendor resolution;
- period-open validation;
- legacy schema ensure/repair behavior;
- expense insertion;
- audit logging.

This is deliberate. Build 316 is a read-authority extraction and must not silently move expense write authority.

## Core contract boundary

Build 316 updates the passive Core catalogs:

```text
public/js/core/dd-module-contracts.mjs
public/js/core/dd-module-service-adapters.mjs
```

Both now expose explicit build identity:

```text
BUILD = 316
```

The contract catalog declares:

```text
accounting-expenses-read
owner     accounting
consumer  operations
kind      read
status    implemented
route     /api/admin/contracts/accounting-expenses-read
```

The passive adapter registry exposes the same contract as:

```text
owner accounting
mode  read-only-http
```

Core registers/composes this service but does not own Accounting logic.

## Runtime identities deliberately unchanged

Build 316 does not activate a new application runtime and does not widen Operations coverage.

```text
Core architecture               302
Core runtime implementation     305
Contract catalog                316
Passive service adapters        316
Commerce runtime                315
Operations runtime              315
Accounting order read contract  312
Accounting expenses read        316
```

The proven Operations page allow-list remains:

```text
/admin/operations/
/admin/customer-documents/
/admin/orders/
```

## Other split findings

Build 316 also creates:

```text
docs/architecture/MODULAR_SPLIT_OPEN_ITEMS.md
```

The audit records:

- remaining Operations loader coverage;
- mutation-heavy Operations authorities that still need dedicated extraction;
- Creative compatibility retirement work;
- Business & Administration runtime work;
- additional legacy Accounting GET handlers that still mutate schema;
- source-control rules separating logical application modules from Git branches.

## Git branch finding

The repository currently contains:

```text
main
dev
build291-candidate
build292-candidate
build293-candidate
build294-candidate
```

Each historical candidate branch is fully contained in `dev` (`behind_by=0` relative to `dev`). They are retirement candidates, but Build 316 does not delete them.

The three top-level application modules must remain runtime/application boundaries, not permanent Git branches.

## Safety boundary

Build 316 does not modify:

- Commerce runtime Build 315;
- Operations page allow-list;
- Orders/payment/refund/gift-card business scripts or APIs;
- Customer Documents business behavior;
- Inventory authorities;
- Creative consumers;
- Accounting expense POST semantics;
- other Accounting GET handlers yet;
- SQL migrations or aggregate schema;
- Cloudflare bindings/config;
- R2;
- Git branch deletion;
- real Production;
- Production-to-Development business-data migration.

## Validation

Build 316 must prove:

1. local regression passes;
2. changed-file boundary is exact;
3. the new read service contains no DDL/write SQL;
4. the new contract is GET-only;
5. legacy expense GET delegates to the service and does not call schema ensure helpers;
6. legacy expense POST still retains its compatibility write path;
7. Development legacy GET returns HTTP 200 instead of the observed 500;
8. the dedicated contract returns HTTP 200;
9. both report Build 316, Accounting ownership, and `request_time_schema_mutation=false`;
10. Development reports `schema_ready=true`, or if false, returns explicit missing schema without repairing it;
11. Core catalog/adapter source identity is Build 316;
12. Commerce/Operations runtime remains Build 315;
13. no Production/schema/config/branch deletion occurs.

## Next direction

After Build 316 is proven, continue the same pattern through the Accounting read-time DDL retirement queue, beginning with `accounting-writeoffs.js`, while keeping write-authority extraction separate.
