# Devil n Dove — Build 443 Product Editor Reliability & Unified Publishing Follow-Up

**Background:** Build 440's orange Etsy/blue Meta channel separation was already promoted on `main` before this request. Build 442's real unpublished Etsy Product #54 draft was owner-confirmed as present in Etsy (listing #4601705477). This follow-up extends the existing source Product and Etsy flow; it does not repeat Build 440 or supersede the proven draft.

## Implemented

1. **Etsy Product Editor media handoff:** Step 4 shows the existing Product's canonical approved gallery and its linked unpublished Etsy draft. The operator explicitly checks one owner confirmation and clicks **Transfer approved photos to Etsy Draft** once. The browser walks eligible images in the existing gallery order, sending one separate request per image, stopping at the first unconfirmed result. The server:
   - reads the real Product Gallery/annotations, verifies public-use approval, alt text, and >=800×800 dimensions;
   - requires originals stored under `products/{product_id}/...` in the configured R2 bucket, with JPEG/PNG file signatures and <=8 MiB;
   - checks the exact existing Product's recorded Etsy listing ID, *live* Etsy `draft` state, shop ID, and pre-existing image IDs;
   - rejects unknown remote images, unconfirmed prior uploads, another Product's images, unsupported image sources, and duplicate/concurrent claims;
   - atomically records each independent at-most-once claim *before* the corresponding Etsy upload and an accepted image ID afterward;
   - never activates a listing, edits shipping, overwrites an Etsy photo, retries an uncertain result, or uploads anything on load.
2. **Per-channel status:** Etsy Step 4 provides the linked draft ID, confirmed/pending/held image status; Meta retains a clearly disabled API-posting path and adds a copy-ready, operator-driven manual listing assistant with an official Facebook link.
3. **Simpler Etsy readiness:** category, shipping, processing and parcel *input choices only* may be restored from browser session storage for 12 hours. A deliberate **Test Etsy connection** also performs a fresh live Canada-only destination verification if the owner previously selected a shipping profile. No shipping proof or owner consent is restored, and no Etsy write happens in the background.
4. **Product Editor reliability:** a changed saved Product has a browser-session-only recovery snapshot (12 hours), explicit Restore/Discard controls, dirty-form protection before Retry load, a verified CAD save/read contract, and clearing of the temporary snapshot only on confirmed save. No server autosave or secret storage is introduced.
5. **No new D1 migrations or secrets.** Uses existing canonical media, Product, OAuth and audit tables, Cloudflare R2 binding, and Etsy's current `listings_r/listings_w` grant.
6. **Release gate repair:** the historical Release 465 inline-data-URI estimator counted all text after any JavaScript `data:` property as if it were an embedded image, causing an unrelated System Gate failure even while Product Editor tests passed. The parser now counts only actual inline `data:<MIME>,...` URI text. The unchanged 650,000-byte ceiling remains fail-closed, with a focused regression test.

## Owner acceptance (no automatic live uploads)

1. Open `/admin/product-editor/?product_id=54&tab=etsy` and scroll to **4. Add our approved Product photographs**.
2. Click **Load approved photos & Etsy draft status**. Confirm Etsy draft #4601705477 and ensure any intended Product images are approved `social_ok` / `all_public_ok` / `product_page_ok`, have useful alt text, measured resolution >=800×800, and are original JPEG/PNG files in the supported R2 gallery. If none qualify, prepare media in the existing Media tab. Do not fabricate image approvals.
3. Open the actual Etsy Drafts page and check for manually added images. An unexpected existing image is a deliberate HOLD, not a reason to overwrite.
4. Check the single explicit image consent box and click **Transfer approved photos to Etsy Draft**. Do not reload while transfer is in progress. Check image order and displayed images in Etsy.
5. If any result says HOLD / outcome unknown, stop. There is deliberately no automatic replay. Investigate live image IDs, audit receipts, and original R2 asset before designing a supervised recovery.

## Facebook Marketplace owner setup — step by step

### Option A — manual Marketplace listing (available without API secrets)

1. Sign in to the Facebook account that has Marketplace selling access; confirm Marketplace is visible and permitted for the account/product/location.
2. Open Devil n Dove's saved Product Editor → **Facebook Marketplace** → **Prepare saved Product listing text**; use Copy title, price (CAD), description.
3. Open https://www.facebook.com/marketplace/create/item (Facebook may require sign-in or a supported account and can change its navigation).
4. Choose the actual selling category and add the approved product photos manually. Paste title, description and Canadian price. Set only delivery/pickup choices we truly offer. Review Canada-only boundaries and Facebook's product and commerce policies; do not misrepresent country shipping capability.
5. Confirm details on Facebook and choose Facebook's own publication action only when ready. The Product Editor cannot claim the remote Marketplace listing ID or published state through this manual path.

### Option B — Meta Business/Commerce Catalog (optional, not automatically Marketplace)

1. Prepare a business-controlled Facebook Page and Meta Business Portfolio in Business Suite (https://business.facebook.com/).
2. In Commerce Manager (https://www.facebook.com/commerce_manager/), create a catalog and choose a supported catalog category. Confirm country, merchant and product eligibility in the live Meta interface.
3. Add products manually or through a supported data feed. A catalog item appearing in Commerce Manager **does not prove** an individual Facebook Marketplace listing was created. Do not activate the blocked Marketplace button in Devil n Dove based only on catalog presence.
4. If a supported business catalog API route becomes useful, confirm exact approved scope and business/catalog ownership before any implementation. No new secrets are required for manual Marketplace preparation.

### Option C — authorized programmatic Meta integration (only if Meta grants it)

1. Inspect Meta's current Marketplace Partner Program eligibility and official listing/seller API requirements: https://developers.facebook.com/docs/marketplace/partnerships/ and https://www.facebook.com/business/help/646509171194744. Access may be restricted to approved partners/business models; consumer or small seller accounts should not assume approval.
2. If Meta confirms our desired use case has an approved API, create or select a business app at https://developers.facebook.com/apps/ and verify ownership, business verification, exact product type, scopes, review requirements and permitted regions.
3. In Meta App Settings → Basic, copy App ID to Cloudflare Production `META_APP_ID` (plain variable); add App Secret securely as `META_APP_SECRET` (encrypted secret). Set `META_REDIRECT_URI` to **`https://devilndove.com/api/social/oauth/meta/callback`**, also configured exactly in Meta's OAuth Valid Redirect URIs.
4. Complete the approved login/OAuth flow through Devil n Dove **Admin → I.T. Integrations**, not by pasting access tokens into chat or GitHub. App ID/Secret by themselves do not grant Marketplace permissions.
5. For *Facebook Page posting* only (a different API), provide the verified numeric `FACEBOOK_PAGE_ID` and, only if the feature explicitly requires it, an authorized Page access token as the Cloudflare secret `FACEBOOK_PAGE_ACCESS_TOKEN`. Relevant Page scopes and review must be validated separately. Do not confuse Page posts, catalog entries and Marketplace sale listings.
6. In Devil n Dove **I.T. Integrations**, run the existing safe Production variable-presence check and Meta connection diagnostics. A variable showing PRESENT never establishes Marketplace listing authorization.
7. Do not enable direct Marketplace publishing until Meta approval, scope proof, sandbox/read-only identity checks and one owner-controlled test have been recorded. The current Facebook button remains disabled.

**Never paste app secrets, page tokens or access tokens into ChatGPT, GitHub issues, screenshots or the browser console.** Cloudflare environment configuration should be performed through the production project with variable/secret separation and no credentials committed.

### Primary references

- [Meta Marketplace Partnerships](https://developers.facebook.com/docs/marketplace/partnerships/)
- [Meta Marketplace Partner Eligibility](https://www.facebook.com/business/help/646509171194744)
- [Meta catalog data sources](https://www.facebook.com/business/help/384041892421495)
- [Meta Catalog API](https://developers.facebook.com/documentation/ads-commerce/catalog)
- [Etsy Open API: Listings and uploading an image](https://developers.etsy.com/documentation/tutorials/listings/)
- Existing repo: `docs/operations/RELEASE_467_BUILD_406_PRODUCTION_CONFIGURATION_AUDIT.md`

## Release contract

- Test commands: `node --test scripts/test_product_unified_publishing_443.mjs` and the retained Build 438–442 test suite.
- No live images were transferred by the build or tests. Etsy #4601705477 remains under human control.
- Build 443 does not promise Meta Marketplace API access or authorize Meta publication.
- Dev/Main promotion and Cloudflare Pages Production acceptance require exact SHA and current release-gate evidence; code changes alone are not Production GREEN.
