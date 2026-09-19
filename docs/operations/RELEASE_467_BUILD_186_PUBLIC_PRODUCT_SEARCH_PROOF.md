# Release 467 — Build 186 Public Product & Search Proof

## Goal

Build 186 closes the six-build catalog rework by proving the cleaned Product authorities reach buyers correctly through Product detail, Shop, Collections and internal Search without adding another catalog authority or another automatic Product read.

## Public surfaces

- `/shop/` remains the indexable Product discovery surface with one source H1 and CollectionPage structured data.
- `/collections/` remains the indexable collection/discovery surface with one source H1 and CollectionPage / ItemList structured data.
- `/search/` remains an internal discovery utility with one source H1 and `noindex,follow`.
- `/shop/product/?slug=...` remains the indexable one-Product detail route backed by the bounded Product-detail core authority.

## Corrections

### Product canonical stability

The lean Product renderer no longer falls back to `location.href` for the canonical URL. Relative Product canonicals and Product slugs resolve against `https://devilndove.com`. Preview or unrelated hosts are not promoted into public canonical truth.

### Product social metadata

The already-loaded Product snapshot now updates Open Graph and Twitter title, description, URL and Product image metadata together with the page title, meta description and canonical. No second Product request is introduced.

### Product structured-data startup

The Storefront evidence / Product JSON-LD helper may be loaded lazily after the lean Product renderer. Build 186 therefore boots from `DDProductDetailSnapshot` when the original `dd:product-detail-rendered` event has already fired. Product JSON-LD no longer depends on winning that event race.

### Product image delivery

The first real Product image is marked eager / high priority with asynchronous decoding. Gallery images remain lazy. The image source still comes from the Product snapshot and approved Product-media path; Build 186 adds no R2 listing or image mutation.

## Search and collection proof

Build 186 retains:

- searchable Product discovery through the existing public Product source;
- Product result links to the canonical Product-detail route;
- crawlable Shop and Collections pages;
- one-H1 source contracts;
- valid viewport/mobile foundations;
- internal Search as `noindex,follow` so query-result pages are not treated as canonical landing pages.

The Production proof is deliberately D1-free. It validates deployed public HTML and JavaScript assets only. Existing retained Product route/browser acceptance remains responsible for the Product API/runtime path so this build does not add another catalog query during release proof.

## Acceptance

Build 186 is GREEN only when:

1. the Build 186 source contract is GREEN;
2. retained Builds 181–185 and current Product runtime contracts remain GREEN;
3. exact-SHA Development System Gate, Current Application Quality, I.T. Admin Runtime and Repository Branch Hygiene are GREEN;
4. that Development source is promoted non-force through protected `main`;
5. Production deployment serves the Build 186 Product runtime and SEO assets;
6. live Production Shop, Collections, Search and Product-detail shell checks pass;
7. no new D1 read is performed by the Build 186 live public proof.

## Safety boundary

Build 186 performs:

- no schema migration;
- no D1 business-data mutation;
- no additional Product API read in the Product detail renderer;
- no R2 list/upload/copy/delete;
- no automatic Product/image/catalog mutation;
- no provider/publication execution;
- no payment/refund action;
- no accounting posting;
- no Production business-data copy.

Production mutation in the Build 186 proof is zero.
