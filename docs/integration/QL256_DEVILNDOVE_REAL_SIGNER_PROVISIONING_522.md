# Devil n Dove QL-256 — authentic signer/custody decision and environment inventory

Checked against the actual `RosevearCreations/devilndove-site` source and public GitHub origin on 29 October 2026. This is **not** a signed QL-246 proof, independent witness attestation, owner approval or network test.

## Specific real evidence returned now

| QL-256 field | Actual result |
| --- | --- |
| Application | Devil n Dove (`RosevearCreations/devilndove-site`) |
| Verified `main` at start of Build 522 | `5017939f3b63e3f63d79a83f34357956cbafd0b4` |
| Signing-key provisioning decision | **`SIGNER_STATUS_UNKNOWN`** — no approved source signer/custodian attestation is accessible to the build maintainer; cannot inspect private GitHub/Cloudflare secret stores |
| Tested source **A** | `340d6da39abed229094527dfc91a7fd423fabd02` |
| Matching original CI for **A** | [GitHub Actions run 40794862120](https://github.com/RosevearCreations/devilndove-site/actions/runs/40794862120) — `head_sha` exactly A, `status=completed`, `conclusion=success` (independently queried) |
| Genuine signed QL-246 proof at immutable `main` | **HTTP 404** for `docs/integration/ql246-source-proof.json` |
| Distinct proof commit **B**, raw bytes digest | **`NOT_AVAILABLE`** — do not publish a sample |
| Independent public Ed25519 SPKI SHA-256 | **`NOT_AVAILABLE`** — no trusted pin, no privately authenticated custody record |
| Custodian, distinct challenge witness, reviewer | **`NOT_ASSIGNED / PRIVATE_REVIEW_REQUESTED`** |
| Separately identified nonproduction Devil n Dove tenant | **`PRIVATE_REVIEW_PENDING`** |
| Owner scoped TEST-only authorization | **`NOT_GIVEN`** |
| Real gateway GET and original seven negative-test receipts | **`NOT_RUN`** |
| Integration | **`DISCONNECTED / HOLD`** |

`SIGNER_STATUS_UNKNOWN` is deliberate: missing source proof does not establish the contents of a private key store. The repository contains tests with *synthetic* Ed25519 keys, which cannot be promoted as real operational signer evidence. No signer was generated, installed, exported or copied into production by Build 522.

## Variables and bindings already identifiable

These are **public configuration names and non-secret values**, verified against the committed `wrangler.toml` and the actual production deployment workflow. They are not a dump of runtime secrets.

| Name / binding | Verified Development value | Verified Production target / evidence |
| --- | --- | --- |
| Cloudflare Pages project | `devilndove-site` | `devilndove-site` |
| `DND_ENVIRONMENT` | `development` | `production` from deployment-generated bindings |
| `DND_PAGES_PROJECT` | `devilndove-site` | `devilndove-site` |
| `DB` (D1 binding) | `devilndove-dev`, ID `dbc1615b-dcbe-4951-973b-b47c99c73bfa` | `devilndove-prod-r462`, ID `f34a741b-0000-45b0-9a96-6be08754d563` |
| `PRODUCT_MEDIA_BUCKET` (R2) | `devilndove-toolshed-images-dev` | `devilndove-toolshed-images` |
| `CAIP_PRIVATE_MEDIA_BUCKET` (R2) | `devilndove-caip-media-dev` | `devilndove-caip-media` |
| Production public origin | — | `https://devilndove.com` |
| `CLOUDFLARE_ACCOUNT_ID` (deployment workflow) | — | `c0d5bc25df16ae5b7d47c985c4b7b787` (public account identifier; **not** an API token) |

The Development `wrangler.toml` also contains `RELEASE463_PRODUCT_MEDIA_PROD_BUCKET`, temporarily binding the production Product R2 bucket for a separate guarded recovery bridge. This is a **cross-environment configuration to review/removal after its original recovery proof**, not a QL-256 signer secret. Build 522 does not touch it.

## Secret/configuration names to verify privately

| Name | Purpose | What is actually known |
| --- | --- | --- |
| GitHub Actions `CLOUDFLARE_API_TOKEN_EDIT` | Production Pages deployment/control-plane proof | Used by successful production deployment workflow; **value never accessible here** |
| GitHub Actions `CLOUDFLARE_API_TOKEN` | Conditional D1 migration jobs | Referenced in workflow; presence/value **not independently read** |
| `ETSY_API_KEYSTRING` | Etsy API application keystring | Required in runtime source; actual deployed presence/value **not independently read** |
| `ETSY_SHARED_SECRET` | Etsy API shared secret | Required in runtime source; actual deployed presence/value **not independently read** |
| `ETSY_REDIRECT_URI` | Etsy OAuth callback | Code requires `https://devilndove.com/api/social/oauth/etsy/callback` for main; whether configured **not independently read** |
| `SESSION_SECRET`, `JWT_SECRET`, `ADMIN_SIGNING_SECRET` | Authentication/session signing where applicable | Referenced by runtime code; values **not inspected** |
| `ROSEVEAR_INTEGRATION_KEY_ID_V1` | Candidate nonproduction HMAC key identifier | Source supports it, but actual key ID/configuration **not verified** |
| `ROSEVEAR_INTEGRATION_HMAC_SECRET_V1` | Existing HMAC gateway credential contract | **Not verified / must not be reused** as Ed25519 source signer |
| `ROSEVEAR_INTEGRATION_ENVIRONMENT_V1` | Nonproduction integration environment identity | **Not verified** |
| `ROSEVEAR_INTEGRATION_REVOKED_V1` | Revocation safety gate | Source supports `true` to deny; current state **not verified** |
| `ROSEVEAR_QL245_TRUSTED_DEVILNDOVE_SPKI_SHA256` | Independently supplied external SPKI pin | Runtime source checks 64-character hex; actual trusted pin **not verified** |
| QL-256 **Devil n Dove source signer private key** | New app-unique Ed25519 proof signing | **Not provisioned or accessible here. Never add it to `wrangler.toml`, GitHub, a Product field or chat.** |

Do not enter made-up strings to make a diagnostic green. Do not share the values of secrets in a chat, commit, screenshot, issue or proof handoff. [Source: committed `wrangler.toml`](https://github.com/RosevearCreations/devilndove-site/blob/5017939f3b63e3f63d79a83f34357956cbafd0b4/wrangler.toml), [production deployment workflow](https://github.com/RosevearCreations/devilndove-site/blob/5017939f3b63e3f63d79a83f34357956cbafd0b4/.github/workflows/production-pages-deploy-current.yml).

## Real QL-256 signer provision flow — operator action required

1. **Owner privately appoints three different people/roles:** Devil n Dove private signing-key custodian, independent nonce/pin witness, and independent reviewer. Record their authenticated identities in a trusted private register (not GitHub). The build maintainer has no authority to invent these assignments.
2. **Owner chooses a private key store:** one approved protected environment under that custodian's control, preferably hardware-backed or an access-restricted local secure vault. Do not provision in a temporary CI runner or application code.
3. **Custodian generates a new Devil n Dove-only Ed25519 key pair there**, retains private material exclusively in the chosen protected store, exports only the public SPKI PEM for inspection, records non-secret key ID and the exact public SPKI SHA-256. A public key alone is **not** proof of custodian identity or key possession.
4. **Witness privately issues a fresh real QL-256 challenge** no longer than five minutes, with `context=rosevear.integration.v1.ql256.signer-possession`, exact source A above, an owner-approved isolated nonproduction tenant ID, and UTC creation/expiry. Custodian signs the exact UTF-8 challenge JSON bytes; witness verifies the signature and the separately authenticated person and source of the key. Their receipt ID must remain private except for an opaque non-secret reference.
5. `node scripts/ql256_original_signer_preflight_522.mjs --public-get <full-main-sha> --public-spki-pem <public-only-file> --challenge-file <privately-issued-5-minute-json> --signature-file <base64-signature-file>` verifies cryptographic possession and current public GitHub evidence; its output **cannot** elevate private trust to GREEN. Never pass a private key to this tool.
6. Owner **separately authorizes** a specific nonproduction Devil n Dove tenant, future UTC window no longer than 30 minutes, `GET` to only `/api/integration/v1/health` and `/api/integration/v1/capabilities`, after independently verified signer/witness and reviewer acceptance. The handoff itself is **not permission**.
7. Only after original authenticated GET and seven negative-denial receipts, tenant isolation, audit persistence and revocation/rollback evidence are obtained may the eligible canonical QL-246 payload be signed by the real custodian. Signed JSON must reference tested **A**, not future proof commit **B**; publish it only at descendant **B** to `docs/integration/ql246-source-proof.json` and independently re-fetch immutable B with HTTP 200, hash exact raw bytes, and verify A→B ancestry and custody pin.

**Next exact blocker:** identify/privately authenticate the actual Devil n Dove signer custodian and its secure signing-key store, and appoint a different authenticated witness and reviewer. No trusted signer challenge receipt, independently verified public SPKI pin or approved nonproduction tenant has been provided to this build. Code deployment cannot resolve those human custody facts.

## Etsy owner trial remains separate

- Product #48 (`DND-01067`, Teal Jasmine Rounds) has a saved-versus-browser difference in `meta_description` after an uncertain Product Save. Build 522 displays **both exact values** in an expandable field comparison. Choose Keep saved server version or Restore browser edits only after reviewing; neither choice automatically sends a write or links an Etsy listing.
- Product #53 Etsy draft `#4603838854` remains unpublished until the owner personally checks the actual three original photos (`#344–346`) against the current Etsy images and reads its real D1 owner receipt. A software release or integration test is not that acceptance.

## Build 523 proposal

**Build 523 — Product #48 Owner-Selected Meta Description Closure & Product #53 Actual Three-Photo Approval Receipt Review, plus QL-257 Privately Witnessed Signer Challenge Intake (HELD until separately authenticated).**
