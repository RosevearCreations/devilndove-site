# Build 324 Validation — Accounting Profit/Loss Read Extraction

## Status — STAGED / VALIDATION REQUIRED

Baseline: `b23a98a557721319afe73f5707563aa9703901f4`.

Build 324 extracts the automatic `/api/admin/accounting-profit-loss` GET into an Accounting-owned, non-mutating read service and dedicated GET-only contract while preserving the legacy URL for the current Accounting UI.

## Local regression

```bash
git pull --ff-only origin dev
python scripts/build324_accounting_profit_loss_read_extraction_test.py
git status --short
```

Expected:

```text
BUILD 324 ACCOUNTING PROFIT/LOSS READ EXTRACTION: PASS
No Cloudflare resource was contacted.
```

`git status --short` should be empty before later local edits.

## Development browser proof

Open `/admin/accounting/`, wait for administrator verification, then run this Firefox-safe console block:

```js
(async () => {
  const month = new Date().toISOString().slice(0, 7);
  const r = window.DDModuleRuntime;
  const service = r?.service?.('accounting-profit-loss-read');

  const [legacyRes, contractRes] = await Promise.all([
    window.DDAuth.apiFetch(`/api/admin/accounting-profit-loss?month=${encodeURIComponent(month)}`),
    window.DDAuth.apiFetch(`/api/admin/contracts/accounting-profit-loss-read?month=${encodeURIComponent(month)}`),
  ]);

  const legacy = await legacyRes.json().catch(() => null);
  const contract = await contractRes.json().catch(() => null);
  const serviceResult = service ? await service.list({ month }) : null;

  console.table({
    pathname: location.pathname,
    legacy_status: legacyRes.status,
    legacy_build: legacy?.build ?? null,
    legacy_owner: legacy?.owner ?? null,
    legacy_schema_ready: legacy?.schema_ready ?? null,
    legacy_schema_mutation: legacy?.request_time_schema_mutation ?? null,
    contract_status: contractRes.status,
    contract_build: contract?.build ?? null,
    contract_owner: contract?.owner ?? null,
    contract_schema_mutation: contract?.request_time_schema_mutation ?? null,
    service_build: serviceResult?.build ?? null,
    service_schema_mutation: serviceResult?.requestTimeSchemaMutation ?? null,
    application_module: r?.getCurrentApplicationModule?.()?.id ?? null,
    application_mode: document.documentElement.dataset.ddApplicationModuleMode ?? null,
    active_application_module: r?.getActiveApplicationModuleId?.() ?? null,
    contracts_ok: r?.contractValidation?.ok === true,
    services_ok: r?.serviceRegistration?.ok === true,
  });
})();
```

Expected structural proof:

```text
pathname                    /admin/accounting/
legacy_status               200
legacy_build                324
legacy_owner                accounting
legacy_schema_mutation      false
contract_status             200
contract_build              324
contract_owner              accounting
contract_schema_mutation    false
service_build               324
service_schema_mutation     false
application_module          business-administration
application_mode            domain-bridge
active_application_module   null
contracts_ok                true
services_ok                 true
```

`legacy_schema_ready` may be `true` or `false`. If it is `false`, capture `missing_tables` / `missing_columns` and route those findings to the separate schema-parity track. Do not restore request-time DDL.

## Safety boundary

Do not post journals, save expenses, upload files, import statements, or mutate Accounting records during this validation.

Build 324 does not activate Business & Administration and does not move any Accounting mutation authority.
