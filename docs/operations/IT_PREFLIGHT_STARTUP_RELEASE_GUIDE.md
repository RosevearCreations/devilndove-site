# I.T. Preflight, Startup & Release Guide

## Current release baseline

Release 467 uses `main` as Production source and `dev` as Development candidate lane. The canonical Cloudflare Pages project is `devilndove-site`. Forward D1 authority remains `migrations/canonical/manifest.json` plus `scripts/d1_migrate.py`, with the canonical migration span `0001` through data-only `0023`. Request-time DDL and automatic Production promotion remain closed.

1. Verify the previous exact SHA/tree and external proofs.
2. The next build ingests that closure; the previous build never self-records later proof.
3. Prove the exact `dev` head through System, Quality, I.T., Hygiene and build-specific acceptance.
4. Execute only bounded current-architecture runtime proof.
5. Promote the identical Development tree to protected `main` only after Development is GREEN.
6. Require exact Production Pages deployment and applicable runtime/resource acceptance.

<!-- CURRENT_RELEASE_RESTART_AUTHORITY_START -->
## Current Release 467 restart authority — Build 263 candidate

Build 262 **Operations Today-Tasks Read Fan-Out Review** is the exact verified predecessor:

- Development SHA: `dddbbb4c7fe7dfff8f59a4d54048e37a33fcf764`
- Shared Development/Production tree: `931cf56eff07247f34eec69d753fa908027b72bf`
- Development proofs: System `36132080145`, Quality `36132080034`, I.T. `36132080001`, Hygiene `36132080008`
- Build 262 dedicated Development proof: `36132080219`
- Final Build 262 Development provider proof: Today Tasks **8 statements / 1,133 rows**, Seller Daily **1,046 rows**, aggregate **2,179 rows**, Production D1 contact **ZERO**
- Production main: `e65d9122252e9832a9e29027b13af163cbb30914`
- Production proofs: Pages `36132870627`, Live Resources `36133110145`, Product Browser `36133110183`, Product Route `36133110049`
- Build 262 Production-specific proof: `36132870623`
- Canonical migrations remain **0001–0023**, with 0023 data-only.

Build 263 **Release Efficiency & Read-Budget Outcome Verification** is the active candidate. It verifies the measured result of Builds 257–262 without authorizing another optimization.

Release-efficiency evidence:
- Build 256 baseline: **870 runs / 14 accepted heads = 62.14 runs/head**
- Builds 257–262: **584 closure-scoped runs / 12 accepted heads = 48.67 runs/head**
- normalized accepted-head reduction: **21.69%**
- Build 255 closure: **134 runs**
- Build 262 closure: **68 runs**, a **49.25%** reduction
- required named Development and Production proofs remain GREEN for every accepted Build 257–262 pair
- every accepted Development/Production pair retains exact-tree continuity
- the closure-scoped sample is **584/584 GREEN with zero failures/skips**. Thirteen later post-closure workflow records are excluded from closed-release metrics; **10** are noncanonical **Release 467 Build 155 Products Development Browser Proof** failures and **3** are skips. This remains a Build 264 renewal residual.

The current pre-Build263 workflow surface is **152 files / 38 pull-request / 126 push / 134 manual-dispatch / 5 workflow-run**. Build 263 adds its own proof workflow, so candidate inventory must be **153 / 39 / 127 / 135 / 5**. The five workflow-run chains remain retained.

Read-budget verification remains Development-only against `devilndove-dev`. Build 263 must re-prove exactly **8 Today Tasks statements** and remain under the unchanged **15,000 / 10,000 / 25,000** provider-row ceilings. Production D1 contact is **ZERO**.

The reusable exact-SHA composition remains required. System, Quality, I.T., Hygiene, Build 263, Production Pages, Live Resource Integrity, Product Browser and Product Route proof semantics remain mandatory.

No schema/request-time DDL, D1/R2 business mutation, provider execution/publication, Product publication, Inventory movement, Finance posting, automatic business action, Production business-data copy, workflow deletion, branch-protection mutation or secret capture is introduced.

The future queue remains open. The next bounded release is **Build 264 — Refinement Outcomes Renewal III**.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
