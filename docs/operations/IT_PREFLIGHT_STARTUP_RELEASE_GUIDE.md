# I.T. Preflight, Startup & Release Guide

## Current release baseline

**Release 467 Build 154 — Products Worker Resource Hotfix** is the exact current source/Production baseline for the server-route repair.

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

Build 154 proved the live `/admin/products/` server response is HTTP 200 through the static fast path with module/security headers and no Error 1102. It did not prove authenticated Product-page JavaScript remained responsive after load.

At `2026-09-14T12:46:00-04:00`, a real Firefox session showed the page HTML rendering but the browser becoming unresponsive while the existing-Product picker, cleanup workspace and Product Release Quality remained in Loading states. Production live-resource proof already showed 40 Products and 216 image candidates. Build 155 is the active corrective build.

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

## Build 155 restart

Build 155 — **Products Client Responsiveness Hotfix** — is authorized from the exact Build 154 checkpoint above.

The confirmed client root cause is `public/js/admin-products-marketplace-readiness.js`. Its `MutationObserver` watches `#productsTableBody`; its render path previously assigned `panel.innerHTML` for every Product row on every pass. Those authored child-list changes occur inside the observed subtree and scheduled the next render roughly every 80 ms, allowing Marketplace Listing Readiness to keep the browser main thread busy while Product dropdown/loading work remained unfinished.

Build 155 repairs the loop without removing Marketplace Listing Readiness:

- marketplace row markup is fingerprinted and replaced only when its derived readiness state changes;
- the observer disconnects while the renderer performs authored DOM changes;
- mutation batches originating inside `.marketplace-readiness-inline` are ignored;
- a non-sensitive `DDProductsMarketplaceReadinessHealth` marker exposes render/mutation counts for acceptance;
- Product page cache identity advances to `467-b155-products-client-responsiveness`;
- the dynamic Marketplace module import advances to `467b155`;
- the Build 153 layout-observer cache revision remains `467-b153-layout-observer`.

## Build 155 browser acceptance

`scripts/products_browser_runtime_probe.mjs` is a dependency-free Chromium/CDP acceptance probe. It uses an existing masked administrator session and performs GET/DOM observation only. It never creates a session or submits Product mutations.

Development browser acceptance runs only after an exact successful `dev` System Gate/Preview deployment. Production browser acceptance runs only after an exact successful Production Pages Deploy. Both require:

- authenticated Product page reaches `document.readyState=complete`;
- the existing-Product picker contains real Product options;
- the Product table contains real Product rows;
- Build 155 client-health revision is active;
- an awaited browser event-loop heartbeat completes normally;
- marketplace render count remains stable during a 1.2-second observation window;
- draft/archive cleanup is no longer stuck in its Loading state;
- Product Release Quality Command Center is no longer stuck in its Loading state;
- no Error 1102 / Worker resource-limit body is present.

Forward D1 authority remains `migrations/canonical/manifest.json` + `scripts/d1_migrate.py`; canonical migrations remain exactly `0001`–`0004`. Production live-resource retries remain capped at three transient attempts; permanent 4xx and genuine resource failures fail closed. Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.
