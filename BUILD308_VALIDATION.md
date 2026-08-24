# Build 308 Validation — Creative Reversal Consumer Cutover

## Status — STAGED / VALIDATION REQUIRED

Baseline:

```text
075b905c5fa7960fb7abde410571d840f1983c91
Build 307 set completed reversal-service handoff
```

Build 308 migrates only Creative reversal consumption to the proven Inventory-owned Build 307 service.

## One Git Bash block

```bash
git pull --ff-only origin dev
python scripts/build308_creative_reversal_consumer_cutover_test.py
git status --short
```

Expected ending:

```text
BUILD 308 CREATIVE REVERSAL CONSUMER CUTOVER: PASS
No Cloudflare resource was contacted.
```

`git status --short` should be empty.

## One browser block

Open and hard-refresh:

```text
https://devilndove-site-dev.pages.dev/admin/creative-process/
```

Run one async IIFE. It performs only safe authenticated GET requests to:

```text
/api/admin/creative-process
/api/admin/contracts/inventory-reverse
```

Expected values:

```text
creative_ok                       true
creative_engine_build             274
reversal_consumer_build           308
reversal_authority                inventory-reverse
inventory_authority_ok            true
inventory_authority_build         307
inventory_authority_schema_ready  true
inventory_authority_missing       <empty>
```

The Build 307 authority GET can still describe its own frozen implementation state as `implemented-not-consumer-enabled`; Build 308 consumer activation is proven by the Creative API identity and the Build 308 source/contract regression. The Build 307 mutation implementation itself is intentionally unchanged.

No reversal POST is required for Build 308 validation.

## Completion decision

Mark Build 308 complete only after:

1. Build 308 regression passes;
2. working tree is clean;
3. Development Creative GET reports reversal consumer Build 308 and Inventory authority;
4. Build 307 Inventory readiness GET remains healthy and schema-ready;
5. no live reversal is needed for proof;
6. no extra file crosses the exact boundary;
7. no SQL/config/R2/real Production change occurs.
