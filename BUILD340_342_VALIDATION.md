# Builds 340–342 Validation — Reconciliation / Platform Sanity / Close Workflow Read Batch

## Status — STAGED / VALIDATION REQUIRED

```text
Build 340  Accounting reconciliation GET read extraction
Build 341  Platform DB sanity read ownership extraction
Build 342  Accounting close-workflow GET schema-mutation retirement + read extraction
```

Business & Administration remains `domain-bridge` / inactive. No Accounting mutation ownership moves. Build 341 is intentionally Platform-owned because DB sanity spans the complete application schema.

## One Git Bash block

```bash
git pull --ff-only origin dev
python scripts/build331_333_accounting_read_batch_test.py
python scripts/build334_336_accounting_read_batch_test.py
python scripts/build337_339_accounting_read_batch_test.py
python scripts/build340_342_accounting_read_batch_test.py
git status --short
```

Expected all four batch tests to PASS with `No Cloudflare resource was contacted.` and a clean status.

## One Firefox browser block

Open `/admin/accounting/` and run:

```js
(async () => {
  const month = new Date().toISOString().slice(0, 7);
  const r = window.DDModuleRuntime;
  const checks = [
    ['reconciliation_legacy', `/api/admin/accounting-reconciliation?type=sales_tax&period_month=${encodeURIComponent(month)}`],
    ['reconciliation_contract', `/api/admin/contracts/accounting-reconciliation-read?type=sales_tax&period_month=${encodeURIComponent(month)}`],
    ['db_sanity_legacy', '/api/admin/db-sanity'],
    ['db_sanity_contract', '/api/admin/contracts/platform-db-sanity-read'],
    ['close_workflow_legacy', `/api/admin/accounting-close-workflow?period_month=${encodeURIComponent(month)}`],
    ['close_workflow_contract', `/api/admin/contracts/accounting-close-workflow-read?period_month=${encodeURIComponent(month)}`],
  ];

  const out = {};
  for (const [name, url] of checks) {
    const response = await window.DDAuth.apiFetch(url);
    const data = await response.json().catch(() => null);
    out[`${name}_status`] = response.status;
    out[`${name}_build`] = data?.build ?? null;
    out[`${name}_owner`] = data?.owner ?? null;
    out[`${name}_schema_ready`] = data?.schema_ready ?? null;
    out[`${name}_schema_mutation`] = data?.request_time_schema_mutation ?? null;
    if (data?.schema_ready === false) {
      out[`${name}_missing_tables`] = JSON.stringify(data?.missing_table_names || data?.missing_tables || []);
      out[`${name}_missing_columns`] = JSON.stringify(data?.missing_columns || []);
    }
  }

  for (const [id, options] of [
    ['accounting-reconciliation-read', { reconciliationType: 'sales_tax', periodMonth: month }],
    ['platform-db-sanity-read', {}],
    ['accounting-close-workflow-read', { periodMonth: month }],
  ]) {
    const service = r?.service?.(id);
    const result = service ? await service.list(options) : null;
    out[`${id}_service_build`] = result?.build ?? null;
    out[`${id}_service_schema_ready`] = result?.schemaReady ?? null;
    out[`${id}_service_schema_mutation`] = result?.requestTimeSchemaMutation ?? null;
  }

  out.application_module = r?.getCurrentApplicationModule?.()?.id ?? null;
  out.application_mode = document.documentElement.dataset.ddApplicationModuleMode ?? null;
  out.active_application_module = r?.getActiveApplicationModuleId?.() ?? null;
  out.contracts_ok = r?.contractValidation?.ok === true;
  out.services_ok = r?.serviceRegistration?.ok === true;
  console.table(out);
})();
```

Expected structural proof:

```text
reconciliation legacy/contract     status 200, build 340, owner accounting, mutation false
db sanity legacy/contract          status 200, build 341, owner platform, mutation false
close workflow legacy/contract     status 200, build 342, owner accounting, mutation false
service builds                     340 / 341 / 342
all service mutation flags         false
application_module                 business-administration
application_mode                   domain-bridge
active_application_module          null
contracts_ok                       true
services_ok                        true
```

`schema_ready=false` is allowed and should be captured as schema-parity evidence. Do not restore GET-time DDL. Do not use CSV/ZIP export or any POST/save action during this browser proof.
