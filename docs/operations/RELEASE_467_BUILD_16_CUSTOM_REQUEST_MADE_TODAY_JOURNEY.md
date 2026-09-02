# Release 467 Build 16 — Custom Request & Made Today Journey

## Purpose

Build 16 closes autonomous backlog items **11–15** without introducing another schema layer. It consolidates the customer-facing custom-request lifecycle, removes internal production notes from the private customer status payload, surfaces only evidence-backed candle/soap facts and consent-cleared proof, and adds a phone-first **Made Today** capture handoff that always lands in review.

## Proven predecessor

- Release 467 Build 15 merged Development SHA: `cb6a69ebf544a8eb74efeec409aeeb7ad1852a33`
- Build 15 tree: `2e9befcb349bbbb5b4dfd06f56b3d4b7bfdf9d60`
- Build 15 proof: `33654846823` — SUCCESS
- canonical System Gate: `33654847043` — SUCCESS
- Production Build 15 `main`: `296e53b079bba53126c80902be36a9271d82cea4`
- Production Pages Deploy: `33655223149` — SUCCESS

Build 16 starts from the exact green Build 15 Development tree. Production remains unchanged during Build 16 Development work.

## Backlog item 11 — one visible custom-request journey

The public Custom Request page and private order-status surface now share the same conceptual lifecycle:

`Request → Review & proof → Quote → Making → Pickup / shipping → Complete`

The customer-facing order stages remain the more detailed operational subset:

`Planning → Making → Curing / finishing → Ready → Pickup / shipping → Complete`

The journey is presentation logic only. It does not create orders, advance workflow stages, charge payments, or publish content automatically.

## Backlog item 12 — customer-safe private order status

`functions/api/custom-request-order.js` now deliberately omits raw `orders.notes`, raw `custom_request_order_stage_events.stage_notes`, and `custom_request_order_status_links.stage_notes` from the customer token response.

Customer-safe messages are derived from the reviewed stage in `functions/api/_lib/customRequestJourney.js`. The private page may show reviewed stage labels, approved/customer-private stage photos, attached candle/soap facts, payment/order facts, and the reviewed Canada pickup/shipping state. Internal production notes remain server-side.

## Backlog item 13 — real candle and soap examples only

`/api/custom-request-examples` is a read-only public authority. It uses existing public Product rows plus existing `custom_candle_soap_product_specs` facts and returns an example only when:

- the Product meets the storefront public visibility filter;
- the Product resolves to candle or soap;
- a real public product image exists; and
- at least one real scent/base/colour/batch/ingredient/safety/cure fact exists.

If those facts are missing, the page shows no example rather than generating a marketing claim. `invented_claims=false` is part of the response contract.

## Backlog item 14 — consent-cleared public proof

The Custom Request page reuses `/api/trust-blocks?context=custom_work`. That existing public authority only returns records that are approved/published, explicitly approved for public use, and privacy-cleared. No private request, internal note, unmoderated stage photo, or pending proof candidate is promoted by Build 16.

## Backlog item 15 — Made Today phone capture

New route: `/admin/custom-request/made-today/`

The phone-first capture workflow lets an authenticated admin:

- select an existing Custom Request;
- capture one or more finished-work photos directly from a phone camera;
- record process notes;
- record batch/material facts;
- record a story candidate for later review; and
- add a short factual result caption.

It reuses `/api/admin/custom-order-stage-photos`. Captures are forced through the existing review path with:

- `public_use_status=customer_private`
- `moderation_status=needs_review`
- `automatic_publication=false`

It does **not** call `advance_order_stage`, does not create social posts, does not create marketplace listings, and does not publish to Content Studio automatically.

## Runtime-schema correction within Build 16 scope

The touched stage-photo endpoint previously contained request-time `CREATE TABLE` / `ALTER TABLE` compatibility logic. Build 16 removes that DDL from this route and replaces it with read-only schema readiness. Missing migration-owned schema now fails closed with `custom_order_stage_photos_schema_unavailable` rather than repairing schema during a request.

This is not a new schema migration. The canonical migration set remains exactly `0001` through `0004`.

## Safety boundaries

- Schema change: **NONE**
- New D1 mutation authority: **NONE**
- New R2 bucket/binding authority: **NONE**; existing authenticated stage-photo upload authority is reused
- Request-time DDL on touched stage-photo route: **REMOVED**
- Provider execution/publication: **CLOSED**
- Automatic content publication: **CLOSED**
- Cloudflare Access mutation: **NONE**
- `main` / Production mutation: **NONE during Build 16 Development**
- U.S. sales/shipping suspension: **PRESERVED**
- Shipping country: **Canada only**
- External lanes: **HOLD_EXTERNAL**

## Acceptance

Build 16 is not complete merely because these files exist. Closure requires the Build 16 proof on an immutable feature SHA, full PR fanout green, merge to `dev`, Build 16 push proof on the exact merged SHA, and the canonical System Gate including exact Development deployment, D1/data/binding/smoke evidence.
