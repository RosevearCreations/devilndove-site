# Release 467 Build 434 — Public Search & Workshop Catalog Boundaries

## Outcome and intent

Search may surface **published Products**, published/featured **Creations**, and **links to website pages**. It must **not** turn Tools, Supplies, Toolshed inventory or Movie Shelf records into searchable merchant products. The Tools, Supplies, Toolshed and Movie Shelf **pages themselves remain discoverable** and clearly indicate their reference/collection purpose.

## Pre-build finding

Two historical search clients were checked:

- `search/index.html` loads `/public/js/site-search.js`, which already queried only Product and Creations APIs plus static page links.
- An older unused `/site-search.js` still queried `/api/tools`, `/api/supplies` and `/api/movies` as individual public search results, risking divergent behaviour if it were loaded later.

Build 434 reconciles those scripts instead of silently removing the workshop and movie navigation.

## Implemented changes

1. `public/js/search-boundary-434.js` implements the explicit allowlist: Product, Creation and Page only. Products require an actual positive `product_id`, a safe slug and a public active/published or approved record. Explicit inventory-only tool/supply source flags and draft review states are rejected. Canonical result URLs are constrained to shop product details, Creations, or known public pages; no user-supplied external URL can become a search-result action.
2. `public/js/site-search.js` checks every Product before mapping, checks all mapped result types/URLs again before rendering, and never calls Tool/Supply/Movie APIs. Tools, Supplies, Toolshed, and Movie Shelf are **Page** results with clear reference-not-for-checkout labeling and truthful link text.
3. Root `site-search.js` is reconciled to the same code as `public/js/site-search.js` so an old import cannot silently re-enable inventory search.
4. `search/index.html` loads the boundary policy first, cache-busts the search script, explicitly links Movie Shelf and keeps public Tool/Supply reference links available.
5. No changes to the item listing APIs were required: public Tool and Supply API records are still controlled by their `catalog_items` publication registry, and `/api/products` remains the authority for Products. A product in the operational inventory table **does not become a Product** just because an inventory entry exists.
6. No purchase CTA, Add to Cart, checkout route or inventory-price claim was added to Tools, Supplies or Toolshed. Their existing local reorder and legitimate external reference links are not converted into in-site orders.

## Executable acceptance

- `node --test scripts/release467_build434_regression.mjs` proves hostile/incorrect Product records are filtered, public result URLs remain allowlisted, and Movie Shelf navigation is preserved.
- Regression executes the actual public browser script inside an isolated Node VM with mocked API responses: an approved ring is listed; an injected inventory Tool and unpublished Supply are not; searching for movie reaches `/movies/` without generating an in-site checkout result.
- The test asserts the root legacy search script equals the active script, that both omit raw Tools/Supplies/Movie API queries, and that the reference catalog pages do not contain internal Add to Cart or checkout actions.
- It is run in **Current Application Quality Proof** and in `.github/workflows/release467-build434-public-search.yml`, with no network, billing, provider calls or D1 writes.

## Production acceptance

A source commit on `dev` or `main` does **not** certify Cloudflare Production. Require four exact-dev-SHA Development proofs and Preview, protected `Production Pages Deploy`, a matching `https://devilndove.com/release-version.json` main SHA and public smoke before declaring Production GREEN.

Live acceptance routes: `/search/?q=ring`, `/search/?q=tools`, `/search/?q=movies`, `/tools/`, `/supplies/`, `/toolshed/`, `/movies/`. Check search result types and actions in the browser; verify product purchase controls only on legitimate Product pages.

No changes to Product data, inventory, prices, checkout, media, U.S. shipping suspension or Etsy connections/publication.

**Next planned:** Build 435 — Brand V3 Theme Tokens & Accessibility. The Etsy one-product trial remains deferred separately by owner choice.
