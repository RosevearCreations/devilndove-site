# Devil n Dove — AI Handoff

## Current authority

Release 467 Build 108 — **Mobile Workshop Assistant** is the active Development closure candidate. It consumes the externally proven Build 107 closure and may not self-claim its own later exact-head acceptance.

Last fully verified Development is Build 107 — **Storefront Discovery & Collection Improvements**:
- `dev` `943d7af070bc1b01506f2b8d3e8fc36b8aed7750`
- tree `a16e55754b40279050b781ed5bad1892ee62b76c`
- System Gate `34662074529` SUCCESS
- Current Application Quality `34662074545` SUCCESS
- I.T. Admin Runtime Proof `34662074524` SUCCESS
- Repository Branch Hygiene `34662074579` SUCCESS.

Current Production is also Build 107:
- `main` `943d7af070bc1b01506f2b8d3e8fc36b8aed7750`
- tree `a16e55754b40279050b781ed5bad1892ee62b76c`
- Production Pages Deploy `34662205783` SUCCESS
- Production Live Resource Integrity `34662253285` SUCCESS.

## Build 108 scope

Build 108 adds a phone-first **Mobile Workshop Assistant** at `/admin/mobile-workshop-assistant/`. The workflow is: capture one photo → choose privacy and consent evidence → choose an intended image role → optionally associate an existing Product → record the workshop story → prepare a caption/content draft → copy/download a specialist-review handoff package.

The photo binary remains local to the active browser tab and is not stored in localStorage or embedded in the JSON handoff. Only lightweight session metadata/text persists browser-locally. Product association uses the existing `/api/products?limit=100` read only. Public-use candidates fail closed when consent evidence is unknown or held. Build 108 performs no media upload, Product/Inventory/D1/R2 mutation, provider execution or provider/Social publication.

## Autonomous direction after Build 108

Build 109 = Customer Proof & Fulfilment Follow-through; Build 110 = Storefront Evidence & SEO Conversion Audit; Build 111 = Orders-to-Fulfilment Reconciliation; Build 112 = Inventory/Material-Usage Reconciliation; Build 113 = Accountant/Month-End Evidence Depth.

## Restart rule

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 108 must pass exact merged-`dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene plus canonical Development D1/bindings proof and exact Preview smoke before any `main` promotion. Build 109 must ingest Build 108's final external Development + Production closure.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CAD commerce remains authoritative, U.S. sales/shipping remain disabled, and local pickup remains supported.
