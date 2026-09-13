# Devil n Dove — Project Status & Roadmap

## Current checkpoint

**Release 467 Build 147 — Buyer Account, Saved Items & Order Hub** is fully Development + Production GREEN.

- SHA `3fadc908df56ba194e2cd2f9e5480f6bfbedb796`
- tree `aeee53fdd3e01aee6b01a75e83f92f57b859960f`
- System `34769839872`
- Quality `34769839865`
- I.T. `34769839876`
- Hygiene `34769839871`
- Production Pages `34769929784`
- Production Live Resources `34769969149`

Build 148 formally ingests that external closure. `dev` and `main` were verified identical at the Build 147 checkpoint before Build 148 work began.

Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.

Canonical D1 migrations remain exactly `0001`–`0004`. Build 135 transient-transport retry policy remains mandatory and fail-closed for permanent 4xx and genuine resource correctness failures.

---

# Permanent UX / Connectivity Contract

- Mobile app/PWA: single-primary-task layouts, large touch targets, no hover dependency, no forced desktop tables, safe-area support.
- Tablet: first-class portrait/landscape layouts.
- Desktop/PWA: persistent navigation, wider tables where appropriate, keyboard-friendly workflows, bulk operations only where safe.
- Responsive Web remains the canonical compatibility baseline; installation is never required for core buyer/seller workflows.
- Every network surface must distinguish loading, cached/stale, disconnected and genuine error states.
- Cached/stale price, stock, order, payment, gift balance and fulfillment state must never be presented as live authority.
- Safe local drafts may survive restart; high-authority financial/destructive actions require fresh live validation and are never silently replayed offline.
- Conflicts stop silent overwrite and surface explicit review.
- Public SEO: exactly one H1, canonical metadata, crawl-safe core content, semantic heading order and useful alt text.
- Accessibility: keyboard reachability, visible focus, screen-reader status, contrast and reduced-motion support.

---

# Build 148 — Seller Daily Command Centre — ACTIVE

## Goal

Answer **What needs my attention right now?** within roughly five seconds without introducing a second operational database or queue.

## Read authorities

Use existing non-mutating authorities only:
- Today Tasks read contract;
- scoped Admin dashboard summary;
- current I.T./Reliability truth;
- existing Admin workspace routes.

Do **not** reuse the legacy Command Center endpoint's request-time DDL.

## Seller experience

Prioritize queues/cards for:
- New/open Orders;
- Needs Reply / custom requests;
- Ready to Make/Prepare;
- Ready to Pack/Pickup/Ship;
- Low Stock;
- Listings Needing Work;
- Failed Sync / runtime incidents;
- Content Awaiting Approval;
- System/provider warnings.

Simple first-view metrics may include live visitors, orders, product/catalog counts, recent searches, low-stock count, failed webhooks/disputes and task-group totals. Revenue remains authoritative in Finance/Business Health rather than duplicated from incomplete dashboard data.

## Offline behavior

A last-known read-only cockpit snapshot may be kept locally with a visible timestamp and `cached/stale` label. Current business actions remain disabled or route to live workspaces only after connectivity returns.

## Safety

- GET/read aggregation only.
- No schema/D1/R2/provider/accounting/inventory/price mutation.
- No task completion/snooze/ignore from the cockpit.
- No silent background business action.

---

# Build 149 — Seller Listing Manager & Fast Product Editing

Target gallery/list views, searchable lifecycle states, quick edit, persistent Preview/Publish, clone listing, safe bulk category/status/tag actions, autosave, mobile photo capture, reorder/crop/rotate where supported, captions/alt text, reusable templates and at-a-glance stats.

Safe edits must show visible state: `Saved locally` → `Waiting to sync` → `Synced`; conflicts must stop silent overwrite. Publication requires live connectivity and fresh validation.

---

# Build 150 — Orders, Fulfillment & Buyer Communication Workspace

Buyer lifecycle: Received → Confirmed → Making/Preparing → Ready for Pickup/Shipped → Complete.

Seller workspace should combine buyer/order identity, line items, payment state, fulfillment, pickup/shipping, packaging/internal notes, buyer messages, tracking, packing slip and timeline. Search by order ID, buyer, email, product and status.

Notes/message drafts may save locally; refunds, fulfillment completion, tracking changes and outbound notifications require live confirmation and idempotent response-loss recovery.

---

# Build 151 — Gifting, Custom Work, Local Pickup & Event Selling

Expand gift intent/message/wrap, recipient/occasion notes, pickup availability, custom-request intake, event availability and gift-card redemption. Seller Custom Work queue tracks request, quote, requested-by date, approval, deposit, reference images, gift instructions and handoff. Event mode must never silently oversell unique stock offline.

---

# Build 152 — Notifications, Activity Inbox & Cross-Device Continuity

Seller Activity Inbox should surface new orders, buyer messages, sync failures, listing issues, inventory warnings, custom requests, content approvals and system/provider warnings. Push is optional enhancement; durable in-app/server state is authoritative.

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
9. Preserve Build 135 live-resource transport resilience and canonical D1 0001–0004 unless an explicitly approved schema build changes authority.
10. External provider/evidence lanes remain separate from ordinary feature readiness.
