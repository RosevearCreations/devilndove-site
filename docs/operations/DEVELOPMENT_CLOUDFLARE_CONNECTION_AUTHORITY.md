# Development Cloudflare Connection Authority — Release 454

Updated: 2026-08-29

## Exact Development identities

- Git branch: `dev`
- Pages project: `devilndove-site-dev`
- Cloudflare account ID: `c0d5bc25df16ae5b7d47c985c4b7b787`
- D1 binding: `DB`
- D1 database: `devilndove-dev`
- D1 UUID: `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- D1 schema: independently verified through **Release 453**
- Release 454 D1 migration: **NONE**
- Release 453 guarded mutation: `33258377328`
- Release 453 independent read-only verifier: `33258415391`
- R2 `PRODUCT_MEDIA_BUCKET`: `devilndove-toolshed-images-dev`
- R2 `CAIP_PRIVATE_MEDIA_BUCKET`: `devilndove-caip-media-dev`
- GitHub D1 credential: `CLOUDFLARE_API_TOKEN`

## Account selection

`wrangler.toml` must **never** contain `account_id`. Local tooling and GitHub Actions pin `CLOUDFLARE_ACCOUNT_ID`; Cloudflare Pages Git deployment owns Pages account context.

Canonical local read-only preflight:

`python scripts/cloudflare_development_access.py --auth-only`

## Mandatory startup rule

> **A new chat is not a migration event.**

Never replay Releases 447, 448, 449, 450 or 453 because a chat/workstation changed. Release 453 is already applied and independently verified. Release 454 is source-only and requires no D1 mutation.

Any future D1-bearing release must first prove a genuinely new durable authority, pass source/local gates, verify exact `devilndove-dev` name/UUID immediately before the write, perform only the new additive migration, and run a separate read-only remote verifier afterward.

Production identifiers/mutation remain outside normal Development execution until deliberate promotion. The later Production convergence must not dismantle `dev` or `devilndove-site-dev.pages.dev`; they remain the ongoing Development path.
