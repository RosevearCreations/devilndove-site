# Development Cloudflare Connection Authority

## Current authority — Release 459
This file defines the only Cloudflare boundary for ongoing Devil n Dove Development work.

### Source / Pages
- GitHub branch: `dev`
- Cloudflare Pages project: `devilndove-site-dev`
- Development URL: `https://devilndove-site-dev.pages.dev`
- The Pages **Production deployment of `devilndove-site-dev` is the Development application**.
- Separate live `main` / `devilndove-site` is a different Production boundary and must remain untouched until deliberate promotion.

### Cloudflare account
- Account ID used by approved tooling/CI: `c0d5bc25df16ae5b7d47c985c4b7b787`
- Account selection belongs in local tooling/GitHub Actions environment, not repository runtime config.
- `wrangler.toml` must never contain `account_id`.

### D1
- binding: `DB`
- database name: `devilndove-dev`
- UUID: `dbc1615b-dcbe-4951-973b-b47c99c73bfa`

Before any D1 write, tooling must verify both exact name and UUID against Cloudflare. A matching friendly name without the expected UUID is insufficient.

### R2
- `PRODUCT_MEDIA_BUCKET` → `devilndove-toolshed-images-dev`
- `CAIP_PRIVATE_MEDIA_BUCKET` → `devilndove-caip-media-dev`

Release 459 D1 work does not write either R2 bucket.

## Startup rule
A new chat, workstation, clone or shell is **not** a migration event.

Startup sequence:
1. read `development-release.json`;
2. read `AI_HANDOFF.md`;
3. verify branch and Cloudflare identities read-only;
4. use `python scripts/cloudflare_development_access.py --auth-only` or the approved transport preflight when local access is needed;
5. do not replay historical migrations;
6. only run the migration belonging to the active current release when the current source gate and exact resource checks authorize it.

## D1 checkpoint
Before Release 459 migration, the independently verified durable checkpoint is Release 453:
- guarded mutation run `33258377328`
- read-only verifier run `33258415391`

Releases 454–458 introduced no D1 migration. Release 458 exact source/deployment closure is:
- SHA `66b48f0445c74247972e14fbdaa0e215e3792fb7`
- Source Gate `33265953249`
- System Gate `33265953255`
- Pages check `99135984965`

## Release 459 D1 permission
Release 459 has one approved Development migration:
`migrations/dev/20260829_release459_it_provider_setup_authority.sql`

It may change only safe provider setup/readiness metadata. It must not:
- store credential or OAuth token values;
- alter Product/Inventory/Accounting/CAIP business data;
- write R2;
- execute a provider action;
- enable provider publication;
- target separate live Production;
- replay Release 447–453 migrations.

Release 459 automation intentionally remains on `dev`; the repository default branch is `main` and is not modified to make Development automation easier. Consequently, the guarded D1 workflow uses a `dev` push trigger rather than GitHub `workflow_run`. Before any D1 write, the job itself re-runs the full Release 459 gate, repository forward sanity and runtime acceptance self-check, then validates exact D1 name/UUID and probes convergence.

The separate remote verifier also starts from the same exact `dev` push, contains no mutation command, verifies the exact D1 identity and waits read-only for Release 459 convergence before validating the snapshot. If the guarded migration does not converge, the verifier fails closed.

Workflows:
- `.github/workflows/release459-source-gate.yml`
- `.github/workflows/development-d1-release459.yml`
- `.github/workflows/release459-remote-verification.yml`

## Secret/configuration boundary
Actual provider values belong in Cloudflare Workers & Pages → `devilndove-site-dev` → Settings → Variables and Secrets.

D1/source/Markdown/browser output may contain only reference names such as `X_CLIENT_ID` or `YOUTUBE_REDIRECT_URI`, never their values.

The detailed user-facing setup authority is `/admin/it-integrations/`, backed by `/api/admin/it-provider-setup-guide`.

## Runtime acceptance boundary
Core acceptance:
- target only `https://devilndove-site-dev.pages.dev`;
- authentication only from `DND_DEV_SESSION_COOKIE` for the command-line harness;
- GET-only;
- no D1/R2/provider mutation;
- `/api/admin/app-modules` is the current Release 459 anchor.

CAIP private-media proof is separate and explicit. It creates a short-lived same-origin administrator-bound secure review grant and tests bounded range streaming/metadata/seek. It never copies or overwrites the source object.

## Production/provider lock
Until deliberate transition:
- Production promotion: **CLOSED**
- provider execution: **CLOSED**
- provider publication: **CLOSED**
- live Production D1/R2 mutation from Development workflows: **UNAVAILABLE**

Do not weaken these locks to make an acceptance test easier.
