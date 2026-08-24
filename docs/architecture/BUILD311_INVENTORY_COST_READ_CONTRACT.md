# Build 311 — Inventory Cost Read Contract

## Status — COMPLETE IN DEVELOPMENT

Baseline:

```text
c88bcd63d7478cdb24e2b7070fa739f35789ac88
Build 310 set completed modular handoff
```

Proven source/regression head:

```text
92aaef7b0076dbbf5db0e4a87109067b7af563ff
Build 311 make historical pins line-ending safe
```

Real Devil n Dove Production remains frozen at Build 280.

## Review decision before Operations

Build 310 left two questions to resolve before Operations could join the Commerce & Operations runtime.

### 1. Can the preserved Creative compatibility copy be retired now?

No.

`functions/api/admin/creative-process-compat.js` still owns the unrelated Creative Process actions intentionally left outside the narrow Inventory post/reverse cutovers. Retiring it now would require a broad Creative engine extraction and is outside Build 311.

Build 311 therefore keeps the compatibility implementation Git-equivalent to the completed Build 310 baseline.

### 2. Is `inventory-cost` ready to become an explicit Inventory contract?

Yes, as a read-only boundary.

Current Inventory cost authority is:

```text
site_item_inventory.unit_cost_cents
```

Usage conversion facts remain:

```text
stock_unit_label
usage_unit_label
usage_units_per_stock_unit
```

Optional historical evidence remains:

```text
site_item_inventory_cost_history
```

No new schema is required.

## Inventory-owned route

```text
GET /api/admin/contracts/inventory-cost
```

Implementation:

```text
functions/api/admin/contracts/inventory-cost.js
```

Identity:

```text
build                 311
contract              inventory-cost
owner                 inventory
mode                  read-only-current-cost
authority field       site_item_inventory.unit_cost_cents
```

The route is authenticated and GET-only.

## Cost facts

For active Inventory items the contract returns current cost facts including:

```text
site_item_inventory_id
source_type
external_key
item_name
category
unit_cost_cents
currency
stock_unit_label
usage_unit_label
usage_units_per_stock_unit
cost_per_usage_unit_cents
on_hand_quantity
inventory_value_cents
supplier_name
supplier_sku
updated_at
```

`cost_per_usage_unit_cents` is derived from current Inventory cost divided by `usage_units_per_stock_unit`.

`inventory_value_cents` is an operational current-value calculation, not a posted accounting journal value.

## Optional history evidence

`include_history=1` reads existing `site_item_inventory_cost_history` rows when available. History supports audit/review; it does not override current cost authority.

The contract creates no tables and performs no request-time DDL or Inventory mutation.

## Passive browser service

Build 311 registers `inventory-cost` in:

```text
public/js/core/dd-module-service-adapters.mjs
```

Registration is passive. Network activity occurs only when a consumer explicitly calls:

```text
window.DDModuleRuntime.service('inventory-cost').list(...)
```

## Catalog boundary

Catalog's declared Inventory-cost dependency is now an active runtime requirement:

```text
catalog required services:
  catalog-read
  inventory-cost

inventory required services:
  inventory-read
```

This remains read-only composition.

## Operations remains inactive

Build 311 does not add `operations` to `runtimeDomains`:

```text
runtimeDomains = ['catalog', 'inventory']
operationsRuntimeDomainActive = false
```

Operations is classified beneath Commerce & Operations but remains bridge-only. No orders, memberships, fulfillment, gift-card, customer-workflow, payment, or Accounting implementation moved.

## Existing Inventory write authorities remain frozen

```text
Inventory post authority      Build 309
Creative post consumer        Build 310
Inventory reversal authority  Build 307
Creative reversal consumer    Build 308
```

Commerce remains non-mutating:

```text
ownsInventoryMutations = false
```

## Runtime identity

```text
Core architecture               302
Catalog runtime                 304
Inventory runtime               305
Inventory write boundary        310
Inventory cost contract         311
Commerce runtime                311
Core runtime implementation     305
Operations runtime active       false
```

## Validation proof

Local regression passed after correcting Windows CRLF/LF historical-pin comparisons to Git-native comparison semantics. That correction changed only the already-declared Build 311 regression file.

Development browser validation passed with:

```text
inventory_cost_service_owner   inventory
inventory_cost_service_mode    read-only-http
inventory_cost_contract        inventory-cost
inventory_cost_build           311
inventory_cost_authority_field site_item_inventory.unit_cost_cents
inventory_cost_rows            5
catalog_required_services      catalog-read,inventory-cost
operations_runtime             <none>
contracts_ok                   true
services_ok                    true
```

## Safety boundary

Build 311 did not modify:

- `creative-process-compat.js` behavior;
- Inventory post/reverse services;
- Creative post/reverse consumers;
- legacy broad Inventory mutation endpoint;
- Operations implementation;
- Accounting implementation;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production;
- schema/data parity work.

## Next direction

The remaining architectural prerequisite before Operations runtime activation is its declared `accounting-read` dependency. The next bounded pass should define and prove a read-only Accounting-owned contract before activating Operations.
