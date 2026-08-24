# Build 315 — Orders Operations Runtime Coverage

## Status — STAGED / VALIDATION REQUIRED

Baseline:

```text
c29aca8c789ac53e9418f6074e8408b56391d7e5
Build 314 set completed runtime handoff context
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

## Why Orders is next

`/admin/orders/` was already classified as the `operations` domain, but unlike the first two proven pages it did not load the shared `public/js/admin.js` runtime bridge at all.

Build 315 adds:

```text
/public/js/admin.js?v=315
```

before the existing Orders business scripts.

## Existing Orders business layer remains unchanged

The page continues to load the same compatibility scripts:

```text
/public/js/admin-orders.js
/public/js/admin-order-detail.js
/public/js/admin-gift-card-order-redemption.js
/public/js/admin-accounting-backend.js
```

Build 315 does not modify those files.

Their existing server authorities also remain unchanged, including:

```text
functions/api/admin/orders.js
functions/api/admin/update-order-status.js
functions/api/admin/record-payment.js
functions/api/admin/payment-actions.js
functions/api/admin/order-payments.js
```

Therefore order status changes, payment recording/actions, gift-card redemption and Accounting backend behavior remain compatibility behavior underneath the read-only application-module shell.

## Explicit Operations page allow-list

Commerce runtime Build 315 defines exactly:

```text
/admin/operations/
/admin/customer-documents/
/admin/orders/
```

For the `operations` domain, both runtime load and activation reject paths not present in this list.

This prevents route classification or accidental loader presence from being mistaken for completed migration.

## Runtime service boundary

Operations still consumes exactly:

```text
catalog-read
inventory-read
accounting-read
```

All are passive read services.

The runtime continues to report:

```text
createsNetworkTransport = false
ownsInventoryMutations   = false
ownsOperationsMutations  = false
```

Build 315 introduces no Orders mutation service and no write authority.

## Existing proven pages are re-pinned

To keep all proven Operations runtime pages on one cache identity, Build 315 pins:

```text
/admin/operations/          -> /public/js/admin.js?v=315
/admin/customer-documents/  -> /public/js/admin.js?v=315
/admin/orders/              -> /public/js/admin.js?v=315
```

Customer Documents still uses its unchanged Build 227 business implementation.

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

Build 315 does not modify:

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

## Validation

Build 315 validation proves only the runtime shell on Orders:

1. Development serves `admin.js?v=315` on `/admin/orders/`;
2. Orders still loads all four historical business scripts;
3. domain resolves to `operations`;
4. application module is `commerce-operations` and active;
5. Commerce runtime is Build 315;
6. active services are `catalog-read,inventory-read,accounting-read`;
7. `/admin/orders/` is in the explicit Operations allow-list;
8. `currentOperationsPageProven=true`;
9. Operations mutation ownership remains false;
10. Accounting remains Build 312 and schema-ready;
11. no mutation is performed as part of validation.

## Next direction

After Build 315 is proven, continue Operations route coverage in another bounded page group. Prefer a read-heavy or low-risk route before extracting any order/payment mutation authority.

Gift cards and members/membership require extra care because their current business actions are mutation-heavy and should not be conflated with loader coverage.
