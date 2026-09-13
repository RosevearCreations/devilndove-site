# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 148 — Seller Daily Command Centre** is the current fully verified Development + Production baseline.

- SHA `5a51981e7831bbef4f44c19f43a36b811e0a2e79`
- tree `f4e0a88f1f7c6837176a939a19e5d4ae36596434`
- System Gate `34772251480`
- Current Application Quality `34772251467`
- I.T. Admin Runtime `34772251459`
- Repository Branch Hygiene `34772251477`
- Production Pages Deploy `34772367891`
- Production Live Resource Integrity `34772410714`

Build 149 is the active candidate: **Seller Listing Manager & Fast Product Editing**. It ingests Build 148's external closure and remains schema-free. Safe local quick edits may persist with visible `waiting_to_sync` / `syncing` / `conflict` state, but publication, inventory, delete/archive and other high-authority actions require live authority.

The remaining buyer/seller UX programme is Builds 149–154: listing manager/fast editing → orders/fulfillment/communication → gifting/custom/pickup/events → activity inbox/cross-device continuity → UX/recovery analytics → cross-surface certification.

Canonical D1 migrations remain exactly `0001`–`0004`. Production live-resource retry behavior remains bounded to three transient attempts; permanent 4xx and genuine Product API/R2/photo/merchandising/D1 correctness failures remain blocking. Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.

No candidate may self-record future proof. Each build must pass exact-head Development System/Quality/I.T./Hygiene, exact Preview/bindings/smoke, then non-force identical-tree promotion to `main`, Production Pages Deploy and Production Live Resource Integrity.
