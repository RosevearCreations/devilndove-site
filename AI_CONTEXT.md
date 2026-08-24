# Devil n Dove AI Context — Build 314 Complete / Orders Runtime Coverage Next

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

## Build 313 — completed first Operations runtime page

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

Build 313 proved:

```text
/admin/operations/
```

under the read-only `commerce-operations` runtime.

## Build 314 — COMPLETE IN DEVELOPMENT

Proven source/runtime head:

```text
f386f89a18190c20fd95ca8ec5a0208a4a051b90
Build 314 update modular handoff context
```

Build 314 expands explicit Operations runtime coverage to exactly:

```text
/admin/operations/
/admin/customer-documents/
```

Commerce runtime Build 314 enforces this pathname allow-list for the `operations` domain so older Operations-classified pages cannot be silently counted as migrated.

### Runtime identity

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

### Customer Documents boundary

`/admin/customer-documents/` now loads:

```text
/public/js/admin.js?v=314
```

while its business implementation remains unchanged:

```text
/public/js/admin-customer-documents.js?v=227
```

Issue, print, retain, void, credit-note and refund-confirmation behavior remains compatibility behavior beneath the read-only runtime shell.

### Validation proof

Final local regression:

```text
BUILD 314 CUSTOMER DOCUMENTS OPERATIONS RUNTIME: PASS
No Cloudflare resource was contacted.
```

Development browser proof:

```text
pathname                         /admin/customer-documents/
commerce_runtime_build           314
domain                           operations
application_module               commerce-operations
application_module_mode          active
active_required_services         catalog-read,inventory-read,accounting-read
operations_runtime_active        true
current_operations_page_proven   true
operations_coverage              /admin/operations/,/admin/customer-documents/
owns_operations_mutations        false
customer_documents_script        .../admin-customer-documents.js?v=227
accounting_build                 312
accounting_schema_ready          true
accounting_schema_mutation       false
contracts_ok                     true
services_ok                      true
```

No Customer Documents mutation was required for validation.

### Safety boundary

Build 314 did not modify:

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

## Next direction — Orders runtime coverage

The next bounded loader/runtime candidate is:

```text
/admin/orders/
```

That page currently remains outside the proven Operations runtime set. Add loader/runtime coverage separately from any order or payment mutation-authority extraction.

After Orders, continue other Operations routes one bounded group at a time: gift cards, members/membership, custom requests, today-tasks, and related pages.

## Validation interaction preference

Keep validation concise: default to **one GIT BASH block and one reusable BROWSER DEVTOOLS CONSOLE block** unless a failure requires deeper isolation.

## Separate schema/data parity track — DO NOT MIX

Fresh-install schema parity remains a separate priority before any Production business-data copy. Do not combine schema/data parity with module extraction.
