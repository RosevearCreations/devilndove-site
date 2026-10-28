# Devil n Dove Build 512 — Product #53 conflict witness, independent photo recheck and QL-245 source signature intake

## Owner request / observed state

The existing Etsy unpublished listing is **#4603838854** and must not be duplicated. Build 511 fixed invalid `#true` display and kept Etsy provider writes on HOLD where the Product listing ID or saved media receipt did not agree. An apparently linked Product does not prove its three original photos, description, tag override or Canada-only draft are acceptable. Build 512 preserves these boundaries.

The owner-supplied **`ROSEVEAR_INTEGRATION_V1_QL245_EVIDENCE_RETURN_HANDOFF(1).md`** states six applications returned **code-readiness summaries, zero independently verified live connections**. All four company connectors remain `DISCONNECTED` and all 12 communications prerequisites remain `HELD_UNVERIFIED`. It supersedes the previous QL-243 readiness interpretation; it does **not** provision a credential or permit a pilot.

## Exact Etsy Product #53 proof

New verified-Admin endpoint `GET /api/admin/product-etsy-review-512?product_id=53` reads the **exact primary D1 listing claim**, immutable original Etsy photo acceptance/match audit rows, Build 511 local witness and independent renewal, plus current Etsy readback **only after a unique verified local claim**. It surfaces any old verified media receipt identifying a different listing ID, missing original #344–346 evidence, source/media fingerprint drift and inability to prove the unpublished Canada-only draft. An old conflict is not erased or silently renamed.

`POST /api/admin/product-etsy-review-512` supports two explicitly local decisions:

1. `witness_conflict`: owner types a factual observation after inspecting the *same* Etsy draft; verifies current D1 claim state, receipt, exact conflicting photo receipt IDs, per-request UUID, same origin and no-provider-write consent. This is not a repaired local link.
2. `independent_photo_recheck`: a different verified Admin from the Build 511 photo renewal confirms current live visual matches #344, #345 and #346, the exact saved D1 claim, prior renewal ID, unchanged fingerprint, unique existing image receipts and unpublished Canada-only readback. Any mismatched historical listing receipt, changed original or absent remote readback blocks the new local audit.

The D1 insert rechecks unique Product ownership and independent prior renewal in the same statement. Etsy remains externally mutable and no server-side local audit can replace a future fresh provider readback. This release does **not** reassign listing IDs, change photo receipts, retry provider writes, create/publish listings or grant final owner content acceptance.

## QL-245 / connection document implementation

QL-245 currently permits Devil n Dove only **nonproduction, server-to-server authenticated GET** `/api/integration/v1/health` and `/api/integration/v1/capabilities` through its previously isolated 12-line HMAC profile. **Product/listing reference reads are disabled**; no event, command, SMS, dispatch, guest, booking, payment, vault or other cross-business data movement is authorized.

Build 512 introduces `GET /api/admin/integration-ql245-source-evidence-512` for a safe, local, verified-Admin readiness review and a same-origin POST for one exact **QL-245 source-side public metadata** Ed25519 envelope. The source packet's 22 field names/order, exact identity and scopes, 40-character source SHA, nonsecret `np-...` references, seven explicitly labeled negative-denial references, bounded Unix-millisecond validity and mandatory `DISCONNECTED`/`NOT_GIVEN`/audit-pending labels are enforced. Its exact canonical JSON signature is cryptographically checked **only** against a public Ed25519 SPKI pin already configured *separately* at `ROSEVEAR_QL245_TRUSTED_DEVILNDOVE_SPKI_SHA256`. A caller-provided pin is never trusted. If absent, the endpoint refuses the packet. No private key, HMAC token, customer data or entire public packet is stored: the existing D1 audit records only its digest and nonsecret reference IDs.

This local **one-source signature match is not** the independently verified QL-245 six-source + seventh-assessor signature result, not a gateway-signed authenticated GET/audit receipt, and not a real-world observation. The Comms Hub offline `scripts/ql245-verify-six-app-evidence.mjs` is separate; it must be run on the complete signed public packet with seven independently sourced pins and a previously independently verified QL-244 summary. The Comms Hub's positive status still means **real proof pending and HOLD**. Devil n Dove's source endpoint **does not execute** that offline reviewer, register a connection, check a real nonproduction deployment, provision or revoke keys, approve a pilot or permit product reference reads.

**Current truthful response to QL-245:** implementation deployed (subject to CI); exact Dev/Production SHA/green workflows should be supplied after promotion. Nonproduction QL-243 HMAC key **NOT PROVISIONED** (absent independent credentials), QL-245 public signing pin **NOT PROVISIONED**, actual source and gateway signed receipts **UNVERIFIED**, seven real denial observations **UNVERIFIED**, independent assessor and owner witnesses **UNVERIFIED**, reversible kill-switch test **NOT VERIFIED**, owner authorization **NOT GIVEN**, actual gateway state **DISCONNECTED**. Do not fabricate receipts or claim TESTING based on an on-paper spec.

## Verification and promotion

```sh
node scripts/release467_build512_ql245_etsy_conflict_source_signature.test.mjs
node scripts/release467_build511_etsy_evidence_gateway_receipts.test.mjs
python scripts/current_application_quality_gate.py
```

Confirm the new Admin routes reject unauthenticated access, are owner-safe and do not trigger Etsy/provider writes. Check current `dev` CI, merge only an accepted source tree to `main`, and verify Cloudflare Pages deployment plus live Editor `?v=512` and production integrity before declaring **Production GREEN**. Production code promotion is **not** a nonproduction connection test.

**Next expected: Build 513 — Product #53 Listing/Media Exception Disposition Review, Owner Content Correction Recheck & QL-245 Independent Source Receipt Comparison.**
