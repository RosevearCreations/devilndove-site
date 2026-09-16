# Devil n Dove — Sanity Health Check

Current exact verified source baseline: **Release 467 Build 154 — Products Worker Resource Hotfix**.

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

**Production is not currently considered fully healthy for Product Entry.** Build 154 closed the server-side HTTP 503 / Cloudflare Error 1102 incident and proved `/admin/products/` returns HTTP 200 through the static fast path. However, at `2026-09-14T12:46:00-04:00`, a real Firefox session showed the rendered Product page becoming unresponsive while the existing-Product dropdown and several loading panels remained unfinished. The live Product API simultaneously proved 40 Products and 216 image candidates, so Product data is present.

Build 155 — **Products Client Responsiveness Hotfix** — is the active schema-free repair. The confirmed client root cause is Marketplace Listing Readiness repeatedly rewriting DOM inside a Product table that its own `MutationObserver` watches, causing another render roughly every 80 ms. Build 155 makes those row writes idempotent, disconnects/filters the observer around authored mutations, advances Product client cache identity, and adds a non-sensitive render-health marker.

The Product Entry incident is not closed until exact candidate and Development proofs pass, the canonical Development Preview passes a **real authenticated Chromium/CDP browser proof** with populated Product picker/table and responsive event loop, the identical tree is promoted to `main`, Production Pages and Live Resource proofs pass, and the **real authenticated Production browser proof** confirms the Product picker/table populate and marketplace render count remains stable rather than looping.

Safety boundaries remain unchanged: no D1/R2/provider/payment/refund/accounting/request-time-schema mutation authority is added. Canonical D1 migrations remain `0001`–`0004`. Build 135 transient transport policy remains mandatory and external provider/evidence lanes remain separate.

<!-- CURRENT_RELEASE_RESTART_AUTHORITY_START -->
## Current Release 467 restart authority — Build 158 candidate

Build 157 **Product Admin + Admin Data Delivery** is the last fully verified Development and current Production baseline. Development SHA/main SHA: `4b82883a79e1897792fd3840860760b555e0dd36`. Exact tree: `045ff6357572177fff9417f229cadce294080b02`. Development proofs: System Gate `35045214773`, Current Application Quality `35045214757`, I.T. Admin Runtime `35045214868`, Repository Branch Hygiene `35045214777`. Production proofs: Pages `35050288505`, live-resource integrity `35050347701`, Products browser `35050347805`, Products route `35050347663`.

Build 158 **Product Editor Startup Resilience** is the active Development candidate. The Product editor now treats catalog/tax enrichment as bounded optional startup work: duplicate editor bootstrap requests converge, a recent browser snapshot or safe defaults can keep the form usable before the legacy 6000 ms startup failure, and successful live authority replaces fallback options when available. Product write authority is unchanged.

Product Release Quality also distinguishes a bounded readiness delay from a real Product failure. `readiness_timeout` remains pending/unknown and is not marked complete; real buyer-fact, HTTP, Worker-resource, authentication, and database failures remain explicit warnings. The proven Build 156 request scheduler contract remains intact.

Cloudflare Access service-token transport is configured and proven for Development browser acceptance. Canonical migrations remain `0001`–`0005`; no request-time schema, Product, D1, R2, provider, payment, refund, or accounting mutation is added.

Current status is **Build 158 Development candidate only**. Promotion remains closed until the exact Build 158 head passes its source proof, retained Build 157/156 proofs, System Gate/Preview, Current Application Quality, I.T. Admin Runtime, Repository Branch Hygiene, and authenticated Product browser regression acceptance; Production then requires exact deployment and live Product/browser proofs.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->
