# Devil n Dove — AI Handoff

## Current authority

Release 467 Build 107 — **Storefront Discovery & Collection Improvements** is the active Development closure candidate. It consumes the externally proven Build 106 closure and may not self-claim its own later exact-head acceptance.

Last fully verified Development is Build 106 — **Marketplace Listing Readiness**:
- `dev` `e22b3f9c7fcb223114b48e52a51e0c537e6da081`
- tree `334d907d8e39dcbc8a02dc80cfa949abf13bd8c5`
- System Gate `34655258282` SUCCESS
- Current Application Quality `34655258284` SUCCESS
- I.T. Admin Runtime Proof `34655258283` SUCCESS
- Repository Branch Hygiene `34655258294` SUCCESS.

Current Production is also Build 106:
- `main` `e22b3f9c7fcb223114b48e52a51e0c537e6da081`
- tree `334d907d8e39dcbc8a02dc80cfa949abf13bd8c5`
- Production Pages Deploy `34655379475` SUCCESS
- Production Live Resource Integrity `34655438506` SUCCESS.

## Build 107 scope

Build 107 strengthens public Storefront discovery without creating another catalog. Shop and Collections expose crawlable buyer paths for **Under $25, One-of-a-kind, Local pickup, Custom gifts, Vintage finds, Laser engraved, Workshop experiments and Proof-rich Products**.

Under $25 and Vintage reuse existing Product price/origin filters. The other discovery paths use only the already-loaded public Product payload and require explicit public evidence before a Product is included. Unsupported labels fail closed rather than being inferred from private state or guesswork. No additional Product request, Product/Inventory mutation, schema change, provider execution/publication or Production business-data mutation is introduced. One-H1 SEO rules remain intact.

## Autonomous direction after Build 107

Build 108 = Mobile Workshop Assistant; Build 109 = Customer Proof & Fulfilment Follow-through; Build 110 = Storefront Evidence & SEO Conversion Audit; Build 111 = Orders-to-Fulfilment Reconciliation; Build 112 = Inventory/Material-Usage Reconciliation; Build 113 = Accountant/Month-End Evidence Depth.

## Restart rule

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 107 must pass exact merged-`dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene plus canonical Development D1/bindings proof and exact Preview smoke before any `main` promotion. Build 108 must ingest Build 107's final external Development + Production closure.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CAD commerce remains authoritative, U.S. sales/shipping remain disabled, and local pickup remains supported.
