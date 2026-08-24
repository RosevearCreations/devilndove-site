# Build 305 Changed Files — Commerce & Operations Inventory Umbrella Runtime

Base: completed Build 304 handoff `b142b3a6267df57ac43b8189982bd6abe82605ac`.

Expected Build 305 boundary:

```text
AI_CONTEXT.md
BUILD305_CHANGED_FILES.md
BUILD305_VALIDATION.md
admin/inventory-operations/index.html
admin/packaging-studio/index.html
docs/architecture/BUILD305_COMMERCE_OPERATIONS_INVENTORY_RUNTIME.md
public/js/admin.js
public/js/core/dd-admin-module-runtime.mjs
public/js/core/dd-application-module-groups.mjs
public/js/core/dd-module-definitions.mjs
public/js/modules/commerce-operations/runtime.mjs
scripts/build304_commerce_operations_catalog_runtime_test.py
scripts/build305_commerce_operations_inventory_runtime_test.py
```

Runtime changes are limited to:

- explicit ownership of `/admin/inventory-operations/` by the Inventory domain;
- adding `inventory` beside `catalog` in the already-proven `commerce-operations` umbrella runtime;
- requiring `inventory-read` only for the Inventory runtime boundary;
- Build 305 Core/runtime identity;
- Build 305 shared-loader pins on the Inventory validation page and Packaging regression page;
- historical pinning of completed Build 304.

Build 305 does **not** move Inventory mutation logic. `inventory-post`, `inventory-reverse`, stock movement code, inventory API implementations, existing Inventory page feature scripts, Catalog APIs, and Packaging implementation remain unchanged.

Forbidden in Build 305:

- SQL/schema changes;
- `wrangler.toml` / binding/config changes;
- R2 changes;
- real Production contact/change;
- Operations or Public runtime extraction;
- Inventory write/mutation migration;
- Catalog business/API rewrite;
- Packaging transport/read/write/save/preview changes.
