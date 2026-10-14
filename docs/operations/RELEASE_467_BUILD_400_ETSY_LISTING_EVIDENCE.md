# Release 467 Build 400 — Etsy Remote Draft Provider Acceptance, Reconciliation & Listing Evidence

Software delivery and live Etsy provider acceptance are different gates. Deployment alone is not evidence of a remote Etsy listing.

Production operator flow:
1. In I.T. Integrations, stage a local Etsy Product draft and submit the one Build 399 unpublished Etsy trial only if explicitly intended. Do not repeat a previously claimed draft attempt.
2. In Build 400, select the local draft and click Read local claim (D1 only, no provider call).
3. For outcome-unknown requests, obtain the actual listing ID from Etsy Drafts. Do not guess the ID or retry the Etsy create call.
4. Click Verify Etsy listing (GET only). Check same shop, draft state, listing type, title, CAD price, and quantity. A real authenticated response is required.
5. Only if verified and explicitly acknowledged, reconcile the local external reference. This writes local D1 and a compact audit receipt, not Etsy.
6. If listing is not found, has changed, is published, or mismatches expected fields, leave it on manual HOLD.

Safety: no automatic provider calls, no provider mutation, no token refresh, no publication, no auto retry, no automatic Product changes, no new schema. GitHub CI cannot prove real provider acceptance.

Build 399 baseline dev 0badbe442cb22829544f6d4128ebe15e45ae3086, main f2937858cbcc0797992e95e36e2d0e9f5f65530b, Production Pages 38606326017, Live Integrity 38606480119.

Next proposed: Build 401 — Etsy Draft Image Readiness, Compliance Review & Controlled Listing Completion.
