# Devil n Dove AI Context — Build 315 Complete / Accounting Expenses Correction Next

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader roadmap.

Current modular architecture authority includes:

- `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`
- `docs/architecture/BUILD302_CORE_THREE_MODULE_NORMALIZATION.md`
- `docs/architecture/BUILD303_COMMERCE_OPERATIONS_UMBRELLA_BRIDGE.md`
- `docs/architecture/BUILD304_COMMERCE_OPERATIONS_CATALOG_RUNTIME.md`
- `docs/architecture/BUILD305_COMMERCE_OPERATIONS_INVENTORY_RUNTIME.md`
- `docs/architecture/BUILD306_INVENTORY_WRITE_CONTRACTS.md`
- `docs/architecture/BUILD307_INVENTORY_COMPENSATING_REVERSAL_SERVICE.md`
- `docs/architecture/BUILD308_CREATIVE_REVERSAL_CONSUMER_CUTOVER.md`
- `docs/architecture/BUILD309_INVENTORY_POST_AUTHORITY.md`
- `docs/architecture/BUILD310_CREATIVE_INVENTORY_POST_CONSUMER_CUTOVER.md`
- `docs/architecture/BUILD311_INVENTORY_COST_READ_CONTRACT.md`
- `docs/architecture/BUILD312_ACCOUNTING_READ_CONTRACT.md`
- `docs/architecture/BUILD313_OPERATIONS_READ_ONLY_RUNTIME.md`
- `docs/architecture/BUILD314_CUSTOMER_DOCUMENTS_OPERATIONS_RUNTIME.md`
- `docs/architecture/BUILD315_ORDERS_OPERATIONS_RUNTIME.md`
- `BUILD314_VALIDATION.md`
- `BUILD315_VALIDATION.md`

**Real Devil n Dove Production remains frozen at Build 280 unless deliberately promoted through the separate Production workflow.**

## Authoritative application structure

```text
                     DEVIL N DOVE APPLICATION CORE
                               |
              +----------------+----------------+
              |                |                |
       COMMERCE &         CREATIVE &       BUSINESS &
       OPERATIONS          PRODUCTION      ADMINISTRATION
```

Domains remain internal ownership/service boundaries beneath exactly three top-level modules.

## Completed modular baselines

```text
Build 301 Packaging compatibility          COMPLETE IN DEVELOPMENT
Build 302 Core + exactly 3 modules         COMPLETE IN DEVELOPMENT
Build 303 umbrella classification         COMPLETE IN DEVELOPMENT
Build 304 Catalog runtime                 COMPLETE IN DEVELOPMENT
Build 305 Inventory runtime               COMPLETE IN DEVELOPMENT
Build 307 Inventory reversal service      COMPLETE IN DEVELOPMENT
Build 309 Inventory post authority        COMPLETE IN DEVELOPMENT
Build 310 Creative post consumer cutover  COMPLETE IN DEVELOPMENT
Build 311 Inventory cost read contract    COMPLETE IN DEVELOPMENT
Build 312 Accounting read contract        COMPLETE IN DEVELOPMENT
Build 313 Operations read-only runtime    COMPLETE IN DEVELOPMENT
Build 314 Customer Documents runtime      COMPLETE IN DEVELOPMENT
Build 315 Orders runtime coverage         COMPLETE IN DEVELOPMENT
```

Build 306 remains historically browser-proven with standalone local signoff not captured in the conversation. Do not silently relabel it.

Build 308 remains browser-proven; its standalone local regression output was not captured before later work began. Do not silently relabel it complete.

## Build 314 — completed Customer Documents coverage

Proven source/runtime head:

```text
f386f89a18190c20fd95ca8ec5a0208a4a051b90
Build 314 update modular handoff context
```

Completed handoff head:

```text
c29aca8c789ac53e9418f6074e8408b56391d7e5
Build 314 set completed runtime handoff context
```

Build 314 proved:

```text
/admin/operations/
/admin/customer-documents/
```

under the read-only `commerce-operations` runtime.

## Build 315 — COMPLETE IN DEVELOPMENT

Proven source/runtime head:

```text
1984d97d5656691d44ad96917d15e38b07e71016
Build 315 update modular handoff context
```

Build 315 expands explicit Operations runtime coverage to exactly:

```text
/admin/operations/
/admin/customer-documents/
/admin/orders/
```

### Orders loader coverage

`/admin/orders/` now loads:

```text
/public/js/admin.js?v=315
```

before its unchanged compatibility scripts:

```text
/public/js/admin-orders.js
/public/js/admin-order-detail.js
/public/js/admin-gift-card-order-redemption.js
/public/js/admin-accounting-backend.js
```

The current Orders/payment API authorities remain unchanged, including:

```text
functions/api/admin/orders.js
functions/api/admin/update-order-status.js
functions/api/admin/record-payment.js
functions/api/admin/payment-actions.js
functions/api/admin/order-payments.js
```

Order/payment/refund/gift-card mutations remain outside the application-module runtime shell.

### Runtime identity

```text
Architecture build              302
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

Operations consumes exactly:

```text
catalog-read
inventory-read
accounting-read
```

and remains non-mutating:

```text
createsNetworkTransport false
ownsInventoryMutations  false
ownsOperationsMutations false
```

### Validation proof

Final local regression:

```text
BUILD 315 ORDERS OPERATIONS RUNTIME: PASS
No Cloudflare resource was contacted.
```

Development browser proof on `/admin/orders/`:

```text
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

The historical Orders business scripts were present unchanged.

### Separate legacy Accounting defect observed during Build 315 proof

The Orders page's unchanged `public/js/admin-accounting-backend.js` requested:

```text
GET /api/admin/accounting-expenses
```

and Development returned HTTP 500.

This did not invalidate Build 315 because the Accounting backend and endpoint were unchanged from the completed Build 314 baseline, while the proven Build 312 `accounting-read` contract remained healthy, schema-ready and non-mutating.

Repository review found a likely bug in `functions/api/admin/accounting-expenses.js`: the GET joins an attachment aggregate exposing `expense_id` while parts of the outer query use unqualified `expense_id`, which can fail in SQLite/D1 as ambiguous. The same legacy GET also performs request-time schema creation/repair through Accounting helpers.

Do not fold this correction back into Build 315. Treat it as the next bounded Accounting compatibility correction.

### Build 315 safety boundary

Build 315 did not modify:

- Orders business JavaScript;
- order/payment/refund/gift-card mutation APIs;
- Customer Documents business JavaScript/APIs;
- Catalog, Inventory or Accounting contract implementations;
- Inventory post/reverse authorities;
- Creative Inventory consumers;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production;
- schema/data parity work.

## Next direction — Accounting expenses read correction

Before expanding more Operations routes, fix the observed legacy `/api/admin/accounting-expenses` GET failure in a separate bounded build.

Preferred correction sequence:

1. inspect and confirm the exact SQLite/D1 failure path;
2. qualify the expense-table columns in the joined GET query;
3. remove request-time schema mutation from GET, replacing it with schema-aware readiness/fallback behavior;
4. leave POST expense authority separate and unchanged unless an independently justified fix is required;
5. regression-pin Orders/payment APIs and the Build 312 `accounting-read` contract;
6. validate the legacy GET on Development without creating or altering schema.

After that correction is proven, continue Operations route coverage one bounded group at a time: gift cards, members/membership, custom requests, today-tasks and related pages.

## Validation interaction preference

Keep validation concise: default to **one GIT BASH block and one reusable BROWSER DEVTOOLS CONSOLE block** unless a failure requires deeper isolation.

## Separate schema/data parity track — DO NOT MIX

Fresh-install schema parity remains a separate priority before any Production business-data copy. Do not combine schema/data parity with module extraction or this bounded Accounting compatibility correction.
