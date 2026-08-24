# Build 304 Changed Files — Commerce & Operations Catalog Umbrella Runtime

Base: completed Build 303 head `6cbcc4353327eea093ef4701497fa5321b680096`.

Expected Build 304 boundary:

```text
AI_CONTEXT.md
BUILD304_CHANGED_FILES.md
BUILD304_VALIDATION.md
admin/products/index.html
admin/packaging-studio/index.html
docs/architecture/BUILD304_COMMERCE_OPERATIONS_CATALOG_RUNTIME.md
public/js/admin.js
public/js/core/dd-admin-module-runtime.mjs
public/js/core/dd-application-module-groups.mjs
public/js/modules/commerce-operations/runtime.mjs
scripts/build303_commerce_operations_umbrella_bridge_test.py
scripts/build304_commerce_operations_catalog_runtime_test.py
```

Runtime changes are limited to Core/application-module activation plus the new Commerce & Operations runtime.

The two Admin HTML files are included only to cache-bust the shared loader to `/public/js/admin.js?v=304` on the two Build 304 browser-validation surfaces:

- `admin/products/index.html`: `v=245 -> v=304`;
- `admin/packaging-studio/index.html`: `v=296 -> v=304`.

No other content in those two pages may change in Build 304. The regression verifies the exact one-line diff for each page.

Catalog/Inventory/Operations business APIs are not changed. Packaging implementation files are not changed.

Forbidden in Build 304:

- SQL/schema;
- `wrangler.toml` / Wrangler config;
- D1/R2 binding changes;
- Production resources;
- Catalog API rewrites;
- Inventory/Operations runtime extraction;
- Packaging transport/read/write/save/preview changes;
- Product or Packaging page feature changes beyond the explicit shared-loader version pins.
