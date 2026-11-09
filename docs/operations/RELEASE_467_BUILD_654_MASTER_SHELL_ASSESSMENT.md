# Devil n Dove — Rosevear Suite Master Shell Architecture Assessment

**Scope:** Source application `devilndove` (`RosevearCreations/devilndove-site`), owner-operated business shell. **Reference:** Ree and Jack Rosevear's proposed *Rosevear Suite Master Shell Architecture and Integration Handoff*, version 1.0, 8 November 2026, and the authoritative Comms [QL-365D attachment handoff](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL365D_SIX_APP_COMMS_ATTACHMENT_VALIDATION_HANDOFF.md).

**Decision:** Preserve existing guarded shell contracts and prepare the source for the proposed two-part architecture. **Do not activate new event publication, common Sysop credentials, Comms sends, customer-data movement or source signer enrollment until AI Data Platform, Comms Hub and Ree/Jack approve exact versioned contracts and original trust evidence.** Build 654 is a software/workshop release, not a connected-source certification.

## 1. Current source identity and contract custody

| Item | Inspected application source / state | Conclusion |
| --- | --- | --- |
| Source shell identity | `.well-known/rosevear-integration-manifest.json`: `source_id=devilndove`, `source_app_id=devilndove`, repository `RosevearCreations/devilndove-site`, audience `rosevear-master` | Exact shell-level ID; owned brand, not a child-tenant credential |
| Discovery freshness | Manifest declares historical `source_revision=1f0e220b0cf7aff2dfeb650c96304d96502ede54` and unsigned Ed25519 signer | Discovery listing only; revision is not the current promoted Build 653/654 commit. Re-pin only under approved contract/change control |
| Original protected source handler | `functions/api/_lib/ql364-source-health.mjs` | QL-364 private TEST-only health GET validation code present; authorization, atomic one-use claim and source receipt signing require independent callbacks |
| Shell endpoints | `functions/api/integration/v1/shell/{health,capabilities}.js`, `functions/api/_lib/ql336-owned-shell.mjs` | GET-only, child-identity rejection, and `DISCONNECTED / HOLD` on missing signer/trust custody; no fabricated success |
| Legacy metadata endpoints | `functions/api/integration/v1/{health,capabilities}.js` | Separate read-only metadata contracts; `events`, `commands`, customer data, inventory writes and Etsy publication disabled |
| Module readiness | `docs/operations/RELEASE_467_BUILD_652_MODULE_READINESS_BASELINE.md` | Engineering estimates only; no approved per-requirement numerator/denominator or real device/provider acceptance |
| Release evidence | Protected quality gate, Cloudflare Pages and independent live resource proof from each promoted main commit | Useful release truth; does **not** establish original source signer custody or persistent integration |

No production connection was independently established in this assessment. **Connection state remains `DISCONNECTED / HOLD`** unless later protected original-source evidence proves otherwise. No private signature, original issuer/witness review, one-use QL-362 GET receipt, persistent approval or tenant/customer consent is asserted here.

## 2. Fit to the proposed Master Shell

| Master requirement | Reusable capability | Missing or held work | Safe owner disposition |
| --- | --- | --- | --- |
| AI Data master inventory | Exact shell ID, repository and source-owned manifest | Canonical registry acceptance, immutable revision refresh, signed evidence and status expiry | **HOLD** registry enrollment; submit source facts for schema review |
| Module completion and role/device readiness | Detailed baseline by customer/worker/admin desktop, tablet and mobile, plus financial/maker modules | Approved stable requirement IDs, weights, denominators, acceptance timestamps, reviewer decisions | **PLANNED**, no invented audited percentages |
| Source monitoring / event envelope | Existing guarded health metadata and protected release evidence | Approved `source.health.reported`, `release.promoted` and `module.readiness.changed` v1 schema, signature, delivery, replay and expiry | **PLANNED**, no event sender enabled |
| Comms operator follow-up | Workshop queue, dated decisions, safe owner handoffs, manual bookmarks | Consented, minimal `workflow.status.changed` reference projection and Comms intake receipt | **HOLD** customer messaging / task routing until contract and policy approval |
| Authentication and tenants | Protected business Admin roles, source-specific GET gates, no child shell impersonation | Two separate Ree/Jack Master Sysop MFA sessions, per-app audience/role authorization and deep-link token validation | **EXTERNAL MASTER OWNER**, no shared-password account |
| One-to-one and one-to-many | Clear app-owned source identifiers, read-only integration affordance | Topic and audience grants, target receipts, per-consumer replay safety and opt-in | **PLANNED** after schema and consent review |
| Many-to-one / many-to-many | Product, inventory, project and order records available within app boundary | Tenant-safe redacted aggregate contract and approved consumer partitioning | **HOLD** cross-source data until explicit field mapping |
| Security, privacy and audit | Fail-closed original GET handler, no automatic workshop writes, current security/release gates | Independent source signer enrollment, signed owner decisions, retention policy, security/UAT review | **HOLD** original trust and real acceptance |
| Master status dashboard | Local I.T./Management panels and evidence-linked quality results | Source-verified health freshness, lag, SLOs, current connected count and independent incident custody | **PLANNED** canonical AI Data view; no false GREEN connection badge |
| Future app compatibility | Source shell already separate from Etsy/Meta permissions | Version negotiation, unknown-source quarantine, idempotent event replay and schema drift review | **PLANNED** expandable registry |

## 3. Proposed source update responsibility and cadence

The following is a **target interface, not an enabled publisher or agreed SLA**. The AI Data Platform team owns schema approval and aggregate score calculation; Devil n Dove owns signed/approved source facts; Comms owns consented routing and notification results.

| Candidate event family | Devil n Dove source-owned facts | Intended consumer | Proof needed before enabling |
| --- | --- | --- | --- |
| `source.health.reported` | Immutable revision, environment, status, method, observed timestamp, expiry and source-signature evidence | AI Data / authorized Comms status | Original source trust, signed envelope, freshness TTL and independent receipt |
| `release.promoted` | Protected main commit/tree, successful checks, Cloudflare deployment and independent live-proof links | AI Data / IT | Contract-approved evidence URIs and per-consumer acknowledgement |
| `module.readiness.changed` | Stable requirement ID, scope/role/device, weights, accepted numerator/denominator, evidence, reviewer and blockers | AI Data canonical completion engine | Approved requirement inventory and owner signoff; provisional Build 652 scores stay provisional |
| `workflow.status.changed` | Redacted workshop/commission reference, saved plan state and dated decision verification | AI Data and consent-authorized Comms queue | Audience-specific minimization and owner consent; never expose note bodies or act on stock |
| `incident.opened/updated` | Failure or aging condition, severity, owner, evidence freshness and safe next step | Comms / AI Data | Incident ID ownership, dedupe, routing policy and no implied resolution |
| `audit.evidence.recorded` | Immutable evidence reference/hash and authorized source custodian, without private key bytes | AI Data / IT | Approved evidence retention, signature and attestation chain |

The handoff proposes a 60-second heartbeat, stale status after two missed intervals, critical delivery under 60 seconds, module update on change and daily reconciliation. **These are design targets only**; no actual Devil n Dove heartbeat, event delivery SLO or authenticated private connection is proven by this build.

## 4. Staged implementation plan and acceptance owners

1. **Shared contract decisions — AI Data + Comms + Ree/Jack:** approve registry fields, event schema version, source/target audiences, status state machine, approved origins, signer/tenancy mappings, update cadence and event retention. Keep `DISCONNECTED / HOLD` until independent authorization.
2. **Requirements and evidence ledger — Devil n Dove + AI Data:** define the business modules and customer/worker/admin device scenarios, assign stable requirement IDs and weights, attach source links and reviewer decisions. Import provisional Build 652 estimates as *estimates*, not accepted requirements.
3. **Read-only source reporting — Devil n Dove:** after schema approval, implement guarded source-owned status and promotion-evidence snapshots. Verify no customer fields, private keys or provider writes; reject unknown schemas, expired sources, tenant mismatch, replay and conflicting idempotency keys.
4. **Original QL-364 TEST authorization — original owners and Comms trust custodians:** independently complete source signer/issuer/witness proof, one-use nonce claim and private TLS-pinned GET acceptance under QL-365D/366. A TEST receipt stays TEST-only; permanent connection needs its own grant.
5. **Consented Comms fan-out — Comms + Devil n Dove:** agree minimal order/commission/workshop reference events; test one-to-one, one-to-many, many-to-one and many-to-many paths with duplicate, outage, expiry, audience and privacy denials. No Etsy/Meta posting, customer message, order refund, stock write or inventory mutation is implied.
6. **Operational pilot — Ree/Jack with independent verification:** one app at a time; validate desktop/tablet/mobile role journeys, recoverability, lag/expiry, rollback, signed receipts and real status dashboards before declaring operational CONNECTED.

**Unmet original trust conditions are stop conditions, not code-release prerequisites.** Keep protected `dev`/`main` CI and independent production proof intact. Do not duplicate verified QL-365D source work or demand repeat PowerShell checks merely to advance this proposed architecture.

## 5. Changes intentionally not made in Build 654

- No shared event schema or master registry entry was unilaterally activated.
- No new cross-application endpoint, API key, background polling, external customer communication, credentials, tenant impersonation, signer enrollment or `CONNECTED` badge was created.
- No module percentage was raised without accepted evidence. The Build 652 baseline remains provisional until AI Data Platform approves a numerator/denominator and reviewer model.
- Build 654's review-comparison UI only operates on already verified page-level owner queue evidence and requires separate original history reads and saves.
