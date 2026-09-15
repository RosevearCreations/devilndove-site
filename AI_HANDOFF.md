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
## Current Release 467 restart authority — Build 156 candidate

Build 155 **Products Client Responsiveness Hotfix** is the last fully verified Development and current Production baseline. Development SHA/main SHA: `4e9efa2daf8f541e941c350ccde77798b5c99080`. Exact tree: `3f08dc3dfde778ddca0ca5fd328e7d45a1fcee9e`. Development proofs: System Gate `34915558746`, Current Application Quality `34915558747`, I.T. Admin Runtime `34915558751`, Repository Branch Hygiene `34915558771`, dedicated Build 155 proof `34915558804`. Production proofs: Pages `34915729378`, live-resource integrity `34915877580`, Products browser `34915877555`, Products route `34915877617`.

Build 156 **Tool & Supply Process Assignment** is the active Development closure candidate. It introduces forward-only canonical migration `0005_release467_inventory_process_assignment.sql`; Production promotion remains closed until the exact Build 156 `dev` head is GREEN across the required proof set.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->
