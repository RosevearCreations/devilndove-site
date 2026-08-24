# Build 315 Validation — Orders Operations Runtime Coverage

## Status — STAGED / VALIDATION REQUIRED

Baseline:

```text
c29aca8c789ac53e9418f6074e8408b56391d7e5
Build 314 set completed runtime handoff context
```

Build 314 is COMPLETE IN DEVELOPMENT.

Build 315 expands the proven read-only Operations runtime page set to exactly:

```text
/admin/operations/
/admin/customer-documents/
/admin/orders/
```

Orders business scripts and APIs remain unchanged.

## One GIT BASH block

```bash
git pull --ff-only origin dev
python scripts/build315_orders_operations_runtime_test.py
git status --short
```

Expected ending:

```text
BUILD 315 ORDERS OPERATIONS RUNTIME: PASS
No Cloudflare resource was contacted.
```

`git status --short` should be empty.

## One BROWSER DEVTOOLS CONSOLE block

Open and hard-refresh:

```text
https://devilndove-site-dev.pages.dev/admin/orders/
```

The browser proof must confirm:

- `admin.js?v=315` is present;
- the historical Orders business scripts remain present;
- domain is `operations`;
- application module is `commerce-operations` and mode is active;
- Commerce runtime is Build 315;
- active required services remain `catalog-read,inventory-read,accounting-read`;
- `/admin/orders/` is in the explicit Operations runtime page allow-list;
- Operations mutation ownership remains false;
- Accounting remains Build 312, schema-ready and non-mutating;
- contracts/services remain green.

Expected architectural values:

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

No order update, payment record, refund, gift-card redemption, status change or other mutation is required for validation.

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

Do not mark Build 315 complete until:

1. local regression passes;
2. working tree is clean;
3. Development serves `admin.js?v=315` on Orders;
4. Orders resolves to Operations under Commerce & Operations;
5. Commerce runtime is Build 315 and current-page coverage is true;
6. all three Operations read services remain available;
7. Operations mutation ownership remains false;
8. all existing Orders business scripts/API authorities remain unchanged;
9. no SQL/schema/config/R2/real Production change occurs.
