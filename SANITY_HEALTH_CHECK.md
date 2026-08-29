# Devil n Dove — Sanity / Health Check

## Current release
**Release 459 — Authenticated Development Acceptance & Provider Setup Authority**

## Hard boundaries
- [ ] Source branch is `dev`.
- [ ] Pages target is `devilndove-site-dev`.
- [ ] Development URL is `https://devilndove-site-dev.pages.dev`.
- [ ] D1 binding is `DB`.
- [ ] D1 is exactly `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- [ ] `PRODUCT_MEDIA_BUCKET` points to `devilndove-toolshed-images-dev`.
- [ ] `CAIP_PRIVATE_MEDIA_BUCKET` points to `devilndove-caip-media-dev`.
- [ ] `wrangler.toml` contains no `account_id`.
- [ ] Separate live `main` / `devilndove-site` mutation is unavailable.
- [ ] Provider execution/publication is closed.

## Previous exact checkpoint
Release 458 must remain recorded as:
- SHA `66b48f0445c74247972e14fbdaa0e215e3792fb7`
- Source `33265953249`
- System `33265953255`
- Pages `99135984965`

## Release 459 source sanity
- [ ] `functions/api/_lib/releaseAuthority.js` reports Release 459.
- [ ] `/admin/it-integrations/` has exactly one H1, is `noindex,nofollow`, and is I.T.-module owned.
- [ ] `/api/admin/it-provider-setup-guide` is authenticated/read-only and never emits values.
- [ ] Detailed provider setup covers Stripe, PayPal, Etsy, Pinterest, Meta, X, TikTok and YouTube.
- [ ] YouTube uses `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REDIRECT_URI`.
- [ ] X uses `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REDIRECT_URI`.
- [ ] Runtime Acceptance page has exactly one H1 and is `noindex,nofollow`.
- [ ] Core runtime manifest is GET-only.
- [ ] `/api/admin/app-modules` is the current-release runtime anchor.
- [ ] CAIP proof is separate, user-triggered, short-lived and source-preserving.
- [ ] CAIP ranged read requires `206`, `Accept-Ranges: bytes` and `Content-Range`.
- [ ] No autoplay/source copy/provider execution/publication is introduced.

## Release 459 D1 sanity
Current migration: `migrations/dev/20260829_release459_it_provider_setup_authority.sql`.

Before mutation:
- [ ] Release 459 Source Gate green on exact `dev` SHA.
- [ ] exact Development D1 identity verified from Cloudflare;
- [ ] migration convergence probed first;
- [ ] historical migrations are not replayed.

After mutation:
- [ ] 8 provider setup authorities exist;
- [ ] X authority exists and has at least 4 readiness checks;
- [ ] Etsy safe refs remain `ETSY_API_KEYSTRING` / `ETSY_SHARED_SECRET` / redirect/shop refs;
- [ ] YouTube safe refs are `YOUTUBE_*`, not stale `GOOGLE_*`;
- [ ] provider readiness rows have no orphan provider keys;
- [ ] foreign keys are clean;
- [ ] `provider_setup_authorities` has no secret/token value columns;
- [ ] Product/Accounting preservation baseline is unchanged;
- [ ] read-only Release 459 remote verifier passes.

## Gates
- [ ] `python scripts/release459_runtime_acceptance_gate.py`
- [ ] `python scripts/repository_forward_sanity.py`
- [ ] `python scripts/development_runtime_acceptance.py --self-check`
- [ ] carried Release 458/457/456/455/454/453 gates
- [ ] repository hygiene
- [ ] public SEO structure
- [ ] public SEO depth
- [ ] System Gate
- [ ] exact Cloudflare Pages deployment

## Manual tests are later
Do not ask for provider credentials/authorization until automated preparation is exhausted. Next automated work after Release 459 proof is the secure OAuth state/PKCE/encrypted-token/refresh/disconnect lifecycle plus provider adapter/payload/idempotency preparation.

Manual acceptance later includes authenticated runtime evidence, CAIP browser evidence, Stripe test, PayPal sandbox, Etsy provider authorization/draft and social/video provider authorization/controlled acceptance.

## Release rule
A new chat is not a migration event. A release is not complete merely because code exists. Source authority, gate evidence, exact Development deployment and required runtime/provider acceptance must agree before promotion.
