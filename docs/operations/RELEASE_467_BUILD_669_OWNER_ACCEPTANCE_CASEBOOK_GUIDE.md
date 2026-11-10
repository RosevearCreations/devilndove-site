# Devil n Dove Build 669 — original-evidence casebook and recovery follow-up

**Purpose:** give Ree and Jack one concise, deterministic Devil n Dove **source-owned** follow-up queue without restarting the original-host PowerShell or creating new signers. Existing evidence is reviewed first. This software cannot sign, import, enroll or certify an original receipt, test the other five applications, authorize a publisher or restore production.

## Generate the local owner casebook

```bash
node --test scripts/release467_build669_owner_acceptance_casebook.test.mjs
node scripts/release467_build669_owner_acceptance_casebook.mjs --check
node scripts/release467_build669_owner_acceptance_casebook.mjs --json
```

The script reads Builds 655/666/667/668's existing original-source evidence contracts, compares the manifest against local Git revision and replays **local read-only negative** checks only. A locally matching manifest would still be **unattested**. It does not contact AI Data, Comms, Yard Workers, iCamp, Rosie Dazzlers or Rosevear AI Hub, or open a network endpoint. It performs **zero** customer-data reads, sends, backups, restores or approvals.

## Follow-up queue (single-source Devil n Dove only)

| Case | Owner / reviewer | Action, using existing evidence first | Initial result |
| --- | --- | --- | --- |
| DN669-01 | Devil n Dove source owner | Match protected `main` release and **deployed** manifest and QL364 source handler; record actual source revision and original digest | **STALE** local manifest, original proof HOLD |
| DN669-02 | Independent evidence reviewer | Reconcile already captured original source issuer, owner and witness receipts; verify public signer fingerprints and their custody; no credential sharing | **HOLD** |
| DN669-06 | Independent recovery reviewer | Review original D1/R2 backup records, retention, separated isolated restore receipt and rollback approval | **HOLD** |
| DN669-03 | Source + master owner | Only after 01/02, reconcile an existing owner-authorized **one-source** signed QL365D TEST and durable one-use replay evidence | **BLOCKED** |
| DN669-04 | Source + AI Data owner | Verify separately approved **redacted source-health** audience and retention for intelligence plane; never general tenant access | **BLOCKED** |
| DN669-05 | Source + Comms owner | Verify separately approved Comms route, consent, event family and incident audience; do not send live notifications | **BLOCKED** |
| DN669-07 | Independent reviewer | Review complete Devil n Dove single-source acceptance: current source revision, both exact audiences, negative tenant/device proof and witnessed recovery | **BLOCKED** |

The first three are **reviewable evidence-gathering tasks**, not proof that the corresponding integration or restore is ready. A case is not accepted merely because its checklist exists or local unit tests are green. The queue cannot automatically close cases or accept user-supplied flags.

## Original proof and independent acceptance

1. Inspect the **already recorded** source-owner and separate master-owner evidence from Ree's original host and Jack's independent machine, using only public fingerprints, original signed decisions and source/receiver custody. Do not ask anyone to paste passwords, private keys, bearer tokens or personal records into chat.
2. Reconcile the exact original QL365D source ID `devilndove`, approved audience, path `/api/integration/v1/shell/health`, source and master timestamps, one-time operation ID, nonce/replay handling and independent reviewer disposition. **No duplicate TEST is authorized** by Build 669.
3. Independently verify protected `main` deployment provenance and live manifest. A repository-local hash or CI success does not attest the deployed source, its signer or the original recipient.
4. Accept AI Data monitoring and Comms notifications as **two distinct owner decisions**. The product/business shell holds customers, staff, payroll, orders and workshop details; the Master Shell may see only approved redacted evidence. Yard Workers and iCamp product-shell status must not impersonate Rosevear Landscaping or Camp Rosevear tenants.
5. Independently verify D1/R2 snapshots and an **isolated witnessed restore** plus approved rollback. No production restore is requested by this casebook.
6. Capture reviewer decisions at the original systems and reconcile the latest release revision. Keep unknown or stale fields **HOLD**; only a future authorized importer may turn an independently verified original receipt into a connected status.

## How to interpret GREEN

Build 669 can be **production GREEN as a safely deployed casebook** while connection, original signed receipts, independent restore and all seven acceptance cases remain **HOLD/BLOCKED**. Its own ledger is intentionally not an approval system.

**Next proposed Build 670:** Workshop Production Scheduling, Material Cost Visibility & Owner Operations Dashboard, pending owner priority. Resume practical maker/retail features instead of repeatedly generating speculative signer readiness.

References: [QL365D six-app attachment contract](https://github.com/RosevearCreations/rosevear-comms-hub/blob/main/docs/handoffs/QL365D_SIX_APP_COMMS_ATTACHMENT_VALIDATION_HANDOFF.md), [Build 668 owner guide](RELEASE_467_BUILD_668_MASTER_SHELL_PILOT_OWNER_GUIDE.md), and the [machine-checkable casebook](RELEASE_467_BUILD_669_OWNER_ACCEPTANCE_CASEBOOK_CONTRACT.json).
