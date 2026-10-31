# Release 467 — Build 558: Sweet Orange Product #54

## Outcome and boundaries

The Product Editor now distinguishes **a saved recipe**, **a physical-batch owner acceptance receipt**, **an exact local Etsy draft link**, and **three real Etsy image-ID readbacks**. It never treats one as proof of another.

- Recipe acceptance is made by the signed-in owner only after selecting the actual saved soap base, fragrance and optional oil, checking the ingredient order and unpackaged bar weight, ticking physical-batch confirmation, and using **Save Product**. The official soap save writes the matching owner receipt in the same D1 batch. The readback accepts the receipt only if the saved project ID, materials, ingredient sequence and weight still match. The Sweet Orange/Sea Breeze contradiction cannot be accepted by the server.
- The reported existing Etsy listing is **#4601705477**, but a screenshot/typed number is not a confirmed link. **Verify existing draft** checks the live Etsy listing, owning shop, unpublished state and Canada-only shipping. **Connect verified draft** saves the exact uniquely claimed Product-to-listing link; no second draft is created.
- Sweet Orange has precisely the approved originals **#342, #341 and #343**. After the draft is linked, **Refresh draft and photos** checks the actual Etsy inventory. The owner sees `0 / 3`, `1 / 3`, ... or `3 / 3` based on independent original→Etsy image-ID pairs, not a local upload attempt. Only the three specified originals can be transferred. Every upload is an explicit, one-shot action to that exact unpublished listing. Any uncertain claim, unknown remote image, missing original, wrong listing or inaccessible Etsy provider results in HOLD and no retry.
- A valid `3 / 3` is **photo-readback evidence, not a listing publication**. The owner still approves and publishes in Etsy. No provider write, recipe rewrite, photo transfer or publication is triggered by opening the page, verifying evidence, saving local Product fields or deployment.

## Owner walkthrough after the production deploy

1. Open `/admin/product-editor/?product_id=54&tab=ingredients` and confirm the real scent, base, label ingredients and **unwrapped 180 g only if actually measured**. Check the confirmation box and **Save Product**. If the actual ingredients are not known, stop; do not guess.
2. In **Destinations**, enter/verify existing Etsy draft `4601705477`, check the real shop, unpublished listing and Canada-only shipping, then click **Connect verified draft**. If a different draft is already linked, stop to resolve the identity conflict; never create a duplicate.
3. Review the three approved originals and the `x / 3` live photo status. If a verified zero/partial inventory has no upload HOLD, explicitly consent and click **Send missing verified originals to Etsy draft**. If a photo has an uncertain prior claim, inspect the actual Etsy draft manually before any attempt.
4. Require `3 / 3 verified on Etsy` and inspect the photographs in Etsy's editor before making a separate manual publication decision.

## Release acceptance

The automated Build 558 regression covers recipe snapshot changes, recorded owner identity, wrong Etsy listing, missing/extra originals, unconfirmed prior uploads, unreconciled live inventory and duplicated remote image IDs. The production release marker must report `build: 558`, `branch: main`, the deployed `main` SHA and the successful GitHub production workflow ID.

**Important:** Build 558 release GREEN does not itself establish physical-batch owner acceptance or the live remote photo state. Those require a signed-in owner and actual Etsy API evidence, respectively; they remain pending until independently observed.
