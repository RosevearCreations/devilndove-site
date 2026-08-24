# Devil n Dove AI Context — Build 312 Accounting Read Contract

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
- `BUILD311_VALIDATION.md`
- `BUILD312_VALIDATION.md`

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
```

Build 306 remains historically browser-proven with standalone local signoff not captured in the conversation. Do not silently relabel it.

Build 308 remains browser-proven; its standalone local regression output was not captured before later work began. Do not silently relabel it complete.

## Build 311 — COMPLETE IN DEVELOPMENT

Proven source/regression head:

```text
92aaef7b0076dbbf5db0e4a87109067b7af563ff
Build 311 make historical pins line-ending safe
```

Completed handoff head:

```text
78546a6b9304ce38d0a42b130445a7504a15823f
Build 311 set completed inventory-cost handoff
```

Build 311 implements:

```text
GET /api/admin/contracts/inventory-cost
owner     inventory
build     311
authority site_item_inventory.unit_cost_cents
```

Catalog requires `catalog-read,inventory-cost`. Inventory requires `inventory-read`. Operations remains inactive.

## Build 312 — STAGED / VALIDATION REQUIRED

Baseline:

```text
78546a6b9304ce38d0a42b130445a7504a15823f
Build 311 set completed inventory-cost handoff
```

Build 312 implements the remaining read prerequisite for future Operations activation:

```text
GET /api/admin/contracts/accounting-read
owner            accounting
build            312
mode             read-only-order-financial-state
authority table  accounting_order_records
```

### Accounting boundary

The contract exposes only bounded order-linked financial/payment state:

```text
summary:
  records_count
  total_booked_cents
  total_paid_cents
  total_outstanding_cents
  total_tax_cents
  open_records_count

records:
  accounting_order_record_id
  order_id
  order_number
  entry_status
  currency
  total_cents
  amount_paid_cents
  amount_outstanding_cents
  tax_liability_cents
  source_order_status
  source_payment_status
  created_at
  updated_at
```

It deliberately excludes customer name/email and does not expose journals, bank imports, close controls, or Accounting mutation APIs.

### No read-side schema repair

The legacy `functions/api/admin/accounting-summary.js` calls `ensureAccountingSchema()` during GET. Build 312 does not reuse that behavior as a module contract.

The new route does not call:

```text
ensureAccountingSchema
syncAccountingForOrder
```

and performs no request-time DDL or writes.

If `accounting_order_records` or required columns are absent, it returns a controlled `schema_ready=false` read response. Missing schema remains part of the separate schema-parity track.

### Passive service

`public/js/core/dd-module-service-adapters.mjs` registers:

```text
accounting-read
owner accounting
mode  read-only-http
```

Registration performs no request until `.list()` is called.

### Future Operations prerequisite set

Commerce runtime Build 312 exposes:

```text
operations required services:
  catalog-read
  inventory-read
  accounting-read
```

But active runtime domains remain:

```text
SUPPORTED_DOMAINS = ['catalog', 'inventory']
runtimeDomains    = ['catalog', 'inventory']
operationsRuntimeActive = false
```

Build 312 therefore proves prerequisite composition without activating Operations.

### Runtime identity

```text
Architecture build              302
Catalog runtime                 304
Inventory runtime               305
Inventory write boundary        310
Inventory cost contract         311
Accounting read contract        312
Commerce runtime                312
Core runtime implementation     305
Operations runtime active       false
```

### Build 312 safety boundary

Build 312 does not modify:

- legacy Accounting summary/schema helper behavior;
- Accounting journals/posting/close controls;
- Inventory post/reverse authorities;
- Creative post/reverse consumers;
- Operations implementation;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production;
- schema/data parity work.

## Decision after Build 312 validation

If Development reports `accounting_schema_ready=true`, a later bounded build may consider Operations runtime activation.

If Development reports `accounting_schema_ready=false`, do not activate Operations. Record the missing Accounting schema/columns as a schema-parity blocker and resolve it on the separate schema-parity track first.

## Validation interaction preference

Keep validation concise: default to **one GIT BASH block and one reusable BROWSER DEVTOOLS CONSOLE block** unless a failure requires deeper isolation.

## Separate schema/data parity track — DO NOT MIX

Fresh-install schema parity remains a separate priority before any Production business-data copy. Do not combine schema/data parity with module extraction.
