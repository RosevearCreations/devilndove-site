# Build 314 Validation — Customer Documents Operations Runtime Coverage

## Status — STAGED / VALIDATION REQUIRED

Baseline:

```text
4ba68bf720561fab590e2dfb74581c0adf871b46
Build 313 set completed Operations runtime handoff
```

Build 313 is COMPLETE IN DEVELOPMENT.

Build 314 expands the proven read-only Operations runtime page set from one page to two:

```text
/admin/operations/
/admin/customer-documents/
```

The Customer Documents business implementation remains unchanged.

## One GIT BASH block

```bash
git pull --ff-only origin dev
python scripts/build314_customer_documents_operations_runtime_test.py
git status --short
```

Expected ending:

```text
BUILD 314 CUSTOMER DOCUMENTS OPERATIONS RUNTIME: PASS
No Cloudflare resource was contacted.
```

`git status --short` should be empty.

## One BROWSER DEVTOOLS CONSOLE block

Open and hard-refresh:

```text
https://devilndove-site-dev.pages.dev/admin/customer-documents/
```

The browser proof must confirm:

- `admin.js?v=314` is served;
- domain is `operations`;
- application module is `commerce-operations` and mode is active;
- Commerce runtime is Build 314;
- active required services remain `catalog-read,inventory-read,accounting-read`;
- current path is listed in the explicit Operations runtime page coverage;
- Operations mutation ownership remains false;
- Accounting remains Build 312, schema-ready and non-mutating;
- the historical Customer Documents business script remains present as `admin-customer-documents.js?v=227`;
- contracts/services remain green.

Expected architectural values:

```text
pathname                         /admin/customer-documents/
admin_script                     .../public/js/admin.js?v=314
customer_documents_script        .../public/js/admin-customer-documents.js?v=227
core_runtime_build               305
commerce_runtime_build           314
domain                           operations
application_module               commerce-operations
application_module_mode          active
active_required_services         catalog-read,inventory-read,accounting-read
operations_runtime_active        true
current_operations_page_proven   true
operations_coverage              /admin/operations/,/admin/customer-documents/
owns_operations_mutations        false
accounting_build                 312
accounting_schema_ready          true
accounting_schema_mutation       false
contracts_ok                     true
services_ok                      true
```

No document issue, void, refund, order, payment or other mutation is required for validation.

## Coverage limitation

Build 314 still does not claim the rest of the Operations route family is migrated. In particular:

```text
/admin/orders/
/admin/gift-cards/
/admin/members/
/admin/membership/
/admin/custom-request/
/admin/today-tasks/
```

remain outside the proven Build 314 runtime page set.

## Completion decision

Do not mark Build 314 complete until:

1. local regression passes;
2. working tree is clean;
3. Development serves `admin.js?v=314` on Customer Documents;
4. Customer Documents resolves to Operations under Commerce & Operations;
5. Commerce runtime is Build 314 and current-page coverage is true;
6. all three Operations read services remain available;
7. Operations mutation ownership remains false;
8. the Customer Documents business script remains unchanged;
9. `/admin/orders/` remains outside the changed-file boundary;
10. no SQL/schema/config/R2/real Production change occurs.
