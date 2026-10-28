# Devil n Dove Build 516 — Existing Etsy Draft and Original-Photo Sync Recovery

## Owner problem

Product #53 (Adventurine Argon, SKU `DND-01130`, slug `adventurine-argon`) has three saved, public-use-approved original gallery photographs, IDs **344, 345, 346**, but the Etsy tab showed **0/3 locally verified Etsy receipts** and contradictory linked/unlinked status. The only Etsy target is the existing **unpublished draft #4603838854**. Seeing local thumbnails did **not** prove those photos were already uploaded to Etsy.

## Shipped behavior

1. The verified Product↔Etsy listing ID stays visible even if an old media/shipping cache lacks a Canada-only receipt flag. Missing historical flags **never** independently authorize a transfer: every transfer still authenticates to Etsy and checks that the exact draft belongs to our connected shop, remains unpublished, and uses a verified Canada-only shipping profile.
2. The existing-photo reconciliation endpoint reads the same D1 primary as the saved Product ID. It requires exactly one primary Product↔listing claim, the current Etsy draft and live images. A previously uncertain upload can be safely reconciled by an explicit owner-witnessed exact live photo match; the audit records which earlier claim was reconciled. A witness does not silently assign unobserved images.
3. The Etsy tab now has a deliberate **Sync missing original photos to Etsy** action, separate from full text/tag metadata update. A Product description/tag issue is no longer a blanket block on approved media. All gallery images must still have original image IDs, public-use consent, sizes, alt text, transferable R2 JPEG/PNG bytes and no unresolved provider claim.
4. Before an image upload, the server reads Etsy's **actual existing images and verified receipts**. Untracked live Etsy photos lead to the optional exact-photo matching UI, not blind uploads. When no unexpected photos or claims remain, the server claims each transfer once, uploads `overwrite=false`, and requires a provider image ID plus a second live Etsy image read before saving the acceptance receipt. Partial or uncertain results remain HOLD and must not be retried blindly.
5. After the photo-only operation, a fresh live reconciliation must show the same exact listing and all originals verified with no untracked, absent or outstanding photos. The UI reports the actual count; it never claims success merely because local photos are visible.

## Safety and open real-owner trial

- No new listing is created by this photo action, and it **never** sets the draft active or publishes it.
- No historical receipts are erased, and a foreign listing receipt or an uncertain upload still requires independent review.
- No real Product #53 media transfer was performed in CI. **Actual Etsy 3/3 acceptance remains unverified until the owner runs the authenticated workflow on the live draft.** The live session, connected OAuth, R2 original bytes, and Etsy's real remote image inventory cannot be inferred from screenshots or local code tests.
- To trial: open Product #53 → Etsy, verify draft #4603838854 and the approved three originals, check the owner consent, choose **Sync missing original photos**. If Etsy shows existing photos instead, open the “Photos are already on Etsy?” section, visually match each identical original once, and then repeat the inventory read. Do not publish until Product description/category/tags and Canada-only shipping are separately correct.
- The QL-248 cross-application two-SHA concept remains **unapproved/disconnected**; this change does not enable any gateway connection, credentials, dispatch, product or customer data access.

## Verification

`scripts/release467_build516_etsy_photo_sync.test.mjs` covers separate media readiness, same-primary numeric listing readback, strict exact draft target, safe duplicate/at-most-once fences and the new explicit UI. Historical Build 500/505/515 tests and the full application quality gate must still pass before promotion.

**Next proposed Build 517:** Live owner Etsy photo-transfer receipt verification, Product #53 correct item description/tags acceptance and the final simple-draft update retest.
