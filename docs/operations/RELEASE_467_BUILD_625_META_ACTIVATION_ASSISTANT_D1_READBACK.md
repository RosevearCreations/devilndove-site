# Build 625 — Original-owner Meta activation assistant, D1 readback and live TEST witness

**Deployment GREEN means only that the application code was released. It does not mean the original database migrations ran, Meta credentials were enrolled, a real Meta GET occurred, or an account is connected.** Keep `HOLD_ORIGINAL_META_MIGRATIONS_AUTHORITY_AND_LIVE_WITNESS` until the original independent evidence is physically available and reverified.

## What the new screen does

The **Admin section 46** assistant is an authenticated, **GET-only** readback of original D1 table presence, safe receipt counts, the encrypted Meta credential's presence/expiry and the independently verified Build 623/624 evidence. It shows the first actionable gap, and buttons to take the operator to sections 44/45. It cannot migrate, sign, import tokens, request a Meta URL, renew OAuth, or change a provider connection flag. D1 table presence **does not prove migration provenance, original backup custody or owner approval**; row counts **do not prove signed evidence**. The original verifiers, not the assistant, must validate source signatures, expiry and a genuine stored GET receipt.

### Original-owner checklist (in order)

1. Sign into Devil n Dove **Admin → section 46** and click **Refresh original D1 migration and live TEST evidence (READ ONLY)**. Review `original_database_readback.migration_tables` for each original proposed migration **0052–0062**, including exact missing table names. The source files are under `migrations/proposed/`; none is auto-applied by a release or this screen.
2. **Only on the original owner-controlled deployment**, identify the actual Cloudflare D1 database binding, snapshot/backup and independently approve the migration against that specific database. Use the documented, controlled Cloudflare migration process with original operator signoff. Do not run a migration merely because the assistant reports a missing table. After the supervised action, refresh section 46. A green table-presence result still needs independent operator/migration-log readback.
3. In **Admin sections 35–43**, verify the original, separate `ISSUER`, `WITNESS`, `OWNER` public keys, their independent original-source custody, active pins, no key quarantine, the owner ledger, and the genuine historical Etsy/Meta receipts. Public-key enrollment requires an independent authority ceremony; this assistant does not perform it. Do not paste private keys or plaintext OAuth tokens in any form.
4. In **section 44**, verify a real original Meta Page-ID receipt, two genuinely distinct external archive GET receipts, the signed original authority completion and a ten-minute original read-only Page-ID window. The actual Build 623 verifier must report `derived_readonly_page_identity_window.verified: true`. When expired or revoked, obtain **new independent signatures**, not a locally edited expiry.
5. Return to **section 46** to check that the original Meta connection has a **saved encrypted** access token, unexpired access, exact previously approved Page ID and permitted read-only scopes. This step does **not** show, refresh, decrypt or upload tokens. No token present: stop and have the original authorized Meta account owner handle the approved credential setup outside the assistant.
6. In **section 45**, have the original issuer, separate witness and owner individually sign an `ENROLL_624` bundle covering the existing encrypted-token **ciphertext fingerprint** and current Page ID, scopes, owner ledger and signed Build 623 window. Record it with admin password verification. Generate a distinct `RECHECK_624` approval with a **new** one-use nonce, a precise `GET /v26.0/{page_id}?fields=id`, and at most ten minutes of authority (no later than the existing approved window or enrollment). Record the signed grant.
7. After the owners explicitly authorize the single TEST, click **EXECUTE ONE ORIGINAL APPROVED META PAGE-ID GET** in section 45. The server **consumes its nonce before attempting the external GET**. A failure, timeout, rejected/expired token, differing Page ID or unsuccessful receipt storage **spends the nonce permanently**. Never retry with the same approval. Do not post, publish or connect an account on the basis of this test.
8. An independent witness checks the **actual saved** single GET outcome/receipt SHA-256, then the original three roles sign a separate `ACCEPT_624` bundle. Submit it in section 45 with admin step-up. Refresh section 46: `assistant.actual_readonly_meta_test_witnessed: true` is possible **only** when the original verifier reports `ORIGINAL_ONE_GENUINE_META_GET_WITNESSED_READ_ONLY_NO_CONNECTION` and the signed original window still validates. No cached or invented proof may substitute for the original receipt.
9. Save external original operator migration logs, separate approved signatures, the archive-custodian proof and the independent TEST receipt privately. When a ten-minute authorization expires, renew with fresh separately approved source authority. Old receipts remain immutable and auditable.

## Non-bypass guarantees

- No new D1 source migration in Build 625, and no DDL or mutation in the assistant's GET endpoint. The source-owned **0052–0062 remain proposed** until independently applied to the actual original database.
- Original Meta live GET/witness logic remains in the protected Build 624 endpoint; no automatic provider call, reconnection, token refresh, publication or customer message.
- A build passing CI, `dev` and `main` deployment is **not** an original authority enrollment or genuine signed provider receipt. The assistant returns `connected:false` even if all independently verified read-only TEST checks pass.
- Existing fail-closed migration-policy, full-source regression, application quality, protected CI and production resource-integrity checks remain required.
- **Measured runtime:** two small server modules change source count from 1,826 to 1,828 and 18,294,347 to **18,308,304 bytes**. The source budget is narrowly reviewed from 18,298,000 to **18,312,000 bytes** (+14,000) and 1,826 to **1,828 runtime files** (+2); individual file caps, inline data caps and other gates remain unchanged.

## Verify

```sh
node --test scripts/release467_build625_meta_activation_assistant.test.mjs
node scripts/release467_build609_ci_bundle.mjs
python3 scripts/migration_policy_gate.py
python3 scripts/release465_performance_budget_gate.py
python3 scripts/current_application_quality_gate.py
```

Official sources: [Cloudflare D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/), [Meta Graph API overview](https://developers.facebook.com/docs/graph-api/overview/), and implementation `functions/api/admin/trust-activation-assistant-625.js` plus the original independent readbacks `trust-activation-623.js` and `trust-meta-live-624.js`.
