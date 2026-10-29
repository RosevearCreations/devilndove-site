# Devil n Dove Build 523 — new Product draft workflow and QL-257 real-witness intake

**Release target:** `dev` then exact-tree `main`, after Development and Production CI/Cloudflare proof. Software production GREEN never means Comms Hub connected.

## Owner's latest Etsy decision — effective Build 523

The two earlier trial Etsy drafts are **owner-managed outside this build**. Do not delete, unlink, reassign, update, approve or publish them. Product #48 and Product #53 are excluded from the *new* owner draft-creation button. An existing Etsy listing ID in the primary database stays unchanged.

For new Products, the Product Editor now follows this contract:

1. Fill one Product's name, SKU, slug, description, CAD price, stock, actual weight, maker details and other fields. Use Media to attach actual original photos; do not create an Etsy-only gallery.
2. Tick `Create / update an Etsy draft` or `Prepare for Facebook Marketplace` (or both). Save Product once. Those choices are merely locally persisted destination intent, **not** a provider POST.
3. In the same Product Editor, press **Check Product and all photos**. Independently GET the saved authoritative Product and canonical gallery. Every selected photo must have its real image ID, HTTPS nonplaceholder URL, descriptive alt text, owner-granted `all_public_ok` permission, verified dimensions at least 800 × 800 px and current server distribution approval. With more than ten originals, the Etsy flow stays blocked until the owner resolves the limit rather than silently dropping images. Media permission/quality cannot be assumed because a file is present.
4. If Etsy is selected, use the actual Etsy shop's verified taxonomy, Canada-only shipping/processing profiles and packed weight/length/width/height. These existing fields appear directly in the Product intake. Recheck source and provider setup; read-only checks never create a listing.
5. Explicitly acknowledge one **unpublished** Etsy Create/Update request and press POST. The new button delegates to the existing Build 500 at-most-once server-controlled package (draft fields, all permitted original photos, tags, advanced metadata). A verified provider listing number must be independently read back from the saved Product association. No automatic publication. An uncertain remote write blocks retries until real Etsy and database reconciliation.
6. Facebook Marketplace uses the same Product/media validation and prepares a manual text/photo handoff. Its partner listing POST stays unavailable until genuinely supported Meta authorization exists. We do not pretend to have posted through a Meta API.

Existing advanced/legacy Etsy trial controls remain accessible behind an advanced disclosure for support; they are no longer the front-page create flow. The owner handles the two old drafts independently.

## QL-257 source signer's *actual* evidence status

| Field | Exact state |
| --- | --- |
| App / repository | Devil n Dove / `RosevearCreations/devilndove-site` |
| Original tested source **A** | `340d6da39abed229094527dfc91a7fd423fabd02` |
| Matching original GREEN CI | [Run 40794862120](https://github.com/RosevearCreations/devilndove-site/actions/runs/40794862120) |
| Most recently verified proof path at immutable pre-523 `main` | `docs/integration/ql246-source-proof.json` — HTTP **404** at `58713dcaaac487eb5b9634e9e21e42aa83ea436e` |
| Real signer private-key provisioning | `SIGNER_STATUS_UNKNOWN` — private custody store cannot be inspected from public GitHub source |
| Actual independently authenticated source custodian | `NOT_AVAILABLE` |
| Independently authenticated distinct witness and reviewer | `NOT_AVAILABLE` |
| Original signed bounded challenge / independent SPKI pin | `NOT_AVAILABLE` |
| Proof-bearing distinct commit **B** / raw bytes SHA-256 | `NOT_AVAILABLE` |
| Separate owner TEST-only decision | `NOT_GIVEN` |
| Real nonproduction GET / seven independent denial receipts | `NOT_RUN` |
| Integration | `DISCONNECTED / HOLD` |

The repository now accepts an **actual** QL-257 privately obtained 5-minute Ed25519 challenge, the public SPKI key and a JSON receipt with opaque `custodian_receipt_id`, `witness_receipt_id`, `reviewer_receipt_id`, `source_sha_A`, `public_spki_sha256` and `nonproduction_tenant_id`:

```bash
node scripts/ql257_private_witness_intake_523.mjs \
  --public-spki-pem <PUBLIC_SPKI_FILE> \
  --challenge-file <ACTUAL_CHALLENGE_JSON> \
  --signature-file <ACTUAL_BASE64_SIGNATURE_FILE> \
  --private-receipt-file <OPAQUE_REFERENCE_RECEIPT_JSON>
```

The tool verifies the real Ed25519 possession signature, SHA A, scope, expiry, fingerprint equality and three distinct opaque IDs; **it deliberately cannot certify real human identity** from a self-submitted receipt. It never generates a private key, signs a fake QL-246 payload, contacts an authenticated gateway, sends Marketplace data, or authorizes owner TEST. Do not put private identity documents, keys, gateway URLs, token values or customer data in GitHub or this handoff.

### Next specific blocker

Privately name and authenticate the Devil n Dove-only signer-key custodian and approved secure store; appoint **two separate authenticated people** as nonce/pin witness and reviewer. The custodian must create/identify the real app-specific Ed25519 key in the protected store. The witness must issue/verify a fresh genuine five-minute challenge and independently pin its **public** SPKI fingerprint to the right isolated nonproduction tenant, with receipt references. The reviewer must check those original private records independently. Only after that can the owner separately grant a narrow future nonproduction GET window. No software branch merge substitutes for these actions.

## Suggested next build

**Build 524 — New Product Draft Flow Owner Trial, Saved Etsy ID Round-Trip and Marketplace Manual Handoff Review, plus QL-258 Independent Real Signer/Witness Receipt Decision (HELD until authenticated).**
