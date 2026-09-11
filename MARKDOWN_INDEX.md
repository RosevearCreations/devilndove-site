# Devil n Dove — Markdown / Authority Index

## Current authority — Release 467 Build 103

Build 103 — **Product Work Session Paging & Full Coverage** is the current Development closure candidate.

Last fully verified Development is Build 102:
- `dev` `7325c093f47c29aafaef0cff3da88f1b273227`
- tree `f7c1e97b1b811af68c2701db985ccc824e11abca`
- System `34606547840` SUCCESS
- Quality `34606547841` SUCCESS
- I.T. `34606547865` SUCCESS
- Hygiene `34606547882` SUCCESS.

Current Production is Build 102:
- `main` `7325c093f47c29aafaef0cff3da88f1b273227`
- tree `f7c1e97b1b811af68c2701db985ccc824e11abca`
- Production Pages Deploy `34606720131` SUCCESS
- Production Live Resource Integrity `34606812380` SUCCESS.

## Current reading order

1. `current-development-authority.json`
2. `release467-build103-product-work-session-paging.json`
3. `release467-build102-product-work-manual-reorder.json`
4. `docs/operations/RELEASE_467_BUILD_103_PRODUCT_WORK_SESSION_PAGING.md`
5. `docs/operations/RELEASE_467_BUILD_102_PRODUCT_WORK_MANUAL_REORDER.md`
6. `release467-build101-product-work-priority.json`
7. `release467-build100-product-work-session.json`
8. `release467-build99-product-work-views-sort.json`
9. `release467-build98-product-readiness-triage.json`
10. `release467-build97-product-readiness-work-queue.json`
11. `release467-build96-product-browser-focus.json`
12. `release467-build95-product-workspace-current-context.json`
13. `release467-build94-product-workspace-readability.json`
14. `AI_HANDOFF.md`
15. `PROJECT_STATUS_AND_ROADMAP.md`
16. `SANITY_HEALTH_CHECK.md`
17. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`
18. `migrations/canonical/manifest.json`

## Build 103 authority contract

Build 103 consumes exact Build 102 Development and Production closure and closes the session-panel coverage gap:
- the existing browser-local session remains capped at 60 Products;
- the panel exposes 20 Products per page with keyboard-accessible Previous and Next controls;
- first/last paging boundaries are disabled and a page/range summary is always visible when Products are pinned;
- sort changes return to page 1 and session shrinkage clamps the page safely;
- manual moves crossing a page boundary keep the moved Product visible on its new page;
- Locate next Product and Open next blocker scan the complete ordered session rather than the visible page only;
- state remains in `dd_catalog_work_session_v1` and page position is presentation-only;
- rendered Product rows, `dd_admin_products_snapshot_v2`, and already-rendered readiness evidence are reused;
- no additional Product or readiness API/database read is introduced;
- Build 102 manual reorder, Build 101 priority/order, Build 100 work sessions, Build 99 work views/sort, Build 98 readiness triage and earlier Product protections remain active;
- no Product/Inventory business-data mutation, provider execution/publication, Cloudflare Access mutation, schema mutation or automatic Production promotion is introduced.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported. `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains active.
