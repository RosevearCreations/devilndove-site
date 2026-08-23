# Build 281 Validation — Modular Application Foundation

## Purpose

Prove that Build 281 establishes architecture and discovery tooling without changing existing application behavior or Cloudflare data/configuration.

## Local load

After the Build 281 commit exists on `origin/dev`, update the local Development checkout:

```bash
git --no-pager status
git pull --ff-only origin dev
```

The working tree should be clean before the pull.

## Foundation validation

Run:

```bash
python scripts/build281_module_foundation_test.py
```

Expected final lines:

```text
BUILD 281 MODULE FOUNDATION: PASS
No Cloudflare resource was contacted.
```

## Generate the first ownership inventory

Run:

```bash
python scripts/build281_module_inventory.py --write
```

This creates local evidence only:

```text
.wrangler/build281/module-inventory.json
.wrangler/build281/MODULE_INVENTORY.generated.md
```

The generated `LEGACY_REVIEW` entries are the architectural review queue. They are not test failures.

## Git review

Run:

```bash
git --no-pager status
git --no-pager show --stat --oneline HEAD
git --no-pager diff HEAD^..HEAD -- wrangler.toml database_full_schema.sql
```

Expected:

- clean working tree before generating optional `.wrangler` evidence;
- Build 281 files only;
- no diff for `wrangler.toml`;
- no diff for `database_full_schema.sql`.

## Development runtime regression

After local validation, deploy/push only through the established Development path and repeat the existing Development smoke checks:

- `/` -> 200
- `/admin/` -> 200
- `/api/catalog-items` -> 200
- `/api/creations` -> 200
- `/api/before-after-gallery` -> 200
- `/api/auth/login?diagnostic=full` -> `AUTH_READY`
- actual Development admin login -> 200
- authenticated read-only Admin API -> 200

Because Build 281 does not wire the module registry into existing pages, these should behave exactly as the Build 280 Development baseline.

## Database rule

There is **no Build 281 D1 migration**. Do not run a Production or Development schema migration for this build.

## Acceptance

Build 281 is accepted when:

1. local foundation test passes;
2. local ownership inventory completes;
3. Build 281 commit shows no Cloudflare binding or schema change;
4. Development runtime regression remains green;
5. Production Build 280 remains untouched.

Only then should Build 282 begin extracting the first visible module/runtime boundary.
