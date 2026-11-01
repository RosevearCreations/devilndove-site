# Devil n Dove — Release 467, Build 559: Unified Publishing Destinations

## Owner-facing workflow

Product Entry's **Destinations** tab now starts with one small, consistent dashboard. Four operations are deliberately separate:

1. **Save Product** records the canonical Product through the existing local Save button. It does not create or update posts anywhere.
2. **Update a draft** is available for an Etsy Product with a uniquely verified *saved D1 listing link*. Selecting *Review draft update* opens the existing guarded Etsy controls; the dashboard itself sends no draft update. Actual live Etsy state, shipping and photo permissions are still checked by the existing workflow.
3. **Prepare a handoff** copies accurate saved Product text and gives access to the shared Product Photos and chosen destination. No photo is silently uploaded.
4. **Publish externally** is the operator's deliberate action on the provider's own website, after the destination's terms and Product facts have been reviewed. The Product Editor does not represent an unapproved social API connection as a publishing capability.

Primary channel cards: Etsy, Facebook Marketplace, Instagram, TikTok and X. *More destinations* exposes Facebook Pages, Pinterest and YouTube. Each card shows the status of its local connection or draft claim, an explicit remote ID only when the saved Etsy claim is uniquely confirmed, a clear manual/draft action and a safe opening link.

## Evidence and performance policy

- `/api/admin/product-destinations-559?product_id=...` is an authenticated, read-only, first-primary D1 summary; it reads the existing Product, one Product's exact Etsy claim, redacted OAuth connection statuses and previously recorded destination intent. No provider fetch, token decryption, publication, OAuth refresh or new schema is performed.
- A local OAuth record never authorizes social publishing. Facebook Marketplace remains a manual handoff even if a separate Meta connection record exists. No TikTok, X, Pinterest, Instagram or Facebook Page publishing is enabled by this build.
- Etsy's saved listing ID is not a statement that the listing is currently a draft, Canada-only, ready, photographed or published. Those facts remain subject to actual live checks after opening the existing Etsy tools.
- The older Etsy preparation switches are under an optional disclosure. Opening Destinations loads only the lightweight local summary; the Etsy photo/OAuth reads start when the owner opens **Existing Etsy draft**. This avoids simultaneous origin reads that previously contributed to timeouts.
- If the Product is dirty, handoff and draft-review actions stay disabled until Save Product succeeds. A failed status read displays **unavailable**; it does not invent a provider status.

## Acceptance and regression

Build 559's automated regression checks exact Etsy receipt gating, no invented social remote IDs, expired/connected OAuth being merely local status, disabled provider publication, the scoped Admin UI, no backend provider calls and the deferred Etsy read. Release marker and prior Product Entry tests must remain green.

## Remaining queue

Build 560 deepens verified Meta/Marketplace/Instagram eligibility and account-specific handoffs. Build 561 follows for TikTok, Build 562 for X/Pinterest/additional providers, and Build 563 for remote reconciliation and safe recovery. This build intentionally avoids claiming those later integrations exist.
