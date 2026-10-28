# Devil n Dove QL-248 two-SHA clarification — SOURCE RESPONSE: PENDING / HOLD

This is a public, nonsecret technical source reply for `RosevearCreations/devilndove-site`. It is **not** the final signed `docs/integration/ql246-source-proof.json`; that file is intentionally absent until all genuine tests, independent pins and challenge evidence exist. The amendment is proposed and requires explicit receiving-consumer agreement.

| Requested QL-248 fact | Current response |
| --- | --- |
| Repo / source system / business / tenant | `RosevearCreations/devilndove-site` / `devilndove` / `devilndove` / `null` |
| Exact tested `sourceRevisionSha` and corresponding CI run URL | **Verify from latest green main promotion**; do not reuse prior CI run |
| Later immutable `proofCommitSha` | **MISSING**; no signed proof has been accepted for publication |
| Exact raw JSON `proofSha256` | **MISSING**; no proof JSON exists to hash |
| Independently obtained public DER SPKI SHA-256 pin | **NOT INDEPENDENTLY VERIFIED**; do not copy pin from packet |
| Source accepts noncircular two-SHA *proposal* | **YES, as conditional code/documentation readiness only** |
| AI Data Platform QL-246 consumer independently agrees | **NOT VERIFIED** |
| Six-app Comms Hub QL-248 offline bundle independently verified | **NOT VERIFIED** |
| QL-243 per-app nonproduction HMAC key and key ID | **NOT PROVISIONED / NOT VERIFIED**; never include key value |
| Actual external authenticated two GET receipts | **UNVERIFIED** |
| Seven independently observed denials and original traces | **UNVERIFIED** (all seven) |
| Durable audit after restart, key revocation, rollback witness | **UNVERIFIED** |
| Separate owner nonproduction test authorization | **NOT GIVEN / NOT VERIFIED** |
| Separate owner read-only pilot authorization | **NOT GIVEN** |
| Product/listing reads, Etsy/Marketplace writes, SMS/dispatch | **DISABLED** |
| Actual connection | **DISCONNECTED / HOLD** |

**Verified previous production checkpoint only:** Build 514 `main` `46ecaea247498ad9bde8723d1c9721ce1d6b6e98`, [post-deploy integrity proof](https://github.com/RosevearCreations/devilndove-site/actions/runs/40729578245). It is **not** a claimed Build 515 source/test/proof commit. Report the exact newer source commit and CI only after Build 515 is promoted and verified green.

Remaining independent operator tasks: agree on distinct source/test SHA and later proof commit with AI Data Platform; source-specific secret-store signer and independent public SPKI pin; exact nonproduction destination/reviewer/scope/expiry/rollback and owner authorization; genuine health/capabilities GETs plus seven denial cases; durable audit/revocation; fresh challenge and real signed proof; six independent immutable file comparisons; separate later owner approval for any pilot.

No private keys, HMAC values, tokens, customer data, owner identity documents, household IPs or device/vault details should be copied into the return. See [Build 515 source and operator handoff](../BUILD515_OWNER_CONFLICT_QL247_TEST_AUTH_QL248_TWO_SHA.md).
