# Build 312 Validation — Accounting Read Contract

## Status — STAGED / VALIDATION REQUIRED

Baseline:

```text
78546a6b9304ce38d0a42b130445a7504a15823f
Build 311 set completed inventory-cost handoff
```

Build 311 is COMPLETE IN DEVELOPMENT.

Build 312 implements only the bounded Accounting-owned `accounting-read` prerequisite. Operations remains inactive.

## One GIT BASH block

```bash
git pull --ff-only origin dev
python scripts/build312_accounting_read_contract_test.py
git status --short
```

Expected ending:

```text
BUILD 312 ACCOUNTING READ CONTRACT: PASS
No Cloudflare resource was contacted.
```

`git status --short` should be empty.

## One BROWSER DEVTOOLS CONSOLE block

Open and hard-refresh:

```text
https://devilndove-site-dev.pages.dev/admin/inventory-operations/
```

The browser proof should confirm:

- `admin.js?v=312` is served;
- Core implementation remains Build 305;
- Commerce runtime is Build 312;
- Inventory remains the active runtime domain;
- future Operations prerequisites are `catalog-read,inventory-read,accounting-read`;
- `accounting-read` is registered as a passive Accounting-owned read service;
- one authenticated Accounting read returns Build 312 metadata;
- the route reports whether `accounting_order_records` is schema-ready without repairing it;
- Operations still has no active application runtime;
- contract/service validation remains green.

Expected architectural state:

```text
pathname                         /admin/inventory-operations/
admin_script                     .../public/js/admin.js?v=312
core_runtime_build               305
commerce_runtime_build           312
domain                           inventory
application_module               commerce-operations
application_module_mode          active
active_required_services         inventory-read
operations_required_services     catalog-read,inventory-read,accounting-read
accounting_service_owner         accounting
accounting_service_mode          read-only-http
accounting_contract              accounting-read
accounting_build                 312
accounting_authority_table       accounting_order_records
accounting_schema_mutation       false
operations_application_module    commerce-operations
operations_runtime               <none>
contracts_ok                     true
services_ok                      true
```

`accounting_schema_ready` may be `true` or `false` in Build 312.

- `true` means Development already has a compatible `accounting_order_records` authority.
- `false` is a valid Build 312 contract result and must include `accounting_missing_tables` and/or `accounting_missing_columns`. It is then a schema-parity blocker for later Operations activation, not a reason for this read-contract implementation to create schema.

`accounting_rows` may be zero or greater.

No POST, journal write, Accounting schema creation, stock mutation, Operations workflow mutation, SQL migration, or Production action is required.

## Completion decision

Do not mark Build 312 complete until:

1. local regression passes;
2. working tree is clean;
3. Development serves the Build 312 runtime graph;
4. passive `accounting-read` service registration succeeds;
5. authenticated Accounting GET returns Build 312 metadata;
6. schema readiness is reported explicitly without request-time DDL;
7. Operations prerequisite list includes all three read contracts;
8. Operations still has no active runtime;
9. Build 311 Inventory cost and Build 310/308 write consumers remain unchanged;
10. no SQL/schema/config/R2/real Production change occurs.
