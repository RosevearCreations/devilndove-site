# Build 310 Validation — Creative Inventory Post Consumer Cutover

## Status — STAGED / VALIDATION REQUIRED

Baseline:

```text
ab8089b76d881617bc3ca4768abdb4674afcf3a0
Build 309 set completed post-authority handoff
```

Build 309 is COMPLETE IN DEVELOPMENT.

## One Bash block

```bash
git pull --ff-only origin dev
python scripts/build310_creative_inventory_post_consumer_cutover_test.py
git status --short
```

Expected ending:

```text
BUILD 310 CREATIVE INVENTORY POST CONSUMER CUTOVER: PASS
No Cloudflare resource was contacted.
```

`git status --short` should be empty.

## One browser block

Open and hard-refresh:

```text
https://devilndove-site-dev.pages.dev/admin/creative-process/
```

The browser proof should perform only:

- GET `/api/admin/creative-process`;
- GET `/api/admin/contracts/inventory-post`;
- one intentionally invalid POST to `/api/admin/creative-process` with only `{action:'post_material_inventory'}`.

The invalid POST contains no project, event, Inventory item, or quantity, so it must fail before any mutation.

Expected state:

```text
pathname                        /admin/creative-process/
creative_ok                     true
creative_engine_build           274
post_consumer_build             310
post_authority                  inventory-post
reversal_consumer_build         308
reversal_authority              inventory-reverse
inventory_post_ok               true
inventory_post_build            309
inventory_post_schema_ready     true
inventory_post_missing          <empty>
invalid_post_ok                 false
invalid_post_consumer_build     310
invalid_post_authority          inventory-post
invalid_post_error              Project, approved material, inventory item and a usage amount greater than zero are required.
```

No valid POST and no stock mutation is required for Build 310 validation.

## Completion decision

Do not mark Build 310 complete until:

1. local regression passes;
2. working tree is clean;
3. Development GET reports Creative post consumer Build 310 / `inventory-post`;
4. Build 309 Inventory post authority reports schema ready;
5. safe invalid POST is handled by the Build 310 wrapper and returns Build 310 metadata;
6. Build 308 reversal consumer metadata remains present;
7. no SQL/schema/config/R2/real Production change occurs.
