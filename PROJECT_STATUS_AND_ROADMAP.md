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
- versioned AES-GCM server-side OAuth encryption using `OAUTH_TOKEN_ENCRYPTION_KEY_V1`;
- random OAuth state stored only as SHA-256 hash;
- single-use, expiring authorization transactions with atomic replay protection;
- PKCE S256 and encrypted verifier storage where required/supported;
- declarative OAuth/identity contracts for Etsy, Pinterest, Meta, X, TikTok and YouTube/Google;
- administrator-only, Development-gated OAuth start;
- callback/token exchange path that cannot execute while live authorization is closed;
- intended-account verification before newly exchanged token persistence and before refreshed token replacement;
- encrypted access/refresh/ID token persistence with no plaintext token columns;
- redacted diagnostics with raw provider subject/account IDs suppressed;
- guarded refresh/disconnect and local expiry health;
- six-provider OAuth/identity mock proof and executable crypto proof;
- local six-provider publication validation contracts in `socialPublishContracts.js`;
- Development-only `/api/admin/provider-publication-plan` returning validation/idempotency plans only;
- deterministic SHA-256 idempotency keys: same normalized source/version/payload gives the same key; revisions produce a new key;
- sensitive publication-input rejection and zero-network executable publication mock proof;
- Meta/Instagram publication planning intentionally remains permission-contract-not-ready;
- retained legacy `publish_platforms` and `test_meta_connections` HTTP actions blocked before owner execution;
- legacy social readiness diagnostics currentized to `provider_execution_closed`, so credential presence cannot imply API readiness;
- old Meta Graph probe removed from `social-product-automation.js`, making its owner route itself non-networking;
- Meta data-deletion readiness remains local/fail-closed;
- historical Release 459 and Release 460 D1 workflows remain manual-dispatch-only recovery tools;
- no new D1 migration for intended-account identity or publication planning.

## Proven Release 460 evidence
Initial guarded D1 run `33273087894`: GREEN. Exact `devilndove-dev` identity was verified, only Release 460 was applied, and post-write proof confirmed the three OAuth authority tables, zero forbidden plaintext OAuth columns and clean foreign keys.

Later D1 convergence run `33273639602`: GREEN. It detected Release 460 already converged, **skipped the migration apply step**, and passed read-only post-write proof.

Latest hardened implementation checkpoint:
- SHA `9eb50239efca5f1c5c34dcd504d49fde718f3033`
- Release 460 Source Gate `33279263075`: GREEN
- System Gate `33279263080`: GREEN
- Cloudflare Pages check `99171549842`: GREEN
- preview `https://95326a5a.devilndove-site-dev.pages.dev`

The identity and publication-planning layers are source/contract-only. They use existing Release 460 authority and require no D1 mutation. The hardened implementation checkpoint launched source/regression workflows only; no Release 459/460 Development D1 migration workflow was triggered.

No live OAuth authorization, real provider token exchange/identity lookup, provider probe/publication, or separate Production mutation was performed by these proofs.

## Important retained technical debt
`functions/api/admin/social-post-queue.js` still contains historical Facebook/Instagram/X/Pinterest emitter functions. They are unreachable through the authorized Release 460 HTTP path because `_middleware.js` rejects `publish_platforms` before `context.next()`. They must remain treated as dead historical source, not an execution capability. Physical removal is a cleanup item and must not relax the closed provider boundary.

## Next automated work — before manual provider authorization
1. Continue Stripe/PayPal automated contract, replay, webhook and reconciliation preparation.
2. Continue Development-to-Production parity, transition and rollback tooling.
3. Remove retained unreachable legacy social provider emitters as technical-debt cleanup while preserving local draft/manual-record behavior and the Release 460 execution guard.

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
