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
- routine diagnostics no longer emit provider subject/account identifiers or token material;
- local-only access/refresh expiry health states with no provider contact;
- explicit intended-account verification requirement before live provider acceptance;
- provider-contract mock proof for authorization/exchange/refresh across all six providers;
- safe exchange-failure proof;
- supported generic revoke mock proof for X/TikTok/YouTube and no-network unsupported revoke proof for Etsy/Pinterest/Meta;
- local D1 schema/replay proof plus executable Web Crypto proof;
- carried Release 448 Supply Sourcing and Calibration authority restored and regression-proven;
- historical Release 459 and converged Release 460 D1 workflows converted to manual-dispatch-only recovery tools, closing automatic migration replay from ordinary source/authority edits.

## Proven Release 460 evidence
Initial guarded D1 run `33273087894`: GREEN. Exact `devilndove-dev` identity was verified, only Release 460 was applied, and post-write proof confirmed the three OAuth authority tables, zero forbidden plaintext OAuth columns and clean foreign keys.

Later D1 convergence run `33273639602`: GREEN. It detected Release 460 already converged, **skipped the migration apply step**, and passed read-only post-write proof.

Exact Development source checkpoint before this documentation sync:
- SHA `03a243176469c42a39bbd99221f7638945975d2a`
- Release 460 Source Gate `33273733112`: GREEN
- System Gate `33273733111`: GREEN
- Cloudflare Pages check `99156783003`: GREEN
- preview `https://95a45cc7.devilndove-site-dev.pages.dev`

No live OAuth authorization, token exchange against a real provider, provider publication, or separate Production mutation was performed by these proofs.

## Next automated work — before manual provider authorization
1. Add provider-specific intended-account identity retrieval/verification and safe connection labeling using mocks first.
2. Add provider publishing payload validation/idempotency as a separate non-executing layer; connection setup must never imply publication permission.
3. Continue Stripe/PayPal automated contract/replay/webhook/reconciliation preparation.
4. Continue Development-to-Production parity, transition and rollback tooling.

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
