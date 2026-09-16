# Devil n Dove — Project Status & Roadmap

## Current checkpoint

**Release 467 Build 154 — Products Worker Resource Hotfix** is the current exact Development + Production source baseline.

- Development SHA `fc74ea680c0eee221722ce1ede6cb7990b92551f`
- Production SHA `cc50c65c7d4ecbb75e9744a57a14be7da4aba873`
- identical tree `36e466d2d971ac7c80f183c3b9b42a0ff56597d9`
- System `34867834161`
- Quality `34867834181`
- I.T. `34867834020`
- Hygiene `34867834038`
- Production Pages `34868084233`
- Production Live Resources `34868183267`
- Products Route Production Proof `34868183338`

Build 154 closed the server-side `/admin/products/` Cloudflare 1102 incident: Production returned HTTP 200 through the static Products fast path with module/session guards intact and no Worker resource-limit body. That exact closure remains valid for the server route, but it did not execute authenticated Product-page JavaScript.

A later real Firefox session at **2026-09-14 12:46 EDT** exposed a separate client-side blocker: the page HTML renders, then the browser reports **This page isn't responding** while the existing-Product picker and several loading panels remain unfinished. Production live-resource evidence already showed **40 Products / 216 image candidates**, so the catalog itself is present. Build 155 is therefore an urgent client-responsiveness hotfix and adds real-browser acceptance rather than another HTTP-only proof.

Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`. Canonical D1 migrations remain exactly `0001`–`0004`. Build 135 transient-transport retry policy remains mandatory and fail-closed for permanent 4xx and genuine resource correctness failures.

---

# Permanent UX / Connectivity Contract

- Mobile app/PWA: single-primary-task layouts, large touch targets, no hover dependency, no forced desktop tables, safe-area support.
- Tablet: first-class portrait/landscape layouts.
- Desktop/PWA: persistent navigation, wider tables where appropriate, keyboard-friendly workflows, safe bulk operations.
- Responsive Web remains the canonical compatibility baseline; installation is never required for core buyer/seller workflows.
- Every network surface distinguishes loading, cached/stale, disconnected and genuine error states.
- Cached/stale price, stock, order, payment, gift balance and fulfillment state must never be presented as live authority.
- Safe local drafts may survive restart; high-authority financial/destructive actions require fresh live validation and are never silently replayed offline.
- Conflicts stop silent overwrite and surface explicit review.
- Public SEO remains exactly one H1 per page with canonical metadata, semantic heading order, crawl-safe core content and useful alt text.

---

# Build 151 — Gifting, Custom Work, Local Pickup & Event Selling — CLOSED GREEN

Build 151 converged existing Gift Card, Custom Requests, Orders, pickup and Events authorities without adding a second write backend or a new D1 migration. Local pickup remains server-authoritative and unique/event stock must be revalidated live.

---

# Build 152 — Site-wide Image Quality Scoring & Media QA — CLOSED GREEN

Build 152 extended the existing Release 448 product-photo scoring approach to editable public/static website images without creating a second scoring standard. Scoring remains advisory, lazy/visible-first and read-only; SVG/load failures remain explicit and canonical D1 remains `0001`–`0004`.

---

# Build 153 — Layout Observer Performance Hotfix — CLOSED GREEN

Build 153 repaired the Production Firefox long-script termination reported at `layout-overflow-guard.js:58:26` by batching MutationObserver work, filtering irrelevant additions, deduplicating nested roots, isolating self-mutations and advancing the Products layout cache token to `467-b153-layout-observer`.

Its exact six-proof Production closure remains historically valid. The later Build 154 Worker incident and Build 155 client-loop incident are separate coverage gaps rather than invalidations of the Build 153 layout-observer repair.

---

# Build 154 — Products Worker Resource Hotfix — CLOSED / SERVER ROUTE GREEN

Build 154 preserves admin session/module authorization while removing `/admin/products/` from the generic request-time `HTMLRewriter` path. It uses a bounded Products-only text fast path, `X-DND-Products-Render-Path: static-fast-path`, `Cache-Control: no-store`, and route-specific Production proof.

Exact Build 154 Production proof established HTTP 200, module guard headers, the expected Product assets, and no Error 1102 / Worker resource-limit response. The closure explicitly records `client_ui_usability_proven: false` because later browser evidence showed the Product UI could still lock after the server response completed.

---

# Build 155 — Products Client Responsiveness Hotfix — ACTIVE

Repair the confirmed browser-main-thread lock on `/admin/products/` without weakening Product data, module security or Marketplace Listing Readiness authority.

- Break the self-triggering `MutationObserver`/`render()` loop in `admin-products-marketplace-readiness.js`.
- Make marketplace row rendering idempotent with a deterministic render fingerprint.
- Disconnect the observer while authored marketplace markup is changed and ignore mutation batches originating inside `.marketplace-readiness-inline`.
- Keep Marketplace Listing Readiness browser-local/advisory; add no Product API writes or marketplace publication.
- Advance Product asset revision to `467-b155-products-client-responsiveness` and dynamic Marketplace import to `467b155`; preserve `467-b153-layout-observer`.
- Expose a non-sensitive runtime health marker so acceptance can prove render stability rather than infer it.
- Add a real Chromium/CDP Development proof after exact Preview deployment and a real Chromium/CDP Production proof after exact Production deployment.
- Require an existing authenticated administrator session, Product picker options > 1, rendered Product rows > 0, a functioning event-loop heartbeat, stable marketplace render count, and cleanup/quality panels no longer stuck in Loading.
- Browser proof remains GET/observation-only and never creates a session or mutates Product, D1, R2, provider, payment, refund or accounting authority.

---

# Build 156 — Notifications, Activity Inbox & Cross-Device Continuity — QoL

Seller Activity Inbox should surface new orders, buyer messages, sync failures, listing issues, inventory warnings, custom requests, content approvals and system/provider warnings. Push is optional; durable in-app/server state is authoritative. Add read/unread, useful deep links, severity, snooze/dismiss for advisory items, and cross-device continuity without allowing notifications themselves to mutate high-authority business state.

---

# Build 157 — UX Analytics, Recovery Telemetry & Conversion Improvement — Efficiency + Error Handling

Measure aggregate discovery→product→saved/cart→checkout→order, zero-result searches and recovery from API/offline failures. Telemetry may queue in bounded batches or be dropped; business workflows must never block on analytics.

---

# Build 158 — Cross-Surface UX Certification & Production Hardening — Resilience

Certify phone browser, installed mobile PWA, tablet, desktop browser and installed desktop PWA. Block Production for critical overflow/navigation/accessibility failures, missing offline/error states, duplicate-mutation hazards, false payment/order state, stale stock presented as live, destructive offline replay, or more than one public H1.

---

# Build 159 — Error Recovery & Self-Diagnostics Centre — Error Handling

Create one operator-facing place to understand failures without hunting through unrelated pages. Normalize human-readable errors, correlation/request IDs, retryability, affected module, last successful action and safe recovery instructions.

---

# Build 160 — Workflow Efficiency & Smart Defaults — Efficiency

Reduce repetitive admin work: remember safe filters/view preferences, restore recent work context, preserve non-authoritative drafts, add clearer duplicate/clone flows, sensible defaults, keyboard-first actions, recent items, safer bulk selection and fewer unnecessary reloads.

---

# Build 161 — Universal Search, Recent Work & Command Centre — QoL

Unify navigation to Products, Inventory, Tools, Projects, Orders, Custom Work, Content, Media, Finance and I.T. Add recent work, favourites, search-by-name/SKU/reference, keyboard command access, and context-preserving return links.

---

# Build 162 — Media & Content Efficiency Pass — QoL + Media

Build on Build 152 scoring with media-library housekeeping: assignment visibility, unused-image detection, duplicate/near-duplicate review, missing alt/title warnings, wrong-size/aspect warnings, low-score filters, replace-file-while-keeping-placements, and page-level media readiness. No automatic deletion and no automatic replacement of authored media.

---

# Build 163 — Inventory / Creator Workflow Automation — Efficiency

Reduce manual bookkeeping across kits, batches, material use, project cost and profitability. Make linked-item names clear, preserve remaining kit components, default safe use/batch values where breakdown authority exists, surface unsaved usage, and provide explicit reconciliation rather than hidden correction.

---

# Build 164 — API Error Contract & Safe Retry Normalization — Error Handling

Standardize admin/public API failures so UI code receives JSON rather than unexpected HTML, with stable error code, human message, retryability and correlation ID. Apply bounded transient retry only where safe and idempotent.

---

# Build 165 — I.T. Readiness, Self-Healing Guidance & Release Efficiency — Operations

Converge preflight, bindings, migration proof, runtime incidents, provider readiness, quota/subrequest health, cache/service-worker state and deployment identity into one I.T. readiness view. Offer bounded corrective mechanics only where already authorized and reversible.

---

# Release Governance

1. Verify previous exact SHA/tree and all required proofs at startup.
2. The next build ingests that closure; candidates never self-record future proof.
3. Push `dev` non-force.
4. Require exact-head System Gate, Current Application Quality, I.T. Admin Runtime and Repository Branch Hygiene GREEN, plus canonical Development D1 and exact Preview/bindings/smoke.
5. Resource/client-sensitive hotfixes require direct acceptance of the affected live route/workflow; generic smoke is not enough.
6. Build 155 additionally requires a real authenticated Development browser proof before Production promotion.
7. Promote the identical tree to `main` non-force only after Development is GREEN.
8. Require Production Pages Deploy SUCCESS and Production Live Resource Integrity SUCCESS.
9. Build 155 additionally requires the real authenticated Production browser proof to show a populated Product picker/table, responsive event loop and stable marketplace renderer before the Product Entry incident may be called GREEN.
10. Preserve Build 135 transport resilience and canonical D1 `0001`–`0004` unless an explicitly approved schema build changes authority.
11. External provider/evidence lanes remain separate from ordinary feature readiness.

<!-- CURRENT_RELEASE_RESTART_AUTHORITY_START -->
## Current Release 467 restart authority — Build 157 candidate

Build 156 **Tool & Supply Process Assignment** is the last fully verified Development and current Production baseline. Development SHA/main SHA: `1b375af8dadb1bfc32086708469cc2008ba9fc9f`. Exact tree: `96928f3c3d09dcf1999387d9a63a823f264bebf8`. Development proofs: System Gate `35019952492`, Current Application Quality `35019952480`, I.T. Admin Runtime `35019952545`, Repository Branch Hygiene `35019952489`. Production proofs: Pages `35020167619`, live-resource integrity `35020259348`, Products browser `35020259412`, Products route `35020259408`.

Build 157 **Product Admin + Admin Data Delivery** supersedes the old roadmap placeholder for Build 157 and is the active Development candidate. It addresses current Product Admin delivery/responsiveness: fresh core Product snapshot reuse for at most two startup consumers, list-readiness cap 80, Product resource bootstrap 80 default/120 max, Inventory reconciliation delivery cap 80, fail-soft Product Quality recovery without a duplicate Product D1 read, and Admin suppression of redundant `/api/product-media` retries for already-missing Product keys. Public storefront media recovery remains unchanged.

The latest live Firefox evidence showed `Product startup request timed out after 8000 ms` in Product Release Quality plus repeated missing Product-media 404 retries. Build 157 does not claim those missing R2 objects exist; it keeps the operator workspace responsive, shows truthful placeholder/degraded evidence, and leaves later media reconciliation separate.

Promotion remains closed until one exact Build 157 `dev` SHA is GREEN across Build 157 source proof, retained Build 156 regression proof, System Gate/Preview, Current Application Quality, I.T. Admin Runtime and Repository Branch Hygiene. Exact Production Pages, live-resource and affected Product browser acceptance are then required before Production may be called GREEN for Build 157.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->
