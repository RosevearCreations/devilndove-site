# Devil n Dove — Sanity Health Check

Current fully verified checkpoint: **Release 467 Build 150 — Orders, Fulfillment & Buyer Communication Workspace**.

- Development SHA `33d46f701adb839525561114a31abcd29943d28f`
- Production main SHA `531e303d32d426d2db6986ec5c3d466455612ee3`
- identical tree `2f7add90d513a2e9548865f04d97e69b0ae3630e`
- System `34802545653`
- Quality `34802545673`
- I.T. `34802545668`
- Hygiene `34802545660`
- Production Pages `34802707901`
- Production Live Resources `34802759988`

Build 151 — **Gifting, Custom Work, Local Pickup & Event Selling** — is the active schema-free candidate.

Safety boundaries: gift/custom/event notes are descriptive context, not payment or inventory authority; the seller Custom Work command view is read-only; existing reviewed Custom Requests mutations remain on their current owner; local pickup uses the existing server-authoritative checkout path; cached/offline event state never reserves or decrements stock and never claims live sellability. Gift-card activation/redemption, payment/refund execution, accounting posting, provider calls, R2 mutation and request-time DDL remain outside Build 151.

Canonical D1 migrations remain `0001`–`0004`. Build 135 transient transport policy remains mandatory. External provider/evidence lanes remain separate.