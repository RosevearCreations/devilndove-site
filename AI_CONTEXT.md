# Devil n Dove AI Context — Build 313 Complete / Operations Route Expansion Next

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
- `BUILD312_VALIDATION.md`
- `BUILD313_VALIDATION.md`

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

## Build 312 — completed Accounting prerequisite

Proven source/runtime head:

```text
6d99d05e40999776ab38f91fbaa182e9232db547
Build 312 update Accounting read handoff context
```

Completed handoff head:

```text
3b5709c842ed7bce8335ddd57fe11420ae207367
Build 312 complete handoff and set Operations activation next
```

Accounting read authority:

```text
GET /api/admin/contracts/accounting-read
owner            accounting
build            312
authority table  accounting_order_records
schema ready     true
schema mutation  false
```

## Build 313 — COMPLETE IN DEVELOPMENT

Proven source/runtime head:

```text
a93611eadf291a66eb3fc7d815bc49dbfd4ba5ce
Build 313 update Operations runtime handoff context
```

Build 313 activates the first real `operations` domain page beneath Commerce & Operations:

```text
/admin/operations/
```

Runtime identity:

```text
Architecture build              302
Core runtime implementation     305
Catalog runtime                 304
Inventory runtime               305
Inventory write boundary        310
Inventory cost contract         311
Accounting read contract        312
Operations runtime              313
Commerce runtime                313
```

Operations requires exactly:

```text
catalog-read
inventory-read
accounting-read
```

The umbrella remains read-only for Operations:

```text
createsNetworkTransport false
ownsInventoryMutations  false
ownsOperationsMutations false
```

### Validation proof

Final local regression:

```text
BUILD 313 OPERATIONS READ-ONLY RUNTIME: PASS
No Cloudflare resource was contacted.
```

Development browser proof on `/admin/operations/`:

```text
commerce_runtime_build       313
domain                       operations
application_module           commerce-operations
application_module_mode      active
active_required_services     catalog-read,inventory-read,accounting-read
operations_runtime_active    true
owns_operations_mutations    false
catalog_service_owner        catalog
catalog_service_mode         read-only-http
catalog_rows                 2
inventory_service_owner      inventory
inventory_service_mode       read-only-http
inventory_rows               2
accounting_service_owner     accounting
accounting_service_mode      read-only-http
accounting_build             312
accounting_schema_ready      true
accounting_schema_mutation   false
accounting_rows              0
contracts_ok                 true
services_ok                  true
```

Accounting having zero current rows in Development is valid and does not block the runtime boundary.

### Proven page coverage

Do not claim the full Operations route family is migrated.

Build 313 proves only:

```text
/admin/operations/
```

`/admin/orders/` remains unchanged and lacks the shared runtime loader. `/admin/customer-documents/` retains an older loader pin but was not re-pinned or validated in Build 313. Gift cards, members, membership, custom requests, today-tasks, and other Operations routes likewise require separate loader-coverage passes before being called runtime-migrated.

### Safety boundary

Build 313 did not modify:

- Accounting contract/helper behavior;
- Catalog/Inventory read contracts;
- Inventory post/reverse authorities;
- Creative Inventory consumers;
- order/payment/customer/gift-card/membership mutation handlers;
- `/admin/orders/` implementation;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production;
- schema/data parity work.

## Next direction after Build 313

Expand Operations runtime loader coverage one bounded route group at a time. Prefer read-heavy or presentation-heavy routes first. Keep loader migration separate from any mutation-authority extraction.

A reasonable next build is a bounded Operations loader-coverage pass for a single route such as `/admin/customer-documents/`, proving the read-only umbrella shell there without changing its existing issue/void behavior. Do not fold `/admin/orders/`, gift cards, memberships, or mutation extraction into the same build.

## Validation interaction preference

Keep validation concise: default to **one GIT BASH block and one reusable BROWSER DEVTOOLS CONSOLE block** unless a failure requires deeper isolation.

## Separate schema/data parity track — DO NOT MIX

Fresh-install schema parity remains a separate priority before any Production business-data copy. Do not combine schema/data parity with module extraction.
