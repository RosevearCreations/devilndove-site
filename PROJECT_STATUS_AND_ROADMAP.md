# Devil n Dove — Project Status & Roadmap

## Current checkpoint

**Release 467 Build 152 — Site-wide Image Quality Scoring & Media QA** is fully Development + Production GREEN.

- Development SHA `1d01cbed98b78543b75dab808a30fb76c20d6060`
- Production SHA `2f22e280426968a9ff229a0cee9ee62a69dc9d75`
- identical tree `9cf8b0ac918ce567c51536f05d4c89b6f6294765`
- System `34860514075`
- Quality `34860514137`
- I.T. `34860514304`
- Hygiene `34860514150`
- Production Pages `34860809983`
- Production Live Resources `34860922626`

Build 153 formally ingests that external closure. Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`. Canonical D1 migrations remain exactly `0001`–`0004`. Build 135 transient-transport retry policy remains mandatory and fail-closed for permanent 4xx and genuine resource correctness failures.

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

Build 152 extended the existing Release 448 product-photo scoring approach to editable public/static website images without creating a second scoring standard.

- Same advisory 100-point browser Canvas rubric: Lighting 20, Detail/Clarity 20, Background 15, Framing 15, Resolution 10, Colour 10, Artifacts 5, Consistency 5.
- Media & Content Studio and authenticated public-page Edit mode expose the same scoring guidance.
- Lazy/visible-first scoring prevents large image libraries from becoming a heavy startup task.
- SVG placeholders are identified but not graded.
- Canvas/CORS/load failures surface `Image score unavailable` rather than a false low-quality score.
- Scoring remains read-only guidance: no publish, replace, hide, delete, D1 write, R2 mutation or provider action.
- Canonical D1 remains exactly `0001`–`0004`.

---

# Build 153 — Layout Observer Performance Hotfix — ACTIVE

Repair the Production Firefox long-script termination reported at `layout-overflow-guard.js:58:26`.

- Replace synchronous per-added-node subtree rescans with a single animation-frame batch.
- Ignore added DOM that contains no `table`, `.container` or `.admin-shell` target.
- Deduplicate nested roots so one render subtree is scanned once.
- Disconnect the MutationObserver while the guard creates its own table wrappers, preventing self-generated child-list work from scheduling another pass.
- Preserve existing centered-shell and keyboard-reachable horizontal-table behavior.
- Advance the Products layout-guard cache token to `467-b153-layout-observer` so Production cannot retain the stale `467-products-b98-readiness-triage` guard URL.
- Add no D1/R2/provider/payment/refund/accounting/request-time-schema mutation authority.

---

# Build 154 — Notifications, Activity Inbox & Cross-Device Continuity — QoL

Seller Activity Inbox should surface new orders, buyer messages, sync failures, listing issues, inventory warnings, custom requests, content approvals and system/provider warnings. Push is optional; durable in-app/server state is authoritative. Add read/unread, useful deep links, severity, snooze/dismiss for advisory items, and cross-device continuity without allowing notifications themselves to mutate high-authority business state.

---

# Build 155 — UX Analytics, Recovery Telemetry & Conversion Improvement — Efficiency + Error Handling

Measure aggregate discovery→product→saved/cart→checkout→order, zero-result searches and recovery from API/offline failures. Telemetry may queue in bounded batches or be dropped; business workflows must never block on analytics.

---

# Build 156 — Cross-Surface UX Certification & Production Hardening — Resilience

Certify phone browser, installed mobile PWA, tablet, desktop browser and installed desktop PWA. Block Production for critical overflow/navigation/accessibility failures, missing offline/error states, duplicate-mutation hazards, false payment/order state, stale stock presented as live, destructive offline replay, or more than one public H1.

---

# Build 157 — Error Recovery & Self-Diagnostics Centre — Error Handling

Create one operator-facing place to understand failures without hunting through unrelated pages. Normalize human-readable errors, correlation/request IDs, retryability, affected module, last successful action and safe recovery instructions.

---

# Build 158 — Workflow Efficiency & Smart Defaults — Efficiency

Reduce repetitive admin work: remember safe filters/view preferences, restore recent work context, preserve non-authoritative drafts, add clearer duplicate/clone flows, sensible defaults, keyboard-first actions, recent items, safer bulk selection and fewer unnecessary reloads.

---

# Build 159 — Universal Search, Recent Work & Command Centre — QoL

Unify navigation to Products, Inventory, Tools, Projects, Orders, Custom Work, Content, Media, Finance and I.T. Add recent work, favourites, search-by-name/SKU/reference, keyboard command access, and context-preserving return links.

---

# Build 160 — Media & Content Efficiency Pass — QoL + Media

Build on Build 152 scoring with media-library housekeeping: assignment visibility, unused-image detection, duplicate/near-duplicate review, missing alt/title warnings, wrong-size/aspect warnings, low-score filters, replace-file-while-keeping-placements, and page-level media readiness. No automatic deletion and no automatic replacement of authored media.

---

# Build 161 — Inventory / Creator Workflow Automation — Efficiency

Reduce manual bookkeeping across kits, batches, material use, project cost and profitability. Make linked-item names clear, preserve remaining kit components, default safe use/batch values where breakdown authority exists, surface unsaved usage, and provide explicit reconciliation rather than hidden correction.

---

# Build 162 — API Error Contract & Safe Retry Normalization — Error Handling

Standardize admin/public API failures so UI code receives JSON rather than unexpected HTML, with stable error code, human message, retryability and correlation ID. Apply bounded transient retry only where safe and idempotent.

---

# Build 163 — I.T. Readiness, Self-Healing Guidance & Release Efficiency — Operations

Converge preflight, bindings, migration proof, runtime incidents, provider readiness, quota/subrequest health, cache/service-worker state and deployment identity into one I.T. readiness view. Offer bounded corrective mechanics only where already authorized and reversible.

---

# Release Governance

1. Verify previous exact SHA/tree and all six proofs at startup.
2. Next build ingests previous final closure; candidates never self-record future proof.
3. Push `dev` non-force.
4. Require exact-head System Gate, Current Application Quality, I.T. Admin Runtime and Repository Branch Hygiene GREEN, plus canonical Development D1 and exact Preview/bindings/smoke.
5. Promote the identical tree to `main` non-force only after Development is GREEN.
6. Require Production Pages Deploy SUCCESS.
7. Require Production Live Resource Integrity SUCCESS.
8. Only then call `main` / Production GREEN.
9. Preserve Build 135 transport resilience and canonical D1 0001–0004 unless an explicitly approved schema build changes authority.
10. External provider/evidence lanes remain separate from ordinary feature readiness.
