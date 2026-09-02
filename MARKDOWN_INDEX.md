# Devil n Dove — Markdown / Authority Index

## Canonical current authority — Release 467 Build 21

**Release 467 Build 21 — Release State, Branch & CI Hygiene Convergence** is the active Development candidate.

Its exact green predecessor is **Build 20 — Workshop Tool & Equipment Readiness Command Center**:

- `dev`: `7b38af543400a81593a8dc1b7caa4ad9a43033ea`
- tree: `550272841e764d77fc21297abede3d4cae1aaea0`
- System Gate `33688666947` — SUCCESS
- Build 20 Proof `33688733720` — SUCCESS
- Production `main`: `055cbc973c667b35a209c7ea207779089f6fed3a`
- Production Pages Deploy `33688892602` — SUCCESS

Read current authority in this order:

1. `current-development-authority.json`
2. `AI_HANDOFF.md`
3. `release467-build21-release-state-branch-ci-hygiene.json`
4. `docs/operations/RELEASE_467_BUILD_21_RELEASE_STATE_BRANCH_CI_HYGIENE.md`
5. `release467-build20-workshop-tool-equipment-readiness.json`
6. `docs/operations/RELEASE_467_BUILD_20_WORKSHOP_TOOL_EQUIPMENT_READINESS.md`
7. `release467-build19-inventory-replenishment-procurement-readiness.json`
8. `release467-build18-order-fulfillment-customer-care.json`
9. `release467-build17-creator-content-completeness.json`
10. `release467-build17-placeholder-registry.json`
11. `release467-build16-custom-request-made-today-journey.json`
12. `release467-build15-storefront-seo-parity.json`
13. `release467-build14-product-release-quality.json`
14. `release467-build13-repository-hygiene-cleanup.json`
15. `release467-build12-finance-operations-command-center.json`
16. `release467-build11-admin-operations-command-center.json`
17. `release467-build10-it-control-tower-consolidation.json`
18. `release467-build9-historical-ci-retirement.json`
19. `release467-build8-authority-convergence.json`
20. `release467-build7-external-commercial-acceptance.json`
21. `release467-build6-access-acceptance-harness.json`
22. `release467-build5-production-promotion-readiness.json`
23. `docs/operations/RELEASE_467_AUTONOMOUS_20_ITEM_BACKLOG.md` — completed historical backlog authority
24. `PROJECT_STATUS_AND_ROADMAP.md`
25. `SANITY_HEALTH_CHECK.md`
26. `development-release.json` — **INHERITED_REGRESSION_COMPATIBILITY** only

## Build 21 scope

Build 21 is repository/release-governance only. It converges restart truth, codifies `main` and `dev` as persistent core branches, prunes completed merged feature branches under fail-safe rules, archives two known unique historical tips before deletion, retains unknown unmerged branches, and retires Build 16–20 proof workflows to manual historical execution.

The canonical System Gate and Build 21 proof are the current automatic validation chain. Build 21 changes no application runtime, schema, D1/R2 business data, provider state, Cloudflare Access policy, `main`, or Production.

## Retained application authority

Builds 14–20 remain retained functional authorities:

- Build 14 — Product Release Quality Command Center
- Build 15 — Storefront / SEO Parity
- Build 16 — Custom Request & Made Today Journey
- Build 17 — Creator & Content Completeness
- Build 18 — Order Fulfillment & Customer Care Command Center
- Build 19 — Inventory Replenishment & Procurement Readiness Command Center
- Build 20 — Workshop Tool & Equipment Readiness Command Center

Build 20 remains the deployed application authority. Tool Lifecycle and Inventory Operations retain mutation ownership; Build 20 remains read-only.

## External boundary

Cloudflare Access service-token, Stripe Development, PayPal sandbox and Social/OAuth remain `HOLD_EXTERNAL`. CAIP private-media acceptance remains evidence-dependent. Source-green state must never be substituted for external acceptance.

## Main / Production boundary

Production is Build 20 at `055cbc973c667b35a209c7ea207779089f6fed3a`, tree `550272841e764d77fc21297abede3d4cae1aaea0`, Production Pages Deploy `33688892602` SUCCESS. Build 21 does not authorize Production promotion.
