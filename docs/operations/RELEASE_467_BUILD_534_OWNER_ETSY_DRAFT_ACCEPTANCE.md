# Devil n Dove — Build 534: Bar Soap Sweet Orange Etsy draft owner walkthrough

## Observed evidence, not a claimed successful Etsy write

The October 30 owner screenshot shows Product **#54**, **Bar Soap Sweet Orange**, SKU **DND-01131**, slug `bar-soap-sweet-orange`, with **Etsy listing ID not linked**. Its Etsy connection reports that the shop and category/shipping/processing choices loaded. The selected category is **Bath & Beauty → Soaps → Bar Soaps**; the chosen shipping profile says **Devil n Dove — Canada Only**. The **processing profile is still not selected**. The filled packed measurements are **180 g, 12 × 9 × 4 cm**. These are values entered in the editor, not independent evidence Etsy accepted the package.

The current check also says that at least one **saved Product search tag** must be provided before a native Etsy tag replacement. **No Etsy or Facebook write was made in the screenshot.**

An earlier owner trial reported actual Etsy draft **#4601705477** for this very Product. The current screen's missing local link does **not** establish that this old Etsy draft is gone. This historical ID is a **candidate only**: verify its live shop ownership, unpublished status, actual product identity and Canada-only shipping before linking. Build 534 prevents a new create from Product #54 while that previously reported draft remains unlinked. It does not insert an unverified Etsy ID into the primary database or fabricate remote acceptance.

## Edit this exact existing Product, then update its Etsy draft

1. In **Devil n Dove → Admin → Products**, open **Edit** for **Bar Soap Sweet Orange (#54)**. Check SKU `DND-01131` and the Product name.
2. Under **Storefront / SEO**, enter a few truthful **comma-separated Product search tags**, e.g. `sweet orange soap, handmade soap, citrus bar` (each Etsy-bound tag must fit Etsy's character/quantity rules). Press **Save Product** and wait for **Saved ✓**. This local Save does not upload to Etsy.
3. In the main **Create or update selected draft** panel, press **Inspect earlier Etsy draft and link it**. The app enters candidate listing **4601705477** in the already available existing-draft verification controls. **Nothing is linked merely by filling this field.**
4. Open **Etsy Shop Manager → Listings → Drafts** and check listing **4601705477**. Confirm that it is this soap, in the correct Etsy shop, still **unpublished**, with **Canada-only** shipping. If Etsy displays a different draft ID for the same soap, enter the actual ID instead; do not create a second draft. Tick **I checked this exact Etsy draft**, then press **Verify and save Etsy listing ID**. The application must inspect the actual remote listing and independently confirm the saved Product-to-Etsy database link. If it detects an older title, separately confirm only after personally comparing the product; if it detects another local Product owner, do not take that link.
5. The main panel should now display **Update Etsy draft #…** with the **exact verified ID**. The actual D1 receipt must confirm the same Product ID, SKU and slug. Do not press Create for this soap.
6. Under **Media**, inspect the **one shared canonical gallery**: images **#342 (1209 × 907)**, **#341 (1209 × 907)** and **#343 (1853 × 1391)** were previously visible. These already exceed the app's **800 × 800 minimum**. Etsy recommends an image with at least 2000 px on its shortest side for optimal quality; that recommendation does **not** require a square 800 × 800 crop. Use the optional visual image-framing editor for composition, explicitly save a replacement if desired, and confirm alt text and public-use permission. The saved originals, not a second duplicate photo list, are the source for Etsy and the local store.
7. A **new** Etsy listing needs verified **category**, **Canada-only shipping profile**, **processing profile**, and **actual packed** dimensions and weight. The screenshot's category, shipping and package measurements are already filled, but its processing selector is **blank**; if creating a genuinely new item, use **Select verified processing profile (new drafts)** to make that selection. For the already verified and linked #54 draft, these first-time fields are not a reason to create another draft; check the actual settings in Etsy during acceptance.
8. Press **Check images & Etsy settings**. Resolve any precise remaining tag/photo warning using the direct action buttons. Once saved Product identity, original photos and existing draft are verified, press **Update Etsy draft #…**, approve its **single explicit confirmation**, and await the **actual provider result**. If Etsy returns an uncertain partial result, inspect the actual listing and saved ID before doing anything else; do not blindly retry.
9. In **Etsy Drafts**, visually inspect the actual unpublished draft's title, category, shipping, price, quantity, description, tags and photos. The app may call a transfer verified **only after** the primary saved receipt and remote readbacks agree. **Nothing here publishes the Etsy draft.** Facebook Marketplace remains a separate **manual** listing handoff without authorized API posting.

## Release verification versus owner acceptance

Passing CI, merging dev/main and seeing the Build 534 production marker verifies only **the application code deployment**. Live owner Etsy draft update acceptance is a separate actual signed-in action: this document does not assert that #4601705477 currently exists, that the images have been successfully uploaded to it, or that a newly selected processing profile was saved. No fabricated live receipt is acceptable.

Automated Build 534 checks cover historical-ID safeguards, disabled duplicate creation, clear owner actions, gallery-source continuity, draft-only confirmation and the deployment marker. The app retains existing server-side Etsy remote verification and D1 primary receipts.

## Next planned build

**Build 535 — Verified Sweet Orange Etsy Draft Readback, Owner Tag/Photo Acceptance & Safe Marketplace Manual Listing Closure.**
