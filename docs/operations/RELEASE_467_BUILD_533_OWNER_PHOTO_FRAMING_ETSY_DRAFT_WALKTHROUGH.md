# Devil n Dove — Build 533 owner walkthrough, photo framing and Etsy draft identity

## What the two owner screenshots actually show

- Product **#54 Bar Soap Sweet Orange**, SKU **DND-01131** is locally saved. The visible Product Editor reports **Etsy listing ID: not linked**. This is NOT proof that an older Etsy draft does not exist.
- Original Product gallery photos **#342 (1209 × 907)**, **#341 (1209 × 907)** and **#343 (1853 × 1391)** already pass the app's 800 × 800 *minimum*. Square crops of exactly 800 × 800 are neither required nor recommended for these images.
- Etsy's owner-provided [official image guidance](https://help.etsy.com/hc/en-us/articles/115015663347-Requirements-and-Best-Practices-for-Images-in-Your-Etsy-Shop?segment=selling) recommends at least **2000 pixels on the shortest side**, JPG/PNG/GIF, 72 PPI and images under 1 MB for faster transfer. This 2000-pixel recommendation is not an upload-proof override. Do not enlarge a low-resolution file and call it more detailed.
- The reported draft block was **“Etsy provider workflow has not loaded”**, an application-module initialization problem separate from photograph dimensions. Build 533 explicitly imports the Etsy package controller into the destination flow, so it finishes initializing before the draft readiness flow. This does not bypass OAuth authorization or Etsy's true remote validations.

## One simple owner edit and Etsy draft flow

1. Go to **Admin → Products → Edit** for the existing item, for example #54. Wait for the saved Product to finish loading.
2. Confirm the item name, SKU, description, price, available quantity and weight. Select the **Etsy** checkbox. Press **Save Product** and wait for **Saved ✓**. Local Save does not publish or send a listing to Etsy.
3. Open the **Etsy** section. Check the displayed **Etsy listing ID**. If it says **not linked**, first open **Etsy Shop Manager → Listings → Drafts** and look for an older copy of this SAME item. If one exists, press **Already have an Etsy draft? Verify its ID**, enter the exact Etsy listing number in the advanced existing-ID controls, and verify/link that unpublished Canada-only draft. **Do not create a duplicate.**
4. Review the **one shared Product photo gallery**. In the photo's own row, check image permission, alt text and dimensions. No second list and no re-upload is normally needed.
5. To improve composition, press **Choose square framing (optional)** on a gallery image. Drag the square over the important subject. Review the 1:1 crop preview. You may download a JPEG for manual use or explicitly **Replace this gallery photo with square crop**. Confirm the replacement; it updates only that Product image entry, with a checked D1 readback. The previous R2 object is preserved. If the image host prevents browser export, select the exact same source photo file on the computer. An edited square is **optional** and **does not** automatically upload to Etsy.
6. Complete the category, live Canada-only shipping and processing profile selections, and actual **packed** length, width, height and weight. Select verified Etsy values; no guessed package measurements.
7. Press **Check images & Etsy settings**. If the verified existing Etsy ID appears, choose **Update Etsy draft #…**. If there is genuinely no older draft, the **Create Etsy draft** action asks you to confirm that you inspected Etsy Drafts first. Approve the final owner-confirmation dialog once. Wait for a genuine saved listing ID and primary receipt readback; then check the actual photos and tags in Etsy's draft. Only Etsy itself publishes.
8. Facebook Marketplace remains **manual**: use **Prepare manual Marketplace handoff** and its selected approved originals. No Facebook Graph API write or automatic publication is authorized.

## Boundaries and verification

- Build 533 changes UI readiness, in-place visual square framing and owner instructions, not the remote Etsy OAuth connection or the original Etsy listing itself. An actual authenticated Etsy read and provider photo proof requires an owner-signed-in session.
- Every file-replacement write requires an explicit human confirmation, uses the existing verified-admin Product media route, and checks exact saved Product image ID and URL. A failed or uncertain upload must be inspected before a retry. Gallery scoring is requested separately and may require re-review.
- Source images that fail the app's original-photo dimensions/alt/rights checks are still excluded; a UI score is not authorization to publish or duplicate Etsy drafts.
- Verification: `node --test scripts/release467_build533_photo_framing_etsy_owner_walkthrough.test.mjs`, older Product Editor regressions, Python release gates, dev/main workflow checks, `release-version.json` production marker.
