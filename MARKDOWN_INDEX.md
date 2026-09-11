# Devil n Dove — Markdown / Authority Index

## Current authority — Release 467 Build 104

Build 104 — **Product Work Session Focus Views** is the current Development closure candidate.

Last fully verified Development is Build 103:
- `dev` `8c5d73cbf9edbd5e40d1e2e03e3bd350df5b0146`
- tree `f4e7b2071710c50cfdd3b33ca84bbb85650d86ee`
- System `34617580379` SUCCESS
- Quality `34617580435` SUCCESS
- I.T. `34617580311` SUCCESS
- Hygiene `34617580348` SUCCESS.

Current Production is Build 103:
- `main` `8c5d73cbf9edbd5e40d1e2e03e3bd350df5b0146`
- tree `f4e7b2071710c50cfdd3b33ca84bbb85650d86ee`
- Production Pages Deploy `34617779013` SUCCESS
- Production Live Resource Integrity `34617890313` SUCCESS.

## Current reading order

1. `current-development-authority.json`
2. `release467-build104-product-work-session-focus.json`
3. `release467-build103-product-work-session-paging.json`
4. `docs/operations/RELEASE_467_BUILD_104_PRODUCT_WORK_SESSION_FOCUS.md`
5. `docs/operations/RELEASE_467_BUILD_103_PRODUCT_WORK_SESSION_PAGING.md`
6. `release467-build102-product-work-manual-reorder.json`
7. `release467-build101-product-work-priority.json`
8. `release467-build100-product-work-session.json`
9. `release467-build99-product-work-views-sort.json`
10. `release467-build98-product-readiness-triage.json`
11. `release467-build97-product-readiness-work-queue.json`
12. `release467-build96-product-browser-focus.json`
13. `release467-build95-product-workspace-current-context.json`
14. `release467-build94-product-workspace-readability.json`
15. `AI_HANDOFF.md`
16. `PROJECT_STATUS_AND_ROADMAP.md`
17. `SANITY_HEALTH_CHECK.md`
18. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`
19. `migrations/canonical/manifest.json`

## Build 104 authority contract

Build 104 consumes exact Build 103 Development and Production closure and adds browser-local focus views over the existing Product work session:
- focus modes are All, Active, Blocked, Ready and Done;
- focus is presentation-only and changing focus returns focused paging to page 1;
- Build 103 20-item paging operates against the focused result set while the summary also reports the total session size;
- Active excludes completed Products, Done contains only completed Products, and Blocked/Ready reuse already-rendered readiness evidence;
- Locate next Product and Open next blocker continue to scan the complete ordered session regardless of focus;
- Manual Move Up / Move Down is available only with All focus so hidden focused items cannot make stored manual order ambiguous;
- state remains in `dd_catalog_work_session_v1`; rendered Product rows, `dd_admin_products_snapshot_v2`, and already-rendered readiness evidence are reused;
- no additional Product or readiness API/database read is introduced;
- Build 103 paging, Build 102 manual reorder, Build 101 priority/order, Build 100 work sessions, Build 99 work views/sort, Build 98 readiness triage and earlier Product protections remain active;
- no Product/Inventory business-data mutation, provider execution/publication, Cloudflare Access mutation, schema mutation or automatic Production promotion is introduced.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported. `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains active.
