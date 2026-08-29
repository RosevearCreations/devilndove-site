# Release 455 — Storefront Discovery, Media Fallback & SEO Depth

Updated: 2026-08-29

## Boundary

Release 455 is a **source-only Development release** on `dev` / `devilndove-site-dev.pages.dev`.

- Development Pages project: `devilndove-site-dev`
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Release 455 D1 migration: **NONE**
- D1 remains independently verified through **Release 453**
- Release 453 guarded mutation: `33258377328`
- Release 453 independent verifier: `33258415391`
- Provider execution/publication: **CLOSED**
- Separate live Production mutation/promotion: **CLOSED**

The Development copy was synchronized from the locked live site. Treat it as current with live unless verification later proves drift. The `devilndove-site-dev` Pages Production deployment is the Development application; it is not the separate public Production site.

## What Release 455 changes

A shared Storefront discovery runtime now covers:

- `/shop/`
- `/shop/product/`
- `/collections/`
- `/collages/`

The Pages middleware injects a single Release 455 runtime and stylesheet on those routes. No new catalog, image, inventory, pricing or checkout authority is created.

### Media resilience

- Broken public images fail over to a local neutral Storefront SVG placeholder.
- Missing alt text is derived from nearby product/collection context when the image is not decorative.
- Below-fold images default to lazy loading and asynchronous decoding.
- Hero/main Product media remains priority media.
- Shop/Collection/Collage/Product media is constrained responsively.
- Mobile thumbnail strips can scroll horizontally instead of pushing the page off-screen.
- Storefront image controls use a minimum 44px interaction target.
- Reduced-motion preferences disable Storefront collage zoom/scroll animation behavior.

### Accessibility

- Shop and Product loading/status surfaces receive polite live-region semantics.
- Error surfaces receive alert/assertive semantics.
- Product and Shop thumbnail buttons expose `aria-pressed`.
- Existing static media placeholders receive an image role and useful accessible label.
- A runtime fail-safe demotes any dynamically introduced duplicate H1 after the first one; the source SEO gates still require exactly one H1 in source.

### SEO protection

- Shop, Product, Collections and Collages remain index/follow with one source H1, canonical, description and JSON-LD.
- Product pages normalize accidental `pages.dev` canonical fallback URLs to `https://devilndove.com/shop/product/?slug=...`.
- Product Open Graph/Twitter title, description, URL, image and image-alt signals remain synchronized as dynamic Product data loads.
- Existing `public_seo_gate.py` and `public_seo_depth_gate.py` remain mandatory.
- Release 455 adds its own focused Storefront gate and carries Release 454 and Release 453 authority forward.

## Data decision

No durable-data requirement was discovered. Release 455 does **not** create a migration file and must not alter D1 merely to match the release number.

## Acceptance required before moving on

1. Release 455 focused Source Gate green on the exact `dev` head.
2. Canonical System Gate green on the same exact `dev` head.
3. Cloudflare Pages Development deployment green for that head.
4. Public Development smoke review of Shop, one Product, Collections and Collages on desktop/mobile widths.
5. Separate live Production remains untouched.

After source/deployment proof, the next active block is Inventory + Tools workflow depth.
