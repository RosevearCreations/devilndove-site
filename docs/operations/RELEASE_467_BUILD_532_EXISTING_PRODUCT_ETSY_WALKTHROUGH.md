# Devil n Dove — Build 532: edit an existing Product and send ONE Etsy draft

30 October 2026 · `RosevearCreations/devilndove-site` · Production operator guide

This is the everyday workflow. We do not need to open the old technical HOLD/STOP panels unless a real error occurs. **Etsy draft** means unpublished; it is not a live listing. **Facebook Marketplace** is a separate manual handoff and has no connected posting API.

## Step by step on the website

1. Open <https://devilndove.com/admin/products/> and sign in as Admin. Find the existing item and choose **Edit**. Do not choose Add Product if the item already exists.
2. At the top of the Product Editor, check the permanent **Product #**, name, SKU and saved Etsy listing ID. The one-screen **Edit an existing item → Etsy draft** guide follows this Product. Use it to jump to the next field.
3. Open **Basics**, **Pricing & Stock**, **Description**, and **Tags & SEO**. Confirm the name, positive **CAD** price, stock at least one, actual item weight in grams, useful item description and relevant search tags. Etsy native tags can contain up to **13 phrases**, each up to **20 characters**. Save the item with its existing Product ID.
4. Open **Media** on the same Product. Review the already uploaded originals. Correct any missing descriptive alt text, dimensions (at least 800×800), and public-use permission. Save the approved gallery mapping for Etsy and the Canada-only destination. There is no reason to upload the same source images again into the Devil n Dove library.
5. Under **Where should this Product be offered?**, check **Etsy — create or update draft**. Leave Facebook unchecked unless a separate manual Marketplace preparation is wanted. Press **Save Product** **once** and wait until the editor says **Saved ✓**. A Save protects our local Product and destination choice; it is not proof Etsy has accepted a draft.
6. In **Create or update selected draft**, click **Check images & Etsy settings**. If this is a first Etsy draft, click **Load live Etsy categories and shipping profiles**; select a verified category, a **Canada-only** shipping profile, processing profile and enter the true weight/length/width/height of the *packed parcel*. These measurements are not the item's bare weight. Verify the current shop connection. If the Etsy shop needs reconnecting, visit <https://devilndove.com/admin/it-integrations/> and return to this same Product.
7. Check the exact target shown on the main button:
   - **No Etsy draft linked:** Check <https://www.etsy.com/your/shops/me/listings/drafts> to ensure an earlier draft does not already exist. Then use **Create Etsy draft**.
   - **Saved Etsy draft # shown:** Choose **Update Etsy draft #…**. That number is the existing listing; **do not create a second draft**.
8. Read the confirmation dialog and click **OK once**. The approved package flow sends saved text, original photos and native tags to that unpublished listing. Watch the real result; it may ask for a photo correction. If it does, fix only that issue, and inspect Etsy Drafts and its saved listing number **before** deciding whether any further write is safe.
9. Open <https://www.etsy.com/your/shops/me/listings/drafts>. Confirm this is the same Product, and visually check the **title, description, CAD price, quantity, category, native tags, every original photo, Canada-only shipping and unpublished state**. Back in our editor, use **Verify saved Etsy drafts, photos and tags** only if we want a separate live readback and owner audit receipt.

### Existing example — Bar Soap Sweet Orange, Product #54

Product #54 has appeared in earlier owner trials with an Etsy draft number **#4601705477**. That is *historical context*, **not** a fresh verified Production connection or current ID check. Open its saved Product, refresh the **Saved Product ↔ Etsy draft** identity and inspect actual Etsy Drafts. If draft #4601705477 is still the linked matching unpublished listing, use **Update**, not **Create**. The prior item price was CAD $9 and quantity 3; confirm today's saved values rather than copying them blindly. The item weight was 120 g; **measure the packed parcel separately**.

### What if we see an error?

| What appears | The one next action |
|---|---|
| **Product Save failed / uncertain** | Click **Review saved server copy (GET only)**. Keep the current server version or restore browser edits after comparing. Do not repeat a possibly completed Save blindly. |
| **Etsy categories / shipping choices do not load** | Check the connection at **I.T. → Integrations**, reconnect if required, then come back and explicitly load choices once. The Product stays intact. |
| **409 from Etsy draft endpoint** | A request was rejected due to identity, expired shop access, existing claim, shipping, or prior attempt. First read the visible specific error; check the same Etsy listing ID and Drafts. A 409 does **not** mean another draft should be created. |
| **Photo missing in Etsy** | Compare the exact original and live Etsy photos before any upload. Approve missing source metadata in Media; don't replace or duplicate a photo already on Etsy. |
| **Tags do not match** | Save shared Product search tags; use the existing verified Etsy draft's explicit native-tag compare/update only. |

## Facebook Marketplace authorization decision

**Manual draft preparation: YES. Automatic Facebook API posting: NO.** There is no proven, approved Meta listing API credential or account permission in this build. Checking Facebook in the Product selects a local destination only. **Prepare manual Marketplace handoff** reads Facebook's own approved photo selection and includes only those source photos; **Copy approved listing text** copies title, CAD price, description and secure image links for the owner to upload to Facebook manually. It does not publish, create a remote draft or request a posting token. The U.S. shipping restriction remains in effect.

## Exact verification boundary

The Build 532 release can be GREEN while a real customer's Etsy draft still needs an owner review. We did **not** receive the exact three failed soap Product IDs, authenticated current Etsy receipts or proof of real photo/tag acceptance for those soaps. We will not label them fixed in Etsy without that evidence. The legacy Product #53 owner-managed draft and its historical image claims remain undisturbed. QL six-app integration HOLD is independent of normal Etsy Product editing.

Changes: compact in-editor six-step guide; truthfully displayed existing draft path and same listing ID; Facebook-only preparation no longer fetches Etsy; Facebook handoff uses only selected approved photos and includes a one-click text copy; no automatic provider POST or unverified publication capability added. Regression tests: `node scripts/release467_build532_existing_product_etsy_manual_handoff.test.mjs` plus current Product Editor and Etsy suites.

**Next planned Build 533:** Owner Walkthrough Usability Verification, Live Draft Identity/Photo Receipt Recheck & Marketplace Manual Handoff Feedback.
