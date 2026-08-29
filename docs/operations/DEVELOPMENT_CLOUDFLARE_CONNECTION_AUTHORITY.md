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
| D1 schema currently verified through | **Release 453** |
| Current Development release | **Release 453 — applied and independently verified** |
| Product/media R2 binding | `PRODUCT_MEDIA_BUCKET` |
| Product/media R2 bucket | `devilndove-toolshed-images-dev` |
| CAIP private-media R2 binding | `CAIP_PRIVATE_MEDIA_BUCKET` |
| CAIP private-media R2 bucket | `devilndove-caip-media-dev` |
| GitHub Actions Cloudflare credential | repository secret named `CLOUDFLARE_API_TOKEN` |

Release 453 is already active on exact Development D1. Its migration is **not** an outstanding startup action.

- migration: `migrations/dev/20260829_release453_it_provider_readiness.sql`
- guarded mutation run: `33258377328` — SUCCESS
- independent read-only verification run: `33258415391` — SUCCESS

These are Development resources. Production resources are intentionally absent from Development mutation workflows.

## The important `account_id` rule

`wrangler.toml` must **not** contain `account_id`.

Cloudflare Pages Git deployment owns its Pages account context. Local scripts and guarded GitHub Actions select the Development account by setting `CLOUDFLARE_ACCOUNT_ID=c0d5bc25df16ae5b7d47c985c4b7b787`.

## Canonical read-only connection check

```text
python scripts/cloudflare_development_access.py --auth-only
```

The helper pins the Development account for its Wrangler child processes, verifies the exact D1 name/ID and both R2 buckets, prints no credentials, and exposes no Production mutation target.

When deliberately testing OAuth rather than an inherited API token:

```text
python scripts/cloudflare_development_access.py --auth-only --auth-mode oauth
```

## New-chat startup sequence

1. Read `development-release.json`.
2. Read this document.
3. Read `wrangler.toml` and `scripts/cloudflare_development_access.py`.
4. Confirm the Git branch is `dev` and record the current `dev` SHA.
5. Confirm `main` / live Production is not the target.
6. Run read-only Development Cloudflare/D1/R2 identity checks first.
7. Read the current release migration/verification state before considering any write.
8. Treat Release 453 as already applied and verified; **do not replay it**.
9. Run source/local gates before authorizing any genuinely new future migration.
10. Immediately before any future write, verify exact `devilndove-dev` name and UUID.
11. Apply only that new additive release migration.
12. Run a separate read-only remote verifier afterward.
13. Record the successful state in `development-release.json` and current handoff documents.

## Do not replay historical migrations on startup

> **A new chat is not a migration event.**

Do **not** reapply Releases 447, 448, 449, 450 or 453 merely because a conversation, workstation, token or checkout changed. Releases 451 and 452 had no migration.

Current proven Development history:

- Release 447 platform baseline: applied and verified.
- Release 448 platform expansion: retained as regression authority.
- Release 449 corporate/commerce migration: applied and independently verified (`33235075008`).
- Release 450 marketplace/SEO migration: guarded apply `33235769850`; independent verifier `33235803838`.
- Release 451 marketplace calibration/SEO assurance: source-only; no migration.
- Release 452 application streamlining/UX/SEO depth: source-only; no migration.
- Release 453 I.T. provider readiness: guarded apply `33258377328`; independent read-only verifier `33258415391`.

Therefore the default startup action during/after Release 453 is **read/verify current state**, not SQL execution.

## Release 453 D1 authority

Release 453 extends Release 449 `provider_setup_authorities` with:

- `it_provider_readiness_checks`
- `it_provider_readiness_events`

Independent remote verification proved 2/2 tables, 32 Development checks across seven providers, all 32 initially deferred, zero fabricated events, zero foreign-key violations, zero unknown provider references and zero secret-bearing columns.

This D1 metadata tracks safe configuration references, states, correction mechanics and evidence. API keys, client secrets, access/refresh tokens, webhook signing secrets, passwords and private keys remain outside D1.

## Safe future Development migration pattern

Every future D1-changing release must have two separate authorities.

### Guarded mutation workflow

It must:

- run only from `dev`;
- pin Development account through environment/tooling, never `wrangler.toml account_id`;
- require `CLOUDFLARE_API_TOKEN` without printing it;
- prove exact D1 name and UUID;
- run source/local gates first;
- refuse blind or partial replay;
- capture preservation evidence where relevant;
- apply exactly one explicitly named new additive Development migration;
- expose no Production mutation target.

### Independent verification-only workflow

It must be incapable of applying the migration and must read the exact Development D1 to prove the expected post-mutation state.

Release 453 is now an example of this complete pattern and must not be re-run merely to prove access.

## Troubleshooting authorization

If D1/R2 access fails:

- do not change the database ID to accept another resource;
- do not add `account_id` to `wrangler.toml`;
- check whether `CLOUDFLARE_API_TOKEN` belongs to the Development account;
- remember environment API credentials can override OAuth;
- run the canonical read-only access preflight;
- if deliberately testing OAuth, use `--auth-mode oauth`;
- a connection failure is not evidence that a migration must be replayed.

## Safety boundary

Development may mutate exact Development D1 only through a deliberate guarded **new additive current-release** workflow. It must not mutate `main`, live `devilndove-site`, Production D1/R2 resources, or external marketplace/payment providers unless a later acceptance step explicitly authorizes that specific operation.

## Related authorities

- `development-release.json`
- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
- `docs/operations/RELEASE_453_IT_PROVIDER_READINESS.md`
- `wrangler.toml`
- `scripts/cloudflare_development_access.py`
- `scripts/release453_it_provider_readiness_gate.py`
- `.github/workflows/development-d1-release453.yml` — historical guarded Release 453 mutation authority; replay guard now refuses reapplication.
- `.github/workflows/release453-remote-verification.yml` — Release 453 read-only verifier.
- `.github/workflows/system-gate.yml` — canonical source/regression/SEO safety gate.
