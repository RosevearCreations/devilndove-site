# Build 312 — Accounting Read Contract

## Status — STAGED / VALIDATION REQUIRED

Baseline:

```text
78546a6b9304ce38d0a42b130445a7504a15823f
Build 311 set completed inventory-cost handoff
```

Real Devil n Dove Production remains frozen at Build 280.

## Purpose

Build 312 implements the remaining declared read prerequisite for the future Commerce & Operations `operations` domain:

```text
catalog-read      implemented
inventory-read    implemented
accounting-read   Build 312
```

Build 312 does **not** activate Operations. It only gives Operations a bounded Accounting-owned read authority that can be proven independently first.

## Existing Accounting behavior is not reused as the contract

`functions/api/admin/accounting-summary.js` currently calls `ensureAccountingSchema()` during GET. That legacy admin endpoint may remain for compatibility, but it is not an acceptable module-contract read authority because a read contract must not create or repair schema as a side effect.

Build 312 leaves both of these existing files unchanged:

```text
functions/api/admin/accounting-summary.js
functions/api/_lib/accounting.js
```

## Accounting authority

The existing Accounting-owned order projection is:

```text
accounting_order_records
```

It contains the bounded operational financial state that Operations needs:

```text
order identity
entry status
currency
booked total
amount paid
amount outstanding
tax liability
source order status
source payment status
created/updated timestamps
```

Customer name/email are intentionally not exposed by the Build 312 contract because Operations does not need those fields to establish the Accounting boundary.

## New read-only route

```text
GET /api/admin/contracts/accounting-read
```

Implementation:

```text
functions/api/admin/contracts/accounting-read.js
```

Identity:

```text
build            312
contract         accounting-read
owner            accounting
mode             read-only-order-financial-state
authority table  accounting_order_records
```

The route is authenticated and GET-only.

## No request-time schema mutation

The Build 312 route does not import or call:

```text
ensureAccountingSchema
syncAccountingForOrder
```

and contains no:

```text
CREATE TABLE
ALTER TABLE
DROP TABLE
INSERT
UPDATE
DELETE
```

It may read `sqlite_master` and `PRAGMA table_info(accounting_order_records)` to report schema readiness.

## Schema-aware fallback

Schema parity remains a separate workstream. Therefore the contract does not repair missing schema.

If `accounting_order_records` is missing, the contract returns a controlled read response:

```text
ok             true
schema_ready   false
missing_tables accounting_order_records
records        []
```

If required columns are missing, it returns `schema_ready=false` with `missing_columns`.

If the authority is present and compatible, it returns `schema_ready=true` with current summary and recent order-linked Accounting records.

This makes the contract safe for fresh-install diagnostics without mixing schema repair into module extraction.

## Read model

The contract exposes a summary:

```text
records_count
total_booked_cents
total_paid_cents
total_outstanding_cents
total_tax_cents
open_records_count
```

and bounded recent records:

```text
accounting_order_record_id
order_id
order_number
entry_status
currency
total_cents
amount_paid_cents
amount_outstanding_cents
tax_liability_cents
source_order_status
source_payment_status
created_at
updated_at
```

Optional query parameters:

```text
status
limit (1..100)
```

## Passive browser service

Build 312 registers `accounting-read` in:

```text
public/js/core/dd-module-service-adapters.mjs
```

Service identity:

```text
owner  accounting
mode   read-only-http
```

Registration performs no network request. A request occurs only when a consumer calls `.list()`.

## Operations prerequisite composition

Commerce runtime Build 312 exposes the future Operations service requirement:

```text
operations:
  catalog-read
  inventory-read
  accounting-read
```

But active runtime domains remain:

```text
SUPPORTED_DOMAINS = ['catalog', 'inventory']
runtimeDomains    = ['catalog', 'inventory']
```

Therefore:

```text
operationsRuntimeActive = false
```

Build 312 proves prerequisite composition without performing the Operations activation itself.

## Runtime identity

```text
Core architecture               302
Catalog runtime                 304
Inventory runtime               305
Inventory write boundary        310
Inventory cost contract         311
Accounting read contract        312
Commerce runtime                312
Core runtime implementation     305
Operations runtime active       false
```

## Safety boundary

Build 312 does not modify:

- legacy Accounting summary/schema helper behavior;
- Accounting journals/posting/close controls;
- Inventory post/reverse authorities;
- Creative Inventory consumers;
- Operations implementation;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production;
- schema/data parity work.

## Decision after validation

If Development reports `schema_ready=true`, the next bounded build may consider Operations runtime activation.

If Development reports `schema_ready=false`, do **not** activate Operations yet. Record the missing Accounting schema as a schema-parity blocker and resolve it on the separate schema-parity track first.
