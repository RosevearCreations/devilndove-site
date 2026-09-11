# Devil n Dove — Markdown / Authority Index

## Current authority — Release 467 Build 102

Build 102 — **Product Work Manual Reorder & Accessibility** is the current Development closure candidate.

Last fully verified Development is Build 101:
- `dev` `73cd0d56071a60c562000d5804f819f6dde10a13`
- tree `2ef06219e4b1eeb1e525680fc45107eb6ebc5226`
- System `34603707283` SUCCESS
- Quality `34603707270` SUCCESS
- I.T. `34603707267` SUCCESS
- Hygiene `34603707269` SUCCESS.

Current Production is Build 101:
- `main` `73cd0d56071a60c562000d5804f819f6dde10a13`
- tree `2ef06219e4b1eeb1e525680fc45107eb6ebc5226`
- Production Pages Deploy `34603913028` SUCCESS
- Production Live Resource Integrity `34604002146` SUCCESS.

## Current reading order

1. `current-development-authority.json`
2. `release467-build102-product-work-manual-reorder.json`
3. `release467-build101-product-work-priority.json`
4. `docs/operations/RELEASE_467_BUILD_102_PRODUCT_WORK_MANUAL_REORDER.md`
5. `docs/operations/RELEASE_467_BUILD_101_PRODUCT_WORK_PRIORITY.md`
6. `release467-build100-product-work-session.json`
7. `release467-build99-product-work-views-sort.json`
8. `release467-build98-product-readiness-triage.json`
9. `release467-build97-product-readiness-work-queue.json`
10. `release467-build96-product-browser-focus.json`
11. `release467-build95-product-workspace-current-context.json`
12. `release467-build94-product-workspace-readability.json`
13. `AI_HANDOFF.md`
14. `PROJECT_STATUS_AND_ROADMAP.md`
15. `SANITY_HEALTH_CHECK.md`
16. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`
17. `migrations/canonical/manifest.json`

## Build 102 authority contract

Build 102 consumes exact Build 101 Development and Production closure and closes the Manual-order gap from Build 101:
- Manual session order exposes keyboard-accessible Move Up and Move Down controls;
- boundary moves are disabled for the first/last item and controls are disabled outside Manual mode;
- reordered items retain priority, completion, blocker/readiness and added-at state;
- next Product and next blocker actions use the selected browser-local manual sequence;
- state remains in `dd_catalog_work_session_v1`;
- rendered Product rows, `dd_admin_products_snapshot_v2`, and already-rendered readiness evidence are reused;
- no additional Product or readiness API/database read is introduced;
- Build 101 priority/order, Build 100 work sessions, Build 99 work views/sort, Build 98 readiness triage and earlier Product protections remain active;
- no Product/Inventory business-data mutation, provider execution/publication, Cloudflare Access mutation, schema mutation or automatic Production promotion is introduced.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported. `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains active.