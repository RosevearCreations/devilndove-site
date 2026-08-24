# Build 314 — Customer Documents Operations Runtime Coverage

## Status — STAGED / VALIDATION REQUIRED

Baseline:

```text
4ba68bf720561fab590e2dfb74581c0adf871b46
Build 313 set completed Operations runtime handoff
```

Real Devil n Dove Production remains frozen at Build 280.

## Purpose

Build 314 expands the read-only Commerce & Operations runtime from the first proven Operations page to a second explicit page:

```text
/admin/operations/
/admin/customer-documents/
```

This build is loader/runtime coverage only. It does not migrate Customer Documents business writes.

## Why Customer Documents is next

`/admin/customer-documents/` already loaded the shared `admin.js` bridge, but it was pinned to the historical `v=245` cache identity. Its business implementation is still the established Build 227 script:

```text
/public/js/admin-customer-documents.js?v=227
```

Build 314 updates only the shared module-loader pin and runtime coverage boundary. The document-issue/void implementation remains untouched.

## Explicit Operations page allow-list

Commerce runtime Build 314 defines:

```text
/admin/operations/
/admin/customer-documents/
```

as the only proven Operations runtime pages.

For the `operations` domain, the runtime checks the current pathname during both load and activation. A legacy Operations-classified page that happens to load a current shared Admin bridge is rejected unless its path is in this allow-list.

This keeps runtime coverage honest while the route family is migrated incrementally.

## Runtime service boundary

Operations still consumes exactly:

```text
catalog-read
inventory-read
accounting-read
```

All are passive read services. Build 314 does not add a Customer Documents mutation service or move any document business authority.

Runtime remains:

```text
createsNetworkTransport = false
ownsInventoryMutations   = false
ownsOperationsMutations  = false
```

## Customer Documents behavior remains legacy-compatible

The existing page continues to load:

```text
/public/js/admin-customer-documents.js?v=227
```

Build 314 does not modify that file or the APIs it calls. Existing issue, print, retain, void, credit-note and refund-confirmation behavior therefore stays beneath the read-only application-module shell.

No mutation is used to validate Build 314.

## Existing Operations page remains proven

`/admin/operations/` is re-pinned to:

```text
/public/js/admin.js?v=314
```

so the original Build 313 proof page and the newly added Customer Documents page share the same current runtime graph.

## Runtime identity

```text
Core architecture               302
Core runtime implementation     305
Catalog runtime                 304
Inventory runtime               305
Inventory write boundary        310
Inventory cost contract         311
Accounting read contract        312
Operations runtime              314
Operations coverage build       314
Commerce runtime                314
```

## Route-family limitation

Build 314 does not claim these Operations route groups are migrated:

```text
/admin/orders/
/admin/gift-cards/
/admin/members/
/admin/membership/
/admin/custom-request/
/admin/today-tasks/
```

`/admin/orders/` remains especially important because it currently has no shared `admin.js` module bridge. It must be handled in a later bounded loader-coverage build before being called runtime-migrated.

## Safety boundary

Build 314 does not modify:

- Customer Documents business JavaScript or APIs;
- order/payment behavior;
- gift-card or membership behavior;
- Catalog, Inventory or Accounting contract implementations;
- Inventory post/reverse authorities;
- Creative Inventory consumers;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production;
- schema/data parity work.

## Validation

Build 314 validation proves only the runtime shell on Customer Documents:

1. Development serves `admin.js?v=314`;
2. domain resolves to `operations`;
3. application module is `commerce-operations` and active;
4. Commerce runtime is Build 314;
5. active services are `catalog-read,inventory-read,accounting-read`;
6. `/admin/customer-documents/` is in the explicit Operations page allow-list;
7. `currentOperationsPageProven=true`;
8. Operations mutation ownership is false;
9. Accounting remains Build 312 and schema-ready;
10. the historical Customer Documents business script remains loaded unchanged.

## Next direction

After Build 314 is proven, continue Operations route coverage one bounded page group at a time. `/admin/orders/` is a logical next loader target, but its loader addition must remain separate from any order/payment mutation-authority extraction.
