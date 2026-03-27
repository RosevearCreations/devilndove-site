# Development Roadmap

## Current completed foundations

- auth and session model
- member orders/downloads
- admin users/security tools
- checkout and order creation
- PayPal handoff
- PayPal return capture
- PayPal webhook reconciliation foundation
- analytics and visitor monitoring foundation
- product SEO tools
- product media workflow foundation
- site inventory/reorder foundation

## Strongest next steps after this pass

1. Stripe payment completion pass
2. webhook retry / replay / dispatch hardening
3. direct media upload workflow to R2
4. deeper inventory operations for products, tools, and supplies
5. product import seeding refinement and validation UX
6. richer analytics dashboards and funnel reporting

## Media-specific roadmap

- direct upload endpoint
- image delete/reorder UI polish
- thumbnail/variant handling
- tighter annotation-to-storefront usage

## Payment-specific roadmap

- webhook replay safety
- idempotency improvements
- provider retry logging
- refund/dispute workflows


## Current pass completion update

- Replaced the placeholder movie enrichment file in the site package with the uploaded R2-backed movie catalog JSON so the public page and API are reading real `front_image_url` and `back_image_url` values.
- Hardened `/api/movies` so partial rows can still derive cover URLs and trailer-search links instead of failing into blank cards.
- Added a dedicated admin product stock and build-readiness report to surface finished-product stock levels plus linked low-stock tools/supplies.
- Extended admin tools/supplies inventory operations with filtered views and direct sync buttons for catalog-backed tools or supplies.
- Continued the D1-backed relationship model between finished products and the tools/supplies used to create them so future social/story outputs can explain how a piece was made.
- Provider-confirmed refund/dispute sync, worker-driven webhook retry/replay, and invoice/refund receipt delivery remain next-phase work after this pass.


## Current pass completion update

- Fixed the movie-page regression by replacing the sample movie enrichment file with the uploaded R2-backed JSON and wiring the page back to `/api/movies`.
- Hardened the admin and storefront JSON endpoints that were failing into HTML error pages so empty or partially migrated datasets now return safe JSON responses instead of breaking the dashboard.
- Continued the staged JSON → D1 migration path with more defensive catalog-sync behavior so missing or incomplete JSON collections no longer abort the whole sync run.
- Strengthened the inventory operations foundation so product stock, linked tools/supplies, reorder pressure, and build readiness can still be reviewed while the catalog data keeps being migrated.
- Movie metadata enrichment beyond UPC/cover data is still a next-phase data task because the uploaded movie JSON currently contains cover URLs but blank title/cast/director/runtime fields.


## Current pass update

- Tools reorder UX now matches supplies more closely on the public side.
- Admin reorder workflow now treats tools and supplies together with copy/clear controls.
- Movie API and page now understand extra metadata fields including estimated value, rarity notes, metadata source, metadata status, and IMDb IDs.
- Full 1100+ movie metadata enrichment remains a dedicated data-ingestion task and is not safely auto-complete from the public web in one pass without a trusted bulk source.
