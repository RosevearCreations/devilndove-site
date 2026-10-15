# Release 467 Build 402 — Etsy Image Upload Outcome Reconciliation & Final Operator Acceptance

This is a gated **local evidence-acceptance workflow**, not Etsy publication. Software CI GREEN does **not** mean an authenticated owner's real Etsy listing passed final inspection. No automatic Etsy creation, upload retry, title/price/inventory update, or activation.

## Steps in production
1. Visit https://devilndove.com/admin/it-integrations/ and choose the same Build 399/400 linked draft UUID.
2. In the Build 402 section, **Read local audit** (D1 only), then **Inspect Etsy** to perform two operator-requested GETs (listing and listing images). No provider calls during loading.
3. If Build 401 claimed an upload but did not store an Etsy-confirmed image ID, the outcome is **UNKNOWN**, even if a photo appears in Etsy. Pick the exact currently visible Etsy image ID, independently check the actual photo and storefront product, and explicitly **Reconcile prior uncertain upload**. The resulting ledger says **owner corroborated present**; it DOES NOT assert causal proof that our Build 401 POST uploaded the image.
4. For uploads with accepted Build 401 image receipt, the current GET must verify that exact image ID. For pre-existing images with no attempt, no upload-reconciliation action is needed.
5. Return to Build 401 **Record verified draft completeness** if the 401 manual compliance review receipt has not been saved or if a different image was reviewed.
6. Read/inspect again, approve all owner flags, select the exact current photo ID, and click **Record final local acceptance**. The endpoint repeats the provider GETs before writing one conflict-checked D1 audit receipt.
7. Visit Etsy Drafts and confirm the listing remains **draft**. Publishing, if ever wanted, is a separate future owner step; this build NEVER publishes.

## Fail closed
- Image upload claim without Etsy-confirmed receipt and no live photo: UNKNOWN/HOLD. **No retry**.
- Image upload claim without accepted receipt, but photo exists: owner must corroborate specific live image ID first.
- Accepted upload image ID missing from Etsy: HOLD.
- Missing 401 compliance receipt, review not for selected photo ID, mismatch in product/listing/shop, listing already active, or conflicting acceptance receipt: HOLD.
- Reconciliation and final acceptance use unique per-draft audit action types and idempotent insert-if-absent; no migration or change to Product, inventory, price, shipping, OAuth, or provider state.
- All owner attestation fields are server validated, not just client checkboxes. Server does not store tokens, raw images or provider credentials in audit details.

## Promotion proofs
Starting Build 401 Development GREEN: 8bf31afb5363bcde3d40481b99e2914752b12522, tree 252a7a1b1517b6c80975393fe2064e22d8a7b5da.
System 38661010327, Quality 38661010403, I.T. 38661010314, Hygiene 38661010377, D1 38661010283, Build 401 38661010381.
Starting Build 401 Production GREEN: 947d34f70cd5a496b4c2cc8c81718deb5b4f6c08, Pages 38661292359, Live Integrity 38661391832.

Next proposed: **Build 403 — Etsy Draft Review Exceptions & Owner Publication Decision Readiness.**
