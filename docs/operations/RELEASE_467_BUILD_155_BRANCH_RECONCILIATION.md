# Release 467 Build 155 — Branch Reconciliation and Promotion-Gate Repair

## Purpose

This release evidence records the bounded branch-topology repair required after the Build 155 Development browser-proof workflow was registered on the default `main` branch before the Build 155 application promotion.

The workflow-only bootstrap created a legitimate but temporary `main`-only commit. `scripts/main_promotion_gate.py` correctly failed closed because the `main` tree was not reachable from `dev`.

## Repair

PR #178 merged the workflow-only `main` release-plumbing commit back into `dev`.

- Reconciled `dev` merge: `a611f0d2a7be02e36ab81cc1370768247b39f97d`
- Reconciled `main` ancestor: `26cbe3887c3bd66524f67d667f3e943be9a22a07`
- Build 155 application tree retained by the reconciliation merge: `7bccee8e2e387dd9227864dabf6cc46819ed2a77`
- GitHub compare merge base after repair: `26cbe3887c3bd66524f67d667f3e943be9a22a07`

The repair changes no Product/runtime implementation, schema, D1/R2 business data, provider/payment/refund/accounting state, or Production application deployment.

## Why this evidence commit exists

The reconciliation merge is tree-identical to the already-reviewed Build 155 Development tree, so GitHub path filtering did not emit a fresh System Gate run for that merge SHA. This evidence document intentionally creates a Development-only release-evidence delta under `docs/operations/**`, which is already included in the canonical System Gate path contract.

The resulting Development SHA must be treated as a fresh candidate. System Gate, Current Application Quality Proof, and I.T. Admin Runtime Proof must all complete successfully on the same exact `dev` SHA before `main` promotion is permitted.

## Product Entry acceptance boundary

This branch-topology repair does not claim that Product Entry browser acceptance has passed. Build 155's Product client source gate is green and the Development deployment is healthy, but the automated real-browser probe remains separately gated by the Cloudflare Pages Preview Access policy. That external Access boundary must be resolved without disabling Access or weakening application-admin authentication before browser acceptance is claimed.

## Safety

- Production application mutation: **NONE**
- Schema mutation: **NONE**
- D1/R2 business-data mutation: **NONE**
- Payment/refund/provider/accounting execution: **NONE**
- Cloudflare Access policy weakening: **NONE**
- Promotion-gate weakening: **NONE**
