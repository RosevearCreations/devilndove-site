# Builds 331–333 Validation — Accounting Master/Reference Read Batch

## Status — STAGED / VALIDATION REQUIRED

```text
Build 331  Accounting vendors GET schema-mutation retirement + read extraction
Build 332  Recurring expense rules GET schema-mutation retirement + read extraction
Build 333  Statement provider profiles GET seed/write retirement + read extraction
```

Business & Administration remains `domain-bridge` / inactive. No Accounting mutation ownership moves.

## One Git Bash block

```bash
git pull --ff-only origin dev
python scripts/build331_333_accounting_read_batch_test.py
git status --short
```

Expected:

```text
BUILDS 331-333 ACCOUNTING READ BATCH: PASS
No Cloudflare resource was contacted.
```

`git status --short` should print nothing.

## One Firefox browser block

Open `/admin/accounting/`, wait for administrator verification, then run:

```js
(async () => {
  const r = window.DDModuleRuntime;
  const checks = [
    ['vendors_legacy', '/api/admin/accounting-vendors'],
    ['vendors_contract', '/api/admin/contracts/accounting-vendors-read'],
    ['recurring_legacy', '/api/admin/accounting-recurring-expense-rules'],
    ['recurring_contract', '/api/admin/contracts/accounting-recurring-expense-rules-read'],
    ['profiles_legacy', '/api/admin/accounting-statement-provider-profiles'],
    ['profiles_contract', '/api/admin/contracts/accounting-statement-provider-profiles-read'],
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
    if (name.startsWith('profiles_')) {
      out[`${name}_default_profile_count`] = data?.default_profile_count ?? null;
      out[`${name}_defaults_materialized`] = data?.defaults_materialized ?? null;
      out[`${name}_source`] = data?.source ?? null;
    }
    if (data?.schema_ready === false) {
      out[`${name}_missing_tables`] = JSON.stringify(data?.missing_tables || []);
      out[`${name}_missing_columns`] = JSON.stringify(data?.missing_columns || []);
    }
  }

  for (const [id, options] of [
    ['accounting-vendors-read', {}],
    ['accounting-recurring-expense-rules-read', {}],
    ['accounting-statement-provider-profiles-read', {}],
  ]) {
    const service = r?.service?.(id);
    const result = service ? await service.list(options) : null;
    out[`${id}_service_build`] = result?.build ?? null;
    out[`${id}_service_schema_ready`] = result?.schemaReady ?? null;
    out[`${id}_service_schema_mutation`] = result?.requestTimeSchemaMutation ?? null;
    if (id === 'accounting-statement-provider-profiles-read') {
      out[`${id}_service_default_count`] = result?.defaultProfileCount ?? null;
      out[`${id}_service_defaults_materialized`] = result?.defaultsMaterialized ?? null;
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

Expected structural proof:

```text
vendors legacy/contract                    status 200, build 331, owner accounting, mutation false
recurring legacy/contract                  status 200, build 332, owner accounting, mutation false
profiles legacy/contract                   status 200, build 333, owner accounting, mutation false
accounting-vendors-read service            build 331, mutation false
accounting-recurring-expense-rules-read    build 332, mutation false
accounting-statement-provider-profiles-read build 333, mutation false
profiles defaults_materialized             false
profiles default_profile_count             6
application_module                         business-administration
application_mode                           domain-bridge
active_application_module                  null
contracts_ok                               true
services_ok                                true
```

Any `schema_ready=false` is schema-parity evidence; do not restore GET-time DDL. Provider-profile GET must still return the in-memory defaults while reporting schema readiness honestly.

## Safety boundary

Do not save vendors, generate recurring expenses, save recurring rules, seed provider defaults, or save provider profiles during this browser proof.
