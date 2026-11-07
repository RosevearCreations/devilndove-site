# Build 627 — Original Meta evidence gap resolution, owner-supervised decision and read-only channel eligibility

**Deployment GREEN is independent of actual Meta authorization.** This build adds **Admin section 48**, a guarded, **evidence-only** original-owner decision about **one already witnessed Meta Page-ID GET**. It does **not** activate a Meta channel, refresh a credential, send another GET, publish content, or write to the database. Until we receive independently verified original-source signatures and a genuine saved receipt, the original Meta connection remains **HOLD / disconnected**.

## Owner-supervised procedure

1. Sign in to Devil n Dove Admin, open **section 48**, and choose **Read exact original GET, missing evidence and unsigned decision template**. The screen retrieves an authenticated, no-store projection of current original-source verifications. It will list the first unresolved gap and may show **no template**; that is the correct HOLD result until all prerequisites are genuine and current.
2. If original database readback or archive custody is missing, return to **section 46**, confirm the original D1 binding, backup and independent original issuer/witness/owner authority. The proposed D1 migrations **0052–0062** are *not applied* by this GitHub release. Original operators must separately approve and apply migrations in the source environment, then read back actual tables and custody.
3. If the original signed Page-ID window is missing or expired, complete **section 44** with authenticated independent `ISSUER`, `WITNESS` and `OWNER` identities, current pins, an unmodified signed owner ledger, original external-archive continuity and a new short-lived window. Do not extend expired signatures or substitute fixture data.
4. If a saved encrypted Meta Page read credential, its expiry, scoped permission, original one-use grant or the genuine provider receipt is missing, follow **section 45**. The original Meta account owner controls credential enrollment/renewal. **Never paste Meta tokens or private signing keys into this screen, the chat or GitHub.** An explicitly authorized original operator may perform at most **one** real `GET /v26.0/{page_id}?fields=id` with a new nonce. The nonce is spent even if the request fails. A separate signed `ACCEPT_624` for the **actual stored receipt** must pass original verification; simulated receipts never qualify.
5. Check **section 47** for `accepted_for_readonly_test_only: true`, the exact current `readback_witness_sha256`, an unexpired source window, and no source credential expiry. The independent 626 verifier checks genuine actual-receipt outcome/witness and original source continuity; Build 627 additionally joins the exact stored 624 witness row to its grant and original enrollment and compares its immutable witness digest.
6. With all evidence current, **section 48** may show an **unsigned** `devilndove-original-meta-readonly-channel-decision-627-v1` template. In the owners' independent custody workflow, replace the placeholder nonce and UTC timestamps, and have the *original* `ISSUER`, separate `WITNESS`, and `OWNER` each sign the **same exact canonical JSON payload** with their previously authenticated Ed25519 private keys. This is a fresh **evidence-only** decision, scoped to one witnessed Page-ID GET. Keep the canonical payload and three signatures intact in the private original-owner archive. The screen does not mint signatures for any role.
7. Paste **only** the public signed JSON bundle (`payload` and `signatures`) into section 48, enter admin step-up password and click **Verify ORIGINAL signed evidence-only read-only channel decision — NO CONNECTION**. Server-side evaluation rejects changed receipt/page/nonce/ledger/window, missing or different authority IDs, revoked/quarantined or unpinned signers, expiry or excess scope. Validity is capped to **ten minutes** and also limited by the original signed source window. The HTTP result is a transient validation; it does not persist a decision.
8. On success, the response can report `original_owner_signed_decision_verified: true`, `original_get_receipt_exact_match: true` and `approved_readonly_test_evidence_only: true`. **`connected: false` and `provider_channel_connected: false` must remain true.** Preserve the original signed packet privately. A separate explicitly authorized go-live design, operational consent, provider permissions and additional acceptance are required before anyone may claim a live Meta channel or enable publishing.

### Boundaries and verification

| Signal | Meaning |
|---|---|
| `ceremony_ready: false`, or a missing unsigned template | Current genuine original owner authority/window/Meta GET witness has not been independently reverified. Stay HOLD. |
| `unsigned_original_ceremony_template` | Exact candidate fields for original manual signatures. A template is **not approval**. |
| `original_owner_signed_decision_verified: true` | Exact fresh original three-party signatures validated for *one already witnessed GET*. Not a new provider call. |
| `decision_not_persisted: true` | No new database decision or lasting operational grant. Owners must privately retain the signed packet. |
| `provider_channel_connected: false`, `connected: false` | No operational Meta connection has been activated. |

This build introduces **no D1 migrations**, no OAuth secret handling, no token refresh and no provider request. `GET /api/admin/trust-channel-decision-627` requires an admin session; `POST` additionally requires same-origin JSON and admin step-up. It reuses the original cryptographic validations from Builds 623–626 and checks the actual saved 624 receipt against the readback digest. All negative conditions fail closed.

The performance-budget review measured **1,832 runtime source files and 18,337,104 bytes**, from 1,830 / 18,320,644 before Build 627. The source caps were raised narrowly to **1,832 files / 18,341,000 bytes**, without changing the individual HTML/JS/CSS, inline URI, migration or protected CI gates.

```sh
node --test scripts/release467_build627_original_meta_channel_decision.test.mjs
node scripts/release467_build609_ci_bundle.mjs
python3 scripts/migration_policy_gate.py
python3 scripts/release465_performance_budget_gate.py
python3 scripts/current_application_quality_gate.py
```

Provider and database references: [Meta Graph API overview](https://developers.facebook.com/docs/graph-api/overview/) · [Cloudflare D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/). Source-of-truth code: `functions/api/_lib/trustChannelDecision627.js`, `functions/api/admin/trust-channel-decision-627.js`, the original `trust-owner-walkthrough-626.js` readback, and the original 623–624 issuer/witness signature validators.
