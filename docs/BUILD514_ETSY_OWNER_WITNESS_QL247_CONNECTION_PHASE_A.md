# Devil n Dove Build 514 — Owner-witnessed Product #53 evidence and QL-247 Phase A source readiness

## Exact Product #53 existing Etsy draft

Keep the same unpublished Canada-only Etsy draft **#4603838854**. Build 513 showed the need for current saved Product details and separate independent #344–346 original-to-Etsy photo receipts, while a historical listing/receipt claim may still conflict. **Do not delete, recreate, silently relink or publish.** Neither the exact saved Product source nor old screenshots alone prove final Etsy content/media acceptance.

The verified-Admin Product Editor now has **Build 514 — Owner-witnessed Etsy content/media disposition**. The backend `GET /api/admin/product-etsy-owner-witness-514?product_id=53` reads current Build 513 primary claim/content/three-original evidence plus previously recorded local owner observations and last corrected-content reviewer. Every request gets fresh checks. Only two local audit-only POST actions are available:

- `record_factual_owner_witness`: a verified Admin captures an actual owner observation (30–800 characters) about the *exact existing draft*, independently notes unresolved evidence and confirms no Etsy change or final owner approval. This can be recorded while a local claim remains unlinked; it is **not** a repaired ID, proof of owner identity or exception closure.
- `record_independent_disposition_recheck`: a different verified Admin from the last Build 513 corrected-content reviewer confirms the same primary Product #53 claim, previous Build 513 independent content receipt ID, current unchanged photo fingerprint, saved correct description/tag and the real unpublished Canada-only Etsy category/price/quantity/three-photo state. Any historical conflicting receipt, missing current comparison, duplicate local claim, same reviewer or changed digest blocks the action. This is **independent local recheck only**, not final owner sign-off.

Both POSTs require one per-attempt UUID, exact numeric listing ID, current claim lease, same origin and explicit no-provider-write acknowledgments; the D1 insert checks exact unique listing ownership and independent previous reviewer again. No new D1 schema, Etsy provider calls, auto retry, listing claim mutation, photo receipt rewrite, automatic acceptance or publishing.

## QL-247 owner handoff received

The supplied `ROSEVEAR_QL247_SIX_APP_CONNECTION_TEST_HANDOFF.md` is **technical coordination, not permission to connect**. It explicitly distinguishes sharing a GitHub identity from authenticating any actual source. The six repos are `RosevearCreations/ai-data-platform`, `RosevearCreations/devilndove-site`, `RosevearCreations/rosiedazzlers`, `RosevearCreations/yw`, `RosevearCreations/iCamp`, `RosevearCreations/rosevear-ai-hub`. **No shared secret** may be derived from one GitHub owner. Hub devices and local network locations remain private. The earlier QL-246 source proof has **not** been independently provisioned or verified here.

`GET /api/admin/integration-ql247-readiness-514` gives Admin a Phase A readiness return based on source-side QL-246 comparison, with safe exact method/path labels, separated pending test/owner approval and explicit seven-denial `false` values. It cannot create/rotate secrets, contact another application, publish a signed proof or connect a pilot. It deliberately leaves the **current `main` SHA and run URL blank until a separate immutable GitHub provenance check**, because app-local environment metadata cannot independently attest to its live deployment.

### Phase A — source/CI and public trust only

1. Identify the current Devil n Dove **40-character `main` SHA** and its actual green GitHub Actions run **after** production deployment. Verify source file/revision directly through immutable Git URLs and report only actual audit IDs.
2. Have an authorized local operator prepare a **source-specific Ed25519 key** in a secret manager. Independently register the SHA-256 fingerprint of its *public SPKI DER* through a separate authenticated channel, and request a real nonproduction one-time challenge. Private signing keys and HMAC key values never enter chat, Git, frontend JavaScript or public JSON.
3. Return precise `NOT PROVISIONED`/`UNVERIFIED` states for original health/capabilities nonce receipts, independent public pin, owner review, source approval, durable audit and seven real denial traces. Do **not** create `docs/integration/ql246-source-proof.json` as a placeholder. The existing pending exception list remains correct until there is actual evidence.

### Phase B — separate explicit authorization needed

An owner must separately approve the **exact nonproduction test only**: source, destination, tenant, GET paths, validity, independent reviewer and rollback. App-specific 256-bit HMAC keys go into each server secret store, never public handoffs. External authenticated HTTPS/private-runner `GET /api/integration/v1/health` and `/api/integration/v1/capabilities` use the QL-243 12-line HMAC, ±5 minute clock check and atomic nonce anti-replay. Independently witness **seven actual denials** (nonce replay, stale, cross-business, cross-tenant, revoked key, write, dispatch), durable gateway audit after restart, pin review, rotation/revocation and kill-switch rollback. No Product/listing/customer data endpoint, Etsy/Marketplace write, SMS, dispatch or phone call is in scope.

Only after original test evidence and a fresh one-hour owner challenge may a real Ed25519 public metadata envelope be signed and published at a mutually agreed immutable revision. The QL-246 field-pair UTF-8 canonical bytes and public SPKI pin must match independently. **Do not fabricate seven `true` denials** using fixture tests. The prior QL-246 requirement for `source_revision` to equal the commit *containing its own signed JSON* is cryptographically self-referential; the independent operator must specify a noncircular signed source-code revision and separate immutable proof-file commit reference before proceeding.

### Phase C — owner pilot not authorized

Even complete six-source signatures and real read-only nonproduction tests grant **at most an independent signed-metadata HOLD report**. A later separately authenticated, specific, time-bounded, reversible owner decision is needed to allow any pilot. `DISCONNECTED`, `NOT_GIVEN`, no production credentials, no product/marketplace writes and no communications dispatch remain unchanged after Build 514 code promotion.

## Verification and safe return

```sh
node scripts/release467_build514_owner_witness_ql247_source_readiness.test.mjs
node --test scripts/release467_build50*.test.mjs scripts/release467_build51*.test.mjs
python scripts/current_application_quality_gate.py
```

Verify both new Admin endpoints reject unauthenticated requests, static Product Editor `?v=514` is live and current GitHub main SHA/CI and Cloudflare Pages integrity are green before reporting **production application GREEN**. This does **not** authorize connection.

Use [our QL-247 truthful source return](integration/QL247_DEVILNDOVE_PHASE_A_PENDING.md) for the other applications. **Next expected: Build 515 — Product #53 Owner-Observation Source Conflict Reassessment & QL-247 Nonproduction Test Authorization Prerequisite Review.**
