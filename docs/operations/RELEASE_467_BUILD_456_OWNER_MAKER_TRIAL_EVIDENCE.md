# Devil n Dove Build 456 — Owner Maker Trial & Evidence Intake

**Release scope:** Private, guided, owner-attested checklist for **actual** Maker work. [Open the owner review workspace](/admin/maker-owner-trials/). Build 455's seven synthetic source journeys remain separate from real shop-floor acceptance.

## Operator trial procedure

1. Sign in as an Admin and open **Owner Maker Trials & Evidence** from the Admin Dashboard. Choose the six real-case pathways one at a time: jewellery/metal, resin/clay, digital fabrication, failed/reworked or salvaged piece, private therapeutic/learning project, and custom commission.
2. Choose an existing canonical Creative Project for the first five; for commission choose a **real** Custom Request. If the original source is absent, create it in the original module. The new screen never creates a fake source.
3. For each checkpoint, open its original record (Creative Process, Design Revisions, Traveler, Quality, Maker Media/rights, Cost Review, customer proof or commission completion), verify real-world observation, then select the matching **existing source ID**. A source ID is validated against the selected project/request by both the API and the canonical D1 insert guard.
4. Write a factual observation (24–1200 characters). Choose **HOLD** when evidence/consent/physical safety/customer verification is missing. For **accepted**, affirm personally verifying the real source and work; an unlinked/synthetic case cannot be accepted. Submit and retain the immutable receipt ID.
5. Refresh. The newest receipt per checkpoint determines its current checklist state; later HOLD supersedes earlier accepted. Prior evidence is never deleted or rewritten. Keep *physical product-safety certification, label compliance, genuine customer/provider approvals, payment, shipping and publishing* with their independent authorities.

### Checklist paths

| Owner trial | Checkpoints (each independently HOLD/accepted) |
|---|---|
| Jewellery & metalwork | Project identity, actual material evidence, process/QA, physical safety, media rights |
| Resin / clay / mixed media | Project identity, actual materials, process/QA, curing/safety, media rights |
| Digital fabrication | Project identity, CAD/design revision, process/QA, machine safety, media rights |
| Failed / salvage | Project identity, actual material loss/recovery, QA outcome, private factual story |
| Private therapeutic work | Project identity, privacy boundary, process/learning QA, rights of any media |
| Custom commission | Original request, genuine customer proof, cost/handoff review, completed maker-stage evidence, separate delivery HOLD |

## Data authority and privacy

- Forward-only canonical migration **0050** creates `maker_owner_trial_reviews`, an append-only private record with canonical source-kind/id, scenario/checkpoint, chosen project or Custom Request, human attestation, actor, idempotency key, SHA-256 and note. D1 guards prevent mismatched case evidence; no update/delete allowed.
- Page and endpoint are authenticated Admin-only, same-origin for writes and `private, no-store` for reads/writes. No public data endpoint, invented photo URL or stored customer email/phone is introduced. Do **not** write credentials or sensitive contact details in free-text notes.
- Source read lists are bounded (100 recent projects, 60 requests, up to 30 source rows per type, latest 120 trial receipts). Historical rows beyond that are explicitly marked truncated. An older source can be selected by the original workspace and requested as a future operator improvement; the UI does not silently pretend to show all records.
- Review acceptance is **human attestation**, not independently verified physical activity and never automatically propagates to Product, Inventory, Orders, Finance, Etsy, Meta, R2, shipping, public media, or safety/label certification.
- All six real owner trials begin **HOLD / NOT PROVIDED** until the operators supply actual source records and personally review them. No script, migration or CI fixture fills real-owner evidence.

## Verification and Production gate

Run the disposable checks:

```text
python scripts/release467_build456_owner_trial_sql_regression.py
node --test scripts/release467_build456_owner_trial_policy.test.mjs
node --check functions/api/admin/maker-owner-trials.js
node --check public/js/admin-maker-owner-trials.js
python scripts/migration_policy_gate.py
```

The SQLite fixtures reject a forged foreign project, voided process evidence, mismatched commission proof, unobserved acceptance, invalid checkpoint source, edits and deletion. These are **synthetic** tests only. Confirm Development migration 0050 is applied before Development Preview; verify same migration checksum in Production **before** dependent Pages deploy. Preserve the protected `dev → main` CI gates, exact-tree promotion, Cloudflare Production Pages, live resource integrity and public smoke, and report their actual run results. Never mark Production GREEN merely because the source fixture passed.

## Manual owner acceptance register

- [ ] Actual jewellery/metal case reviewed with genuine owner evidence.
- [ ] Actual resin/clay/mixed-media case reviewed, including physical safety/cure information.
- [ ] Actual fabrication case reviewed with original machine/design facts.
- [ ] Actual failed/salvage case reviewed with truthful material/learning outcome.
- [ ] Private therapeutic case reviewed with privacy intact, no required sale.
- [ ] Actual commission reviewed with customer approval and separated delivery/payment boundaries.
- [ ] Keyboard/touch/mobile, Admin sign-in and screen-reader owner usability session completed.
- [ ] Canadian product labeling/safety, authenticated Etsy draft and any external fulfillment/payment assertions approved through separate workflows.

**Next proposed:** Build 457 Maker Workbench Usability & Navigation. Implement only after the Build 456 technical release and subject to owner prioritization; usability should be refined from genuine trial friction, not synthetic scores.
