# Builds 337–339 Validation — Accounting Automatic Read Batch

## Status — STAGED / VALIDATION REQUIRED

```text
Build 337  Sales-tax filing read extraction
Build 338  Fixed-assets GET schema-mutation retirement + read extraction
Build 339  Evidence-check read ownership/schema-readiness extraction
```

Business & Administration remains `domain-bridge` / inactive. No Accounting mutation ownership moves.

## One Git Bash block

```bash
git pull --ff-only origin dev
python scripts/build331_333_accounting_read_batch_test.py
python scripts/build334_336_accounting_read_batch_test.py
python scripts/build337_339_accounting_read_batch_test.py
git status --short
```

Expected all three batch tests to PASS with `No Cloudflare resource was contacted.` and a clean status.

## One Firefox browser block

Open `/admin/accounting/` and run:

```js
(async () => {
  const month = new Date().toISOString().slice(0, 7);
  const r = window.DDModuleRuntime;
  const checks = [
    ['sales_tax_legacy', `/api/admin/accounting-sales-tax-filing?period_month=${encodeURIComponent(month)}`],
    ['sales_tax_contract', `/api/admin/contracts/accounting-sales-tax-filing-read?period_month=${encodeURIComponent(month)}`],
    ['fixed_assets_legacy', '/api/admin/accounting-fixed-assets'],
    ['fixed_assets_contract', '/api/admin/contracts/accounting-fixed-assets-read'],
    ['evidence_legacy', `/api/admin/accounting-evidence-check?period_month=${encodeURIComponent(month)}`],
    ['evidence_contract', `/api/admin/contracts/accounting-evidence-check-read?period_month=${encodeURIComponent(month)}`],
  ];
  const out = {};
  for (const [name,url] of checks) {
    const response = await window.DDAuth.apiFetch(url); const data = await response.json().catch(() => null);
    out[`${name}_status`] = response.status; out[`${name}_build`] = data?.build ?? null; out[`${name}_owner`] = data?.owner ?? null;
    out[`${name}_schema_ready`] = data?.schema_ready ?? null; out[`${name}_schema_mutation`] = data?.request_time_schema_mutation ?? null;
    if (data?.schema_ready === false) { out[`${name}_missing_tables`] = JSON.stringify(data?.missing_tables || []); out[`${name}_missing_columns`] = JSON.stringify(data?.missing_columns || []); }
  }
  for (const [id,options] of [
    ['accounting-sales-tax-filing-read',{periodMonth:month}],
    ['accounting-fixed-assets-read',{}],
    ['accounting-evidence-check-read',{periodMonth:month}],
  ]) {
    const service = r?.service?.(id); const result = service ? await service.list(options) : null;
    out[`${id}_service_build`] = result?.build ?? null; out[`${id}_service_schema_ready`] = result?.schemaReady ?? null; out[`${id}_service_schema_mutation`] = result?.requestTimeSchemaMutation ?? null;
  }
  out.application_module = r?.getCurrentApplicationModule?.()?.id ?? null;
  out.application_mode = document.documentElement.dataset.ddApplicationModuleMode ?? null;
  out.active_application_module = r?.getActiveApplicationModuleId?.() ?? null;
  out.contracts_ok = r?.contractValidation?.ok === true; out.services_ok = r?.serviceRegistration?.ok === true;
  console.table(out);
})();
```

Expected builds 337/338/339, owner `accounting`, mutation false everywhere, and the application still `business-administration` / `domain-bridge` / inactive. Any `schema_ready=false` is schema-parity evidence, not permission to add DDL to GET.
