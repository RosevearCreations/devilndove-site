# Release 467 Build 399 — Etsy Remote Draft Creation Preconditions & Controlled Trial

**Development closure candidate — NOT Production GREEN until exact CI and production integrity success.**

## Operator evidence from Build 398 screenshots
- Etsy shop **DevilnDove** stored ID **57459161**; local connection showed **refresh_due** (shop verification age zero days). A verified shop ID does NOT guarantee the current access token is usable.
- Product **#54 Bar Soap Sweet Orange**, **CAD $9.00**, stock **3**, successfully selected.
- Local-only Etsy staging draft exists; *no actual Etsy draft was uploaded or created during Build 398*. Screenshots also showed prior audit receipts for monitoring and price source missing.

## Build 399 functionality
- Exactly one operator-requested Etsy physical draft creation path, with explicit options read from Etsy first (Soap taxonomy, shipping, processing profiles), positive CAD price and inventory, and a matching existing local staged draft.
- Require the central verified active Administrator, matching connected Etsy shop owner, stored `shops_r` and `listings_w`, and an access token valid for at least 120 seconds. Refuse expired/refresh-due token rather than silently refreshing.
- Shop field names and IDs come only from the existing OAuth/D1 connection or live read-only Etsy metadata; do not infer IDs or create shipping profiles without authorization.
- Each remote attempt requires two separate checkboxes: **real unpublished draft authorization** and **no-retry acknowledgement**.
- A durable D1 audit claim is atomically inserted for the local draft ID *before* a single Etsy POST; a prior claim rejects all repeats. Unknown responses must be reconciled in the Etsy Drafts interface; do not blindly retry.
- Accepted response must identify a numeric `listing_id` and `state='draft'` before binding its remote ID to local `external_reference`.
- No Etsy publication/activation, automatic reauthorization, Product inventory or price writes, images upload, recurring jobs or schema creation.

## Release gate
- [ ] Exact-sha Build 399 source regression, System Gate, Quality, IT Runtime, Branch Hygiene, D1 Fan-Out GREEN.
- [ ] Development preview deploy GREEN for exact approved tree.
- [ ] Production main uses identical Git tree only, no force merge.
- [ ] Production Cloudflare deploy/public smoke and separate Live Resource Integrity GREEN.
- [ ] Real operator Etsy draft remains **pending** until authenticated browser actions and provider response. CI and deployment may NOT perform the provider POST.

### Previous exact Production GREEN
Build 398 dev `63f1591bc6d5f11dbfc77c03f9c136c3e7072174`, tree `0d2dd320ffcedd60e955988720ae534a7c94a759`, System 38602886926, Quality 38602886961, I.T. 38602886918, Hygiene 38602887221.
Build 398 production `c4d9c517ed296908b457f9bacc5f7306069a40f6`, Pages Deploy 38603217148, Live Integrity 38603435592.

Next proposed: **Build 400 — Etsy Remote Draft Provider Acceptance, Reconciliation & Listing Evidence.**
