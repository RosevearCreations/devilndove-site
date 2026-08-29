# Project Status and Roadmap — Release 450 Marketplace & SEO Readiness

Updated: 2026-08-29

`development-release.json` is the machine authority. `AI_HANDOFF.md` is the compact human handoff. `docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md` is the permanent D1/R2 startup authority.

## Current Development position

- Release: **450 — Marketplace & SEO Readiness**
- Source: `dev`
- Development Pages: `devilndove-site-dev`
- Development D1: `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- Development account ID is pinned by tooling/GitHub Actions, never by `wrangler.toml account_id`.
- Release 447 baseline: applied/verified Development.
- Release 448: carried-forward regression authority.
- Release 449: **complete, applied and independently verified in Development**.
- Release 450: **26-change source batch implemented; additive D1 migration applied and independently verified in Development**.
- Release 450 evidence: focused source gate `33235447861`; canonical pre-mutation System Gate `33235674706`; guarded D1 mutation `33235769850`; read-only D1 verifier `33235803838`.
- Marketplace provider publication/execution: **closed**.
- Production `main` / live `devilndove-site`: **untouched / promotion closed**.

## Release 450 batch — 26 changes complete

1. Marketplace export schema ownership moved out of request handlers.
2. Marketplace mapping schema ownership moved out of request handlers.
3. Channel policy authority added.
4. Local listing profile authority added.
5. Listing validation snapshots added.
6. All marketplace provider execution defaults locked off.
7. Etsy publication remains disabled.
8. Etsy preparation supports up to 20 listing images.
9. Etsy preparation supports up to 13 search tags.
10. Etsy taxonomy / who-made / when-made preparation added.
11. Etsy shipping-profile reference added.
12. Etsy processing/readiness reference added.
13. Etsy return-policy reference added.
14. Current typed Etsy personalization preparation added.
15. Up to five prepared Etsy personalization questions supported.
16. Up to three Etsy variation properties prepared, with provider-go-live warning for the third variation.
17. Etsy configuration reference names corrected without secret values entering source/D1.
18. Facebook/Meta local preparation policy added.
19. Pinterest local preparation policy added.
20. TikTok local photo/content preparation policy added.
21. Responsive `/admin/marketplace-readiness/` workspace added.
22. Marketplace export preview aligned with the shared readiness validator.
23. Margin completeness retained as a local CSV blocker.
24. Public SEO structural gate required in Release 450 acceptance.
25. Development Cloudflare/D1/R2 connection mechanics permanently documented for future chats.
26. Release 450 guardedly applied and independently verified against exact Development D1.

## Development D1 evidence

Current migration:

`migrations/dev/20260829_release450_marketplace_seo_readiness.sql`

Status: **applied_and_verified_development**. Do not replay it.

Mutation workflow `33235769850` proved the exact D1 identity, passed the blind-replay guard, preserved Product count and the existing Accounting authority-table inventory, and applied only Release 450. No Release 447/448/449 migration was replayed.

Verification-only workflow `33235803838` then independently proved:

- all Release 450 marketplace tables/policies required by the snapshot;
- all provider-execution locks remain closed;
- Etsy exact local policy: draft-only, 20 images, 13 tags, 3 prepared variations, 5 personalization questions;
- Etsy marketplace publication remains disabled;
- TikTok remains local preparation only;
- Release 449 core authority remains intact;
- existing Accounting authorities remain visible;
- provider setup contains no credential-value columns;
- no provider/Production mutation capability exists in the verifier.

## Marketplace architecture

Marketplace preparation remains an overlay over existing Product/Product SEO/media/Inventory/costing/I.T. authorities. It does not create another Product, Inventory, Accounting or media catalog.

Release 450 adds/normalizes:

- `marketplace_channel_policies`;
- `marketplace_listing_profiles`;
- `marketplace_listing_validation_snapshots`;
- migration-owned marketplace export/mapping tables previously created during requests.

## Etsy readiness

Local draft preparation covers title, description, price, quantity, taxonomy, who/when made, tags, materials, physical/download type, shipping/processing/return references, images, personalization and variation metadata.

Release 450 deliberately does **not** perform Etsy OAuth or publication. `marketplace_syndication_drafts.publication_requested` remains zero and publication remains locked.

Real Etsy provider acceptance will later calibrate actual taxonomy/profile IDs and confirm current provider behavior before publication authority can be considered.

## Facebook / Pinterest / TikTok

- Meta/Facebook — local catalog/listing preparation only.
- Pinterest — local pin/catalog preparation only.
- TikTok — local photo/content metadata preparation only.
- No direct provider posting from Release 450 application APIs.

Provider scopes, consent, privacy, creator/shop context and transaction acceptance remain I.T. acceptance work.

## SEO / responsive invariants

The public SEO structural gate remains mandatory and protects:

- exactly one source H1 per public HTML document;
- non-empty page title;
- no Home carousel H1 injection.

Release 450 admin marketplace pages remain `noindex,nofollow` and responsive. Marketplace preparation consumes canonical Product SEO/media truth rather than becoming a competing public SEO source.

The Release 450 marketplace/SEO gate is now part of the canonical System Gate, in addition to the dedicated public SEO step.

Next SEO depth:

- broaden meta-description quality enforcement on important public/commerce pages;
- review canonical URLs and structured data;
- continue mobile/responsive CSS cleanup;
- preserve one-H1 on every new public page/component;
- keep marketplace title/tag overrides separate from canonical public Product SEO unless deliberately approved.

## D1 startup / transition rule

Read `docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md` before database work.

Key rule: **a new chat is not a migration event**.

Read-only identity checks come first. Releases 447/448/449/450 are already Development history/authority and must not be replayed because the conversation or workstation changed. A future new migration requires source gates, exact Development identity, one guarded additive mutation, then a separate read-only verifier.

## Next operating work

1. Calibrate actual Development Products into Etsy-ready local drafts.
2. Resolve missing taxonomy/shipping/processing references and image/tag/material blockers.
3. Deepen public SEO metadata/canonical/structured-data checks.
4. Continue responsive storefront/admin CSS cleanup.
5. Add provider/marketplace fee evidence into Accounting completeness where real evidence exists.
6. Complete Etsy provider acceptance, then Meta/Pinterest/TikTok provider acceptance separately.
7. Complete Stripe test and PayPal sandbox acceptance.
8. Complete CAIP private-media and authenticated Development runtime acceptance.
9. Keep Production closed until deliberate promotion review.

## Non-negotiable invariants

- One current release: 450.
- Production untouched unless explicitly authorized.
- No `account_id` in `wrangler.toml`.
- No historical migration replay because a chat/workstation changed.
- D1 is schema/write authority; request handlers do not invent marketplace tables.
- Existing Product, Inventory, Accounting, media, Tool and Supply authorities remain canonical.
- Provider configuration readiness is not provider acceptance.
- Provider publication stays closed until explicitly accepted.
- One meaningful H1 per public page.
- Secrets remain in proper secret stores and their values never enter D1/source/handoff docs.
