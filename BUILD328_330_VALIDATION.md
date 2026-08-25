# Builds 328–330 Validation — Accounting Read-Time DDL Retirement Batch

## Status — STAGED / VALIDATION REQUIRED

This batch covers:

```text
Build 328  GIFI summary GET schema-mutation retirement + read extraction
Build 329  Period locks GET schema-mutation retirement + read extraction
Build 330  Accounting attachments GET schema-mutation retirement + read extraction
```

Business & Administration remains domain-bridge/inactive and no mutation ownership moves.

## One Git Bash block

```bash
git pull --ff-only origin dev
python scripts/build325_327_accounting_read_batch_test.py
python scripts/build328_330_accounting_read_batch_test.py
git status --short
```

Expected:

```text
BUILDS 325-327 ACCOUNTING READ BATCH: PASS
No Cloudflare resource was contacted.
BUILDS 328-330 ACCOUNTING READ BATCH: PASS
No Cloudflare resource was contacted.
```

`git status --short` should print nothing. The first test closes the remaining local gate for the already browser-proven 325–327 batch.

## One Firefox browser block

Open `/admin/accounting/`, wait for administrator verification, then run:

```js
(async () => {
  const year = String(new Date().getFullYear());
  const month = new Date().toISOString().slice(0, 7);
  const r = window.DDModuleRuntime;

  const checks = [
    ['gifi_summary_legacy', `/api/admin/accounting-gifi-summary?year=${encodeURIComponent(year)}`],
    ['gifi_summary_contract', `/api/admin/contracts/accounting-gifi-summary-read?year=${encodeURIComponent(year)}`],
    ['period_locks_legacy', `/api/admin/accounting-period-locks?limit=18`],
    ['period_locks_contract', `/api/admin/contracts/accounting-period-locks-read?limit=18`],
    ['attachments_legacy', `/api/admin/accounting-attachments?period_month=${encodeURIComponent(month)}&limit=50`],
    ['attachments_contract', `/api/admin/contracts/accounting-attachments-read?period_month=${encodeURIComponent(month)}&limit=50`],
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
      out[`${name}_missing_tables`] = JSON.stringify(data?.missing_tables || []);
      out[`${name}_missing_columns`] = JSON.stringify(data?.missing_columns || []);
    }
  }

  for (const [id, options] of [
    ['accounting-gifi-summary-read', { year }],
    ['accounting-period-locks-read', { limit: 18 }],
    ['accounting-attachments-read', { periodMonth: month, limit: 50 }],
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
  out.contract_catalog_build = r?.contractCatalogBuild ?? null;
  out.service_adapter_build = r?.serviceAdapterBuild ?? null;
  out.contracts_ok = r?.contractValidation?.ok === true;
  out.services_ok = r?.serviceRegistration?.ok === true;

  console.table(out);
})();
```

Expected structural proof:

```text
gifi_summary_legacy_status                     200
gifi_summary_legacy_build                      328
gifi_summary_legacy_owner                      accounting
gifi_summary_legacy_schema_mutation            false
gifi_summary_contract_status                   200
gifi_summary_contract_build                    328
gifi_summary_contract_owner                    accounting
gifi_summary_contract_schema_mutation          false
accounting-gifi-summary-read_service_build     328

period_locks_legacy_status                     200
period_locks_legacy_build                      329
period_locks_legacy_owner                      accounting
period_locks_legacy_schema_mutation            false
period_locks_contract_status                   200
period_locks_contract_build                    329
period_locks_contract_owner                    accounting
period_locks_contract_schema_mutation          false
accounting-period-locks-read_service_build     329

attachments_legacy_status                      200
attachments_legacy_build                       330
attachments_legacy_owner                       accounting
attachments_legacy_schema_mutation             false
attachments_contract_status                    200
attachments_contract_build                     330
attachments_contract_owner                     accounting
attachments_contract_schema_mutation           false
accounting-attachments-read_service_build      330

application_module                             business-administration
application_mode                               domain-bridge
active_application_module                      null
contracts_ok                                   true
services_ok                                    true
```

Every `*_service_schema_mutation` must be `false`.

Any `schema_ready=false` is schema-parity evidence rather than permission to add DDL back to GET. Capture the displayed missing tables/columns.

## Safety boundary

Do not save period locks, upload attachments, post journals, save GIFI notes, or perform other Accounting mutations during this browser proof.
