# Devil n Dove — Project Status and Roadmap

## Current Development and Production authority

**Release 467 Build 106 — Marketplace Listing Readiness** is the current Development closure candidate.

Last fully verified Development is Build 105 — Product Work Session Completion & Handoff:
- `dev` `1ce61a319c0534ea386c64978f2ed58c3391470d`
- tree `045fa67ef20ee1aec9f87dfa6e2fd4cf02219690`
- System Gate `34631203672` SUCCESS
- Current Application Quality `34631203855` SUCCESS
- I.T. Admin Runtime Proof `34631203641` SUCCESS
- Repository Branch Hygiene `34631204122` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, bindings, smoke and regression evidence: SUCCESS.

Current Production is also Build 105:
- `main` `1ce61a319c0534ea386c64978f2ed58c3391470d`
- tree `045fa67ef20ee1aec9f87dfa6e2fd4cf02219690`
- Production Pages Deploy `34631390665` SUCCESS
- Production Live Resource Integrity `34631490953` SUCCESS.

## Build 106 scope — marketplace listing readiness

Build 106 adds browser-local per-Product **Marketplace Listing Readiness** for Etsy, Facebook Marketplace, Pinterest and manual export. It checks hero image, image quality, title/description, dimensions/materials, price, inventory state, Canada shipping/local pickup eligibility, tags/category and the readiness evidence already rendered on the Products page.

Each Product receives channel-specific readiness and missing-requirement guidance. **Copy export pack** and **Download JSON** are explicit user actions for review/export preparation. The feature reuses `dd_admin_products_snapshot_v2` and rendered Product readiness; it adds no Product/readiness API/database read, Product/Inventory mutation, schema change, provider execution or marketplace publication. Build 105 handoff and all earlier Product workflow protections remain active.

## Autonomous build layout

The following sequence is the current default autonomous direction. Each build is deliberately bounded, must ingest the prior build's final external closure, must pass the exact merged-`dev` four-proof chain, and may be fast-forwarded non-force to `main` only when the same SHA/tree is fully GREEN.

- **Build 106 — Marketplace Listing Readiness.** Add per-Product Etsy/Facebook Marketplace/Pinterest/manual-export readiness for hero image, image quality, title/description, dimensions/materials, price, inventory state, shipping/pickup eligibility, tags/category and required evidence. Prepare exports only; no automatic marketplace publication.
- **Build 107 — Storefront Discovery & Collection Improvements.** Add truthful buyer-facing collection/discovery paths such as Under $25, One-of-a-kind, Local pickup, Custom gifts, Vintage finds, Laser engraved and Workshop experiments, plus stronger related-product/proof browsing. Preserve one H1, crawlable links and evidence-backed Product facts.
- **Build 108 — Mobile Workshop Assistant.** Create the streamlined phone path: capture photo → choose consent/privacy → assign image role → add Product/story note → prepare caption/content draft. Keep review-first Creator/CAIP boundaries and do not enable Social OAuth publication.
- **Build 109 — Customer Proof & Fulfilment Follow-through.** Improve completed-order review/photo/consent prompts, stage-specific customer progress messaging and consent-approved proof candidates. Nothing becomes public without existing consent/review authority.
- **Build 110 — Storefront Evidence & SEO Conversion Audit.** Converge Products, collections, custom-service pages, real media, structured data, internal links, local/pickup wording and conversion paths so visible facts and schema agree. Prefer authentic maker/process evidence over bulk generic SEO content.
- **Build 111 — Orders-to-Fulfilment Reconciliation.** Strengthen the operational handoff from paid/approved orders through making, pickup/shipping, completion and exception visibility without changing external payment acceptance boundaries.
- **Build 112 — Inventory & Material-Usage Reconciliation.** Reconcile Product/project material consumption, reservations, kit remnants, shortages and costing evidence without inventing stock movements.
- **Build 113 — Accountant & Month-End Evidence Depth.** Deepen month-end review, evidence attachment, reconciliation and accountant-export readiness while keeping accounting posting explicit and reviewable.

## Safety and external lanes

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported. No provider configuration is treated as execution authority. No Development business data may overwrite Production.

## Build 106 closure sequence

1. Build 105 exact Development and Production closure is ingested into source authority.
2. Add browser-local Product marketplace-listing readiness and review/export packs without changing Product authority.
3. Fast-forward the exact candidate to `dev`.
4. Require exact merged-`dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene plus canonical Development D1/binding proof and exact Preview smoke.
5. Promote the same exact SHA/tree to `main` only when all Development checks are GREEN.
6. Require Production Pages Deploy and Production Live Resource Integrity on that exact SHA.
7. Build 107 must ingest Build 106's final external closure evidence.
