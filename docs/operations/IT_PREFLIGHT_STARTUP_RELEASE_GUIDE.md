# I.T. Preflight, Startup & Release Guide

## Current release baseline

Release 467 uses `main` as the current Production source and `dev` as the Development candidate lane. Forward D1 authority remains `migrations/canonical/manifest.json` plus `scripts/d1_migrate.py`; canonical migrations remain exactly `0001`–`0005`. Request-time DDL and automatic Production promotion remain closed.

## Canonical Development target

- Cloudflare Pages project: `devilndove-site`
- Development Preview: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev`

## Standard release sequence

1. Verify the previous exact SHA/tree and external proofs.
2. The next build ingests that closure; the previous build never self-records later proof.
3. Prove the exact `dev` head through System, Quality, I.T., Hygiene and build-specific acceptance.
4. For browser/runtime incidents, execute only the current bounded workflow for the affected architecture; retired browser probes must not be run against successor Product architectures.
5. Non-force promote the identical Development commit to `main` only after Development is GREEN.
6. Require Production Pages Deploy and Production Live Resource Integrity.
7. Execute current architecture-specific Production proof without unnecessary Production D1 reads.
8. Only then call `main` / Production GREEN.

Production live-resource retries remain capped at three transient attempts; permanent 4xx and genuine resource failures fail closed. Stripe Development, PayPal sandbox and Social/OAuth remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.

<!-- CURRENT_RELEASE_RESTART_AUTHORITY_START -->
## Current Release 467 restart authority — Build 171 candidate

Build 170 **Product Browser Explicit Image Recovery** is the last fully verified Development and current Production baseline.

- Last fully verified Development SHA: `879c8730040afaf6caec6374b5057b7261fdcfe2`
- Current Production main SHA: `879c8730040afaf6caec6374b5057b7261fdcfe2`
- Exact shared tree: `da5e3b249d6e14266da5e191cb22c06205947948`
- Development System Gate: `35275441340`
- Development Current Application Quality: `35275441446`
- Development I.T. Admin Runtime: `35275441412`
- Development Repository Branch Hygiene: `35275441448`
- Build 170 Development proof: `35275441460`
- Production Pages Deploy: `35275636873`
- Production Live Resource Integrity: `35275711398`
- Products Production Browser Proof: `35275711387`
- Products Route Production Proof: `35275711471`
- Build 170 Production proof: `35275636939`

Build 171 **Release & Restart Authority Convergence** is the active Development candidate. It converges `current-development-authority.json`, the I.T. control tower, this canonical restart guide, `AI_HANDOFF.md`, `PROJECT_STATUS_AND_ROADMAP.md`, `MARKDOWN_INDEX.md`, and the Build 170 closure authority on the exact proof bundle above.

Build 171 changes release/restart truth only. It does not alter Product runtime behavior, canonical migrations, schema, D1/R2 business data, provider execution/publication, payments, refunds or accounting.

Build 171 acceptance requires its dedicated source proof plus System Gate, Current Application Quality, I.T. Admin Runtime and Repository Branch Hygiene on one exact final `dev` SHA. Only that exact GREEN commit may be non-force promoted to `main`, followed by Production Pages Deploy, Production Live Resource Integrity and retained Product Production proofs.

### Restart resolution rule

The candidate never self-claims its not-yet-created final SHA. At every restart, resolve the live `dev` and `main` refs first. Once Build 171 is promoted, the synchronized exact branch head plus exact-SHA Development and Production proofs becomes the current source authority.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->
