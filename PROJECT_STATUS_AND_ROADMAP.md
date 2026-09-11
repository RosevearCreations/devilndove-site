# Devil n Dove — Project Status and Roadmap

## Current Development and Production authority

**Release 467 Build 99 — Product Work Views & Browser Sort** is the current Development closure candidate.

Last fully verified Development is Build 98 — Product Readiness Triage & Blocker Groups:
- `dev` `81d6ed5cdd55c959611f538de8c90bcf21f5b302`
- tree `d19224681ade25301c07d96854c0b6c7a6abd762`
- System Gate `34550999431` SUCCESS
- Current Application Quality `34550999419` SUCCESS
- I.T. Admin Runtime Proof `34550999479` SUCCESS
- Repository Branch Hygiene `34550999409` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, bindings, non-secret smoke and regression evidence: SUCCESS.

Current Production is also Build 98:
- `main` `81d6ed5cdd55c959611f538de8c90bcf21f5b302`
- tree `d19224681ade25301c07d96854c0b6c7a6abd762`
- Production Pages Deploy `34551114694` SUCCESS
- Production Live Resource Integrity `34551173009` SUCCESS.

## Build 99 scope

Build 99 adds reusable browser-local Product work views. A saved work view captures the current Product search, focus filter, readiness triage lane, visible-column preferences and row sort. Up to eight named views can be stored in the current browser, reapplied, updated or deleted. This creates operator convenience only; it does not create new Product truth.

The Product table can now be reordered locally by original Product order, Product/System number, name, readiness score, inventory quantity or recently updated time. The sort layer reuses `dd_admin_products_snapshot_v2` plus readiness already rendered in the table. No additional Product/readiness API or database read is introduced.

Build 98 readiness triage, Build 97 readiness queue/navigation, Build 96 Product search/focus, Build 95 current Product/table ergonomics, Build 94 responsive workspace navigation and Build 93 centered-shell/local-scroll protections remain active.

No D1/R2 business data, schema, payment/provider execution, publication authority, commerce rule or heading hierarchy changes. Exactly one H1 remains the public SEO rule.

## Current external acceptance

Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`. CAIP private-media acceptance remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported.

## Build 99 closure sequence

1. Ingest Build 98 exact Development/Production closure into current restart authority.
2. Add browser-local saved Product work views and row sort while reusing existing Product snapshot/readiness evidence.
3. Fast-forward the exact candidate to `dev`.
4. Require exact merged-`dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene plus canonical Development D1/binding proof and exact Preview smoke.
5. Promote the same exact SHA/tree to `main` only when all Development checks are GREEN.
6. Require Production business-data preservation, canonical Production D1/FK/binding proof, exact Pages deployment, public smoke and promotion proof.
7. Require Production Live Resource Integrity to re-prove live D1, same-origin Product R2, Product API photography and account diagnostic.
8. Only then call Build 99 complete externally; Build 100 must ingest Build 99's final external closure evidence.

Canonical migrations remain exactly `0001`–`0004`.
