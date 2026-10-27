# Build 502 — Existing Etsy listing owner verification repair

## Owner evidence and cause

The owner confirmed Etsy's **unpublished** listing editor exists for draft **#4603838854** (Product #53, Adventurine Argon), but the Devil n Dove **Verify and save Etsy listing ID** action reported `shop_owner_mismatch`. Both the existing-listing endpoint and the approved photo-upload endpoint omitted `remote_subject_id` from their OAuth connection SELECT. Their shared verification guard therefore compared `undefined` to the saved Etsy shop owner, causing a false mismatch even for correctly connected shops.

Both SELECTs now retrieve the account owner. The verification guard remains intact: a *real* mismatched account still blocks. No token, shop ID, listing record, photo, product, tag, shipping profile or remote Etsy field is changed by this code repair.

## Owner acceptance is still required

1. Confirm the Etsy connection belongs to the owner of the listing (do not assume a real mismatch is harmless).
2. Verify and link listing **#4603838854** once to local Product **#53**. Do not create another listing.
3. Verify the Etsy category (owner screenshots show **Bar Soaps**), description (shown as just **Adventurine Argon**), price (CA$10), quantity (10), maker information, processing and **Canada-only** shipping before any upload or public publication. Correct the authoritative local product and listing category when needed. The verified existing-draft link checks ownership/draft/shipping, not semantic category suitability.
4. Save at least one accurate Product search tag, then authorize the complete package only after every original photograph is approved for Etsy. Compare the saved originals **#344–346** against Etsy; the screenshots showed **zero** existing Etsy photographs.
5. Confirm the local Etsy ID and all three Etsy image readback receipts. Test a single revised product/photo Save and verify it updates that **same** draft. Keep Etsy draft **unpublished** until the owner approves it.

If another block surfaces after the identity projection repair, stop and report that precise block: expired OAuth, missing scopes, an actually different shop, mismatched shipping or an unconfirmed photo receipt must not be bypassed automatically.

## Regression verification

`node --test scripts/release467_build502_etsy_existing_link_media_owner.test.mjs`

Include all existing Etsy acceptance tests and the application quality gate. Production deployment green is separate from live Etsy Product #53 acceptance.
