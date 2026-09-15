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

The refined browser run then identified the first failing layer precisely: the page reached `complete`, but the application administrator session was inactive. Product picker population, Product-row rendering, and the Build 155 client-health marker consequently failed downstream. This means the acceptance runner was entering the Product screen with a stale configured session rather than proving the current Development application with a current session.

The browser workflow now resolves the newest unexpired administrator `session_token` directly from canonical Development D1 when the existing read-only Cloudflare credential is available, matching `/api/auth/me`'s bounded session lookup. The configured secret remains only a fallback when no current D1 session can be resolved. No session is created and no authentication, Product, schema, D1/R2 business-data, provider/payment/refund/accounting state is mutated.

The live-session workflow repair is registered on default `main` at `15557069ce60a21d0c8cfb88c9e3ca821301f760` and reconciled into `dev` ancestry at `8d24ae9fc0d66d14f094be86ba52e6654b3ea6e0`.

## Why this evidence commit exists

This evidence document intentionally creates a Development-only release-evidence delta under `docs/operations/**`, which is included in the canonical System Gate path contract. It retriggers the exact-SHA Development deployment so the corrected default-branch browser proof can observe the freshly deployed candidate using the current canonical Development administrator session.

The resulting Development SHA must be treated as a fresh candidate. System Gate, Current Application Quality Proof, I.T. Admin Runtime Proof, and the real-browser Development proof must complete successfully before `main` application promotion is permitted.

## Product Entry acceptance boundary

Build 155's source/quality/System Gate checks have passed on earlier candidate SHAs. The prior browser proof also established that the page itself completed and did not show render-loop, command-center-loading, or Worker-resource-limit evidence; its blocker was an inactive browser session.

The corrected proof remains GET/DOM-observation only and must now prove authenticated Product picker population, Product rows, the Build 155 client-health revision, render stability, normal event-loop responsiveness, and absence of Worker 1102 evidence before promotion.

## Safety

- Production application mutation: **NONE**
- Session/authentication mutation: **NONE**
- Schema mutation: **NONE**
- D1/R2 business-data mutation: **NONE**
- Payment/refund/provider/accounting execution: **NONE**
- Cloudflare Access policy weakening: **NONE**
- Promotion-gate weakening: **NONE**
