# Builds 346–348 Validation — Accounting Startup Audit / Business Runtime Activation

## Status — STAGED / VALIDATION REQUIRED

```text
Build 346  Accounting startup-read audit closure
Build 347  Business & Administration passive runtime implementation
Build 348  /admin/accounting/ read-only Business runtime activation
```

Accounting mutation ownership remains false. Schema parity remains a separate track.

## Combined local checkpoint

```bash
git pull --ff-only origin dev
python scripts/build331_333_accounting_read_batch_test.py
python scripts/build334_336_accounting_read_batch_test.py
python scripts/build337_339_accounting_read_batch_test.py
python scripts/build340_342_accounting_read_batch_test.py
python scripts/build343_345_accounting_read_batch_test.py
python scripts/build346_348_business_admin_runtime_test.py
git status --short
```

Expected every script to PASS with `No Cloudflare resource was contacted.` and a clean status.

## Firefox activation gate

Open `/admin/accounting/` after Development deploys and wait for administrator verification, then run:

```js
(() => {
  const r = window.DDModuleRuntime;
  const b = window.DDBusinessAdministration;
  const s = b?.getStatus?.() || null;
  const app = r?.getCurrentApplicationModule?.() || null;
  const runtimeDefinition = r?.applicationModuleRuntimeForDomain?.('accounting') || null;

  const out = {
    application_module: app?.id ?? null,
    application_mode: document.documentElement.dataset.ddApplicationModuleMode ?? null,
    active_application_module: r?.getActiveApplicationModuleId?.() ?? null,
    accounting_domain: r?.getCurrent?.()?.id ?? null,
    business_runtime_definition: runtimeDefinition?.id ?? null,
    business_runtime_entry: runtimeDefinition?.entry ?? null,
    business_runtime_build: s?.build ?? null,
    business_activation_build: s?.activationBuild ?? null,
    business_state: s?.state ?? null,
    business_current_domain: s?.currentDomain ?? null,
    business_last_pathname: s?.lastPathname ?? null,
    business_services_ready: s?.servicesReady ?? null,
    business_required_service_count: s?.allRequiredServices?.length ?? null,
    business_accounting_page_proven: s?.currentAccountingPageProven ?? null,
    business_creates_network_transport: s?.createsNetworkTransport ?? null,
    business_accounting_mutation_ownership: s?.accountingMutationOwnership ?? null,
    contracts_ok: r?.contractValidation?.ok === true,
    services_ok: r?.serviceRegistration?.ok === true,
  };

  console.table(out);
})();
```

Expected structural proof:

```text
application_module                       business-administration
application_mode                         active
active_application_module                business-administration
accounting_domain                        accounting
business_runtime_definition              business-administration
business_runtime_build                   347
business_activation_build                348
business_state                           active
business_current_domain                  accounting
business_last_pathname                   /admin/accounting/
business_services_ready                  true
business_required_service_count          28
business_accounting_page_proven          true
business_creates_network_transport       false
business_accounting_mutation_ownership   false
contracts_ok                             true
services_ok                              true
```

Do not use any POST/save/upload/import/lock/journal action during this activation proof.
