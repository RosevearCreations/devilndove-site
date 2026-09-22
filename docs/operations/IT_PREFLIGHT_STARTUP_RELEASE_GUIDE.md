# I.T. Preflight, Startup & Release Guide

## Current release baseline

Release 467 uses `main` as Production source and `dev` as Development candidate lane. The canonical Cloudflare Pages project is `devilndove-site`. Forward D1 authority remains `migrations/canonical/manifest.json` plus `scripts/d1_migrate.py`, with the canonical migration span `0001` through data-only `0022`. Request-time DDL and automatic Production promotion remain closed.

1. Verify the previous exact SHA/tree and external proofs.
2. The next build ingests that closure; the previous build never self-records later proof.
3. Prove the exact `dev` head through System, Quality, I.T., Hygiene and build-specific acceptance.
4. Execute only bounded current-architecture runtime proof.
5. Promote the identical Development tree to protected `main` only after Development is GREEN.
6. Require exact Production Pages deployment and applicable runtime/resource acceptance.

<!-- CURRENT_RELEASE_RESTART_AUTHORITY_START -->
## Current Release 467 restart authority — Build 229 candidate

Build 228 **First Real Custom Work Route-to-Proof Pilot** is the exact verified predecessor:

- Development SHA: `db896df37a89e3477d77a26707277d0ca65eed5d`
- Shared tree: `414d747065b3d95002224fa4975c6da86a5d7c79`
- Development proofs: System `35675467679`, Quality `35675467644`, I.T. `35675467795`, Hygiene `35675467898`, Build proof `35675467986`
- Production main: `9b4a12fe90b207006c9593d7440f56bf681c43aa`
- Production proofs: Pages `35675671813`, Live Resources `35675740985`, Product Browser `35675740992`, Product Route `35675740994`, Build proof `35675671688`
- Business exit: `HOLD_NO_REAL_REQUEST`
- Canonical migrations remain **0001–0022**.

Build 229 **First Creative Project Prototype-to-Run Pilot** is GET-only and reuses the existing Build 212/214/219/220 Creative Project manufacturing authorities. It may report `HOLD_NO_REAL_PROJECT` when no legitimate operator-entered project exists. It must not fabricate projects, lifecycle transitions, travelers, production runs, QA checks or handoffs.

Build 230 remains blocked until Build 229 is exact-SHA Production GREEN. The future queue has not run out; Builds 230–232 remain planned.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
