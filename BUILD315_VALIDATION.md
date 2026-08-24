# Build 315 Validation — Orders Operations Runtime Coverage

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

Build 315 expands the proven read-only Operations runtime page set to exactly:

```text
/admin/operations/
/admin/customer-documents/
/admin/orders/
```

Orders business scripts and APIs remain unchanged.

## Local regression — PASS

Observed result:

```text
BUILD 315 ORDERS OPERATIONS RUNTIME: PASS
No Cloudflare resource was contacted.
```

The working tree was expected to remain clean after the run.

## Development browser proof — PASS

Proven on:

```text
https://devilndove-site-dev.pages.dev/admin/orders/
```

Observed architectural values:

```text
pathname                         /admin/orders/
admin_script                     .../public/js/admin.js?v=315
orders_script                    .../public/js/admin-orders.js
order_detail_script              .../public/js/admin-order-detail.js
gift_card_redemption_script      .../public/js/admin-gift-card-order-redemption.js
accounting_backend_script        .../public/js/admin-accounting-backend.js
core_runtime_build               305
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

No order update, payment record, refund, gift-card redemption, status change or other mutation was required.

## Legacy Accounting backend observation

While `/admin/orders/` loaded, the unchanged legacy Accounting backend issued:

```text
GET /api/admin/accounting-expenses -> HTTP 500
```

This does not invalidate Build 315 because:

- `public/js/admin-accounting-backend.js` was unchanged from the completed Build 314 baseline;
- `functions/api/admin/accounting-expenses.js` was unchanged from the completed Build 314 baseline;
- Build 315 changes only loader/runtime coverage and explicitly freezes the Orders/payment/Accounting compatibility behavior;
- the Build 312 `accounting-read` module contract remained healthy, schema-ready and non-mutating.

Repository review identified a likely legacy defect in `accounting-expenses.js`: the GET joins an attachment aggregate that also exposes `expense_id` while selecting/order-resolving unqualified `expense_id`, which may produce an SQLite/D1 ambiguous-column failure. The same legacy GET also performs request-time schema creation/repair through Accounting helper functions.

Treat this as a separate bounded correction after Build 315 completion. Do not fold it into the Build 315 runtime boundary.

## Coverage limitation

Build 315 still does not claim the remaining Operations route family is migrated. In particular:

```text
/admin/gift-cards/
/admin/members/
/admin/membership/
/admin/custom-request/
/admin/today-tasks/
```

remain outside the proven Build 315 runtime page set.

## Completion decision

Build 315 is COMPLETE IN DEVELOPMENT because:

1. local regression passed;
2. Development served `admin.js?v=315` on Orders;
3. Orders resolved to Operations under Commerce & Operations;
4. Commerce runtime Build 315 reported current-page coverage true;
5. all three Operations read services remained available;
6. Operations mutation ownership remained false;
7. all existing Orders business scripts/API authorities remained unchanged;
8. the observed legacy `accounting-expenses` 500 is outside the changed-file boundary and did not affect the proven Build 312 `accounting-read` contract;
9. no SQL/schema/config/R2/real Production change occurred.

No further Build 315 browser validation is required.
