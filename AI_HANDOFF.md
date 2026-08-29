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
- Canonical modules: Storefront, Creators, Socials, Financials and I.T.

Always resolve the exact current `dev` SHA and current gates/deployment before calling a new checkpoint green.

## Releases 449 and 450 Development state

Release 449 Corporate Commerce Convergence is complete:

- additive Development migration applied to exact `devilndove-dev`;
- read-only verification workflow run `33235075008` passed;
- seven Release 449 tables/provider authorities retained;
- Etsy remained `draft_only` / `publication_allowed=0`.

Release 450 Marketplace & SEO Readiness is also **applied and independently verified in Development**:

- focused Release 450 source gate run `33235447861`: PASS;
- canonical pre-mutation System Gate run `33235674706`: PASS;
- guarded exact-Development D1 mutation run `33235769850`: PASS;
- read-only remote verification run `33235803838`: PASS;
- Product count and existing Accounting authority inventory were preserved through the additive migration;
- provider publication/execution remained disabled;
- no Release 447/448/449 migration was replayed.

Current migration authority:

`migrations/dev/20260829_release450_marketplace_seo_readiness.sql`

**Do not replay it.** Its state is `applied_and_verified_development` in `development-release.json`.

## Release 450 marketplace work

The 26-change Release 450 batch is implemented. It includes:

- migration-owned marketplace export/mapping schema instead of request-time DDL;
- `marketplace_channel_policies`;
- `marketplace_listing_profiles`;
- `marketplace_listing_validation_snapshots`;
- shared marketplace readiness validation;
- local Etsy listing-profile preparation;
- local Facebook/Meta, Pinterest, TikTok and manual preparation policies;
- responsive `/admin/marketplace-readiness/` workspace;
- aligned `/admin/marketplace-exports/` and `/admin/marketplace-mapping/` surfaces;
- local CSV preparation with margin/listing blockers;
- provider execution and publication hard-locked off;
- Release 450 marketplace/SEO gate wired into the canonical System Gate;
- current PWA/service-worker identity advanced to Release 450.

## Etsy preparation authority

Release 450 prepares local Etsy drafts only. It models:

- title / description / price / quantity;
- taxonomy ID;
- who-made / when-made;
- physical / download / both listing type;
- tags and materials;
- shipping-profile reference;
- processing/readiness-state reference;
- return-policy reference;
- up to 20 prepared images;
- up to 13 tags;
- modern typed personalization questions, up to five;
- up to three prepared variation properties, with third-variation provider-go-live warning;
- local validation snapshots;
- Release 449 syndication draft rows with `publication_requested=0`.

Actual Etsy OAuth/API publication is absent until explicit provider acceptance.

## Other marketplace preparation

- Facebook/Meta: local catalog/listing preparation only.
- Pinterest: local pin/catalog preparation only.
- TikTok: local photo/content metadata preparation only; provider consent/privacy/creator-info rules remain later acceptance work.
- Manual: local export only.

No Release 450 application endpoint publishes to these providers.

## SEO invariant

Public SEO remains release-gated:

- exactly one source H1 per real public HTML document;
- non-empty page title;
- Storefront carousel code must never manufacture an H1;
- admin marketplace pages remain `noindex,nofollow`;
- marketplace data reuses canonical Product/Product SEO/media truth rather than becoming a competing public SEO catalog.

Canonical gate: `python scripts/public_seo_gate.py`.

Release 450's focused marketplace/SEO gate also invokes the public SEO gate and is now part of `.github/workflows/system-gate.yml`.

## D1 / Cloudflare startup rule

Do not improvise the connection sequence. Read:

`docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md`

Key points:

- `wrangler.toml` contains Development bindings but no `account_id`.
- Tooling pins Cloudflare account ID `c0d5bc25df16ae5b7d47c985c4b7b787`.
- GitHub Actions uses repository secret reference `CLOUDFLARE_API_TOKEN`; never print/store its value.
- Exact Development D1 is `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- Run read-only identity checks first.
- **A new chat is not a migration event.**
- Release 447/448/449/450 are already Development history/authority; do not replay them on startup.
- A future new additive migration requires source gates + exact D1 identity + a guarded mutation workflow + a separate read-only verifier.

## Carried-forward platform invariants

Release 448 remains regression authority for Storefront merchandising, Product lineage/provenance, Product image quality, CAIP reviewed handoff, Inventory Intelligence, Supply Sourcing, Tool Lifecycle, calibration and I.T. integration registry.

Existing Product, Inventory, Accounting, media, Tool and Supply systems remain authoritative. Release 450 does not create parallel ledgers/catalogs.

## Deferred I.T. / provider acceptance

Still external/private acceptance work before the associated capability can become active:

- authenticated Development runtime acceptance;
- Stripe test acceptance;
- PayPal sandbox acceptance;
- CAIP private-media acceptance;
- Etsy provider/OAuth acceptance;
- Meta/Pinterest/TikTok provider acceptance.

Provider readiness/configuration metadata is not provider acceptance.

## Immediate next sequence

1. Calibrate real Development Products in `/admin/marketplace-readiness/` for Etsy taxonomy, shipping/processing references, selected images, tags/materials and blockers.
2. Deepen public SEO beyond the existing structural gate: descriptions, canonical URLs and structured-data coverage on important commerce/public pages.
3. Continue responsive storefront/admin CSS cleanup.
4. Extend provider fee/accounting completeness using real transaction evidence rather than assumptions.
5. Complete Etsy/Meta/Pinterest/TikTok provider acceptance later without weakening publication locks first.
6. Complete Stripe/PayPal/CAIP/authenticated runtime acceptance.
7. Keep Production untouched until an explicit promotion decision.
