# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 150 — Orders, Fulfillment & Buyer Communication Workspace** is the current fully verified Development + Production baseline.

- Development SHA `33d46f701adb839525561114a31abcd29943d28f`
- Production main SHA `531e303d32d426d2db6986ec5c3d466455612ee3`
- identical tree `2f7add90d513a2e9548865f04d97e69b0ae3630e`
- System Gate `34802545653`
- Current Application Quality `34802545673`
- I.T. Admin Runtime `34802545668`
- Repository Branch Hygiene `34802545660`
- Production Pages Deploy `34802707901`
- Production Live Resource Integrity `34802759988`

Build 150 is sealed in `release467-build150-orders-fulfillment-buyer-communication-workspace.json` and is the restart authority for the next build.

## Active candidate

Build 151 — **Gifting, Custom Work, Local Pickup & Event Selling** — is the active schema-free candidate. It ingests the exact Build 150 six-proof closure above.

Build 151 extends the existing gift-card, checkout, custom-request, pickup and event surfaces rather than creating replacement backends. Gift intent can carry recipient, occasion, gift-wrap, requested-delivery and event/pickup context. The seller Custom Work view is read-only over the existing Operations Custom Requests authority; existing reviewed quote/payment/order mutations stay with their current owners.

Checkout continues to use the existing server-authoritative `fulfillment_type: pickup` path. Price, stock, shipping and tax are revalidated server-side. Event/offline context is descriptive only: it never reserves or decrements stock locally, never presents cached stock as live authority and requires a live checkout/reconciliation before a sale is considered authoritative.

Gift-card activation/redemption remains under existing gift-card/payment authorities. Build 151 adds no automatic provider send, payment capture, refund, accounting post, R2 mutation or request-time schema mutation.

Canonical D1 migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.

No candidate may self-record future proof. Build 151 must pass exact-head Development System/Quality/I.T./Hygiene, exact Preview/bindings/smoke, then non-force identical-tree promotion to `main`, Production Pages Deploy and Production Live Resource Integrity before it may be called Production GREEN.