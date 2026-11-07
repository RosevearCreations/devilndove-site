# Build 626 — Original Meta evidence walkthrough, expiring authority renewal and verified read-only TEST acceptance

The new **Admin section 47** is the owner-supervised continuation of Build 625. It checks **current** signed-source evidence from Builds 623 and 624, shows exactly which authorization will expire, highlights spent single-use nonces and classifies the original Meta **one-GET read-only TEST** only when an actual saved provider receipt remains independently verifiable.

**A verified read-only TEST is not an activated Meta account connection.** The status `VERIFIED_ORIGINAL_META_READ_ONLY_TEST_ACCEPTED_NO_CHANNEL_ACTIVATION` means only that a genuine original Page-ID GET was witnessed by separate original signers. It never enables publishing, account connection, Meta token refresh or a second provider request. If required original proof is missing or stale, state is `HOLD_ORIGINAL_META_OWNER_RENEWAL_OR_GENUINE_TEST_WITNESS`.

## Exact original-owner steps

1. Sign in to Devil n Dove **Admin → section 47**. Click **Refresh current owner approval expiry and VERIFIED single-GET TEST**. The assistant reads the original database, time-limited window, saved encrypted Meta token metadata, single-use grant and actual immutable GET outcome/witness **without** calling Meta or writing to D1.
2. When `schema` is HOLD, open **section 46**. On the *actual original owner-controlled Cloudflare D1 database*, identify the live binding, current backup, original migration log and independent authorization. Only the original operator can decide whether the **proposed source migrations 0052–0062** may be applied through the approved D1 migration procedure. A GitHub release does not apply those SQL files. Recheck table presence after the separately authorized migration. Presence alone is not proof of signoff or custody.
3. When `original_evidence` is HOLD, use Admin **35–43/46**: independently verify `ISSUER`, separate `WITNESS` and `OWNER` Ed25519 identities, original pin custody, no revoked/quarantined keys, current owner decision ledger, full Etsy history checkpoint and **two distinct actual archived external GET receipts**. Do not substitute test fixtures for original credentials or receipts.
4. When `window` is HOLD, use **section 44**: obtain a new independent three-signature `record_original_meta_completion` / `witness_two_original_archives` chain where needed, and a **new** `record_one_readonly_meta_test_window` signed Page-ID window, valid at most ten minutes. Never extend or edit an expired window. The signed source verifier must report `derived_readonly_page_identity_window.verified: true`.
5. When `credential` is HOLD or expires soon, the **original Meta account owner** must independently reapprove/restore the saved encrypted credential through the original authorized provider process. The application must see the already saved encrypted token, exact approved Page ID and `pages_show_list` / `pages_read_engagement` permissions. The token must remain valid more than two minutes beyond the requested one-use authorization. **Never paste access tokens or private signing keys into section 47 or GitHub.** This assistant cannot refresh, decrypt or enroll a token.
6. When `signed_enrollment` is HOLD, use **section 45**: separately sign `ENROLL_624` for the actual saved AES-GCM ciphertext fingerprint, current original owner ledger, approved Page ID/scopes and fresh signed 623 window. Submit only after authenticating the three original roles and with admin step-up. The software does not issue approval in their names.
7. When `one_use_authorization` is HOLD or a prior nonce was spent, obtain a completely **new** triple-signed `RECHECK_624` with a fresh unused `authorization_id` and `test_nonce`, exact `GET /v26.0/{page_id}?fields=id`, and expiry no later than the existing enrollment and window. A prior successful or failed provider attempt **permanently spends its nonce**. Do not retry any spent nonce or stretch an old signature.
8. The original operator may explicitly click **EXECUTE ONE ORIGINAL APPROVED META PAGE-ID GET** in **section 45**, with admin password and the exact approved authorization. The server commits nonce consumption **before** the external request. A timeout, Meta error, token failure, wrong Page ID or missing immutable receipt requires fresh approval; it is never silently retried.
9. When `independent_test_acceptance` is HOLD, the original issuer, separate witness and owner independently inspect the one actual saved response hash, remote Page ID and original nonce, then sign a separate `ACCEPT_624` receipt. Submit in section 45 with admin step-up. Refresh section 47. Only the actual original 624 cryptographic verifier and the current original 623 window can yield **READ-ONLY TEST ACCEPTED**. The page **never** labels the provider operationally connected.
10. Keep the original source evidence, migration operator approvals, external archive readback and genuine TEST witness privately. Revisit section 47 whenever authorizations approach expiration; no background refresh or automatic signing is performed.

### Renewal and closure signals

| Readback signal | Exact interpretation |
|---|---|
| `source_window.state` | `CURRENT`, `EXPIRING_SOON` (within two minutes), `EXPIRED` or `MISSING`. A new window always needs fresh original signatures. |
| `saved_meta_credential.state` | Current, within 15 minutes of expiry, expired or unknown; original Meta owner controls refresh outside this assistant. |
| `most_recent_one_use_grant.state` | Fresh one-use authorization validity; a valid but *spent* grant is never usable again. |
| `most_recent_nonce_spent` | Matches a committed original 624 attempt; cannot be reset or reused. |
| `accepted_for_readonly_test_only: true` | Exact genuine saved GET/receipt, issuer, independent witness, owner and source window reverified; **NOT** channel activation. |

## Boundaries and verification

- Build 626 contains **no SQL migrations**, no credentials, no Meta provider call and no D1 writes. `GET /api/admin/trust-owner-walkthrough-626` is authenticated, private and no-store; POST is 405. It reuses Build 625 schema/credential source readback and the original 623/624 cryptographic verifiers.
- A past production release GREEN or table count never stands in for independent original signed proof. The only provider operation remains the explicitly supervised one-use GET in Build 624.
- Runtime source increases from 1,828 files / 18,308,304 bytes to **1,830 files / 18,320,644 bytes**. The reviewed cap increases narrowly by **12,000 bytes** to **18,324,000** and by two files to **1,830**; individual JS/CSS/HTML, inline URI and historical protected release gates remain unchanged.

```sh
node --test scripts/release467_build626_meta_owner_renewal_acceptance.test.mjs
node scripts/release467_build609_ci_bundle.mjs
python3 scripts/migration_policy_gate.py
python3 scripts/release465_performance_budget_gate.py
python3 scripts/current_application_quality_gate.py
```

Original sources: [Meta Graph API overview](https://developers.facebook.com/docs/graph-api/overview/), [Cloudflare D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/), and the verified source files `functions/api/admin/trust-activation-623.js`, `trust-meta-live-624.js`, `trust-activation-assistant-625.js`, and `trust-owner-walkthrough-626.js`.
