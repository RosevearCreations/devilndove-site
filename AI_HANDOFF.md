# AI Handoff — Release 452 Application Streamlining & UX/SEO Depth

Updated: 2026-08-29

Read in this order:

1. `development-release.json` — machine-readable current release/state.
2. `docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md` — exact D1/R2/account connection mechanics and new-chat startup rule.
3. `docs/operations/RELEASE_452_APPLICATION_STREAMLINING.md` — current Release 452 scope and acceptance.
4. `PROJECT_STATUS_AND_ROADMAP.md` — active execution queue.

Historical Build numbers and Release 448 filenames are provenance/regression authority, not the current release identity. Git history is the archive; obsolete Build-era one-off verification files must not accumulate in the current tree.

## Current Development boundary

- Current release: **Release 452 — Application Streamlining & UX/SEO Depth**
- Source branch: `dev`
- Development Pages: `devilndove-site-dev`
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- D1 schema: **current and independently verified through Release 450**
- Release 451 D1 migration: **none**
- Release 452 D1 migration: **none required**
- Development R2: `devilndove-toolshed-images-dev`, `devilndove-caip-media-dev`
- Cloudflare account selection: tooling/GitHub Actions pin `CLOUDFLARE_ACCOUNT_ID`; **never add `account_id` to `wrangler.toml`**.
- Canonical modules: Storefront, Creators, Socials, Financials, I.T.
- Marketplace/provider publication: **CLOSED**
- Separate Production: `main` / `devilndove-site`
- Production promotion/mutation: **CLOSED / NONE**

## Startup rule

**A new chat is not a migration event.**

Never replay Releases 447, 448, 449 or 450 merely because a chat, workstation, token, or local checkout changed. Read the current authorities first, resolve the exact `dev` SHA, use the read-only Cloudflare identity preflight, and only create a new additive Development migration when a real durable schema requirement exists.

Canonical read-only preflight:

`python scripts/cloudflare_development_access.py --auth-only`

## D1 evidence already proven

- Release 449 independent Development verification: `33235075008`
- Release 450 guarded D1 mutation: `33235769850`
- Release 450 independent read-only D1 verification: `33235803838`
- Release 451 focused source gate: `33252042376`
- Release 451 full System Gate: `33252156030`

Do not perform meaningless D1 writes to prove access. The exact Development D1 read/write path has already been proven with guarded real migrations and independent read-only verification.

## Release 452 source convergence

Release 452 is source-only and concentrates on streamlining and quality guardrails:

- obsolete root Build-era D1 verifier retired after reference verification;
- permanent repository hygiene gate added for Build verification debris, backup/temp files, authority drift, Storefront route/SEO regressions, and representative admin privacy/status behavior;
- Release 452 focused convergence gate and workflow added;
- existing Product JSON-LD authority retained rather than duplicated;
- visible accessible Product breadcrumbs plus dynamic `BreadcrumbList` JSON-LD added;
- below-fold Product proof placeholders now decode asynchronously;
- `/collages/` added to `sitemap.xml`;
- Shop, Product, Collections and Collages remain one-H1/canonical/social/JSON-LD guarded;
- Accounting admin now explicitly uses `noindex,nofollow`;
- Inventory Intelligence, Tool Lifecycle, Accounting and CAIP handoff now expose polite live status regions;
- Release 448 regression assets remain because current gates still call them;
- Release 451 marketplace calibration remains read-only and carried forward.

## Provider/API boundary

Provider credentials are still pending. Continue local application work without them.

Do not enable provider publication or provider-side execution for Etsy, Meta/Facebook, Pinterest or TikTok. Stripe test, PayPal sandbox, provider acceptance and CAIP private-media acceptance remain runtime/evidence tasks. Credentials must never be stored in D1.

## Before calling Release 452 green

Require the focused Release 452 source workflow and canonical System Gate to pass on the exact current `dev` SHA. The System Gate must retain Release 451, Release 450 and active Release 448 regression authority, both public SEO gates, syntax/compile checks, the read-only Development D1 transport preflight, runtime self-check, and the explicit statement `Production mutation capability: NONE`.
