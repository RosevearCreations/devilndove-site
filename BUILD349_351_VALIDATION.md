# Builds 349–351 Validation — Creative & Production Packaging Runtime

## Status — STAGED / VALIDATION REQUIRED

```text
Build 349  Packaging top-level runtime audit / Build 301 baseline pin
Build 350  Creative & Production passive runtime implementation
Build 351  /admin/packaging-studio/ top-level Creative runtime activation
```

Packaging read/write authorities and mutation ownership remain unchanged. Production remains frozen.

## Local checkpoint

This also closes the corrected historical Build 343–345 local gate:

```bash
git pull --ff-only origin dev
python scripts/build343_345_accounting_read_batch_test.py
python scripts/build349_351_creative_production_runtime_test.py
git status --short
```

Expected:

```text
BUILDS 343-345 ACCOUNTING YEAR-END/EXPORT READ BATCH: PASS
No Cloudflare resource was contacted.
BUILDS 349-351 CREATIVE PRODUCTION PACKAGING RUNTIME: PASS
No Cloudflare resource was contacted.
```

and no output from `git status --short`.

## Firefox activation gate

Open `/admin/packaging-studio/` after Development deploys. Wait for Packaging projects to load and administrator verification, then run:

```js
(() => {
  const r = window.DDModuleRuntime;
  const c = window.DDCreativeProduction;
  const s = c?.getStatus?.() || null;
  const p = window.DDPackagingContracts?.getStatus?.() || null;
  const compat = window.DDPackagingCompatibility?.getStatus?.() || null;
  const gate = window.DDPackagingStartupGate?.getStatus?.() || null;
  const app = r?.getCurrentApplicationModule?.() || null;
  const runtimeDefinition = r?.applicationModuleRuntimeForDomain?.('packaging') || null;

  console.table({
    application_module: app?.id ?? null,
    application_mode: document.documentElement.dataset.ddApplicationModuleMode ?? null,
    active_application_module: r?.getActiveApplicationModuleId?.() ?? null,
    packaging_domain: r?.getCurrent?.()?.id ?? null,
    creative_runtime_definition: runtimeDefinition?.id ?? null,
    creative_runtime_entry: runtimeDefinition?.entry ?? null,
    creative_runtime_build: s?.build ?? null,
    creative_activation_build: s?.activationBuild ?? null,
    creative_state: s?.state ?? null,
    creative_current_domain: s?.currentDomain ?? null,
    creative_last_pathname: s?.lastPathname ?? null,
    creative_services_ready: s?.servicesReady ?? null,
    creative_required_service_count: s?.requiredServices?.length ?? null,
    creative_packaging_page_proven: s?.currentPackagingPageProven ?? null,
    creative_creates_network_transport: s?.createsNetworkTransport ?? null,
    creative_packaging_mutation_ownership: s?.packagingMutationOwnership ?? null,
    packaging_domain_runtime_present: s?.packagingDomainRuntimePresent ?? null,
    packaging_domain_runtime_state: s?.packagingDomainRuntimeState ?? null,
    packaging_domain_runtime_build: s?.packagingDomainRuntimeBuild ?? null,
    packaging_client_transport_build: s?.packagingClientTransportBuild ?? null,
    packaging_client_transport_ready: s?.packagingClientTransportReady ?? null,
    packaging_legacy_get_fallback_removed: s?.packagingLegacyGetFallbackRemoved ?? null,
    packaging_legacy_server_get_reachable: s?.packagingLegacyServerGetReachable ?? null,
    packaging_write_bridge_armed: s?.packagingWriteResponseBridgeArmed ?? null,
    compatibility_build: compat?.build ?? null,
    compatibility_state: compat?.state ?? null,
    compatibility_checkpoint: compat?.compatibilityCheckpoint ?? null,
    startup_gate_ready: gate?.runtimeReady ?? null,
    native_read_status: compat?.nativeReadStatus ?? null,
    contracts_ok: r?.contractValidation?.ok === true,
    services_ok: r?.serviceRegistration?.ok === true,
  });
})();
```

Expected structural proof:

```text
application_module                       creative-production
application_mode                         active
active_application_module                creative-production
packaging_domain                         packaging
creative_runtime_definition              creative-production
creative_runtime_entry                   ../modules/creative-production/runtime.mjs?v=350
creative_runtime_build                   350
creative_activation_build                351
creative_state                           active
creative_current_domain                  packaging
creative_last_pathname                   /admin/packaging-studio/
creative_services_ready                  true
creative_required_service_count          3
creative_packaging_page_proven           true
creative_creates_network_transport       false
creative_packaging_mutation_ownership    false
packaging_domain_runtime_present         true
packaging_domain_runtime_state           active
packaging_domain_runtime_build           290
packaging_client_transport_build         297
packaging_client_transport_ready         true
packaging_legacy_get_fallback_removed    true
packaging_legacy_server_get_reachable    false
packaging_write_bridge_armed             true
compatibility_build                      301
compatibility_state                      active
compatibility_checkpoint                 true
startup_gate_ready                       true
native_read_status                       200
contracts_ok                             true
services_ok                              true
```

No Save, create, delete, print, upload, or other mutation is required for this proof. Build 301 already separately validated normal Packaging writes; this gate proves only the new top-level wrapper and coexistence with the proven domain runtime.
