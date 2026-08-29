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
- Release 450 focused source gate: **GREEN** before D1 activation.
- Marketplace provider publication: **closed**.
- Production `main` / live `devilndove-site`: **untouched / promotion closed**.

## Release 450 batch — 26 changes

The agreed 20–30 change batch is recorded machine-readably in `development-release.json`. Current implementation scope:

1. Move marketplace export schema ownership out of request handlers.
2. Move marketplace mapping schema ownership out of request handlers.
3. Add channel policy authority.
4. Add local listing profile authority.
5. Add listing validation snapshots.
6. Default all marketplace provider execution to disabled.
7. Keep Etsy publication disabled.
8. Prepare up to 20 Etsy listing images.
9. Prepare up to 13 Etsy search tags.
10. Prepare Etsy taxonomy / who-made / when-made.
11. Prepare Etsy shipping profile reference.
12. Prepare Etsy processing/readiness reference.
13. Prepare Etsy return-policy reference.
14. Prepare current typed Etsy personalization questions.
15. Support up to five prepared personalization questions.
16. Prepare up to three Etsy variation properties, with third-variation provider-go-live warning.
17. Correct Etsy configuration reference names without storing secret values.
18. Add Facebook/Meta local preparation policy.
19. Add Pinterest local preparation policy.
20. Add TikTok local photo/content preparation policy.
21. Add responsive `/admin/marketplace-readiness/` workspace.
22. Align marketplace export preview with the shared validator.
23. Preserve margin completeness as a local CSV blocker.
24. Require the public SEO structural gate in Release 450 acceptance.
25. Permanently document Development Cloudflare/D1/R2 connection mechanics for future chats.
26. Guardedly apply and independently verify Release 450 against exact Development D1.

Items 1–25 are source/documentation work; item 26 is the current database activation step after canonical gates are green.

## Marketplace architecture

Marketplace preparation is an overlay over existing authorities. It does not create another Product, Inventory, Accounting or media catalog.

Canonical inputs remain:

- Products/Product SEO;
- Product images/public-use consent;
- Inventory/costing/margin authorities;
- I.T. provider configuration references;
- Release 449 marketplace/provider setup rows.

Release 450 adds:

- `marketplace_channel_policies`;
- `marketplace_listing_profiles`;
- `marketplace_listing_validation_snapshots`;
- migration-owned legacy export/mapping tables previously created at request time.

Current migration:

`migrations/dev/20260829_release450_marketplace_seo_readiness.sql`

## Etsy readiness

Local draft preparation currently covers title, description, price, quantity, taxonomy, who/when made, tags, materials, physical/download type, shipping/processing/return references, images, personalization and variation metadata.

Release 450 deliberately does **not** perform Etsy OAuth or publication. `marketplace_syndication_drafts.publication_requested` remains zero and marketplace channel publication remains locked.

Real Etsy provider acceptance will later calibrate actual taxonomy/profile IDs and confirm current API behavior against the real Development/test provider context before any publication authority can be considered.

## Facebook / Pinterest / TikTok

Current release creates preparation/review policy only:

- Meta/Facebook — local catalog/listing preparation;
- Pinterest — local pin/catalog preparation;
- TikTok — local photo/content metadata preparation;
- no direct provider posting from Release 450 APIs.

Provider scopes, consent, privacy, creator/shop context and transaction acceptance remain I.T. acceptance work, not inferred from local readiness.

## SEO / responsive invariants

The public SEO structural gate remains mandatory and currently protects:

- exactly one source H1 per public HTML document;
- non-empty page title;
- no Home carousel H1 injection.

Release 450 admin marketplace pages remain `noindex,nofollow` and use responsive breakpoints. Marketplace preparation consumes canonical Product SEO/media truth rather than becoming a separate public SEO source.

Forward SEO depth after the Release 450 migration closes:

- broaden meta-description quality enforcement;
- review canonical URLs and structured data on public commerce surfaces;
- continue mobile/responsive CSS cleanup;
- keep one-H1 invariant on every new public page/component;
- ensure marketplace titles/tags never overwrite canonical public Product SEO automatically.

## D1 startup / transition rule

Read `docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md` before any database work.

Key rule: **a new chat is not a migration event**.

Read-only identity checks come first. Historical Release 447/448/449 migrations are not replayed. A current migration may be applied only after source gates and exact Development D1 identity pass, then must be followed by a separate read-only remote verifier.

## Canonical gate stack

The System Gate continues to run carried-forward Release 448 platform regressions plus current authority, Development transport, runtime-safety, SEO and PWA gates. Release 450 also has a focused gate:

```text
python scripts/release450_marketplace_seo_gate.py
```

It composes the real Release 449 migration plus Release 450 locally, checks foreign keys and channel locks, rejects request-time marketplace DDL, checks JavaScript syntax/responsive admin structure and runs the public SEO structural gate.

## After Release 450 D1 activation

Next operating work:

1. Read-only remote Release 450 verification.
2. Calibrate actual Development Products into Etsy-ready local drafts.
3. Resolve missing taxonomy/shipping/processing references and image/tag/material blockers.
4. Add marketplace/provider fee evidence into Accounting completeness where real transaction evidence exists.
5. Deepen public SEO metadata/canonical/structured-data checks.
6. Continue responsive storefront/admin CSS cleanup.
7. Complete Stripe test and PayPal sandbox acceptance.
8. Complete Etsy provider acceptance, then Meta/Pinterest/TikTok provider acceptance separately.
9. Complete CAIP private-media acceptance.
10. Keep Production closed until deliberate promotion review.

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
- Secrets stay in proper secret stores and their values never enter D1/source/handoff docs.
