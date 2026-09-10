# Devil n Dove — Markdown / Authority Index

## Current authority — Release 467 Build 92

Build 92 — **Prelaunch Action Queue Completeness & Ownership** is the current Development closure candidate.

Last fully verified Development is Build 91:
- `dev` `1d5519b976d108e7d4a558876863be5559a67e35`
- tree `6a62d01c1be002b78c3c8d05993c40676e41e208`
- System `34486729268` SUCCESS
- Quality `34486729227` SUCCESS
- I.T. `34486729225` SUCCESS
- Hygiene `34486729311` SUCCESS.

Current Production is Build 91:
- `main` `1d5519b976d108e7d4a558876863be5559a67e35`
- tree `6a62d01c1be002b78c3c8d05993c40676e41e208`
- Production Pages Deploy `34488492622` SUCCESS
- Production Live Resource Integrity `34488622668` SUCCESS.

## Current reading order

1. `current-development-authority.json`
2. `release467-build92-prelaunch-action-queue-completeness.json`
3. `release467-build91-prelaunch-go-live-decision-convergence.json`
4. `docs/operations/RELEASE_467_BUILD_92_PRELAUNCH_ACTION_QUEUE_COMPLETENESS.md`
5. `docs/operations/RELEASE_467_BUILD_91_PRELAUNCH_GO_LIVE_DECISION_CONVERGENCE.md`
6. `release467-build90-external-acceptance-evidence-depth.json`
7. `docs/operations/RELEASE_467_BUILD_77_CANADA_ONLY_COMMERCE_RULES.md`
8. `AI_HANDOFF.md`
9. `PROJECT_STATUS_AND_ROADMAP.md`
10. `SANITY_HEALTH_CHECK.md`
11. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`
12. `migrations/canonical/manifest.json`
13. Earlier Release 467 authorities when investigating historical implementation/provenance.

## Build 92 authority contract

Build 92 consumes the exact Build 91 Development and Production closure and corrects the current prelaunch action queue:
- every Startup Readiness row not `passed` or `not_applicable` is shown as an unresolved launch action;
- action ordering uses explicit status priority and then due-date/title ordering;
- recorded owner and due date are shown without inventing missing values;
- the queue lists the complete unresolved Startup Readiness set rather than only Blocked/Failed rows;
- external acceptance remains a separate five-lane queue;
- degraded/unavailable readiness evidence fails closed;
- technical release GREEN remains distinct from unrestricted launch readiness;
- prelaunch status is GET/read-only and manual-refresh only;
- Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and existing local pickup remains supported;
- no provider execution/publication, readiness auto-write, Cloudflare Access mutation or automatic Production promotion is introduced.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains active.
