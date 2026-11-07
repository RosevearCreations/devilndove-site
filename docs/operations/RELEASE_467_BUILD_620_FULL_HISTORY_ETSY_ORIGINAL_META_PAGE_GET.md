# Devil n Dove Build 620 — full Etsy source history and controlled Meta Page TEST

Build 620 provides a **full-history source-ledger consistency audit** and an actual *conditional*, one-use, read-only **Meta Facebook Page identity** challenge. This does **not** mean an original issuer, separate witness or owner has approved the source in production. `main` software GREEN, externally verified full-history custody, and a genuine provider TEST are different states. The independent original authority remains on HOLD unless real source evidence is supplied.

## What becomes available

- Admin **Section 41**: one readback runs SQL over *all* immutable Etsy test grants, attempts, responses, witness acceptances, failures and dispositions. It checks exact counts, missing parent records and conflicting success/failure for the same nonce; unlike Section 40, **no last-100-row limit** is used for these aggregate queries.
- The complete-history SQL audit is **structural consistency**, not a cryptographic attestation by an independent external witness. It does not create authority, verify raw original Etsy receipts again, or claim that Meta/Etsy has ever been contacted from this screen. A future full-history hash, original-custodian witness and restored D1 comparison remain separately required.
- Only if the separate original Meta source registrar has already approved the exact source, an original issuer plus independent witness and owner have signed the same 30-minute exact-scope packet, an external checkpoint matches the current immutable owner ledger, and the original operator has installed a unique **one-time grant**, Section 41 can call Meta **once**.
- The request is a bounded, authenticated **GET `https://graph.facebook.com/v26.0/{approved_page_id}?fields=id`**. The response must be JSON with exactly one `id`, equal to the signed, previously verified Facebook Page ID. This never requests an access token field or writes a Page post, Marketplace item, Instagram object, message or customer communication.
- Each grant nonce is atomically spent **before** network access. Failure, timeout, mismatch and receipt-storage errors preserve a sanitized immutable no-retry custody record where possible. If even the failure record cannot be written, the nonce is still spent and an unresolved operator exception is returned. No automatic retry is allowed.

## Original owner field steps

1. **Original Meta custodian (outside Devil n Dove):** independently confirm the original Meta app/Page identity, source SHA-256 and legitimate issuer. Supply an independently approved source registration and source proof; do not treat typed URLs, demo keys, preview success or saved OAuth scopes as independent provider authentication.
2. **Ree and independent witness:** review an authenticated current external checkpoint, compare exact stored Page ID to the intended Facebook Page, verify actual `pages_show_list` and `pages_read_engagement` consent and independently sign the **same** `devilndove-original-meta-page-read-620-v1` payload using separate authentic Ed25519 ISSUER, WITNESS and OWNER keys. The payload must bind grant ID, issuer/source digests, checkpoint, numeric Page ID, SHA-256 of sorted saved Meta OAuth scopes, a unique >=20-character test nonce, exact GET endpoint, issue/expiry and the action `ONE_EXACT_META_PAGE_ID_READ_ONLY`. A Page ID is **not** a Facebook user ID.
3. **Separate original operator:** review the witnessed D1 backup and restore, the exact proposed migration `0058`, the earlier `0052`–`0057` proposals and the signed consent. Obtain explicit independent authorization **before** performing any production D1 migration. The application cannot install its own issuer/source/grant approval, and this build performs **zero** D1 migrations.
4. **Only after signed authority is independently proven and migration is approved:** original operator installs `dd620_meta_original_source_registrations` and one `dd620_meta_read_grants` row with signed evidence and SHA-256 of the exact canonical payload. Verify actual saved OAuth Meta connection and target Page identity are current. In Admin Section 41, enter the separately approved grant ID and admin password to execute the single read.
5. **Inspect the result:** a returned 200 and exact Page `id` produces an immutable receipt digest with status **`META_PAGE_ID_GET_RECEIPT_PENDING_INDEPENDENT_WITNESS`**. Any error results in a spent, never-retryable nonce and HOLD. Independently witness and accept the actual original receipt before any later service activation is even considered.

## Scope and safety

- Full SQL aggregate scans are complete for the current D1 snapshot only. No independent external hash checkpoint or repeatable cross-snapshot signed evidence is claimed.
- Meta `pages_show_list`/`pages_read_engagement` are Page-read *candidates*, never proof of Meta app review or unrestricted account access. Facebook Marketplace automated posting has **no approval** here. Instagram professional accounts and business permissions need separate identity checks.
- No secrets, real issuer keys, real provider tokens, live Meta evidence, or owner signature proofs are included in the repository. Tests use locally generated fixture signatures and mock HTTP only.
- All `0052`–`0058` SQL remains **proposed, not applied**. Neither GitHub merge, Cloudflare release, nor CI green substitutes for original independent approval.

## Run the controls

```bash
node --test scripts/release467_build613_trust_workbench.test.mjs scripts/release467_build614_trust_authority.test.mjs scripts/release467_build615_custody_ceremony_audit.test.mjs scripts/release467_build616_checkpoint_revocation_recovery.test.mjs scripts/release467_build617_external_readback_recovery_test.test.mjs scripts/release467_build618_original_issuer_backup_etsy_test.test.mjs scripts/release467_build619_receipt_failure_meta_preflight.test.mjs scripts/release467_build620_full_etsy_meta_identity.test.mjs
node scripts/release467_build609_ci_bundle.mjs
python3 scripts/release465_performance_budget_gate.py
python3 scripts/migration_policy_gate.py
```

Primary provider source: [Meta's official Facebook Graph API workspace](https://www.postman.com/meta/facebook/overview), [specific Page token/identity request](https://www.postman.com/meta/facebook/request/bqfxwbp/get-access-tokens-of-pages-you-manage), [Meta's official Instagram API collection](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api), [Meta permissions reference](https://developers.facebook.com/docs/permissions/), [Etsy Open API](https://developer.etsy.com/documentation/). Confirm the chosen Meta Graph version and app permissions again at real TEST time.

Runtime budget review: Build 619's approved source caps were **18,160,000 bytes / 1,816 files**. Build 620 measures **18,166,427 bytes / 1,818 files** with two new guarded backend modules, original-owned Section 41 and no other feature-wide runtime additions. The revised caps are **18,180,000 bytes / 1,818 files**, approximately 13 KB headroom. Existing per-file, frontend assets, security, D1 and independent production/live integrity gates remain unchanged.
