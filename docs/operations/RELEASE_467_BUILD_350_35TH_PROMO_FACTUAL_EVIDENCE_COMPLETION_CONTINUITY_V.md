# Release 467 Build 350 — 35th Promo Factual Evidence Completion Continuity V

Build 350 remeasures the 35th Promo factual-outcome lane from exact Build 349 Production GREEN and also completes the application-side Etsy Development OAuth connection hardening requested by the operator.

## Verified Build 349 predecessor
- Development SHA: `af5070400e0b9fb0da8be48753dcfef7737230b8`
- Shared tree: `c0f4a29f13d7f0bce5165f34a06c5140ec4f3ca1`
- System / Quality / I.T. / Hygiene: `37041295378 / 37041295310 / 37041295306 / 37041295409`
- Build 349 proof: `37041295359`
- Production main: `b4a2e20b96f7bbeea7a21136aa780d7425002891`
- Production Pages / Live: `37041638309 / 37041757924`
- Development and Production trees: **MATCH**.

## 35th Promo factual boundary
Only real setup/process/milestone/mistake/repair evidence, a real result, a real lesson, substantive Maker Story facts and a resolved factual outcome can make the project ready for explicit human review. No placeholder or missing-evidence statement is treated as completion.

## Etsy Development OAuth hardening
The approved Etsy Seller App now uses the three already-entered Cloudflare Preview references: `ETSY_API_KEYSTRING`, `ETSY_SHARED_SECRET` and `ETSY_REDIRECT_URI`. A fourth manual `ETSY_SHOP_ID` variable is not required for normal operation.

The authenticated admin **Connect Etsy** action starts Authorization Code + PKCE only on the Development host. After OAuth, Devil n Dove verifies the authenticated Etsy user, calls Etsy's owner-shop lookup, records only safe shop metadata in canonical migration 0029, and keeps access/refresh tokens encrypted by the existing OAuth authority.

Etsy remains in normal shop mode. The OAuth acceptance path creates, edits, activates, deactivates and publishes **zero listings**. Remote draft creation stays locked until a separately reviewed draft-listing acceptance step.

**Next after Build 350 Production GREEN: Build 351 — Grey Hair Source Review & Story-Plan Completion Continuity V.**

The future queue **has not run out**.
