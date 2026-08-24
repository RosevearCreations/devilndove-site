# Build 304 Validation — Commerce & Operations Catalog Umbrella Runtime

## Status — COMPLETE IN DEVELOPMENT

Build 304 is the first proven top-level application-module runtime extraction in Devil n Dove.

Completed Build 303 head pinned by this build:

```text
6cbcc4353327eea093ef4701497fa5321b680096
Build 303 set completed umbrella-runtime handoff
```

Validated Build 304 handoff/deployment source:

```text
af0993ef9b4da807d9d1f32c63988dc28b07f1f8
Build 304 update handoff for shared-loader correction
```

The Build 304 Core/Commerce runtime implementation itself was already present at:

```text
395eb722a9b060d904b28b1a917f66dc7120f64c
Build 304 update modular runtime handoff
```

The later commits through `af0993ef...` corrected historical-test markers, validation-page loader version pins, and documentation. They did not change the Build 304 Commerce runtime implementation.

Real Devil n Dove Production remains frozen at Build 280.

## Scope

Only the internal `catalog` domain opts into the new `commerce-operations` top-level runtime.

Runtime identity:

```text
DDModuleRuntime.build                         304
DDModuleRuntime.applicationArchitectureBuild 302
DDModuleRuntime.applicationRuntimeCatalogBuild 304
```

Catalog target and proven state:

```text
domain                             catalog
domain_mode                        shadow
application_module                 commerce-operations
application_module_mode            active
active_domain_runtime              null
active_application_runtime         commerce-operations
application_runtime_state          active
application_runtime_domain         catalog
application_runtime_services_ready true
```

Inventory, Operations and Public remain grouped under Commerce & Operations but do not yet opt into its runtime.

Packaging remains domain-owned beneath Creative & Production and retains the proven Build 301 compatibility stack.

## Historical regression correction

The first Build 304 validation exposed a brittle Build 303 historical assertion. The pinned completed Build 303 document stores aligned text such as:

```text
catalog    -> commerce-operations
packaging  -> creative-production
```

while the regression initially searched for an unpadded literal. Build 304 corrected the assertion without changing the pinned Build 303 head.

Final Build 303 historical regression:

```text
PASS: completed Build 303 shared Admin/Core JavaScript syntax is historically pinned
PASS: completed Build 303 umbrella classification and verified-auth reconciliation are historically pinned
PASS: completed Build 303 shared Admin loader is historically pinned
PASS: completed Build 303 Development browser proof is historically pinned
PASS: Build 303 preserves the completed Build 302 historical pin
PASS: completed Build 303 preserved domain services and the Build 301 Packaging stack
PASS: exact completed Build 303 umbrella-bridge boundary is historically pinned
PASS: completed Build 303 had no SQL/schema, Cloudflare binding/config, R2, or Production change
BUILD 303 COMMERCE & OPERATIONS UMBRELLA BRIDGE HISTORICAL REGRESSION: PASS (6cbcc435)
No Cloudflare resource was contacted.
```

## Build 304 local regression

Final local regression:

```text
PASS: Build 304 shared Core/catalog/application-runtime JavaScript syntax
PASS: shared Admin loader cache-busts the Build 304 Core runtime
PASS: Build 302 architecture remains intact while Build 304 opts only Catalog into the first umbrella runtime
PASS: Commerce & Operations runtime is Catalog-only, service-bounded, and creates no network transport
PASS: Core now has a generic top-level application-module lifecycle while preserving Build 303 auth reconciliation
PASS: only Catalog resolves to an active umbrella-runtime definition in Build 304
PASS: completed Build 303 runtime/browser proof is historically pinned
PASS: Build 304 validation pages explicitly load the fresh shared Admin/Core runtime and otherwise remain unchanged
PASS: Catalog APIs, Inventory/Operations domains, and completed Packaging runtime remain unchanged
PASS: exact Build 304 Catalog-first umbrella-runtime changed-file boundary
PASS: no SQL/schema, Cloudflare binding/config, R2, or Production change
BUILD 304 COMMERCE & OPERATIONS CATALOG UMBRELLA RUNTIME: PASS
No Cloudflare resource was contacted.
```

`git status --short` was empty during the local validation.

## Shared-loader delivery issue and recovery

The first browser attempt still reported Core Build 303 even though GitHub contained Build 304.

Products and Packaging Studio had historically referenced:

```text
/admin/products/          -> /public/js/admin.js?v=245
/admin/packaging-studio/  -> /public/js/admin.js?v=296
```

Build 304 pins both validation pages to:

```text
/public/js/admin.js?v=304
```

The Build 304 regression proves these page changes are exact one-line loader-version changes only.

A subsequent Cloudflare delivery audit proved that the Development Pages alias was still serving an older deployment artifact, including an older `/public/js/admin.js`, despite the Pages deployment list showing source `af0993e` as active.

The Development project was therefore recovered with a direct Development-only upload from the clean local `af0993ef...` tree:

```text
npx --yes wrangler@latest pages deploy . \
  --project-name devilndove-site-dev \
  --branch dev \
  --commit-hash af0993ef9b4da807d9d1f32c63988dc28b07f1f8 \
  --commit-message "Build 304 Development direct-upload recovery"
```

Wrangler reported successful compilation, asset upload, `_headers`, `_redirects`, Functions bundle, `_routes.json`, and deployment.

Development deployment:

```text
Id      6effd1eb-9a1f-4538-b7d3-3cdc18b54328
Project devilndove-site-dev
Branch  dev
Source  af0993e
Status  Active
URL     https://6effd1eb.devilndove-site-dev.pages.dev
```

The Cloudflare `Environment = Production` label in the Pages deployment list refers to the primary environment of the Development Pages project. It is not real Devil n Dove Production.

## Served-asset proof after direct upload

The Development alias and the exact deployment both returned the same current Build 304 artifact.

Alias Products:

```text
HTTP 200
ADMIN LOADER: admin.js?v=304
BUILD 304 HTML: YES
```

Alias Packaging Studio:

```text
HTTP 200
ADMIN LOADER: admin.js?v=304
BUILD 304 HTML: YES
```

Alias shared loader:

```text
CORE 304 IMPORT: YES
BUILD 304 ADMIN MARKER: YES
```

Exact deployment Products and Packaging Studio also returned HTTP 200 with `admin.js?v=304`, and the exact shared loader contained the Build 304 Core import and marker.

This proved GitHub, direct-upload deployment, exact deployment URL, and Development alias were synchronized before the final browser proof.

## Browser proof — Catalog under active Commerce & Operations runtime

Final `/admin/products/` proof:

```text
admin_script_src                     https://devilndove-site-dev.pages.dev/public/js/admin.js?v=304
runtime_build                        304
architecture_build                   302
runtime_catalog_build                304
auth_phase                           verified
auth_verified                        true
domain                               catalog
domain_mode                          shadow
application_module                   commerce-operations
application_module_mode              active
api_current_application_module       commerce-operations
active_domain_runtime                null
active_application_runtime           commerce-operations
application_runtime_state            active
application_runtime_domain           catalog
application_runtime_services_ready   true
facade_build                         304
facade_state                         active
facade_catalog_boundary_active       true
contracts_ok                         true
services_ok                          true
```

This proves `commerce-operations` is a real active top-level application runtime while `catalog` remains the explicit internal domain boundary.

## Browser proof — Packaging preservation

Final `/admin/packaging-studio/` proof:

```text
admin_script_src                 https://devilndove-site-dev.pages.dev/public/js/admin.js?v=304
runtime_build                    304
architecture_build               302
runtime_catalog_build            304
domain                           packaging
domain_mode                      active
application_module               creative-production
application_module_mode          domain-bridge
api_current_application_module   creative-production
active_domain_runtime            packaging
active_application_runtime       null
packaging_compatibility_build    301
packaging_compatibility_state    active
native_read_count                2
native_read_status               200
failed_verification_count        0
preview_mode                     fit
```

Build 304 does not alter Packaging transport, Save Project, Preview or write authority, so no new Packaging write proof was required.

## Safety boundary

Build 304 does not change:

- domain registry or domain definitions;
- domain contract ownership/default service adapters;
- Catalog API implementation;
- Inventory/Operations/Public runtime extraction;
- Packaging transport/native client/runtime/read/write/save/preview authorities;
- SQL/schema;
- Cloudflare bindings/config;
- R2 bindings/data;
- real Production.

The final Build 304 boundary from completed Build 303 head `6cbcc435...` is exactly 12 files:

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

## Completion decision

**Build 304 is COMPLETE IN DEVELOPMENT.**

This is the first proven real top-level application-module runtime in the Core + three-module architecture.

## Next bounded direction

The next pass should historically pin completed Build 304 and add **Inventory** to the already-proven Commerce & Operations runtime in a separate build.

Inventory must remain an explicit domain/service authority. Do not migrate Operations or Public in the same pass.

A future Core release gate should also validate shared `admin.js` version integrity so active Admin validation pages cannot silently point to an older Core loader again.
