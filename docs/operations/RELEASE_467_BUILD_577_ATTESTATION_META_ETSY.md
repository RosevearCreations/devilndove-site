# Release 467 · Build 577 — Independent Source Attestation Exception Review & Owner Acceptance Evidence Handoff

## Evidence status

The Build 576 provenance source is *documentary*, not an authenticated source-control signature. There are no independently verified owner-device observations, reviewer identity records or independent source attestations supplied for this build. The browser-local Admin packet must not infer acceptance from typed names, links, successful Production deployments or locally prepared attestation plans. **Owner device acceptance stays PENDING; no cases close automatically.**

Section 11 of `/admin/device-acceptance/` stages only a fully recomputed Build 576 provenance packet or one freshly derived from its local source and follow-up drafts. No direct provider API, D1 read or write occurs. Each open case uses a Build 577 pin across the original Build 569 observation, same-device Build 571 receipt, source references, Build 575 witness and the exact Build 576 external authentication plan. Changing source or follow-up invalidates previous attestation requests; stale requests are listed separately and cannot count as proof.

The available actions are **requests**, never approvals: same-device receipt, independent source attestation, reviewer identity evidence, signature/source-chain verification and conflict escalation. Optional source, reviewer and device-receipt locators provide manual work routing only. A full handoff retains the original Build 576 source, all attestation exception requests, stale pins, current blockers, `authenticated_attestations=0`, `verified_exception_closures=0`, `owner_decision_ready=false`, `owner_decision=NOT_RECORDED`, `owner_signoff=PENDING`, and zero provider/D1 operations. Real external attestations and owner acceptance require independent verification outside this local worksheet.

## Owner setup: three distinct Meta routes

1. Confirm the actual Devil n Dove Facebook Page and the Instagram Professional (Business/Creator) account in Meta Business Suite. Instagram's Facebook Login route needs the Instagram account connected to a Page.
2. Open [Meta for Developers](https://developers.facebook.com/) → **My Apps** → **Create App**. Choose the product/use cases for the Page and Instagram API; note its **App ID** and secret, but enter the secret only as a Cloudflare server-side secret.
3. Register the *exact* HTTPS OAuth redirect(s) used in the deployment. The existing I.T. provider setup advertises `https://devilndove.com/api/social/oauth/meta/callback`, `/api/social/oauth/facebook/callback` and `/api/social/oauth/instagram/callback`; use only the route that is implemented and selected in the actual authorization flow, and check the full URL in I.T. → Integrations. Store `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI` as appropriate. Do not invent a token or expose it in the product form.
4. For a Facebook Page, request Page scope/role access as currently documented (normally `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`). Verify the Page ID and resulting Page access token; do not use a personal access token as proof of Page publication permission.
5. For Instagram choose exactly one supported login family, without mixing scopes: **Instagram Login** uses `instagram_business_basic` and `instagram_business_content_publish`; **Facebook Login** uses `instagram_basic`, `instagram_content_publish` and the associated Page grants. Confirm correct Instagram professional account ID, media host, and valid token. Meta App Review/advanced access and business verification can be necessary for third-party users. Read-only connection checks precede one separately authorized test post.
6. For a Page post, prepare the correct business/Page identity, caption or message, product link and approved image URL(s). For Instagram, supply a publicly retrievable image (or video) URL and caption, create a media container, inspect its processing status, then separately authorize publish. Instagram captions and photo posts are **social content**, not Etsy-style unpublished shop listings.
7. For **personal Facebook Marketplace item listings**, no general seller posting permission is obtained merely by creating a Meta App. Use the existing manual handoff to open Facebook's listing form, select category/condition, CAD price, title, description, pickup or delivery details and actual original photographs. Contact Meta about marketplace partner eligibility only if the business qualifies. Commerce Manager catalog uploads are a separate channel and do not imply a Marketplace classified listing was created.

### Meta product fields to prepare

| Field | Facebook Marketplace manual listing | Facebook Page post | Instagram post | Commerce catalog if eligible |
| --- | --- | --- | --- | --- |
| Product title and description | Yes | Caption/message | Caption | Required item title/description |
| CAD price and category | Required by the selected listing form | Optional content | Optional caption | Required formatted price/category may depend on item |
| Real approved original images | Upload manually | Post image/URL | Publicly retrievable media URL | `image_link` |
| Condition, stock, delivery, location | Follow listing form | Optional context | Optional context | Condition/availability and applicable shipping |
| Product permalink | Optional in description | Useful link | Link in bio/content where supported | `link` required |
| Account/authorization | Seller account | Verified Page & token | Professional IG ID & token | Authorized Commerce Manager catalog |

For a catalog data feed, Meta commonly requires `id`, `title`, `description`, `availability`, `condition`, `price` (e.g. `29.00 CAD`), `link`, `image_link`, plus a brand/identifier according to the selected catalog contract. Review *Commerce Manager's validation results* before claiming availability for the store or country. No catalog feed is deployed by Build 577.

Primary references: [Meta's official Facebook API workspace](https://www.postman.com/meta/facebook/overview), [Meta's official Instagram API workspace](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api), [Meta's Facebook Marketplace Seller announcement](https://about.fb.com/news/2026/07/introducing-seller-app-facebook-marketplace/).

## Owner setup: Etsy new draft and image readiness

1. Register the seller app via [Etsy Open API v3](https://developers.etsy.com/documentation/tutorials/quickstart/). Store Cloudflare server-side `ETSY_API_KEYSTRING`, `ETSY_SHARED_SECRET` and `ETSY_REDIRECT_URI` set **exactly** to `https://devilndove.com/api/social/oauth/etsy/callback`. These values are not entered in a Product form. Use Etsy OAuth2 with PKCE and `shops_r`, `listings_r`, `listings_w`. The shop ID is discovered from connected shop identity and must not be guessed.
2. In **I.T. → Integrations**, connect the actual Etsy seller and check exact shop identity, current token, required grants, numeric category taxonomy and live Canada-only shipping/processing profiles. The current API requires `readiness_state_id` for physical listings; the existing `etsyProductDraft438.mjs` and form use it.
3. In **Products → Product Editor**, enter and save: Product title, detailed description, CAD price, quantity/stock, unique SKU, category (`taxonomy_id`), maker (`who_made`), era (`when_made`), whether it is a supply (`is_supply`), Canada-only `shipping_profile_id`, processing `readiness_state_id`, packed weight and parcel dimensions, category attributes, search tags and appropriate variations/personalization where used.
4. Store approved actual-product photos in the one Product gallery. The app's current floor is 800×800, while Etsy recommends at least roughly 2000 px width. For each original: valid JPEG/PNG, public-use permission, descriptive alt text and a verified R2 source; the server checks image signatures/8 MiB limit. Owner's target for photo preparation is 2000 px shortest side, 72 PPI, under 1 MB where practical, not a hard Etsy API limit.
5. **Before creating a draft**, inspect Etsy Shop Manager → Listings → Drafts for the same item; if it exists, inspect/link the numeric ID to the same Product and only use **Update Etsy draft #…**. If none exists, save the Product, tick Etsy, run the current package readiness checks and explicitly authorize **Create Etsy draft** once. Etsy's `createDraftListing` stays unpublished (`draft`); no automatic activation/publication occurs.
6. The existing owner-gated editor flow creates or updates the exact unpublished draft, transfers every approved gallery original **one image per acknowledged step** through `uploadListingImage`, stores the returned `listing_image_id`, re-reads Etsy's actual images, then reconciles native tags and saved Product identity. Unknown upload or creation outcomes remain **HOLD** and cannot be blindly retried. Never duplicate an existing draft or resend an image without a real receipt check.
7. For test acceptance, collect: matching Product ID/SKU/slug and genuine Etsy `listing_id`, Canada-only shipping and processing acceptance, live image count and each distinct image-ID match, live native tags, and explicit owner review. A local source test does not prove any of these remotely.

Etsy reference: [Create draft listing + image upload tutorial](https://developers.etsy.com/documentation/tutorials/listings/), [Open API reference](https://developers.etsy.com/documentation/reference), [Etsy listing field checklist](https://help.etsy.com/hc/en-us/articles/115015628707-How-to-Create-a-Listing).

## Implementation and test boundary

- Build 577 does not enable or trigger a new Etsy, Instagram, Facebook Page, Marketplace or Commerce POST.
- Existing Etsy draft/photo code is retained and checked by static contracts plus existing draft/media regressions; its actual OAuth/shop/media acceptance remains a deliberate subsequent owner trial.
- Build 577 changes the Admin acceptance worksheet and adds Product Editor setup notes; it does not configure Meta secrets or grant any Meta publishing permission.
- `dev` quality, runtime, exact route inventory, Preview smoke, `main` Production Pages marker and independent resource-integrity proof must all pass before `Production GREEN` is claimed.

## Next queued build

**Build 578 — Etsy & Meta Authenticated Connection Trial Receipts, Draft/Image Readback & Owner-Safe Channel Decisions.** Only proceed with provider-side writes after real account authorization and an explicit, scoped owner test instruction; Marketplace remains manual unless Meta grants a supported listing capability.
