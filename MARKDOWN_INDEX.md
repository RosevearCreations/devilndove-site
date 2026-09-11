# Devil n Dove — Markdown / Authority Index

## Current authority — Release 467 Build 101

Build 101 — **Product Work Priority & Next-Action Ordering** is the current Development closure candidate.

Last fully verified Development is Build 100:
- `dev` `20400309f3ab450cc256769870e8f963f8d3de3c`
- tree `3344c8e4d8c177820ea5077f4b429ff1e832d881`
- System `34598663510` SUCCESS
- Quality `34598663549` SUCCESS
- I.T. `34598663501` SUCCESS
- Hygiene `34598663509` SUCCESS.

Current Production is Build 100:
- `main` `20400309f3ab450cc256769870e8f963f8d3de3c`
- tree `3344c8e4d8c177820ea5077f4b429ff1e832d881`
- Production Pages Deploy `34598827876` SUCCESS
- Production Live Resource Integrity `34598920977` SUCCESS.

## Current reading order

1. `current-development-authority.json`
2. `release467-build101-product-work-priority.json`
3. `release467-build100-product-work-session.json`
4. `docs/operations/RELEASE_467_BUILD_101_PRODUCT_WORK_PRIORITY.md`
5. `docs/operations/RELEASE_467_BUILD_100_PRODUCT_WORK_SESSION.md`
6. `release467-build99-product-work-views-sort.json`
7. `release467-build98-product-readiness-triage.json`
8. `release467-build97-product-readiness-work-queue.json`
9. `release467-build96-product-browser-focus.json`
10. `release467-build95-product-workspace-current-context.json`
11. `release467-build94-product-workspace-readability.json`
12. `AI_HANDOFF.md`
13. `PROJECT_STATUS_AND_ROADMAP.md`
14. `SANITY_HEALTH_CHECK.md`
15. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`
16. `migrations/canonical/manifest.json`

## Build 101 authority contract

Build 101 consumes exact Build 100 Development and Production closure and improves day-to-day Product workflow:
- pinned Products can be assigned Urgent, High, Normal or Low priority;
- session order can be Priority, Blockers, Readiness, Recent or Manual;
- next Product and next blocker actions use the selected browser-local session order;
- existing Build 100 session items safely default missing priority to Normal;
- priority/order state remains in `dd_catalog_work_session_v1`;
- rendered Product rows, `dd_admin_products_snapshot_v2`, and already-rendered readiness evidence are reused;
- no additional Product or readiness API/database read is introduced;
- Build 100 work sessions, Build 99 work views/sort, Build 98 readiness triage and earlier Product protections remain active;
- no Product/Inventory business-data mutation, provider execution/publication, Cloudflare Access mutation, schema mutation or automatic Production promotion is introduced.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported. `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains active.