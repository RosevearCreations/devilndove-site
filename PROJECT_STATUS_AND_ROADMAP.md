# Devil n Dove — Project Status & Roadmap

## Current checkpoint

**Release 467 Build 150 — Orders, Fulfillment & Buyer Communication Workspace** is fully Development + Production GREEN.

- Development SHA `33d46f701adb839525561114a31abcd29943d28f`
- Production SHA `531e303d32d426d2db6986ec5c3d466455612ee3`
- identical tree `2f7add90d513a2e9548865f04d97e69b0ae3630e`
- System `34802545653`
- Quality `34802545673`
- I.T. `34802545668`
- Hygiene `34802545660`
- Production Pages `34802707901`
- Production Live Resources `34802759988`

Build 151 formally ingests that external closure. `dev` and `main` were verified at the Build 150 Production checkpoint before Build 151 work began.

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

# Build 150 — Orders, Fulfillment & Buyer Communication Workspace — CLOSED GREEN

Build 150 delivers one seller Orders workspace combining buyer/order identity, Product/SKU search, payment and fulfilment state, local packaging/internal/buyer-message drafts, printable packing slip, order timeline, stable `client_action_id` response-loss protection, and append-only tracking audit. Build 82 fulfilment authority remains retained. Buyer messages remain copy-only; carrier/provider, payment/refund/accounting and request-time schema mutation were not added.

---

# Build 151 — Gifting, Custom Work, Local Pickup & Event Selling — ACTIVE

Build 151 converges existing Gift Card, Custom Requests, Orders, pickup and Events authorities without adding a second write backend or a new D1 migration.

Implemented candidate scope:

- gift/product checkout captures optional recipient, occasion, gift message, presentation/wrap preference, requested-by date and event/market context as reviewed order notes;
- local pickup continues to use the server-authoritative checkout `fulfillment_type='pickup'` path; pickup removes shipping server-side and never bypasses live stock/pricing revalidation;
- public custom-request intake now accepts gift intent, recipient, occasion, presentation preference, handoff preference, event context and gift message while preserving them inside the existing request-message authority;
- a read-only seller **Custom Work** command surface summarizes request, quote, requested-by date, deposit/payment-request state, private reference-image count, order-draft state, active pickup orders and gift-card operational summary;
- the Custom Work convergence endpoint performs SELECT/PRAGMA reads only and moves no mutation authority;
- gift-card storefront adds occasion and requested-delivery intent while retaining `pending_activation` until payment confirmation and adding no automatic provider send;
- Events routes buyers into reviewed custom/event intake and states explicitly that an event conversation, offline note or submitted request is not a stock reservation;
- unique/event stock must be revalidated live before sale/reservation; Build 151 creates no offline stock authority and no background mutation replay;
- no new D1 migration; canonical migrations remain `0001`–`0004`;
- no provider publication, automatic buyer-message send, carrier execution, R2 mutation or request-time schema mutation is authorized by this build.

Build 151 is not Production GREEN until its exact candidate SHA passes Development System/Quality/I.T./Hygiene + canonical Development D1 + exact Preview/bindings/smoke, is promoted non-force with an identical tree to `main`, and passes Production Pages + Production Live Resource Integrity.

---

# Build 152 — Site-wide Image Quality Scoring & Media QA — STACKED CANDIDATE

Extend the existing Release 448 product-photo scoring approach to editable public/static website images without creating a second scoring standard.

- Same advisory 100-point browser Canvas rubric: Lighting 20, Detail/Clarity 20, Background 15, Framing 15, Resolution 10, Colour 10, Artifacts 5, Consistency 5.
- Show score, dimensions, component breakdown and concrete improvement guidance in Media & Content Studio for current-page images, picker/library images and the selected-image preview.
- Show the same score beside editable homepage/public-page images only when authenticated page-wide Edit mode is ON; visitors never receive the admin scoring UI.
- Lazy/visible-first scoring prevents large image libraries from becoming a heavy startup task.
- SVG placeholders are identified but not graded.
- Canvas/CORS/load failures surface `Image score unavailable`; they never become a false low-quality score.
- Scoring is read-only guidance only: no publish, replace, hide, delete, D1 write, R2 mutation or provider action.
- Canonical D1 remains exactly `0001`–`0004`.

Build 152 is stacked on the exact Build 151 candidate until Build 151 completes normal Development/Production promotion. It must not be promoted around Build 151.

---

# Build 153 — Notifications, Activity Inbox & Cross-Device Continuity — QoL

Seller Activity Inbox should surface new orders, buyer messages, sync failures, listing issues, inventory warnings, custom requests, content approvals and system/provider warnings. Push is optional; durable in-app/server state is authoritative. Add read/unread, useful deep links, severity, snooze/dismiss for advisory items, and cross-device continuity without allowing notifications themselves to mutate high-authority business state.

---

# Build 154 — UX Analytics, Recovery Telemetry & Conversion Improvement — Efficiency + Error Handling

Measure aggregate discovery→product→saved/cart→checkout→order, zero-result searches and recovery from API/offline failures. Telemetry may queue in bounded batches or be dropped; business workflows must never block on analytics. Add explicit failure/recovery categories so we can distinguish user correction, retry success, stale/offline fallback, server error, authorization failure and abandoned workflow.

---

# Build 155 — Cross-Surface UX Certification & Production Hardening — Resilience

Certify phone browser, installed mobile PWA, tablet, desktop browser and installed desktop PWA. Chaos tests include latency, offline transition, D1/R2/API failure, stale service worker, expired auth, interrupted upload, duplicate request, response loss after commit and multi-device conflicts.

Block Production for critical overflow/navigation/accessibility failures, missing offline/error states, duplicate-mutation hazards, false payment/order state, stale stock presented as live, destructive offline replay, or more than one public H1.

---

# Build 156 — Error Recovery & Self-Diagnostics Centre — Error Handling

Create one operator-facing place to understand failures without hunting through unrelated pages. Normalize human-readable errors, correlation/request IDs, retryability, affected module, last successful action and safe recovery instructions. Separate credential/configuration failures, Access/auth denial, D1/R2/binding problems, provider holds, route/API failures and genuine business-data conflicts. Diagnostics remain read-only unless an existing bounded corrective action is explicitly selected.

---

# Build 157 — Workflow Efficiency & Smart Defaults — Efficiency

Reduce repetitive admin work: remember safe filters/view preferences, restore recent work context, preserve non-authoritative drafts, add clearer duplicate/clone flows, sensible defaults, keyboard-first actions, recent items, safer bulk selection and fewer unnecessary reloads. Do not silently reuse stale price/stock/payment state and do not auto-submit destructive or financial actions.

---

# Build 158 — Universal Search, Recent Work & Command Centre — QoL

Unify navigation to Products, Inventory, Tools, Projects, Orders, Custom Work, Content, Media, Finance and I.T. Add recent work, favourites, search-by-name/SKU/reference, keyboard command access, and context-preserving return links. Keep module permission boundaries intact.

---

# Build 159 — Media & Content Efficiency Pass — QoL + Media

Build on Build 152 scoring with media-library housekeeping: assignment visibility, unused-image detection, duplicate/near-duplicate review, missing alt/title warnings, wrong-size/aspect warnings, low-score filters, replace-file-while-keeping-placements, and page-level media readiness. No automatic deletion and no automatic replacement of authored media.

---

# Build 160 — Inventory / Creator Workflow Automation — Efficiency

Reduce manual bookkeeping across kits, batches, material use, project cost and profitability. Make linked-item names clear, preserve remaining kit components, default safe use/batch values where breakdown authority exists, surface unsaved usage, and provide explicit reconciliation rather than hidden correction. Inventory mutation remains deliberate and auditable.

---

# Build 161 — API Error Contract & Safe Retry Normalization — Error Handling

Standardize admin/public API failures so UI code receives JSON rather than unexpected HTML, with stable error code, human message, retryability and correlation ID. Apply bounded transient retry only where safe and idempotent; permanent 4xx, validation conflicts, auth failures and business-rule failures remain fail-closed.

---

# Build 162 — I.T. Readiness, Self-Healing Guidance & Release Efficiency — Operations

Converge preflight, bindings, migration proof, runtime incidents, provider readiness, quota/subrequest health, cache/service-worker state and deployment identity into one I.T. readiness view. Offer bounded corrective mechanics only where they are already authorized and reversible; never silently mutate Production, credentials, D1 business data or R2 assets.

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
