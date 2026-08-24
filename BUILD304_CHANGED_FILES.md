# Build 304 Changed Files — Commerce & Operations Catalog Umbrella Runtime

Base: completed Build 303 head `6cbcc4353327eea093ef4701497fa5321b680096`.

Expected Build 304 boundary:

```text
AI_CONTEXT.md
BUILD304_CHANGED_FILES.md
BUILD304_VALIDATION.md
docs/architecture/BUILD304_COMMERCE_OPERATIONS_CATALOG_RUNTIME.md
public/js/admin.js
public/js/core/dd-admin-module-runtime.mjs
public/js/core/dd-application-module-groups.mjs
public/js/modules/commerce-operations/runtime.mjs
scripts/build303_commerce_operations_umbrella_bridge_test.py
scripts/build304_commerce_operations_catalog_runtime_test.py
```

Runtime changes are limited to Core/application-module activation plus the new Commerce & Operations runtime. Catalog/Inventory/Operations business APIs and pages are not changed. Packaging implementation files are not changed.

Forbidden in Build 304:

- SQL/schema;
- `wrangler.toml` / Wrangler config;
- D1/R2 binding changes;
- Production resources;
- Catalog API rewrites;
- Inventory/Operations runtime extraction;
- Packaging transport/read/write/save/preview changes.
