# Devil n Dove — Project Status & Roadmap

## Current checkpoint

**Release 467 Build 141 — Closure Evidence Cross-Artifact Consistency Verification** has completed its external six-proof closure and is fully GREEN on the exact promoted source checkpoint:

- SHA `72e270e4c27bd666afcb4d5befc3462dd757a1d1`
- tree `d4a6bfe0327d8de641d3ea1910dcd8c6bc67e14b`
- System `34763039974`
- Quality `34763039975`
- I.T. `34763040049`
- Hygiene `34763039996`
- Production Pages `34763165246`
- Live Resources `34763209880`

`dev` and `main` were externally verified identical at that checkpoint with zero ahead/behind divergence.

Build 142 must ingest Build 141's later external closure before starting its feature slice. Build 141 intentionally did not self-record future proof. This planning document may describe the externally completed closure, but the canonical Build 142 authority must perform the formal ingestion step.

Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.

Canonical D1 migrations remain exactly `0001`–`0004`. The Build 135 transient-transport retry policy remains mandatory and must not be weakened.

---

# Buyer + Seller User-Experience Programme — Builds 142–154

## Programme objective

The next major Devil n Dove development cycle should move from release-evidence infrastructure into visible, measurable user-experience improvement for both sides of the business:

1. **Buyer experience:** discovery, trust, product understanding, saving/favoriting, cart continuity, guest checkout, order visibility, gifting, pickup, custom work and recovery when connectivity is poor.
2. **Seller experience:** fast daily triage, product creation/editing, mobile photography, order handling, custom-work management, fulfillment, buyer communication, merchandising, analytics and clear sync/recovery status.
3. **Cross-device design:** every important capability must work deliberately on mobile app/PWA, desktop app/PWA and ordinary responsive web. The UI may adapt by surface, but the business capability must not disappear simply because a user is on a different device class.
4. **Reliability:** network loss, API failure, D1/R2 interruption, stale service worker, response loss after a successful server action, interrupted upload and expired login must produce recoverable states rather than lost work or misleading success/failure messages.
5. **SEO and accessibility:** the current public constraints continue. One public H1 per page, semantic heading order, crawl-safe core content, useful metadata, alt text, keyboard access, visible focus, screen-reader status, contrast and reduced-motion support remain release requirements.

This programme is based on current patterns used by comparable commerce systems such as Etsy, Shopify and Big Cartel, while retaining Devil n Dove's own strengths: handmade/vintage separation, maker provenance, local pickup, events, custom work, gift cards, creative-process storytelling and Canada-first commerce.

---

# Permanent UX / Design Contract

The following constraints should become permanent development and release-gate rules beginning with Build 142.

## Mobile app / installed PWA

- Mobile-first single-task layouts.
- Large touch targets and controls that do not depend on hover.
- Bottom or sticky primary actions where this materially reduces scrolling.
- Minimal typing where selections, saved profiles or camera input can be used instead.
- Camera/photo capture and upload flows designed for one-handed use.
- Safe-area support for notches, browser chrome and installed-PWA windows.
- No horizontal page scrolling for ordinary business workflows.
- Desktop-sized tables must transform into cards, drill-down rows or compact summaries rather than simply shrinking.
- Critical actions must remain reachable without pinching/zooming.

## Desktop app / installed PWA

- Persistent navigation where space allows.
- Richer tables, filters and sortable work queues.
- Master/detail and split-pane layouts where they reduce navigation churn.
- Keyboard navigation and shortcuts for frequent seller actions.
- Bulk operations where safe and useful.
- Multi-window-safe state; opening another product/order must not corrupt the first workspace.
- Large-screen layouts should use space productively rather than merely stretching mobile cards.

## Responsive website

- The ordinary website remains the canonical compatibility baseline.
- Installation must never be required for shopping, account access, order lookup, seller administration or recovery.
- Mobile/desktop installed experiences progressively enhance the same capabilities rather than creating separate incompatible products.
- Browser Back/Forward, deep links and refresh must preserve meaningful state where practical.

## Capability parity

- A business capability may be presented differently by surface, but must not silently disappear at another supported viewport.
- Device-specific capabilities are allowed only when genuinely device-dependent, such as direct camera capture.
- Every new feature must have explicit mobile, tablet, desktop and responsive-web acceptance criteria.

## Public SEO contract

- Exactly one public H1 per page.
- Correct canonical URL and metadata.
- Crawl-safe essential product/service content.
- Structured data where applicable.
- Semantic heading order.
- Useful alt text for meaningful imagery.
- No critical product information hidden exclusively behind client-side interactions that fail without JavaScript or API enhancement.

## Accessibility contract

- Keyboard-reachable controls.
- Visible focus state.
- Screen-reader names and state announcements.
- Semantic dialogs and menus.
- Adequate contrast.
- Reduced-motion support.
- Offline/sync/error messages announced accessibly rather than only by colour.

---

# Permanent Connectivity / Failsafe Contract

Every network-dependent surface must explicitly support four conditions:

1. **Loading** — a meaningful loading state rather than a blank container.
2. **Usable cached/stale state** — previously verified content may remain visible when safe, with a timestamp or stale indicator where freshness matters.
3. **Disconnected state** — the application clearly explains that live verification is unavailable and what the user can still do.
4. **Genuine error state** — failures provide a recovery action and do not masquerade as an empty store, empty gallery, completed order or successful save.

## Read operations

Use a risk-based policy:

- Product description, care instructions, maker story, approved imagery and collection metadata may use cached fallback.
- Current price, inventory, gift-card balance, order status, payment state, refunds and fulfillment state remain server-authoritative.
- When authoritative information cannot be refreshed, show the last verified value and timestamp rather than implying it is current.

## Safe local drafts

The following should survive connection loss and browser/app restart:

- product title/description drafts;
- listing metadata drafts;
- photo ordering/caption work;
- customer-message drafts;
- custom-work notes;
- filters and unfinished non-financial forms;
- cart contents and safe buyer preferences.

Structured offline state should use IndexedDB or equivalent durable browser storage rather than fragile page memory.

## Mutation outbox

Safe ordinary mutations should use an outbox pattern:

- client-generated operation ID / idempotency key;
- timestamp;
- target entity and expected version where applicable;
- visible state: `saved locally`, `waiting to sync`, `syncing`, `conflict`, `completed` or `failed`;
- bounded automatic retry for transient transport failures;
- manual retry path;
- next-app-launch/foreground recovery path.

Background Sync may enhance recovery on supported browsers, but it must **not** be the only recovery path because support is incomplete across browsers.

## Idempotency

Reconnect processing must never duplicate authoritative actions. A response lost after a successful server commit must resolve the server's actual state before resubmission.

Examples:

- one order, not two;
- one message, not duplicates;
- one fulfillment transition, not repeated status changes;
- one listing publish event;
- one inventory adjustment where that action is permitted.

## Conflict handling

Silent last-write-wins should not be the default for meaningful seller data.

If a local/offline edit conflicts with a newer server version:

- stop automatic overwrite;
- show the conflicting fields;
- let the seller choose/merge where practical;
- record which version was ultimately accepted.

## High-authority actions

The following must not silently execute later merely because they were clicked while offline:

- payments;
- refunds;
- destructive deletion;
- inventory adjustments that can affect sellable quantity;
- final listing publication;
- gift-card activation/value mutation;
- fulfillment completion;
- accounting posting;
- irreversible provider actions.

The application may preserve the prepared form locally, but the authoritative action must be revalidated online before execution.

## Service-worker/update safety

- Do not unexpectedly replace an active seller workflow during an app update.
- Coordinate cached assets and durable app data across versions.
- Detect stale clients and provide a safe refresh/update path.
- Preserve unsaved drafts before applying an update.
- App-shell version changes must never strand the user on incompatible cached API assumptions.

---

# Build 142 — Storefront Continuity & Offline Foundation

## Purpose

Build the common connectivity/recovery layer before adding more UX features. Current public experiences must not interpret an unavailable API as “the business has no products” or expose raw failure states where a buyer expects a functioning shop/gallery.

## Buyer experience

- Shop, collections, gallery, homepage and recently viewed product information remain meaningfully usable through temporary API/D1/R2 interruption.
- Replace ambiguous empty states with explicit status such as:
  - `Live inventory is temporarily unavailable.`
  - `Showing recently verified products.`
  - `Reconnect to confirm availability before checkout.`
- Cache a safe subset of approved product cards, collection information and imagery.
- Preserve navigation, care information, About content, policies and other safe static content offline.
- Never represent cached inventory as current inventory.

## Seller experience

- Admin application shell remains usable during a connection outage.
- Recently opened products/drafts and safe read-only context remain accessible where available.
- Add a visible global connectivity/sync indicator.
- Provide a `Sync & Connectivity` diagnostic surface showing queued/failed operations without exposing secrets.

## Reliability mechanics

- Common connectivity service.
- IndexedDB structured state.
- Service-worker app-shell/cache strategy.
- Safe stale-data timestamps.
- Mutation outbox framework.
- Retry orchestration using foreground reconnect/manual retry/app relaunch, with Background Sync only as an optional enhancement.
- Idempotency key support for later mutation workflows.

## Acceptance

Simulate:

- API unavailable;
- Development/Production D1 temporarily unavailable;
- R2 image failure;
- total network loss;
- network loss during a safe save;
- browser close/reopen before synchronization;
- reconnect after a response was lost.

No blank shop/gallery, no false empty-store conclusion, no duplicate mutation and no lost safe draft.

Build 142 must first ingest Build 141's exact external six-proof closure before this feature scope begins.

---

# Build 143 — Adaptive Mobile/Desktop/Web Application Shell

## Purpose

Create deliberate application shells for buyer and seller workflows instead of merely shrinking desktop pages onto a phone.

## Buyer shell

Mobile/installed PWA:

- Shop
- Search
- Saved
- Cart
- Account

Desktop/web may use richer header/sidebar navigation while retaining the same core destinations.

## Seller shell

Suggested mobile destinations:

- Home
- Orders
- Products
- Create
- More

Desktop should use persistent module navigation, search/command access and denser workspace patterns.

## Requirements

- Preserve active route, scroll position and draft state through resize/orientation change where practical.
- Tablet gets its own responsive behaviour rather than being treated as a stretched phone.
- Global connectivity state is available on every shell.
- Offline must not redirect the user into a broken login loop simply because session verification temporarily cannot reach the server.

## Acceptance viewports

- narrow phone;
- large phone;
- tablet portrait;
- tablet landscape;
- laptop;
- 1080p and larger desktop;
- high-DPI display;
- installed-PWA/mobile app window;
- installed-PWA/desktop app window.

No core business capability may be unreachable solely because of viewport.

---

# Build 144 — Buyer Discovery, Search & Collection Experience

## Buyer improvements

Make search approachable first and powerful second.

Primary search should be simple, with useful merchandising chips such as:

- Handmade
- Vintage
- Under $25
- Gift Ideas
- Local Pickup
- Ready to Ship
- New

Advanced filtering can remain behind `More filters`.

Add/improve:

- recently viewed items;
- related products;
- collection counts where helpful;
- sort by relevance/newest/price;
- useful zero-result alternatives;
- state restoration when the user opens a product and returns to results;
- mobile filter drawer/sheet that preserves context.

## Seller improvements

Provide seller merchandising controls for:

- featured collections;
- seasonal groups;
- visibility/status;
- search merchandising boosts where appropriate;
- collection ordering;
- buyer-view preview before publishing.

## Offline behaviour

- Maintain a bounded locally cached search subset from previously received products.
- Cached search is explicitly labelled as cached/offline.
- Current stock is never implied while disconnected.

## Acceptance

- typo/basic normalization behaviour;
- useful zero-results state;
- Back restores filter/search/scroll position;
- no oversized mobile filter UI that destroys context.

---

# Build 145 — Product Detail Trust, Story & Conversion

## Buyer improvements

Product detail pages should answer the buyer's likely questions without requiring them to hunt through tabs or contact the seller first.

Prioritize:

- strong hero photography;
- swipe/thumbnails/zoom;
- dimensions and scale;
- materials;
- origin/provenance;
- Handmade / Vintage / Pre-built classification;
- vintage condition details;
- uniqueness / one-of-a-kind status;
- current quantity when safe to show;
- maker/process story;
- care instructions;
- dispatch/fulfillment expectations;
- pickup eligibility;
- gift/custom options;
- related items;
- clear primary CTA.

For unique inventory, make `Only one available` or equivalent prominent when current inventory has been freshly verified.

## Seller improvements

Add a listing-readiness checklist/score showing missing or weak evidence such as:

- hero image;
- dimensions;
- materials;
- origin/provenance;
- condition note for vintage;
- care information;
- shipping/pickup settings;
- description completeness;
- SEO title/meta;
- image alt text;
- required product-type fields.

Handmade and vintage readiness rules should differ where appropriate.

Provide buyer-view preview for phone and desktop before publish.

## Offline behaviour

Cached product detail remains viewable when safe. Purchase/availability CTA changes to `Reconnect to confirm availability` rather than allowing stale inventory to be sold.

## Acceptance

- one H1;
- product-type-specific completeness gate;
- essential product content remains available without optional client enhancement;
- mobile image interaction remains touch-friendly;
- no stale-stock checkout path.

---

# Build 146 — Resilient Cart, Guest Checkout & Payment Recovery

## Buyer improvements

- Persistent cart between sessions/devices where account state allows.
- Guest checkout prominent and first-class.
- Minimum necessary checkout fields.
- Clear Delivery vs Local Pickup decision.
- Order review before payment.
- Useful validation errors located beside the problem field.
- Recovery from a provider timeout without losing the prepared order.
- Clear answer to `Did my order go through?` when the connection disappears after payment submission.

## Seller improvements

Aggregate checkout diagnostics without exposing unnecessary payment detail:

- inventory revalidation failures;
- shipping calculation errors;
- provider unavailable;
- checkout abandonment stage;
- duplicate-prevention/idempotency resolution events.

## Offline behaviour

The cart can persist and may permit safe local add/remove changes using cached products, but reconnect must revalidate:

- price;
- current inventory;
- Canada-first/US-disabled rules;
- pickup/shipping availability;
- tax;
- discount validity;
- order totals.

Payment itself is never queued for offline execution.

## Acceptance / chaos cases

- network killed at each checkout stage;
- browser refresh immediately after Place Order;
- double-click/tap payment;
- provider timeout;
- response lost after server success;
- cart contains item that sold elsewhere while offline;
- shipping/pickup rule changed while cart was stale.

All paths must converge to one authoritative order/payment result.

---

# Build 147 — Buyer Account, Saved Items & Order Hub

## Buyer improvements

Create a clear account dashboard for:

- orders;
- order status/timeline;
- tracking;
- saved/favorite items;
- wishlist/collections;
- recently viewed;
- profile;
- addresses;
- support/order contact.

Guest buyers should receive a secure order-view path and may later claim/link the purchase to an account rather than being forced to register before checkout.

## Seller improvements

Within the seller order/message workspace, show useful buyer context such as repeat-buyer status and relevant order history without exposing unnecessary personal data.

## Offline behaviour

- Saved items can operate locally and reconcile later.
- Cached order status is labelled with its last successful refresh time.
- Cached order information must not be described as live/current when disconnected.

## Mobile requirement

Use a clear single-column account experience with direct order actions and minimal nested navigation.

---

# Build 148 — Seller Daily Command Centre

## Purpose

Turn Admin from a collection of destinations into an operational cockpit that answers: **What needs attention right now?**

## Suggested queues

- New Orders
- Needs Reply
- Ready to Make / Prepare
- Ready to Pack
- Ready for Pickup
- Ready to Ship
- Low Stock
- Listings Needing Work
- Failed Sync
- Content Awaiting Approval
- Custom Requests
- System/Provider Warnings

## Dashboard metrics

Keep the first view simple and actionable:

- visitors;
- orders;
- conversion;
- net revenue where authoritative;
- top products;
- top categories;
- current work queue counts;
- sync/system warnings.

## Offline behaviour

Last known dashboard may load with a timestamp. Seller can open safe cached work, but workflows requiring current inventory/order authority are visibly restricted until reconnection/revalidation.

## Acceptance

On both phone and desktop, the seller should be able to identify the highest-priority work in approximately five seconds without opening several modules.

---

# Build 149 — Seller Listing Manager & Fast Product Editing

## Seller improvements

Adopt the strongest modern seller patterns:

- gallery and list views;
- searchable draft/active/sold-out/archive states;
- quick edit for common fields;
- persistent Preview and Publish controls;
- clone listing;
- bulk safe changes for category/status/tags;
- draft autosave;
- mobile photo capture/upload;
- photo reorder;
- crop/rotate where supported;
- captions/alt text;
- origin templates;
- condition templates;
- reusable care blocks;
- listing stats at a glance.

## Offline behaviour

Every safe edit should save locally first:

`Saved locally` → `Waiting to sync` → `Synced`

Where safe, multiple local changes to one unpublished draft can compact into the final desired state rather than replaying unnecessary intermediate edits.

If the server version changed, show conflict resolution rather than silently overwriting.

Publication always requires live connectivity and fresh validation.

## Acceptance

Pull network during:

- text editing;
- image upload;
- image reordering;
- preview;
- publish initiation.

Close and reopen the browser/app. Reopen the product on another device. No safe draft text should disappear, and no incomplete listing should silently publish.

---

# Build 150 — Orders, Fulfillment & Buyer Communication Workspace

## Buyer improvements

Expose a clear order lifecycle, for example:

`Received → Confirmed → Making / Preparing → Ready for Pickup / Shipped → Complete`

Show tracking and order-specific support/contact where applicable.

## Seller workspace

One order screen should combine:

- buyer/order identity;
- line items;
- payment state;
- fulfillment state;
- pickup/shipping information;
- packaging notes;
- internal notes;
- buyer messages;
- tracking;
- printable packing slip;
- event timeline.

Search should work by useful identifiers such as:

- order ID;
- buyer name;
- email;
- product;
- status.

## Offline behaviour

- internal notes and message drafts may save offline;
- tracking changes, refunds, fulfillment completion and outbound customer notification require server confirmation;
- if the response is lost, the client resolves the current authoritative state before presenting Retry.

## Mobile requirement

The common fulfillment workflow must be usable one-handed without forcing the seller through a desktop table.

---

# Build 151 — Gifting, Custom Work, Local Pickup & Event Selling

## Buyer improvements

Expand Devil n Dove's natural differentiators:

- gift intent;
- gift message;
- optional gift wrap where applicable;
- recipient/occasion notes;
- budget/occasion discovery;
- pickup availability;
- custom-request intake;
- event availability;
- digital gift-card redemption.

## Seller improvements

Create a Custom Work queue with:

- request status;
- quoted amount;
- requested-by date;
- approvals;
- deposit state;
- reference images;
- materials/requirements;
- gift instructions;
- pickup/event handoff tasks.

Provide an Event Mode optimized for fast catalog lookup and reservation/sale preparation.

## Offline/event behaviour

- custom-request text/photos may draft offline;
- quotes, inventory reservations, gift-card activation and payment require live confirmation;
- one-of-a-kind stock must not be silently oversold because an event device was offline;
- if an offline reservation mode is ever introduced, it must be an explicit seller workflow with clear conflict/reconciliation rules rather than pretending the sale is final.

## Acceptance

Test weak market/event connectivity plus a one-of-a-kind item simultaneously visible online and on the seller event device.

---

# Build 152 — Notifications, Activity Inbox & Cross-Device Continuity

## Buyer notifications

Optional, preference-controlled notifications for:

- order confirmation/status;
- ready for pickup;
- shipment/tracking;
- saved-item/restock where supportable.

Avoid making marketing notifications a requirement for useful account operation.

## Seller Activity Inbox

Unified durable activity records for:

- new order;
- buyer message;
- sync failure;
- listing issue;
- low inventory;
- custom request;
- content approval;
- system/provider warning.

## Reliability rule

Push notification delivery is an enhancement, not the source of truth. A missed push must never cause a missed order or task because the in-app activity record is server-authoritative and is fetched on next foreground refresh.

Background/periodic browser APIs must not be assumed to exist everywhere.

---

# Build 153 — UX Analytics, Recovery Telemetry & Conversion Improvement

## Buyer journey measurements

Measure useful aggregate behaviour such as:

- search → product;
- product → saved;
- product → cart;
- cart → checkout;
- checkout → order;
- zero-result searches;
- product/API error recovery;
- disconnected-state recovery;
- page-performance failures that materially affect the shopping experience.

Do not make core commerce depend on analytics delivery.

## Seller business metrics

Provide understandable metrics such as:

- visitors;
- product views;
- saves;
- add-to-cart;
- checkout starts;
- orders;
- conversion;
- average order value;
- top products/categories;
- custom inquiries;
- funnel drop-off;
- sync/reliability incidents that affected users.

## Offline behaviour

Telemetry may queue locally in bounded batches and may be dropped when necessary. Business operations must never wait for analytics ingestion.

A disabled or failing analytics endpoint must not create 503 loops or degrade buyer/seller workflows.

---

# Build 154 — Cross-Surface UX Certification & Production Hardening

## Purpose

Turn the programme's design and reliability requirements into permanent automated/manual release gates.

## Cross-surface certification

Certify complete workflows across:

- phone browser;
- installed mobile PWA/app surface;
- tablet;
- desktop browser;
- installed desktop PWA/app surface.

## Failure/chaos certification

Test:

- intermittent latency;
- offline/online transitions;
- D1 unavailable;
- R2 image unavailable;
- API 500/503;
- stale service worker;
- incompatible cached app shell;
- expired login;
- image upload interruption;
- duplicate/replayed request;
- connection loss after a successful server commit;
- multi-device stale edit conflict;
- unavailable analytics/telemetry;
- provider HOLD/unavailable state.

## Permanent UX/System Gate

Production promotion should fail closed for critical regressions such as:

- horizontal overflow in supported primary layouts;
- broken or unreachable navigation;
- missing offline/error state on a critical network surface;
- inaccessible primary controls;
- uncaught API errors that replace usable fallback content;
- duplicate-mutation hazard;
- false payment/order state;
- stale stock presented as verified/current;
- critical mobile/desktop capability divergence;
- more than one public H1;
- destructive/high-authority action queued for silent offline replay.

---

# Programme sequencing

## Phase 1 — Reliability + buyer conversion foundation

**Builds 142–146**

1. Storefront/offline continuity.
2. Adaptive app shell.
3. Search/discovery.
4. Product-detail trust/conversion.
5. Cart/checkout/payment recovery.

This phase should make the public store materially more dependable before adding more decorative homepage/SEO surface area.

## Phase 2 — Buyer relationship + seller operations

**Builds 147–151**

1. Buyer account/saved items/order hub.
2. Seller command centre.
3. Listing manager.
4. Orders/fulfillment/communications.
5. Gifting/custom work/pickup/events.

This phase improves the daily operating model and makes Devil n Dove's distinctive business model easier to use.

## Phase 3 — Continuity, measurement and hardening

**Builds 152–154**

1. Notifications/activity inbox.
2. UX analytics + recovery telemetry.
3. Cross-surface certification and permanent gates.

---

# What should not be prioritized ahead of this programme

Until Builds 142–146 are substantially complete, avoid using major build slots primarily for:

- additional decorative homepage sections;
- large new SEO landing-page families that do not solve a known conversion/discovery gap;
- separate native mobile and desktop codebases;
- push-notification-only workflows;
- optimistic offline execution of financial/destructive actions;
- analytics that can block business workflows.

The preferred architecture remains one responsive application/PWA codebase with deliberate mobile, desktop and web layouts and progressive enhancement.

---

# Competitor / pattern review notes

The roadmap should continue to periodically compare Devil n Dove against comparable seller/buyer experiences, especially:

## Etsy patterns worth adapting

- mobile-first listing creation/editing;
- gallery/list seller inventory views;
- quick editing;
- listing statistics near the listing workflow;
- persistent preview/publish actions;
- favorites and collections;
- guest checkout;
- order tracking;
- gifting-oriented discovery;
- order context integrated into seller communication.

Do not copy Etsy mechanically. Use the patterns where they reduce friction for a small artisan operation.

## Big Cartel patterns worth adapting

- simple seller dashboard prioritizing orders/visitors/conversion/top products;
- mobile order management;
- order search;
- fulfillment/status controls;
- packing slips;
- straightforward product administration;
- compact small-business operational model.

Do not copy any behaviour that would permit accidental overselling of one-of-a-kind stock without explicit seller acknowledgement and reconciliation.

## Shopify patterns worth adapting

- mobile ecommerce treated as a distinct interaction design rather than a shrunken desktop page;
- responsive editor/workspace patterns;
- clearer mobile customer-account order actions;
- strong recovery around cart/checkout;
- progressive-web-app/update guidance.

## Web platform reliability guidance to retain

- service workers for app-shell/cached resources;
- IndexedDB for structured durable local state;
- Background Sync only as an enhancement, not the sole recovery mechanism;
- explicit app-version/data-version handling;
- responsive/PWA experience remains a functional website first;
- accessibility and installability are progressive enhancements rather than substitutes for web compatibility.

---

# Release-governance rules for Builds 142–154

The established Release 467 governance remains unchanged unless a later deliberately approved release-authority build changes it:

1. Verify the previous build's exact SHA/tree and six proofs at startup.
2. Ingest the previous build's later external closure. The candidate does not self-record its own future closure.
3. Push `dev` non-force.
4. Require exact-head Development GREEN:
   - System Gate;
   - Current Application Quality Proof;
   - I.T. Admin Runtime Proof;
   - Repository Branch Hygiene;
   - canonical Development D1 migrations;
   - exact Preview deployment/bindings/smoke where required by System Gate.
5. Only after exact Development GREEN, fast-forward the identical SHA/tree to `main` non-force.
6. Require Production Pages Deploy SUCCESS.
7. Require Production Live Resource Integrity SUCCESS.
8. Only then call `main` / Production GREEN.
9. The following build ingests that later closure.
10. No force push unless genuinely unavoidable and explicitly justified.
11. Preserve the Build 135 live-resource transport-resilience policy.
12. Preserve the historical/current release provenance gates.
13. Preserve canonical migrations exactly `0001`–`0004` until an intentionally approved schema build changes the migration authority.
14. Keep Stripe, PayPal, Social/OAuth, Cloudflare Access and CAIP evidence lanes clearly separated from ordinary application feature completion.

---

# Build 142 restart note

At Build 142 startup:

1. Re-verify Build 141 exact SHA/tree:
   - SHA `72e270e4c27bd666afcb4d5befc3462dd757a1d1`
   - tree `d4a6bfe0327d8de641d3ea1910dcd8c6bc67e14b`
2. Re-verify exact Build 141 proofs:
   - System `34763039974`
   - Quality `34763039975`
   - I.T. `34763040049`
   - Hygiene `34763039996`
   - Production Pages `34763165246`
   - Live Resources `34763209880`
3. Ingest Build 141 external closure into the Build 141 authority.
4. Advance current Development authority to Build 142 with Build 141 as the last fully verified Development and Production baseline.
5. Merge/retain this buyer + seller UX roadmap into the canonical active roadmap.
6. Begin **Build 142 — Storefront Continuity & Offline Foundation** only after the closure ingestion and authority synchronization are coherent.
