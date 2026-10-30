# Devil n Dove — Build 535: real Sweet Orange Etsy draft receipt, photo and tag walkthrough

## October 30 owner screenshots — what is established

- **Devil n Dove**: saved Product **#54 Bar Soap Sweet Orange**, SKU **DND-01131**, slug `bar-soap-sweet-orange`.
- **Etsy**: owner screenshot displays **Bar Soap Sweet Orange** as an **unpublished Draft**, category **Bar Soaps**, and an **empty Photo & video upload area**. The Etsy screenshot is real owner evidence that a draft is visible; it is not a fresh provider API read proving accepted images or shipping profile.
- **Devil n Dove later screen**: shows **Saved Etsy ID #4601705477**, but the main receipt check says **“Etsy returned a different listing ID from the Product primary claim. Expected Etsy draft ID was not found on the saved Product.”** That is a saved identity/readback discrepancy, not proof a new Etsy draft is needed. The displayed Update button must not be treated as authorized until the uniquely saved primary receipt matches.
- Previously viewed canonical Product images **#342 (1209 × 907)**, **#341 (1209 × 907)**, **#343 (1853 × 1391)** each pass the application's 800 × 800 minimum, but none of the photos shown on the saved Product can be assumed uploaded to Etsy merely because a separate gallery lists them.

## Exact product → Etsy ID reconciliation fix

Build 535 supplies candidate listing `4601705477` to the existing **GET-only** `/api/admin/product-etsy-existing-draft` primary receipt endpoint. This is required because the server can recover a **unique primary listing claim** from the exact listing ID even when a Product-key lookup misses it. The existing API only accepts the recovered link when its primary D1 receipt belongs **uniquely** to Product #54. It will still report a discrepancy for an unclaimed listing, duplicate claims, another Product's claim, or an unverified receipt.

The Update action now displays the exact Etsy ID only after the primary receipt verifier succeeds, and a candidate string alone never unlocks a provider update. The previous server-side live Etsy ownership, Canada-only shipping and draft-state verification still applies to every authorized POST. No automatic retry, publication, shipping mutation, Facebook POST or new Etsy listing is added.

## Owner steps — Product #54

1. Open `https://devilndove.com/admin/product-editor/?product_id=54` and confirm the exact Product identity.
2. In **Tags & SEO**, enter and **Save Product** search tags if missing. Save completion is local; it does not modify Etsy. Review the canonical media gallery, approved public-use permissions and alt text. Crop/framing is optional.
3. In **Create or update selected draft**, click **Verify saved Etsy ID (read only)**. Build 535 checks exact candidate `4601705477` against the primary D1 listing claim. If there is still no unique primary link, use **Inspect earlier Etsy draft and link it**. In Etsy Shop Manager confirm the same item, unpublished state, shop and Canada-only shipping, then complete the existing explicitly authorized inspection/link process. Do not create a second draft.
4. Click **Check saved Etsy ID + live photos and tags**. This action makes GET requests only, to the verified primary Product link, the **real Etsy listing-image inventory**, and the **real native tags**. It reports a count such as **0 of 3** if Etsy still has no photos, or “not verified” if the live read fails. Only real confirmed original↔Etsy image pairs qualify as accepted; zero images is never success.
5. When the real Etsy photo inventory has missing photos, select **Review safe missing-photo transfer**. The established **Sync missing original photos to Etsy** button works on only the *same linked unpublished draft*, requires photo approvals and a separate explicit consent, checks existing upload receipts and never retries an uncertain remote outcome automatically. If photos have already been uploaded manually in Etsy without app receipts, reconcile the existing photos; do not blindly upload duplicates.
6. Select **Review native Etsy tags** to compare live tags with saved Product SEO. Authorize a native tag update once only if they differ and the saved Product tags are correct. This is separate from image transfer.
7. Select **Compare photos for owner acceptance**. The proven owner visual comparison shows one saved original next to its actual Etsy photo. Owner signoff stays disabled until all required real image pairs have been checked and the owner explicitly approves a **local audit receipt**. That receipt does not publish or modify Etsy.
8. Finally return to the Etsy listing and confirm its category, Canada-only shipping, title, description, price, quantity, photos and tags. **Only Etsy itself publishes**. Keep the draft unpublished until independently reviewed.

## Marketplace manual listing closure

Product #54's one approved canonical gallery is the photo source for the local site and for the Marketplace handoff. **Prepare manual Marketplace handoff** uses only explicitly selected approved images and copies listing text. The owner must finish the Facebook Marketplace listing manually. Facebook API posting, sending, publication and unattended workflows remain unauthorized.

## What GREEN means

Build 535 source-gate, dev/main merge and live `release-version.json` determine **website-code production GREEN**. The owner-reported Etsy screenshot is not a fresh application-authenticated photo/tag result. Real live Etsy draft acceptance remains an owner action recorded only from verified provider receipts, not invented by a build marker.

## Next planned

**Build 536 — Saved Etsy Photo Transfer Receipt Reconciliation, Native Tag Update Verification & Owner Final Draft Sign-Off.**
