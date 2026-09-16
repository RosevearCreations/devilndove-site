# I.T. Preflight, Startup & Release Guide

## Current release baseline

**Release 467 Build 154 — Products Worker Resource Hotfix** was the server-route repair baseline that began the current Product recovery sequence.

- Development SHA `fc74ea680c0eee221722ce1ede6cb7990b92551f`
- Production main SHA `cc50c65c7d4ecbb75e9744a57a14be7da4aba873`
- identical tree `36e466d2d971ac7c80f183c3b9b42a0ff56597d9`
- System `34867834161`
- Quality `34867834181`
- I.T. `34867834020`
- Hygiene `34867834038`
- Production Pages `34868084233`
- Production Live Resources `34868183267`
- Products Route Production Proof `34868183338`

Build 154 proved the live `/admin/products/` server response is HTTP 200 through the static fast path with module/security headers and no Error 1102. Later Builds 155–158 repaired browser responsiveness, request scheduling, admin data delivery and Product Editor startup resilience. Build 159 is the current cache-coherence candidate.

## Canonical Development target

- Cloudflare Pages project: `devilndove-site`
- Development Preview: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev`

## Standard release sequence

1. Verify the previous exact SHA/tree and external proofs.
2. The next build ingests that closure; the previous build never self-records later proof.
3. Prove the exact `dev` head through System, Quality, I.T., Hygiene, canonical D1/bindings and Preview acceptance.
4. For browser/runtime incidents, execute the affected authenticated workflow in a real browser after the exact Preview deployment; HTTP-only smoke is insufficient.
5. Non-force promote the identical tree to `main` only after Development is GREEN.
6. Require Production Pages Deploy and Production Live Resource Integrity.
7. Execute the incident-specific real Production browser proof against the exact `main` SHA when required.
8. Only then call the incident fixed and `main` / Production healthy.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`; canonical migrations remain exactly `0001`–`0005`. Production live-resource retries remain capped at three transient attempts; permanent 4xx and genuine resource failures fail closed. Stripe Development, PayPal sandbox, Social/OAuth remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.

<!-- CURRENT_RELEASE_RESTART_AUTHORITY_START -->
## Current Release 467 restart authority — Build 159 candidate

Build 158 **Product Editor Startup Resilience** is the last fully verified Development and current Production baseline.

- Last fully verified Development SHA: `764ff267dab58c0c1068919f9a494c94984d054e`
- Current Production main SHA: `764ff267dab58c0c1068919f9a494c94984d054e`
- Exact shared tree: `bdaa5302bcaf26b451e9ef6954f777e26a2ee20b`
- Development System Gate: `35055159738`
- Development Current Application Quality: `35055159744`
- Development I.T. Admin Runtime: `35055159758`
- Development Repository Branch Hygiene: `35055159722`
- Production Pages Deploy: `35055350586`
- Production Live Resource Integrity: `35055416344`
- Products Production Browser Proof: `35055416341`
- Products Route Production Proof: `35055416367`

Build 159 **Product Returning-Browser Cache Coherence** is the active Development candidate. It rotates the generic Product page asset generation, Product request-budget loader identity, Product media fallback identity, and Product Editor/quality helper cache URLs so a returning browser cannot keep running stale Build 155-era clients after newer Product releases. Admin-only JavaScript is served with no-store cache control; public storefront caching remains separate.

The Build 158 Product Editor contract remains authoritative: safe defaults/snapshot first when needed, then authoritative live enrichment when available. Build 159 changes cache delivery, not Product business authority. Product create/update mutations remain untouched. Canonical D1 remains the data/schema authority and no request-time DDL is introduced.

Build 159 acceptance requires the dedicated Build 159 source proof, System Gate, Current Application Quality, I.T. Admin Runtime, Repository Branch Hygiene, retained Build 158/157/156 proofs, and authenticated Development Product browser regression proof on one exact `dev` SHA. The browser proof must reject the legacy 6000 ms editor timeout, stale Product runtime generations, missing Build 159 helper URLs, same-origin Product media 404 recovery loops, and Worker 1102 evidence.

Promotion remains closed until that exact Development SHA is GREEN. Production then requires non-force promotion, successful Production Pages deployment, Production Live Resource Integrity, Products route proof and authenticated Products Production browser proof before Build 159 may be called GREEN.

No schema change, D1 business-data mutation, destructive R2 mutation, Stripe/PayPal execution, refund, accounting posting or provider publication is authorized by Build 159.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->
