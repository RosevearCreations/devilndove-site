# Build 315 — Orders Operations Runtime Coverage

## Status — COMPLETE IN DEVELOPMENT

Baseline:

```text
c29aca8c789ac53e9418f6074e8408b56391d7e5
Build 314 set completed runtime handoff context
```

Proven source/runtime head:

```text
1984d97d5656691d44ad96917d15e38b07e71016
Build 315 update modular handoff context
```

Real Devil n Dove Production remains frozen at Build 280.

## Purpose

Build 315 expands the read-only Commerce & Operations runtime from two proven Operations pages to three:

```text
/admin/operations/
/admin/customer-documents/
/admin/orders/
```

This build is loader/runtime coverage only. It does not migrate Orders or payment business writes.

## Orders loader coverage

`/admin/orders/` now loads:

```text
/public/js/admin.js?v=315
```

before the existing Orders business scripts:

```text
/public/js/admin-orders.js
/public/js/admin-order-detail.js
/public/js/admin-gift-card-order-redemption.js
/public/js/admin-accounting-backend.js
```

Those files remain unchanged from the completed Build 314 baseline.

The current Orders/payment API authorities also remain unchanged, including:

```text
functions/api/admin/orders.js
functions/api/admin/update-order-status.js
functions/api/admin/record-payment.js
functions/api/admin/payment-actions.js
functions/api/admin/order-payments.js
```

Order status changes, payment recording/actions, gift-card redemption and Accounting backend behavior therefore remain compatibility behavior underneath the read-only application-module shell.

## Explicit Operations page allow-list

Commerce runtime Build 315 defines exactly:

```text
/admin/operations/
/admin/customer-documents/
/admin/orders/
```

For the `operations` domain, both runtime load and activation reject paths not present in this list.

## Runtime service boundary

Operations consumes exactly:

```text
catalog-read
inventory-read
accounting-read
```

All are passive read services.

The runtime reports:

```text
createsNetworkTransport = false
ownsInventoryMutations   = false
ownsOperationsMutations  = false
```

Build 315 introduces no Orders mutation service and no write authority.

## Runtime identity

```text
Core architecture               302
Core runtime implementation     305
Catalog runtime                 304
Inventory runtime               305
Inventory write boundary        310
Inventory cost contract         311
Accounting read contract        312
Operations runtime              315
Operations coverage build       315
Commerce runtime                315
```

## Validation proof

Local regression:

```text
BUILD 315 ORDERS OPERATIONS RUNTIME: PASS
No Cloudflare resource was contacted.
```

Development browser proof on `/admin/orders/`:

```text
admin_script                     .../public/js/admin.js?v=315
commerce_runtime_build           315
domain                           operations
application_module               commerce-operations
application_module_mode          active
active_required_services         catalog-read,inventory-read,accounting-read
operations_runtime_active        true
current_operations_page_proven   true
operations_coverage              /admin/operations/,/admin/customer-documents/,/admin/orders/
owns_operations_mutations        false
accounting_build                 312
accounting_schema_ready          true
accounting_schema_mutation       false
contracts_ok                     true
services_ok                      true
```

The historical Orders business scripts were also present unchanged.

## Legacy Accounting backend 500 — separate defect

During browser proof, the unchanged legacy Accounting backend requested:

```text
GET /api/admin/accounting-expenses
```

and received HTTP 500.

This is outside the Build 315 changed-file boundary and does not invalidate the runtime proof. The proven Build 312 `accounting-read` contract remained healthy, schema-ready and non-mutating.

Repository review indicates two legacy concerns in `functions/api/admin/accounting-expenses.js`:

1. its GET joins an attachment aggregate that also exposes `expense_id`, while parts of the outer select/order logic use unqualified `expense_id`; this can produce an SQLite/D1 ambiguous-column failure;
2. the GET still invokes request-time schema creation/repair helpers, unlike the newer read-only Accounting contract boundary.

These concerns belong in a separate bounded correction build. Do not silently modify the Build 315 loader-only boundary to fix them.

## Route-family limitation

Build 315 does not claim these Operations route groups are migrated:

```text
/admin/gift-cards/
/admin/members/
/admin/membership/
/admin/custom-request/
/admin/today-tasks/
```

Those routes remain outside the explicit allow-list until separate bounded coverage passes.

## Safety boundary

Build 315 did not modify:

- Orders business JavaScript;
- order/payment/refund/gift-card mutation APIs;
- Customer Documents business JavaScript or APIs;
- Catalog, Inventory or Accounting contract implementations;
- Inventory post/reverse authorities;
- Creative Inventory consumers;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production;
- schema/data parity work.

## Next direction

The most urgent next bounded correction is the observed legacy `/api/admin/accounting-expenses` 500. Fix that separately from Operations loader coverage, preferably by:

1. correcting the ambiguous expense-column query;
2. making GET schema-aware/non-mutating rather than performing request-time DDL;
3. preserving POST expense authority separately;
4. adding regression coverage that prevents the read path from recreating schema.

After that correction is proven, continue Operations route coverage one bounded group at a time.
