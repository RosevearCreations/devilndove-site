# Devil n Dove — Project Status and Roadmap

## Current Development and Production authority

**Release 467 Build 108 — Mobile Workshop Assistant** is the current Development closure candidate.

Last fully verified Development is Build 107 — Storefront Discovery & Collection Improvements:
- `dev` `943d7af070bc1b01506f2b8d3e8fc36b8aed7750`
- tree `a16e55754b40279050b781ed5bad1892ee62b76c`
- System Gate `34662074529` SUCCESS
- Current Application Quality `34662074545` SUCCESS
- I.T. Admin Runtime Proof `34662074524` SUCCESS
- Repository Branch Hygiene `34662074579` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, bindings, smoke and regression evidence: SUCCESS.

Current Production is also Build 107:
- `main` `943d7af070bc1b01506f2b8d3e8fc36b8aed7750`
- tree `a16e55754b40279050b781ed5bad1892ee62b76c`
- Production Pages Deploy `34662205783` SUCCESS
- Production Live Resource Integrity `34662253285` SUCCESS.

## Build 108 scope — Mobile Workshop Assistant

Build 108 adds a review-first phone workflow at `/admin/mobile-workshop-assistant/`: capture photo → choose consent/privacy → choose image role → optionally associate an existing Product → add story note → prepare caption/content draft → copy/download a specialist handoff package.

The image binary remains in the active browser tab only. LocalStorage contains lightweight metadata and draft text, not photo bytes. The optional Product association uses only the existing public Product GET. Unknown/held consent blocks a public-use candidate. The exported JSON explicitly says `publication_authorized: false`, `binary_included: false`, and `upload_performed: false`. Specialist Media/Product/Content/CAIP/Photo Moderation screens remain authoritative for final assignment, upload, approval and publication.

## Autonomous build layout

Each build is bounded, must ingest the prior build's final external closure, must pass the exact merged-`dev` four-proof chain, and may be fast-forwarded non-force to `main` only when the same SHA/tree is fully GREEN.

- **Build 108 — Mobile Workshop Assistant.** Phone capture and review-handoff preparation only; no media upload, Product mutation or publication.
- **Build 109 — Customer Proof & Fulfilment Follow-through.** Improve completed-order review/photo/consent prompts, stage-specific customer progress messaging and consent-approved proof candidates. Nothing becomes public without consent/review authority.
- **Build 110 — Storefront Evidence & SEO Conversion Audit.** Converge Products, collections, custom-service pages, real media, structured data, internal links, local/pickup wording and conversion paths so visible facts and schema agree.
- **Build 111 — Orders-to-Fulfilment Reconciliation.** Strengthen paid/approved order handoff through making, pickup/shipping, completion and exception visibility without changing external payment acceptance boundaries.
- **Build 112 — Inventory & Material-Usage Reconciliation.** Reconcile Product/project material consumption, reservations, kit remnants, shortages and costing evidence without inventing stock movements.
- **Build 113 — Accountant & Month-End Evidence Depth.** Deepen month-end review, evidence attachment, reconciliation and accountant-export readiness while keeping accounting posting explicit and reviewable.

## Safety and external lanes

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported. No provider configuration is treated as execution authority. No Development business data may overwrite Production.

## Build 108 closure sequence

1. Build 107 exact Development and Production closure is ingested into source authority.
2. Add the browser-local Mobile Workshop Assistant and review-handoff workflow without creating new media or Product authority.
3. Fast-forward the exact candidate to `dev`.
4. Require exact merged-`dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene plus canonical Development D1/binding proof and exact Preview smoke.
5. Promote the same exact SHA/tree to `main` only when all Development checks are GREEN.
6. Require Production Pages Deploy and Production Live Resource Integrity on that exact SHA.
7. Build 109 must ingest Build 108's final external closure evidence.
