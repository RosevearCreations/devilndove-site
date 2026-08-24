# Devil n Dove AI Context — Build 315 Orders Operations Runtime Coverage

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
```

Build 306 remains historically browser-proven with standalone local signoff not captured in the conversation. Do not silently relabel it.

Build 308 remains browser-proven; its standalone local regression output was not captured before later work began. Do not silently relabel it complete.

## Build 314 — COMPLETE IN DEVELOPMENT

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

Build 314 proves exactly:

```text
/admin/operations/
/admin/customer-documents/
```

under the read-only `commerce-operations` runtime.

Customer Documents business behavior remains on its historical Build 227 script and Operations owns no mutations.

## Build 315 — STAGED / VALIDATION REQUIRED

Baseline:

```text
c29aca8c789ac53e9418f6074e8408b56391d7e5
Build 314 set completed runtime handoff context
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

before its existing business scripts:

```text
/public/js/admin-orders.js
/public/js/admin-order-detail.js
/public/js/admin-gift-card-order-redemption.js
/public/js/admin-accounting-backend.js
```

Those scripts remain unchanged from the completed Build 314 baseline.

### Orders business/API authority remains compatibility behavior

Build 315 does not modify the current Orders/payment API surface, including:

```text
functions/api/admin/orders.js
functions/api/admin/update-order-status.js
functions/api/admin/record-payment.js
functions/api/admin/payment-actions.js
functions/api/admin/order-payments.js
```

Order/payment/refund/gift-card mutations therefore remain outside the application-module runtime shell.

### Explicit Operations page allow-list

Commerce runtime Build 315 accepts only:

```text
/admin/operations/
/admin/customer-documents/
/admin/orders/
```

for the `operations` domain. Other Operations-classified pages remain rejected until separately proven.

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

Operations still consumes exactly:

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

### Build 315 safety boundary

Build 315 does not modify:

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

## Next direction after Build 315

After Build 315 is proven, continue Operations route coverage one bounded group at a time. Remaining classified routes include gift cards, members/membership, custom requests and today-tasks.

Do not combine loader/runtime coverage with mutation-authority extraction. Mutation-heavy domains such as orders, gift cards and membership require separate authority reviews before their writes move.

## Validation interaction preference

Keep validation concise: default to **one GIT BASH block and one reusable BROWSER DEVTOOLS CONSOLE block** unless a failure requires deeper isolation.

## Separate schema/data parity track — DO NOT MIX

Fresh-install schema parity remains a separate priority before any Production business-data copy. Do not combine schema/data parity with module extraction.
