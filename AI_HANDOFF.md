# Devil n Dove — AI Handoff

## Current authority

Release 467 Build 106 — **Marketplace Listing Readiness** is the active Development closure candidate. It consumes the externally proven Build 105 closure and may not self-claim its own later exact-head acceptance.

Last fully verified Development is Build 105 — **Product Work Session Completion & Handoff**:
- `dev` `1ce61a319c0534ea386c64978f2ed58c3391470d`
- tree `045fa67ef20ee1aec9f87dfa6e2fd4cf02219690`
- System Gate `34631203672` SUCCESS
- Current Application Quality `34631203855` SUCCESS
- I.T. Admin Runtime Proof `34631203641` SUCCESS
- Repository Branch Hygiene `34631204122` SUCCESS.

Current Production is also Build 105:
- `main` `1ce61a319c0534ea386c64978f2ed58c3391470d`
- tree `045fa67ef20ee1aec9f87dfa6e2fd4cf02219690`
- Production Pages Deploy `34631390665` SUCCESS
- Production Live Resource Integrity `34631490953` SUCCESS.

## Build 106 scope

Build 106 adds browser-local per-Product listing readiness for Etsy, Facebook Marketplace, Pinterest and manual export. It checks hero image, image quality, title/description, dimensions/materials, price, inventory state, Canada shipping/local pickup eligibility, tags/category and existing readiness evidence. Copy and JSON download packs are explicit user actions for review/export preparation only.

The feature reuses `dd_admin_products_snapshot_v2` and readiness already rendered on the Products page. It adds no Product/readiness API/database read, Product/Inventory mutation, schema change, provider execution, marketplace publication or Production mutation. Build 105 handoff and all earlier Product workflow protections remain active.

## Autonomous direction after Build 106

Build 107 = Storefront Discovery & Collection Improvements; Build 108 = Mobile Workshop Assistant; Build 109 = Customer Proof & Fulfilment Follow-through; Build 110 = Storefront Evidence & SEO Conversion Audit. Build 111 = Orders-to-Fulfilment Reconciliation; Build 112 = Inventory/Material-Usage Reconciliation; Build 113 = Accountant/Month-End Evidence Depth.

## Restart rule

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 106 must pass exact merged-`dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene plus canonical Development D1/bindings proof and exact Preview smoke before any `main` promotion. Build 107 must ingest Build 106's final external closure.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CAD commerce remains authoritative, U.S. sales/shipping remain disabled, and local pickup remains supported.
