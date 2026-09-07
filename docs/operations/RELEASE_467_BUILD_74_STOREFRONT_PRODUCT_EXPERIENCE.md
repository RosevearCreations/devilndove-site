# Release 467 Build 74 — Storefront Product Experience

Build 74 starts from the exact fully-green Build 73 Production/Development checkpoint:

- Source SHA: `98a4f37ece3e75b29f331bcf1198cb926bc29b69`
- Source tree: `caa6ad626182982cc431d18cc974ee6a9b00698d`
- Canonical D1 migrations: `0001`–`0004`
- Build 73 Development System Gate: GREEN
- Build 73 Production Pages Deploy: GREEN
- Build 73 Production Live Resource Integrity Proof: GREEN

## Purpose

Make each public Product detail page easier for a buyer to understand and evaluate without increasing Product-detail database reads, adding a second Product authority, inventing availability promises, or introducing a new checkout/provider path.

Build 74 is a presentation and browser-performance layer over the Product detail response already loaded by `/api/product-detail`. It improves photography behavior, description readability, buyer-facing attributes, availability language, shipping context, trust information, related-product presentation, accessibility and responsive layout.

## Build 74 contract

1. **The existing Product detail API remains the data authority.** Build 74 does not add a second Product-detail API request or a parallel catalog lookup.
2. **No extra browser network request is introduced.** The enhancement reads the Product content already rendered into the page.
3. **Buyer essentials are promoted near the top of the listing.** Availability, delivery/shipping context, photography count, related-piece count and selected quick facts become scannable before the long supporting sections.
4. **Availability remains fail-closed.** Explicit sold-out/unavailable/zero-quantity language becomes out-of-stock; unknown inventory becomes “Check availability” rather than a fabricated in-stock claim.
5. **Digital items do not pretend physical stock or shipping is required.** The buyer summary labels digital delivery separately.
6. **Shipping language remains descriptive, not provider-promissory.** Build 74 says shipping rules and destination eligibility are confirmed at checkout; it does not guess a carrier, rate or destination.
7. **Build 77 remains the future Canada-only commerce-rule convergence.** Build 74 does not create a second geographic commerce authority.
8. **Main Product photography receives buyer-priority loading.** The selected main image is eager, async-decoded, high fetch priority and receives responsive `sizes` guidance.
9. **Thumbnail photography remains lazy.** Gallery thumbnails are async-decoded, low priority, sized for the visible thumbnail rail and do not compete with the main Product image.
10. **The gallery becomes responsive without a new media system.** Build 73 remains Product Media / Photo Studio authority; Build 74 only improves storefront display of approved Product images.
11. **No image is copied, moved, generated or deleted.** R2 ownership and media lifecycle boundaries remain unchanged.
12. **Description readability is improved.** Long Product descriptions receive a constrained readable line length, comfortable line height and overflow-safe wrapping.
13. **Quick facts remain the Product attribute source.** Build 74 promotes at most six already-rendered quick facts; it does not invent missing dimensions, materials, finishes or care claims.
14. **Trust evidence remains sourced from the existing Product detail.** At most four already-rendered trust points are promoted into the buyer summary.
15. **Related products remain proof-overlap recommendations.** The existing `productRelatedProofCard` is relabeled as a simpler buyer-facing “You may also like” section without adding another related-product query.
16. **Related products remain bounded by the existing Product-detail response.** Build 74 performs no whole-catalog browser scan.
17. **The purchase path is easier to reach.** The buyer summary provides an in-page jump to the existing Product purchase card.
18. **The purchase path is not automated.** Build 74 never adds an item automatically, never creates an order and never contacts Stripe, PayPal or another provider.
19. **The Product page remains one-H1 compliant.** Build 74 adds no new H1 element.
20. **Mobile layout is explicitly protected.** Buyer essentials collapse to one column, the Product two-column shell collapses cleanly, related products become one column and thumbnails remain horizontally scrollable.
21. **Desktop layout remains compact.** Buyer essentials use two columns and related products retain a three-column grid where space permits.
22. **The enhancement is bounded and one-shot.** A MutationObserver is attached only to the Product detail container while the async Product render is pending and disconnects immediately after the page is enhanced.
23. **No timer or polling loop is introduced.** There is no `setInterval`, repeating timeout or background refresh behavior.
24. **No analytics or readiness dependency blocks Product usability.** The buyer experience layer works entirely from already-rendered Product content.
25. **The browser layer exports a pure runtime contract.** `DDStorefrontProductExperience` exposes availability, shipping and buyer-summary helpers for deterministic regression testing.
26. **Unknown inventory remains honest.** The pure authority has an explicit `check` state for incomplete availability evidence.
27. **Buyer-summary lists are intentionally capped.** Attributes are capped at six and trust points at four so a dense listing does not recreate the old information wall at the top.
28. **No new D1 migration is required.** Canonical migrations remain `0001`–`0004`.
29. **No Production business-data rewrite is introduced.** Build 74 changes source/UI behavior only.
30. **Production promotion remains exact-green only.** System Gate, Current Application Quality Proof, I.T. Admin Runtime Proof and Repository Branch Hygiene must all pass on the exact Development SHA before `main` may fast-forward.

## Buyer-first page sequence

The Product page keeps all of its existing supporting evidence, but Build 74 makes the first decision-making sequence clearer:

1. Product name, price and short description;
2. buyer essentials — availability, shipping/delivery context, photography and related-piece context;
3. core Product details and readable description;
4. quick facts, media, story and proof modules;
5. purchase, wishlist/back-in-stock and reviews;
6. safety, trust, policy and related-product evidence.

This sequence improves scannability without removing the richer Devil n Dove maker-story content that differentiates the storefront.

## Responsive-performance boundary

Build 74 deliberately avoids a new API call. The Product-detail request remains the only Product-detail data request owned by this page. The browser enhancement waits for the existing async Product renderer, then performs one bounded DOM pass and disconnects its observer.

Image loading is prioritized by buyer value:

- selected main Product image: eager + high priority + responsive sizes;
- gallery thumbnails: lazy + low priority + thumbnail sizes;
- existing process/support visual modules remain lazy.

## Safety / commerce boundary

Build 74 performs no D1 mutation, runtime DDL, R2 mutation, cart mutation by itself, order creation, payment call, publication action or provider contact. The existing explicit Add to Cart button remains the buyer-controlled commerce action.

## Acceptance

The Build 74 gate and Node runtime acceptance prove:

- stable Build 74 buyer-first authority identity;
- positive inventory → available;
- zero/sold-out inventory → out-of-stock;
- unknown inventory → check availability;
- digital delivery avoids physical shipping claims;
- buyer-essential attribute/trust caps;
- main-image and thumbnail priority attributes;
- responsive Product/related-product layout rules;
- bounded one-shot observer disconnect;
- no browser fetch/XHR/timer/provider behavior;
- one-H1 Product template remains intact;
- no new D1 migration or Product/R2/provider mutation.

## Next build

After Build 74 is exact-green, continue with **Release 467 Build 75 — Storefront Search & Collections**.
