# Build 309 Validation — Inventory Post Authority

## Status — STAGED / VALIDATION REQUIRED

Baseline:

```text
6d9a236ae688fe3d4b8e6975b866c637efe51c9b
Build 308 update modular reversal-consumer handoff
```

Build 308 is browser-proven but still awaits local regression signoff. Build 309 does not relabel it as complete.

Build 309 introduces a dedicated Inventory-owned `inventory-post` service and route without migrating Creative posting consumption.

## One Bash block

```bash
git pull --ff-only origin dev
python scripts/build309_inventory_post_authority_test.py
git status --short
```

Expected ending:

```text
BUILD 309 INVENTORY POST AUTHORITY: PASS
No Cloudflare resource was contacted.
```

`git status --short` should be empty.

## One browser block

Open and hard-refresh:

```text
https://devilndove-site-dev.pages.dev/admin/inventory-operations/
```

Use one browser IIFE to read the Commerce/write-boundary state and the safe authenticated GET readiness response from:

```text
/api/admin/contracts/inventory-post
```

Expected state:

```text
pathname                     /admin/inventory-operations/
admin_script                 .../public/js/admin.js?v=309
core_runtime_build           305
commerce_runtime_build       309
write_contract_build         309
domain                       inventory
application_module           commerce-operations
application_module_mode      active
required_service             inventory-read
owns_inventory_mutations     false
post_state                   implemented-not-consumer-enabled
post_route                   /api/admin/contracts/inventory-post
post_consumer_ready          false
post_atomic_review           true
reverse_state                implemented-creative-consumer-enabled
reverse_consumer_ready       true
api_ok                       true
api_build                    309
api_state                    implemented-not-consumer-enabled
api_consumer_ready           false
api_schema_ready             true
api_missing_tables           <empty>
contracts_ok                 true
services_ok                  true
```

No POST is required in Build 309. The service is implemented first; Creative post consumer migration is a separate later build.

## Completion decision

Do not mark Build 309 complete until:

1. local regression passes;
2. working tree is clean;
3. Development serves `admin.js?v=309`;
4. Inventory remains active under Commerce & Operations;
5. safe GET reports the Inventory-owned post route as implemented;
6. required schema is present;
7. post consumer migration remains disabled;
8. the Build 308 reversal cutover remains enabled;
9. no SQL/config/R2/real Production change occurs.
