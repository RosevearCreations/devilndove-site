# Build 655 — Master Shell Source Readiness, Evidence Freshness and Event Schema Preparation

**Business source:** `devilndove`, owned-business shell in `RosevearCreations/devilndove-site`. **Scope:** offline, read-only source preparation for the two-part Rosevear Suite Master Shell. This is **not an enrollment, a signed event publisher, or an authenticated Comms connection**.

## What is implemented

- [Source-owned machine-readable readiness register](RELEASE_467_BUILD_655_SOURCE_READINESS_REGISTER.json) with exact shell identity, source evidence custody, historical Build 654 release proof, held registry fields and all eight candidate AI Data V1 event families.
- [Deterministic validator](../../scripts/release467_build655_master_shell_source_readiness.mjs), which checks the current manifest, required registry fields, missing signer/origin/role authority, source evidence paths, explicit audience allowlists and prohibited customer/private fields. Unknown and duplicate types fail.
- Evidence **freshness classification** based on *independent* verification time and owner-specified maximum age. Missing proof is `NO_CURRENT_INDEPENDENT_EVIDENCE`; expired proof is `STALE`; future or invalid proof fails closed. A source-code timestamp or manually reported check is not independent proof.
- Ten unit/regression cases and a protected GitHub quality step. No new UI polling, API route, database schema, network sends, customer access, inventory writes or real source credential usage.

## Contract references and exact gap

AI Data Platform's already-promoted [Build 335 V1 contract](https://github.com/RosevearCreations/ai-data-platform/blob/af06517da3ca712d4851a3f4fd710fb1194b7023/docs/BUILD_335_MASTER_SHELL_CONTRACT_V1_CORRELATION_EVENT_ENVELOPE.md) defines `rosevear.master-shell.event.v1` / `1.0.0` and 18 mandatory registry fields. This Build 655 file is **not** submitted as that registry schema: its `registryFieldReadiness` deliberately contains `null` for mandatory fields that the source cannot verify. Replacing them with plausible values to satisfy a JSON schema would be false acceptance.

The local validator currently reports 18 required fields, 11 deliberately `HOLD` and **zero independently current original source/field-acceptance proofs**. These numbers describe the local Build 655 preparatory register, **not** business-module completion or the entire suite. The independent protected Build 654 release is cited as historical release evidence; its software GREEN does not prove a private source signer or currently verified operator connection.

The exact missing acceptance categories are:

1. Approved production registry environment, immutable **newly promoted** revision and manifest URI/origin binding.
2. Original independently enrolled Ed25519 signer key/fingerprint, source/issuer/witness and owner consent custody, and one-use QL-364 signed private TEST receipt.
3. Real status observation and expiry, current independent evidence URI, versioned capabilities, scoped Master roles and authorized tenant boundary.
4. Owner-approved module requirement IDs, weights, evidence reviewers and mobile/tablet/desktop acceptance. [Build 652's percentage baseline](RELEASE_467_BUILD_652_MODULE_READINESS_BASELINE.md) stays provisional.
5. AI Data/Comms/Ree-and-Jack approval for V1 event audience, payload map, signed source sequence/correlation/idempotency, replay, retention and delivery. No event sender is activated.

## Event responsibility proposal, not permission

| Candidate family | Intended steward / consumer | Publication state |
| --- | --- | --- |
| `source.health.reported`, `release.promoted`, `module.readiness.changed` | Devil n Dove source facts, AI Data master evidence/monitoring | **HOLD** — signer, verified freshness and source/publisher grants |
| `workflow.status.changed` | Devil n Dove redacted workshop reference; AI Data and consent-authorized Comms | **HOLD** — source minimization, consent and audience approval |
| `incident.opened`, `incident.updated` | Devil n Dove factual incident references, Comms operator/incident ownership | **HOLD** — owner, dedupe, privacy and routing contract |
| `audit.evidence.recorded` | Devil n Dove immutable evidence references, AI Data | **HOLD** — signer, custody and retention |
| `consent.changed` | Source privacy decision reference, Comms audience | **HOLD** — original consent authority and customer-safe event approval |

Event families and payload allowlists are preparatory mappings. The actual source must use the master V1 parser and pass cryptographic/trust validation in a later approved build; this local JSON is not an event and does not call the master API.

## How to inspect locally (no credentials or network)

```bash
node scripts/release467_build655_master_shell_source_readiness.mjs --check
node scripts/release467_build655_master_shell_source_readiness.mjs --json
node --test scripts/release467_build655_master_shell_source_readiness.test.mjs
```

The JSON report exposes `registryFields.heldFields`, evidence custodians/freshness states and proposed event-family count. A PASS means the report is internally honest and its referenced *local* source files exist; it is **not** a remote connection success.

## Safe next steps

- Build **656**: stable per-module requirement evidence and genuine owner/device review acceptance, with AI Data owning aggregate percentages.
- After AI Data's V1 registry/ingestion and Comms peer contracts are agreed, request source-specific mapping approval before generating any live event or source registry submission.
- Original QL-364 trust verification remains owner/witness-controlled and an explicit **HOLD** until independently completed. A TEST-only success cannot silently grant persistent connections or customer messaging.
- Each future source release still follows protected `dev` → `main`, Cloudflare deployment, and independent live proof. Production GREEN and integration CONNECTED remain separate facts.

**Authoritative previous assessment:** [Build 654 Master Shell assessment](RELEASE_467_BUILD_654_MASTER_SHELL_ASSESSMENT.md). **Revised forward queue:** [Builds 655–668](RELEASE_467_MASTER_SHELL_QUEUE_655_668.md).
