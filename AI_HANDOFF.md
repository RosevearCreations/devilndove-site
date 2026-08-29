# Devil n Dove — AI Handoff

## Current authority
**Release 459 — Authenticated Development Acceptance & Provider Setup Authority** is the single current Development release.

- Source branch: `dev`
- Development Pages project: `devilndove-site-dev`
- Development URL: `https://devilndove-site-dev.pages.dev`
- Separate live Production: `main` / `devilndove-site` — **do not mutate**
- D1 binding/database: `DB` → `devilndove-dev`
- D1 UUID: `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Product R2: `PRODUCT_MEDIA_BUCKET` → `devilndove-toolshed-images-dev`
- CAIP private R2: `CAIP_PRIVATE_MEDIA_BUCKET` → `devilndove-caip-media-dev`
- Never add `account_id` to `wrangler.toml`.
- A new chat/workstation is **not** a migration event. Never replay historical migrations just because the session changed.

## Previous exact checkpoint
Release 458 is closed:
- SHA `66b48f0445c74247972e14fbdaa0e215e3792fb7`
- Source Gate `33265953249`
- System Gate `33265953255`
- Pages check `99135984965`
- preview `https://a605691a.devilndove-site-dev.pages.dev`

Release 458 has no D1 migration.

## Release 459 work
Release 459 prepares everything practical before manual acceptance:
1. Current runtime authority is Release 459.
2. `/admin/it-integrations/` is the single detailed setup authority for Stripe, PayPal, Etsy, Pinterest, Meta/Facebook/Instagram, X, TikTok and YouTube.
3. `/api/admin/it-provider-setup-guide` returns reference names/instructions and presence booleans only; secret values are never emitted.
4. `/admin/runtime-acceptance/` provides authenticated GET-only core acceptance plus a separate explicit CAIP private-media range/seek proof.
5. `scripts/development_runtime_acceptance.py` accepts only the exact Development Pages host and reads authentication from `DND_DEV_SESSION_COOKIE` only.
6. Release 459 has one genuine D1 migration: `migrations/dev/20260829_release459_it_provider_setup_authority.sql`.
7. The migration adds X durable authority, aligns safe provider reference names (including `YOUTUBE_*`), and adds readiness checks. It does not store credentials/tokens or enable providers.
8. Release 454–458 carried gates were corrected so a later valid migration does not violate their historical no-migration status.

## Provider references
- Stripe: `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- PayPal: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`
- Etsy: `ETSY_API_KEYSTRING`, `ETSY_SHARED_SECRET`, `ETSY_REDIRECT_URI`, `ETSY_SHOP_ID`
- Pinterest: `PINTEREST_APP_ID`, `PINTEREST_APP_SECRET`, `PINTEREST_REDIRECT_URI`
- Meta: `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`
- X: `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REDIRECT_URI`
- TikTok: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI`
- YouTube: `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REDIRECT_URI`

Actual values belong in Cloudflare Variables and Secrets, never D1/source/Markdown/browser output.

## Release 459 automation chain
- Focused source: `.github/workflows/release459-source-gate.yml`
- System: `.github/workflows/system-gate.yml`
- Guarded Development D1: `.github/workflows/development-d1-release459.yml`
- Read-only verifier: `.github/workflows/release459-remote-verification.yml`
- Release gate: `scripts/release459_runtime_acceptance_gate.py`
- Remote snapshot verifier: `scripts/verify_release459_remote_snapshot.py`

The D1 workflow verifies exact Development D1 identity and applies only Release 459 metadata if the source gate is green and the migration is not already converged. Historical migration replay is forbidden.

## What remains before manual tests
Do **not** ask for provider credentials/authorization just because Release 459 source is complete. Continue automated work first:
- secure OAuth start routes and one-time state authority;
- PKCE where required;
- encrypted access/refresh token storage;
- refresh lifecycle;
- disconnect/revoke controls;
- provider-specific callback exchange handlers;
- mock/contract tests;
- payload validation and idempotency protections;
- production-transition/parity/rollback tooling.

Current social callback routes are readiness-only and intentionally do not exchange authorization codes yet.

## Manual boundary later
Only after automated preparation is exhausted should the user be asked to perform:
- authenticated Development runtime evidence;
- CAIP private-media browser proof;
- Stripe test checkout/webhook/reconciliation;
- PayPal sandbox approval/capture/webhook/reconciliation;
- Etsy authorization/draft acceptance;
- Pinterest/Meta/X/TikTok/YouTube provider authorization and controlled acceptance.

Provider execution/publication and separate live Production remain closed throughout Development.

## Canonical reading order
1. `development-release.json`
2. `AI_HANDOFF.md`
3. `PROJECT_STATUS_AND_ROADMAP.md`
4. `docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md`
5. `docs/operations/RELEASE_459_RUNTIME_PROVIDER_AUTHORITY.md`

Older Markdown is historical/supporting material, not current release authority.
