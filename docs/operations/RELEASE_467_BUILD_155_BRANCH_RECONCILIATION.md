# Release 467 Build 155 — Branch Reconciliation and Promotion-Gate Repair

## Purpose

This release evidence records the bounded branch-topology repair required after the Build 155 Development browser-proof workflow was registered on the default `main` branch before the Build 155 application promotion.

The workflow-only bootstrap created a legitimate but temporary `main`-only commit. `scripts/main_promotion_gate.py` correctly failed closed because the `main` tree was not reachable from `dev`.

## Repair

PR #178 merged the workflow-only `main` release-plumbing commit back into `dev`.

- Original reconciled `dev` merge: `a611f0d2a7be02e36ab81cc1370768247b39f97d`
- Original reconciled `main` ancestor: `26cbe3887c3bd66524f67d667f3e943be9a22a07`
- Build 155 application tree retained by the original reconciliation merge: `7bccee8e2e387dd9227864dabf6cc46819ed2a77`
- GitHub compare merge base after the original repair: `26cbe3887c3bd66524f67d667f3e943be9a22a07`

The Development browser workflow was subsequently given bounded failure classification on `main` and reconciled into the Development ancestry. The first classified run proved the remaining failure belongs to the document/auth/Product-row readiness family, while render/event-loop stability, command-center loading, and Worker resource-limit categories did not fire.

The default-branch browser workflow is now refined further to distinguish document completion, application-admin session activation, Product picker population, Product table row rendering, and the Build 155 client-health revision marker. This is diagnostic release plumbing only; it captures the existing read-only Chromium probe result and does not relax or bypass any acceptance assertion.

The repair changes no Product/runtime implementation, schema, D1/R2 business data, provider/payment/refund/accounting state, or Production application deployment.

## Why this evidence commit exists

This evidence document intentionally creates a Development-only release-evidence delta under `docs/operations/**`, which is already included in the canonical System Gate path contract. It retriggers the exact-SHA Development deployment so the refined default-branch browser diagnostic can observe the freshly deployed candidate.

The resulting Development SHA must be treated as a fresh candidate. System Gate, Current Application Quality Proof, I.T. Admin Runtime Proof, and the real-browser Development proof must complete successfully before `main` application promotion is permitted.

## Product Entry acceptance boundary

Build 155's source/quality/System Gate checks have passed on earlier candidate SHAs, and the Development browser workflow successfully resolves the existing Development administrator session and validates Cloudflare Access credential pairing before Chromium starts. The remaining blocker is therefore inside the real-browser Product UI acceptance step, not the session lookup or Access credential-pairing steps.

The refined failure classifier remains read-only and is used only to identify the exact acceptance assertion so the Product Entry defect can be repaired without weakening the gate.

## Safety

- Production application mutation: **NONE**
- Schema mutation: **NONE**
- D1/R2 business-data mutation: **NONE**
- Payment/refund/provider/accounting execution: **NONE**
- Cloudflare Access policy weakening: **NONE**
- Promotion-gate weakening: **NONE**
