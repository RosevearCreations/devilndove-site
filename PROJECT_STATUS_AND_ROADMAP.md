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

Separate live Production `main` / `devilndove-site` remains closed. Provider publication, provider execution, and live provider authorization remain closed.

## Release 459 checkpoint
Release 459 is the carried provider-setup/runtime-acceptance authority. Its D1 provider metadata is treated as the schema checkpoint beneath Release 460. Historical migrations are never replayed because a chat/workstation changes.

## Release 460 implemented
- versioned AES-GCM server-side OAuth encryption authority using `OAUTH_TOKEN_ENCRYPTION_KEY_V1`;
- random state stored only as SHA-256 hash;
- single-use, expiring authorization transactions with atomic replay protection;
- PKCE S256 generation and encrypted verifier storage where the provider contract requires/supports it;
- declarative contracts for Etsy, Pinterest, Meta, X, TikTok and YouTube/Google;
- administrator-only OAuth start route;
- callback code exchange path that cannot execute while the live-authorization gate is closed;
- encrypted access/refresh/ID token persistence with no plaintext token columns;
- guarded refresh lifecycle;
- idempotent disconnect with local ciphertext destruction and provider revocation where a generic safe revoke contract exists;
- redacted connection diagnostics and security events;
- Etsy callback route added to the existing provider callback set;
- local D1 schema/replay proof plus executable Web Crypto proof;
- focused Release 460 Source Gate and guarded Development D1 workflow;
- Release 459 gate converted to carried historical authority rather than falsely claiming to remain current.

## Proven Release 460 evidence so far
- Focused Source Gate run `33273087878`: GREEN. This proves Release 460 source/schema invariants, executable cryptography, Release 459 carry-forward, JavaScript syntax, and the closed Production/provider boundary.
- Guarded Development D1 run `33273087894`: GREEN. Exact `devilndove-dev` identity was verified, only the Release 460 migration was applied, and the post-write proof confirmed the three OAuth authority tables, zero forbidden plaintext OAuth columns, and clean foreign keys.

`OAUTH_PROVIDER_AUTHORIZATION_MODE` remains unset. No live OAuth authorization or provider token exchange was performed by these proofs.

## Next automated work — before manual provider authorization
1. Converge current metadata/docs after exact-head System/Pages evidence.
2. Add provider-specific mock exchange/refresh/revoke payload fixtures and error-classification tests beyond the generic contract layer.
3. Add intended-account identity verification/connection labeling before any provider can be considered accepted.
4. Add refresh-expiry scheduling/health-state mechanics without contacting providers while the gate is closed.
5. Add provider publishing payload validation/idempotency as a separate layer; connection setup must never imply publication permission.
6. Continue Stripe/PayPal automated contract/replay/reconciliation preparation.
7. Continue Development-to-Production parity/rollback tooling.

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
