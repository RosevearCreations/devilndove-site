# Build 324 Validation — Accounting Profit/Loss Read Extraction

## Status — BROWSER PROVEN / LOCAL + SCHEMA DETAIL REQUIRED

Baseline: `b23a98a557721319afe73f5707563aa9703901f4`.

Build 324 extracts the automatic `/api/admin/accounting-profit-loss` GET into an Accounting-owned, non-mutating read service and dedicated GET-only contract while preserving the legacy URL for the current Accounting UI.

## Local regression

Still required:

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

## Development browser proof — PASSED 2026-08-24

Observed on `/admin/accounting/` after administrator verification:

```text
pathname                    /admin/accounting/
legacy_status               200
legacy_build                324
legacy_owner                accounting
legacy_schema_ready         false
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

The async Firefox console first displayed `Promise { <state>: "pending" }`; this is normal. The completed `console.table()` output above is the validation result.

### Browser conclusion

The Build 324 architecture boundary passed:

- legacy compatibility GET returns 200;
- legacy GET identifies Build 324 and owner `accounting`;
- legacy GET reports `request_time_schema_mutation=false`;
- dedicated contract returns 200 and identifies Build 324 / owner `accounting`;
- passive Accounting service reports Build 324 and no schema mutation;
- Accounting remains `business-administration` domain-bridge only;
- no top-level Business & Administration runtime is active;
- contract and service registries remain healthy.

`legacy_schema_ready=false` is a separate schema-parity finding, not a reason to restore request-time DDL and not by itself a Build 324 architecture failure.

## Required schema-parity evidence

Capture the exact missing schema from Development before marking the build fully validated:

```js
(async () => {
  const month = new Date().toISOString().slice(0, 7);
  const response = await window.DDAuth.apiFetch(`/api/admin/accounting-profit-loss?month=${encodeURIComponent(month)}`);
  const data = await response.json().catch(() => null);
  console.log({
    status: response.status,
    build: data?.build ?? null,
    owner: data?.owner ?? null,
    schema_ready: data?.schema_ready ?? null,
    missing_tables: data?.missing_tables ?? [],
    missing_columns: data?.missing_columns ?? [],
    request_time_schema_mutation: data?.request_time_schema_mutation ?? null,
  });
})();
```

Route any returned `missing_tables` / `missing_columns` to the separate fresh-install schema-parity track. Do not repair schema from this GET.

## Safety boundary

Do not post journals, save expenses, upload files, import statements, or mutate Accounting records during validation.

Build 324 does not activate Business & Administration and does not move any Accounting mutation authority.

Build 324 becomes VALIDATED when the local regression passes and the missing-schema evidence above is captured/documented.