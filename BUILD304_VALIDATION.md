# Build 304 Validation — Commerce & Operations Catalog Umbrella Runtime

## Status — STAGED / LOCAL + DEVELOPMENT BROWSER VALIDATION REQUIRED

Completed Build 303 head pinned by this build:

```text
6cbcc4353327eea093ef4701497fa5321b680096
Build 303 set completed umbrella-runtime handoff
```

Real Production remains frozen at Build 280.

## Build 304 scope

Build 304 is the first true top-level application-module runtime extraction.

Only the `catalog` internal domain opts into the `commerce-operations` runtime.

Expected runtime identities:

```text
DDModuleRuntime.build                  304
DDModuleRuntime.applicationArchitectureBuild 302
DDModuleRuntime.applicationRuntimeCatalogBuild 304
```

Catalog target:

```text
domain                           catalog
domain_mode                      shadow
application_module               commerce-operations
application_module_mode          active
active_domain_runtime            null
active_application_module_runtime commerce-operations
```

Packaging remains domain-owned under Creative & Production.

## Local validation

After pulling `dev`, run:

```bash
python scripts/build303_commerce_operations_umbrella_bridge_test.py
python scripts/build304_commerce_operations_catalog_runtime_test.py
```

Expected Build 303 ending:

```text
BUILD 303 COMMERCE & OPERATIONS UMBRELLA BRIDGE HISTORICAL REGRESSION: PASS (6cbcc435)
No Cloudflare resource was contacted.
```

Expected Build 304 ending:

```text
PASS: Build 304 shared Core/catalog/application-runtime JavaScript syntax
PASS: shared Admin loader cache-busts the Build 304 Core runtime
PASS: Build 302 architecture remains intact while Build 304 opts only Catalog into the first umbrella runtime
PASS: Commerce & Operations runtime is Catalog-only, service-bounded, and creates no network transport
PASS: Core now has a generic top-level application-module lifecycle while preserving Build 303 auth reconciliation
PASS: only Catalog resolves to an active umbrella-runtime definition in Build 304
PASS: completed Build 303 runtime/browser proof is historically pinned
PASS: Catalog APIs, Inventory/Operations domains, and completed Packaging runtime remain unchanged
PASS: exact Build 304 Catalog-first umbrella-runtime changed-file boundary
PASS: no SQL/schema, Cloudflare binding/config, R2, or Production change
BUILD 304 COMMERCE & OPERATIONS CATALOG UMBRELLA RUNTIME: PASS
No Cloudflare resource was contacted.
```

`git status --short` should be empty.

## Development deployment

Confirm the newest Development Pages deployment uses the current Build 304 head:

```bash
npx --yes wrangler@latest pages deployment list \
  --project-name devilndove-site-dev | head -n 20
```

The `Environment = Production` label refers only to the primary environment of the Development Pages project.

## Browser proof 1 — Catalog under active Commerce & Operations runtime

Hard-refresh:

```text
https://devilndove-site-dev.pages.dev/admin/products/
```

Then run in Firefox DevTools Console:

```js
(() => {
  const r = window.DDModuleRuntime;
  const app = r?.getCurrentApplicationModule?.();
  const appStatus = r?.getCurrentApplicationModuleRuntimeStatus?.();
  const facade = window.DDCommerceOperations?.getStatus?.();

  console.table({
    runtime_build: r?.build,
    architecture_build: r?.applicationArchitectureBuild,
    runtime_catalog_build: r?.applicationRuntimeCatalogBuild,
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
    facade_build: facade?.build,
    facade_state: facade?.state,
    facade_catalog_boundary_active: facade?.catalogRuntimeBoundaryActive,
    contracts_ok: r?.contractValidation?.ok,
    services_ok: r?.serviceRegistration?.ok,
  });
})();
```

Expected final steady state:

```text
runtime_build                         304
architecture_build                    302
runtime_catalog_build                 304
auth_phase                            verified
auth_verified                         true
domain                                catalog
domain_mode                           shadow
application_module                    commerce-operations
application_module_mode               active
api_current_application_module        commerce-operations
active_domain_runtime                  null
active_application_runtime             commerce-operations
application_runtime_state              active
application_runtime_domain             catalog
application_runtime_services_ready     true
facade_build                           304
facade_state                           active
facade_catalog_boundary_active         true
contracts_ok                           true
services_ok                            true
```

## Browser proof 2 — Packaging preservation

Hard-refresh:

```text
https://devilndove-site-dev.pages.dev/admin/packaging-studio/
```

Allow Packaging to load, then run:

```js
(() => {
  const r = window.DDModuleRuntime;
  const app = r?.getCurrentApplicationModule?.();
  const p = window.DDPackagingCompatibility?.getStatus?.();

  console.table({
    runtime_build: r?.build,
    architecture_build: r?.applicationArchitectureBuild,
    runtime_catalog_build: r?.applicationRuntimeCatalogBuild,
    domain: document.documentElement.dataset.ddModule,
    domain_mode: document.documentElement.dataset.ddModuleMode,
    application_module: document.documentElement.dataset.ddApplicationModule,
    application_module_mode: document.documentElement.dataset.ddApplicationModuleMode,
    api_current_application_module: app?.id,
    active_domain_runtime: r?.getActiveModuleId?.(),
    active_application_runtime: r?.getActiveApplicationModuleId?.(),
    packaging_compatibility_build: p?.build,
    packaging_compatibility_state: p?.state,
    native_read_status: p?.nativeReadStatus,
    failed_verification_count: p?.failedVerificationCount,
    preview_mode: p?.previewMode,
  });
})();
```

Expected:

```text
runtime_build                   304
architecture_build              302
runtime_catalog_build           304
domain                          packaging
domain_mode                     active
application_module              creative-production
application_module_mode         domain-bridge
api_current_application_module  creative-production
active_domain_runtime           packaging
active_application_runtime      null
packaging_compatibility_build   301
packaging_compatibility_state   active
native_read_status              200
failed_verification_count       0
preview_mode                    fit
```

No Packaging write proof is required because Build 304 does not alter Packaging transport/save logic.

## Completion decision

Do not mark Build 304 complete until both local regressions pass, the Dev deployment is current, Catalog has the active `commerce-operations` application runtime, and Packaging remains green.
