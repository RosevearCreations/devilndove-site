# Build 497 — Etsy Product #53 and three-channel card acceptance

This is an owner-operated **unpublished draft** workflow. A successful GitHub / Cloudflare deployment is not evidence of completed Etsy photo transfer, correct native tags, or Marketplace publication.

## Product #53 acceptance (Adventurine Argon)

1. Open `/admin/product-editor/?product_id=53`. Wait for the Product authority to finish loading. Save Product before any outbound action.
2. In **Media**, use the **same original Product images**, expected IDs **344–346**. Inspect each inline alt text, quality dimensions, and **explicit `all_public_ok` permission**. No second image upload is required for metadata corrections.
3. Under **SEO**, save relevant comma-separated keywords. Etsy supports up to 13 unique phrases, each at most 20 characters. Saving SEO never sends tags to Etsy.
4. Under **Etsy**, verify the linked existing unpublished **draft #4603838854** and its **Canada-only shipping profile**. Do not use Create Original for a linked draft.
5. Choose the read-only photo comparison. If existing untracked Etsy photos, missing accepted photos, a different draft identity, or an uncertain prior attempt are detected, **STOP and reconcile manually**. No photo replacement or automatic retry is permitted.
6. Only after qualifying originals and owner consent, use **Transfer approved photos to Etsy Draft**. Each photo uses one fenced attempt. The app now requires a fresh Etsy photo-inventory readback containing the returned image ID before recording success; an uncertain outcome permanently holds the automatic path pending manual review.
7. In **Native Etsy tags**, load saved Product tags, compare the real Etsy draft, review its existing tags, and explicitly authorize **replacing only tags** if required. A fresh Etsy listing readback must match; any ambiguous result is held.
8. Choose **Verify Etsy draft photos and tags (read only)** under three-channel acceptance. Green Etsy acceptance requires the shared canonical photo IDs, complete verified local receipts, live image-inventory agreement, native tag match and Canada-only unpublished draft identity.
9. The **store card** checks the saved source Product and gallery (not public checkout). **Facebook Marketplace** remains a **manual handoff**, not an authorized API listing or automatic publication.

## Safety boundaries

- This build neither creates another Etsy listing nor publishes any Etsy/Marketplace listing.
- No automatic photo transfers or tag changes occur on tab open, Product save or background refresh.
- The provider write controls require explicit owner approval, saved Product authority, and real connected-shop verification. One unconfirmed provider attempt blocks unguarded retry.
- Original R2 media must be a qualifying original JPEG or PNG for the existing transfer endpoint; unsupported formats remain held rather than silently fetched, re-encoded, or replaced. No new Cloudflare image-transformation cost is introduced.
- The actual state of draft #4603838854 cannot be accepted without a successful connected owner-session live read and, if needed, deliberate owner-initiated media and tag actions.

References: [Etsy Open API v3 reference](https://developers.etsy.com/documentation/reference/), [Etsy listings tutorial](https://developers.etsy.com/documentation/tutorials/listings/), [Etsy image requirements](https://help.etsy.com/hc/en-us/articles/115015663347-Requirements-and-Best-Practices-for-Images-in-Your-Etsy-Shop).
