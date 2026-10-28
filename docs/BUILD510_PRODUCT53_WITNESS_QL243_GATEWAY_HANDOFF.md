# Devil n Dove Build 510 — Product #53 recovery witness, three original photos and QL-243 gateway separation

## Real source of this change

Reviewed `ROSEVEAR_INTEGRATION_V1_CONNECTION_TEST_HANDOFF_QL243(3).md` supplied by the owner (QL-243, October 27, 2026). This is an **implementation handoff**, **not evidence of an already connected gateway**. The AI Data Platform remains the only integration gateway. Devil n Dove remains the authoritative owner of its own product/Etsy source data.

## Product #53 — existing Etsy draft #4603838854

- New authenticated Admin `GET /api/admin/product-etsy-witness-trail-510?product_id=53` reads the **exact D1 primary claim** for Product #53. It distinguishes `unclaimed`, `multiple_local_claims`, `same_product`, and `another_product` rather than silently relinking or retrying.
- A separately clicked, same-origin `record_candidate_witness` POST stores one factual owner observation, its exact saved claim state, and an idempotency key in the **existing** `admin_action_audit` ledger. It **never** treats a screenshot/note as a provider response or a saved link.
- A separately clicked `record_photo_retest` POST requires the **uniquely linked** same Etsy listing, verified live Canada-only unpublished draft, live remote readback, current evidence SHA-256 and each matching original **#344, #345 and #346** with distinct confirmed receipts, source URLs and live Etsy URLs. The owner must explicitly visually compare all three pairs. This logs a **local visual retest**, not a final Etsy approval. A changed source/remote URL invalidates the prior fingerprint.
- No Etsy draft creation, upload, listing-ID migration, post, publish, provider retry or customer action occurs in these endpoints. Any unresolved evidence stays **HOLD** and the established independent closeout/sign-off remains separate.

## Contract v1 / QL-243 difference from the earlier Build 506 profile

QL-243 uses the **exact 12-line canonical** UTF-8 HMAC string, 256-bit secret and base64url/no-padding signature rather than Build 506's older signature. The new **nonproduction-only source profile** is implemented on:

| Path | Authenticated caller | Allowed | Actual result |
| --- | --- | --- | --- |
| `GET /api/integration/v1/health` | `ai-data-platform` → `devilndove` | Signed health GET only | `HOLD`, minimal non-PII source receipt |
| `GET /api/integration/v1/capabilities` | `ai-data-platform` → `devilndove` | Signed capabilities GET only | `HOLD`, health/caps enabled; product/listing read **disabled** |
| `GET /api/integration/v1/audit/receipts/{id}` | AI Data Platform's **own** gateway | **Not implemented here** | Not a Devil n Dove route |
| Product/listing references, events, commands, writes, Etsy, inventory, orders, customers | None | **Not authorized in this phase** | Remain disabled/denied |

For **Devil n Dove source requests**, the exact caller fields are `X-Rosevear-Source: ai-data-platform`, `Destination: devilndove`, `Business: devilndove`, `Tenant: -`, `Environment: nonproduction`. The QL-243 handoff's example instead describes **Comms Hub → AI Data Platform gateway**, where `source=rosevear-comms-hub` and `destination=ai-data-platform`. These are **different independent credentials and different signed messages**. Never copy that gateway-example signature directly to our source endpoint.

The twelve canonical lines for the source endpoint are `rosevear.integration.v1`, `GET`, exact path without query, 13-digit Unix-ms timestamp, `np-` plus 32 lowercase random hex nonce, `ai-data-platform`, `devilndove`, `devilndove`, `-`, `nonproduction`, empty-body SHA-256, and the configured key ID. The server checks exact identity and `Accept: application/json`, ±300 seconds, the signature, key status, and an append-only D1 nonce dedupe insert; missing D1 fails closed. Writes/unknown paths are denied; no secret or key material is in the response. Old authenticated Build 506 non-QL243 GETs remain on their legacy path when the QL-243 nonproduction deployment profile is not selected.

### Secrets and deployment

**Never put secret values in GitHub, Markdown, browser, logs or CLI arguments.** Nonproduction server-only environment settings (names only):

- `ROSEVEAR_QL243_DEPLOYMENT_CLASS=nonproduction` — set only in a genuinely isolated nonproduction Cloudflare environment.
- `ROSEVEAR_QL243_NONPROD_KEY_ID` — unique exact server registry key ID (non-secret).
- `ROSEVEAR_QL243_NONPROD_HMAC_KEY_B64` — securely provisioned random **32-byte** HMAC source key in secret manager.
- `ROSEVEAR_QL243_NONPROD_REVOKED=true` — immediately deny all current-key requests; rotate by replacing the key **and key ID** via controlled nonproduction key issuance.
- Existing D1 `admin_action_audit` must be available for atomic nonce and denial logging; no schema or new database is created.

Do **not** put these in the **Production** deployment to activate nonproduction traffic. Deploying the source code to Production is **not a gateway connection test**.

### Independent approval separation

- Build 509's owner security handoff can recognize the **QL-243 nonproduction source-side** signed health/caps receipts; it flags them explicitly as source-only, retains the current key ID, and grants no data or pilot permission.
- New verified Admin `GET /api/admin/integration-gateway-separation-510` checks current key/scope, both local source nonce receipts, precise nonproduction owner handoff and a **different authenticated Admin reviewer**. A separately clicked POST may save a local separation audit only with all conditions and four explicit acknowledgements. It **always** returns `HOLD`, never activates a gateway.
- **Not yet verified:** AI Data Platform Ed25519 gateway health/caps receipts, its `audit/receipts/{id}` durability after restart, three separate out-of-band public SPKI SHA-256 pins (gateway/owner/witness), genuinely independent identity-witness challenge, owner read-only pilot consent, source-to-gateway signed exchange, Comms Hub QL-243 four-GET integration harness and all 12 QL-181 communications gates.
- No pilot activation, real SMS/phone dispatch, cross-business DB reads or product/customer data transfer. For a future product/listing read-only reference, obtain separate owner authorization and register explicit scoped endpoints **in a later build**.

## Sanitized QL-243 six-app source response

| Handoff field | Devil n Dove Build 510 result |
| --- | --- |
| Application / `source_system` | `devilndove` |
| Repo commit, CI, nonprod HTTPS origin | Fill using exact **verified** Build 510 commit/green CI and separately provisioned nonproduction deployment. Production hostname alone is **not** a nonproduction test origin. |
| Source authenticated GET paths | `/api/integration/v1/health`, `/api/integration/v1/capabilities` |
| Key ID / registry entry | **NOT PROVISIONED OR VERIFIED BY THIS CODE RELEASE**; only a configured nonproduction server reports a key-ID-present boolean. Never disclose key material. |
| Business / tenant / capabilities | `devilndove` / `null` (`-` header) / health + capabilities GET only. Product/listing reference reads disabled. |
| Health + capabilities signed **source** nonce receipts | **NO LIVE RECEIPT PROVIDED** until a real registered gateway calls both source endpoints with freshly signed GET requests. Local tests use ephemeral fake credentials. |
| Gateway signed receipts, audit ID, restart proof, Ed25519 pins | **NOT VERIFIED / NOT PROVIDED**; gateway responsibility. |
| Independent identity-witness evidence | **NOT VERIFIED**; no genuine witness attestation supplied. |
| Negative tests | Automated stale, replay, invalid key, wrong business/tenant/source/environment/path/method/signature and disabled capability checks; real nonproduction registry rotation and egress not yet witnessed. |
| Owner pilot authorization | **NOT GIVEN** |
| Connection | **DISCONNECTED / HOLD** |

## Local verification and handoff

Run:

```sh
node --test scripts/release467_build510_etsy_witness_ql243_gateway.test.mjs
python scripts/current_application_quality_gate.py
```

Then check protected dev/main CI, Cloudflare Pages Production green and the editor's deployed `v=510` reference independently. These release checks establish source deployment, **not** a real signed QL-243 gateway connection or an Etsy provider/owner approval. A real source-side handshake is allowed only **after** an independently approved nonproduction key is provisioned on a nonproduction server. Send only this sanitized handoff, exact verified source commit/CI link and genuine actual source receipts (if obtained) to Comms Hub QL-243; do not invent proof.

**Next expected Build 511 — Etsy Local Claim Witness Review Follow-Up, Three-Photo Retest Evidence Renewal & Nonproduction Gateway Receipt Verification.**
