# AI Handoff — Release 450 Marketplace & SEO Readiness

Updated: 2026-08-29

Read in this order:

1. `development-release.json` — machine-readable current release/state.
2. `docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md` — exact D1/R2/account connection mechanics and new-chat startup rule.
3. `PROJECT_STATUS_AND_ROADMAP.md` — current execution scope.

Historical Build numbers and Release 448 filenames are provenance/regression authority, not the current release identity.

## Current boundary

- Current release: **450 — Marketplace & SEO Readiness**
- Source branch: `dev`
- Development Pages: `devilndove-site-dev`
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Development Cloudflare account selection: pinned by tooling/GitHub Actions as `CLOUDFLARE_ACCOUNT_ID`; **never add `account_id` to `wrangler.toml`**.
- Development R2: `devilndove-toolshed-images-dev`, `devilndove-caip-media-dev`
- Separate live Production: `main` / `devilndove-site`
- Production promotion: **CLOSED**
- Marketplace/provider publication: **CLOSED**
- Canonical modules remain Storefront, Creators, Socials, Financials and I.T.

Always resolve the exact current `dev` SHA and current gate/deployment state before calling a new checkpoint green.

## Release 449 is complete

Release 449 Corporate Commerce Convergence is no longer pending.

- Source gates passed.
- Its one additive Development migration was applied only to the exact `devilndove-dev` D1.
- Verification-only workflow run `33235075008` proved the seven Release 449 tables, seven provider setup rows, Etsy `draft_only` / `publication_allowed=0`, existing Accounting authority visibility and absence of provider secret-value columns.
- Release 447/448 migrations must not be replayed merely because a new chat begins.

## Release 450 scope

Release 450 prepares marketplace/channel operations without enabling provider publication and keeps SEO as a mandatory gate.

Implemented source work includes:

- migration-owned marketplace export/mapping schema instead of request-time DDL;
- `marketplace_channel_policies`;
- `marketplace_listing_profiles`;
- `marketplace_listing_validation_snapshots`;
- shared marketplace readiness validation;
- local Etsy listing-profile preparation;
- local Facebook/Meta, Pinterest, TikTok and manual preparation policies;
- consolidated `/admin/marketplace-readiness/` workspace;
- aligned `/admin/marketplace-exports/` and `/admin/marketplace-mapping/` surfaces;
- local CSV preparation with margin/listing blockers;
- provider execution and publication hard-locked off;
- Release 450 source gate composes the real Release 449 migration + Release 450 migration locally and requires the public SEO structural gate.

The current Release 450 migration is:

`migrations/dev/20260829_release450_marketplace_seo_readiness.sql`

Its Development D1 status must be read from `development-release.json`. Do not infer or replay it from chat history.

## Etsy preparation authority

Release 450 prepares local Etsy drafts only. It currently models:

- title/description/price/quantity;
- taxonomy ID;
- who-made and when-made;
- physical/download/both listing type;
- tags and materials;
- shipping-profile reference;
- processing/readiness-state reference;
- return-policy reference;
- up to 20 prepared images;
- up to 13 tags;
- modern typed personalization questions, up to five;
- up to three variation properties, with third-variation provider-go-live warning;
- local validation snapshots;
- Release 449 syndication draft rows with `publication_requested=0`.

Actual Etsy OAuth/API execution is deliberately absent until later provider acceptance.

## Other marketplace preparation

- Facebook/Meta: local catalog/listing preparation only.
- Pinterest: local pin/catalog preparation only.
- TikTok: local photo/content metadata preparation only; provider consent/privacy/creator-info rules remain a later provider-acceptance requirement.
- Manual: local export only.

No Release 450 endpoint contacts those provider APIs directly.

## SEO invariant

Public SEO structure remains a release requirement:

- exactly one source H1 per real public HTML document;
- non-empty title;
- Storefront carousel code must never manufacture an H1;
- admin marketplace pages remain `noindex,nofollow`;
- marketplace preparation reads canonical Product/Product SEO/media truth rather than creating a second public SEO catalog.

Canonical gate: `python scripts/public_seo_gate.py`.

## D1 / Cloudflare startup rule

Do not improvise the D1 connection sequence. Read:

`docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md`

Key points:

- `wrangler.toml` contains Development bindings but no `account_id`.
- Tooling pins Cloudflare account ID `c0d5bc25df16ae5b7d47c985c4b7b787`.
- GitHub Actions uses repository secret reference `CLOUDFLARE_API_TOKEN`; never print/store its value.
- Exact Development D1 is `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- Run read-only identity checks first.
- A new chat is not a migration event.
- Apply only a current additive migration after source gates and exact D1 identity pass.
- Follow mutation with a separate read-only remote verifier.

## Carried-forward platform invariants

Release 448 remains regression authority for Storefront merchandising, Product lineage/provenance, Product image quality, CAIP reviewed handoff, Inventory Intelligence, Supply Sourcing, Tool Lifecycle, calibration and I.T. integration registry.

Those systems remain authoritative; Release 450 does not create parallel Product, Inventory, Accounting, media, Tool or Supply ledgers.

## Deferred I.T. acceptance

Still external/private acceptance work, non-blocking for unrelated source development but required before the associated provider capability can become active:

- authenticated Development runtime acceptance;
- Stripe test acceptance;
- PayPal sandbox acceptance;
- CAIP private-media acceptance;
- Etsy provider/OAuth acceptance;
- Meta/Pinterest/TikTok provider acceptance.

Provider readiness/configuration metadata is not provider acceptance.

## Immediate next sequence

1. Keep Release 450 source and canonical gates green.
2. Apply only the guarded Release 450 migration to exact Development D1 when its source gate is green.
3. Run a separate read-only Release 450 remote verifier.
4. Calibrate real Development Products for Etsy taxonomy, shipping/processing references, images, tags/materials and listing blockers.
5. Continue public SEO metadata/responsive cleanup.
6. Complete provider test acceptance later without weakening draft-only/publication locks beforehand.
7. Keep Production untouched until an explicit promotion decision.
