# Devil n Dove — Project Status and Roadmap

## Current Development and Production authority

**Release 467 Build 107 — Storefront Discovery & Collection Improvements** is the current Development closure candidate.

Last fully verified Development is Build 106 — Marketplace Listing Readiness:
- `dev` `e22b3f9c7fcb223114b48e52a51e0c537e6da081`
- tree `334d907d8e39dcbc8a02dc80cfa949abf13bd8c5`
- System Gate `34655258282` SUCCESS
- Current Application Quality `34655258284` SUCCESS
- I.T. Admin Runtime Proof `34655258283` SUCCESS
- Repository Branch Hygiene `34655258294` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, bindings, smoke and regression evidence: SUCCESS.

Current Production is also Build 106:
- `main` `e22b3f9c7fcb223114b48e52a51e0c537e6da081`
- tree `334d907d8e39dcbc8a02dc80cfa949abf13bd8c5`
- Production Pages Deploy `34655379475` SUCCESS
- Production Live Resource Integrity `34655438506` SUCCESS.

## Build 107 scope — Storefront Discovery & Collection Improvements

Build 107 adds truthful, crawlable buyer discovery paths across Shop and Collections: **Under $25, One-of-a-kind, Local pickup, Custom gifts, Vintage finds, Laser engraved, Workshop experiments and Proof-rich Products**.

Under $25 and Vintage reuse the established public Product price/origin filters. Evidence-backed `discover=` paths consume the already-loaded `/api/products` payload and include a Product only when its public fields explicitly support the label. No duplicate catalog, additional Product request, Storefront business-data mutation, schema change or provider publication is introduced. Shop and Collections each keep exactly one H1.

## Autonomous build layout

Each build is bounded, must ingest the prior build's final external closure, must pass the exact merged-`dev` four-proof chain, and may be fast-forwarded non-force to `main` only when the same SHA/tree is fully GREEN.

- **Build 107 — Storefront Discovery & Collection Improvements.** Crawlable evidence-backed buyer paths over the existing Product authority; no duplicate catalog or automatic claims.
- **Build 108 — Mobile Workshop Assistant.** Streamlined phone path: capture photo → choose consent/privacy → assign image role → add Product/story note → prepare caption/content draft. Preserve review-first Creator/CAIP boundaries and keep Social OAuth publication closed.
- **Build 109 — Customer Proof & Fulfilment Follow-through.** Improve completed-order review/photo/consent prompts, stage-specific customer progress messaging and consent-approved proof candidates. Nothing becomes public without consent/review authority.
- **Build 110 — Storefront Evidence & SEO Conversion Audit.** Converge Products, collections, custom-service pages, real media, structured data, internal links, local/pickup wording and conversion paths so visible facts and schema agree.
- **Build 111 — Orders-to-Fulfilment Reconciliation.** Strengthen paid/approved order handoff through making, pickup/shipping, completion and exception visibility without changing external payment acceptance boundaries.
- **Build 112 — Inventory & Material-Usage Reconciliation.** Reconcile Product/project material consumption, reservations, kit remnants, shortages and costing evidence without inventing stock movements.
- **Build 113 — Accountant & Month-End Evidence Depth.** Deepen month-end review, evidence attachment, reconciliation and accountant-export readiness while keeping accounting posting explicit and reviewable.

## Safety and external lanes

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported. No provider configuration is treated as execution authority. No Development business data may overwrite Production.

## Build 107 closure sequence

1. Build 106 exact Development and Production closure is ingested into source authority.
2. Add crawlable Storefront buyer paths and evidence-backed `discover=` presentation without changing Product authority.
3. Fast-forward the exact candidate to `dev`.
4. Require exact merged-`dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene plus canonical Development D1/binding proof and exact Preview smoke.
5. Promote the same exact SHA/tree to `main` only when all Development checks are GREEN.
6. Require Production Pages Deploy and Production Live Resource Integrity on that exact SHA.
7. Build 108 must ingest Build 107's final external closure evidence.
