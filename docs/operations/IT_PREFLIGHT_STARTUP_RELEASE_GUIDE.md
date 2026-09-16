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

Build 154 proved the live `/admin/products/` server response is HTTP 200 through the static fast path with module/security headers and no Error 1102. Later Builds 155–159 repaired browser responsiveness, request scheduling, admin data delivery, Product Editor startup resilience and returning-browser cache coherence. Operator Firefox evidence then reopened the Product browser acceptance lane, which is now owned by Build 160.

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
## Current Release 467 restart authority — Build 160 candidate

Build 159 **Product Returning-Browser Cache Coherence** is the last fully verified Development and current source/Production baseline.

- Last fully verified Development SHA: `8032b373c5cdef6172064cd5d61cd59dd77222e5`
- Current Production main SHA: `8032b373c5cdef6172064cd5d61cd59dd77222e5`
- Exact shared tree: `371fcdeafc97f98abaa19b6bbb10b857940c9d15`
- Development System Gate: `35136874373`
- Development Current Application Quality: `35136874379`
- Development I.T. Admin Runtime: `35136874530`
- Development Repository Branch Hygiene: `35136874513`
- Production Pages Deploy: `35137289111`
- Production Live Resource Integrity: `35137393619`
- Products Production Browser Proof: `35137393411`
- Products Route Production Proof: `35137393555`

Build 160 **Product Production Browser Recovery** is the active Development candidate. It responds to operator Firefox evidence showing that the Product page could still retain a Build 157 Quality identity, display a raw bounded `readiness_timeout`, fall back to a saved Product snapshot, and generate cross-origin Product-image blocking noise after Build 159 source promotion.

Build 160 adds a compact authenticated read-only Product-core delivery path, intercepts plain Product-list startup reads before older wrappers consume the request, rewrites approved Admin Product media to the same-origin Product media route before rendering, and observes late Quality DOM rendering so bounded readiness timeouts remain pending rather than being presented as Product workspace failures.

Product create/update/archive/delete authorities are unchanged. Build 160 performs no Product, Inventory, D1 business-data, R2 object, payment, refund, accounting or provider mutation. Canonical migrations remain 0001–0005 and request-time DDL remains closed.

Build 160 acceptance requires the dedicated Build 160 source proof, System Gate, Current Application Quality, I.T. Admin Runtime, Repository Branch Hygiene, retained Product regression proofs and exact Development deployment evidence on one final `dev` SHA. Only that exact GREEN SHA/tree may be non-force promoted to `main`, followed by Production Pages Deploy and Production Live Resource Integrity.

Because the incident was reported from a real returning Firefox session, operator Firefox Product-editor confirmation remains the final human acceptance after main is GREEN. Automated GREEN is necessary for promotion but does not replace that operator test.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->
