# Devil n Dove — Build 442: Etsy Calculated Shipping Measurements & Safe Draft Recovery

**Date:** 2026-10-23  
**Target:** `dev` → exact-tree `main` → Cloudflare Pages Production.  
**Scope:** Existing Product Editor's explicit unpublished Etsy draft flow only. No automatic
Etsy calls on page load, live listing activation, image upload, delivery-policy edit,
automatic retry, or Facebook/Meta publishing. No schema or D1 migration.

## Verified owner observation

Product #54 (`Bar Soap Sweet Orange`) reached `Verified: 1 Canadian destination(s),
with no foreign or worldwide destinations` after Build 441. The subsequent single
Etsy POST received HTTP 400: calculated shipping profile cannot be attached because
`item_weight`, `item_length`, `item_width`, `item_height`, `item_weight_unit` or
`item_dimensions` were missing. This is a **provider rejection**; the local audit
claim remains held and must never be silently deleted or retried.

## Changes

1. Orange Etsy section displays packed-parcel weight, length, width, height and
   explicit unit selectors (`g`, `kg`, `oz`, `lb` and `cm`, `mm`, `in`). The Product's
   saved catalog fields are not guessed or mutated; the operator enters real parcel
   measurements. Inputs are validated before enabling the draft button **and**
   validated independently server-side before any provider call or audit claim.
2. Every physical draft includes Etsy API fields `item_weight`, `item_weight_unit`,
   `item_length`, `item_width`, `item_height`, `item_dimensions_unit`. No `state=active`.
   The packaged values are preserved in the claim and successful draft receipt.
3. The existing one-attempt audit claim remains durable. A **single** second manual
   attempt becomes available only when the previous claim is exactly matched to a
   recorded HTTP **400** rejection (same Product, request key), an authenticated
   owner attests they reviewed Etsy Drafts and found no matching listing, and the
   server successfully enumerates a bounded live read-only `state=draft` listing
   result with no exact matching title. Failures, matching titles, incomplete lists,
   unknown provider outcomes and a second claim all remain on HOLD. Owner review
   adds an independent audit receipt; it never itself POSTs an Etsy listing.
4. The next explicit Create click verifies category, processing, Canada-only delivery,
   and remote draft absence again before atomically claiming a second (and final)
   attempt. No retry loop, background job, self-clearing ledger or audit deletion.

The listing scan deliberately fails closed above 300 drafts or on incomplete Etsy
responses. A title comparison is not absolute proof of uniqueness; independent
owner review of Etsy Drafts is required. A failed or ambiguous review remains a
manual support HOLD.

## Local acceptance

```
node --test scripts/test_product_etsy_draft_438.mjs scripts/test_product_etsy_endpoint_438.mjs scripts/test_product_etsy_recovery_442.mjs scripts/test_product_channel_assist_440.mjs
node --check functions/api/_lib/etsyProductDraft438.mjs
node --check functions/api/admin/product-etsy-draft.js
node --check public/js/admin-product-marketplace-drafts-v438.js
```

## Production operator acceptance (requires real owner measurements)

1. Open [Product #54](https://devilndove.com/admin/product-editor/?product_id=54),
   **Etsy** tab. Do not invent or reuse the example numbers shown in placeholders.
2. Enter **actual packed** soap parcel weight and all three dimensions, in the
   chosen metric units. Test the existing Etsy connection, choose the category,
   Canada-only shipping profile and processing profile, then Verify Canada only.
3. Under Rejected Attempt Review, open Etsy Drafts in another tab. If a matching
   draft exists, **do not** reconcile or create; preserve its listing ID.
4. If and only if **no matching draft** exists, check the separate owner attestation
   and click **Reconcile the rejected attempt**. A successful review returns a
   reconciliation receipt and zero remote writes.
5. Test the Etsy connection again, reselect verified options and confirm both
   owner checkboxes. Click **Create unpublished Etsy draft** exactly once.
6. Record the Etsy listing ID and check that the listing is in **Drafts** and
   remains **Canada-only**, with no publication or U.S. delivery enabled.

No Production claim is valid without an exact four-proof Development head, successful
Production Pages Deploy and matching Production Live Resource Integrity Proof.

## Etsy references

- https://developer.etsy.com/documentation/reference/ (createDraftListing fields)
- https://developer.etsy.com/documentation/tutorials/listings/ (drafts and shipping)
- https://developer.etsy.com/documentation/essentials/urlsyntax/ (`state=draft` listing query)
