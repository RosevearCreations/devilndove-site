# Devil n Dove — Markdown / Authority Index

## Current authority — Release 467 Build 97

Build 97 — **Product Readiness Work Queue & Blocker Navigation** is the current Development closure candidate.

Last fully verified Development is Build 96:
- `dev` `ba0e2f633d823b90fdcc2cbbbe6be4c50c79b284`
- tree `76f01771b844f6f610a621cd969d033cfa3d7c9c`
- System `34546959255` SUCCESS
- Quality `34546959190` SUCCESS
- I.T. `34546959188` SUCCESS
- Hygiene `34546959296` SUCCESS.

Current Production is Build 96:
- `main` `ba0e2f633d823b90fdcc2cbbbe6be4c50c79b284`
- tree `76f01771b844f6f610a621cd969d033cfa3d7c9c`
- Production Pages Deploy `34547083100` SUCCESS
- Production Live Resource Integrity `34547157869` SUCCESS.

## Current reading order

1. `current-development-authority.json`
2. `release467-build97-product-readiness-work-queue.json`
3. `release467-build96-product-browser-focus.json`
4. `docs/operations/RELEASE_467_BUILD_97_PRODUCT_READINESS_WORK_QUEUE.md`
5. `docs/operations/RELEASE_467_BUILD_96_PRODUCT_BROWSER_SEARCH_FOCUS.md`
6. `release467-build95-product-workspace-current-context.json`
7. `release467-build94-product-workspace-readability.json`
8. `release467-build93-centered-application-shell-overflow-accessibility.json`
9. `release467-build92-prelaunch-action-queue-completeness.json`
10. `release467-build91-prelaunch-go-live-decision-convergence.json`
11. `release467-build90-external-acceptance-evidence-depth.json`
12. `docs/operations/RELEASE_467_BUILD_77_CANADA_ONLY_COMMERCE_RULES.md`
13. `AI_HANDOFF.md`
14. `PROJECT_STATUS_AND_ROADMAP.md`
15. `SANITY_HEALTH_CHECK.md`
16. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`
17. `migrations/canonical/manifest.json`
18. Earlier Release 467 authorities only when investigating historical implementation/provenance.

## Build 97 authority contract

Build 97 consumes exact Build 96 Development and Production closure and improves day-to-day Product readiness navigation:
- readiness is reused from the badges already rendered by the primary Products loader;
- no additional Product or readiness API/database read is introduced;
- blocked Products are queued lowest readiness score first;
- queue cards show Product identity, readiness score, first blocker and help;
- **Open blocker** reuses the Product row's existing corrective action;
- **Show Product row** clears browser filters only after an explicit click;
- **Readiness blocked** and **Ready** focus views coexist with Build 96 text search and prior focus views;
- readiness-unavailable Products are not classified as ready;
- Build 96 Product search/focus, Build 95 current-Product/table ergonomics, Build 94 responsive workspace navigation and Build 93 centered-shell/right-side reachability remain active;
- no Product/inventory business-data mutation, provider execution/publication, Cloudflare Access mutation, schema mutation or automatic Production promotion is introduced.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported. `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains active.
