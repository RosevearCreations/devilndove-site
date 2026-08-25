# Builds 343–345 Validation — Accounting Year-End / Export Read Batch

## Status — STAGED / VALIDATION REQUIRED

```text
Build 343  Accounting year-end close read extraction
Build 344  Monthly summary export read ownership/schema diagnostics
Build 345  Quarter/year summary export read ownership/schema diagnostics
```

Business & Administration remains `domain-bridge` / inactive. Accounting mutation ownership remains unmoved.

## Local checkpoint

```bash
git pull --ff-only origin dev
python scripts/build331_333_accounting_read_batch_test.py
python scripts/build334_336_accounting_read_batch_test.py
python scripts/build337_339_accounting_read_batch_test.py
python scripts/build340_342_accounting_read_batch_test.py
python scripts/build343_345_accounting_read_batch_test.py
git status --short
```

Expected all five scripts to PASS, each ending with `No Cloudflare resource was contacted.`, and a clean `git status --short`.

## Firefox browser gate

Open `/admin/accounting/` after Development deploys and run:

```js
(async () => {
  const year = String(new Date().getFullYear());
  const month = new Date().toISOString().slice(0, 7);
  const quarter = `${year}-Q${Math.floor(new Date().getMonth() / 3) + 1}`;
  const r = window.DDModuleRuntime;
  const out = {};

  for (const [name, url] of [
    ['year_end_legacy', `/api/admin/accounting-year-end-close?year=${encodeURIComponent(year)}`],
    ['year_end_contract', `/api/admin/contracts/accounting-year-end-close-read?year=${encodeURIComponent(year)}`],
    ['monthly_contract', `/api/admin/contracts/accounting-monthly-summary-export-read?month=${encodeURIComponent(month)}`],
    ['period_contract', `/api/admin/contracts/accounting-period-summary-export-read?scope=quarter&period=${encodeURIComponent(quarter)}`],
  ]) {
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

  for (const [name, url] of [
    ['monthly_legacy', `/api/admin/accounting-monthly-summary-export?month=${encodeURIComponent(month)}`],
    ['period_legacy', `/api/admin/accounting-period-summary-export?scope=quarter&period=${encodeURIComponent(quarter)}`],
  ]) {
    const response = await window.DDAuth.apiFetch(url);
    out[`${name}_status`] = response.status;
    out[`${name}_build`] = Number(response.headers.get('x-dd-build') || 0) || null;
    out[`${name}_owner`] = response.headers.get('x-dd-owner');
    out[`${name}_schema_ready`] = response.headers.get('x-dd-schema-ready');
    out[`${name}_schema_mutation`] = response.headers.get('x-dd-request-time-schema-mutation');
  }

  for (const [id, options] of [
    ['accounting-year-end-close-read', { year }],
    ['accounting-monthly-summary-export-read', { month }],
    ['accounting-period-summary-export-read', { scope: 'quarter', period: quarter }],
  ]) {
    const service = r?.service?.(id);
    const result = service ? await service.list(options) : null;
    out[`${id}_service_build`] = result?.build ?? null;
    out[`${id}_service_schema_ready`] = result?.schemaReady ?? null;
    out[`${id}_service_schema_mutation`] = result?.requestTimeSchemaMutation ?? null;
    if (result?.schemaReady === false) {
      out[`${id}_service_missing_tables`] = JSON.stringify(result?.missingTables || []);
      out[`${id}_service_missing_columns`] = JSON.stringify(result?.missingColumns || []);
    }
  }

  out.application_module = r?.getCurrentApplicationModule?.()?.id ?? null;
  out.application_mode = document.documentElement.dataset.ddApplicationModuleMode ?? null;
  out.active_application_module = r?.getActiveApplicationModuleId?.() ?? null;
  out.contracts_ok = r?.contractValidation?.ok === true;
  out.services_ok = r?.serviceRegistration?.ok === true;
  console.table(out);
})();
```

Expected builds 343 / 344 / 345, owners `accounting`, mutation false everywhere, and the application still `business-administration` / `domain-bridge` / inactive. The two legacy CSV routes report build/schema/mutation via response headers.

Any `schema_ready=false` output is schema-parity evidence. Do not add DDL to GET or export reads.
