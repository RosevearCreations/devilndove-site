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
