# Build 324 Validation — Accounting Profit/Loss Read Extraction

## Status — VALIDATED 2026-08-24

Baseline: `b23a98a557721319afe73f5707563aa9703901f4`.

Build 324 extracted the automatic `/api/admin/accounting-profit-loss` GET into an Accounting-owned, non-mutating read service and dedicated GET-only contract while preserving the legacy URL for the current Accounting UI.

## Local regression — PASSED

Observed:

```text
From https://github.com/RosevearCreations/devilndove-site
 * branch              dev        -> FETCH_HEAD
Already up to date.
BUILD 324 ACCOUNTING PROFIT/LOSS READ EXTRACTION: PASS
No Cloudflare resource was contacted.
```

The pasted command block included `git status --short`; no status output followed the regression result, consistent with a clean local tree.

## Development browser proof — PASSED

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

The async Firefox console first displayed `Promise { <state>: "pending" }`; this is normal. The completed table is the proof.

## Schema-parity evidence — CAPTURED

Development returned:

```text
MISSING TABLES: []
MISSING COLUMNS: ["orders.total_amount|total"]
```

Interpretation:

- the required P&L source tables are present;
- Development's `orders` table currently exposes neither logical revenue column alternative expected by this read (`total_amount` or `total`);
- this is a fresh-install/schema-parity finding, not an excuse to restore request-time DDL;
- Build 324 correctly reports the mismatch with `request_time_schema_mutation=false`.

The schema-parity track must determine the canonical current Orders amount field and align the fresh-install schema/read mapping deliberately.

## Safety conclusion

Build 324 is VALIDATED. It does not activate Business & Administration and does not move any Accounting mutation authority.
