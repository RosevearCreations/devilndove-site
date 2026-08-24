# Build 312 — Accounting Read Contract

## Status — COMPLETE IN DEVELOPMENT

Baseline:

```text
78546a6b9304ce38d0a42b130445a7504a15823f
Build 311 set completed inventory-cost handoff
```

Proven source/runtime head:

```text
6d99d05e40999776ab38f91fbaa182e9232db547
Build 312 update Accounting read handoff context
```

Real Devil n Dove Production remains frozen at Build 280.

## Purpose

Build 312 implemented the remaining declared read prerequisite for future Commerce & Operations `operations` activation:

```text
catalog-read      implemented
inventory-read    implemented
accounting-read   implemented Build 312
```

Operations was intentionally not activated in Build 312.

## Accounting authority

The Accounting-owned order projection is:

```text
accounting_order_records
```

Build 312 exposes only bounded order-linked financial/payment state needed by Operations:

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

Customer name/email, journals, bank imports, close controls and Accounting mutations remain outside this contract.

## Read-only route

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

## No request-time schema mutation

The contract does not import or call:

```text
ensureAccountingSchema
syncAccountingForOrder
```

and performs no request-time DDL or writes.

The existing compatibility files remain unchanged:

```text
functions/api/admin/accounting-summary.js
functions/api/_lib/accounting.js
```

Those files may retain historical schema-guard behavior, but they are not the new module-contract authority.

## Schema readiness proof

Development returned:

```text
accounting_schema_ready    true
accounting_missing_tables  <empty>
accounting_missing_columns <empty>
accounting_schema_mutation false
```

Therefore the Accounting read prerequisite is both implemented and compatible with the current Development schema.

## Passive browser service

Build 312 registers:

```text
accounting-read
owner accounting
mode  read-only-http
```

Registration performs no request until `.list()` is called.

## Operations prerequisite composition

Commerce runtime Build 312 exposes the future Operations read requirements:

```text
operations:
  catalog-read
  inventory-read
  accounting-read
```

Build 312 itself kept active runtime domains at:

```text
SUPPORTED_DOMAINS = ['catalog', 'inventory']
runtimeDomains    = ['catalog', 'inventory']
operationsRuntimeActive = false
```

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

## Validation proof

Local regression:

```text
BUILD 312 ACCOUNTING READ CONTRACT: PASS
No Cloudflare resource was contacted.
```

Development browser proof confirmed:

```text
operations_required_services  catalog-read,inventory-read,accounting-read
accounting_service_owner      accounting
accounting_service_mode       read-only-http
accounting_contract           accounting-read
accounting_build              312
accounting_authority_table    accounting_order_records
accounting_schema_ready       true
accounting_schema_mutation    false
accounting_rows               0
operations_runtime            <none>
contracts_ok                  true
services_ok                   true
```

`accounting_rows=0` is valid Development business-data state.

## Safety boundary

Build 312 did not modify:

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

## Next direction

The three read prerequisites for Operations are now implemented and Development schema readiness is green. The next bounded build may activate the `operations` domain under Commerce & Operations in a read-only runtime mode.

That activation must not migrate order/payment/customer mutations. It should first prove route classification, shared-loader coverage and passive access to the three required read services.
