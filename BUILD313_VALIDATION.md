# Build 313 Validation — Operations Read-Only Runtime

## Status — STAGED / VALIDATION REQUIRED

Baseline:

```text
3b5709c842ed7bce8335ddd57fe11420ae207367
Build 312 complete handoff and set Operations activation next
```

Build 312 is COMPLETE IN DEVELOPMENT.

Build 313 activates only the first explicitly pinned Operations runtime page:

```text
/admin/operations/
```

Operations business mutations remain outside the runtime shell.

## One GIT BASH block

```bash
git pull --ff-only origin dev
python scripts/build313_operations_read_only_runtime_test.py
git status --short
```

Expected ending:

```text
BUILD 313 OPERATIONS READ-ONLY RUNTIME: PASS
No Cloudflare resource was contacted.
```

`git status --short` should be empty.

## One BROWSER DEVTOOLS CONSOLE block

Open and hard-refresh:

```text
https://devilndove-site-dev.pages.dev/admin/operations/
```

The browser proof must confirm:

- `admin.js?v=313` is served;
- domain is `operations`;
- application module is `commerce-operations`;
- application-module mode is active;
- Commerce runtime is Build 313;
- active required services are `catalog-read,inventory-read,accounting-read`;
- all three services are registered in read-only HTTP mode;
- explicit reads through all three services succeed;
- Accounting remains Build 312 and schema-ready;
- Operations mutation ownership remains false;
- contracts/services remain green.

Expected architectural state:

```text
pathname                        /admin/operations/
admin_script                    .../public/js/admin.js?v=313
core_runtime_build              305
commerce_runtime_build          313
domain                          operations
application_module              commerce-operations
application_module_mode         active
active_required_services        catalog-read,inventory-read,accounting-read
operations_runtime_active       true
owns_operations_mutations       false
catalog_service_owner           catalog
catalog_service_mode            read-only-http
inventory_service_owner         inventory
inventory_service_mode          read-only-http
accounting_service_owner        accounting
accounting_service_mode         read-only-http
accounting_build                312
accounting_schema_ready         true
contracts_ok                    true
services_ok                     true
```

Returned Catalog, Inventory and Accounting row counts may be zero or greater.

No POST, order mutation, payment mutation, customer mutation, gift-card mutation, membership mutation, SQL migration or Production action is required.

## Coverage limitation

Build 313 does not claim the full Operations route family is migrated.

`/admin/orders/` is intentionally unchanged and currently lacks the shared runtime loader. `/admin/customer-documents/` retains a historical loader pin but is not re-pinned or validated in Build 313.

The only Build 313 runtime page requiring browser proof is:

```text
/admin/operations/
```

## Completion decision

Do not mark Build 313 complete until:

1. local regression passes;
2. working tree is clean;
3. Development serves `admin.js?v=313` on `/admin/operations/`;
4. Operations activates under `commerce-operations`;
5. all three required read services are active and callable;
6. Accounting remains schema-ready at Build 312;
7. Operations mutation ownership is false;
8. `/admin/orders/` remains outside the changed-file boundary;
9. no SQL/schema/config/R2/real Production change occurs.
