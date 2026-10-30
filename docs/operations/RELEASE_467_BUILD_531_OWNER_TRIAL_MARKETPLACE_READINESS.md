# Devil n Dove — Build 531 owner trial completion tracker and Marketplace readiness

30 October 2026 · Product Editor · `RosevearCreations/devilndove-site`

## Owner trial — genuine outcomes only

Build 530's existing one-to-three Product button now feeds a compact **Owner trial outcomes** summary. It shows the real result for every chosen saved Product, and whether the Product has:

- An authenticated live Etsy draft/image/tag readback and a current owner-signoff audit receipt for the exact evidence fingerprint.
- A read-only saved Product comparison to any matching prior failed browser Save snapshot. Missing browser history cannot prove the historic POST worked; differing fields remain HOLD.
- An independent, local-only Facebook Marketplace source-photo/destination review using `GET /api/admin/product-distribution-406?product_id=...&channel=facebook`.

Owner can copy the sanitized trial summary. It contains Product ID/name, saved Etsy Listing ID when confirmed, results and follow-up reasons; no OAuth tokens, passwords, customer data or network addresses. The report is not a new signed proof and is not automatically submitted to either marketplace.

## Marketplace manual draft preparation

The existing Facebook tab now offers an optional **Check original photos and manual Marketplace draft readiness** button. It checks one selected saved Product's authorized canonical gallery, selected photo IDs (1–10), public-use approval, alt text, image dimensions, positive CAD price, stock, saved channel preference, owner U.S.-shipping-disabled policy and source freshness through the established read-only endpoint.

If verified, the existing **Prepare saved Product listing text** action remains the manual copy-and-review handoff. **No Facebook Marketplace provider credentials or approved listing API were supplied.** Thus MANUAL_DRAFT_READY never means remote posting authorization, uploaded Facebook photos, a published listing or a verified Facebook draft. All provider POSTs remain disabled.

## Honest evidence boundary and release

The three newly failed soaps remain unidentified by exact Product IDs/SKUs in the owner conversation. Product #53's known Etsy draft #4603838854 and source photo IDs #344–346 remain a separate, not-yet-accepted case. No real owner acceptance receipt for the three soaps was supplied. Real review and a human sign-off are still required; tests and production-GREEN deployment cannot replace this evidence.

Tests: `node scripts/release467_build531_owner_trial_marketplace_readiness.test.mjs` and inherited current-system, Product Editor and Etsy regression tests. Release gate: four successful exact-SHA dev workflows, merged main, successful Production Pages Deploy and exact Build 531 `release-version.json` source SHA. QL integration HOLD remains separate.

**Next Build 532:** Owner-reported Product Save/Etsy discrepancy fixes, source-photo manual handoff polish and explicit Marketplace authorization decision.
