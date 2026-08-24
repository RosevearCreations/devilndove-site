# Build 303 Validation — Commerce & Operations Umbrella Runtime Bridge

## Status — CORRECTIVE RETEST REQUIRED

Build 303 is the first runtime bridge after Build 302 normalized the application to Core + three top-level modules.

Completed Build 302 historical head:

```text
000b9617bc5141ba876ec667d4fbc653ea9ee556
```

Real Production remains frozen at Build 280.

## Build 303 scope

Build 303 changes Core classification/diagnostic behavior only.

It does **not** move Catalog, Inventory or Operations business logic and does not change Packaging domain activation authority.

Expected runtime identity:

```text
DDModuleRuntime.build = 303
DDModuleRuntime.applicationArchitectureBuild = 302
```

The Core runtime reports both the current domain and its top-level application module.

Examples:

```text
catalog    -> commerce-operations
inventory  -> commerce-operations
operations -> commerce-operations
packaging  -> creative-production
accounting -> business-administration
```

## First Development browser proof

Commerce & Operations classification passed on `/admin/products/`:

```text
runtime_build                   303
architecture_build              302
domain                          catalog
domain_mode                     shadow
application_module              commerce-operations
application_module_mode         domain-bridge
api_current_application_module  commerce-operations
active_domain_runtime           null
contracts_ok                    true
services_ok                     true
```

Packaging classification was correct but activation did not complete:

```text
runtime_build                   303
architecture_build              302
domain                          packaging
domain_mode                     activation-pending
application_module              creative-production
api_current_application_module  creative-production
active_domain_runtime           null
packaging_compatibility_build   301
packaging_compatibility_state   waiting-for-proven-packaging-stack
native_read_status              0
failed_verification_count       0
preview_mode                    fit
```

Build 303 is therefore not complete yet.

## Root cause and corrective change

`site-auth-ui.js` retains verified auth in `window.DDAuthUiState` and emits `dd:admin-ready` when `/api/auth/me` completes.

Build 303 adds the Build 302 grouping catalog to the async Core module import graph. On a sufficiently fast page the verified admin event can complete before `dd-admin-module-runtime.mjs` has finished importing and attached its event listener. The result is a correctly classified Packaging route that remains at `activation-pending` because the one-time verified event was missed.

The corrective Build 303 runtime now includes:

```text
verifiedResolutionPromise
requestVerifiedAdminResolution()
reconcileVerifiedAuthState()
queueMicrotask(reconcileVerifiedAuthState)
dd:auth-verified reconciliation
```

This makes verified auth both event-triggered and retained-state-triggered while guarding against duplicate concurrent activation.

The correction performs no network request itself and does not change Packaging transport, read/write, Save Project or Preview authorities.

## Local validation

After pulling the corrective Build 303 head, run:

```bash
python scripts/build302_core_three_module_architecture_test.py
python scripts/build303_commerce_operations_umbrella_bridge_test.py
```

Expected Build 302 ending:

```text
BUILD 302 CORE + THREE MODULE ARCHITECTURE HISTORICAL REGRESSION: PASS (000b9617)
No Cloudflare resource was contacted.
```

Expected Build 303 ending:

```text
PASS: Build 303 shared Admin/Core JavaScript syntax
PASS: Build 303 Core runtime adds umbrella classification and reconciles already-verified auth without new network transport
PASS: shared Admin loader cache-busts the Build 303 Core runtime
PASS: Build 303 consumes the completed Build 302 three-module grouping
PASS: completed Build 302 architecture proof is historically pinned
PASS: domain services and the completed Build 301 Packaging stack remain unchanged
PASS: Commerce/Packaging/Accounting domains resolve to the expected umbrella modules
PASS: exact Build 303 umbrella-bridge changed-file boundary
PASS: no SQL/schema, Cloudflare binding/config, R2, or Production change
BUILD 303 COMMERCE & OPERATIONS UMBRELLA RUNTIME BRIDGE: PASS
No Cloudflare resource was contacted.
```

`git status --short` should be empty after pulling because Build 303 is already committed on `dev`.

## Development deployment

Confirm the newest Development Pages deployment uses the corrective Build 303 head:

```bash
npx --yes wrangler@latest pages deployment list \
  --project-name devilndove-site-dev | head -n 20
```

The Cloudflare `Environment = Production` label refers to the primary environment of the Development Pages project, not real Production.

## Browser proof 1 — Commerce & Operations classification

Hard-refresh:

```text
/admin/products/
```

Then run in Firefox DevTools Console:

```js
(() => {
  const r = window.DDModuleRuntime;
  const app = r?.getCurrentApplicationModule?.();
  console.table({
    runtime_build: r?.build,
    architecture_build: r?.applicationArchitectureBuild,
    domain: document.documentElement.dataset.ddModule,
    domain_mode: document.documentElement.dataset.ddModuleMode,
    application_module: document.documentElement.dataset.ddApplicationModule,
    application_module_mode: document.documentElement.dataset.ddApplicationModuleMode,
    api_current_application_module: app?.id,
    active_domain_runtime: r?.getActiveModuleId?.(),
    contracts_ok: r?.contractValidation?.ok,
    services_ok: r?.serviceRegistration?.ok,
  });
})();
```

Expected final steady state:

```text
runtime_build                   303
architecture_build              302
domain                          catalog
domain_mode                     shadow
application_module              commerce-operations
application_module_mode         domain-bridge
api_current_application_module  commerce-operations
active_domain_runtime           null
contracts_ok                    true
services_ok                     true
```

## Browser proof 2 — Packaging preservation after reconciliation

Hard-refresh:

```text
/admin/packaging-studio/
```

Allow the Packaging project to load, then run:

```js
(() => {
  const r = window.DDModuleRuntime;
  const app = r?.getCurrentApplicationModule?.();
  const p = window.DDPackagingCompatibility?.getStatus?.();
  console.table({
    runtime_build: r?.build,
    architecture_build: r?.applicationArchitectureBuild,
    auth_phase: window.DDAuthUiState?.phase,
    auth_verified: window.DDAuthUiState?.verified,
    domain: document.documentElement.dataset.ddModule,
    domain_mode: document.documentElement.dataset.ddModuleMode,
    application_module: document.documentElement.dataset.ddApplicationModule,
    api_current_application_module: app?.id,
    active_domain_runtime: r?.getActiveModuleId?.(),
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
runtime_build                   303
architecture_build              302
auth_phase                      verified
auth_verified                   true
domain                          packaging
domain_mode                     active
application_module              creative-production
api_current_application_module  creative-production
active_domain_runtime           packaging
packaging_compatibility_build   301
packaging_compatibility_state   active
native_read_status              200
failed_verification_count       0
preview_mode                    fit
```

Build 303 does not require another Packaging write because it does not alter Packaging transport/save logic. If any Packaging functional regression is observed, stop and investigate before completion.

## Completion decision

Do not mark Build 303 complete until:

1. Build 302 historical regression passes;
2. corrective Build 303 local regression passes;
3. Development deployment is current;
4. `/admin/products/` resolves `catalog -> commerce-operations` without activating a domain runtime;
5. Packaging resolves `packaging -> creative-production`;
6. retained verified auth reconciles Packaging to `domain_mode = active` even if the original verified event was missed;
7. Build 301 compatibility reaches `active` with native read status 200;
8. contracts/services remain green;
9. no SQL/config/R2/Production change occurred.
