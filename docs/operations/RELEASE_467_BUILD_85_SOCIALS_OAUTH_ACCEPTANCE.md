# Release 467 Build 85 — Socials & OAuth Acceptance

## Predecessor

Build 85 begins from the fully proven Build 84 checkpoint:

- `dev` = `main` = `eb71a3af25cfc17eb9c94917236343babbff64a9`
- tree `9d943becc38f0ae5170a0f9c3fcaeefbaaf7bb54`
- Production Pages Deploy `34383050086` — GREEN
- Production Live Resource Integrity Proof `34383156705` — GREEN

## Purpose

Build 85 converges the existing Release 460 secure OAuth lifecycle and the existing review-first social queue into one controlled Socials acceptance lane.

The target workflow is:

**one selected Development provider → secure OAuth → intended-account verification → encrypted connection evidence → provider-targeted draft → privacy/media review → explicit human ready + approved state → ready for a later controlled publication acceptance**

Build 85 does **not** authorize a provider post.

## Existing authority preserved

Release 460 remains the cryptographic and OAuth lifecycle owner:

- `OAUTH_TOKEN_ENCRYPTION_KEY_V1` remains the AES-GCM token-encryption authority;
- OAuth state remains random and persisted as a SHA-256 hash only;
- state is time-bounded and single-use;
- PKCE S256 remains required/supported according to provider contract;
- intended provider identity is retrieved and matched before new token material is encrypted/persisted;
- routine diagnostics never expose provider subject identifiers or token values;
- refresh re-verifies the intended provider account before replacing encrypted credentials;
- disconnect destroys local token material;
- the local provider publication planner remains non-executing and idempotency-focused;
- retained legacy provider emitters remain unreachable behind the mandatory middleware provider-execution closure.

Build 85 layers an additional selected-provider gate over the historical Release 460 Development operator switch. It does not weaken or replace that historical security authority.

## Selected-provider Development acceptance

Two independent Development conditions must agree before OAuth authorization can start or a real callback can be finalized:

1. `OAUTH_PROVIDER_AUTHORIZATION_MODE=development-explicit`
2. `SOCIAL_OAUTH_ACCEPTANCE_PROVIDER=<one provider>`

Accepted social provider selections are:

- `pinterest`
- `meta`
- `x`
- `tiktok`
- `youtube`

Production never satisfies the Development-host gate.

If the global operator switch is open but an OAuth request/callback belongs to a different provider than `SOCIAL_OAUTH_ACCEPTANCE_PROVIDER`, Build 85 fails closed before state creation or provider token exchange.

Etsy remains owned by the marketplace/provider lifecycle but is deliberately outside Build 85 Socials acceptance.

## Intended-account evidence

A selected provider is not considered accepted merely because credentials exist or OAuth returns a token.

The existing Release 460 intended-account references remain mandatory. Examples include:

- Pinterest expected username
- Meta expected Page ID and optional linked Instagram business-account ID
- X expected user ID
- TikTok expected Open ID
- YouTube expected channel ID

The provider identity is verified before new provider token material is persisted. Routine Build 85 diagnostics show only safe status and the optional operator-configured account label; provider subject values remain redacted.

## Explicit human draft approval

Build 85 reuses the existing `social_post_queue` review authority. It does not add another draft database.

A provider-targeted queue item counts as human-approved evidence only when all applicable conditions are satisfied:

- the selected provider is included in the target platform set;
- `approval_status = approved`;
- `post_status = ready`;
- and the privacy/public-media authority is approved through either:
  - `approved_for_public_post = 1`, or
  - `privacy_status = approved`, or
  - `privacy_status = no_private_media`.

For `meta`, a Facebook or Instagram targeted queue item can satisfy the provider-target evidence because the Meta OAuth connection owns the linked Facebook Page / Instagram professional account identity.

A privacy-blocked item never becomes Build 85 approval evidence merely because its queue status is ready/approved.

## Social Publishing UI

`/admin/social-publishing/` now includes a Build 85 **Controlled Social OAuth Acceptance** panel that shows, without exposing secrets:

- selected provider;
- Development/operator-switch state;
- selected-provider gate state;
- encryption readiness;
- provider configuration readiness;
- intended-account configuration and verification;
- safe connection health;
- targeted queue count;
- explicit human-approved draft count;
- next safe action;
- explicit provider/publication closure.

The guarded **Begin OAuth acceptance** link appears only when the selected provider is configured, Development-only gates are open, intended-account prerequisites are ready, and a new authorization is actually required.

The stale legacy Meta credential-test button is hidden on this page. Historical handlers remain closed at middleware and are not re-authorized by Build 85.

## Publication boundary

Build 85 keeps all of the following closed:

- Production OAuth authorization;
- provider publication;
- automatic publication;
- legacy social provider execution;
- direct provider publication from the Build 85 evidence endpoint or browser panel;
- CAIP private/raw media mutation or deletion.

A verified OAuth connection plus a human-approved draft means only **ready for a later controlled publication acceptance**. It is not proof that a post was created.

Real external provider acceptance requires the selected provider developer console, correct Development Cloudflare variables/secrets, an administrator/provider login and consent, and successful intended-account verification. When those external prerequisites are not present, the truthful Build 85 state remains `HOLD_EXTERNAL` / configuration or authorization required.

## D1 / R2 boundary

Build 85 is schema-neutral.

Canonical D1 migrations remain exactly:

1. `0001_release464_migration_authority.sql`
2. `0002_release464_operational_acceptance.sql`
3. `0003_release464_business_growth.sql`
4. `0004_release465_storefront_quality.sql`

No `0005` migration is introduced.

The Build 85 acceptance endpoint reads existing OAuth and social-queue evidence. It performs no request-time schema DDL, no R2 mutation, and no CAIP raw-media deletion.

## Automated proof

Build 85 adds:

- pure acceptance derivation in `functions/api/_lib/socialOAuthAcceptance.js`;
- selected-provider gating in `oauthSecurity.js`, OAuth start, and OAuth callback;
- admin-only read-only acceptance endpoint `functions/api/admin/social-oauth-acceptance.js`;
- Social Publishing acceptance UI and responsive CSS;
- pure runtime proof `scripts/release467_build85_social_oauth_acceptance_runtime_test.mjs`;
- fail-closed source/regression gate `scripts/release467_build85_gate.py`;
- current System Gate provenance chaining so later work cannot silently reopen provider/publication boundaries.

Build 85 also carries the Release 460 OAuth cryptographic/provider/publication mock proofs and Build 84 reliability contract forward.

## Next build

**Release 467 Build 86 — I.T. Operations & Self-Diagnostics** is next after Build 85 is exact-SHA GREEN and deliberately promoted.
