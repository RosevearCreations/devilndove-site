# Build 311 Validation — Inventory Cost Read Contract

## Status — COMPLETE IN DEVELOPMENT

Baseline:

```text
c88bcd63d7478cdb24e2b7070fa739f35789ac88
Build 310 set completed modular handoff
```

Proven Build 311 source/regression head:

```text
92aaef7b0076dbbf5db0e4a87109067b7af563ff
Build 311 make historical pins line-ending safe
```

Build 311 completed two bounded objectives:

1. confirmed that `functions/api/admin/creative-process-compat.js` cannot yet be retired safely because it still owns unrelated Creative Process behavior;
2. implemented `inventory-cost` as a passive Inventory-owned read contract for Catalog and Accounting consumers.

Operations remains bridge-only and is not activated.

## Local regression proof

The final local regression passed:

```text
BUILD 311 INVENTORY COST READ CONTRACT: PASS
No Cloudflare resource was contacted.
```

The first regression run exposed a Windows checkout false-negative: protected text files were compared as raw working-tree bytes against LF Git blobs. Commit `92aaef7b` changed those historical-pin checks to Git-native `git diff --quiet` comparisons. The Build 311 changed-file boundary did not expand.

The corrected regression proved:

- Inventory owns the dedicated Build 311 `inventory-cost` route;
- `site_item_inventory.unit_cost_cents` is the current cost authority;
- normalized cost-per-usage and current inventory value are read-only derived facts;
- existing cost history is optional evidence;
- no mutation or request-time schema statement exists in the cost route;
- Catalog requires `catalog-read,inventory-cost`;
- Inventory continues to require only `inventory-read`;
- Operations/Public remain outside the active Commerce runtime;
- Creative compatibility and completed Inventory write authorities/consumers remain historically pinned;
- no SQL/schema, Cloudflare config, Operations implementation, Accounting implementation, R2, or real Production change occurred.

## Development browser proof

Validated at:

```text
https://devilndove-site-dev.pages.dev/admin/inventory-operations/
```

Observed values:

```text
pathname                       /admin/inventory-operations/
admin_script                   .../public/js/admin.js?v=311
core_runtime_build             305
commerce_runtime_build         311
domain                         inventory
application_module             commerce-operations
application_module_mode        active
active_required_services       inventory-read
catalog_required_services      catalog-read,inventory-cost
inventory_cost_service_owner   inventory
inventory_cost_service_mode    read-only-http
inventory_cost_contract        inventory-cost
inventory_cost_build           311
inventory_cost_authority_field site_item_inventory.unit_cost_cents
inventory_cost_rows            5
operations_application_module  commerce-operations
operations_runtime             <none>
contracts_ok                   true
services_ok                    true
```

The returned row count of 5 confirms the authenticated Development read worked. The specific count is not an architectural requirement; business-data parity remains a separate track.

## Completion decision

All completion gates passed:

1. local regression passed;
2. Development served the Build 311 runtime graph;
3. passive `inventory-cost` service registration succeeded;
4. authenticated cost read succeeded;
5. Catalog consumes `inventory-cost`;
6. Operations remains inactive;
7. Build 310/308 write consumers and Build 309/307 authorities remain unchanged;
8. no SQL/schema/config/R2/real Production change occurred.

No additional Build 311 browser validation is required.
