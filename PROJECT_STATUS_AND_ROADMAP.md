# Devil n Dove — Project Status & Roadmap

## Current checkpoint

**Release 467 Build 142 — Storefront Continuity & Offline Foundation** has completed its external six-proof closure and is fully GREEN on the exact promoted source checkpoint:

- SHA `0b022c355217c00a7313aa2cb3e4b37a2b9a2b45`
- tree `acf47b86db2cd170dc1fadd2a9e827e485e7c908`
- System `34765428970`
- Quality `34765428976`
- I.T. `34765428961`
- Hygiene `34765428957`
- Production Pages `34765518900`
- Live Resources `34765564112`

`dev` and `main` were externally verified identical at that checkpoint with zero ahead/behind divergence.

Build 143 formally ingests Build 142's later external closure before starting its feature slice. Build 142 intentionally did not self-record future proof. The current candidate is **Build 143 — Adaptive Mobile/Desktop/Web Application Shell**.

Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.

Canonical D1 migrations remain exactly `0001`–`0004`. The Build 135 transient-transport retry policy remains mandatory and must not be weakened.

---

# Buyer + Seller User-Experience Programme — Builds 142–154

## Programme objective

The active Devil n Dove development cycle prioritizes visible user-experience improvement for both sides of the business while retaining the release-evidence, fail-closed and Canada-first boundaries already established.

1. **Buyer experience:** discovery, trust, product understanding, saving/favoriting, cart continuity, guest checkout, order visibility, gifting, pickup, custom work and graceful recovery when connectivity is poor.
2. **Seller experience:** fast daily triage, product creation/editing, mobile photography, order handling, custom-work management, fulfillment, buyer communication, merchandising, analytics and clear sync/recovery status.
3. **Cross-device design:** every important capability must work deliberately on Mobile app/PWA, Tablet, Desktop app/PWA and ordinary responsive Web. Presentation may adapt; the business capability must not silently disappear.
4. **Reliability:** network loss, API failure, D1/R2 interruption, stale clients, response loss after server success, interrupted upload and expired login must produce recoverable states rather than lost work or misleading success/failure messages.
5. **SEO and accessibility:** one public H1 per page, semantic headings, crawl-safe core content, useful metadata, alt text, keyboard access, visible focus, screen-reader status, contrast and reduced-motion support remain release requirements.

The programme continues to draw useful patterns from Etsy, Shopify and Big Cartel without mechanically copying them. Devil n Dove's differentiators remain handmade/vintage separation, maker provenance, local pickup, events, custom work, gift cards, creative-process storytelling and Canada-first commerce.

---

# Permanent UX / Design Contract

## Mobile app / installed PWA

- Mobile-first single-task layouts.
- Large touch targets with no hover-only controls.
- Bottom/sticky primary navigation where it reduces navigation churn.
- Minimal typing when selection, saved context or camera input can be used.
- Camera/photo workflows designed for one-handed operation.
- Safe-area support for notches/browser chrome/installed windows.
- No ordinary horizontal page scrolling.
- Desktop tables transform into cards, drill-down rows or compact summaries rather than merely shrinking.
- Critical actions remain reachable without pinch/zoom.

## Tablet

- Tablet is a first-class surface, not a stretched phone.
- Portrait and landscape may use different navigation density.
- Controls remain touch-sized while using additional screen width productively.
- Multi-column layouts may appear only when they remain readable and keyboard/touch accessible.

## Desktop app / installed PWA

- Persistent navigation where space allows.
- Richer filters/tables/work queues.
- Master/detail or split-pane layouts when useful.
- Keyboard navigation/shortcuts for frequent seller actions.
- Safe bulk operations where appropriate.
- Multi-window-safe state.
- Large screens use space productively instead of simply stretching mobile cards.

## Responsive website

- Ordinary responsive Web remains the canonical compatibility baseline.
- Installation is never required for shopping, account access, order lookup, seller administration or recovery.
- Mobile/desktop installed experiences progressively enhance the same capabilities instead of becoming incompatible products.
- Browser Back/Forward, deep links and refresh preserve meaningful state where practical.

## Capability parity

- A capability may be presented differently by surface but must not silently disappear at another supported viewport.
- Device-specific features are allowed only when genuinely device-dependent, such as direct camera capture.
- Every new feature must have explicit phone/tablet/desktop/web acceptance criteria.

## Public SEO contract

- Exactly one public H1 per page.
- Correct canonical URL and metadata.
- Crawl-safe essential product/service content.
- Structured data where applicable.
- Semantic heading order.
- Useful alt text for meaningful imagery.
- No critical product information hidden exclusively behind optional client enhancement.

## Accessibility contract

- Keyboard-reachable controls and visible focus.
- Screen-reader names/state announcements.
- Semantic menus/dialogs.
- Adequate contrast.
- Reduced-motion support.
- Offline/sync/error states announced in text, not colour alone.

---

# Permanent Connectivity / Failsafe Contract

Every network-dependent surface must support:

1. **Loading** — meaningful loading state, never a blank container.
2. **Usable cached/stale state** — previously verified content may remain visible when safe, with stale/timestamp cues where freshness matters.
3. **Disconnected state** — explain that live verification is unavailable and what remains safe to do.
4. **Genuine error state** — give a recovery action; never masquerade as an empty store, completed order or successful save.

## Read operations

- Product description, care information, maker story, approved imagery and collection metadata may use cached fallback.
- Current price, inventory, gift-card balance, order/payment/refund/fulfillment status remain server-authoritative.
- If authoritative information cannot refresh, show last-known context rather than implying it is live.

## Safe local state

Safe drafts/preferences should survive connection loss and restart where implemented: product copy, listing metadata, photo ordering/captions, message drafts, custom-work notes, filters, non-financial forms, cart state and buyer browsing preferences.

Structured durable state should use IndexedDB or equivalent where data complexity warrants it. Small bounded preferences such as the Build 143 device-local Saved list may use localStorage with an explicit local-only boundary.

## Mutation outbox

Safe ordinary mutations introduced by later builds should use:

- client-generated operation/idempotency ID;
- timestamp;
- target entity + expected version where appropriate;
- visible state (`saved locally`, `waiting to sync`, `syncing`, `conflict`, `completed`, `failed`);
- bounded retry for transient transport failures;
- manual retry;
- foreground/app-relaunch recovery.

Background Sync may enhance this but is never the sole recovery path.

## Idempotency and conflict handling

- Response loss after a successful server commit must resolve server state before resubmission.
- Do not duplicate orders, messages, fulfillment changes, listing publication or inventory adjustments.
- Meaningful seller conflicts stop automatic overwrite and expose the conflicting state rather than silently using last-write-wins.

## High-authority actions

Payments, refunds, destructive deletion, sellable inventory adjustments, final publication, gift-card value changes, fulfillment completion, accounting posting and irreversible provider actions must never silently execute later merely because they were clicked while offline. Prepared forms may persist; authoritative execution requires fresh online validation.

## Service-worker/update safety

- Do not unexpectedly replace an active seller workflow.
- Coordinate cached assets and durable state across versions.
- Preserve drafts before update where applicable.
- App-shell changes must not strand users on incompatible cached API assumptions.
- The Release 450 installable-client identity remains an established compatibility contract unless deliberately migrated in a dedicated release-authority build.

---

# Build 142 — Storefront Continuity & Offline Foundation — CLOSED GREEN

Build 142 established the first bounded continuity layer:

- public Shop shell precached;
- previously loaded Shop snapshot remains useful for browsing when live Product data is unavailable;
- cached price and stock are explicitly last verified;
- cached Add to Cart fails closed until live Product revalidation;
- global online/offline and retry behavior available through the shared PWA continuity layer;
- `/api/`, checkout authority and business mutations remain uncached/server-authoritative;
- Release 450 installable-client identity retained;
- no schema, D1 business-data, R2, binding or provider mutation.

External closure: SHA `0b022c355217c00a7313aa2cb3e4b37a2b9a2b45`, tree `acf47b86db2cd170dc1fadd2a9e827e485e7c908`, System `34765428970`, Quality `34765428976`, I.T. `34765428961`, Hygiene `34765428957`, Production Pages `34765518900`, Live Resources `34765564112`.

---

# Build 143 — Adaptive Mobile/Desktop/Web Application Shell — CURRENT CANDIDATE

## Purpose

Create deliberate application shells for buyer and seller workflows instead of merely shrinking desktop page navigation onto a phone.

## Buyer shell

Core destinations across supported surfaces:

- **Shop** → current Shop route.
- **Search** → current Shop search focused directly.
- **Saved** → device-local browsing list in Build 143; account synchronization is reserved for Build 147.
- **Cart** → current cart route.
- **Account** → current member/account route when live verification is available.

### Buyer behavior

- Narrow phones use a five-destination bottom navigation with touch-sized controls and safe-area padding.
- Tablets use a compact persistent navigation treatment distinct from narrow phone and large desktop.
- Desktop/web/PWA uses persistent navigation without removing existing site navigation.
- The active destination receives an accessible current-page state.
- Connectivity status is visible and announced with `role=status`/`aria-live`.
- Offline Account navigation fails safely on the current page rather than forcing a broken login/session path.
- Search focuses the existing Shop search field rather than creating a second search authority.
- Saved items remain a device-local convenience, not stock reservations or price authority.

## Seller shell

Core destinations:

- **Home** → `/admin/`
- **Orders** → `/admin/orders/`
- **Products** → `/admin/products/`
- **Create** → the existing Product creation form on `/admin/products/#createProductForm`
- **More** → existing Storefront, Creator, Finance, I.T., Reliability, Deployment Preflight, Today Tasks and Mobile Product workspaces.

### Seller behavior

- Phone uses large touch-sized bottom navigation.
- Tablet uses a compact persistent shell.
- Desktop/PWA uses a persistent rail and leaves existing module navigation intact.
- The shell does not create new mutation authority; it only routes to existing protected workspaces.
- More is an accessible dialog-like drawer with Escape/Close behavior.

## Cross-surface state

- Preserve current route naturally through resize/orientation changes; the shell changes presentation instead of rerouting.
- Record safe scroll position for Back/Forward restoration.
- Installed mode and viewport class are exposed as presentation state only.
- Existing draft/autosave authorities remain owned by their existing pages; the shell must never overwrite them.

## Device-local Saved boundary

- Local key is bounded to public product summary information.
- No D1/server write.
- No account-sync claim.
- No inventory reservation.
- Stored price is labelled as last saved context.
- Buyer must reopen the Product to revalidate current price/stock before purchase.
- Build 147 remains responsible for account-level Saved/Favorites reconciliation.

## PWA/cache boundary

- Preserve `devilndove-shell-r450` and `const RELEASE = 450;` installable-client compatibility.
- Safe adaptive CSS/JS and `/saved/` may be precached.
- `/api/`, admin, members/account, login/register and other auth-sensitive authorities stay outside public cache authority.

## Build 143 acceptance viewports

- narrow phone;
- large phone;
- tablet portrait;
- tablet landscape;
- laptop;
- 1080p+ desktop;
- high-DPI display;
- installed mobile PWA window;
- installed desktop PWA window.

Acceptance fails if a core buyer/seller destination becomes unreachable solely because of viewport, if fixed navigation hides critical content, if connectivity state is colour-only, if an offline Account tap causes a broken login loop, or if device-local Saved state is presented as authoritative inventory/account data.

---

# Build 144 — Buyer Discovery, Search & Collection Experience

## Buyer improvements

Make search approachable first and powerful second. Primary search should remain simple, with merchandising chips such as Handmade, Vintage, Under $25, Gift Ideas, Local Pickup, Ready to Ship and New. Advanced filtering can remain behind `More filters`.

Add/improve:

- recently viewed;
- related products;
- collection counts;
- relevance/newest/price sorts;
- useful zero-result alternatives;
- Back restoration of filter/search/scroll state;
- mobile filter sheet/drawer that preserves result context.

## Seller improvements

Provide merchandising controls for featured collections, seasonal groups, visibility/status, ordering and buyer-view preview. Any search-ranking boost must remain explainable and must not hide unavailable/out-of-scope inventory rules.

## Offline behavior

Previously received product search data may provide a bounded cached result subset, explicitly labelled cached/offline. Current stock is never implied while disconnected.

---

# Build 145 — Product Detail Trust, Story & Conversion

Prioritize strong hero photography, touch-friendly gallery/zoom, dimensions/scale, materials, origin/provenance, Handmade/Vintage/Pre-built classification, vintage condition, uniqueness, maker/process story, care, fulfillment expectations, pickup, gift/custom options, related items and a clear CTA.

Seller readiness should identify missing hero imagery, dimensions, materials, provenance, vintage condition, care information, shipping/pickup rules, description completeness, SEO metadata, alt text and product-type requirements. Handmade and vintage readiness rules should differ where appropriate.

Cached product detail may remain viewable when safe; purchase authority becomes `Reconnect to confirm availability` when live stock cannot be verified.

---

# Build 146 — Resilient Cart, Guest Checkout & Payment Recovery

Buyer priorities: persistent cart, first-class guest checkout, minimum necessary fields, clear Delivery vs Pickup choice, order review, field-level validation and clear recovery when a response disappears after payment submission.

Seller diagnostics should aggregate inventory revalidation failures, shipping calculation errors, provider availability, abandonment stage and duplicate-prevention/idempotency events without exposing unnecessary payment detail.

Cart may persist offline, but reconnect must revalidate price, inventory, Canada-first/US-disabled rules, pickup/shipping, tax, discounts and totals. Payment is never queued for offline execution.

Chaos acceptance includes network loss at every checkout stage, refresh after Place Order, double-click/tap, provider timeout, lost success response, stale inventory and changed shipping/pickup rules.

---

# Build 147 — Buyer Account, Saved Items & Order Hub

Create a clear account dashboard for orders, status/timeline, tracking, account-synced Saved/Favorites, recently viewed, profile, addresses and support. Guest buyers should receive a secure order-view path and may later claim/link a purchase without forced pre-checkout registration.

This build is where Build 143's device-local Saved state can be deliberately reconciled with authenticated account state. Cached order status must show last refresh time and never claim to be live while disconnected.

---

# Build 148 — Seller Daily Command Centre

Turn Admin into an operational cockpit answering **What needs attention right now?** Suggested queues include New Orders, Needs Reply, Ready to Make/Prepare, Ready to Pack/Pickup/Ship, Low Stock, Listings Needing Work, Failed Sync, Content Awaiting Approval, Custom Requests and System/Provider Warnings.

Keep first-view metrics simple and actionable: visitors, orders, conversion, authoritative revenue, top products/categories, work-queue counts and sync/system warnings. Last known dashboard may load offline with a timestamp, but current inventory/order actions require live revalidation.

---

# Build 149 — Seller Listing Manager & Fast Product Editing

Target gallery/list views, searchable lifecycle states, quick edit, persistent Preview/Publish, clone listing, safe bulk category/status/tag actions, autosave, mobile photo capture, reorder/crop/rotate where supported, captions/alt text, reusable templates and at-a-glance stats.

Safe edits should progress visibly from `Saved locally` → `Waiting to sync` → `Synced`; conflict handling must stop silent overwrite. Publication always requires live connectivity and fresh validation.

---

# Build 150 — Orders, Fulfillment & Buyer Communication Workspace

Buyer order lifecycle should clearly expose Received → Confirmed → Making/Preparing → Ready for Pickup/Shipped → Complete with tracking/support when applicable.

Seller order workspace should combine buyer/order identity, line items, payment state, fulfillment, pickup/shipping, packaging notes, internal notes, buyer messages, tracking, packing slip and timeline. Search by order ID, buyer, email, product and status. Notes/message drafts may save offline; refunds, fulfillment completion, tracking changes and outbound notifications require live confirmation.

---

# Build 151 — Gifting, Custom Work, Local Pickup & Event Selling

Expand gift intent/message/wrap, recipient/occasion notes, pickup availability, custom-request intake, event availability and digital gift-card redemption.

Seller Custom Work queue should track request status, quote, requested-by date, approval, deposit state, reference images, materials/requirements, gift instructions and pickup/event handoff. Event Mode may support fast catalog lookup/reservation preparation but must never silently oversell one-of-a-kind stock while offline.

---

# Build 152 — Notifications, Activity Inbox & Cross-Device Continuity

Buyer notifications are optional/preferences-controlled for order status, pickup readiness, shipment/tracking and saved-item/restock where supportable.

Seller Activity Inbox should create durable in-app records for new order, buyer message, sync failure, listing issue, low inventory, custom request, content approval and system/provider warnings. Push delivery is an enhancement, never the source of truth.

---

# Build 153 — UX Analytics, Recovery Telemetry & Conversion Improvement

Measure aggregate search→product, product→saved, product→cart, cart→checkout, checkout→order, zero-result searches, recovery from Product/API errors and disconnected-state recovery. Seller metrics should include visitors, product views, saves, add-to-cart, checkout starts, orders, conversion, average order, top products/categories, custom inquiries and reliability incidents that affected users.

Telemetry may queue in bounded batches and may be dropped. Business operations must never wait for analytics ingestion.

---

# Build 154 — Cross-Surface UX Certification & Production Hardening

Certify complete buyer/seller workflows across phone browser, installed mobile PWA, tablet, desktop browser and installed desktop PWA.

Chaos certification includes intermittent latency, offline transitions, D1/R2/API failure, stale service worker, incompatible cache, expired login, upload interruption, replayed request, connection loss after commit, multi-device stale edit conflict, unavailable analytics and external-provider HOLD state.

Permanent UX/System Gate should fail Production for critical horizontal overflow, unreachable navigation, missing offline/error state, inaccessible primary controls, uncaught API errors replacing usable fallbacks, duplicate-mutation hazards, false order/payment state, stale stock presented as live, critical mobile/desktop capability divergence, multiple public H1s or destructive/high-authority offline replay.

---

# Programme sequencing

## Phase 1 — Reliability + buyer conversion foundation

**Builds 142–146:** continuity → adaptive shell → discovery → product trust → cart/checkout recovery.

## Phase 2 — Buyer relationship + seller operations

**Builds 147–151:** account/Saved/orders → seller command centre → listing manager → fulfillment/communication → gifting/custom/pickup/events.

## Phase 3 — Continuity, measurement and hardening

**Builds 152–154:** notifications/activity → UX/recovery telemetry → cross-surface certification.

---

# Competitor / pattern review notes

## Etsy patterns worth adapting

- mobile-first listing creation/editing;
- gallery/list inventory views and quick edits;
- listing stats near workflow;
- persistent preview/publish;
- favorites/collections;
- guest checkout;
- order tracking;
- gifting discovery;
- order context in seller communication.

## Big Cartel patterns worth adapting

- simple seller dashboard focused on orders/visitors/conversion/top products;
- mobile order management/search;
- fulfillment/status controls;
- packing slips;
- straightforward small-business product administration.

Do not copy behavior that could oversell unique stock without explicit acknowledgement/reconciliation.

## Shopify patterns worth adapting

- mobile ecommerce as deliberate interaction design rather than shrunken desktop;
- responsive workspace/editor patterns;
- direct mobile account/order actions;
- strong cart/checkout recovery;
- progressive PWA/update safety.

## Web-platform reliability guidance

- service workers for safe shell/assets;
- IndexedDB/equivalent for structured durable state;
- Background Sync only as enhancement;
- explicit app/data version handling;
- PWA remains a functional website first;
- accessibility/installability are progressive enhancements, never substitutes for web compatibility.

---

# Release-governance rules for Builds 142–154

1. Verify previous exact SHA/tree and six proofs at startup.
2. Next build ingests previous build's later external closure; a candidate never self-records its future proof.
3. Push `dev` non-force.
4. Require exact-head Development GREEN: System Gate, Current Application Quality Proof, I.T. Admin Runtime Proof, Repository Branch Hygiene, canonical Development D1 migrations, exact Preview deployment/bindings/smoke.
5. Only after exact Development GREEN, fast-forward the identical SHA/tree to `main` non-force.
6. Require Production Pages Deploy SUCCESS.
7. Require Production Live Resource Integrity SUCCESS.
8. Only then call `main` / Production GREEN.
9. Following build ingests the closure.
10. No force push unless genuinely unavoidable and explicitly justified.
11. Preserve Build 135 live-resource transport resilience.
12. Preserve historical/current release provenance gates.
13. Preserve canonical migrations exactly `0001`–`0004` until an intentionally approved schema build changes authority.
14. Keep Stripe, PayPal, Social/OAuth, Cloudflare Access and CAIP evidence lanes separate from ordinary feature completion.

---

# Build 143 restart note

At Build 143 startup:

1. Re-verify Build 142 exact SHA/tree:
   - SHA `0b022c355217c00a7313aa2cb3e4b37a2b9a2b45`
   - tree `acf47b86db2cd170dc1fadd2a9e827e485e7c908`
2. Re-verify exact Build 142 proofs:
   - System `34765428970`
   - Quality `34765428976`
   - I.T. `34765428961`
   - Hygiene `34765428957`
   - Production Pages `34765518900`
   - Live Resources `34765564112`
3. Ingest Build 142 external closure into the Build 142 authority with `ingested_by_build: 143`.
4. Advance current Development authority to Build 143 with Build 142 as last fully verified Development and Production baseline.
5. Preserve the permanent Mobile/Tablet/Desktop/Web, accessibility, SEO and connectivity/failsafe contracts above.
6. Implement **Build 143 — Adaptive Mobile/Desktop/Web Application Shell** without creating new business-data authority.
7. Require the standard exact-head four-proof Development cycle before any Production promotion.
