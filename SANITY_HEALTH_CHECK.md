# Devil n Dove — Sanity / Health Check

## Current authority

**Release 467 Build 14 — Product Release Quality Command Center** is the active Development source candidate.

Current Build 14 source base: `86907d512c5121bb05306ca9d31d4aecb5fd6c50`, tree `9740eec99afbcd93773ab7e3b875037c183591db`.

Exact last green predecessor: **Release 467 Build 13 — Repository Hygiene and Historical CI Cleanup** at `794fd5b36191fff4c9e8376197f968d9c6d6da80`, tree `9c2bcdcb12bcbf2f00aeb19345329cdce39c65d9`.

- [x] Build 13 System Gate `33643833623` — SUCCESS.
- [x] Build 13 Proof `33643833608` — SUCCESS.
- [x] Build 13 exact Build 12 predecessor `374983f68fb16172fb357b1755293a29e5d2953f` remains retained.
- [x] `development-release.json` remains **INHERITED_REGRESSION_COMPATIBILITY**.
- [x] Runtime Release 466 header remains **INHERITED_RUNTIME_COMPATIBILITY**.

## Retained Build 12 provenance sanity

**Release 467 Build 12 — Finance Operations Command Center** remains a closed authority. Its exact Build 11 source base is `ce42f3b2ea553b69085705f500a9e2bd2f689818`; the shared Finance view remains read-only and external acceptance remains `HOLD_EXTERNAL`.

## Locked Build 8 provenance sanity

**Release 467 Build 8 — Authority Convergence and Restart Safety** remains locked historical provenance. Its exact Build 7 predecessor was `5eef764a67466dc2989a4681c6a7cc782b9d4df9`, with System Gate `33591744817` and Build 7 Proof `33591744787` both SUCCESS. External acceptance remained `HOLD_EXTERNAL`.

## Build 14 Product Release Quality sanity

- [x] Autonomous backlog items 1–5 are the exact bounded Build 14 scope.
- [x] Product quality aggregation reuses `/api/admin/products` and `/api/admin/product-readiness`; it does not create another Catalog authority.
- [x] Quality checks cover title, descriptions, category, price, linked cost/margin, inventory/buildable resources, hero/gallery, alt text, public-use clearance, SEO title/meta, canonical/slug, structured-data input facts, shipping and marketplace-image readiness.
- [x] Unresolved issues are ranked and link to the owning Product, Media, SEO, Marketplace or full-readiness workspace.
- [x] Product quality cards expose visual readiness badges.
- [x] Product cards link directly to existing Product Media crop/focal controls.
- [x] Existing Product Media retains clickable focal selection, `Set 1:1 crop`, queued derivative crop files and derivative history.
- [x] Original R2 media remains preserved; Build 14 does not introduce raw R2 replacement/deletion.
- [x] Product readiness reports duplicate image URLs and product-specific proof-image role recommendations.
- [x] Marketplace image validation checks duplicates, alt text, public-use clearance, 800×800 minimum, preferred 1200×1200, orientation and merchandising score.
- [x] Existing marketplace CSV preparation continues to fail closed on validation blockers.
- [x] Build 14 performs no automatic repair or provider publication.

## Retained Build 13 repository hygiene

- [x] **Release 467 Build 13 — Repository Hygiene and Historical CI Cleanup** remains retained with exact Build 12 predecessor `374983f68fb16172fb357b1755293a29e5d2953f`.
- [x] Exactly 39 obsolete Release 448–461 workflow definitions remain retired.
- [x] Historical commits/scripts remain available in Git history.
- [x] Current `system-gate.yml`, Development runtime acceptance and Production deploy/rollback safety remain.
- [x] Release 463 environment/Cloudflare/D1/R2 infrastructure workflows remain.
- [x] Release 466 Build 1–6 manual-only proof workflows remain as required by Build 9 provenance.
- [x] `scripts/repository_hygiene_gate.py` still prevents retired workflow names from returning.
- [x] Build 13 proof gate is forward-compatible with Build 14 while retaining all cleanup/safety assertions.

## Environment / schema sanity

- [x] Source authority: `dev`.
- [x] Preview: `https://dev.devilndove-site.pages.dev`.
- [x] D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- [x] Product R2: `devilndove-toolshed-images-dev`.
- [x] CAIP R2: `devilndove-caip-media-dev`.
- [x] Canonical migrations remain exactly `0001`–`0004`.
- [x] Build 14 adds no migration and no request-time DDL.
- [x] Build 14 authorizes no new D1/R2 mutation.

## SEO / commerce safety sanity

- [x] Existing one-H1/public SEO gates remain unchanged.
- [x] Structured-data work in Build 14 is readiness visibility only; Build 15 owns full parity enforcement.
- [x] Existing U.S. sales/shipping suspension remains unchanged.
- [x] Marketplace preparation remains local/export-only; no provider network execution is added.

## External acceptance sanity

- [ ] Cloudflare Access service token — `HOLD_EXTERNAL`.
- [ ] Stripe Development — `HOLD_EXTERNAL`.
- [ ] PayPal sandbox — `HOLD_EXTERNAL`.
- [ ] Social/OAuth — `HOLD_EXTERNAL`.
- [ ] CAIP private media — use fresh Build 7 evidence.

- [x] Provider/payment/refund/OAuth execution from Build 14: NONE.
- [x] Cloudflare Access policy mutation from Build 14: NONE.
- [x] Secret values emitted by Build 14: NONE.

## Main / Production sanity

- [x] `main` remains Build 11 SHA `ce42f3b2ea553b69085705f500a9e2bd2f689818`, tree `191e4a92ebcbc94b29cfbf6a83259acd4981d302`.
- [x] Production Pages Deploy `33640133776` — SUCCESS.
- [x] Builds 12–14 remain Development-only.
- [x] Build 14 does not contact or mutate Production.

## Current verdict

Release 467 Build 13 is the exact proven Development predecessor. Release 467 Build 14 is a schema-neutral Product Release Quality candidate that converts existing Product, Inventory, Media, SEO and Marketplace-readiness facts into one ranked remediation workflow while keeping corrections explicit and external/provider/Production lanes closed. External lanes remain truthfully `HOLD_EXTERNAL`.
