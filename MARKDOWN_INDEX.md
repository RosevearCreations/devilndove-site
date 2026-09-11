# Devil n Dove — Markdown / Authority Index

## Current authority — Release 467 Build 98

Build 98 — **Product Readiness Triage & Blocker Groups** is the current Development closure candidate.

Last fully verified Development is Build 97:
- `dev` `eef3c48a287cc919b1f4d964e8b504d4611e671e`
- tree `d2714d4e74fd7f85c9ca7efa0b63a366be1c4f63`
- System `34548442379` SUCCESS
- Quality `34548442377` SUCCESS
- I.T. `34548442359` SUCCESS
- Hygiene `34548442374` SUCCESS.

Current Production is Build 97:
- `main` `eef3c48a287cc919b1f4d964e8b504d4611e671e`
- tree `d2714d4e74fd7f85c9ca7efa0b63a366be1c4f63`
- Production Pages Deploy `34548574039` SUCCESS
- Production Live Resource Integrity `34548646961` SUCCESS.

## Current reading order

1. `current-development-authority.json`
2. `release467-build98-product-readiness-triage.json`
3. `release467-build97-product-readiness-work-queue.json`
4. `docs/operations/RELEASE_467_BUILD_98_PRODUCT_READINESS_TRIAGE.md`
5. `docs/operations/RELEASE_467_BUILD_97_PRODUCT_READINESS_WORK_QUEUE.md`
6. `release467-build96-product-browser-focus.json`
7. `release467-build95-product-workspace-current-context.json`
8. `release467-build94-product-workspace-readability.json`
9. `release467-build93-centered-application-shell-overflow-accessibility.json`
10. `release467-build92-prelaunch-action-queue-completeness.json`
11. `release467-build91-prelaunch-go-live-decision-convergence.json`
12. `release467-build90-external-acceptance-evidence-depth.json`
13. `docs/operations/RELEASE_467_BUILD_77_CANADA_ONLY_COMMERCE_RULES.md`
14. `AI_HANDOFF.md`
15. `PROJECT_STATUS_AND_ROADMAP.md`
16. `SANITY_HEALTH_CHECK.md`
17. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`
18. `migrations/canonical/manifest.json`
19. Earlier Release 467 authorities only when investigating historical implementation/provenance.

## Build 98 authority contract

Build 98 consumes exact Build 97 Development and Production closure and improves day-to-day Product readiness triage:
- readiness and first-blocker help are reused from the primary Products loader;
- no additional Product or readiness API/database read is introduced;
- blockers are grouped browser-locally into Media, SEO, Commerce, Copy / story, and Other;
- group counts and selected triage lane are browser-local presentation state;
- queue order remains lowest readiness score first within the selected lane;
- **Open next blocker** reuses the existing Product-row blocker action;
- **Show next Product** reuses explicit Product-row location;
- Build 97 readiness queue/focus, Build 96 Product search/focus, Build 95 current-Product/table ergonomics, Build 94 responsive workspace navigation and Build 93 centered-shell/right-side reachability remain active;
- no Product/inventory business-data mutation, provider execution/publication, Cloudflare Access mutation, schema mutation or automatic Production promotion is introduced.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported. `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains active.
