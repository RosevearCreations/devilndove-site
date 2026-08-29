# Devil n Dove — Project Status & Roadmap

## Current Development state
**Release 459 — Authenticated Development Acceptance & Provider Setup Authority**

Development boundary:
- branch `dev`
- Pages project `devilndove-site-dev`
- URL `https://devilndove-site-dev.pages.dev`
- D1 `DB` → `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- R2 `PRODUCT_MEDIA_BUCKET` → `devilndove-toolshed-images-dev`
- R2 `CAIP_PRIVATE_MEDIA_BUCKET` → `devilndove-caip-media-dev`

Separate live Production remains closed.

## Proven checkpoint before Release 459
Release 458 is complete at `66b48f0445c74247972e14fbdaa0e215e3792fb7`:
- focused Source Gate `33265953249`
- System Gate `33265953255`
- Cloudflare Pages check `99135984965`

## Release 459 implementation queue
### Implemented in source
- current Release 459 runtime authority;
- detailed I.T. setup guide for eight provider families;
- safe Cloudflare reference presence reporting without values;
- X provider authority and readiness definition;
- YouTube durable reference correction to `YOUTUBE_*`;
- callback-specific readiness checks;
- authenticated Development GET-only acceptance harness;
- Admin Runtime Acceptance workspace;
- separate CAIP private-media bounded range/metadata/seek proof tooling;
- carried-forward gate semantics repair for Releases 454–458;
- guarded Release 459 D1 workflow and read-only verifier;
- canonical Markdown reduction/synchronization.

### Release 459 proof sequence
1. Release 459 focused Source Gate green on exact `dev` SHA.
2. System Gate green on same exact SHA.
3. Cloudflare Pages `devilndove-site-dev` successful on same SHA.
4. Guarded Release 459 migration applies only to exact Development D1, or safely detects it is already converged.
5. Independent read-only Release 459 D1 verifier passes.
6. Record exact evidence in current release authority.

## Next automated release work — before manual tests
### Secure OAuth connection lifecycle
Current social callbacks are readiness-only. Build the missing secure lifecycle before asking for provider authorization:
- provider-specific OAuth start routes;
- one-time state records and expiry;
- PKCE challenge/verifier where required;
- encrypted access/refresh token storage;
- token refresh/expiry handling;
- disconnect/revoke controls;
- intended-account identity capture;
- safe callback failures and audit events;
- provider adapter interfaces and mock/contract tests;
- no publication during connection setup.

### Provider preparation
- Etsy OAuth/draft payload validation and idempotency;
- Pinterest board/Pin payload validation;
- Meta catalog/content preparation and review requirements;
- X post/media preparation;
- TikTok consent/content-posting preparation;
- YouTube upload metadata/scope preparation;
- provider retry/error classification without live execution.

### Payment preparation
- Stripe checkout/webhook contract and replay/idempotency validation;
- PayPal sandbox approval/capture/webhook contract validation;
- commerce-cost/accounting reconciliation evidence mechanics;
- no live-money path in Development acceptance.

### Production-transition preparation
- read-only schema/data parity checks;
- bindings/reference inventory;
- promotion checklist tied to exact release SHA;
- rollback/recovery mechanics;
- Development vs separate live Production lock verification.

### Application-wide automated backlog
Continue auditing the five canonical modules:
1. Storefront
2. Creators
3. Socials / CAIP
4. Financials
5. I.T.

For each, continue source-only improvements, error/fallback handling, responsive/accessibility checks, SEO/public-page one-H1 enforcement, dead/stale authority cleanup and regression gates while manual/provider execution remains closed.

## Manual acceptance — later, not now
Manual actions are not the current blocker. They become the final acceptance layer after automated preparation:
- authenticated Development runtime acceptance;
- CAIP private-media browser evidence;
- Stripe test transaction/webhook/reconciliation;
- PayPal sandbox transaction/webhook/reconciliation;
- Etsy provider authorization/draft acceptance;
- Pinterest/Meta/X/TikTok/YouTube authorization and controlled provider acceptance.

## Promotion rule
A feature is not complete because code exists. It must have aligned authority, safe failure behavior, tests/gates, exact Development deployment evidence and—when applicable—authenticated/provider acceptance.

Promotion to separate live Production remains a deliberate final operation, never an automatic consequence of Development success.
