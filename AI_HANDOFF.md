# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 154 — Products Worker Resource Hotfix** is the current exact source/Production baseline for the server-route repair.

- Development SHA `fc74ea680c0eee221722ce1ede6cb7990b92551f`
- Production main SHA `cc50c65c7d4ecbb75e9744a57a14be7da4aba873`
- identical tree `36e466d2d971ac7c80f183c3b9b42a0ff56597d9`
- System Gate `34867834161`
- Current Application Quality `34867834181`
- I.T. Admin Runtime `34867834020`
- Repository Branch Hygiene `34867834038`
- Production Pages Deploy `34868084233`
- Production Live Resource Integrity `34868183267`
- Products Route Production Proof `34868183338`

Build 154 is sealed in `release467-build154-products-worker-resource-hotfix.json`. It proved the live `/admin/products/` server route returns HTTP 200 through the static fast path with module guards intact and without Cloudflare Error 1102. That closure is deliberately limited: it does **not** claim that authenticated Product-page JavaScript is responsive.

At `2026-09-14T12:46:00-04:00`, a real Firefox session showed the live Products page rendering HTML but then becoming unresponsive. The existing-Product picker remained empty while draft/archive cleanup and Product Release Quality stayed in Loading states. Production live-resource evidence simultaneously showed 40 Products and 216 image candidates, proving this is not an empty Production catalog.

## Active candidate

Build 155 — **Products Client Responsiveness Hotfix** — is the active schema-free candidate.

The confirmed root cause is the Build 106 Marketplace Listing Readiness client: it observes the Product table, and its render path previously replaced `.marketplace-readiness-inline` HTML on every render. Those replacements are mutations inside the same observed table, so the observer scheduled another full render roughly every 80 ms. The resulting self-triggering loop can starve the browser main thread while other Product startup requests and dropdown rendering remain unfinished.

Build 155 makes that renderer idempotent, fingerprints each row's readiness markup, disconnects the observer during authored rendering, ignores mutation batches originating inside its own marketplace panels, and exposes a non-sensitive `DDProductsMarketplaceReadinessHealth` runtime marker. Product assets advance to `467-b155-products-client-responsiveness`; the dynamic Marketplace import advances to `467b155`; the Build 153 layout guard remains `467-b153-layout-observer`.

Acceptance is also strengthened. `scripts/products_browser_runtime_probe.mjs` drives a real headless Chromium session through CDP with an existing masked admin session. It requires the Product picker to contain real Product options, the Product table to contain rows, the browser event-loop heartbeat to complete, the Build 155 client-health marker to be active, and marketplace render count to remain stable during a 1.2-second window. It also fails if cleanup or Product Release Quality remain stuck in their Loading states. A mere HTTP 200 is no longer sufficient.

The hotfix changes no business data, D1/R2 state, provider execution, payment/refund/accounting state or schema. Canonical D1 migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.

Build 155 must pass candidate System/Quality/I.T./source proof, then exact `dev` System/Quality/I.T./Hygiene **plus the real Development browser proof**, followed by normal identical-tree promotion to `main`, Production Pages Deploy, Production Live Resource Integrity, and the **real Production browser proof** before the Product Entry incident may be called GREEN.

<!-- CURRENT_RELEASE_RESTART_AUTHORITY_START -->
## Current Release 467 restart authority — Build 158 candidate

Build 157 **Product Admin + Admin Data Delivery** is the last fully verified Development and current Production baseline. Development SHA/main SHA: `4b82883a79e1897792fd3840860760b555e0dd36`. Exact tree: `045ff6357572177fff9417f229cadce294080b02`. Development proofs: System Gate `35045214773`, Current Application Quality `35045214757`, I.T. Admin Runtime `35045214868`, Repository Branch Hygiene `35045214777`. Production proofs: Pages `35050288505`, live-resource integrity `35050347701`, Products browser `35050347805`, Products route `35050347663`.

Build 158 **Product Editor Startup Resilience** is the active Development candidate. It keeps the editor usable when catalog/tax enrichment is slow by canonicalizing Product option bootstrap to one bounded read, serving a browser snapshot or safe editor defaults before optional enrichment can paint the legacy 6000 ms startup error, and allowing authoritative D1-backed options to refresh later. Product create/update mutations are unchanged.

The Product Release Quality lane remains truthful and fail-soft: a bounded `readiness_timeout` is displayed as deferred/pending rather than as a broken Product workspace, and unknown evidence is never marked complete. Real buyer-fact, HTTP, Worker-resource, authentication, or database failures remain warnings. Build 156 request concurrency limits remain preserved.

Cloudflare Access service-token transport is configured and proven for Development browser acceptance; secret values are never recorded here. Canonical migrations remain `0001`–`0005`, and request-time schema/Product/D1/R2/provider/payment/refund/accounting mutation remains closed.

Promotion remains closed until one exact Build 158 `dev` SHA is GREEN across Build 158 source proof, retained Build 157/156 regression proofs, System Gate/Preview, Current Application Quality, I.T. Admin Runtime, Repository Branch Hygiene, and the authenticated Product browser regression proof. Production then requires the identical-tree Pages deployment, live-resource proof, Product route proof, and authenticated Product browser proof before Build 158 may be called GREEN.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->
