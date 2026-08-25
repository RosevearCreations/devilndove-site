# Builds 355–357 Validation — Content Studio Runtime

## Status — STAGED / VALIDATION REQUIRED

```text
Build 355  Content Studio non-mutating GET/read contract
Build 356  Creative & Production runtime expands to Content
Build 357  /admin/content-studio/ top-level activation
```

Content Studio mutation ownership remains unchanged. CAIP remains bridge-only because its automatic GET still performs schema ensures.

## Local checkpoint

The Creative runtime advanced again in Build 356, so rerun the two historical Creative wrapper tests plus the new batch:

```bash
git -c gc.auto=0 pull --ff-only origin dev

python scripts/build349_351_creative_production_runtime_test.py
python scripts/build352_354_creative_process_runtime_test.py
python scripts/build355_357_content_studio_runtime_test.py

git status --short
```

Expected:

```text
BUILDS 349-351 CREATIVE PRODUCTION PACKAGING RUNTIME: PASS
No Cloudflare resource was contacted.
BUILDS 352-354 CREATIVE PROCESS RUNTIME: PASS
No Cloudflare resource was contacted.
BUILDS 355-357 CONTENT STUDIO RUNTIME: PASS
No Cloudflare resource was contacted.
```

and no output from `git status --short`.

## Firefox activation gate

After Development deploys, open `/admin/content-studio/`, wait for the Content Studio listing and administrator verification, then run:

```js
(async () => {
  const legacyResponse = await window.DDAuth.apiFetch('/api/admin/content-studio');
  const legacy = await legacyResponse.json().catch(() => null);

  const contractResponse = await window.DDAuth.apiFetch('/api/admin/contracts/content-studio-read');
  const contract = await contractResponse.json().catch(() => null);

  const r = window.DDModuleRuntime;
  const c = window.DDCreativeProduction;
  const s = c?.getStatus?.() || null;
  const app = r?.getCurrentApplicationModule?.() || null;
  const runtimeDefinition = r?.applicationModuleRuntimeForDomain?.('content') || null;
  const service = r?.service?.('content-studio-read') || null;
  const serviceResult = service ? await service.list() : null;

  const out = {
    legacy_status: legacyResponse.status,
    legacy_build: legacy?.build ?? null,
    legacy_legacy_build: legacy?.legacy_build ?? null,
    legacy_owner: legacy?.owner ?? null,
    legacy_contract: legacy?.contract ?? null,
    legacy_schema_ready: legacy?.schema_ready ?? null,
    legacy_schema_mutation: legacy?.request_time_schema_mutation ?? null,
    legacy_mutation_ownership_moved: legacy?.mutation_ownership_moved ?? null,

    contract_status: contractResponse.status,
    contract_build: contract?.build ?? null,
    contract_legacy_build: contract?.legacy_build ?? null,
    contract_owner: contract?.owner ?? null,
    contract_id: contract?.contract ?? null,
    contract_schema_ready: contract?.schema_ready ?? null,
    contract_schema_mutation: contract?.request_time_schema_mutation ?? null,
    contract_mutation_ownership_moved: contract?.mutation_ownership_moved ?? null,

    service_registered: Boolean(service),
    service_build: serviceResult?.build ?? null,
    service_legacy_build: serviceResult?.legacyBuild ?? null,
    service_schema_ready: serviceResult?.schemaReady ?? null,
    service_schema_mutation: serviceResult?.requestTimeSchemaMutation ?? null,
    service_mutation_ownership_moved: serviceResult?.mutationOwnershipMoved ?? null,

    application_module: app?.id ?? null,
    application_mode: document.documentElement.dataset.ddApplicationModuleMode ?? null,
    active_application_module: r?.getActiveApplicationModuleId?.() ?? null,
    content_domain: r?.getCurrent?.()?.id ?? null,
    creative_runtime_definition: runtimeDefinition?.id ?? null,
    creative_runtime_entry: runtimeDefinition?.entry ?? null,
    creative_runtime_build: s?.build ?? null,
    creative_activation_build: s?.activationBuild ?? null,
    creative_state: s?.state ?? null,
    creative_current_domain: s?.currentDomain ?? null,
    creative_last_pathname: s?.lastPathname ?? null,
    creative_services_ready: s?.servicesReady ?? null,
    creative_required_service_count: s?.activeRequiredServices?.length ?? null,
    content_page_proven: s?.currentContentStudioPageProven ?? null,
    content_contract_build: s?.contentStudioReadContractBuild ?? null,
    creative_creates_network_transport: s?.createsNetworkTransport ?? null,
    content_mutation_ownership: s?.contentMutationOwnership ?? null,
    contracts_ok: r?.contractValidation?.ok === true,
    services_ok: r?.serviceRegistration?.ok === true,
  };

  if (legacy?.schema_ready === false) {
    out.legacy_missing_tables = JSON.stringify(legacy?.missing_tables || []);
    out.legacy_missing_columns = JSON.stringify(legacy?.missing_columns || []);
  }
  if (contract?.schema_ready === false) {
    out.contract_missing_tables = JSON.stringify(contract?.missing_tables || []);
    out.contract_missing_columns = JSON.stringify(contract?.missing_columns || []);
  }

  console.table(out);
})();
```

Expected structural proof:

```text
legacy_status                         200
legacy_build                          355
legacy_legacy_build                   273
legacy_owner                          content
legacy_contract                       content-studio-read
legacy_schema_ready                   true
legacy_schema_mutation                false
legacy_mutation_ownership_moved       false
contract_status                       200
contract_build                        355
contract_legacy_build                 273
contract_owner                        content
contract_id                           content-studio-read
contract_schema_ready                 true
contract_schema_mutation              false
contract_mutation_ownership_moved     false
service_registered                    true
service_build                         355
service_legacy_build                  273
service_schema_ready                  true
service_schema_mutation               false
service_mutation_ownership_moved      false
application_module                    creative-production
application_mode                      active
active_application_module             creative-production
content_domain                        content
creative_runtime_definition           creative-production
creative_runtime_entry                ../modules/creative-production/runtime.mjs?v=356
creative_runtime_build                356
creative_activation_build             357
creative_state                        active
creative_current_domain               content
creative_last_pathname                /admin/content-studio/
creative_services_ready               true
creative_required_service_count       1
content_page_proven                    true
content_contract_build                355
creative_creates_network_transport    false
content_mutation_ownership             false
contracts_ok                          true
services_ok                           true
```

If `schema_ready` is false, record the reported missing tables/columns as Development parity evidence. Do not add DDL back to GET.

Do not create/refresh a package, edit media/deliverables, queue social content, or invoke any POST action during this proof.
