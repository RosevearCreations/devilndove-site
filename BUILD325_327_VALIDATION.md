# Builds 325–327 Validation — Accounting Read Batch

## Status — STAGED / VALIDATION REQUIRED

This batch validates three bounded Accounting read changes together:

```text
Build 325  item-costing read extraction
Build 326  journal GET schema-mutation retirement + read extraction
Build 327  GIFI notes GET schema-mutation retirement + read extraction
```

Business & Administration must remain domain-bridge/inactive throughout.

## One local regression block

```bash
git pull --ff-only origin dev
python scripts/build325_327_accounting_read_batch_test.py
git status --short
```

Expected:

```text
BUILDS 325-327 ACCOUNTING READ BATCH: PASS
No Cloudflare resource was contacted.
```

`git status --short` should print nothing.

## One Firefox browser proof

Open `/admin/accounting/`, wait for administrator verification, then run:

```js
(async () => {
  const month = new Date().toISOString().slice(0, 7);
  const year = String(new Date().getFullYear());
  const r = window.DDModuleRuntime;

  const checks = [
    ['item_legacy', `/api/admin/accounting-item-costing?month=${encodeURIComponent(month)}`],
    ['item_contract', `/api/admin/contracts/accounting-item-costing-read?month=${encodeURIComponent(month)}`],
    ['journal_legacy', `/api/admin/accounting-journal?month=${encodeURIComponent(month)}`],
    ['journal_contract', `/api/admin/contracts/accounting-journal-read?month=${encodeURIComponent(month)}`],
    ['gifi_notes_legacy', `/api/admin/accounting-gifi-notes?year=${encodeURIComponent(year)}`],
    ['gifi_notes_contract', `/api/admin/contracts/accounting-gifi-notes-read?year=${encodeURIComponent(year)}`],
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

  for (const id of ['accounting-item-costing-read', 'accounting-journal-read', 'accounting-gifi-notes-read']) {
    const service = r?.service?.(id);
    const result = service
      ? await service.list(id === 'accounting-gifi-notes-read' ? { year } : { month })
      : null;
    out[`${id}_service_build`] = result?.build ?? null;
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
item_legacy_status                         200
item_legacy_build                          325
item_legacy_owner                          accounting
item_legacy_schema_mutation                false
item_contract_status                       200
item_contract_build                        325
item_contract_owner                        accounting
item_contract_schema_mutation              false
accounting-item-costing-read_service_build 325

journal_legacy_status                      200
journal_legacy_build                       326
journal_legacy_owner                       accounting
journal_legacy_schema_mutation             false
journal_contract_status                    200
journal_contract_build                     326
journal_contract_owner                     accounting
journal_contract_schema_mutation           false
accounting-journal-read_service_build      326

gifi_notes_legacy_status                   200
gifi_notes_legacy_build                    327
gifi_notes_legacy_owner                    accounting
gifi_notes_legacy_schema_mutation          false
gifi_notes_contract_status                 200
gifi_notes_contract_build                  327
gifi_notes_contract_owner                  accounting
gifi_notes_contract_schema_mutation        false
accounting-gifi-notes-read_service_build   327

application_module                         business-administration
application_mode                           domain-bridge
active_application_module                  null
contracts_ok                               true
services_ok                                true
```

Every `*_service_schema_mutation` must be `false`.

Any `schema_ready=false` is schema-parity evidence. Capture the printed `missing_tables` / `missing_columns`; do not repair schema from a GET.

## Safety boundary

Do not click Sync journal, Validate journal, Post balanced journal, save GIFI notes, save expenses, or perform other Accounting mutations during this browser proof.
