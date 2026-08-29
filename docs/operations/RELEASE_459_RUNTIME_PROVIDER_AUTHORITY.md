# Release 459 — Runtime Acceptance & Provider Setup Authority

## Scope
Release 459 advances the Development application (`dev` → `devilndove-site-dev`) without opening separate live Production or provider publication.

It adds:
- authenticated GET-only Development runtime acceptance;
- an Admin Runtime Acceptance workspace;
- a separate explicit CAIP private-media range/metadata/seek proof using a short-lived administrator-bound secure review grant;
- a detailed I.T. provider setup authority for Stripe, PayPal, Etsy, Pinterest, Meta/Facebook/Instagram, X, TikTok and YouTube;
- exact Cloudflare reference names, callback routes where implemented, scope targets, correction mechanics and presence-only readiness;
- a narrow Development D1 migration for provider reference/checklist metadata;
- repaired carried-forward gates so historical no-migration releases do not forbid a legitimate later migration.

## Release 458 checkpoint carried forward
Release 458 is closed and must not be re-run as a migration:
- exact SHA: `66b48f0445c74247972e14fbdaa0e215e3792fb7`
- Source Gate: `33265953249`
- System Gate: `33265953255`
- Cloudflare Pages check: `99135984965`
- Development preview: `https://a605691a.devilndove-site-dev.pages.dev`

## Exact Development infrastructure
- Cloudflare Pages project: `devilndove-site-dev`
- Development URL: `https://devilndove-site-dev.pages.dev`
- D1 binding: `DB`
- D1 database: `devilndove-dev`
- D1 UUID: `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Product R2: `PRODUCT_MEDIA_BUCKET` → `devilndove-toolshed-images-dev`
- CAIP private R2: `CAIP_PRIVATE_MEDIA_BUCKET` → `devilndove-caip-media-dev`
- `account_id` is forbidden in `wrangler.toml`.

## Release 459 D1 migration
`migrations/dev/20260829_release459_it_provider_setup_authority.sql`

The migration stores only safe provider metadata/reference names. It:
- adds X to `provider_setup_authorities`;
- aligns Stripe/PayPal/Etsy/Pinterest/Meta/TikTok/YouTube reference-name metadata;
- aligns YouTube durable references with the current `YOUTUBE_*` runtime contract;
- adds X readiness checks and callback-specific readiness rows;
- preserves existing readiness state/evidence on conflict;
- does not add secret/token columns;
- does not touch Product, Accounting or media data;
- does not enable provider execution/publication.

Mutation workflow: `.github/workflows/development-d1-release459.yml`.
Because the repository default branch is `main` and Development workflows intentionally live only on `dev`, GitHub `workflow_run` chaining cannot be used without modifying the live branch. Release 459 therefore uses a guarded `dev` push trigger. The mutation job re-runs the full Release 459 source gate and forward sanity itself before any write, verifies exact D1 name/UUID, refuses stale/non-Development source, probes convergence first and applies only the Release 459 file when needed.

Independent read-only verifier: `.github/workflows/release459-remote-verification.yml`. It starts independently from the same `dev` checkpoint and polls read-only until Release 459 convergence is visible, then verifies the remote snapshot. It contains no mutation command.

## I.T. provider setup model
Actual values remain in Cloudflare Variables and Secrets. The application exposes names/instructions and presence booleans only through `/api/admin/it-provider-setup-guide`.

Canonical references:
- Stripe: `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- PayPal: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`
- Etsy: `ETSY_API_KEYSTRING`, `ETSY_SHARED_SECRET`, `ETSY_REDIRECT_URI`, `ETSY_SHOP_ID`
- Pinterest: `PINTEREST_APP_ID`, `PINTEREST_APP_SECRET`, `PINTEREST_REDIRECT_URI`
- Meta/Facebook/Instagram: `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`
- X: `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REDIRECT_URI`
- TikTok: `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REDIRECT_URI`
- YouTube: `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REDIRECT_URI`

Current social callback routes are readiness callbacks. They intentionally do not yet exchange authorization codes or store tokens. Secure state/PKCE, encrypted token storage, refresh and disconnect/revocation lifecycle is the next automated provider-infrastructure work before manual provider authorization.

## Runtime acceptance boundary
`scripts/development_runtime_acceptance.py` accepts only `https://devilndove-site-dev.pages.dev` and obtains authentication only from `DND_DEV_SESSION_COOKIE`.

Core acceptance is GET-only. `/api/admin/app-modules` is the current-release anchor and must report Release 459, five canonical modules, ten role rows and healthy diagnostics. Older APIs are validated by their stable contract/invariants rather than being falsely relabeled as Release 459.

The browser workspace is `/admin/runtime-acceptance/`.

CAIP private-media proof is separate and explicit. It creates a short-lived secure review grant, requires a `206` response to `Range: bytes=0-1023`, checks `Accept-Ranges`/`Content-Range`, loads metadata and attempts a seek without autoplay. It does not copy or overwrite source media and does not call a provider.

## Manual boundary
Release 459 does not declare these complete:
- authenticated browser acceptance evidence;
- CAIP private-media runtime evidence;
- Stripe test transaction/webhook/reconciliation acceptance;
- PayPal sandbox acceptance;
- Etsy authorization/provider-side draft acceptance;
- Pinterest/Meta/X/TikTok/YouTube authorization/provider acceptance.

Those remain deliberately later. Continue automated OAuth/provider infrastructure and payload/idempotency preparation before asking for manual provider interaction.

## Production boundary
The Pages **Production deployment of `devilndove-site-dev` is the Development app**. It is not the separate live Production site.

Separate live `main` / `devilndove-site`, provider execution and publication remain closed until a deliberate reviewed transition.
