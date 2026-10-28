# QL-247 Devil n Dove source report — Phase A, PENDING / BLOCKED

This is the owner-safe return for `RosevearCreations/devilndove-site`. It is not the final signed QL-246 proof, a 7-case gateway test, an owner pilot approval or permission to expose credentials. Every field below intentionally reports the *current evidence class*, not a presumed success.

| Evidence field | Current truthful response |
| --- | --- |
| Application / repository | `devilndove` / `RosevearCreations/devilndove-site` |
| Current `main` SHA / green CI URL | **MUST VERIFY AFTER BUILD 514 PROMOTION** against immutable GitHub commit and exact run; do not reuse a Build 513 run |
| QL-246 signed source file at immutable SHA | **MISSING / BLOCKED**; cannot sign missing original denial witnesses |
| Public JSON SHA-256 / signer ID / independently delivered Ed25519 SPKI pin | **NOT PROVISIONED / NOT VERIFIED** |
| Business / tenant / environment | `devilndove` / `null` / `nonproduction` |
| Authorized nonproduction origin | **NOT INDEPENDENTLY VERIFIED**; do not publish private values |
| Allowed methods and paths | `GET /api/integration/v1/health`, `GET /api/integration/v1/capabilities` only |
| HMAC key ID / key registry/rotation receipt | **NOT INDEPENDENTLY PROVISIONED / VERIFIED**; never send key value |
| Real external authenticated health/capabilities GET receipt | **UNVERIFIED**; local nonce samples are not an external gateway witness |
| Seven actual denied cases and original independent witness traces | **UNVERIFIED** for all seven; no synthetic `true` proof |
| Durable gateway audit after restart and independent pinned signer | **UNVERIFIED** |
| Revocation, private runner / rollback / kill switch witness | **UNVERIFIED** |
| Test-only owner authorization | **NOT VERIFIED**; request separately before any real nonproduction test |
| Separate owner read-only pilot approval | **NOT GIVEN** |
| Product/listing references, Etsy/Marketplace writes, publication, SMS/dispatch | **DISABLED** |
| Actual connection state | **DISCONNECTED / HOLD** |

**Remaining operator blockers:** independent current source SHA/CI verification; approved nonproduction destination/reviewer/rollback; per-source 256-bit HMAC provision and Ed25519 signer in server secret stores; challenge plus public pin delivered out of band; actual 2 GET and seven denial traces, durable gateway audit and revocation/rollback witnesses; noncircular QL-246 signed-source versus proof-file commit revision interpretation; independent six-app retrieval; *later* separate owner pilot authorization.

Previous **verified production checkpoint only** (not a current Build 514 result): main `1b7f92715c68fb929ac3a03521402bc0092514db`, [Build 513 Pages deployment](https://github.com/RosevearCreations/devilndove-site/actions/runs/40722232695). Replace with actual Build 514 main SHA and CI URL after it is green; do not alter this historical checkpoint.

This source return is safe to forward to AI Data Platform and Comms Hub. **Do not paste secrets or private network addresses.** Full rationale in [Build 514 owner/technical handoff](../BUILD514_ETSY_OWNER_WITNESS_QL247_CONNECTION_PHASE_A.md).
