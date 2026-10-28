# Devil n Dove Build 513 — Product #53 disposition and QL-246 source proof review

## Product #53: do not create another Etsy listing

Keep the *same* unpublished Canadian Etsy draft **#4603838854** for Product **#53**. The listing-ID/local-media-receipt disagreement shown in the owner's screenshots is an unresolved evidence exception, not permission to repair an ID, overwrite media receipts, create another draft, or publish. The saved source Product is still authoritative for its own contents; any live Etsy readback is a separate, time-sensitive observation.

Verified Admin may open the Product Editor's **Build 513 — Etsy exception and content** panel or `GET /api/admin/product-etsy-disposition-513?product_id=53`. It reads the Build 512 primary D1 claim, saved description, SEO/Etsy tag override, existing Build 512 conflict witness and independent photo recheck, then *only if a uniquely linked draft permits it* retrieves fresh Etsy owner readback. It shows a specific issue list for missing/inconsistent claim, unmatched prior media receipts, stale original-to-Etsy photo evidence, missing product-specific description or an inaccurate `Soap bars` override.

`POST /api/admin/product-etsy-disposition-513` has two **local-only** paths:

1. `record_exception_disposition_followup`: a verified Admin records a factual 20–600 character unresolved observation, retaining the prior witness and exact claim/media receipt IDs. This is a follow-up, **not conflict closure**.
2. `record_content_correction_recheck`: a *different* verified Admin from the last Build 512 photo reviewer confirms actual saved product description, appropriate tags, Etsy category/CAD price/quantity/Canada-only delivery and original photos #344, #345 and #346. Requires a unique current Product #53 claim, unchanged fresh fingerprint, exact Build 512 three-photo recheck and current unpublished Etsy readback. The server rechecks local claim and prior reviewer atomically at audit insert time. Any uncertainty is `HOLD`, not a forced pass.

Both require a fresh UUID, exact numeric draft ID, verified Admin, same origin and explicit acknowledgement of no Etsy changes. Neither edits Product/SEO/tag override, reassigns a listing, transfers images, changes Etsy, grants final owner sign-off, retries uploads or publishes.

## Revised QL-246 six-application handoff

The owner-supplied `ROSEVEAR_QL246_SIX_APP_SOURCE_PROOF_HANDOFF (1).md` replaces **QL-245 evidence format** for this phase. It is a **technical evidence request, not permission to connect**. Six apps (AI Data Platform, Devil n Dove, Rosie Dazzlers, Yard Workers, iCamp, Rosevear AI Hub) must independently return public, nonsecret, **signed** source proof and trusted public-key pins. Devil n Dove's permitted scope remains **nonproduction GET** for `/api/integration/v1/health` and `/api/integration/v1/capabilities` only. No product/listing/customer reference requests, Etsy/Marketplace writes, SMS, dispatch, messages or production data flow.

New verified-Admin `GET /api/admin/integration-ql246-source-comparison-513` compares local HMAC nonce/denial audit samples, prior security/separate-review receipts, QL-245 metadata and QL-246 provisioning readiness. Local test/audit samples are **not independent witness proof**. The QL-246 seven negative tests are therefore reported as **unverified**, not silently marked `true`.

Optional same-origin `POST` with action `inspect_ql246_public_source_signature` validates a **real operator-supplied public** proof against:

- Exactly 24 named payload fields in the handoff's order; canonical bytes are UTF-8 `JSON.stringify([fieldName, fieldValue])` for each field joined by `\n` **without** a trailing newline (different from QL-245).
- Ed25519 detached base64url signature and genuine SPKI public key matching a **separately provisioned trusted SHA-256 fingerprint** (`ROSEVEAR_QL246_TRUSTED_DEVILNDOVE_SPKI_SHA256`).
- An operator challenge ID and SHA-256 digest configured out of band (`ROSEVEAR_QL246_CHALLENGE_ID`, `ROSEVEAR_QL246_CHALLENGE_SHA256`) and an independently trusted immutable source revision (`ROSEVEAR_QL246_EXPECTED_SOURCE_REVISION`).
- The exact repository/business, null tenant, 2 read-only GETs, seven *actually witnessed* denied tests, fresh expiry, and explicit `NOT_GIVEN`, `DISCONNECTED` and false external gateway/audit/owner witness fields.

Only an accepted *local* signature-match digest and nonsecret metadata may be stored in the existing Admin audit. **It never creates a signing key, signs or publishes `ql246-source-proof.json`, probes a real gateway, changes connection state or approves the owner pilot.** The source signing private key must stay in an existing operator secret manager. A public pin must be independently delivered through a different trusted channel; do not embed a new pin as a default. Previous QL-245 signatures are not QL-246 signatures.

The required proof filename `docs/integration/ql246-source-proof.json` is deliberately **not** published now. There is no independently provisioned challenge/pin/signing key and no seven real denial witnesses. Publishing a placeholder or unsigned fixture at that exact path would falsely imply accepted evidence. The source's honest exception list is in [`docs/integration/QL246_DEVILNDOVE_PENDING.md`](integration/QL246_DEVILNDOVE_PENDING.md).

**Protocol clarification needed:** the handoff simultaneously requests that signed `payload.source_revision` equal the Git commit **containing that same signed file**. Embedding its own final commit SHA in that commit's contents introduces a cryptographic self-reference. The independent operator must specify a noncircular rule (for example, sign an earlier audited source revision and separately identify the immutable proof-file commit) before requiring immutable proof publication. Do not invent an SHA to make an apparently complete packet.

## Acceptance sequence, *once independently provisioned*

1. Independent operator issues one-time challenge and independently confirms Devil n Dove's source revision, nonproduction URL, separate pin and `GET`-only HMAC key scope. Resolve the self-referential revision rule first.
2. Dev team performs real authenticated nonproduction health/capabilities GETs, captures immutable server and durable gateway audit IDs and repeats seven denial cases with independent witnesses. Keep product/listing/customer references disabled.
3. Devil n Dove signs actual nonsecret source metadata with its own Ed25519 private key in a secret manager, publishes one immutable public JSON at an agreed Git commit and supplies raw byte digest, source and public SPKI pin over independent channels. **Only after steps 1–2 are true.**
4. The AI Data Platform independently fetches all six source files and verifies six unique pins, challenges, signatures, negative tests and versioned evidence; this yields at most **signed-metadata HOLD**, not a live connection.
5. Independent owner identity, restart-persistent gateway audit, separately authorized pilot/rollback and new production scope must be approved as a **later** change. Until then all apps report `DISCONNECTED`.

## Verification

```sh
node scripts/release467_build513_etsy_disposition_ql246_proof.test.mjs
node scripts/release467_build512_ql245_etsy_conflict_source_signature.test.mjs
python scripts/current_application_quality_gate.py
```

Verify both new Admin routes return 401 without a verified session, `?v=513` is live in the Product Editor, and a green `main` deployment is the same Git revision as the accepted review. **Green production code does not mean a successful six-app connection, an approved Etsy draft or an authorized owner pilot.**

**Next expected Build 514 — Owner-Witnessed Product #53 Content/Media Evidence Disposition & QL-246 Challenge/Pin Source Proof Readiness Recheck.**
