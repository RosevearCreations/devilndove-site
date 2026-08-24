# Devil n Dove AI Context — Build 314 Customer Documents Operations Runtime

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
- `BUILD313_VALIDATION.md`
- `BUILD314_VALIDATION.md`

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
Build 301 Packaging compatibility        COMPLETE IN DEVELOPMENT
Build 302 Core + exactly 3 modules       COMPLETE IN DEVELOPMENT
Build 303 umbrella classification        COMPLETE IN DEVELOPMENT
Build 304 Catalog runtime                COMPLETE IN DEVELOPMENT
Build 305 Inventory runtime              COMPLETE IN DEVELOPMENT
Build 307 Inventory reversal service     COMPLETE IN DEVELOPMENT
Build 309 Inventory post authority       COMPLETE IN DEVELOPMENT
Build 310 Creative post consumer cutover COMPLETE IN DEVELOPMENT
Build 311 Inventory cost read contract   COMPLETE IN DEVELOPMENT
Build 312 Accounting read contract       COMPLETE IN DEVELOPMENT
Build 313 Operations read-only runtime   COMPLETE IN DEVELOPMENT
```

Build 306 remains historically browser-proven with standalone local signoff not captured in the conversation. Do not silently relabel it.

Build 308 remains browser-proven; its standalone local regression output was not captured before later work began. Do not silently relabel it complete.

## Build 313 — COMPLETE IN DEVELOPMENT

Proven source/runtime head:

```text
a93611eadf291a66eb3fc7d815bc49dbfd4ba5ce
Build 313 update Operations runtime handoff context
```

Completed handoff head:

```text
4ba68bf720561fab590e2dfb74581c0adf871b46
Build 313 set completed Operations runtime handoff
```

Build 313 proved the first real read-only Operations runtime page:

```text
/admin/operations/
```

Operations consumes:

```text
catalog-read
inventory-read
accounting-read
```

and the runtime reports:

```text
ownsOperationsMutations = false
```

## Build 314 — STAGED / VALIDATION REQUIRED

Baseline:

```text
4ba68bf720561fab590e2dfb74581c0adf871b46
Build 313 set completed Operations runtime handoff
```

Build 314 expands explicit Operations runtime coverage to:

```text
/admin/operations/
/admin/customer-documents/
```

### Explicit Operations page allow-list

Commerce runtime Build 314 now checks the pathname for the `operations` domain. Only the two pages above are accepted as proven Operations runtime pages.

This prevents older Operations-classified pages from being silently treated as migrated merely because they happen to load a shared Admin bridge.

Runtime identity:

```text
Architecture build              302
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

### Customer Documents scope

`/admin/customer-documents/` is re-pinned from the historical shared-loader cache identity to:

```text
/public/js/admin.js?v=314
```

Its existing business implementation remains:

```text
/public/js/admin-customer-documents.js?v=227
```

Build 314 does not modify that business script or any Customer Documents API. Issue, print, retain, void, credit-note and refund-confirmation behavior remains compatibility behavior underneath the read-only application-module shell.

### Operations service boundary

Operations still requires exactly:

```text
catalog-read
inventory-read
accounting-read
```

and remains:

```text
createsNetworkTransport false
ownsInventoryMutations  false
ownsOperationsMutations false
```

### Coverage limitation

Do not claim the whole Operations route family is migrated.

The Build 314 proven set is only:

```text
/admin/operations/
/admin/customer-documents/
```

`/admin/orders/` remains unchanged and outside the Build 314 boundary. Gift cards, members, membership, custom requests, today-tasks and other Operations pages also remain unproven until separate loader-coverage passes.

### Build 314 safety boundary

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

## Next direction after Build 314

After Build 314 is proven, continue route coverage one bounded page group at a time. `/admin/orders/` is a logical next loader target, but loader coverage must remain separate from order/payment mutation-authority extraction.

## Validation interaction preference

Keep validation concise: default to **one GIT BASH block and one reusable BROWSER DEVTOOLS CONSOLE block** unless a failure requires deeper isolation.

## Separate schema/data parity track — DO NOT MIX

Fresh-install schema parity remains a separate priority before any Production business-data copy. Do not combine schema/data parity with module extraction.
