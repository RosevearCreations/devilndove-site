# Builds 334–336 Validation — Accounting Statement/Reconciliation Support Read Batch

## Status — STAGED / VALIDATION REQUIRED

```text
Build 334  Statement imports GET schema/seeding retirement + read extraction
Build 335  Reconciliation exceptions GET schema-mutation retirement + read extraction
Build 336  Vendor statements GET attachment-helper mutation retirement + read extraction
```

Business & Administration remains `domain-bridge` / inactive. No Accounting mutation ownership moves.

## One Git Bash block

```bash
git pull --ff-only origin dev
python scripts/build331_333_accounting_read_batch_test.py
python scripts/build334_336_accounting_read_batch_test.py
git status --short
```

Expected:

```text
BUILDS 331-333 ACCOUNTING READ BATCH: PASS
No Cloudflare resource was contacted.
BUILDS 334-336 ACCOUNTING READ BATCH: PASS
No Cloudflare resource was contacted.
```

## One Firefox browser block

Open `/admin/accounting/` and run:

```js
(async () => {
  const month = new Date().toISOString().slice(0, 7);
  const r = window.DDModuleRuntime;
  const checks = [
    ['imports_legacy', `/api/admin/accounting-statement-imports?period_month=${encodeURIComponent(month)}`],
    ['imports_contract', `/api/admin/contracts/accounting-statement-imports-read?period_month=${encodeURIComponent(month)}`],
    ['exceptions_legacy', `/api/admin/accounting-reconciliation-exceptions?period_month=${encodeURIComponent(month)}`],
    ['exceptions_contract', `/api/admin/contracts/accounting-reconciliation-exceptions-read?period_month=${encodeURIComponent(month)}`],
    ['vendor_statements_legacy', `/api/admin/accounting-vendor-statements?period_month=${encodeURIComponent(month)}`],
    ['vendor_statements_contract', `/api/admin/contracts/accounting-vendor-statements-read?period_month=${encodeURIComponent(month)}`],
  ];
  const out = {};
  for (const [name,url] of checks) {
    const response = await window.DDAuth.apiFetch(url);
    const data = await response.json().catch(() => null);
    out[`${name}_status`] = response.status;
    out[`${name}_build`] = data?.build ?? null;
    out[`${name}_owner`] = data?.owner ?? null;
    out[`${name}_schema_ready`] = data?.schema_ready ?? null;
    out[`${name}_schema_mutation`] = data?.request_time_schema_mutation ?? null;
    if (data?.schema_ready === false) {
      out[`${name}_missing_tables`] = JSON.stringify(data?.missing_tables || []);
      out[`${name}_missing_columns`] = JSON.stringify(data?.missing_columns || []);
    }
  }
  for (const [id,options] of [
    ['accounting-statement-imports-read',{periodMonth:month}],
    ['accounting-reconciliation-exceptions-read',{periodMonth:month}],
    ['accounting-vendor-statements-read',{periodMonth:month}],
  ]) {
    const service=r?.service?.(id); const result=service?await service.list(options):null;
    out[`${id}_service_build`]=result?.build??null;
    out[`${id}_service_schema_ready`]=result?.schemaReady??null;
    out[`${id}_service_schema_mutation`]=result?.requestTimeSchemaMutation??null;
  }
  out.application_module=r?.getCurrentApplicationModule?.()?.id??null;
  out.application_mode=document.documentElement.dataset.ddApplicationModuleMode??null;
  out.active_application_module=r?.getActiveApplicationModuleId?.()??null;
  out.contracts_ok=r?.contractValidation?.ok===true;
  out.services_ok=r?.serviceRegistration?.ok===true;
  console.table(out);
})();
```

Expected builds are 334, 335 and 336; all owners `accounting`; all read/service mutation flags `false`; application remains `business-administration` / `domain-bridge` / inactive; contract and service registration remain true. Any `schema_ready=false` is schema-parity evidence rather than permission to restore GET-time DDL.
