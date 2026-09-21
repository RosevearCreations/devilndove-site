# Release 467 Build 215 — Small-Batch, Corporate & Event Quoting

## Goal

Extend the existing Custom Work quote draft/revision/line-item authority for one-off through small-batch, corporate and event work without creating another quote, payment or order engine.

## Exact starting boundary

Build 214 **Prototype → Sample → Production Run** is fully Production GREEN.

- Development SHA: `45a6bbb5ea01fa8b79ea9df331d87086ca5c7657`
- Production main: `6e3e8f04578998e16e1e8b8d27daad28b2332603`
- Shared tree: `6792f4ed926e3c52b197dfe8f3cc68e074b92d62`
- Development proofs: `35544979662` / `35544979675` / `35544979731` / `35544979736`
- Build 214 Development proof: `35544979792`
- Production Pages / Live Resources: `35545124565` / `35545169766`
- Product Browser / Route: `35545169753` / `35545169742`
- Build 214 Production proof: `35545124482`
- Exact Production URL: `https://e817e044.devilndove-site.pages.dev`

## Existing quote authorities retained

- `custom_request_quote_drafts` remains the quote draft authority.
- `custom_request_quote_line_items` remains the customer-visible price-line authority.
- `custom_request_quote_revisions` remains audit/revision history.
- `custom_request_quote_share_links` remains private customer quote-link authority.
- existing payment-request drafts, payment gates and order drafts remain their current authorities.
- accepting a private quote still does not charge the customer.

Build 215 adds no second quote engine.

## Canonical schema addition

Migration `0015_release467_small_batch_corporate_event_quoting.sql` adds:

1. `custom_request_quote_batch_terms` — one structured batch/corporate/event assumption record per existing quote draft.
2. `custom_request_quote_quantity_tiers` — ordered quantity/unit assumptions, with at most one selected tier.

The migration creates no quote/business rows.

## Structured quote assumptions

Build 215 captures:

- requested quantity;
- quoted quantity;
- single-unit / tiered / mixed / manual unit assumption mode;
- setup charge;
- prototype/sample charge;
- quantity tiers and selected tier;
- personalization scope and notes;
- packaging choice and per-unit packaging charge;
- lead-time assumption or min/max days;
- pickup / shipping / event / corporate handoff;
- corporate/event context;
- quote expiry;
- explicit production-cost evidence state: `unknown`, `partial`, or `reviewed`.

Unknown production cost is **not** represented as zero.

## Existing quote line integration

Build 215 owns only these reserved line types in the existing line-item table:

- `build215_batch_units`;
- `build215_setup`;
- `build215_prototype_sample`;
- `build215_packaging`.

Only the selected quantity tier becomes the active batch-unit price line. Other quantity tiers remain assumptions for review and revision history.

Every terms/tier save appends a snapshot to `custom_request_quote_revisions`.

## Private customer quote

The existing `/custom-request/quote/` page now displays the Build 215 assumptions directly.

It shows:

- quoted/requested quantity;
- selected tier;
- setup/sample amounts;
- personalization;
- packaging;
- lead time;
- handoff;
- quote expiry;
- production-cost evidence state.

The Build 215 expiry is the effective quote expiry even when an older share-link default exists.

Accepted payment-request/order draft snapshots carry the exact Build 215 terms and tiers, but no real order or payment is executed by Build 215.

## Admin surface

`/admin/custom-request/` contains the Build 215 workspace.

The operator can:

- choose an existing Custom Request;
- create the **existing** quote draft if one does not yet exist;
- save structured assumptions;
- add/edit/delete quantity tiers;
- select one tier for the active quote;
- review customer-visible assumptions;
- see blockers/warnings.

## Safety boundary

Build 215 does **not**:

- create a parallel quote/revision/payment/order engine;
- execute Stripe/PayPal or any provider;
- create a real order;
- reserve/consume Inventory;
- publish media or Products;
- rewrite unknown production cost to zero;
- perform request-time DDL.

## Acceptance

1. Quantity, setup, prototype/sample, tiers, personalization, packaging, lead time, handoff and expiry are structured and customer-visible.
2. Selected tier/setup/sample/packaging charges synchronize into the existing quote line items.
3. All changes remain auditable through the existing quote revision table.
4. Unknown production cost remains visibly unknown/partial/reviewed.
5. Accepted draft handoff preserves exact Build 215 assumptions without executing payment/order creation.
6. Migration 0015 is additive/canonical and creates no business rows.

## Next

Release 467 Build 216 — **Customer-Supplied Item Intake & Suitability Review** — remains blocked until Build 215 is exact-SHA Production GREEN.
