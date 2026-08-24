# Build 313 — Operations Read-Only Runtime Activation

## Status — STAGED / VALIDATION REQUIRED

Baseline:

```text
3b5709c842ed7bce8335ddd57fe11420ae207367
Build 312 complete handoff and set Operations activation next
```

Real Devil n Dove Production remains frozen at Build 280.

## Purpose

Build 313 activates the first real `operations` domain page beneath the existing Commerce & Operations application runtime.

This is a runtime-shell activation only. It does not migrate Operations business writes.

## Proven prerequisites

The Operations read prerequisites were established before activation:

```text
catalog-read      implemented
inventory-read    implemented
accounting-read   implemented Build 312
```

Development also proved the Accounting authority schema is ready and request-time schema mutation is false.

## Runtime activation

Commerce runtime Build 313 supports:

```text
catalog
inventory
operations
```

Operations requires exactly:

```text
catalog-read
inventory-read
accounting-read
```

The runtime continues to report:

```text
createsNetworkTransport = false
ownsInventoryMutations   = false
ownsOperationsMutations  = false
```

The browser services remain passive. Activation verifies their registration but performs no request by itself.

## First explicitly migrated Operations page

Build 313 adds the shared loader to:

```text
/admin/operations/
```

with:

```text
/public/js/admin.js?v=313
```

That shared loader imports the Build 313 runtime graph.

## Route-family honesty

The `operations` domain classification also includes route families such as:

```text
/admin/orders/
/admin/customer-documents/
/admin/gift-cards/
/admin/members/
/admin/membership/
/admin/custom-request/
/admin/today-tasks/
```

Build 313 does not claim those routes are all migrated.

In particular, the current `/admin/orders/` page does not load the shared `admin.js` runtime bridge and is left unchanged. `/admin/customer-documents/` has a historical shared-loader pin but is not re-pinned or validated by Build 313.

Therefore Build 313's proven runtime-page coverage is intentionally:

```text
/admin/operations/
```

Additional Operations route families require later loader-coverage passes before they can be called runtime-migrated.

## Legacy behavior remains underneath

The existing scripts on `/admin/operations/` continue to load unchanged. Build 313 does not replace, intercept or rewrite notification, settings, security, live activity, webhook, custom-request or other existing page behavior.

The Commerce runtime acts as a read-only application-module shell around that existing page.

## Runtime identity

```text
Core architecture               302
Core runtime implementation     305
Catalog runtime                 304
Inventory runtime               305
Inventory write boundary        310
Inventory cost contract         311
Accounting read contract        312
Operations runtime              313
Commerce runtime                313
```

## Safety boundary

Build 313 does not modify:

- `accounting-read` or legacy Accounting behavior;
- Catalog or Inventory read contracts;
- Inventory post/reverse authorities;
- Creative Inventory consumers;
- order/payment/customer/gift-card/membership mutation handlers;
- `/admin/orders/` implementation;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production;
- schema/data parity work.

## Validation

Validation must prove:

1. `/admin/operations/` serves `admin.js?v=313`;
2. domain classification is `operations`;
3. application module is `commerce-operations` and mode is active;
4. Commerce runtime is Build 313;
5. active required services are `catalog-read,inventory-read,accounting-read`;
6. all three passive services are registered and can be read explicitly;
7. Accounting remains Build 312 and schema-ready;
8. `ownsOperationsMutations=false`;
9. contracts/services remain green;
10. no claim is made that `/admin/orders/` or all other Operations routes are migrated.

## Next direction

After Build 313 is proven, expand Operations runtime loader coverage one bounded route group at a time. Prefer read-heavy pages first. Do not combine loader coverage with mutation-authority extraction.
