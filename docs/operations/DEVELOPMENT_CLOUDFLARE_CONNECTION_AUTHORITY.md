# Development Cloudflare / D1 / R2 Connection Authority

Status: **canonical current startup authority** for Devil n Dove Development work.

This document exists so a new chat, AI, developer or workstation does **not** rediscover the Cloudflare connection model or replay old migrations.

## Exact Development targets

| Resource | Authority |
| --- | --- |
| Git branch | `dev` |
| Cloudflare Pages project | `devilndove-site-dev` |
| Cloudflare account ID | `c0d5bc25df16ae5b7d47c985c4b7b787` |
| D1 binding | `DB` |
| D1 database | `devilndove-dev` |
| D1 database ID | `dbc1615b-dcbe-4951-973b-b47c99c73bfa` |
| D1 schema currently verified through | **Release 450** |
| Current Development release | **Release 452 — no new D1 migration required** |
| Product/media R2 binding | `PRODUCT_MEDIA_BUCKET` |
| Product/media R2 bucket | `devilndove-toolshed-images-dev` |
| CAIP private-media R2 binding | `CAIP_PRIVATE_MEDIA_BUCKET` |
| CAIP private-media R2 bucket | `devilndove-caip-media-dev` |
| GitHub Actions Cloudflare credential | repository secret named `CLOUDFLARE_API_TOKEN` |

The D1 schema remains current through Release 450. Releases 451 and 452 are source-only extensions over already verified authorities and add no D1 migration.

These are **Development** resources. Production resources are intentionally absent from Development mutation workflows.

## The important `account_id` rule

`wrangler.toml` must **not** contain `account_id`.

Cloudflare Pages Git deployment owns its Pages account context. Local scripts and guarded GitHub Actions select the Development account by setting:

`CLOUDFLARE_ACCOUNT_ID=c0d5bc25df16ae5b7d47c985c4b7b787`

The repository gate treats adding `account_id` back to `wrangler.toml` as an error.

## Authentication precedence

For local Wrangler work, an environment `CLOUDFLARE_API_TOKEN` can take precedence over an OAuth login. An apparently successful `wrangler login` can therefore still produce authorization errors when a stale or wrong environment token exists.

Canonical read-only helper:

```text
python scripts/cloudflare_development_access.py --auth-only
```

The helper:

1. pins the Development account ID for its Wrangler child processes;
2. verifies the exact D1 name **and ID**;
3. verifies both Development R2 buckets;
4. never prints credentials;
5. has no Production mutation target.

To deliberately test OAuth instead of inherited API credentials:

```text
python scripts/cloudflare_development_access.py --auth-only --auth-mode oauth
```

## New-chat startup sequence

A new chat must follow this order:

1. Read `development-release.json`.
2. Read this document.
3. Read `wrangler.toml` and `scripts/cloudflare_development_access.py`.
4. Confirm the Git branch is `dev` and record the current `dev` SHA.
5. Confirm `main` / live Production is not the target.
6. Use **read-only** Development Cloudflare/D1/R2 identity checks first.
7. Read the current-release migration/verification state before deciding whether D1 needs a write.
8. Run source/local gates before authorizing a genuinely new migration.
9. If a future release truly needs D1 mutation, verify the exact `devilndove-dev` identity immediately before the write.
10. Apply **only that new current additive migration**.
11. Run a separate **read-only remote verifier** afterward.
12. Record successful migration/verification state in `development-release.json` and active handoff documents.

## Do not replay historical migrations on startup

> **A new chat is not a migration event.**

Do **not** reapply Releases 447, 448, 449 or 450 merely because the conversation/workstation changed or D1 connectivity had to be re-established. Releases 451 and 452 have **no migration to apply**.

Historical migration state is authority/provenance. Revisit a historical migration only when read-only inspection proves actual schema drift requiring deliberate repair.

Current proven Development history:

- Release 447 Development platform baseline: applied and verified.
- Release 448 platform expansion authorities: retained as regression authority.
- Release 449 corporate/commerce migration: applied to exact Development D1 and independently verified by read-only workflow run `33235075008`.
- Release 450 marketplace/SEO migration: applied to exact Development D1 by guarded workflow run `33235769850` and independently verified read-only by workflow run `33235803838`.
- Release 451 marketplace calibration/SEO assurance: source-only; no new D1 schema migration.
- Release 452 application streamlining/UX/SEO depth: source-only; no new D1 schema migration.

Therefore, during Release 452 the default startup action is **verification/read of current state**, not SQL execution.

## Safe Development migration pattern

Every future D1-changing release must use two separate authorities.

### 1. Guarded mutation workflow

It must:

- run only from `dev`;
- pin the Development account through environment/tooling, never `wrangler.toml account_id`;
- require `CLOUDFLARE_API_TOKEN` without printing it;
- use `wrangler d1 info` to prove both the exact D1 name and ID;
- run source/local migration gates first;
- include a blind-replay guard for the new release;
- capture preservation evidence for existing authoritative areas where relevant;
- apply one explicitly named current migration;
- expose no Production database/project identifier or command.

### 2. Verification-only workflow

It must be unable to apply a migration. It should read the exact Development D1 and prove expected schema/state after mutation.

Release 449 demonstrated why mutation and verification must be separated. Release 450 added the preferred replay-guard/preservation-baseline/independent-verifier pattern. Releases 451 and 452 demonstrate the other important case: **if existing verified schema already supports the feature, do not create a migration merely to advance the release number.**

## Troubleshooting authorization

If D1/R2 access fails:

- Do **not** change the database ID to make Wrangler accept another resource.
- Do **not** add `account_id` to `wrangler.toml`.
- Check whether `CLOUDFLARE_API_TOKEN` belongs to the Development account.
- Remember environment API credentials may override OAuth.
- Run the canonical read-only access preflight.
- If deliberately testing OAuth, use `--auth-mode oauth` so inherited API credentials are suppressed for that process.
- A connection failure is **not** evidence that D1 needs migration.

## Safety boundary

Development work may mutate the exact Development D1 only through a deliberate guarded **new current-release** workflow when a real additive schema authority is required.

It must not mutate:

- `main`;
- the live `devilndove-site` Pages application;
- Production D1/R2 resources;
- external marketplace/payment providers unless a later explicitly authorized acceptance step enables that specific operation.

## Related authorities

- `development-release.json` — current machine-readable release/migration state.
- `AI_HANDOFF.md` — compact current handoff.
- `PROJECT_STATUS_AND_ROADMAP.md` — current work/next sequence.
- `wrangler.toml` — Development Pages/D1/R2 bindings; no `account_id`.
- `scripts/cloudflare_development_access.py` — canonical read-only identity/access preflight.
- `scripts/repository_hygiene_gate.py` — current-tree cleanup/SEO/usability guard.
- `scripts/release452_application_streamlining_gate.py` — focused Release 452 source authority.
- `.github/workflows/system-gate.yml` — canonical source/regression/SEO safety gate.
- `docs/operations/RELEASE_451_D1_STATE.md` — Release 451 no-new-migration statement.
- `docs/operations/RELEASE_452_APPLICATION_STREAMLINING.md` — Release 452 source-only convergence authority.
- Release-specific D1 workflow — only when a genuinely new additive migration is ready.
