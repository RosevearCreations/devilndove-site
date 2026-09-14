# Devil n Dove — Project Status & Roadmap

## Current checkpoint

**Release 467 Build 149 — Seller Listing Manager & Fast Product Editing** is fully Development + Production GREEN.

- SHA `6ff380f581bce93a42aacb982ba4c686baa5c5c4`
- tree `c1829f6371b3d5b7cd771f9f170260f53d5a7e08`
- System `34776427862`
- Quality `34776427860`
- I.T. `34776427885`
- Hygiene `34776427874`
- Production Pages `34776524835`
- Production Live Resources `34776571549`

Build 150 formally ingests that external closure. `dev` and `main` were verified at the Build 149 Production checkpoint before Build 150 work began.

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

# Build 149 — Seller Listing Manager & Fast Product Editing — CLOSED GREEN

Build 149 delivers seller-facing list/card/search, safe local quick edits, visible waiting/syncing/conflict state, `base_updated_at` conflict protection, draft-only clone semantics, catalog-media handoff and storefront preview. Active/publish, inventory, delete/archive and other high-authority changes remain live-only.

---

# Build 150 — Orders, Fulfillment & Buyer Communication Workspace — ACTIVE

Buyer lifecycle: Received → Confirmed → Making/Preparing → Ready for Pickup/Shipped → Complete.

Implemented candidate scope:

- one `/admin/orders/` seller workspace combining buyer/order identity, products/SKUs, payment state, fulfilment, pickup/shipping context, packaging/internal notes, copy-only buyer communication drafts, tracking audit, printable packing slip and timeline;
- search by order ID/number, buyer, email, Product/SKU and status;
- local packaging/internal/message drafts with explicit local-only state;
- existing canonical Orders + order-detail reads and Build 82 Operations fulfilment transitions retained as the authorities;
- stable `client_action_id` replay protection for live fulfilment writes, including the retained Build 82 fulfilment page via compatibility bridge;
- explicit pending-confirmation queue for uncertain response-loss outcomes; retry reuses the same action ID and never silently replays in the background;
- tracking changes recorded as append-only audit handoffs in existing `order_status_history`, with stale-order-status conflict protection;
- no buyer-message sending, carrier/provider execution, payment/refund execution, accounting posting, R2 mutation or request-time schema mutation;
- no new D1 migration; canonical migrations remain `0001`–`0004`.

Build 150 is not Production GREEN until its exact candidate SHA passes the Development System/Quality/I.T./Hygiene + Preview/binding/smoke chain, is promoted non-force with the identical SHA/tree to `main`, and passes Production Pages + Production Live Resource Integrity.

---

# Build 151 — Gifting, Custom Work, Local Pickup & Event Selling

Expand gift intent/message/wrap, recipient/occasion notes, pickup availability, custom-request intake, event availability and gift-card redemption. Seller Custom Work queue tracks request, quote, requested-by date, approval, deposit, reference images, gift instructions and handoff. Event mode must never silently oversell unique stock offline.

---

# Build 152 — Notifications, Activity Inbox & Cross-Device Continuity

Seller Activity Inbox should surface new orders, buyer messages, sync failures, listing issues, inventory warnings, custom requests, content approvals and system/provider warnings. Push is optional; durable in-app/server state is authoritative.

---

# Build 153 — UX Analytics, Recovery Telemetry & Conversion Improvement

Measure aggregate discovery→product→saved/cart→checkout→order, zero-result searches and recovery from API/offline failures. Telemetry may queue in bounded batches or be dropped; business workflows must never block on analytics.

---

# Build 154 — Cross-Surface UX Certification & Production Hardening

Certify phone browser, installed mobile PWA, tablet, desktop browser and installed desktop PWA. Chaos tests include latency, offline transition, D1/R2/API failure, stale service worker, expired auth, interrupted upload, duplicate request, response loss after commit and multi-device conflicts.

Block Production for critical overflow/navigation/accessibility failures, missing offline/error states, duplicate-mutation hazards, false payment/order state, stale stock presented as live, destructive offline replay, or more than one public H1.

---

# Release Governance

1. Verify previous exact SHA/tree and all six proofs at startup.
2. Next build ingests previous final closure; candidates never self-record future proof.
3. Push `dev` non-force.
4. Require exact-head System Gate, Current Application Quality, I.T. Admin Runtime and Repository Branch Hygiene GREEN, plus canonical Development D1 and exact Preview/bindings/smoke.
5. Promote the identical SHA/tree to `main` non-force only after Development is GREEN.
6. Require Production Pages Deploy SUCCESS.
7. Require Production Live Resource Integrity SUCCESS.
8. Only then call `main` / Production GREEN.
9. Preserve Build 135 transport resilience and canonical D1 0001–0004 unless an explicitly approved schema build changes authority.
10. External provider/evidence lanes remain separate from ordinary feature readiness.
