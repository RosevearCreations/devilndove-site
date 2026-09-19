# I.T. Preflight, Startup & Release Guide

## Current release baseline

Release 467 uses `main` as the current Production source and `dev` as the Development candidate lane. Forward D1 authority remains `migrations/canonical/manifest.json` plus `scripts/d1_migrate.py`; canonical migrations currently run from `0001` through `0006`. Request-time DDL and automatic Production promotion remain closed.

## Canonical Development target

- Cloudflare Pages project: `devilndove-site`
- Development Preview: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev`

## Standard release sequence

1. Verify the previous exact SHA/tree and external proofs.
2. The next build ingests that closure; the previous build never self-records later proof.
3. Prove the exact `dev` head through System, Quality, I.T., Hygiene and build-specific acceptance.
4. For browser/runtime incidents, execute only the current bounded workflow for the affected architecture; retired browser probes must not be run against successor Product architectures.
5. Non-force promote the identical Development tree to `main` only after Development is GREEN.
6. Require Production Pages Deploy and Production Live Resource Integrity.
7. Execute current architecture-specific Production proof without unnecessary Production D1 reads.
8. Only then call `main` / Production GREEN.

Production live-resource retries remain capped at three transient attempts; permanent 4xx and genuine resource failures fail closed. Stripe Development, PayPal sandbox and Social/OAuth remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.

<!-- CURRENT_RELEASE_RESTART_AUTHORITY_START -->
## Current Release 467 restart authority — Build 193 candidate

Build 192 **Release Regression & Runtime Budget Convergence** is the last fully verified Development and current Production baseline.

- Last fully verified Development SHA: `76321bfc975862ce2463e87450852c19fc98c852`
- Current Production main SHA: `451ca8173b9ad3127f84f352ed0a8d7774e53b14`
- Exact shared tree: `5752f7e0be8c432d2cc45b5de08c349208ee497a`
- Development System Gate: `35418600834`
- Development Current Application Quality: `35418600870`
- Development I.T. Admin Runtime: `35418600868`
- Development Repository Branch Hygiene: `35418600827`
- Build 192 Development proof: `35418600841`
- Production Pages Deploy: `35418692246`
- Production Live Resource Integrity: `35418731807`
- Products Production Browser Proof: `35418731822`
- Products Route Production Proof: `35418731793`
- Build 192 Production proof: `35418692245`
- Production remote D1 queries: `0`
- Exact Production URL: `https://8ed2f630.devilndove-site.pages.dev`

Build 193 **Current Authority & Handoff Convergence** is the active Development closure candidate. It converges `current-development-authority.json`, the I.T. control tower, Deployment Preflight, Reliability, this canonical restart guide, `AI_HANDOFF.md`, `PROJECT_STATUS_AND_ROADMAP.md`, `MARKDOWN_INDEX.md`, and the immutable Build 192 closure authority on the exact proof bundle above.

Build 193 changes release/restart truth only. It does not alter Product/Inventory/customer business data, canonical migrations, schema, D1/R2 business data, provider execution/publication, payments, refunds or accounting.

Build 193 acceptance requires its dedicated source proof plus System Gate, Current Application Quality, I.T. Admin Runtime and Repository Branch Hygiene on one exact final `dev` SHA. Only that exact GREEN tree may be promoted through protected `main`, followed by Production Pages Deploy, Production Live Resource Integrity and retained Product Production proofs.

### Restart resolution rule

The candidate never self-claims its not-yet-created final SHA. At every restart, resolve live `dev` and `main` refs first. Once Build 193 is promoted, the exact branch/tree plus exact-SHA Development and Production proofs becomes the current source authority; Build 194 must ingest that later closure.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->

## Retained historical provenance — Build 171

Build 171 **Release & Restart Authority Convergence** remains historical provenance over exact Build 170 predecessor `879c8730040afaf6caec6374b5057b7261fdcfe2`. It is not the current application baseline and must not override Build 192/193 restart truth.
