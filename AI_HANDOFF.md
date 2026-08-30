# Devil n Dove — AI Handoff

## Current authority

**Accepted Development release: Release 461 — Runtime Schema Convergence, Inventory & CAIP Production Pipeline.**

Development boundary:

- source branch: `dev`
- Development Pages project: `devilndove-site-dev`
- Development URL: `https://devilndove-site-dev.pages.dev`
- D1: `DB` → `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- Product R2: `PRODUCT_MEDIA_BUCKET` → `devilndove-toolshed-images-dev`
- CAIP private R2: `CAIP_PRIVATE_MEDIA_BUCKET` → `devilndove-caip-media-dev`
- separate live Production: `main` / `devilndove-site` — **do not mutate**
- provider live authorization/execution/publication: **closed**
- raw CAIP R2 deletion: **closed**
- never add `account_id` to `wrangler.toml`

A new chat, workstation, deploy, or source commit is **not** a migration event. Never replay historical migrations because a session changed.

## Release 461 closure evidence

Release 461 D1 is applied and independently verified in Development:

- D1 acceptance run: `33340698069`
- accepted D1 source SHA: `7cbd5035d8755580053e8e4ec934643413954bb2`
- Release 461 migrations: **19**
- required tables: **77**
- required indexes: **93**
- missing required objects after apply: **0**
- structural drift after apply: **0**
- foreign-key violations: **0**

Authenticated Development runtime acceptance is also proven:

- runtime run: `33342752757`
- request/source SHA: `7200f421e0fc58842aed4003dc774ed30f910809`
- method: **GET only**
- anonymous admin routes: correctly rejected
- module authority: Release 461 / five modules / schema ready
- Inventory: HTTP 200, 80 inventory rows, canonical `quantity_authority=base` on all returned rows
- Product Media: HTTP 200, exact primary thresholds 1200×1200, alt ≥12, quality ≥70
- CAIP pipeline: HTTP 200, schema ready, 23 projects, provider/publication/R2-delete closed
- CAIP reviewed handoff: real project 36, HTTP 200, Release 461, source media unchanged
- D1 session lookup: read-only existing admin session; token masked and never committed
- D1/R2/provider/Production mutation during runtime acceptance: **none**

## Release 461 governing rules carried forward

- Request-time `CREATE/ALTER/DROP` schema behavior is forbidden.
- Runtime may inspect schema read-only and must fail closed if migration-owned authority is absent.
- Historical migration replay is forbidden.
- `site_inventory_base_balances` is the canonical usable/base-unit Inventory read authority while purchase packaging/cost remains on `site_item_inventory`.
- Product primary-image acceptance is loadable image, ≥1200×1200, alt ≥12 characters, score ≥70.
- CAIP raw media remains source-preserving; story/timeline/handoff planning does not authorize provider rendering/publication or raw R2 deletion.
- Release 460 OAuth encryption/state/PKCE/intended-account security authority remains carried forward with provider execution closed.

## Restart point

Do **not** reopen Release 461 D1 migration work on startup. Start with read-only identity/head verification. If Release 461 remains healthy, new feature/source work starts as **Release 462**.

Separate later evidence remains intentionally deferred: CAIP private-media browser proof, Stripe test acceptance, PayPal sandbox acceptance, and deliberately authorized provider acceptance.

## Canonical reading order

1. `development-release.json`
2. `AI_HANDOFF.md`
3. `PROJECT_STATUS_AND_ROADMAP.md`
4. `docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md`
5. `docs/operations/RELEASE_461_RUNTIME_SCHEMA_INVENTORY_CAIP_AUTHORITY.md`
6. `SANITY_HEALTH_CHECK.md`

Older Release/Build Markdown is provenance/supporting material only and never overrides these current authorities.
