# Devil n Dove Build 619 — actual Etsy receipt, spent-nonce failure and Meta read-only preflight

The **source release can be GREEN while original provider TEST, independent issuer, owner authorization and production D1 remain on HOLD**. Build 619 does not perform a real provider request by itself; it audits records from Build 618's separately approved one-use Etsy GET. No Meta Graph request, listing publication, platform posting, credentials export or database migration occurs in this build.

## Owner field steps, when genuine original authority exists

1. **Independent original issuer and operator:** review authenticated original-source custody, live external checkpoint, separately approved witnessed backup/restore, the exact 0052–0057 SQL and original owner consent. Before applying SQL, obtain explicit independent migration approval and preserve a recoverable prior D1 backup. `0057` stays **proposed only** in this source release; neither UI nor CI applies it.
2. **Ree and independent witness:** sign the specific Build 618 original-custody, backup and unique read-only Etsy GET grant; a separate original operator must install approved source/decision/grant records. Do not copy fixture signatures, re-use keys between witness and owner, or count a GitHub GREEN check as permission.
3. **Original authorized TEST operator:** only after all prior gates are independently verified, execute the **single** authorized GET in Admin Section 39. Each successful GET stores an actual bounded-response digest; a timeout or invalid response now stores a sanitized error category and SHA-256 under the same permanently spent nonce in `dd619_etsy_failure_custody`. If failure logging itself fails, the nonce stays spent and Section 39 reports an unresolved custody exception. Never retry it.
4. **Admin Section 40:** select **Reconcile actual stored Etsy one-use GET receipts and inspect Meta READ-only permissions**. A real successful GET without independent witness acceptance is `GENUINE_GET_PENDING_WITNESS`; independently accepted is `GENUINE_GET_WITNESSED`; a failed GET is `FAILED_NO_RETRY_PENDING_WITNESS`. Unresolved or inconsistent records are HOLD/quarantined. The view is limited to the latest 100 entries per table; it **does not certify full ledger history**.
5. **After failure only:** independently sign the exact `devilndove-spent-etsy-get-failure-619-v1` payload with two *distinct, already activated, externally pinned* Ed25519 witness/owner keys. Include grant ID, spent nonce, the genuine recorded failure SHA-256, `owner_decision=ACKNOWLEDGE_SPENT_NONCE_NO_RETRY`, a unique nonce and 30-minute UTC signing window. Stage in Section 40. The immutable decision never enables a second GET. A new TEST requires a new separate original-owner grant and signed preflight.
6. **Meta preflight:** Section 40 inspects saved `meta` OAuth connection metadata only: an unexpired numeric subject and `pages_show_list` / `pages_read_engagement` for a *candidate* Facebook Page read, plus `instagram_basic` for a *candidate* Facebook-Login Instagram professional read. Application review, Page, linked professional Instagram identity, Marketplace rights, token functionality and all remote permission grants remain **UNVERIFIED**. A preflight result must never be called a connection or used to publish.

## Security and evidence boundaries

- The source code does not contain real original issuer signatures, Meta credentials, Etsy response payloads, live TEST receipts, or actual provider proof. Do not invent or create them to satisfy a gate.
- This release leaves all `0052`–`0057` production D1 proposals **unapplied** unless later separately reviewed and owner-approved outside this source change.
- The 619 failure digest binds `grant_id`, `test_nonce`, fixed endpoint and a coarse failure code. Raw errors, bearer tokens, HTTP bodies, and private keys are never stored in failure custody.
- If the HTTP GET succeeds but the immutable outcome write fails, that receipt is **not** marked verified: a separate `RECEIPT_PERSISTENCE_FAILED` custody code is attempted. If even that write fails, the spent nonce remains an unresolved exception and must not be replayed.
- Immutable UPDATE/DELETE triggers protect failed attempts and witnessed dispositions. Single-use claims already occur *before* the external GET in Build 618. **No automatic retries, provider writes or Meta remote calls** are introduced.
- A recent-window reconciliation is operational triage, not independent audit of all historical D1 rows. A separate full-history controlled export and independent witness review are still required for global acceptance.

## Test and review

Run:

```bash
node --test scripts/release467_build613_trust_workbench.test.mjs scripts/release467_build614_trust_authority.test.mjs scripts/release467_build615_custody_ceremony_audit.test.mjs scripts/release467_build616_checkpoint_revocation_recovery.test.mjs scripts/release467_build617_external_readback_recovery_test.test.mjs scripts/release467_build618_original_issuer_backup_etsy_test.test.mjs scripts/release467_build619_receipt_failure_meta_preflight.test.mjs
node scripts/release467_build609_ci_bundle.mjs
python3 scripts/release465_performance_budget_gate.py
```

Primary API references: [Etsy Open API](https://developer.etsy.com/documentation/), [Meta Instagram API collection by Meta](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api), and [Meta permissions](https://developers.facebook.com/docs/permissions/). Verify actual app review and selected Graph API permission versions directly in Meta Developer Dashboard before any future authorized live read.

Runtime performance review: Build 618 had **18,122,289 bytes / 1,814 files** of runtime source, with approved caps 18,140,000 bytes / 1,814 files. Build 619 measures **18,142,510 bytes / 1,816 files** because of two narrowly scoped guarded Worker modules and Section 40. The revised caps **18,160,000 bytes / 1,816 files** provide approximately 17 KB source headroom without changing existing per-file, JS, CSS, HTML, image, D1, CI or production verification controls. No alternate broad runtime budget was applied.
