# Development Cloudflare / D1 / R2 Connection Authority

Status: **canonical current startup authority** for Devil n Dove Development work.

This document exists specifically so a new chat, AI, developer or workstation does **not** rediscover the Cloudflare connection model or replay old migrations.

## Exact Development targets

| Resource | Authority |
| --- | --- |
| Git branch | `dev` |
| Cloudflare Pages project | `devilndove-site-dev` |
| Cloudflare account ID | `c0d5bc25df16ae5b7d47c985c4b7b787` |
| D1 binding | `DB` |
| D1 database | `devilndove-dev` |
| D1 database ID | `dbc1615b-dcbe-4951-973b-b47c99c73bfa` |
| Product/media R2 binding | `PRODUCT_MEDIA_BUCKET` |
| Product/media R2 bucket | `devilndove-toolshed-images-dev` |
| CAIP private-media R2 binding | `CAIP_PRIVATE_MEDIA_BUCKET` |
| CAIP private-media R2 bucket | `devilndove-caip-media-dev` |
| GitHub Actions Cloudflare credential | repository secret named `CLOUDFLARE_API_TOKEN` |

These are **Development** resources. Production resources are intentionally not part of the Development mutation workflows.

## The important `account_id` rule

`wrangler.toml` must **not** contain `account_id`.

Cloudflare Pages Git deployment owns its Pages account context. Local scripts and guarded GitHub Actions select the Development Cloudflare account by setting:

`CLOUDFLARE_ACCOUNT_ID=c0d5bc25df16ae5b7d47c985c4b7b787`

The repository gate treats adding `account_id` back to `wrangler.toml` as an error.

## Authentication precedence

For local Wrangler work, an environment `CLOUDFLARE_API_TOKEN` can take precedence over an OAuth login. That is why an apparently successful `wrangler login` can still produce authorization errors when a stale or wrong environment token exists.

The canonical helper is:

```text
python scripts/cloudflare_development_access.py --auth-only
```

The helper:

1. pins the Development account ID for its Wrangler child processes;
2. verifies the exact D1 name **and ID**;
3. verifies both Development R2 buckets;
4. never prints credentials;
5. has no Production mutation target.

When OAuth needs to be tested deliberately instead of an inherited environment token:

```text
python scripts/cloudflare_development_access.py --auth-only --auth-mode oauth
```

## New-chat startup sequence

A new chat must follow this order:

1. Read `development-release.json`.
2. Read this document.
3. Read `wrangler.toml` and `scripts/cloudflare_development_access.py`.
4. Confirm the Git branch is `dev` and note the current `dev` SHA.
5. Confirm `main`/live Production is not the target.
6. Use **read-only** Development Cloudflare/D1/R2 identity checks first.
7. Read the current-release migration/verification state before deciding whether D1 needs any write.
8. Run source/local gates before authorizing a new migration.
9. If a current release truly needs D1 mutation, verify the exact `devilndove-dev` identity immediately before the write.
10. Apply **only the current additive migration**.
11. Run a separate **read-only remote verifier** afterward.
12. Record the successful migration/verification state in `development-release.json` and the active handoff docs.

## Do not replay historical migrations on startup

The following rule is mandatory:

> A new chat is not a migration event.

Do **not** reapply Release 447, 448 or 449 merely because the conversation changed or because D1 connectivity had to be re-established.

Historical migration state is authority/provenance. A historical migration may be revisited only when read-only inspection proves actual schema drift that requires deliberate repair.

At the Release 450 starting point:

- Release 447 Development platform baseline: applied and verified.
- Release 448 platform expansion authorities: retained as regression authority.
- Release 449 corporate/commerce migration: applied to exact Development D1 and independently verified by read-only workflow run `33235075008`.
- Release 450 marketplace/SEO migration: current migration; its status must come from `development-release.json`, not assumptions.

## Safe Development migration pattern

Every new D1-changing release should use two separate authorities:

### 1. Guarded mutation workflow

It must:

- run only from `dev`;
- pin the Development account through environment/tooling, never `wrangler.toml account_id`;
- require `CLOUDFLARE_API_TOKEN` without printing it;
- use `wrangler d1 info` to prove both the exact D1 name and ID;
- run source/local migration gates first;
- apply one explicitly named current migration;
- expose no Production database/project identifier or command.

### 2. Verification-only workflow

It should be unable to apply a migration. It should read the exact Development D1 and prove the expected tables/configuration/integrity/state after mutation.

Release 449 demonstrated why this split matters: a verification-collector issue should never imply that the migration should be blindly replayed.

## Troubleshooting authorization

If D1/R2 access fails:

- Do **not** change the database ID to make Wrangler accept a different resource.
- Do **not** add `account_id` to `wrangler.toml`.
- Check whether `CLOUDFLARE_API_TOKEN` is present and belongs to the Development account.
- Remember that environment API credentials may override OAuth.
- Run the canonical read-only access preflight.
- If deliberately testing OAuth, use the helper's `--auth-mode oauth` option so inherited API credentials are suppressed for that process.
- A connection failure is not evidence that D1 needs migration.

## Safety boundary

Development work may mutate the exact Development D1 only through a deliberate guarded current-release workflow.

It must not mutate:

- `main`;
- the live `devilndove-site` Pages application;
- Production D1/R2 resources;
- external marketplace/payment providers unless a later explicitly authorized acceptance step enables that specific operation.

## Related authorities

- `development-release.json` — current machine-readable release state.
- `wrangler.toml` — Development Pages/D1/R2 bindings; no `account_id`.
- `scripts/cloudflare_development_access.py` — canonical read-only identity/access preflight.
- `.github/workflows/system-gate.yml` — canonical source/regression safety gate.
- Release-specific D1 workflow — only when the current release actually has an additive migration ready to apply.
