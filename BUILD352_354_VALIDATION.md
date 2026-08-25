# Builds 352–354 Validation — Creative Process Runtime

## Status — STAGED / VALIDATION REQUIRED

```text
Build 352  Creative Process GET-only owned read contract
Build 353  Creative & Production runtime expands to Creative Process
Build 354  /admin/creative-process/ top-level activation
```

Creative Process mutation ownership remains unchanged. Inventory posting/reversal remain Inventory-owned.

## Local checkpoint

The combined checkpoint also closes the two still-outstanding historical local gates:

```bash
git pull --ff-only origin dev
python scripts/build343_345_accounting_read_batch_test.py
python scripts/build349_351_creative_production_runtime_test.py
python scripts/build352_354_creative_process_runtime_test.py
git status --short
```

Expected:

```text
BUILDS 343-345 ACCOUNTING YEAR-END/EXPORT READ BATCH: PASS
No Cloudflare resource was contacted.
BUILDS 349-351 CREATIVE PRODUCTION PACKAGING RUNTIME: PASS
No Cloudflare resource was contacted.
BUILDS 352-354 CREATIVE PROCESS RUNTIME: PASS
No Cloudflare resource was contacted.
```

and no output from `git status --short`.

## Firefox activation gate

After Development deploys, open `/admin/creative-process/`, wait for projects to load and administrator verification, then run:

```js
(async () => {
  const response = await window.DDAuth.apiFetch('/api/admin/contracts/creative-process-read');
  const data = await response.json().catch(() => null);

  const r = window.DDModuleRuntime;
  const c = window.DDCreativeProduction;
  const s = c?.getStatus?.() || null;
  const app = r?.getCurrentApplicationModule?.() || null;
  const runtimeDefinition = r?.applicationModuleRuntimeForDomain?.('creative') || null;
  const service = r?.service?.('creative-process-read') || null;

  console.table({
    creative_contract_status: response.status,
    creative_contract_build: data?.build ?? null,
    creative_contract_legacy_build: data?.legacy_build ?? null,
    creative_contract_owner: data?.owner ?? null,
    creative_contract_id: data?.contract ?? null,
    creative_contract_schema_mutation: data?.request_time_schema_mutation ?? null,
    creative_contract_mutation_ownership_moved: data?.mutation_ownership_moved ?? null,
    creative_contract_inventory_post_authority: data?.inventory_post_authority ?? null,
    creative_contract_inventory_reversal_authority: data?.inventory_reversal_authority ?? null,

    application_module: app?.id ?? null,
    application_mode: document.documentElement.dataset.ddApplicationModuleMode ?? null,
    active_application_module: r?.getActiveApplicationModuleId?.() ?? null,
    creative_domain: r?.getCurrent?.()?.id ?? null,

    creative_runtime_definition: runtimeDefinition?.id ?? null,
    creative_runtime_entry: runtimeDefinition?.entry ?? null,
    creative_runtime_build: s?.build ?? null,
    creative_activation_build: s?.activationBuild ?? null,
    creative_state: s?.state ?? null,
    creative_current_domain: s?.currentDomain ?? null,
    creative_last_pathname: s?.lastPathname ?? null,
    creative_services_ready: s?.servicesReady ?? null,
    creative_required_service_count: s?.activeRequiredServices?.length ?? null,
    creative_process_service_registered: Boolean(service),
    creative_process_page_proven: s?.currentCreativeProcessPageProven ?? null,
    creative_process_contract_build: s?.creativeProcessReadContractBuild ?? null,
    creative_creates_network_transport: s?.createsNetworkTransport ?? null,
    creative_mutation_ownership: s?.creativeMutationOwnership ?? null,

    contracts_ok: r?.contractValidation?.ok === true,
    services_ok: r?.serviceRegistration?.ok === true,
  });
})();
```

Expected structural proof:

```text
creative_contract_status                       200
creative_contract_build                        352
creative_contract_legacy_build                 274
creative_contract_owner                        creative
creative_contract_id                           creative-process-read
creative_contract_schema_mutation              false
creative_contract_mutation_ownership_moved     false
creative_contract_inventory_post_authority     inventory-post
creative_contract_inventory_reversal_authority inventory-reverse

application_module                             creative-production
application_mode                               active
active_application_module                      creative-production
creative_domain                                creative
creative_runtime_definition                    creative-production
creative_runtime_entry                         ../modules/creative-production/runtime.mjs?v=353
creative_runtime_build                         353
creative_activation_build                      354
creative_state                                 active
creative_current_domain                        creative
creative_last_pathname                         /admin/creative-process/
creative_services_ready                        true
creative_required_service_count                4
creative_process_service_registered            true
creative_process_page_proven                    true
creative_process_contract_build                352
creative_creates_network_transport              false
creative_mutation_ownership                    false
contracts_ok                                    true
services_ok                                     true
```

Do not create/edit projects or trigger any POST/inventory action during this proof.
