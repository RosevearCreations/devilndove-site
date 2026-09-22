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
## Current Release 467 restart authority — Build 230 candidate

Build 229 **First Creative Project Prototype-to-Run Pilot** is the exact verified predecessor:

- Development SHA: `4a195f435c4491408db6c39dadc1d874d166cf36`
- Shared tree: `2ec97031a2c774fc2920a03d6fc72d63998421b8`
- Development proofs: System `35677766703`, Quality `35677766653`, I.T. `35677766460`, Hygiene `35677766514`, Build proof `35677766604`
- Production main: `4ba7631cfd0da23925c82b1ec3cf8ed247b75f0c`
- Production proofs: Pages `35678474432`, Live Resources `35678533786`, Product Browser `35678533596`, Product Route `35678533740`, Build proof `35678474416`
- Business exit: `HOLD_NO_REAL_PROJECT`
- Canonical migrations remain **0001–0022**.

Build 230 **Cost, Margin, QA & Knowledge Evidence Adoption** is GET-only and measures reviewed use of existing Build 217/218/220/221/222 authorities. It may report `HOLD_NO_QUALIFYING_REAL_RUN` when no reviewed real production run exists. It must not fabricate cost, margin, QA, knowledge or recipe evidence.

Build 231 remains blocked until Build 230 is exact-SHA Production GREEN. The future queue has not run out; Builds 231–232 remain planned.

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It does not override current Build 227 truth.

## Retained historical provenance — Builds 192–193

Build 192 **Release Regression & Runtime Budget Convergence** and Build 193 **Current Authority & Handoff Convergence** remain historical restart authorities. Their artifacts stay immutable and successor-aware.
