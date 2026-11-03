# Release 467 · Build 578 — Etsy & Meta Authenticated Connection Trial Receipts, Draft/Image Readback & Owner-Safe Channel Decisions

## Delivery and evidence boundary

Build 578 adds `/admin/channel-trials/`, linked from the Admin dashboard. The standalone worksheet permits browser-local notes about account connection, Etsy draft ID, remote image-ID readback and Meta/Page/Instagram follow-up. Its readback always distinguishes **user-entered observations** from authenticated receipts. Entering an ID, URL or note does not establish authenticated account identity, image match, successful API response, provider write authorization or owner acceptance. No Etsy/Meta API call, D1 query, external upload or publication occurs in this build.

The trial remains **HOLD** until actual Etsy shop/Meta account OAuth and scopes are confirmed, true server-side provider receipts are captured and independently reconciled, and our owner authorizes the precise account, product and test action. An unknown previous draft-create or image-upload outcome must be read back before retrying. The existing owner-gated Etsy draft/image implementation is preserved, not exercised here. Facebook Marketplace stays manual unless Meta separately grants an applicable supported integration.

## Acceptance checklist for a later explicitly authorized trial

1. Identify the actual Etsy shop or Facebook Page/Instagram Professional account and confirm scope, token validity and precise provider account ID using the existing I.T. Integrations screen.
2. Etsy: inspect actual draft listing ID associated with Product SKU and title, shipping and readiness profiles, native tags and image IDs. Compare each distinct uploaded image ID to the source gallery; a count of three alone is not enough.
3. Meta: distinguish a Page post and Instagram media container/publish workflow from a Facebook Marketplace manual classified. Verify a public media URL and professional identity before any separately approved post.
4. On failed/unknown outcomes, stop for readback; do not create a second Etsy draft, resend images or automatically publish.
5. Supply redacted authenticated server response identifiers and independently checked evidence to owner acceptance. Only then make a separately recorded owner decision. Do not place credentials or customer data in the local worksheet.

## Next queued build

**Build 579 — Authenticated Provider Trial Evidence Reconciliation & Exact Listing/Image Exception Closure Readiness.** Conditional on genuine test receipts and scoped owner approval; without those inputs, preserve HOLD and collect owner findings rather than inventing proof.
