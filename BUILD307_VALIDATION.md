# Build 307 Validation — Inventory Compensating Reversal Service

## Status — STAGED / VALIDATION REQUIRED

Baseline:

```text
c8ea00e57cb906cc671fc15727ed2c8cd8b63dab
Build 306 harden Build 305 historical proof markers
```

Build 306 is browser-proven but still lacks final local-regression signoff from the user. Build 307 does not mislabel it as complete.

Build 307 implements the Inventory-owned `inventory-reverse` route but keeps Creative consumer migration disabled.

## Validation — one Bash block

```bash
git pull --ff-only origin dev

python scripts/build307_inventory_compensating_reversal_service_test.py

git status --short

BASE="https://devilndove-site-dev.pages.dev"
STAMP="$(date +%s)"

echo "SERVED INVENTORY LOADER:"
curl -sS -H "Cache-Control: no-cache" \
  "$BASE/admin/inventory-operations/?b307=$STAMP" \
  | grep -oE 'admin\.js\?v=[0-9]+' | head -n 1

echo "SERVED CORE IMPORT:"
curl -sS -H "Cache-Control: no-cache" \
  "$BASE/public/js/admin.js?v=307&b307=$STAMP" \
  | grep 'dd-admin-module-runtime.mjs?v=307'
```

Expected regression ending:

```text
BUILD 307 INVENTORY COMPENSATING REVERSAL SERVICE: PASS
No Cloudflare resource was contacted.
```

`git status --short` should be empty.

Expected served assets:

```text
admin.js?v=307
...dd-admin-module-runtime.mjs?v=307...
```

If served assets are stale, stop there and use the already-proven Development-only direct-upload recovery before browser validation. Do not touch real Production.

## Validation — one browser block

Open and hard-refresh:

```text
https://devilndove-site-dev.pages.dev/admin/inventory-operations/
```

Run one async IIFE in Firefox DevTools. It reads runtime state and performs only the safe authenticated GET readiness call to `/api/admin/contracts/inventory-reverse`.

Expected steady state:

```text
pathname                       /admin/inventory-operations/
admin_script                   .../public/js/admin.js?v=307
core_runtime_build             305
commerce_runtime_build         307
write_contract_build           307
domain                         inventory
application_module             commerce-operations
application_module_mode        active
required_service               inventory-read
owns_inventory_mutations       false
consumer_mutation_ready        false
reverse_state                  implemented-not-consumer-enabled
reverse_route                  /api/admin/contracts/inventory-reverse
reverse_requires_original      true
reverse_requires_creative_post true
direct_stock_addback           false
api_ok                         true
api_build                      307
api_state                      implemented-not-consumer-enabled
api_consumer_ready             false
api_schema_ready               true
api_missing_tables             <empty>
contracts_ok                   true
services_ok                    true
```

No POST reversal is required in Build 307. Creative Process still uses its compatibility path, so a live mutation would not prove consumer cutover and would unnecessarily alter Development data.

## Completion decision

Do not mark Build 307 complete until:

1. local Build 307 regression passes;
2. working tree is clean;
3. Development serves the Build 307 loader;
4. Inventory remains active under Commerce & Operations;
5. safe GET reports the Inventory-owned reversal route as implemented;
6. required reversal schema is present;
7. consumer migration remains disabled;
8. no SQL/config/R2/real Production change occurs.
