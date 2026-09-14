# Devil n Dove — Project Status & Roadmap

## Current checkpoint

**Release 467 Build 153 — Layout Observer Performance Hotfix** is fully Development + Production GREEN at its exact promoted boundary.

- Development SHA `b8323b4e13ae08a8126da761106367de75f7cd40`
- Production SHA `ba8b3c2406335391334b2a74a89e5819236c770b`
- identical tree `a3d0225c579953d5572dc99313661c2981c42510`
- System `34863777573`
- Quality `34863777529`
- I.T. `34863777559`
- Hygiene `34863777543`
- Production Pages `34864015766`
- Production Live Resources `34864113781`

A later route-specific incident exposed a gap in that otherwise exact proof bundle: at **2026-09-14 15:48:10 UTC**, `/admin/products/` returned HTTP 503 / Cloudflare **Error 1102 — Worker exceeded resource limits**. Build 154 is therefore an urgent Products Worker resource hotfix and adds a direct live Products-route proof that was not part of Build 153 acceptance.

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

Its exact six-proof Production closure remains historically valid. The later Build 154 incident is recorded separately because Build 153 acceptance did not directly request `/admin/products/` and therefore did not prove that route's Worker resource consumption.

---

# Build 154 — Products Worker Resource Hotfix — ACTIVE

Repair the confirmed Production HTTP 503 / Cloudflare Error 1102 on `/admin/products/` without weakening admin/module security.

- Preserve the existing session resolution and module-access evaluation before the Products page response is rendered.
- Remove the Products document from the generic request-time `HTMLRewriter` path.
- Use a bounded Products-only text fast path to inject the same shared responsive/PWA/layout assets and cache-revise Product scripts.
- Emit `X-DND-Products-Render-Path: static-fast-path` so Development and Production acceptance can prove the intended renderer is live.
- Keep the Build 153 layout-observer repair at `467-b153-layout-observer`.
- Mark transformed Products HTML `no-store` so an old server-rendered document cannot conceal the repair.
- Add a post-Production-deploy route proof that requests the real `/admin/products/`, permits at most three Build-135 transient attempts, requires HTTP 200 + module-guard headers + the Build 154 cache token, and rejects `1102` / `Worker exceeded resource limits`.
- Add no schema, D1/R2 business-data, provider, payment, refund or accounting mutation authority.

---

# Build 155 — Notifications, Activity Inbox & Cross-Device Continuity — QoL

Seller Activity Inbox should surface new orders, buyer messages, sync failures, listing issues, inventory warnings, custom requests, content approvals and system/provider warnings. Push is optional; durable in-app/server state is authoritative. Add read/unread, useful deep links, severity, snooze/dismiss for advisory items, and cross-device continuity without allowing notifications themselves to mutate high-authority business state.

---

# Build 156 — UX Analytics, Recovery Telemetry & Conversion Improvement — Efficiency + Error Handling

Measure aggregate discovery→product→saved/cart→checkout→order, zero-result searches and recovery from API/offline failures. Telemetry may queue in bounded batches or be dropped; business workflows must never block on analytics.

---

# Build 157 — Cross-Surface UX Certification & Production Hardening — Resilience

Certify phone browser, installed mobile PWA, tablet, desktop browser and installed desktop PWA. Block Production for critical overflow/navigation/accessibility failures, missing offline/error states, duplicate-mutation hazards, false payment/order state, stale stock presented as live, destructive offline replay, or more than one public H1.

---

# Build 158 — Error Recovery & Self-Diagnostics Centre — Error Handling

Create one operator-facing place to understand failures without hunting through unrelated pages. Normalize human-readable errors, correlation/request IDs, retryability, affected module, last successful action and safe recovery instructions.

---

# Build 159 — Workflow Efficiency & Smart Defaults — Efficiency

Reduce repetitive admin work: remember safe filters/view preferences, restore recent work context, preserve non-authoritative drafts, add clearer duplicate/clone flows, sensible defaults, keyboard-first actions, recent items, safer bulk selection and fewer unnecessary reloads.

---

# Build 160 — Universal Search, Recent Work & Command Centre — QoL

Unify navigation to Products, Inventory, Tools, Projects, Orders, Custom Work, Content, Media, Finance and I.T. Add recent work, favourites, search-by-name/SKU/reference, keyboard command access, and context-preserving return links.

---

# Build 161 — Media & Content Efficiency Pass — QoL + Media

Build on Build 152 scoring with media-library housekeeping: assignment visibility, unused-image detection, duplicate/near-duplicate review, missing alt/title warnings, wrong-size/aspect warnings, low-score filters, replace-file-while-keeping-placements, and page-level media readiness. No automatic deletion and no automatic replacement of authored media.

---

# Build 162 — Inventory / Creator Workflow Automation — Efficiency

Reduce manual bookkeeping across kits, batches, material use, project cost and profitability. Make linked-item names clear, preserve remaining kit components, default safe use/batch values where breakdown authority exists, surface unsaved usage, and provide explicit reconciliation rather than hidden correction.

---

# Build 163 — API Error Contract & Safe Retry Normalization — Error Handling

Standardize admin/public API failures so UI code receives JSON rather than unexpected HTML, with stable error code, human message, retryability and correlation ID. Apply bounded transient retry only where safe and idempotent.

---

# Build 164 — I.T. Readiness, Self-Healing Guidance & Release Efficiency — Operations

Converge preflight, bindings, migration proof, runtime incidents, provider readiness, quota/subrequest health, cache/service-worker state and deployment identity into one I.T. readiness view. Offer bounded corrective mechanics only where already authorized and reversible.

---

# Release Governance

1. Verify previous exact SHA/tree and all six proofs at startup.
2. The next build ingests that closure; candidates never self-record future proof.
3. Push `dev` non-force.
4. Require exact-head System Gate, Current Application Quality, I.T. Admin Runtime and Repository Branch Hygiene GREEN, plus canonical Development D1 and exact Preview/bindings/smoke.
5. For Build 154 and later resource-sensitive hotfixes, require a direct route proof for the affected live route rather than relying only on generic smoke/resource checks.
6. Promote the identical tree to `main` non-force only after Development is GREEN.
7. Require Production Pages Deploy SUCCESS.
8. Require Production Live Resource Integrity SUCCESS.
9. Require the Build 154 Products Production Route Proof SUCCESS before calling this incident fixed/Production healthy.
10. Preserve Build 135 transport resilience and canonical D1 `0001`–`0004` unless an explicitly approved schema build changes authority.
11. External provider/evidence lanes remain separate from ordinary feature readiness.
