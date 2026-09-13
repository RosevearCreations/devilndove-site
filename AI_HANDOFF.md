# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 149 — Seller Listing Manager & Fast Product Editing** is the current fully verified Development + Production baseline.

- SHA `6ff380f581bce93a42aacb982ba4c686baa5c5c4`
- tree `c1829f6371b3d5b7cd771f9f170260f53d5a7e08`
- System Gate `34776427862`
- Current Application Quality `34776427860`
- I.T. Admin Runtime `34776427885`
- Repository Branch Hygiene `34776427874`
- Production Pages Deploy `34776524835`
- Production Live Resource Integrity `34776571549`

Build 150 is the active candidate: **Orders, Fulfillment & Buyer Communication Workspace**. It ingests Build 149's exact six-proof Production closure and remains schema-free.

Build 150 consolidates the existing Orders list, order detail and Build 82 Operations-owned fulfilment workflow into one seller workspace. Search includes order ID/number, buyer, email, Product name and SKU. Packaging/internal notes and buyer-message drafts are device-local. Buyer messages are copy-only; there is no automatic outbound send. Packing slips print locally.

Live fulfilment transitions reuse the Build 82 transition owner and now carry stable `client_action_id` replay protection. Tracking is an explicit live audit handoff into existing `order_status_history`; it does not call a carrier, change payment/accounting state or notify the buyer. Uncertain transport outcomes remain queued locally for explicit retry with the same action ID.

Canonical D1 migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.

No candidate may self-record future proof. Build 150 must pass exact-head Development System/Quality/I.T./Hygiene, exact Preview/bindings/smoke, then non-force identical-tree promotion to `main`, Production Pages Deploy and Production Live Resource Integrity before it may be called Production GREEN.
