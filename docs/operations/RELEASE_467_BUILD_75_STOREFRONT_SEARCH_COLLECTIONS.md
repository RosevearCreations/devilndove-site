# Release 467 Build 75 — Storefront Search & Collections

Build 75 starts from the exact fully-green Build 74 Production/Development checkpoint:

- Source SHA: `87628f0599a1af0bea331a69dfb5056bb166ebfd`
- Source tree: `99e45d9a34ceed5b2a5ef40d40fcc1c5ed67d912`
- Canonical D1 migrations: `0001`–`0004`
- Build 74 Development System Gate: GREEN
- Build 74 Production Pages Deploy: GREEN
- Build 74 Production Live Resource Integrity Proof: GREEN

## Purpose

Make the Shop easier to browse when a buyer does not already know the exact Product name. Build 75 improves category and colour discovery, availability filtering, sorting, zero-result recovery, collection entry points and derived merchandising signals while preserving the current Product and Collection authorities.

Build 75 does **not** create a second Product API, duplicate Product database, automatic merchandising engine, payment path or provider action. The existing `/api/products` response remains the live Product source and `/api/storefront-merchandising` remains the published Collection/Collage source.

## Build 75 contract

1. **The existing Product endpoint remains authoritative.** Shop continues to fetch `/api/products`; Build 75 performs no second Product request.
2. **The existing Collection/Collage service remains authoritative.** `/api/storefront-merchandising` is not duplicated or bypassed.
3. **Category discovery is explicit.** A buyer can filter the current Product result set by exact Product category.
4. **Colour discovery remains connected to the existing Product filter groups.** Build 75 does not invent a parallel colour taxonomy.
5. **Price filtering remains server-owned.** Existing minimum/maximum price filters continue to travel through `/api/products` rather than a hidden second query.
6. **Availability filtering is fail-closed.** Positive tracked inventory and digital Products can be shown as available; zero tracked inventory is out of stock; untracked physical inventory remains “Check availability.”
7. **Digital Products do not pretend physical stock is required.** They can remain discoverable as available without fabricating an inventory quantity.
8. **Sort choices are presentation-only.** Featured, price, newest and name sorting reorder the already-loaded Product set and never mutate Product `sort_order`.
9. **Featured order preserves the current merchandising authority.** The default sort follows the Product payload's existing curated order.
10. **Zero-result assistance is explicit and bounded.** Buyers receive up to four clear filter-relaxation choices plus a Collections path.
11. **Zero-result recovery does not silently broaden a query.** A buyer must choose the relaxation action.
12. **Search supports keyboard submission.** Pressing Enter in the Shop search box triggers the same explicit Search action.
13. **Active filters remain visible.** Search, category, colour, availability, origin, price and non-default sort choices are summarized near the results.
14. **Category and colour collection pills become actionable discovery controls.** They reuse the current Product filter values rather than creating new Product copies.
15. **Derived merchandising highlights remain advisory.** Available-now, category count, under-$50 and handmade counts are calculated from the already-loaded Product payload.
16. **Merchandising intelligence performs no automatic Product ranking mutation.** It never writes Product order, category, price or availability.
17. **The Build 75 buyer layer performs no network request itself.** It consumes the payload dispatched by `public/js/shop.js`.
18. **The Shop runtime exposes a bounded presentation bridge.** Build 75 can re-present already-loaded Products without another fetch.
19. **Local category/availability/sort query parameters survive server-filter refreshes.** Deep links remain stable while `/api/products` filters reload.
20. **Reset clears both server and local discovery filters.** Material, process, locality, social/proof, category, availability and sort state do not remain accidentally stuck.
21. **No timer or polling loop is introduced.** Build 75 contains no interval, repeating timeout or background refresh.
22. **No D1 schema change is required.** Canonical migrations remain `0001`–`0004`.
23. **No Production business-data rewrite is introduced.** Build 75 is source/UI behavior only.
24. **No R2 object is copied, moved or deleted.** Product photography remains owned by the existing media authority.
25. **No cart/order/payment action is automated.** Existing buyer-controlled Add to Cart behavior remains unchanged.
26. **No Stripe, PayPal, social provider or publication action is introduced.** Provider execution stays closed.
27. **The Shop remains one-H1 compliant.** Build 75 adds no new H1.
28. **Mobile discovery controls remain usable.** Derived highlight cards collapse from four columns to two and then one on narrow screens.
29. **The Build 75 pure contract is regression-testable.** Availability, filtering/sorting, merchandising summary and zero-result relaxation helpers run under Node without a browser.
30. **Production promotion remains exact-green only.** System Gate, Current Application Quality Proof, I.T. Admin Runtime Proof and Repository Branch Hygiene must all pass on the exact Development SHA before `main` may fast-forward.

## Buyer discovery sequence

The Shop now supports a clearer discovery path:

1. Search or start from a quick collection direction.
2. Narrow by Product type, category, origin, colour, material/process/locality, price or availability.
3. Sort the already-loaded result set by featured order, price, newest or name.
4. Review active filters and derived discovery highlights.
5. If no Product matches, deliberately relax one filter or move to Collections.
6. Continue to the existing Product detail and buyer-controlled cart path.

## D1 / performance boundary

Build 75 deliberately avoids another Product fetch. Existing Shop filters that already belong to `/api/products` continue to use that one request. Category, availability and sort are applied to the returned Product payload in the browser so the new discovery layer does not add another Product D1 read.

This preserves the Build 63 read-budget direction: no blank-search helper scan, no count-heavy second request, no polling and no hidden recovery request.

## Collection authority boundary

Build 75 does not turn category/colour filters into a new collection database. Published Collections and Collages remain owned by `/api/storefront-merchandising`. Shop category and colour controls are discovery facets over the current Product payload only.

## Availability boundary

Build 75 uses conservative buyer-facing states:

- digital Product: available without a physical-stock claim;
- tracked physical Product with quantity above zero: available;
- tracked physical Product with zero quantity: out of stock;
- untracked physical Product: check availability.

The browser layer does not reserve stock, create an order or promise checkout success.

## Acceptance

The Build 75 source gate and Node runtime acceptance prove:

- exact Build 75 identity;
- category filtering;
- fail-closed availability states;
- deterministic sorting;
- derived merchandising summary;
- bounded zero-result relaxation;
- no extra Product request in the Build 75 layer;
- no timer/polling/provider/D1 mutation behavior;
- one-H1 Shop template;
- canonical migrations remain `0001`–`0004`;
- Build 75 is chained into the current System Gate.

## Next planned build

**Release 467 Build 76 — SEO Technical Convergence**: crawl public routes and enforce one H1, canonical URLs, sitemap/index rules, structured data, metadata, Open Graph and internal-link coverage.
