# Devil n Dove Build 515 — Product #53 source conflict reassessment and QL-247/248 prerequisites

## Owner-requested Etsy tab simplification

The Product Editor **Etsy** tab now leads with one Create/Update draft panel. It shows the **saved D1 Product name, SKU, slug, and listing ID** together; an existing listing ID is never inferred from `linked: true`. New drafts require one-time Etsy category, Canada-only shipping and packed dimensions. Linked drafts use the exact saved numeric ID. One explicit button requests a draft-only package: saved Product details, approved gallery originals, native tags and advanced metadata, followed by Etsy readback. The normal **Save Product** action saves the local store record only and cannot secretly start an Etsy provider write; gallery edits also only refresh readiness.

All previous Build 506–515 witness forms and QL-247/248 gateway controls are retained behind **closed Technical history and gateway diagnostics**. Older competing Etsy controls are hidden. The exact missing conditions are under one optional checklist. If photos already exist on the linked draft, a separate collapsed **Match existing photos** option reuses the verified Build 505 side-by-side original/Etsy image pairing; this records a verified existing match without uploading a duplicate.

The former client guard hid the saved Etsy ID when the photo endpoint's listing field was missing or stale. Build 515 now preserves the **uniquely verified numeric D1 listing identity** in the UI while placing the **photo transfer itself on HOLD** until its conflicting or missing receipt is reconciled. This is not an invented photo match, not bypass permission, and not proof of a successful Product #53 image update. Real owner-signed Etsy media readback remains necessary before we can say those images have transferred.

## Same existing Etsy draft, no silent repair

Product #53 must retain the existing unpublished, Canada-only **Etsy draft #4603838854**. Prior Build 513 content-photo checks and Build 514 factual owner observations are distinct from a verified Etsy provider receipt. A local owner note may truthfully report that the D1 claim or historical photo receipts remain uncertain. Build 515 must not reassign a listing ID, invent Etsy photo receipts, wipe a discrepancy, create a second draft, transfer media, retry a provider write or record final owner acceptance.

The new verified-Admin **`GET /api/admin/product-etsy-conflict-reassessment-515?product_id=53`** reads the exact current Build 514 Product claim, source photo digest and historical conflict IDs, plus the latest factual Build 514 owner witness and latest independent disposition receipt. The visible Product Editor requires a **different verified Admin from the Build 514 owner observer** before a local factual reassessment may be recorded. A missing, stale, mismatched or same-person observation keeps the recheck on HOLD.

**`POST /api/admin/product-etsy-conflict-reassessment-515`** accepts only `record_independent_conflict_reassessment`. The separate reviewer supplies a factual 30–800 character note and chooses *one still-unresolved issue*: source listing identity, original-photo receipt, owner content/tags, external Etsy evidence, or no new evidence. All outcomes remain `OWNER_EXCEPTION_UNRESOLVED_HOLD`; there is **no** resolved/accepted option. Same-origin, exact numeric existing draft ID, per-attempt UUID, exact prior observation ID and source claim/media lease, independent actor and explicit no-provider-write confirmations are mandatory. D1 insert verifies the same prior owner ID/different actor and primary claim again atomically; the existing audit remains append-only, and no business/marketplace row is updated.

## QL-247 nonproduction authorization prerequisites — no test executed

The attached **`ROSEVEAR_QL248_PROOF_COMMIT_AMENDMENT_HANDOFF(3).md`** confirms QL-247 Phase A preparation and **proposes** a noncircular QL-246 proof-file revision rule, still **awaiting separate consumer agreement**. Build 515 exposes `GET /api/admin/integration-ql247-prerequisites-515`, a read-only combined QL-247 source report and QL-248 independent-operator checklist. A verified Admin may append a public, factual missing-prerequisite note using `record_local_test_prerequisite_review` with explicit **no test authorization, no credential provisioning, no signed proof and no gateway request**; it cannot authorize a pilot or send an external request.

The exact approved technical scope, **when a later owner separately authorizes a nonproduction test**, remains only server-to-server `GET /api/integration/v1/health` and `/api/integration/v1/capabilities`, source `devilndove`, business `devilndove`, tenant `null`, with app-specific random 256-bit HMAC in a server-side secret manager and QL-243 nonce/timestamp profile. Seven *real independently witnessed* denial cases, durable post-restart gateway audit, separately authenticated Ed25519 public SPKI pin, revocation/key rotation, rollback/kill-switch and separate independent reviewer are still required. No source credential, signing private key or owner identity proof may enter Git, chat, frontend JS, public proof or source comments. Product/listing/customer references, marketplace writes, phone/SMS and live dispatch stay **DISABLED**.

## Proposed QL-248 two-SHA amendment: precise distinction

QL-246's earlier requirement that the signed `source_revision` equal the SHA of the Git commit **containing its own signed JSON** is a cryptographic self-reference. QL-248 proposes this separation, which Build 515 documents as **proposal, not consumer acceptance**:

| Identity | Meaning | Evidence authority |
| --- | --- | --- |
| `payload.source_revision` | **Earlier** inspected/tested source-code 40-hex commit | Existing QL-246 24-field signed payload |
| `payload.ci_run_url` | CI of the same earlier tested source commit | Same signed payload; independently checked |
| `proofCommitSha` | **Later**, distinct immutable commit containing signed public JSON | External operator verification manifest, not signed proof |
| `proofSha256` | SHA-256 of exact raw public proof JSON fetched at the later commit | Independently checked operator manifest |
| `publicKeySpkiSha256` | DER SPKI SHA-256 of unique real Ed25519 **public** key | Independent authenticated public pin registry |

The QL-246 canonical signing bytes and field order, Ed25519 detached signature, one-hour challenge, seven true **only if actually observed** denials and `DISCONNECTED`/`NOT_GIVEN` semantics remain unchanged. The proposed QL-248 offline six-app verifier at the Comms Hub accepts local public bundle and independently obtained trusted pins but **cannot prove real network GETs, independent GitHub origin, actual operator approval or a live connection**. A successful offline test means only signatures on supplied evidence match and **HOLD** remains. The **AI Data Platform QL-246 consumer must explicitly accept the two-revision interpretation** before any source proof is published. We do not create an unsigned placeholder `docs/integration/ql246-source-proof.json` now.

## Truthful six-app source reply and remaining owner action

- Devil n Dove repo: `RosevearCreations/devilndove-site`; test source SHA and green CI URL must be verified from the actual current promotion, not an old run or fixture.
- Private signing key/HMAC key and distinct registered key ID: **NOT PROVISIONED / NOT VERIFIED** in this build.
- Genuine external authenticated nonproduction health/capabilities GETs and seven original denials: **UNVERIFIED**.
- Independently authenticated public source SPKI pin, durable gateway audit, revocation and rollback: **UNVERIFIED**.
- QL-248 independent consumer agreement: **PENDING**; no `proofCommitSha` or `proofSha256` invented.
- Narrow owner permission to perform nonproduction test: **NOT GIVEN / NOT VERIFIED**.
- Separate owner reversible read-only pilot decision: **NOT GIVEN**.
- Current actual connection: **DISCONNECTED / HOLD**. Existing Etsy draft remains unpublished; no Product/booking/payment/communications transfer.

The separate operator must (1) agree to noncircular proof transport with both source and consumer, (2) independently validate exact green source SHA and CI, (3) securely arrange specific nonproduction scope, independent reviewer and owner approval, (4) provision source-specific keys, (5) witness genuine GETs/seven denials/durable audit/rollback, (6) obtain fresh challenge and produce a nonsecret signed proof in a *later* immutable commit, (7) independently verify all six source proofs, then (8) seek **new separate** owner pilot permission. These are not completed by Build 515.

## Verification

```sh
node scripts/release467_build515_owner_conflict_ql248_test_prerequisites.test.mjs
node scripts/release467_build515_etsy_simple_ui.test.mjs
node --test scripts/release467_build50*.test.mjs scripts/release467_build51*.test.mjs
python scripts/current_application_quality_gate.py
```

Verify the new Admin GET endpoints reject unauthenticated requests, live Product Editor uses `?v=515`, all dev/main CI and production Pages integrity pass at the exact green main SHA. **A green application deployment is not a green inter-application pilot.**

The operator-safe external return is [`docs/integration/QL248_DEVILNDOVE_TWO_SHA_PENDING.md`](integration/QL248_DEVILNDOVE_TWO_SHA_PENDING.md).

**Next expected Build 516 — Product #53 Owner Discrepancy Evidence Follow-Up, Independent Corrective Source Comparison & QL-248 Consumer Agreement Witness Readiness.**
