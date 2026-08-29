# Devil n Dove — Project Status & Roadmap

## Current Development state
**Release 460 — Secure OAuth Lifecycle & Encrypted Token Authority**

Development boundary:
- branch `dev`
- Pages project `devilndove-site-dev`
- URL `https://devilndove-site-dev.pages.dev`
- D1 `DB` → `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- R2 `PRODUCT_MEDIA_BUCKET` → `devilndove-toolshed-images-dev`
- R2 `CAIP_PRIVATE_MEDIA_BUCKET` → `devilndove-caip-media-dev`

Separate live Production `main` / `devilndove-site` remains closed. Provider publication, provider execution, and live provider authorization remain closed. `OAUTH_PROVIDER_AUTHORIZATION_MODE` remains unset.

## Release 459 checkpoint
Release 459 is the carried provider-setup/runtime-acceptance authority beneath Release 460. Its D1 provider metadata is historical/current-as-carried and is never replayed because a chat/workstation changes. Release 459 convergence run `33273639605` re-verified the current Development D1 and skipped its migration apply step because the authority was already present.

## Release 460 implemented and proven
- versioned AES-GCM server-side OAuth encryption authority using `OAUTH_TOKEN_ENCRYPTION_KEY_V1`;
- random state stored only as SHA-256 hash;
- single-use, expiring authorization transactions with atomic replay protection;
- PKCE S256 generation and encrypted verifier storage where provider contracts require/support it;
- declarative contracts for Etsy, Pinterest, Meta, X, TikTok and YouTube/Google;
- administrator-only OAuth start route;
- callback code exchange path that cannot execute while the live-authorization gate is closed;
- encrypted access/refresh/ID token persistence with no plaintext token columns;
- guarded refresh lifecycle;
- idempotent disconnect with local ciphertext destruction and provider revocation where a generic safe revoke contract exists;
- routine diagnostics never emit provider subject/account identifiers or token material;
- local-only access/refresh expiry health states with no provider contact;
- provider-specific intended-account configuration required before future OAuth start can redirect;
- provider identity retrieved and matched before newly exchanged token material can be encrypted/persisted;
- identity re-verification before refreshed token material can replace an existing connection;
- safe operator-configured account labels with raw provider subject values suppressed;
- Meta verifies the intended managed Facebook Page and optionally its linked Instagram business account;
- Pinterest identity contract includes `user_accounts:read`; YouTube identity contract includes `youtube.readonly`;
- provider-contract and intended-account mock proof for all six providers;
- missing-configuration, wrong-account, linked-Instagram mismatch, and provider-lookup failure proofs;
- supported generic revoke mock proof for X/TikTok/YouTube and no-network unsupported revoke proof for Etsy/Pinterest/Meta;
- local D1 schema/replay proof plus executable Web Crypto proof;
- carried Release 448 Supply Sourcing and Calibration authority restored and regression-proven;
- historical Release 459 and converged Release 460 D1 workflows are manual-dispatch-only recovery tools, closing automatic migration replay from ordinary source/authority edits.

## Proven Release 460 evidence
Initial guarded D1 run `33273087894`: GREEN. Exact `devilndove-dev` identity was verified, only Release 460 was applied, and post-write proof confirmed the three OAuth authority tables, zero forbidden plaintext OAuth columns and clean foreign keys.

Later D1 convergence run `33273639602`: GREEN. It detected Release 460 already converged, **skipped the migration apply step**, and passed read-only post-write proof.

Intended-account implementation checkpoint:
- SHA `0a224a8313bda8fc36002149a000742f45c41a41`
- Release 460 Source Gate `33277302902`: GREEN
- System Gate `33277302903`: GREEN
- Cloudflare Pages check `99166205949`: GREEN
- preview `https://ac063323.devilndove-site-dev.pages.dev`

The identity layer required no D1 migration. It uses the existing internal `remote_subject_id` authority and does not emit its value through routine diagnostics. The implementation checkpoint launched only Release 460 Source Gate and System Gate; no Development D1 migration workflow was triggered.

No live OAuth authorization, real provider token exchange/identity lookup, provider publication, or separate Production mutation was performed by these proofs.

## Next automated work — before manual provider authorization
1. Add provider publishing payload validation and idempotency as a separate **non-executing** layer; connection setup must never imply publication permission.
2. Continue Stripe/PayPal automated contract/replay/webhook/reconciliation preparation.
3. Continue Development-to-Production parity, transition and rollback tooling.

## Manual acceptance — later, not now
Only after automated preparation is exhausted:
- authenticated Development runtime acceptance;
- CAIP private-media browser evidence;
- Stripe test transaction/webhook/reconciliation;
- PayPal sandbox transaction/webhook/reconciliation;
- Etsy authorization/draft acceptance;
- Pinterest/Meta/X/TikTok/YouTube authorization and controlled acceptance.

## Promotion rule
A feature is not complete because code exists. It must have aligned authority, safe failure behavior, tests/gates, exact Development deployment evidence and—when applicable—authenticated/provider acceptance.

Promotion to separate live Production remains a deliberate final operation, never an automatic consequence of Development success.
