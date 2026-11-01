# Devil n Dove — Build 561: TikTok Publishing & Draft Workflow

## Owner-facing change

The existing **Product Entry → Destinations → TikTok** card now has one **Prepare TikTok draft handoff** action. It opens a compact, closed-by-default TikTok panel and performs a local, admin-only readback **on request**. The panel shows:

- A reviewable, editable caption from the saved Product name, description and CAD price, with a **4,000 UTF-16 character** count and explicit copy action. Caption edits are local handoff edits, not silent Product saves.
- Only original Product photos passing the canonical cross-channel public-use, alt-text, safe HTTPS URL and 800×800-minimum dimension gate. The panel links to each approved original so the owner can save/upload it manually. At most the first 35 approved photos are presented for one handoff; the panel warns if more exist.
- Real saved OAuth status (no token material), separate `video.upload` and `video.publish` scope presence, and plainly labeled missing external verification prerequisites.
- **Open TikTok** for completing a new post or saving its draft within TikTok itself.

The packet is prepared from a saved Product when the owner requests it. Nothing is sent to TikTok. There is **no remote draft ID**, no provider inbox-upload receipt, and no remote post ID. A local OAuth token or database `api_ready` setting is never treated as independent publication authorization. Product changes invalidate any prepared local caption/photo review.

## Verified developer constraints

TikTok documents separate photo-post modes for direct publication (`video.publish`) and a media-upload handoff (`video.upload`). The photo API supports up to 35 images, and TikTok requires the app to verify the host/domain used for photo URLs. It also requires a current creator-settings read and an app audit before unrestricted direct publishing. A saved OAuth scope alone does **not** provide these live per-account proofs.

Official TikTok references:

- [Photo post / upload API reference](https://developers.tiktok.com/docs/en/content-posting-api-reference-photo-post)
- [Creator info query requirements](https://developers.tiktok.com/docs/en/content-posting-api-reference-query-creator-info)
- [Content Posting API getting started](https://developers.tiktok.com/docs/en/content-posting-api-get-started)
- [App review restrictions](https://developers.tiktok.com/docs/en/getting-started-faq)

Build 561 deliberately does not implement API uploads, POSTs to TikTok, or automated publishing. The necessary app audit, current creator account/privacy readback, media-host verification and authorized account-specific upload flow have not been independently established in this release.

## Owner walkthrough

1. Save the Product, then open [Product Entry → Destinations](https://devilndove.com/admin/product-editor/?product_id=54&tab=publishing).
2. On the TikTok card, choose **Prepare TikTok draft handoff**.
3. Review the saved description, current CAD price, approved original photo count and any missing evidence.
4. Adjust the caption locally if needed, keep it within 4,000 characters, then choose **Copy TikTok caption**.
5. Open approved original photo links and save the actual files as needed. Choose **Open TikTok** and create a new photo post using the content. Save a draft or publish after reviewing it **there**.

Do not mark a TikTok draft as created or published until TikTok itself confirms it. **This app has not uploaded or published it.**

## Verification and next build

Automated acceptance covers canonical approval filtering, source-only local data access, 35-photo and Unicode caption limits, zero API publication under even fully claimed OAuth settings, fail-closed missing facts, independent admin authentication, no provider request, and lazy UI load. Promotion requires exact `dev` workflow success, merged `main` workflow success and the matching live Build 561 release marker.

**Next: Build 562 — X & Pinterest Publishing / Draft Handoff.** Provide channel-specific saved content, verified manual handoff and explicit permission gates without unsupported direct-post claims.
