# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 14 — Product Release Quality Command Center** is the active Development source candidate.

Start every restart by reading `current-development-authority.json`, then this file, then `docs/operations/RELEASE_467_AUTONOMOUS_20_ITEM_BACKLOG.md`. `development-release.json` remains **INHERITED_REGRESSION_COMPATIBILITY** and is not the current Release 467 selector. The middleware Release 466 header remains **INHERITED_RUNTIME_COMPATIBILITY**.

Build 14 started from current `dev` `86907d512c5121bb05306ca9d31d4aecb5fd6c50`, tree `9740eec99afbcd93773ab7e3b875037c183591db`. The exact last Development-green application/maintenance predecessor is **Release 467 Build 13 — Repository Hygiene and Historical CI Cleanup**:

- merged `dev`: `794fd5b36191fff4c9e8376197f968d9c6d6da80`
- tree: `9c2bcdcb12bcbf2f00aeb19345329cdce39c65d9`
- System Gate `33643833623` — SUCCESS
- Build 13 Proof `33643833608` — SUCCESS

The Build 14 source base also contains the documentation-only autonomous backlog/index merges after Build 13; they did not change application runtime or the Build 13 green evidence.

## Build 14 technical authority

- manifest: `release467-build14-product-release-quality.json`
- gate: `scripts/release467_build14_gate.py`
- proof: `.github/workflows/release467-build14-proof.yml`
- workspace: `/admin/products/`
- quality UI: `public/js/admin-product-quality-command-center.js`
- product read authority: `/api/admin/products`
- readiness authority: `/api/admin/product-readiness`
- existing crop/focal authority: `public/js/admin-product-images.js` + `/api/admin/product-images`
- existing marketplace export authority: `/api/admin/marketplace-export-preview`
- marketplace validation helper: `functions/api/_lib/marketplaceReadiness.js`
- schema/D1/R2 migration change: NONE
- provider publication/execution: NONE

Build 14 owns autonomous backlog items **1–5**. It creates one ranked Product Release Quality Command Center, exposes visual quality/readiness badges, links product cards directly to the existing non-destructive crop/focal/derivative workflow, extends local marketplace image readiness checks, and recommends useful missing proof-image roles from existing product facts. The command center is read-only; corrections remain explicit in their owning workspaces.

## Release 467 retained authority separation

### Builds 1–4
I.T. readiness, recovery actions, **same-origin authenticated browser runtime acceptance** and sanitized evidence ledger remain retained authorities. **Build 4 consolidates source-proof authorities into its same-session evidence and acceptance ledger; Build 10 preserves that ledger rather than replacing it.**

### Build 5 — CI / Cloudflare Access readiness
**Build 5 — CI / Cloudflare Access readiness** remains separate. Masked references are `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET`; secret values never belong in source, UI, logs or evidence. **Production Promotion Readiness** remains a separate HOLD/READY authority and never deploys automatically.

### Release 467 Build 6 — Development Cloudflare Access acceptance harness
Release 467 Build 6 remains the dispatch-only Development Cloudflare Access service-token acceptance harness. Real Access acceptance remains `HOLD_EXTERNAL` until deliberately proven.

### Release 467 Build 7 — External Commercial Acceptance Bridge
Release 467 Build 7 — **External Commercial Acceptance Bridge** remains the visibility authority for CAIP private media, Stripe Development, PayPal sandbox and Social/OAuth. It does not execute providers automatically.

### Release 467 Build 8 — Authority Convergence and Restart Safety
Release 467 Build 8 established `current-development-authority.json` as the current restart pointer and fenced inherited Release 466 compatibility evidence away from current Release 467 authority. Its locked predecessor was Build 7 at `5eef764a67466dc2989a4681c6a7cc782b9d4df9`, System Gate `33591744817`, Build 7 Proof `33591744787`, with external lanes `HOLD_EXTERNAL`.

### Release 467 Build 9 — Historical CI Retirement & Gate Fanout Reduction
Release 467 Build 9 made Release 466 Build 1–6 proof workflows manual-only while preserving historical proof source and Actions evidence. Build 13 retained those manual-only files.

### Release 467 Build 10 — I.T. Control Tower Consolidation and Self-Diagnostics
Release 467 Build 10 retains the read-only I.T. technical first stop at `/admin/it/`.

### Release 467 Build 11 — Admin Operations Command Center
Build 11 remains the daily cross-business first stop at `/admin/`, sharing the owned Today Tasks read contract and retained explicit administrator Done/Ignore/Snooze action authority.

### Release 467 Build 12 — Finance Operations Command Center
Build 12 makes `/admin/finance/` the financial operating first stop. It shares the existing Accounting read engine; it does not create another ledger, reconciliation service, statement importer, costing service or close workflow.

### Release 467 Build 13 — Repository Hygiene and Historical CI Cleanup
**Release 467 Build 13 — Repository Hygiene and Historical CI Cleanup** retired 39 obsolete Release 448–461 workflow definitions from the live repository surface and added a permanent hygiene assertion preventing their return. Its exact Build 12 predecessor was `374983f68fb16172fb357b1755293a29e5d2953f`. Historical Git provenance remains available.

### Release 467 Build 14 — Product Release Quality Command Center
Build 14 consolidates existing Catalog, Inventory, Product Media, SEO and local Marketplace-readiness signals into one operator-visible ranked remediation surface. It does not replace any owning business authority and never publishes or repairs automatically.

## Exact environment boundary

- source: `dev`
- Development Preview: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Product R2: `devilndove-toolshed-images-dev`
- CAIP private R2: `devilndove-caip-media-dev`
- canonical migrations: exactly `0001`–`0004`
- Build 14 schema change: NONE
- Build 14 new D1/R2 mutation authority: NONE

A chat, workstation, deployment or source commit is not a migration event. Never replay historical migrations merely because work resumed.

## External/provider boundary

External lanes remain truthfully **`HOLD_EXTERNAL`** unless separately and deliberately proven: Cloudflare Access service token, Stripe Development, PayPal sandbox and Social/OAuth. CAIP private-media status uses fresh Build 7 evidence. Build 14 performs no provider/payment/refund/OAuth action and marketplace work remains local draft/export preparation only.

## Main / Production boundary

`main` is verified at Build 11 SHA `ce42f3b2ea553b69085705f500a9e2bd2f689818`, tree `191e4a92ebcbc94b29cfbf6a83259acd4981d302`. Production Pages Deploy `33640133776` completed successfully on that exact SHA. Builds 12–14 remain Development-only until separately authorized for Production promotion. Build 14 does not update `main`, contact Production, mutate Production D1/R2/business data or change Cloudflare Access policy.

## Permanent safety rules

Development first. Request-time schema DDL remains forbidden. Canonical migrations remain forward-only and Development-first. Raw CAIP deletion remains closed. Provider execution/publication remains closed outside deliberate acceptance. Production business data remain Production-owned. Secret values never belong in UI/logs/artifacts/docs. Existing U.S. sales/shipping suspension remains intact. Build 5 remains Production Promotion Readiness authority.

## Autonomous backlog

`docs/operations/RELEASE_467_AUTONOMOUS_20_ITEM_BACKLOG.md` is the exact agreed Builds 14–17 sequence. Build 14 executes items 1–5 only. Stripe, PayPal, Social/OAuth, real Cloudflare Access acceptance and Production promotion are excluded from this autonomous sequence.

## Canonical reading order

1. `current-development-authority.json`
2. `AI_HANDOFF.md`
3. `release467-build14-product-release-quality.json`
4. `docs/operations/RELEASE_467_AUTONOMOUS_20_ITEM_BACKLOG.md`
5. `PROJECT_STATUS_AND_ROADMAP.md`
6. `SANITY_HEALTH_CHECK.md`
7. `docs/operations/RELEASE_467_BUILD_14_PRODUCT_RELEASE_QUALITY.md`
8. `release467-build13-repository-hygiene-cleanup.json`
9. `release467-build12-finance-operations-command-center.json`
10. `release467-build11-admin-operations-command-center.json`
11. `release467-build10-it-control-tower-consolidation.json`
12. `release467-build9-historical-ci-retirement.json`
13. `release467-build8-authority-convergence.json`
14. `release467-build7-external-commercial-acceptance.json`
15. `release467-build6-access-acceptance-harness.json`
16. `release467-build5-production-promotion-readiness.json`
17. `development-release.json` — compatibility evidence only

## Restart point

Continue Build 14 from the exact current feature head. Prove Build 13 preservation and Build 14 source safety, require the full current Release 467/System PR fanout green on one immutable head, merge only that head, then require Build 14 proof and canonical System Gate on the exact merged `dev` SHA before calling Build 14 complete.
