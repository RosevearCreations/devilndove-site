# Devil n Dove Release 467 Build 506 — Product #53 owner trial and gateway v1

Date: 2026-10-27. **Software delivery and real-owner Etsy acceptance are separate gates.**

## Why this build exists

Owner screenshots show Product #53 (Adventurine Argon) with Etsy draft **#4603838854** already created, but a saved Product listing-ID readback is still unconfirmed. The saved Etsy override contains `Soap bars`, the Product description appears name-only, and the canonical three-photo gallery is not proven present on Etsy (`0/3` confirmed). A local or CI test cannot truthfully close any of those live owner checks.

## Delivered

1. The existing-draft link POST now reads the exact Product ↔ Etsy listing ID ↔ persisted receipt from the **D1 primary** within the same request after the conditional insert or same-Product receipt update. It returns `saved_link_readback_confirmed` and `receipt_id` only on independent confirmation. A failed independent proof returns `etsy_506_persistence_readback_hold` (409), indicates that a local write was attempted, and explicitly forbids duplicate creation.
2. The link-only GET uses a primary D1 session (where supported) and returns the same saved-link verification signal. The editor requires **both** readbacks and disables further link action after an uncertain write until an independent saved-state check shows the link. This does not bypass an existing cross-Product claim or Etsy shop/Canada-only/draft verification.
3. The editor has a read-only **Owner trial receipt** check showing saved Product ID, SKU, slug, Etsy ID, receipt, actual verified image count and specific saved metadata blockers. It directs the owner to Description and Storefront / SEO. It does not invent materials, rewrite search tags or attest to unseen original photos.
4. Server-only Integration Contract `rosevear.integration.v1` endpoints:
   - `GET /api/integration/v1/health`
   - `GET /api/integration/v1/capabilities`

   They require an AI Data Platform gateway-only HMAC request, a configured environment-specific key ID and secret, an exact destination/business/empty tenant, a 120-second millisecond timestamp, an allowed signed route, and a durable atomic nonce insert into the **existing** `admin_action_audit`. A replay is rejected. Missing credentials/revocation hold closed. They return **TESTING**, never claim a successful live gateway connection, and expose no customer or Product data. Product reference, event, command, Etsy or Marketplace writes are all **disabled**.

## Server-to-server signature handoff

Cloudflare server **secrets/bindings**, each unique per environment:

- `ROSEVEAR_INTEGRATION_HMAC_SECRET_V1` — high-entropy server-only HMAC secret, never a browser variable.
- `ROSEVEAR_INTEGRATION_KEY_ID_V1` — current registered gateway key ID.
- `ROSEVEAR_INTEGRATION_ENVIRONMENT_V1` — exact deployment environment (e.g. `production`, not inferred from URL).
- `ROSEVEAR_INTEGRATION_REVOKED_V1=true` — emergency fail-closed revocation.

Required request headers: `x-rosevear-key-id`, `x-rosevear-timestamp` (Unix **milliseconds**), `x-rosevear-nonce` (20–96 unguessable URL-safe characters), `x-rosevear-source: ai-data-platform`, `x-rosevear-destination: devilndove`, `x-rosevear-business: devilndove`, `x-rosevear-tenant` (empty), `x-rosevear-environment`, and `x-rosevear-signature` (lowercase hex HMAC-SHA256). No query strings and no request body.

Sign the exact UTF-8 newline-joined fields in order:

```
GET
/api/integration/v1/health
<timestamp-ms>
<nonce>
<key-id>
ai-data-platform
devilndove
devilndove

<environment>
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

The final field is the SHA-256 of an empty body; the blank line is the empty tenant. For `/capabilities`, change only the path and generate a **new** nonce/signature. Never reuse the nonce for retries or for a second endpoint. Credentials are not provisioned by this release; the owner and gateway must approve and configure them separately before real testing.

## What is STILL HELD and must be owner-witnessed

- Do not create/delete/republish Etsy draft #4603838854. Resolve saved ID only after Etsy confirms actual account, shop, draft state and Canada-only shipping.
- Correct the actual Product description with known materials, dimensions, process and applicable policies. Determine whether `Soap bars` is a truthful channel tag; correct or confirm it, **not** automatically discard it. Confirm proper Etsy category, title, quantity and CAD price.
- Verify three approved original photos #344–346 against the actual Etsy draft and its image IDs; record the witnessed match only if exact. Confirm the draft is still unpublished and Canada-only.
- Use **Final owner check** after remote readback and record owner sign-off separately. CI and deployment never substitute for that owner action.
- Independently test actual gateway keys, issuer/tenant isolation, nonce replay and audit receipts in its registered environment; an unconfigured endpoint returns HOLD. No product-reference read access is approved in v1 readiness.

## Verification

`node --test scripts/release467_build506_etsy_owner_trial_integration_readiness.test.mjs` exercises local readback, HMAC positive/negative cases, replay ledger, revocation, cross-business/tenant, expiry, tampering and disabled operations with **synthetic** credentials only. Run the Build 500–505 regression tests and the canonical application quality gate. Do not call TESTING `CONNECTED` or local checks a verified remote Etsy acceptance.

**Next expected Build 507 — Verified Etsy Draft Owner Metadata/Three-Photo Acceptance & Read-Only Gateway Handshake Trial.**
