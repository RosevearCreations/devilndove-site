# Devil n Dove — Build 560: Facebook Marketplace, Facebook Pages & Instagram

## What changed

The existing Product Entry **Destinations** tab shows the three Meta destinations together. For each destination, the owner can prepare saved Product text, view the Product gallery and open the appropriate external service. A short, closed-by-default **Meta account & approved photo checks** section provides explicit local evidence review without slowing initial Product Entry page load.

An administrator presses **Check Meta readiness** on a channel card or **Check Meta handoff readiness** in the disclosure to fetch a bounded, primary-D1 readback (`GET /api/admin/product-meta-readiness-560?product_id=...`). It identifies the saved `meta` OAuth connection without reading or transmitting secrets and offers only canonical Product originals whose cross-channel approval, dimensions, alt text and URL have all passed the existing distribution gate. Its links open the original files for the owner to save and upload manually. The API is administrator-only, read-only, and has no POST route, Meta Graph request, draft mutation or provider upload.

## Destination truth table

| Destination | Build 560 operation | Provider publication | Important distinction |
| --- | --- | --- | --- |
| Facebook Marketplace | Copy text, review approved photo originals, open **Create Item**, publish there | **Manual only** | A Facebook OAuth connection is **not** permission to create Marketplace listings programmatically. |
| Facebook Pages | Copy text, review approved originals, open Meta Business Suite, publish or schedule on the Page | **Manual only** | Local OAuth scopes and `api_ready` configuration do **not** establish live Page identity, app review or posting authority. |
| Instagram | Copy caption, review approved originals, open Meta Business Suite, publish or schedule for the correct professional account | **Manual only** | Professional-account identity, content-publishing permissions and a live result receipt remain unverified. |

An approved Product image is never treated as successfully transferred to Meta. Images without cross-channel public-use approval or qualifying image metadata are withheld from the handoff; the screen explains the gap. No `remote_post_id` is fabricated, and neither posting nor a professional account connection is implied by a saved OAuth token.

## Owner walkthrough

1. Open [Product Entry — Destinations](https://devilndove.com/admin/product-editor/?product_id=54&tab=publishing). Save the Product if it contains unsaved changes.
2. Choose **Check Meta readiness** for Facebook Marketplace, Facebook Pages or Instagram. Inspect the approved-photo count and any account or permission warnings.
3. Choose **Prepare manual handoff** on the intended destination card to copy the current saved Product text.
4. Open each approved original photo link, save the original(s) locally if necessary, then choose **Open Facebook Marketplace**, **Open Facebook Pages** or **Open Instagram**. Attach the originals in that provider's own composer.
5. Check the intended account, content, region and delivery settings. Publish or schedule only on the provider after owner review. Build 560 does not publish or record remote success automatically.

## Acceptance and promotion

- Automated tests prove role-gated GET, primary-D1 SELECT-only execution, no provider call, no publish, guarded scope status, withheld unapproved photos, honest Marketplace manual state, and Meta panel lazy loading.
- Build 560 is not an acceptance of actual Meta account permissions or an assertion that a remote post was created. These require later independent provider verification and an explicit authorized implementation.
- Promotion requires exact-SHA `dev` checks, merged `main` production workflow success and the matching `release-version.json` Build 560 readback.

**Next build: 561 — TikTok Publishing & Draft Workflow.** Prepare media and captions with a clear manual draft handoff; block API publishing unless the account, app approval, permissions and live posting pathway are verified.
