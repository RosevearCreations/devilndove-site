# Devil n Dove — Release 467 Build 666 AI Data source report and receipt handoff

**Role:** Devil n Dove is the independent **owned-business source** for its Products, customers, workshop, staff, finance and original owner evidence. **AI Data Platform** is master for suite-wide inventory, monitoring and evidence intelligence; **Rosevear Comms Hub** is the complementary master communications/incident plane. Neither becomes the owner of Devil n Dove's source records, tenancy, employee/customer details or publishing rights.

## What Build 666 makes available

The original Build 655 readiness register, source manifest and Build 665 channel controls now support a **single versioned, read-only local source report** with:

- Exact source/repository/owned-business-shell identity, current local Git commit revision and structural SHA-256 fingerprint (a checksum, **not** a signature).
- Manifest's declared source revision compared with the current local revision. A mismatch is `STALE_REVISION`; a match is still only `MATCHES_LOCAL_REVISION_UNATTESTED`.
- Eighteen proposed V1 registry fields with separately counted HOLD fields, existing evidence axes, independently current evidence count, and eight proposed but **disabled** event families.
- Explicit `UNRATIFIED` module denominator and `null` certified module completion (no manufactured 100% metric).
- A precise original owner/issuer/witness, signed receipt, approved audience, one-use nonce and transport **HOLD** envelope; no customer/staff records, OAuth material, device commands or cross-tenant data.

This is a **source-side read model** and optional manual evidence handoff, not an active webhook, Master Shell connection, signed receipt issuer or unattended background exporter. The existing QL-364 private health endpoint remains fail-closed until independently provisioned original source/master owner functions can approve, durably claim a nonce and sign its receipt. No live Master Shell network request occurs in this build.

## How we inspect the source-side proof

On a checked-out Devil n Dove repository:

```bash
node scripts/release467_build666_ai_data_source_report.mjs --check
node --test scripts/release467_build666_ai_data_source_report.test.mjs
```

For an owner-reviewed, local JSON export (no secrets, no network traffic):

```bash
node scripts/release467_build666_ai_data_source_report.mjs --json
```

The contract is in [`RELEASE_467_BUILD_666_AI_DATA_SOURCE_REPORT_CONTRACT.json`](RELEASE_467_BUILD_666_AI_DATA_SOURCE_REPORT_CONTRACT.json). The exported `sourceRevision` is the local Git `HEAD`, not a claim that the installed Cloudflare production revision matches that local checkout. Verify protected GitHub `main` and deployment proof separately before sharing the report.

## Next original-evidence connection steps — still HOLD

1. Obtain the exact owner-approved AI Data V1 schema, origin, version, permitted audience and retention policy. Map the original Devil n Dove source identity and correct versioned manifest; do not invent a current signer or hardcode a guessed current `main` SHA.
2. Confirm owner and independent witness identity/custody and the source-host signer enrollment. Keep private keys and identifiers out of copy/paste replies.
3. Establish the original nonce/replay store and one-use signed, narrow TEST GET. Verify the response against original source revision, manifest digest and both approved owner actors. The existing QL-364 endpoint will currently return **HOLD**, which is an expected safe result.
4. Have the Master Shell independently accept a fresh signed receipt, freshness threshold and permitted source/tenant boundaries. Only afterward approve any persistent audience/event publisher in a separate change.
5. Revisit completion percentages only after the 38 proposed module checkpoints, evidence weights, real device acceptance and owner decisions are ratified. A successful software CI/deploy is a release status, not a domain completion score.

**Currently:** local source reporting can pass CI, while `manifest=STALE_REVISION`, `owner-proof=HOLD`, `signed-receipt=HOLD`, `ai-data-connection=HOLD`, `comms-connection=HOLD`. Treat this as factual readiness, not an integration outage requiring credential disclosure.

**Next proposed Build 667:** Comms Hub Authorized Notifications, Workshop Status & Incident Handoff, retaining original consent, QL-365D TEST and per-event owner approval before any customer communication.
