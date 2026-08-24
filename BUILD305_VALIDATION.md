# Build 305 Validation — Commerce & Operations Inventory Umbrella Runtime

## Status — STAGED / LOCAL + DEVELOPMENT BROWSER VALIDATION REQUIRED

Completed Build 304 handoff pinned by this build:

```text
b142b3a6267df57ac43b8189982bd6abe82605ac
Build 304 set completed Catalog-runtime handoff
```

Real Devil n Dove Production remains frozen at Build 280.

## Build 305 scope

Build 305 extends the already-proven `commerce-operations` top-level runtime from Catalog to Inventory.

Runtime identities:

```text
DDModuleRuntime.build                         305
DDModuleRuntime.applicationArchitectureBuild 302
DDModuleRuntime.applicationRuntimeCatalogBuild 304
DDModuleRuntime.applicationRuntimeInventoryBuild 305
```

Commerce runtime support:

```text
catalog   -> catalog-read
inventory -> inventory-read
```

Build 305 creates no new network transport and owns no Inventory mutations.

The actual Inventory workspace `/admin/inventory-operations/` is explicitly mapped to the Inventory domain in this build.

## Local validation

After pulling `dev`, run:

```bash
python scripts/build304_commerce_operations_catalog_runtime_test.py
python scripts/build305_commerce_operations_inventory_runtime_test.py
```

Expected Build 304 ending:

```text
BUILD 304 COMMERCE & OPERATIONS CATALOG RUNTIME HISTORICAL REGRESSION: PASS (b142b3a)
No Cloudflare resource was contacted.
```

Expected Build 305 ending:

```text
PASS: Build 305 shared Core/definition/Commerce runtime JavaScript syntax
PASS: shared Admin loader points to the Build 305 Core runtime
PASS: Build 302 architecture remains intact while Build 305 opts Catalog and Inventory into Commerce & Operations
PASS: real Inventory Operations workspace is explicitly owned by the Inventory domain
PASS: Commerce & Operations adds Inventory through inventory-read only and owns no Inventory mutations
PASS: Core exposes Build 305 Inventory runtime identity while preserving the generic lifecycle and auth reconciliation
PASS: Catalog and Inventory resolve to the Commerce runtime while Operations/Public remain bridge-only
PASS: completed Build 304 runtime/deployment/browser proof is historically pinned
PASS: Inventory and Packaging validation pages have exact Build 305 shared-loader pins
PASS: Catalog behavior, Inventory read/API authority, Inventory mutation paths, and Packaging implementation remain unchanged
PASS: exact Build 305 Inventory umbrella-runtime changed-file boundary
PASS: no SQL/schema, Cloudflare binding/config, R2, or real Production change
BUILD 305 COMMERCE & OPERATIONS INVENTORY UMBRELLA RUNTIME: PASS
No Cloudflare resource was contacted.
```

`git status --short` should be empty.

## Development deployment

Confirm the newest Development Pages deployment points to the current Build 305 head:

```bash
npx --yes wrangler@latest pages deployment list \
  --project-name devilndove-site-dev | head -n 20
```

The Cloudflare `Environment = Production` label means the primary environment of the Development Pages project. It is not real Devil n Dove Production.

Because Build 304 exposed a stale Pages artifact despite an apparently current deployment row, Build 305 validation must also verify served assets before browser signoff.

## Served-asset proof

Check the Development alias directly:

```bash
BASE="https://devilndove-site-dev.pages.dev"
STAMP="$(date +%s)"

curl -sS -H "Cache-Control: no-cache" \
  "$BASE/admin/inventory-operations/?build305=$STAMP" \
  | grep -oE 'admin\.js\?v=[0-9]+' | head -n 1

curl -sS -H "Cache-Control: no-cache" \
  "$BASE/admin/packaging-studio/?build305=$STAMP" \
  | grep -oE 'admin\.js\?v=[0-9]+' | head -n 1

curl -sS -H "Cache-Control: no-cache" \
  "$BASE/public/js/admin.js?v=305&build305=$STAMP" \
  | grep -E 'dd-admin-module-runtime\.mjs\?v=305|Build 305:'
```

Expected:

```text
admin.js?v=305
admin.js?v=305
...dd-admin-module-runtime.mjs?v=305...
...Build 305: Commerce & Operations extends to Inventory...
```

If the alias still serves an older artifact, stop browser validation and use the same Development-only direct-upload recovery method proven in Build 304 from a clean current tree:

```bash
HEAD_SHA="$(git rev-parse HEAD)"

npx --yes wrangler@latest pages deploy . \
  --project-name devilndove-site-dev \
  --branch dev \
  --commit-hash "$HEAD_SHA" \
  --commit-message "Build 305 Development direct-upload recovery"
```

Then repeat the served-asset proof. Do not touch real Production.

## Browser proof 1 — Inventory under active Commerce & Operations runtime

Hard-refresh:

```text
https://devilndove-site-dev.pages.dev/admin/inventory-operations/
```

Run in Firefox DevTools Console:

```js
(() => {
  const r = window.DDModuleRuntime;
  const app = r?.getCurrentApplicationModule?.();
  const appStatus = r?.getCurrentApplicationModuleRuntimeStatus?.();
  const facade = window.DDCommerceOperations?.getStatus?.();
  const adminScript = [...document.scripts].find((node) => String(node.src || '').includes('/public/js/admin.js'));

  console.table({
    admin_script_src: adminScript?.src || '',
    runtime_build: r?.build,
    architecture_build: r?.applicationArchitectureBuild,
    runtime_catalog_build: r?.applicationRuntimeCatalogBuild,
    runtime_inventory_build: r?.applicationRuntimeInventoryBuild,
    auth_phase: window.DDAuthUiState?.phase,
    auth_verified: window.DDAuthUiState?.verified,
    domain: document.documentElement.dataset.ddModule,
    domain_mode: document.documentElement.dataset.ddModuleMode,
    application_module: document.documentElement.dataset.ddApplicationModule,
    application_module_mode: document.documentElement.dataset.ddApplicationModuleMode,
    api_current_application_module: app?.id,
    active_domain_runtime: r?.getActiveModuleId?.(),
    active_application_runtime: r?.getActiveApplicationModuleId?.(),
    application_runtime_state: appStatus?.state,
    application_runtime_domain: appStatus?.currentDomain,
    application_runtime_services_ready: appStatus?.servicesReady,
    active_required_services: (appStatus?.activeRequiredServices || []).join(','),
    facade_build: facade?.build,
    facade_state: facade?.state,
    facade_inventory_boundary_active: facade?.inventoryRuntimeBoundaryActive,
    facade_catalog_boundary_active: facade?.catalogRuntimeBoundaryActive,
    owns_inventory_mutations: facade?.ownsInventoryMutations,
    contracts_ok: r?.contractValidation?.ok,
    services_ok: r?.serviceRegistration?.ok,
  });
})();
```

Expected final steady state:

```text
admin_script_src                    .../public/js/admin.js?v=305
runtime_build                       305
architecture_build                  302
runtime_catalog_build               304
runtime_inventory_build             305
auth_phase                          verified
auth_verified                       true
domain                              inventory
domain_mode                         shadow
application_module                  commerce-operations
application_module_mode             active
api_current_application_module      commerce-operations
active_domain_runtime               null
active_application_runtime          commerce-operations
application_runtime_state           active
application_runtime_domain          inventory
application_runtime_services_ready  true
active_required_services            inventory-read
facade_build                        305
facade_state                        active
facade_inventory_boundary_active    true
facade_catalog_boundary_active      false
owns_inventory_mutations            false
contracts_ok                        true
services_ok                         true
```

## Browser proof 2 — Catalog preservation

Hard-refresh:

```text
https://devilndove-site-dev.pages.dev/admin/products/
```

Run:

```js
(() => {
  const r = window.DDModuleRuntime;
  const appStatus = r?.getCurrentApplicationModuleRuntimeStatus?.();
  const facade = window.DDCommerceOperations?.getStatus?.();

  console.table({
    runtime_build: r?.build,
    runtime_catalog_build: r?.applicationRuntimeCatalogBuild,
    runtime_inventory_build: r?.applicationRuntimeInventoryBuild,
    domain: document.documentElement.dataset.ddModule,
    domain_mode: document.documentElement.dataset.ddModuleMode,
    application_module: document.documentElement.dataset.ddApplicationModule,
    application_module_mode: document.documentElement.dataset.ddApplicationModuleMode,
    active_domain_runtime: r?.getActiveModuleId?.(),
    active_application_runtime: r?.getActiveApplicationModuleId?.(),
    application_runtime_state: appStatus?.state,
    application_runtime_domain: appStatus?.currentDomain,
    active_required_services: (appStatus?.activeRequiredServices || []).join(','),
    facade_build: facade?.build,
    facade_catalog_boundary_active: facade?.catalogRuntimeBoundaryActive,
    facade_inventory_boundary_active: facade?.inventoryRuntimeBoundaryActive,
    owns_inventory_mutations: facade?.ownsInventoryMutations,
  });
})();
```

Expected:

```text
runtime_build                       305
runtime_catalog_build               304
runtime_inventory_build             305
domain                              catalog
domain_mode                         shadow
application_module                  commerce-operations
application_module_mode             active
active_domain_runtime               null
active_application_runtime          commerce-operations
application_runtime_state           active
application_runtime_domain          catalog
active_required_services            catalog-read
facade_build                        305
facade_catalog_boundary_active      true
facade_inventory_boundary_active    false
owns_inventory_mutations            false
```

The Products HTML remains the proven Build 304 page; Build 305 does not alter Catalog feature markup or APIs.

## Browser proof 3 — Packaging preservation

Hard-refresh:

```text
https://devilndove-site-dev.pages.dev/admin/packaging-studio/
```

Run:

```js
(() => {
  const r = window.DDModuleRuntime;
  const p = window.DDPackagingCompatibility?.getStatus?.();
  const adminScript = [...document.scripts].find((node) => String(node.src || '').includes('/public/js/admin.js'));

  console.table({
    admin_script_src: adminScript?.src || '',
    runtime_build: r?.build,
    runtime_catalog_build: r?.applicationRuntimeCatalogBuild,
    runtime_inventory_build: r?.applicationRuntimeInventoryBuild,
    domain: document.documentElement.dataset.ddModule,
    domain_mode: document.documentElement.dataset.ddModuleMode,
    application_module: document.documentElement.dataset.ddApplicationModule,
    application_module_mode: document.documentElement.dataset.ddApplicationModuleMode,
    active_domain_runtime: r?.getActiveModuleId?.(),
    active_application_runtime: r?.getActiveApplicationModuleId?.(),
    packaging_compatibility_build: p?.build,
    packaging_compatibility_state: p?.state,
    native_read_count: p?.nativeReadCount,
    native_read_status: p?.nativeReadStatus,
    failed_verification_count: p?.failedVerificationCount,
    preview_mode: p?.previewMode,
  });
})();
```

Expected:

```text
admin_script_src                 .../public/js/admin.js?v=305
runtime_build                    305
runtime_catalog_build            304
runtime_inventory_build          305
domain                           packaging
domain_mode                      active
application_module               creative-production
application_module_mode          domain-bridge
active_domain_runtime            packaging
active_application_runtime       null
packaging_compatibility_build    301
packaging_compatibility_state    active
native_read_count                >= 1
native_read_status               200
failed_verification_count        0
preview_mode                     fit
```

No Packaging write proof is required because Build 305 does not change Packaging transport/save logic.

## Completion decision

Do not mark Build 305 complete until both local regressions pass, served assets are current, Inventory is active under Commerce & Operations through `inventory-read`, Catalog remains green under the same runtime, and Packaging remains green under Build 301.
