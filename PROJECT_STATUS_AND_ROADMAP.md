# Devil n Dove — Project Status & Roadmap

## Current checkpoint

**Release 467 Build 148 — Seller Daily Command Centre** is fully Development + Production GREEN.

- SHA `5a51981e7831bbef4f44c19f43a36b811e0a2e79`
- tree `f4e0a88f1f7c6837176a939a19e5d4ae36596434`
- System `34772251480`
- Quality `34772251467`
- I.T. `34772251459`
- Hygiene `34772251477`
- Production Pages `34772367891`
- Production Live Resources `34772410714`

Build 149 formally ingests that external closure. `dev` and `main` were verified at the Build 148 Production checkpoint before Build 149 work began.

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

# Build 148 — Seller Daily Command Centre — CLOSED GREEN

Build 148 delivers the seller attention cockpit from existing safe Today Tasks, dashboard-summary and I.T./Reliability read authorities. It remains read-only, schema-free and avoids the legacy Command Center request-time DDL path. Last-known dashboard context may be shown with a timestamp while disconnected; current business actions still require live authority.

---

# Build 149 — Seller Listing Manager & Fast Product Editing — ACTIVE

Target gallery/list views, search across lifecycle states, quick edit, persistent Preview/Publish, clone listing, safe bulk category/status/tag actions, mobile-friendly editing and media handoff.

Safe edits show visible state: `Saved locally` → `Waiting to sync` → `Syncing` → `Synced`, with `Conflict` stopping silent overwrite. Build 149 keeps inventory, active/publish, delete/archive and other high-authority changes out of automatic offline replay. Publication requires live connectivity and fresh validation.

The current implementation uses device-local snapshot and quick-edit records, foreground reconnect retry, `base_updated_at` conflict protection, server product/detail/update/create authorities, catalog-media handoff, storefront preview and draft-only clone semantics.

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
