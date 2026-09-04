# Devil n Dove Post-Deploy Smoke Test

Run this against the exact deployed SHA.

## Public

- Home, Shop, Collections, representative service/story pages and at least one real product detail load successfully.
- Each indexable page exposes one H1, a useful title/description and the expected canonical URL.
- `/search/` remains usable but is `noindex,follow`.
- The empty `/shop/product/` shell is not an index target; a slugged product resolves product-specific metadata.
- `robots.txt` advertises the canonical sitemap and the sitemap contains only intended public index destinations.
- No broken primary navigation, images or required calls to action.

## Responsive

Check at phone, tablet, 1024px desktop/app and wide desktop widths:

- no page-level horizontal overflow
- navigation and grids wrap
- images/media stay inside containers
- forms remain usable
- wide tables scroll inside their own region
- touch controls remain practical

## Authenticated admin

- login/session verification works without exposing credentials
- Online Help Centre opens and contains current operating guidance
- I.T., Storefront, Creator/Socials and Finance workspaces load
- application sanity and release/deploy controls return structured, truthful status
- no historical release/build page is presented as a current operational tool

## Production evidence

Confirm exact SHA, environment bindings, canonical D1 convergence, public smoke result and rollback/recovery evidence. A failed or incomplete proof keeps Production on HOLD.
